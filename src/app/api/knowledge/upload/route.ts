import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]/route'
import { processPDFDocumentEnhanced, processPDFDocument, ProcessingOptions } from '@/lib/pdf-processor'
import type { Session } from 'next-auth'
import { supabaseDb } from '@/lib/supabase'
import { extractTextFromDocx } from '@/lib/docx-processor'
import type { ProcessedDocument } from '@/lib/pdf-processor'

export async function POST(request: NextRequest) {
  console.log('=== PDF Upload Route Started ===')
  
  try {
    console.log('PDF Upload: Starting upload process')
    console.log('PDF Upload: Environment check:', {
      nodeEnv: process.env.NODE_ENV,
      hasOpenAI: !!process.env.OPENAI_API_KEY,
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
    })
    
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
    const user = session.user as { id: string; email: string; name: string; role: string; isAdmin: boolean }
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
    const strategy = formData.get('strategy') as string || 'hybrid'
    
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
    const isPDF = file.type === 'application/pdf' || file.name.endsWith('.pdf');
    const isDocx = file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name.endsWith('.docx');

    if (!isPDF && !isDocx) {
      console.log('Upload: Invalid file type:', file.type, file.name);
      return NextResponse.json(
        { error: 'Only PDF and DOCX files are supported' },
        { status: 400 }
      );
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      console.log('Upload: File too large:', file.size);
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB' },
        { status: 400 }
      );
    }

    console.log('Upload: Converting file to buffer...');
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    console.log('Upload: Buffer created, size:', buffer.length);

    let processedDocs: ProcessedDocument[] = [];
    if (isPDF) {
      console.log('PDF Upload: Starting PDF processing...')
      
      // Add try-catch around the PDF processing specifically with detailed error categorization
      try {
        const processingOptions: ProcessingOptions = {
          strategy: strategy as 'chunk' | 'summarize' | 'hybrid' | 'section',
          maxTokensPerChunk: 2000, // Ultra conservative
          createSummary: true
        }
        
        console.log('PDF Upload: Calling processPDFDocumentEnhanced with options:', processingOptions)
        processedDocs = await processPDFDocumentEnhanced(
          buffer,
          file.name,
          session.user.id,
          category,
          tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
          processingOptions
        )
        console.log('PDF Upload: processPDFDocumentEnhanced completed successfully:', {
          docsCreated: processedDocs?.length || 0
        })
      } catch (processingError) {
        console.error('PDF Upload: Enhanced PDF processing failed with detailed error analysis:', {
          errorType: processingError?.constructor?.name || 'Unknown',
          errorMessage: processingError instanceof Error ? processingError.message : String(processingError),
          errorStack: processingError instanceof Error ? processingError.stack : undefined,
          fileName: file.name,
          fileSize: file.size,
          stringifiedError: JSON.stringify(processingError, Object.getOwnPropertyNames(processingError))
        })
        
        // Categorize the error for better debugging
        let errorCategory = 'UNKNOWN_ERROR'
        let errorDetails = ''
        
        if (processingError instanceof Error) {
          const message = processingError.message.toLowerCase()
          if (message.includes('token') || message.includes('8192') || message.includes('context length')) {
            errorCategory = 'TOKEN_LIMIT_ERROR'
            errorDetails = `Token limit exceeded: ${processingError.message}`
          } else if (message.includes('pdf') || message.includes('parse') || message.includes('extract')) {
            errorCategory = 'PDF_PARSING_ERROR'
            errorDetails = `PDF parsing failed: ${processingError.message}`
          } else if (message.includes('embedding') || message.includes('openai')) {
            errorCategory = 'EMBEDDING_ERROR'
            errorDetails = `Embedding creation failed: ${processingError.message}`
          } else if (message.includes('database') || message.includes('prisma') || message.includes('supabase')) {
            errorCategory = 'DATABASE_ERROR'
            errorDetails = `Database operation failed: ${processingError.message}`
          } else if (message.includes('network') || message.includes('timeout') || message.includes('connection')) {
            errorCategory = 'NETWORK_ERROR'
            errorDetails = `Network/connection error: ${processingError.message}`
          } else {
            errorCategory = 'GENERIC_ERROR'
            errorDetails = `Generic error: ${processingError.message}`
          }
        } else {
          errorCategory = 'NON_ERROR_OBJECT'
          errorDetails = `Non-Error object thrown: ${String(processingError)}`
        }
        
        console.error('PDF Upload: Error categorization:', {
          category: errorCategory,
          details: errorDetails,
          originalError: processingError
        })
        
        // Fallback to original processing method with detailed error tracking
        try {
          console.log('PDF Upload: Trying fallback processing method...')
          processedDocs = await processPDFDocument(
            buffer,
            file.name,
            session.user.id,
            category,
            tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
          )
          console.log('PDF Upload: Fallback processing successful')
        } catch (fallbackError) {
          console.error('PDF Upload: Both processing methods failed with detailed analysis:', {
            enhancedError: {
              type: processingError?.constructor?.name || 'Unknown',
              message: processingError instanceof Error ? processingError.message : String(processingError),
              category: errorCategory
            },
            fallbackError: {
              type: fallbackError?.constructor?.name || 'Unknown',
              message: fallbackError instanceof Error ? fallbackError.message : String(fallbackError),
              stringified: JSON.stringify(fallbackError, Object.getOwnPropertyNames(fallbackError))
            },
            fileName: file.name,
            fileSize: file.size
          })
          
          // Return the categorized error with details
          return NextResponse.json(
            { 
              error: `PDF processing failed: [${errorCategory}] ${errorDetails}`,
              errorCategory,
              originalError: processingError instanceof Error ? processingError.message : String(processingError),
              fallbackError: fallbackError instanceof Error ? fallbackError.message : String(fallbackError),
              debug: {
                fileSize: file.size,
                fileName: file.name,
                strategy: strategy,
                timestamp: new Date().toISOString()
              }
            },
            { status: 500 }
          )
        }
      }

      console.log('PDF Upload: Processing completed successfully:', {
        documentsCreated: processedDocs.length,
        documentIds: processedDocs.map(doc => doc.id)
      })

      // After processing and storing documents, add manifest entries
      if (processedDocs && Array.isArray(processedDocs)) {
        const useSupabaseApi = process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_SUPABASE_URL;
        for (const doc of processedDocs) {
          try {
            if (useSupabaseApi) {
              // Supabase manifest entry
              await supabaseDb.createManifestEntry({
                documentId: doc.id,
                uploaderId: session.user.id,
                source: 'upload',
                notes: null,
              });
            } else {
              // Prisma manifest entry
              const { prisma } = await import('@/lib/prisma');
              await prisma.manifest.create({
                data: {
                  documentId: doc.id,
                  uploaderId: session.user.id,
                  source: 'upload',
                  notes: undefined,
                }
              });
            }
          } catch (manifestError) {
            console.error('Failed to create manifest entry:', manifestError);
            return NextResponse.json(
              { error: 'Failed to create manifest entry', details: manifestError instanceof Error ? manifestError.message : String(manifestError) },
              { status: 500 }
            );
          }
        }
      }

      return NextResponse.json({
        message: 'PDF processed successfully',
        documents: processedDocs,
        count: processedDocs.length
      })
    } else if (isDocx) {
      // DOCX processing
      console.log('DOCX Upload: Starting DOCX processing...')
      try {
        const text = await extractTextFromDocx(buffer);
        // Use chunkText from pdf-processor for consistency
        const { chunkText } = await import('@/lib/pdf-processor');
        const chunks = chunkText(text, 2000);
        const processed: any[] = [];
        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          const chunkTitle = chunks.length > 1 ? `${file.name} - Part ${i + 1}` : file.name;
          // Create embedding for this chunk
          const { createEmbedding } = await import('@/lib/knowledge-base');
          const embedding = await createEmbedding(chunk);
          // Store in database (reuse PDF logic, but set documentType: 'TEXT')
          const useSupabaseApi = process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_SUPABASE_URL;
          let storedDoc;
          if (useSupabaseApi) {
            storedDoc = await supabaseDb.createKnowledgeDocument({
              title: chunkTitle,
              content: chunk,
              category,
              tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
              documentType: 'TEXT',
              fileName: file.name,
              fileSize: buffer.length,
              embedding,
              userId: session.user.id
            });
          } else {
            const { prisma } = await import('@/lib/prisma');
            storedDoc = await prisma.knowledgeDocument.create({
              data: {
                title: chunkTitle,
                content: chunk,
                category,
                tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
                documentType: 'TEXT',
                fileName: file.name,
                fileSize: buffer.length,
                embedding,
                userId: session.user.id
              }
            });
          }
          processed.push({
            id: storedDoc.id,
            title: chunkTitle,
            content: chunk,
            category,
            tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
            documentType: 'TEXT',
            fileName: file.name,
            fileSize: buffer.length,
            embedding,
            userId: session.user.id
          });
        }
        processedDocs = processed;
        console.log('DOCX Upload: DOCX processing completed successfully:', {
          documentsCreated: processedDocs.length,
          documentIds: processedDocs.map(doc => doc.id)
        });
      } catch (docxError) {
        console.error('DOCX Upload: Processing failed:', docxError);
        return NextResponse.json(
          { error: `DOCX processing failed: ${docxError instanceof Error ? docxError.message : String(docxError)}` },
          { status: 500 }
        );
      }

      // After processing and storing documents, add manifest entries
      if (processedDocs && Array.isArray(processedDocs)) {
        const useSupabaseApi = process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_SUPABASE_URL;
        for (const doc of processedDocs) {
          try {
            if (useSupabaseApi) {
              // Supabase manifest entry
              await supabaseDb.createManifestEntry({
                documentId: doc.id,
                uploaderId: session.user.id,
                source: 'upload',
                notes: null,
              });
            } else {
              // Prisma manifest entry
              const { prisma } = await import('@/lib/prisma');
              await prisma.manifest.create({
                data: {
                  documentId: doc.id,
                  uploaderId: session.user.id,
                  source: 'upload',
                  notes: undefined,
                }
              });
            }
          } catch (manifestError) {
            console.error('Failed to create manifest entry:', manifestError);
            return NextResponse.json(
              { error: 'Failed to create manifest entry', details: manifestError instanceof Error ? manifestError.message : String(manifestError) },
              { status: 500 }
            );
          }
        }
      }

      return NextResponse.json({
        message: 'DOCX processed successfully',
        documents: processedDocs,
        count: processedDocs.length
      });
    }

  } catch (error) {
    console.error('PDF Upload: Unexpected top-level error with full analysis:', {
      errorType: error?.constructor?.name || 'Unknown',
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      stringifiedError: JSON.stringify(error, Object.getOwnPropertyNames(error)),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    })
    
    // Make sure we always return a JSON response with detailed error information
    try {
      return NextResponse.json(
        { 
          error: `Upload failed: ${error instanceof Error ? error.message : 'Detailed unknown error'}`,
          errorType: error?.constructor?.name || 'Unknown',
          errorDetails: error instanceof Error ? {
            name: error.name,
            message: error.message,
            stack: error.stack?.substring(0, 1000) // Limit stack trace length
          } : { raw: String(error) },
          debug: {
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV
          }
        },
        { status: 500 }
      )
    } catch (responseError) {
      console.error('PDF Upload: Failed to create error response:', responseError)
      // Last resort - return a simple error
      return new Response(`Internal Server Error: ${error instanceof Error ? error.message : 'Unknown'}`, { status: 500 })
    }
  }
} 