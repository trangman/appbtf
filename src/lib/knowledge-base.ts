import OpenAI from 'openai'
import { prisma } from './prisma'

// Lazy initialization of OpenAI client
let openai: OpenAI | null = null

function getOpenAIClient(): OpenAI {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured')
    }
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }
  return openai
}

export interface KnowledgeDocument {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
  embedding?: number[]
  similarity?: number
  documentType?: 'PDF' | 'TEXT' | 'MANUAL'
  fileName?: string
}

// Ultra-conservative token estimation for embedding validation
function estimateTokensForEmbedding(text: string): number {
  // ULTRA conservative - based on actual failure at 11,312 tokens from ~16,000 chars
  // That's about 1.4 chars per token - using 1.2 to be extra safe
  return Math.ceil(text.length / 1.2)
}

// Create embeddings for text content with AGGRESSIVE validation
export async function createEmbedding(text: string): Promise<number[]> {
  try {
    console.log(`DEBUG EMBEDDING: Starting embedding creation for text length: ${text.length} characters`)
    console.log(`DEBUG EMBEDDING: First 200 chars: ${text.substring(0, 200)}`)
    
    // AGGRESSIVE character limit first - based on actual failure patterns
    if (text.length > 8000) {
      console.warn(`DEBUG EMBEDDING: EMERGENCY TRUNCATION: Text too long (${text.length} chars), truncating to 8000 chars`)
      text = text.substring(0, 8000)
      console.log(`DEBUG EMBEDDING: Text truncated to ${text.length} characters`)
    }
    
    // Secondary token validation
    const estimatedTokens = estimateTokensForEmbedding(text)
    console.log(`DEBUG EMBEDDING: Estimated tokens: ${estimatedTokens}`)
    
    const maxTokens = 6000 // Much more aggressive limit
    
    if (estimatedTokens > maxTokens) {
      console.warn(`DEBUG EMBEDDING: EMERGENCY TOKEN TRUNCATION: ${estimatedTokens} estimated tokens > ${maxTokens}, applying emergency truncation`)
      const maxChars = maxTokens * 1.2 // Ultra conservative
      text = text.substring(0, maxChars)
      console.log(`DEBUG EMBEDDING: Emergency token truncation: reduced to ${text.length} characters`)
    }
    
    console.log(`DEBUG EMBEDDING: Final text stats before API call:`, {
      length: text.length,
      estimatedTokens: estimateTokensForEmbedding(text),
      firstWords: text.split(' ').slice(0, 10).join(' '),
      hasNonAscii: /[^\x00-\x7F]/.test(text)
    })
    
    console.log(`DEBUG EMBEDDING: Getting OpenAI client...`)
    const client = getOpenAIClient()
    console.log(`DEBUG EMBEDDING: OpenAI client obtained, making API call...`)
    
    const response = await client.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    })
    
    console.log(`DEBUG EMBEDDING: API call successful, processing response...`)
    console.log(`DEBUG EMBEDDING: Response structure:`, {
      hasData: !!response.data,
      dataLength: response.data?.length || 0,
      hasFirstEmbedding: !!response.data?.[0],
      embeddingLength: response.data?.[0]?.embedding?.length || 0,
      usage: response.usage
    })
    
    const embedding = response.data[0].embedding
    console.log(`DEBUG EMBEDDING: Embedding extraction successful:`, {
      embeddingLength: embedding.length,
      firstValues: embedding.slice(0, 5),
      lastValues: embedding.slice(-5)
    })
    
    return embedding
  } catch (error) {
    console.error('DEBUG EMBEDDING: Error creating embedding with full details:', {
      errorType: error?.constructor?.name || 'Unknown',
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      stringifiedError: JSON.stringify(error, Object.getOwnPropertyNames(error)),
      textLength: text.length,
      estimatedTokens: estimateTokensForEmbedding(text),
      textPreview: text.substring(0, 100),
      hasApiKey: !!process.env.OPENAI_API_KEY
    })
    
    // Create more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('429')) {
        throw new Error(`OpenAI API rate limit exceeded: ${error.message}`)
      } else if (error.message.includes('401') || error.message.includes('authentication')) {
        throw new Error(`OpenAI API authentication failed: ${error.message}`)
      } else if (error.message.includes('400')) {
        throw new Error(`OpenAI API bad request: ${error.message}`)
      } else if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
        throw new Error(`OpenAI API timeout: ${error.message}`)
      } else if (error.message.includes('network') || error.message.includes('ENOTFOUND')) {
        throw new Error(`Network error calling OpenAI API: ${error.message}`)
      }
    }
    
    throw error
  }
}

