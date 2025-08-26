import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { supabaseDb } from '@/lib/supabase'
import { hashPassword } from '@/lib/auth'
import { UserRole } from '@prisma/client'

// Determine if we should use Supabase API (for production/serverless environments)
const useSupabaseApi = process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_SUPABASE_URL

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, role } = await request.json()

    // Validate required fields
    if (!email || !password || !role) {
      return NextResponse.json(
        { error: 'Email, password, and role are required' },
        { status: 400 }
      )
    }

    // Validate role
    const validRoles = ['BUYER', 'ACCOUNTANT', 'LAWYER', 'EXISTING_PROPERTY_OWNER', 'PROFESSOR']
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role selected' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    if (useSupabaseApi) {
      // Use Supabase API for production/serverless environments
      console.log('Using Supabase API for user registration')
      
      // Check if user already exists
      const existingUser = await supabaseDb.findUserByEmail(email)
      
      if (existingUser) {
        return NextResponse.json(
          { error: 'User with this email already exists' },
          { status: 409 }
        )
      }

      // Create user using Supabase API
      const user = await supabaseDb.createUser({
        email,
        hashedPassword,
        name: name || undefined,
        role,
      })

      return NextResponse.json(
        { 
          message: 'User created successfully', 
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            createdAt: user.createdAt,
          }
        },
        { status: 201 }
      )
    } else {
      // Use Prisma for local development
      console.log('Using Prisma for user registration')
      
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      })

      if (existingUser) {
        return NextResponse.json(
          { error: 'User with this email already exists' },
          { status: 409 }
        )
      }

      // Create user using Prisma
      const user = await prisma.user.create({
        data: {
          email,
          hashedPassword,
          name: name || null,
          role: role as UserRole,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        }
      })

      return NextResponse.json(
        { message: 'User created successfully', user },
        { status: 201 }
      )
    }
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 