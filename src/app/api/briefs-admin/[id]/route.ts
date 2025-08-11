import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { supabaseDb } from '@/lib/supabase'
import type { Session } from 'next-auth'

// Determine if we should use Supabase API (for production/serverless environments)
const useSupabaseApi = process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_SUPABASE_URL

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions) as Session | null
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const user = session.user as { isAdmin?: boolean; email?: string }
    if (!user?.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { id } = params
    const body = await request.json()
    const { title, slug, description, content, targetRoles, isPublished } = body

    // Validate required fields
    if (!title || !slug || !content || !targetRoles || !Array.isArray(targetRoles)) {
      return NextResponse.json(
        { error: 'Missing required fields: title, slug, content, targetRoles' },
        { status: 400 }
      )
    }

    // Validate targetRoles
    const validRoles = ['BUYER', 'ACCOUNTANT', 'LAWYER', 'EXISTING_PROPERTY_OWNER', 'PROFESSOR']
    const invalidRoles = targetRoles.filter(role => !validRoles.includes(role))
    if (invalidRoles.length > 0) {
      return NextResponse.json(
        { error: `Invalid roles: ${invalidRoles.join(', ')}` },
        { status: 400 }
      )
    }

    let updatedBrief

    if (useSupabaseApi) {
      // Use Supabase API for production/serverless environments
      console.log('Using Supabase API for brief update')
      
      // Check if brief exists
      const existingBrief = await supabaseDb.getBriefById(id)

      if (!existingBrief) {
        return NextResponse.json(
          { error: 'Brief not found' },
          { status: 404 }
        )
      }

      updatedBrief = await supabaseDb.updateBrief(id, {
        title,
        slug,
        description,
        content,
        targetRoles,
        isPublished: Boolean(isPublished)
      })
    } else {
      // Use Prisma for local development
      console.log('Using Prisma for brief update')
      
      // Check if brief exists
      const existingBrief = await prisma.brief.findUnique({
        where: { id }
      })

      if (!existingBrief) {
        return NextResponse.json(
          { error: 'Brief not found' },
          { status: 404 }
        )
      }

      updatedBrief = await prisma.brief.update({
        where: { id },
        data: {
          title,
          slug,
          description: description || null,
          content,
          targetRoles,
          isPublished: Boolean(isPublished),
        },
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          content: true,
          targetRoles: true,
          isPublished: true,
          createdAt: true,
          updatedAt: true,
        }
      })
    }

    return NextResponse.json({ brief: updatedBrief })
  } catch (error) {
    console.error('Error updating brief:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions) as Session | null
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const user = session.user as { isAdmin?: boolean; email?: string }
    if (!user?.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { id } = params

    if (useSupabaseApi) {
      // Use Supabase API for production/serverless environments
      console.log('Using Supabase API for brief deletion')
      
      // Check if brief exists
      const existingBrief = await supabaseDb.getBriefById(id)

      if (!existingBrief) {
        return NextResponse.json(
          { error: 'Brief not found' },
          { status: 404 }
        )
      }

      await supabaseDb.deleteBrief(id)
    } else {
      // Use Prisma for local development
      console.log('Using Prisma for brief deletion')
      
      // Check if brief exists
      const existingBrief = await prisma.brief.findUnique({
        where: { id }
      })

      if (!existingBrief) {
        return NextResponse.json(
          { error: 'Brief not found' },
          { status: 404 }
        )
      }

      await prisma.brief.delete({
        where: { id }
      })
    }

    return NextResponse.json({ message: 'Brief deleted successfully' })
  } catch (error) {
    console.error('Error deleting brief:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 