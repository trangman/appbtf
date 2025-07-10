import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]/route'
import { processPDFDocument } from '@/lib/pdf-processor'
import type { Session } from 'next-auth'

export async function POST(request: NextRequest) {
  try {
    console.log('PDF Upload: Starting upload process')
    const session = await getServerSession(authOptions) as Session | null
    
    if (!session) {
      console.log('PDF Upload: No session found')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('PDF Upload: Session found for user:', session.user?.email)

    // Check if user is admin
    const user = session.user as any // TODO: Fix typing
    console.log('PDF Upload: User admin status:', user?.isAdmin)
    console.log('PDF Upload: Full user object:', {
      id: user?.id,
      email: user?.email,
      name: user?.name,
      role: user?.role,
      isAdmin: user?.isAdmin
    })
    
    if (!user || !user.isAdmin) {
      console.log('PDF Upload: Admin access denied for user:', user?.email)
      return NextResponse.json(
        { error: 'Admin access required. Current user is not an admin.' },
        { status: 403 }
      )
    }

    console.log('PDF Upload: Checking environment variables...')
    if (!process.env.OPENAI_API_KEY) {
      console.log('PDF Upload: OpenAI API key not found')
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }
    console.log('PDF Upload: OpenAI API key found')

    console.log('PDF Upload: Parsing form data...')
    const formData = await request.formData()
    const file = formData.get('file') as File
    const category = formData.get('category') as string || 'legal-document'
    const tags = formData.get('tags') as string || ''
    
    console.log('PDF Upload: Form data parsed:', {
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      category,
      tags
    })
    
    if (!file) {
      console.log('PDF Upload: No file provided')
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Check file type
    if (file.type !== 'application/pdf') {
      console.log('PDF Upload: Invalid file type:', file.type)
      return NextResponse.json(
        { error: 'Only PDF files are supported' },
        { status: 400 }
      )
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      console.log('PDF Upload: File too large:', file.size)
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB' },
        { status: 400 }
      )
    }

    console.log('PDF Upload: Converting file to buffer...')
    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    console.log('PDF Upload: Buffer created, size:', buffer.length)

    console.log('PDF Upload: Starting PDF processing...')
    // Process PDF and store in database
    const processedDocs = await processPDFDocument(
      buffer,
      file.name,
      session.user.id,
      category,
      tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
    )

    console.log('PDF Upload: Processing completed successfully:', {
      documentsCreated: processedDocs.length,
      documentIds: processedDocs.map(doc => doc.id)
    })

    return NextResponse.json({
      message: 'PDF processed successfully',
      documents: processedDocs,
      count: processedDocs.length
    })

  } catch (error) {
    console.error('PDF Upload: Error processing upload:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    })
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Upload failed: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error during PDF upload' },
      { status: 500 }
    )
  }
} 