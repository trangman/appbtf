import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]/route'
import { supabaseDb } from '@/lib/supabase'
import { 
  getKnowledgeDocuments, 
  searchKnowledgeDocuments,
  deleteKnowledgeDocument 
} from '@/lib/pdf-processor'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin
    // @ts-expect-error - Type issue with session.user
    const user = session.user
    if (!user || !user.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const documentType = searchParams.get('type') as string | null

    // Use Supabase to join manifest and knowledge_documents
    const client = supabaseDb ? supabaseDb : null;
    if (!client) {
      return NextResponse.json({ error: 'Supabase client not available' }, { status: 500 })
    }
    const supabase = (await import('@/lib/supabase')).supabase;
    const { data: manifests, error } = await supabase
      .from('manifest')
      .select('*, document:knowledge_documents(*)')
      .order('createdAt', { ascending: false });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    let documents = manifests.map((m: any) => m.document).filter(Boolean);
    if (category) documents = documents.filter((doc: any) => doc.category === category);
    if (documentType) documents = documents.filter((doc: any) => doc.documentType === documentType);
    return NextResponse.json({
      documents,
      count: documents.length
    })
  } catch (error) {
    console.error('Error fetching knowledge documents:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin
    // @ts-expect-error - Type issue with session.user
    const user = session.user
    if (!user || !user.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { title, content, category, tags } = body

    if (!title || !content || !category) {
      return NextResponse.json(
        { error: 'Title, content, and category are required' },
        { status: 400 }
      )
    }

    const newDoc = await prisma.knowledgeDocument.create({
      data: {
        title,
        content,
        category,
        tags: Array.isArray(tags) ? tags : tags.split(',').map((t: string) => t.trim()),
        documentType: 'TEXT',
        userId: user.id
      }
    })

    return NextResponse.json({
      message: 'Knowledge document created successfully',
      document: newDoc
    })

  } catch (error) {
    console.error('Error creating knowledge document:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin
    // @ts-expect-error - Type issue with session.user
    const user = session.user
    if (!user || !user.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'Document ID required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { title, content, category, tags } = body

    if (!title || !content || !category) {
      return NextResponse.json(
        { error: 'Title, content, and category are required' },
        { status: 400 }
      )
    }

    // Get the document to check if it's a PDF (PDFs shouldn't be editable)
    const existingDoc = await prisma.knowledgeDocument.findUnique({
      where: { id }
    })

    if (!existingDoc) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    if (existingDoc.documentType === 'PDF') {
      return NextResponse.json(
        { error: 'PDF documents cannot be edited' },
        { status: 400 }
      )
    }

    const updatedDoc = await prisma.knowledgeDocument.update({
      where: { id },
      data: {
        title,
        content,
        category,
        tags: Array.isArray(tags) ? tags : tags.split(',').map((t: string) => t.trim())
      }
    })

    return NextResponse.json({
      message: 'Document updated successfully',
      document: updatedDoc
    })

  } catch (error) {
    console.error('Error updating knowledge document:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin
    // @ts-expect-error - Type issue with session.user
    const user = session.user
    if (!user || !user.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'Document ID required' },
        { status: 400 }
      )
    }

    const deleted = await deleteKnowledgeDocument(id)
    
    if (!deleted) {
      return NextResponse.json(
        { error: 'Failed to delete document' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Document deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting knowledge document:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 