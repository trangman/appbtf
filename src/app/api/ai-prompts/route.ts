import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { supabaseDb } from '@/lib/supabase'
import type { Session } from 'next-auth'

// Determine if we should use Supabase API (for production/serverless environments)
const useSupabaseApi = process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_SUPABASE_URL

// GET - Fetch all AI prompts or by role
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user as { id: string; email: string; name: string; role: string; isAdmin: boolean }
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')
    const activeOnly = searchParams.get('activeOnly') === 'true'

    let prompts

    if (useSupabaseApi) {
      // Use Supabase API for production/serverless environments
      console.log('Using Supabase API for AI prompts fetching')
      prompts = await supabaseDb.getAIPrompts(role || undefined, activeOnly)
    } else {
      // Use Prisma for local development
      console.log('Using Prisma for AI prompts fetching')
      const whereClause: any = {}
      if (role) {
        whereClause.role = role as any // Cast to UserRole enum
      }
      if (activeOnly) {
        whereClause.isActive = true
      }

      prompts = await prisma.aIPrompt.findMany({
        where: whereClause,
        orderBy: [
          { role: 'asc' },
          { isActive: 'desc' },
          { updatedAt: 'desc' }
        ]
      })
    }

    return NextResponse.json({ prompts })

  } catch (error) {
    console.error('Error fetching AI prompts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create a new AI prompt
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user as { id: string; email: string; name: string; role: string; isAdmin: boolean }
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { role, title, systemPrompt, description, version, isActive } = body

    if (!role || !title || !systemPrompt) {
      return NextResponse.json(
        { error: 'Role, title, and systemPrompt are required' },
        { status: 400 }
      )
    }

    let newPrompt

    if (useSupabaseApi) {
      // Use Supabase API for production/serverless environments
      console.log('Using Supabase API for AI prompt creation')
      newPrompt = await supabaseDb.createAIPrompt({
        role,
        title,
        systemPrompt,
        description,
        version: version || '1.0',
        isActive: isActive !== undefined ? isActive : true,
        createdBy: user.id
      })
    } else {
      // Use Prisma for local development
      console.log('Using Prisma for AI prompt creation')
      // If setting this as active, deactivate other prompts for this role
      if (isActive) {
        await prisma.aIPrompt.updateMany({
          where: { role: role, isActive: true },
          data: { isActive: false }
        })
      }

      newPrompt = await prisma.aIPrompt.create({
        data: {
          role,
          title,
          systemPrompt,
          description,
          version: version || '1.0',
          isActive: isActive !== undefined ? isActive : true,
          createdBy: user.id
        }
      })
    }

    return NextResponse.json({
      message: 'AI prompt created successfully',
      prompt: newPrompt
    })

  } catch (error) {
    console.error('Error creating AI prompt:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update an existing AI prompt
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user as { id: string; email: string; name: string; role: string; isAdmin: boolean }
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { id, title, systemPrompt, description, version, isActive } = body

    if (!id) {
      return NextResponse.json({ error: 'Prompt ID is required' }, { status: 400 })
    }

    let updatedPrompt

    if (useSupabaseApi) {
      // Use Supabase API for production/serverless environments
      console.log('Using Supabase API for AI prompt update')
      updatedPrompt = await supabaseDb.updateAIPrompt(id, {
        ...(title && { title }),
        ...(systemPrompt && { systemPrompt }),
        ...(description !== undefined && { description }),
        ...(version && { version }),
        ...(isActive !== undefined && { isActive }),
        createdBy: user.id
      })
    } else {
      // Use Prisma for local development
      console.log('Using Prisma for AI prompt update')
      // Check if prompt exists
      const existingPrompt = await prisma.aIPrompt.findUnique({
        where: { id }
      })

      if (!existingPrompt) {
        return NextResponse.json({ error: 'Prompt not found' }, { status: 404 })
      }

      // If setting this as active, deactivate other prompts for this role
      if (isActive) {
        await prisma.aIPrompt.updateMany({
          where: { 
            role: existingPrompt.role, 
            isActive: true,
            id: { not: id }
          },
          data: { isActive: false }
        })
      }

      updatedPrompt = await prisma.aIPrompt.update({
        where: { id },
        data: {
          ...(title && { title }),
          ...(systemPrompt && { systemPrompt }),
          ...(description !== undefined && { description }),
          ...(version && { version }),
          ...(isActive !== undefined && { isActive }),
          createdBy: user.id
        }
      })
    }

    return NextResponse.json({
      message: 'AI prompt updated successfully',
      prompt: updatedPrompt
    })

  } catch (error) {
    console.error('Error updating AI prompt:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete an AI prompt
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user as { id: string; email: string; name: string; role: string; isAdmin: boolean }
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Prompt ID is required' }, { status: 400 })
    }

    if (useSupabaseApi) {
      // Use Supabase API for production/serverless environments
      console.log('Using Supabase API for AI prompt deletion')
      await supabaseDb.deleteAIPrompt(id)
    } else {
      // Use Prisma for local development
      console.log('Using Prisma for AI prompt deletion')
      const existingPrompt = await prisma.aIPrompt.findUnique({
        where: { id }
      })

      if (!existingPrompt) {
        return NextResponse.json({ error: 'Prompt not found' }, { status: 404 })
      }

      await prisma.aIPrompt.delete({
        where: { id }
      })
    }

    return NextResponse.json({ message: 'AI prompt deleted successfully' })

  } catch (error) {
    console.error('Error deleting AI prompt:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 