// Calculate cosine similarity between two vectors
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length')
  }
  
  let dotProduct = 0
  let normA = 0
  let normB = 0
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

// Enhanced search function that includes uploaded documents from database
export async function searchKnowledgeBase(
  query: string, 
  limit: number = 3
): Promise<KnowledgeDocument[]> {
  try {
    // Check if OpenAI is available
    if (!process.env.OPENAI_API_KEY) {
      console.warn('OpenAI API key not configured, returning empty results')
      return []
    }

    // Create embedding for the search query
    const queryEmbedding = await createEmbedding(query)
    
    // Get briefs from database for semantic search
    const briefs = await prisma.brief.findMany({
      where: { isPublished: true },
      select: {
        id: true,
        title: true,
        content: true,
        slug: true,
        description: true,
      }
    })
    
    // Get uploaded knowledge documents from database using raw SQL query
    const knowledgeDocs = await prisma.$queryRaw`
      SELECT id, title, content, category, tags, embedding, "documentType", "fileName", "createdAt"
      FROM "knowledge_documents"
      LIMIT 100
    ` as Array<{
      id: string,
      title: string,
      content: string,
      category: string,
      tags: string[],
      embedding: number[],
      documentType: string,
      fileName?: string,
      createdAt: Date
    }>
    
    // Convert briefs to knowledge documents and calculate similarities
    const briefDocuments: KnowledgeDocument[] = []
    
    for (const brief of briefs) {
      // Create embedding for brief content
      const briefEmbedding = await createEmbedding(brief.content)
      
      // Calculate similarity
      const similarity = cosineSimilarity(queryEmbedding, briefEmbedding)
      
      briefDocuments.push({
        id: brief.id,
        title: brief.title,
        content: brief.content,
        category: 'legal-brief',
        tags: ['thai-property-law'],
        embedding: briefEmbedding,
        similarity,
        documentType: 'MANUAL'
      })
    }
    
    // Convert knowledge documents and calculate similarities
    const uploadedKnowledgeDocs: KnowledgeDocument[] = knowledgeDocs.map((doc) => {
      const similarity = calculateCosineSimilarity(queryEmbedding, doc.embedding)
      return {
        id: doc.id,
        title: doc.title,
        content: doc.content,
        category: doc.category,
        tags: doc.tags,
        embedding: doc.embedding,
        similarity,
        documentType: (doc.documentType as 'PDF' | 'TEXT' | 'MANUAL'),
        fileName: doc.fileName
      }
    })
    
    // Combine all documents
    const allDocuments = [...briefDocuments, ...uploadedKnowledgeDocs]
    
    // Sort by similarity and return top results
    return allDocuments
      .sort((a, b) => (b.similarity || 0) - (a.similarity || 0))
      .slice(0, limit)
      
  } catch (error) {
    console.error('Error searching knowledge base:', error)
    // Return empty array if search fails
    return []
  }
}

// Calculate cosine similarity between two vectors
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

