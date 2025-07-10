declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      role: string
      isAdmin: boolean
    }
  }

  interface User {
    id: string
    email: string
    name?: string | null
    role: string
    isAdmin: boolean
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: string
    isAdmin: boolean
  }
} 