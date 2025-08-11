import { createEmbedding } from './knowledge-base'
import { prisma } from './prisma'
import { supabaseDb } from './supabase'

// Determine if we should use Supabase API (for production/serverless environments)
const useSupabaseApi = process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_SUPABASE_URL

// Lazy import pdf-parse to avoid module loading issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pdfParse: ((buffer: Buffer, options?: any) => Promise<{ numpages: number; text: string }>) | null = null

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

// Advanced text extraction as fallback for serverless environments
function extractTextFromPDFBuffer(buffer: Buffer): string {
  try {
    console.log('Using enhanced fallback text extraction for serverless environment')
    
    // Look for text objects in PDF stream
    const text = buffer.toString('latin1')
    
    // Extract text between BT (Begin Text) and ET (End Text) markers
    const textPattern = /BT\s*([\s\S]*?)\s*ET/g
    let extractedText = ''
    let match
    
    while ((match = textPattern.exec(text)) !== null) {
      const textBlock = match[1]
      // Extract strings between parentheses or angle brackets
      const stringPattern = /\((.*?)\)|<(.*?)>/g
      let stringMatch
      
      while ((stringMatch = stringPattern.exec(textBlock)) !== null) {
        const textContent = stringMatch[1] || stringMatch[2]
        if (textContent) {
          // Decode simple escape sequences and add space
          const decoded = textContent
            .replace(/\\n/g, '\n')
            .replace(/\\r/g, '\r')
            .replace(/\\t/g, '\t')
            .replace(/\\\\/g, '\\')
            .replace(/\\[0-7]{3}/g, '') // Remove octal escape sequences
          extractedText += decoded + ' '
        }
      }
    }
    
    // If no structured text found, try simpler approach
    if (extractedText.length < 50) {
      console.log('No structured text found, trying simple text extraction')
      
      // Look for readable ASCII text in the buffer
      const simpleText = buffer.toString('ascii')
        .replace(/[^\x20-\x7E\n\r\t]/g, ' ') // Keep only printable ASCII + whitespace
        .replace(/\s+/g, ' ') // Normalize whitespace
        .split(' ')
        .filter(word => word.length > 2 && /[a-zA-Z]/.test(word)) // Keep words with letters
        .join(' ')
        .trim()
      
      if (simpleText.length > 50) {
        extractedText = simpleText
      }
    }
    
    // Final cleanup
    const cleanText = extractedText
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 10000) // Limit to prevent memory issues
    
    if (cleanText.length < 50) {
      throw new Error('Unable to extract sufficient text from PDF using fallback method')
    }
    
    console.log(`Fallback extraction successful: ${cleanText.length} characters extracted`)
    return cleanText
    
  } catch (error) {
    console.error('Enhanced fallback text extraction failed:', error)
    throw new Error('Failed to extract text from PDF. PDF processing is not supported in this environment.')
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
      const chunks = chunkText(content, 2000)
    
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
      const chunks = chunkText(content, 2000)
      
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

// Token estimation function (rough approximation)
function estimateTokens(text: string): number {
  // Conservative estimation for legal documents with technical terms
  // Legal text often has 2.5-3 characters per token due to technical terms
  // Using 2.5 to be extra safe and account for worst-case scenarios
  return Math.ceil(text.length / 2.5)
}

// Enhanced chunking with token awareness and context preservation
export function chunkText(text: string, maxTokens: number = 2000): string[] {
  const chunks: string[] = []
  
  // If the entire text is small enough, return as single chunk
  if (estimateTokens(text) <= maxTokens) {
    return [text.trim()]
  }
  
  // Try to split by major sections first (useful for legal documents)
  const sections = text.split(/\n\s*(?=\d+\.|[A-Z][A-Z\s]+:|\d+\s*\.\s*[A-Z])/);
  
  let currentChunk = ''
  
  for (const section of sections) {
    const sectionTokens = estimateTokens(section)
    const currentTokens = estimateTokens(currentChunk)
    
    // If adding this section would exceed limit
    if (currentTokens + sectionTokens > maxTokens && currentChunk.trim()) {
      chunks.push(currentChunk.trim())
      currentChunk = section
    } else if (sectionTokens > maxTokens) {
      // If current chunk exists, save it
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim())
        currentChunk = ''
      }
      
      // Split large section by sentences
      const sentences = section.split(/(?<=[.!?])\s+/)
      let sentenceChunk = ''
      
      for (const sentence of sentences) {
        const sentenceTokens = estimateTokens(sentence)
        const sentenceChunkTokens = estimateTokens(sentenceChunk)
        
        if (sentenceChunkTokens + sentenceTokens > maxTokens && sentenceChunk.trim()) {
          chunks.push(sentenceChunk.trim())
          sentenceChunk = sentence
        } else {
          sentenceChunk += (sentenceChunk ? ' ' : '') + sentence
        }
      }
      
      if (sentenceChunk.trim()) {
        currentChunk = sentenceChunk
      }
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + section
    }
  }
  
  // Add the last chunk
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim())
  }
  
  // Final validation and splitting for any chunks that are still too large
  const finalChunks: string[] = []
  for (const chunk of chunks) {
    if (estimateTokens(chunk) <= maxTokens) {
      finalChunks.push(chunk)
    } else {
      // Emergency splitting by character count with word boundaries
      const words = chunk.split(/\s+/)
      let emergencyChunk = ''
      
      for (const word of words) {
        const testChunk = emergencyChunk + (emergencyChunk ? ' ' : '') + word
        if (estimateTokens(testChunk) > maxTokens && emergencyChunk) {
          finalChunks.push(emergencyChunk.trim())
          emergencyChunk = word
        } else {
          emergencyChunk = testChunk
        }
      }
      
      if (emergencyChunk.trim()) {
        finalChunks.push(emergencyChunk.trim())
      }
    }
  }
  
  const validatedChunks = finalChunks.filter(chunk => chunk.trim().length > 0)
  
  // FINAL EMERGENCY VALIDATION - ensure no chunk is too large
  const ultraSafeChunks: string[] = []
  for (let i = 0; i < validatedChunks.length; i++) {
    const chunk = validatedChunks[i]
    const chunkTokens = estimateTokens(chunk)
    
    console.log(`CHUNK VALIDATION ${i + 1}: ${chunk.length} chars, ${chunkTokens} estimated tokens`)
    
    if (chunkTokens > 4000 || chunk.length > 6000) {
      console.warn(`OVERSIZED CHUNK DETECTED ${i + 1}: ${chunkTokens} tokens, ${chunk.length} chars - EMERGENCY SPLITTING`)
      
      // Emergency split by characters with word boundaries
      const words = chunk.split(/\s+/)
      let emergencyChunk = ''
      
      for (const word of words) {
        const testChunk = emergencyChunk + (emergencyChunk ? ' ' : '') + word
        if (testChunk.length > 4000) { // Ultra conservative character limit
          if (emergencyChunk.trim()) {
            ultraSafeChunks.push(emergencyChunk.trim())
            console.log(`Emergency split chunk: ${emergencyChunk.length} chars`)
          }
          emergencyChunk = word
        } else {
          emergencyChunk = testChunk
        }
      }
      
      if (emergencyChunk.trim()) {
        ultraSafeChunks.push(emergencyChunk.trim())
        console.log(`Final emergency chunk: ${emergencyChunk.length} chars`)
      }
    } else {
      ultraSafeChunks.push(chunk)
    }
  }
  
  // Filter out any chunks that are too small to be useful
  const finalValidChunks = ultraSafeChunks.filter(chunk => {
    const trimmed = chunk.trim()
    if (trimmed.length < 20) {
      console.warn(`Removing tiny chunk: ${trimmed.length} chars - "${trimmed.substring(0, 50)}..."`)
      return false
    }
    return true
  })
  
  console.log(`CHUNKING COMPLETE: ${finalValidChunks.length} ultra-safe chunks created (${ultraSafeChunks.length - finalValidChunks.length} tiny chunks removed)`)
  
  // Ensure we have at least one chunk
  if (finalValidChunks.length === 0) {
    console.warn('No valid chunks created, returning original text as single chunk')
    const fallbackChunk = text.trim().substring(0, 4000) // Ultra safe fallback
    return [fallbackChunk]
  }
  
  return finalValidChunks
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
      let chunk = pdfResult.chunks[i]
      const chunkTitle = pdfResult.chunks.length > 1 
        ? `${pdfResult.title} - Part ${i + 1}`
        : pdfResult.title
      
      console.log(`Processing chunk ${i + 1}/${pdfResult.chunks.length}: ${chunk.length} characters`)
      
      // Validate chunk is not empty or too small
      if (!chunk || chunk.trim().length < 20) {
        console.warn(`Skipping invalid chunk ${i + 1}: too small or empty`)
        continue
      }
      
      // Create embedding for this chunk
      console.log('Creating embedding for chunk...')
      
      // Emergency validation before embedding creation
      const chunkTokens = estimateTokens(chunk)
      console.log(`Chunk ${i + 1}: ${chunk.length} chars, estimated ${chunkTokens} tokens`)
      
      if (chunkTokens > 4000) {
        console.warn(`Chunk ${i + 1} still too large (${chunkTokens} tokens), applying emergency truncation`)
        chunk = chunk.substring(0, 6000) // Ultra conservative character limit
        console.log(`Chunk ${i + 1} truncated to ${chunk.length} chars`)
      }
      
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
    
    // Ensure we have at least one document
    if (processedDocs.length === 0) {
      console.warn('No documents were created, this should not happen')
      throw new Error('PDF processing completed but no valid documents were created. The PDF may be corrupted or contain no readable text.')
    }
    
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