// Pre-built knowledge for common Thai property law topics
export const CORE_KNOWLEDGE = {
  "foreign-ownership": {
    title: "Foreign Property Ownership in Thailand",
    content: `
Foreign nationals face specific restrictions when owning property in Thailand:

LAND OWNERSHIP:
- Foreign nationals cannot directly own land in Thailand
- Maximum 49% foreign ownership in any land holding company
- Strict regulations on nominee arrangements

CONDOMINIUM OWNERSHIP:
- Foreigners can own up to 49% of units in a condominium project
- Must transfer funds from abroad with proper documentation
- Need Foreign Exchange Transaction Form (FETF)

COMPANY STRUCTURE:
- Some buyers use Thai limited companies to hold land
- Requires majority Thai ownership (51%)
- Must have legitimate business purpose
- Regular compliance requirements

LEGAL REQUIREMENTS:
- All funds must be transferred from abroad
- Proper visa and documentation required
- Due diligence on property title essential
- Use qualified Thai lawyer for transactions
    `,
    category: "foreign-ownership",
    tags: ["foreign-buyers", "land-ownership", "condominiums", "company-structure"]
  },
  
  "trust-ownership-model": {
    title: "Bespoke Trust Property Ownership Model",
    content: `
Our proprietary trust ownership model provides a secure structure for foreign property ownership in Thailand:

TRUST STRUCTURE BENEFITS:
- Legal compliance with Thai foreign ownership laws
- Enhanced asset protection and security
- Professional management and oversight
- Simplified succession planning

HOW IT WORKS:
- Property held in trust by qualified Thai entity
- Foreign beneficiary retains beneficial ownership
- Transparent governance and reporting
- Exit strategies and transfer mechanisms built-in

LEGAL FRAMEWORK:
- Structured to comply with Thai Civil and Commercial Code
- Regular legal reviews and compliance updates
- Professional trustees with local expertise
- Insurance and indemnity protections

ADVANTAGES OVER TRADITIONAL METHODS:
- More secure than nominee arrangements
- Better protection than company structures
- Professional management reduces risks
- Simplified compliance requirements

INVESTMENT PROTECTION:
- Multiple layers of legal protection
- Professional oversight and governance
- Regular audits and reporting
- Clear exit and transfer procedures
    `,
    category: "trust-ownership",
    tags: ["trust-structure", "foreign-ownership", "asset-protection", "bespoke-model"]
  },
  
  "tax-obligations": {
    title: "Thai Property Tax Obligations",
    content: `
Understanding tax implications is crucial for property owners in Thailand:

TRANSFER TAXES:
- Specific Business Tax (SBT): 3.3% for properties sold within 5 years
- Transfer Fee: 2% of appraised value
- Stamp Duty: 0.5% (alternative to SBT for properties held >5 years)
- Withholding Tax: Progressive rates for individuals

ONGOING TAXES:
- Annual Property Tax: 0.02% to 0.1% of appraised value
- Rental Income Tax: Progressive rates from 5% to 35%
- Corporate Tax: 20% for company-owned properties

TAX PLANNING STRATEGIES:
- Hold properties for more than 5 years to avoid SBT
- Use appropriate ownership structures for tax efficiency
- Claim allowable deductions for rental properties
- Utilize double taxation treaties where applicable

COMPLIANCE REQUIREMENTS:
- Annual tax filings required
- Proper documentation of all transactions
- Regular property valuations
- Professional tax advice recommended
    `,
    category: "tax-obligations",
    tags: ["property-tax", "transfer-tax", "rental-income", "tax-planning"]
  }
}

