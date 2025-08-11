import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]/route'
import { createEmbedding } from '@/lib/knowledge-base'
import { prisma } from '@/lib/prisma'
import { supabaseDb } from '@/lib/supabase'
import type { Session } from 'next-auth'

// Determine if we should use Supabase API (for production/serverless environments)
const useSupabaseApi = process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_SUPABASE_URL

export async function POST(request: NextRequest) {
  console.log('=== Manual Knowledge Entry Route Started ===')
  
  try {
    const session = await getServerSession(authOptions) as Session | null
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const user = session.user as { id: string; email: string; name: string; role: string; isAdmin: boolean }
    
    if (!user || !user.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { title, category = 'legal-document', tags = [] } = body
    let { content } = body

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      )
    }

    if (content.length < 50) {
      return NextResponse.json(
        { error: 'Content must be at least 50 characters long' },
        { status: 400 }
      )
    }

    // Create embedding for the content
    console.log('Creating embedding for manual entry...')
    
    // Emergency validation for manual content
    if (content.length > 6000) {
      console.warn(`Manual content too long (${content.length} chars), truncating for safety`)
      content = content.substring(0, 6000)
    }
    
    const embedding = await createEmbedding(content)

    // Store in database
    let storedDoc
    if (useSupabaseApi) {
      storedDoc = await supabaseDb.createKnowledgeDocument({
        title,
        content,
        category,
        tags: Array.isArray(tags) ? tags : [tags].filter(Boolean),
        documentType: 'MANUAL',
        embedding,
        userId: user.id
      })
    } else {
      storedDoc = await prisma.knowledgeDocument.create({
        data: {
          title,
          content,
          category,
          tags: Array.isArray(tags) ? tags : [tags].filter(Boolean),
          documentType: 'MANUAL',
          embedding,
          userId: user.id
        }
      })
    }

    console.log(`Manual knowledge entry created: ${storedDoc.id}`)

    return NextResponse.json({
      message: 'Knowledge entry created successfully',
      document: {
        id: storedDoc.id,
        title,
        content,
        category,
        tags: Array.isArray(tags) ? tags : [tags].filter(Boolean),
        documentType: 'MANUAL'
      }
    })

  } catch (error) {
    console.error('Manual knowledge entry error:', error)
    return NextResponse.json(
      { error: `Failed to create knowledge entry: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
} 