// Enhanced processing with multiple strategies
export interface ProcessingOptions {
  strategy: 'chunk' | 'summarize' | 'hybrid' | 'section'
  maxTokensPerChunk?: number
  createSummary?: boolean
  preserveSections?: boolean
}

// Create a document summary using AI directly (no HTTP calls)
async function createDocumentSummary(content: string, title: string): Promise<string> {
  try {
    // Import OpenAI directly to avoid HTTP calls in serverless environment
    const OpenAI = (await import('openai')).default
    
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured')
    }
    
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
    
    // For very large content, take first portion for summary
    // Use more conservative limit to ensure summary generation works
    const summaryContent = content.length > 6000 ? content.substring(0, 6000) + '...' : content
    
    // Ensure we have enough content for a meaningful summary
    if (summaryContent.trim().length < 100) {
      console.warn('Content too short for AI summary, using simple fallback')
      const words = content.split(/\s+/).slice(0, 50).join(' ')
      return `${title}: ${words}...`
    }
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a legal document analyst. Create concise but comprehensive summaries of legal documents, highlighting key points, requirements, and important legal concepts.'
        },
        {
          role: 'user',
          content: `Please create a comprehensive summary of this legal document titled "${title}". Include key points, main sections, and important legal concepts:\n\n${summaryContent}`
        }
      ],
      max_tokens: 1000,
      temperature: 0.3
    })
    
    const summary = completion.choices[0]?.message?.content
    if (summary) {
      return summary
    }
    
    // Fallback: create a simple summary
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10)
    const importantSentences = sentences.slice(0, 5).join('. ') + '.'
    return `Summary of ${title}: ${importantSentences}`
  } catch (error) {
    console.warn('Failed to create AI summary:', error)
    // Simple fallback summary
    const words = content.split(/\s+/).slice(0, 100).join(' ')
    return `${title}: ${words}...`
  }
}