// Enhanced function to get relevant knowledge including uploaded PDFs
export async function getRelevantKnowledge(query: string, userRole: string): Promise<string> {
  try {
    console.log('DEBUG KNOWLEDGE: Starting knowledge retrieval for query:', query)
    console.log('DEBUG KNOWLEDGE: User role:', userRole)
    
    // Search both uploaded documents and existing knowledge base
    const searchResults = process.env.OPENAI_API_KEY 
      ? await searchKnowledgeBase(query, 3)
      : []
      
    console.log('DEBUG KNOWLEDGE: Search results from uploaded documents:', {
      count: searchResults.length,
      documents: searchResults.map(doc => ({ title: doc.title, similarity: doc.similarity }))
    })
    
    // Check core knowledge for direct matches
    let coreKnowledge = ""
    const queryLower = query.toLowerCase()
    
    console.log('DEBUG KNOWLEDGE: Checking core knowledge patterns for query:', queryLower)
    
    // Role-specific knowledge priorities
    const isAccountant = userRole === 'ACCOUNTANT'
    const isLawyer = userRole === 'LAWYER'
    
    const coreMatches = []
    
    if (queryLower.includes("foreign") || queryLower.includes("ownership")) {
      coreKnowledge += CORE_KNOWLEDGE["foreign-ownership"].content + "\n\n"
      coreMatches.push('foreign-ownership')
      console.log('DEBUG KNOWLEDGE: Added foreign-ownership core knowledge')
    }
    
    if (queryLower.includes("trust") || queryLower.includes("bespoke")) {
      coreKnowledge += CORE_KNOWLEDGE["trust-ownership-model"].content + "\n\n"
      coreMatches.push('trust-ownership-model')
      console.log('DEBUG KNOWLEDGE: Added trust-ownership-model core knowledge')
    }
    
    if (queryLower.includes("tax") || queryLower.includes("duty") || isAccountant) {
      coreKnowledge += CORE_KNOWLEDGE["tax-obligations"].content + "\n\n"
      coreMatches.push('tax-obligations')
      console.log('DEBUG KNOWLEDGE: Added tax-obligations core knowledge (tax/duty match or accountant role)')
    }
    
    // Lawyers get comprehensive coverage
    if (isLawyer && !coreKnowledge) {
      coreKnowledge += CORE_KNOWLEDGE["foreign-ownership"].content + "\n\n"
      coreKnowledge += CORE_KNOWLEDGE["trust-ownership-model"].content + "\n\n"
      coreMatches.push('foreign-ownership', 'trust-ownership-model')
      console.log('DEBUG KNOWLEDGE: Added comprehensive core knowledge for lawyer role')
    }
    
    console.log('DEBUG KNOWLEDGE: Core knowledge analysis:', {
      queryKeywords: queryLower.split(' ').filter(word => word.length > 3),
      coreMatches,
      hasCoreKnowledge: !!coreKnowledge,
      coreKnowledgeLength: coreKnowledge.length,
      userRole,
      isAccountant,
      isLawyer
    })
    
    // Combine search results and core knowledge
    let contextContent = ""
    
    if (coreKnowledge) {
      contextContent += "RELEVANT KNOWLEDGE BASE:\n" + coreKnowledge
      console.log('DEBUG KNOWLEDGE: Including core knowledge in context')
    } else {
      console.log('DEBUG KNOWLEDGE: No core knowledge patterns matched')
    }
    
    if (searchResults.length > 0) {
      contextContent += "RELEVANT DOCUMENTS:\n"
      searchResults.forEach(doc => {
        const sourceType = doc.documentType === 'PDF' ? 'PDF Document' : 
                          doc.documentType === 'MANUAL' ? 'Legal Brief' : 'Document'
        contextContent += `\n--- ${doc.title} (${sourceType}) ---\n${doc.content}\n`
      })
      console.log('DEBUG KNOWLEDGE: Including uploaded documents in context')
    } else {
      console.log('DEBUG KNOWLEDGE: No uploaded documents found matching query')
    }
    
    console.log('DEBUG KNOWLEDGE: Final context summary:', {
      totalContextLength: contextContent.length,
      hasCoreKnowledge: !!coreKnowledge,
      hasUploadedDocs: searchResults.length > 0,
      coreMatches,
      uploadedDocsCount: searchResults.length
    })
    
    return contextContent
    
  } catch (error) {
    console.error('DEBUG KNOWLEDGE: Error getting relevant knowledge:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      query,
      userRole
    })
    return ""
  }
} 