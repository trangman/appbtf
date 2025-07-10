import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { supabaseDb } from '@/lib/supabase'
import type { Session } from 'next-auth'

// Determine if we should use Supabase API (for production/serverless environments)
const useSupabaseApi = process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_SUPABASE_URL

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { name, email, subject, message } = await request.json()

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required' },
        { status: 400 }
      )
    }

    let submission

    if (useSupabaseApi) {
      // Use Supabase API for production/serverless environments
      console.log('Using Supabase API for contact submission')
      submission = await supabaseDb.createContactSubmission({
        name,
        email,
        subject,
        message,
        userId: session.user.id,
      })
    } else {
      // Use Prisma for local development
      console.log('Using Prisma for contact submission')
      submission = await prisma.contactSubmission.create({
        data: {
          name,
          email,
          subject: subject || null,
          message,
          userId: session.user.id,
        }
      })
    }

    return NextResponse.json(
      { message: 'Contact form submitted successfully', submission: { id: submission.id } },
      { status: 201 }
    )
  } catch (error) {
    console.error('Contact form submission error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 