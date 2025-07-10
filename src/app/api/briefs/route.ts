import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { supabaseDb } from '@/lib/supabase'
import type { Session } from 'next-auth'

// Determine if we should use Supabase API (for production/serverless environments)
const useSupabaseApi = process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_SUPABASE_URL

export async function GET() {
  try {
    const session = await getServerSession(authOptions) as Session | null
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userRole = session.user.role

    let briefs

    if (useSupabaseApi) {
      // Use Supabase API for production/serverless environments
      console.log('Using Supabase API for briefs fetching')
      briefs = await supabaseDb.getBriefs(userRole)
    } else {
      // Use Prisma for local development
      console.log('Using Prisma for briefs fetching')
      briefs = await prisma.brief.findMany({
        where: {
          isPublished: true,
          targetRoles: {
            has: userRole
          }
        },
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          targetRoles: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
    }

    return NextResponse.json({ briefs })
  } catch (error) {
    console.error('Error fetching briefs:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 