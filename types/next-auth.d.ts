import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      userId: string
      username?: string
      name?: string | null
      email?: string | null
      image?: string | null
      role?: {
        id: string
        name: string
        displayName: string
        color?: string | null
      }
    }
  }

  interface User {
    id: string
    userId: string
    username?: string
    name?: string | null
    email?: string | null
    image?: string | null
    role?: {
      id: string
      name: string
      displayName: string
      color?: string | null
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string
    userId?: string
    username?: string
    role?: {
      id: string
      name: string
      displayName: string
      color?: string | null
    }
  }
}