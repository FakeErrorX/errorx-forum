import { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import GitHubProvider from "next-auth/providers/github"
import { prisma } from "./prisma"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email or Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // Check if the input is an email or username
        const isEmail = credentials.email.includes('@')
        
        let user = null
        if (isEmail) {
          // Search by email
          user = await prisma.user.findUnique({
            where: {
              email: credentials.email
            }
          })
        } else {
          // Search by username (case-insensitive)
          user = await prisma.user.findFirst({
            where: {
              username: {
                equals: credentials.email,
                mode: 'insensitive'
              }
            }
          })
        }

        if (!user) {
          return null
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(credentials.password, user.password || "")
        
        if (!isPasswordValid) {
          return null
        }

        return {
          id: (user as any).userId.toString(), // Use custom userId as the session ID
          email: user.email,
          name: user.name,
          image: user.image,
        }
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // For OAuth providers, we need to get the user's custom userId
      if (account?.provider === "google" || account?.provider === "github") {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email! },
          select: { userId: true } as any
        });
        if (dbUser) {
          user.id = (dbUser as any).userId.toString();
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id // This will be our custom userId
        token.userId = user.id // Store as userId for clarity
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id as string // Custom userId
        (session.user as any).userId = token.userId as string // Also expose as userId
      }
      return session
    },
  },
  pages: {
    signIn: "/signin",
  },
}
