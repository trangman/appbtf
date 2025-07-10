import { createEmbedding } from './knowledge-base'
import { prisma } from './prisma'
import { supabaseDb } from './supabase'

// Determine if we should use Supabase API (for production/serverless environments)
const useSupabaseApi = process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_SUPABASE_URL

// Lazy import pdf-parse to avoid module loading issues
let pdfParse: any = null

async function getPdfParse() {
  if (!pdfParse) {
    try {
      console.log('Loading pdf-parse library...')
      pdfParse = (await import('pdf-parse')).default
      console.log('pdf-parse library loaded successfully')
    } catch (error) {
      console.error('Error loading pdf-parse:', error)
      throw new Error(`PDF parsing library is not available: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
  return pdfParse
}

// Simple text extraction as fallback for serverless environments
function extractTextFromPDFBuffer(buffer: Buffer): string {
  try {
    // Convert buffer to string and extract readable text
    const text = buffer.toString('utf8', 0, Math.min(buffer.length, 50000))
    
    // Basic text cleaning - remove control characters but keep readable text
    const cleanText = text
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control chars except newlines/tabs
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
    
    if (cleanText.length < 50) {
      throw new Error('Unable to extract meaningful text from PDF')
    }
    
    return cleanText
  } catch (error) {
    console.error('Fallback text extraction failed:', error)
    throw new Error('Failed to extract text from PDF using fallback method')
  }
}

export interface PDFProcessingResult {
  title: string
  content: string
  chunks: string[]
  wordCount: number
  pageCount: number
}

export interface ProcessedDocument {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
  documentType: 'PDF' | 'TEXT' | 'MANUAL'
  fileName?: string
  fileSize?: number
  filePath?: string
  embedding: number[]
  userId?: string
  similarity?: number
}

/**
 * Extract text content from PDF buffer with fallback for serverless environments
 */
export async function extractPDFText(buffer: Buffer): Promise<PDFProcessingResult> {
  console.log(`Starting PDF text extraction, buffer size: ${buffer.length} bytes`)
  
  try {
    // Try using pdf-parse first
    console.log('Attempting to use pdf-parse library...')
    const pdfParseLib = await getPdfParse()
    console.log('pdf-parse loaded, processing PDF...')
    
    const pdfData = await pdfParseLib(buffer)
    console.log(`PDF processed successfully: ${pdfData.numpages} pages, ${pdfData.text?.length || 0} characters`)
    
    const content = pdfData.text || ''
    if (content.length < 50) {
      throw new Error('PDF text extraction returned insufficient content')
    }
    
    const title = extractTitleFromPDFText(content)
    const chunks = chunkText(content, 1000)
    
    return {
      title,
      content,
      chunks,
      wordCount: content.split(/\s+/).length,
      pageCount: pdfData.numpages || 1
    }
  } catch (pdfParseError) {
    console.error('pdf-parse failed, trying fallback method:', pdfParseError)
    
    try {
      // Fallback for serverless environments
      console.log('Using fallback text extraction method...')
      const content = extractTextFromPDFBuffer(buffer)
      console.log(`Fallback extraction successful: ${content.length} characters`)
      
      const title = extractTitleFromPDFText(content)
      const chunks = chunkText(content, 1000)
      
      return {
        title,
        content,
        chunks,
        wordCount: content.split(/\s+/).length,
        pageCount: 1 // Unknown page count with fallback method
      }
    } catch (fallbackError) {
      console.error('Both PDF processing methods failed:', {
        pdfParseError: pdfParseError instanceof Error ? pdfParseError.message : pdfParseError,
        fallbackError: fallbackError instanceof Error ? fallbackError.message : fallbackError
      })
      throw new Error(`Failed to extract text from PDF. pdf-parse error: ${pdfParseError instanceof Error ? pdfParseError.message : 'Unknown'}`)
    }
  }
}

/**
 * Extract title from PDF text content
 */
export function extractTitleFromPDFText(text: string): string {
  // Try to extract title from the first few lines
  const lines = text.split('\n').filter(line => line.trim().length > 0)
  
  if (lines.length === 0) {
    return 'Untitled Document'
  }
  
  // Use the first non-empty line as title, with some cleanup
  let title = lines[0].trim()
  
  // If first line is very short, try to combine with second line
  if (title.length < 10 && lines.length > 1) {
    title = `${title} ${lines[1].trim()}`
  }
  
  // Clean up title
  title = title.replace(/[^\w\s-]/g, '').trim()
  
  // Limit title length
  if (title.length > 100) {
    title = title.substring(0, 100) + '...'
  }
  
  return title || 'Untitled Document'
}

/**
 * Split text into chunks for better processing
 */
export function chunkText(text: string, maxChunkSize: number = 1000): string[] {
  const chunks: string[] = []
  const paragraphs = text.split('\n\n').filter(p => p.trim().length > 0)
  
  let currentChunk = ''
  
  for (const paragraph of paragraphs) {
    if (currentChunk.length + paragraph.length > maxChunkSize) {
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim())
      }
      currentChunk = paragraph
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph
    }
  }
  
  // Add the last chunk
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim())
  }
  
  return chunks
}

/**
 * Process and store PDF document in database
 */
export async function processPDFDocument(
  buffer: Buffer,
  fileName: string,
  userId?: string,
  category: string = 'legal-document',
  tags: string[] = []
): Promise<ProcessedDocument[]> {
  try {
    console.log(`Processing PDF document: ${fileName}, size: ${buffer.length} bytes, userId: ${userId}`)
    
    const pdfResult = await extractPDFText(buffer)
    console.log(`PDF text extracted successfully: ${pdfResult.chunks.length} chunks, ${pdfResult.wordCount} words`)
    
    const processedDocs: ProcessedDocument[] = []
    
    // Create separate documents for each chunk to improve search relevance
    for (let i = 0; i < pdfResult.chunks.length; i++) {
      const chunk = pdfResult.chunks[i]
      const chunkTitle = pdfResult.chunks.length > 1 
        ? `${pdfResult.title} - Part ${i + 1}`
        : pdfResult.title
      
      console.log(`Processing chunk ${i + 1}/${pdfResult.chunks.length}: ${chunk.length} characters`)
      
      // Create embedding for this chunk
      console.log('Creating embedding for chunk...')
      const embedding = await createEmbedding(chunk)
      console.log(`Embedding created: ${embedding.length} dimensions`)
      
      // Store in database
      let storedDoc
      if (useSupabaseApi) {
        // Use Supabase API for production/serverless environments
        console.log('Using Supabase API for knowledge document creation')
        storedDoc = await supabaseDb.createKnowledgeDocument({
          title: chunkTitle,
          content: chunk,
          category,
          tags,
          documentType: 'PDF',
          fileName,
          fileSize: buffer.length,
          embedding,
          userId
        })
        console.log(`Document stored in Supabase with ID: ${storedDoc.id}`)
      } else {
        // Use Prisma for local development
        console.log('Using Prisma for knowledge document creation')
        storedDoc = await prisma.knowledgeDocument.create({
          data: {
            title: chunkTitle,
            content: chunk,
            category,
            tags,
            documentType: 'PDF',
            fileName,
            fileSize: buffer.length,
            embedding,
            userId
          }
        })
        console.log(`Document stored in Prisma with ID: ${storedDoc.id}`)
      }
      
      processedDocs.push({
        id: storedDoc.id,
        title: chunkTitle,
        content: chunk,
        category,
        tags,
        documentType: 'PDF',
        fileName,
        fileSize: buffer.length,
        embedding,
        userId
      })
    }
    
    console.log(`Successfully processed PDF: ${processedDocs.length} documents created`)
    return processedDocs
  } catch (error) {
    console.error('Error processing PDF document:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      fileName,
      bufferSize: buffer.length,
      userId
    })
    throw new Error(`Failed to process PDF document: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Search knowledge documents by similarity
 */
export async function searchKnowledgeDocuments(
  query: string,
  limit: number = 5,
  category?: string
): Promise<ProcessedDocument[]> {
  try {
    // Create embedding for search query
    const queryEmbedding = await createEmbedding(query)
    
    // Build where clause
    const whereClause: { category?: string } = {}
    if (category) {
      whereClause.category = category
    }
    
    // Get all documents (we'll do similarity search in memory for now)
    const documents = await prisma.knowledgeDocument.findMany({
      where: whereClause,
      take: 100 // Limit initial fetch
    })
    
    // Calculate similarities and sort
    const documentsWithSimilarity = documents.map(doc => ({
      ...doc,
      similarity: calculateCosineSimilarity(queryEmbedding, doc.embedding)
    }))
    
    // Sort by similarity and return top results
    return documentsWithSimilarity
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
      .map(doc => ({
        id: doc.id,
        title: doc.title,
        content: doc.content,
        category: doc.category,
        tags: doc.tags,
        documentType: doc.documentType as 'PDF' | 'TEXT' | 'MANUAL',
        fileName: doc.fileName || undefined,
        fileSize: doc.fileSize || undefined,
        filePath: doc.filePath || undefined,
        embedding: doc.embedding,
        userId: doc.userId || undefined
      }))
  } catch (error) {
    console.error('Error searching knowledge documents:', error)
    return []
  }
}

/**
 * Calculate cosine similarity between two vectors
 */
function calculateCosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    return 0
  }
  
  let dotProduct = 0
  let normA = 0
  let normB = 0
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  
  const norm = Math.sqrt(normA) * Math.sqrt(normB)
  return norm === 0 ? 0 : dotProduct / norm
}

/**
 * Get all knowledge documents with optional filtering
 */
export async function getKnowledgeDocuments(
  category?: string,
  documentType?: 'PDF' | 'TEXT' | 'MANUAL',
  userId?: string
): Promise<ProcessedDocument[]> {
  try {
    const whereClause: { 
      category?: string
      documentType?: 'PDF' | 'TEXT' | 'MANUAL'
      userId?: string
    } = {}
    if (category) whereClause.category = category
    if (documentType) whereClause.documentType = documentType
    if (userId) whereClause.userId = userId
    
    const documents = await prisma.knowledgeDocument.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    })
    
    return documents.map(doc => ({
      id: doc.id,
      title: doc.title,
      content: doc.content,
      category: doc.category,
      tags: doc.tags,
      documentType: doc.documentType as 'PDF' | 'TEXT' | 'MANUAL',
      fileName: doc.fileName || undefined,
      fileSize: doc.fileSize || undefined,
      filePath: doc.filePath || undefined,
      embedding: doc.embedding,
      userId: doc.userId || undefined
    }))
  } catch (error) {
    console.error('Error fetching knowledge documents:', error)
    return []
  }
}

/**
 * Delete a knowledge document
 */
export async function deleteKnowledgeDocument(id: string): Promise<boolean> {
  try {
    await prisma.knowledgeDocument.delete({
      where: { id }
    })
    return true
  } catch (error) {
    console.error('Error deleting knowledge document:', error)
    return false
  }
}

/**
 * Update a knowledge document
 */
export async function updateKnowledgeDocument(
  id: string,
  updates: Partial<ProcessedDocument>
): Promise<ProcessedDocument | null> {
  try {
    const updated = await prisma.knowledgeDocument.update({
      where: { id },
      data: {
        title: updates.title,
        content: updates.content,
        category: updates.category,
        tags: updates.tags,
        // Don't update system fields like embedding, fileName, etc.
      }
    })
    
    return {
      id: updated.id,
      title: updated.title,
      content: updated.content,
      category: updated.category,
      tags: updated.tags,
      documentType: updated.documentType as 'PDF' | 'TEXT' | 'MANUAL',
      fileName: updated.fileName || undefined,
      fileSize: updated.fileSize || undefined,
      filePath: updated.filePath || undefined,
      embedding: updated.embedding,
      userId: updated.userId || undefined
    }
  } catch (error) {
    console.error('Error updating knowledge document:', error)
    return null
  }
} 