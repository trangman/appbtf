import bcrypt from 'bcryptjs'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

/**
 * Check if the current user is an admin
 * Returns the session if admin, null otherwise
 */
export async function requireAdmin() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return null
  }
  
  const user = session.user as any
  if (!user || !user.isAdmin) {
    return null
  }
  
  return session
}

/**
 * Check if the current user is authenticated
 * Returns the session if authenticated, null otherwise
 */
export async function requireAuth() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return null
  }
  
  const user = session.user as any
  if (!user) {
    return null
  }
  
  return session
} 