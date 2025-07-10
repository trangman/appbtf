import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { supabaseDb } from '@/lib/supabase'
import type { Session } from 'next-auth'

// Determine if we should use Supabase API (for production/serverless environments)
const useSupabaseApi = process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_SUPABASE_URL

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions) as Session | null
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userRole = session.user.role
    const { slug } = await params

    let brief

    if (useSupabaseApi) {
      // Use Supabase API for production/serverless environments
      console.log('Using Supabase API for brief detail fetching')
      brief = await supabaseDb.getBriefBySlug(slug)
      
      // Check if user has access to this brief
      if (brief && (!brief.targetRoles.includes(userRole) || !brief.isPublished)) {
        brief = null
      }
    } else {
      // Use Prisma for local development
      console.log('Using Prisma for brief detail fetching')
      brief = await prisma.brief.findUnique({
        where: {
          slug: slug,
          isPublished: true,
          targetRoles: {
            has: userRole
          }
        }
      })
    }

    if (!brief) {
      return NextResponse.json(
        { error: 'Brief not found or access denied' },
        { status: 404 }
      )
    }

    return NextResponse.json({ brief })
  } catch (error) {
    console.error('Error fetching brief:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 