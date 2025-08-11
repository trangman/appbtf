import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { createEmbedding } from '@/lib/knowledge-base'
import type { Session } from 'next-auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions) as Session | null
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const user = session.user as { id: string; email: string; name: string; role: string; isAdmin: boolean }
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get all knowledge documents and check their embedding status
    const documents = await prisma.knowledgeDocument.findMany({
      select: {
        id: true,
        title: true,
        documentType: true,
        createdAt: true,
        embedding: true,
        content: true
      },
      orderBy: { createdAt: 'desc' }
    })

    const analysis = documents.map(doc => ({
      id: doc.id,
      title: doc.title,
      documentType: doc.documentType,
      createdAt: doc.createdAt,
      hasEmbedding: !!doc.embedding && doc.embedding.length > 0,
      embeddingSize: doc.embedding?.length || 0,
      contentLength: doc.content?.length || 0,
      contentPreview: doc.content?.substring(0, 100) + '...'
    }))

    const stats = {
      totalDocuments: documents.length,
      withEmbeddings: analysis.filter(d => d.hasEmbedding).length,
      withoutEmbeddings: analysis.filter(d => !d.hasEmbedding).length,
      documentTypes: [...new Set(documents.map(d => d.documentType))]
    }

    return NextResponse.json({
      stats,
      documents: analysis,
      message: 'Knowledge base analysis complete'
    })

  } catch (error) {
    console.error('Debug API error:', error)
    return NextResponse.json({ 
      error: 'Failed to analyze knowledge base',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const user = session.user as { id: string; email: string; name: string; role: string; isAdmin: boolean }
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { action } = await request.json()

    if (action === 'fix_embeddings') {
      // Find documents without embeddings
      const allDocuments = await prisma.knowledgeDocument.findMany()
      const documentsWithoutEmbeddings = allDocuments.filter(doc => 
        !doc.embedding || doc.embedding.length === 0
      )

      console.log(`Found ${documentsWithoutEmbeddings.length} documents without embeddings`)

      const results = []
      for (const doc of documentsWithoutEmbeddings) {
        try {
          console.log(`Creating embedding for document: ${doc.title}`)
          
          // Truncate content if too long for safety
          let content = doc.content
          if (content.length > 6000) {
            console.warn(`Truncating content for ${doc.title} (${content.length} chars)`)
            content = content.substring(0, 6000)
          }

          const embedding = await createEmbedding(content)
          
          await prisma.knowledgeDocument.update({
            where: { id: doc.id },
            data: { embedding }
          })

          results.push({
            id: doc.id,
            title: doc.title,
            status: 'success',
            embeddingSize: embedding.length
          })

          console.log(`Successfully created embedding for: ${doc.title}`)
        } catch (error) {
          console.error(`Failed to create embedding for ${doc.title}:`, error)
          results.push({
            id: doc.id,
            title: doc.title,
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }

      return NextResponse.json({
        message: 'Embedding fix process completed',
        processed: results.length,
        successful: results.filter(r => r.status === 'success').length,
        failed: results.filter(r => r.status === 'error').length,
        results
      })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })

  } catch (error) {
    console.error('Debug API POST error:', error)
    return NextResponse.json({ 
      error: 'Failed to process request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 