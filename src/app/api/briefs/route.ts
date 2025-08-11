import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { supabaseDb } from '@/lib/supabase'
import type { Session } from 'next-auth'
import type { UserRole } from '@prisma/client'

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

    const userRole = session.user.role as UserRole

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

export async function POST(request: NextRequest) {
  try {
    console.log('Creating new brief...')
    const session = await getServerSession(authOptions) as Session | null
    
    if (!session) {
      console.log('No session found for brief creation')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const user = session.user as { isAdmin?: boolean; email?: string }
    if (!user?.isAdmin) {
      console.log('Non-admin user attempted to create brief:', user?.email)
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { title, slug, description, content, targetRoles, isPublished } = body

    console.log('Brief creation data:', { title, slug, targetRoles, isPublished })

    // Validate required fields
    if (!title || !slug || !content || !targetRoles || !Array.isArray(targetRoles)) {
      return NextResponse.json(
        { error: 'Missing required fields: title, slug, content, targetRoles' },
        { status: 400 }
      )
    }

    // Validate target roles
    const validRoles = ['BUYER', 'ACCOUNTANT', 'LAWYER', 'EXISTING_PROPERTY_OWNER', 'PROFESSOR']
    const invalidRoles = targetRoles.filter(role => !validRoles.includes(role))
    if (invalidRoles.length > 0) {
      return NextResponse.json(
        { error: `Invalid target roles: ${invalidRoles.join(', ')}` },
        { status: 400 }
      )
    }

    let newBrief

    if (useSupabaseApi) {
      // Use Supabase API for production/serverless environments
      console.log('Using Supabase API for brief creation')
      newBrief = await supabaseDb.createBrief({
        title,
        slug,
        description: description || '',
        content,
        targetRoles,
        isPublished: isPublished || false
      })
    } else {
      // Use Prisma for local development
      console.log('Using Prisma for brief creation')
      newBrief = await prisma.brief.create({
        data: {
          title,
          slug,
          description: description || '',
          content,
          targetRoles,
          isPublished: isPublished || false
        }
      })
    }

    console.log('Brief created successfully:', newBrief.id)
    return NextResponse.json({ 
      message: 'Brief created successfully',
      brief: newBrief 
    })

  } catch (error) {
    console.error('Error creating brief:', error)
    
    // Handle duplicate slug error
    if (error instanceof Error && error.message.includes('unique constraint')) {
      return NextResponse.json(
        { error: 'A brief with this slug already exists' },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create brief' },
      { status: 500 }
    )
  }
} 