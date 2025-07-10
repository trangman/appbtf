import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { supabaseDb } from '@/lib/supabase'
import type { Session } from 'next-auth'
import { UserRole } from '@prisma/client'

// Determine if we should use Supabase API (for production/serverless environments)
const useSupabaseApi = process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_SUPABASE_URL

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { name, role } = await request.json()

    // Validate required fields
    if (!name || !role) {
      return NextResponse.json(
        { error: 'Name and role are required' },
        { status: 400 }
      )
    }

    // Validate role is a valid UserRole
    if (!Object.values(UserRole).includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role specified' },
        { status: 400 }
      )
    }

    let updatedUser

    if (useSupabaseApi) {
      // Use Supabase API for production/serverless environments
      console.log('Using Supabase API for profile update')
      updatedUser = await supabaseDb.updateUser(session.user.id, {
        name,
        role,
      })
    } else {
      // Use Prisma for local development
      console.log('Using Prisma for profile update')
      updatedUser = await prisma.user.update({
        where: {
          id: session.user.id,
        },
        data: {
          name,
          role,
          updatedAt: new Date(),
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          updatedAt: true,
        }
      })
    }

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: updatedUser
    })

  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 