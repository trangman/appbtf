import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { supabaseDb } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

// Only allow admins
async function requireAdmin(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return session
}

export async function GET(request: NextRequest) {
  const session = await requireAdmin(request)
  if (!session || session.error) return session
  const useSupabaseApi = process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_SUPABASE_URL
  try {
    let users
    if (useSupabaseApi) {
      users = await supabaseDb.getAllUsers()
    } else {
      users = await prisma.user.findMany({})
    }
    return NextResponse.json(users)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await requireAdmin(request)
  if (!session || session.error) return session
  const useSupabaseApi = process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_SUPABASE_URL
  try {
    const data = await request.json()
    let user
    if (data.password && data.password.trim() !== '') {
      data.password = await bcrypt.hash(data.password, 10)
    }
    if (useSupabaseApi) {
      user = await supabaseDb.createUser(data)
    } else {
      user = await prisma.user.create({ data })
    }
    return NextResponse.json(user)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const session = await requireAdmin(request)
  if (!session || session.error) return session
  const useSupabaseApi = process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_SUPABASE_URL
  try {
    const { id, password, ...data } = await request.json()
    let user
    let updateData: any = { ...data }
    if (password && password.trim() !== '') {
      updateData.password = await bcrypt.hash(password, 10)
    }
    if (useSupabaseApi) {
      user = await supabaseDb.updateUser(id, updateData)
    } else {
      user = await prisma.user.update({ where: { id }, data: updateData })
    }
    return NextResponse.json(user)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const session = await requireAdmin(request)
  if (!session || session.error) return session
  const useSupabaseApi = process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_SUPABASE_URL
  try {
    const { id } = await request.json()
    let result
    if (useSupabaseApi) {
      result = await supabaseDb.deleteUser(id)
    } else {
      result = await prisma.user.delete({ where: { id } })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
} 