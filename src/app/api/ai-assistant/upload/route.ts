import { NextRequest, NextResponse } from 'next/server'
import { processPDFDocument } from '@/lib/pdf-processor'
import { extractTextFromDocx } from '@/lib/docx-processor'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain'
    ]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Only PDF, DOCX, or TXT files are allowed.' }, { status: 400 })
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Maximum size is 10MB' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    let extractedText = ''

    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      // Use existing PDF processor, get all text
      const docs = await processPDFDocument(buffer, file.name, 'anonymous', 'comparison-upload', [])
      extractedText = docs.map(doc => doc.content || '').join('\n\n')
    } else if (
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.type === 'application/msword' ||
      file.name.endsWith('.docx')
    ) {
      extractedText = await extractTextFromDocx(buffer)
    } else if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      extractedText = buffer.toString('utf-8')
    } else {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })
    }

    if (!extractedText.trim()) {
      return NextResponse.json({ error: 'No text could be extracted from the file.' }, { status: 400 })
    }

    return NextResponse.json({ text: extractedText })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to process file', details: String(err) }, { status: 500 })
  }
} 