// Enhanced PDF processing with multiple strategies
export async function processPDFDocumentEnhanced(
  buffer: Buffer,
  fileName: string,
  userId?: string,
  category: string = 'legal-document',
  tags: string[] = [],
  options: ProcessingOptions = { strategy: 'hybrid', maxTokensPerChunk: 2000, createSummary: true }
): Promise<ProcessedDocument[]> {
  try {
    console.log(`DEBUG ENHANCED: Processing PDF with ${options.strategy} strategy: ${fileName}`)
    console.log('DEBUG ENHANCED: Options:', JSON.stringify(options))
    console.log('DEBUG ENHANCED: Buffer size:', buffer.length)
    console.log('DEBUG ENHANCED: User ID:', userId)
    console.log('DEBUG ENHANCED: Category:', category)
    console.log('DEBUG ENHANCED: Tags:', tags)
    
    console.log('DEBUG ENHANCED: Starting PDF text extraction...')
    const pdfResult = await extractPDFText(buffer)
    console.log('DEBUG ENHANCED: PDF text extracted successfully:', {
      titleLength: pdfResult.title?.length || 0,
      contentLength: pdfResult.content?.length || 0,
      wordCount: pdfResult.wordCount,
      pageCount: pdfResult.pageCount,
      chunksCount: pdfResult.chunks?.length || 0
    })
    
    const processedDocs: ProcessedDocument[] = []
    
    // Strategy 1: Create document summary (for overview)
    if (options.createSummary || options.strategy === 'summarize' || options.strategy === 'hybrid') {
      console.log('DEBUG ENHANCED: Creating document summary...')
      try {
        const summary = await createDocumentSummary(pdfResult.content, pdfResult.title)
        console.log('DEBUG ENHANCED: Summary created:', {
          summaryLength: summary?.length || 0,
          firstChars: summary?.substring(0, 100) || 'N/A'
        })
        
        console.log('DEBUG ENHANCED: Creating embedding for summary...')
        const summaryEmbedding = await createEmbedding(summary)
        console.log('DEBUG ENHANCED: Summary embedding created:', {
          embeddingSize: summaryEmbedding?.length || 0,
          firstValues: summaryEmbedding?.slice(0, 5) || []
        })
        
        console.log('DEBUG ENHANCED: Storing summary document...')
        const summaryDoc = await storeDocument({
          title: `${pdfResult.title} - Summary`,
          content: summary,
          category,
          tags: [...tags, 'summary'],
          documentType: 'PDF',
          fileName,
          fileSize: buffer.length,
          embedding: summaryEmbedding,
          userId
        })
        console.log('DEBUG ENHANCED: Summary document stored:', summaryDoc.id)
        
        processedDocs.push(summaryDoc)
      } catch (summaryError) {
        console.error('DEBUG ENHANCED: Summary processing failed:', {
          error: summaryError instanceof Error ? summaryError.message : summaryError,
          stack: summaryError instanceof Error ? summaryError.stack : undefined
        })
        throw new Error(`Summary creation failed: ${summaryError instanceof Error ? summaryError.message : 'Unknown error'}`)
      }
    }
    
    // Strategy 2: Process chunks (detailed content)
    if (options.strategy === 'chunk' || options.strategy === 'hybrid') {
      console.log('DEBUG ENHANCED: Processing document chunks...')
      try {
        const chunks = chunkText(pdfResult.content, options.maxTokensPerChunk || 2000)
        console.log('DEBUG ENHANCED: Chunks created:', {
          totalChunks: chunks.length,
          chunkSizes: chunks.map(c => c.length)
        })
        
        for (let i = 0; i < chunks.length; i++) {
          console.log(`DEBUG ENHANCED: Processing chunk ${i + 1}/${chunks.length}`)
          let chunk = chunks[i]
          const chunkTitle = chunks.length > 1 
            ? `${pdfResult.title} - Section ${i + 1}`
            : pdfResult.title
          
          // Validate chunk is not empty or too small
          if (!chunk || chunk.trim().length < 20) {
            console.warn(`DEBUG ENHANCED: Skipping invalid enhanced chunk ${i + 1}: too small or empty`)
            continue
          }
          
          // Emergency validation before embedding creation
          const chunkTokens = estimateTokens(chunk)
          console.log(`DEBUG ENHANCED: Enhanced chunk ${i + 1}: ${chunk.length} chars, estimated ${chunkTokens} tokens`)
          
          if (chunkTokens > 4000) {
            console.warn(`DEBUG ENHANCED: Enhanced chunk ${i + 1} too large (${chunkTokens} tokens), applying emergency truncation`)
            chunk = chunk.substring(0, 6000)
            console.log(`DEBUG ENHANCED: Enhanced chunk ${i + 1} truncated to ${chunk.length} chars`)
          }
          
          try {
            console.log(`DEBUG ENHANCED: Creating embedding for chunk ${i + 1}...`)
            const embedding = await createEmbedding(chunk)
            console.log(`DEBUG ENHANCED: Embedding created for chunk ${i + 1}:`, {
              embeddingSize: embedding?.length || 0
            })
            
            console.log(`DEBUG ENHANCED: Storing chunk ${i + 1} document...`)
            const chunkDoc = await storeDocument({
              title: chunkTitle,
              content: chunk,
              category,
              tags: [...tags, 'section'],
              documentType: 'PDF',
              fileName,
              fileSize: buffer.length,
              embedding,
              userId
            })
            console.log(`DEBUG ENHANCED: Chunk ${i + 1} document stored:`, chunkDoc.id)
            
            processedDocs.push(chunkDoc)
          } catch (chunkError) {
            console.error(`DEBUG ENHANCED: Error processing chunk ${i + 1}:`, {
              error: chunkError instanceof Error ? chunkError.message : chunkError,
              stack: chunkError instanceof Error ? chunkError.stack : undefined,
              chunkLength: chunk.length,
              chunkTokens: estimateTokens(chunk)
            })
            throw new Error(`Chunk ${i + 1} processing failed: ${chunkError instanceof Error ? chunkError.message : 'Unknown error'}`)
          }
        }
      } catch (chunksError) {
        console.error('DEBUG ENHANCED: Chunks processing failed:', {
          error: chunksError instanceof Error ? chunksError.message : chunksError,
          stack: chunksError instanceof Error ? chunksError.stack : undefined
        })
        throw new Error(`Chunks processing failed: ${chunksError instanceof Error ? chunksError.message : 'Unknown error'}`)
      }
    }
    
    // Strategy 3: Section-based processing (for structured documents)
    if (options.strategy === 'section') {
      console.log('DEBUG ENHANCED: Processing document sections...')
      try {
        const sections = extractDocumentSections(pdfResult.content)
        console.log('DEBUG ENHANCED: Sections extracted:', {
          totalSections: sections.length,
          sectionTitles: sections.map(s => s.title)
        })
        
        for (const section of sections) {
          console.log(`DEBUG ENHANCED: Processing section: ${section.title}`)
          let sectionContent = section.content
          const sectionTokens = estimateTokens(sectionContent)
          
          if (sectionTokens <= (options.maxTokensPerChunk || 2000)) {
            // Additional emergency validation
            if (sectionTokens > 4000) {
              console.warn(`DEBUG ENHANCED: Section "${section.title}" too large (${sectionTokens} tokens), truncating`)
              sectionContent = sectionContent.substring(0, 6000)
            }
            
            try {
              console.log(`DEBUG ENHANCED: Creating embedding for section: ${section.title}`)
              const embedding = await createEmbedding(sectionContent)
              console.log(`DEBUG ENHANCED: Section embedding created for: ${section.title}`)
              
              console.log(`DEBUG ENHANCED: Storing section document: ${section.title}`)
              const sectionDoc = await storeDocument({
                title: `${pdfResult.title} - ${section.title}`,
                content: sectionContent,
                category,
                tags: [...tags, 'section', section.title.toLowerCase().replace(/\s+/g, '-')],
                documentType: 'PDF',
                fileName,
                fileSize: buffer.length,
                embedding,
                userId
              })
              console.log(`DEBUG ENHANCED: Section document stored: ${sectionDoc.id}`)
              
              processedDocs.push(sectionDoc)
            } catch (sectionError) {
              console.error(`DEBUG ENHANCED: Error processing section ${section.title}:`, {
                error: sectionError instanceof Error ? sectionError.message : sectionError,
                stack: sectionError instanceof Error ? sectionError.stack : undefined
              })
              throw new Error(`Section "${section.title}" processing failed: ${sectionError instanceof Error ? sectionError.message : 'Unknown error'}`)
            }
          } else {
            console.log(`DEBUG ENHANCED: Skipping section "${section.title}" - too large (${sectionTokens} tokens)`)
          }
        }
      } catch (sectionsError) {
        console.error('DEBUG ENHANCED: Sections processing failed:', {
          error: sectionsError instanceof Error ? sectionsError.message : sectionsError,
          stack: sectionsError instanceof Error ? sectionsError.stack : undefined
        })
        throw new Error(`Sections processing failed: ${sectionsError instanceof Error ? sectionsError.message : 'Unknown error'}`)
      }
    }
    
    console.log(`DEBUG ENHANCED: Successfully processed PDF using ${options.strategy} strategy: ${processedDocs.length} documents created`)
    console.log('DEBUG ENHANCED: Final processed docs:', processedDocs.map(doc => ({
      id: doc.id,
      title: doc.title,
      contentLength: doc.content?.length || 0
    })))
    
    // Ensure we have at least one document
    if (processedDocs.length === 0) {
      console.warn('DEBUG ENHANCED: Enhanced processing created no documents, this should not happen')
      throw new Error('Enhanced PDF processing completed but no valid documents were created. The PDF may be corrupted or contain no readable text.')
    }
    
    console.log('DEBUG ENHANCED: processPDFDocumentEnhanced completed successfully')
    return processedDocs
  } catch (error) {
    console.error('DEBUG ENHANCED: Enhanced PDF processing failed with full details:', {
      errorType: error?.constructor?.name || 'Unknown',
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      stringifiedError: JSON.stringify(error, Object.getOwnPropertyNames(error)),
      fileName,
      bufferSize: buffer.length,
      options
    })
    throw error
  }
}

