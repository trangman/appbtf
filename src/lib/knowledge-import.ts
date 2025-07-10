import { createEmbedding } from './knowledge-base'

export interface ImportedKnowledge {
  title: string
  content: string
  category: string
  tags: string[]
  source?: string
}

// Parse JSON format knowledge import
export function parseJSONKnowledge(jsonContent: string): ImportedKnowledge[] {
  try {
    const data = JSON.parse(jsonContent)
    if (Array.isArray(data)) {
      return data.map((item, index) => ({
        title: item.title || `Imported Item ${index + 1}`,
        content: item.content || '',
        category: item.category || 'general',
        tags: Array.isArray(item.tags) ? item.tags : [],
        source: item.source || 'bulk-import'
      }))
    }
    return []
  } catch (error) {
    console.error('Error parsing JSON knowledge:', error)
    return []
  }
}

// Parse CSV format knowledge import
export function parseCSVKnowledge(csvContent: string): ImportedKnowledge[] {
  try {
    const lines = csvContent.split('\n').filter(line => line.trim())
    if (lines.length < 2) return []
    
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
    const items: ImportedKnowledge[] = []
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim())
      const item: ImportedKnowledge = {
        title: '',
        content: '',
        category: 'general',
        tags: [],
        source: 'csv-import'
      }
      
      headers.forEach((header, index) => {
        const value = values[index] || ''
        switch (header) {
          case 'title':
            item.title = value
            break
          case 'content':
            item.content = value
            break
          case 'category':
            item.category = value
            break
          case 'tags':
            item.tags = value.split(';').map(t => t.trim()).filter(t => t)
            break
        }
      })
      
      if (item.title && item.content) {
        items.push(item)
      }
    }
    
    return items
  } catch (error) {
    console.error('Error parsing CSV knowledge:', error)
    return []
  }
}

// Extract knowledge from plain text documents
export function extractTextKnowledge(
  textContent: string,
  title: string,
  category: string = 'general',
  chunkSize: number = 1000
): ImportedKnowledge[] {
  try {
    const chunks: ImportedKnowledge[] = []
    const paragraphs = textContent.split('\n\n').filter(p => p.trim())
    
    let currentChunk = ''
    let chunkIndex = 1
    
    for (const paragraph of paragraphs) {
      if (currentChunk.length + paragraph.length > chunkSize) {
        if (currentChunk.trim()) {
          chunks.push({
            title: `${title} - Part ${chunkIndex}`,
            content: currentChunk.trim(),
            category,
            tags: ['text-import', 'document-chunk'],
            source: 'text-extraction'
          })
          chunkIndex++
        }
        currentChunk = paragraph
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + paragraph
      }
    }
    
    // Add final chunk
    if (currentChunk.trim()) {
      chunks.push({
        title: `${title} - Part ${chunkIndex}`,
        content: currentChunk.trim(),
        category,
        tags: ['text-import', 'document-chunk'],
        source: 'text-extraction'
      })
    }
    
    return chunks
  } catch (error) {
    console.error('Error extracting text knowledge:', error)
    return []
  }
}

// Process and prepare knowledge for embedding
export async function processKnowledgeForStorage(items: ImportedKnowledge[]) {
  const processedItems = []
  
  for (const item of items) {
    try {
      // Create embedding for the content
      const embedding = await createEmbedding(item.content)
      
      processedItems.push({
        ...item,
        embedding,
        processedAt: new Date(),
        id: `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      })
    } catch (error) {
      console.error(`Error processing item "${item.title}":`, error)
      // Still add the item without embedding
      processedItems.push({
        ...item,
        processedAt: new Date(),
        id: `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      })
    }
  }
  
  return processedItems
}

// Validate imported knowledge items
export function validateKnowledgeItems(items: ImportedKnowledge[]): {
  valid: ImportedKnowledge[]
  invalid: { item: ImportedKnowledge, errors: string[] }[]
} {
  const valid: ImportedKnowledge[] = []
  const invalid: { item: ImportedKnowledge, errors: string[] }[] = []
  
  items.forEach(item => {
    const errors: string[] = []
    
    if (!item.title || item.title.trim().length === 0) {
      errors.push('Title is required')
    }
    
    if (!item.content || item.content.trim().length === 0) {
      errors.push('Content is required')
    }
    
    if (item.content && item.content.length > 10000) {
      errors.push('Content is too long (max 10,000 characters)')
    }
    
    if (!item.category || item.category.trim().length === 0) {
      errors.push('Category is required')
    }
    
    if (errors.length === 0) {
      valid.push(item)
    } else {
      invalid.push({ item, errors })
    }
  })
  
  return { valid, invalid }
} 