// Extract structured sections from document
function extractDocumentSections(content: string): Array<{ title: string; content: string }> {
  const sections: Array<{ title: string; content: string }> = []
  
  // Split by common legal document patterns
  const sectionRegex = /(?:^|\n)\s*(?:(?:\d+\.?\s*)|(?:[A-Z][A-Z\s]{3,}:)|(?:SECTION\s+\d+)|(?:ARTICLE\s+\d+))/gm
  const matches = [...content.matchAll(sectionRegex)]
  
  if (matches.length === 0) {
    // No clear sections found, return whole document
    return [{ title: 'Main Content', content }]
  }
  
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i]
    const nextMatch = matches[i + 1]
    
    const startIndex = match.index || 0
    const endIndex = nextMatch ? (nextMatch.index || content.length) : content.length
    
    const sectionContent = content.slice(startIndex, endIndex).trim()
    const title = sectionContent.split('\n')[0].trim().substring(0, 50)
    
    if (sectionContent.length > 100) { // Only include substantial sections
      sections.push({
        title: title || `Section ${i + 1}`,
        content: sectionContent
      })
    }
  }
  
  return sections.length > 0 ? sections : [{ title: 'Main Content', content }]
}

// Helper function to store documents
async function storeDocument(docData: {
  title: string
  content: string
  category: string
  tags: string[]
  documentType: 'PDF' | 'TEXT' | 'MANUAL'
  fileName: string
  fileSize: number
  embedding: number[]
  userId?: string
}): Promise<ProcessedDocument> {
  try {
    console.log('DEBUG STORE: Starting document storage with data:', {
      title: docData.title?.substring(0, 50) + '...',
      contentLength: docData.content?.length || 0,
      category: docData.category,
      tagsCount: docData.tags?.length || 0,
      documentType: docData.documentType,
      fileName: docData.fileName,
      fileSize: docData.fileSize,
      embeddingLength: docData.embedding?.length || 0,
      userId: docData.userId,
      useSupabaseApi
    })
    
    if (useSupabaseApi) {
      console.log('DEBUG STORE: Using Supabase API for storage...')
      console.log('DEBUG STORE: Checking supabaseDb availability:', !!supabaseDb)
      console.log('DEBUG STORE: Environment variables check:', {
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
      })
      
      try {
        console.log('DEBUG STORE: Calling supabaseDb.createKnowledgeDocument...')
        const storedDoc = await supabaseDb.createKnowledgeDocument(docData)
        console.log('DEBUG STORE: Supabase storage successful:', {
          id: storedDoc.id,
          title: storedDoc.title?.substring(0, 50) + '...'
        })
        
        return {
          id: storedDoc.id,
          ...docData
        }
      } catch (supabaseError) {
        console.error('DEBUG STORE: Supabase storage failed:', {
          errorType: supabaseError?.constructor?.name || 'Unknown',
          errorMessage: supabaseError instanceof Error ? supabaseError.message : String(supabaseError),
          errorStack: supabaseError instanceof Error ? supabaseError.stack : undefined,
          stringifiedError: JSON.stringify(supabaseError, Object.getOwnPropertyNames(supabaseError))
        })
        throw supabaseError
      }
    } else {
      console.log('DEBUG STORE: Using Prisma for storage...')
      console.log('DEBUG STORE: Checking prisma availability:', !!prisma)
      
      try {
        console.log('DEBUG STORE: Calling prisma.knowledgeDocument.create...')
        const storedDoc = await prisma.knowledgeDocument.create({ data: docData })
        console.log('DEBUG STORE: Prisma storage successful:', {
          id: storedDoc.id,
          title: storedDoc.title?.substring(0, 50) + '...'
        })
        
        return {
          id: storedDoc.id,
          ...docData
        }
      } catch (prismaError) {
        console.error('DEBUG STORE: Prisma storage failed:', {
          errorType: prismaError?.constructor?.name || 'Unknown',
          errorMessage: prismaError instanceof Error ? prismaError.message : String(prismaError),
          errorStack: prismaError instanceof Error ? prismaError.stack : undefined,
          stringifiedError: JSON.stringify(prismaError, Object.getOwnPropertyNames(prismaError))
        })
        throw prismaError
      }
    }
  } catch (error) {
    console.error('DEBUG STORE: Document storage failed with full analysis:', {
      errorType: error?.constructor?.name || 'Unknown',
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      stringifiedError: JSON.stringify(error, Object.getOwnPropertyNames(error)),
      useSupabaseApi,
      docTitle: docData.title?.substring(0, 50),
      docSize: docData.content?.length || 0,
      embeddingSize: docData.embedding?.length || 0,
      tagsCount: docData.tags?.length || 0
    })
    
    // Try to provide more specific error information
    if (error instanceof Error) {
      const message = error.message.toLowerCase()
      if (message.includes('embedding')) {
        throw new Error(`Failed to store document - embedding issue: ${error.message}`)
      } else if (message.includes('content')) {
        throw new Error(`Failed to store document - content issue: ${error.message}`)
      } else if (message.includes('database') || message.includes('connection')) {
        throw new Error(`Failed to store document - database issue: ${error.message}`)
      } else if (message.includes('supabase')) {
        throw new Error(`Failed to store document - Supabase API issue: ${error.message}`)
      } else if (message.includes('prisma')) {
        throw new Error(`Failed to store document - Prisma ORM issue: ${error.message}`)
      } else if (message.includes('network') || message.includes('timeout')) {
        throw new Error(`Failed to store document - network/timeout issue: ${error.message}`)
      }
    }
    
    throw new Error(`Failed to store document: ${error instanceof Error ? error.message : 'Database storage error'}`)
  }
} 