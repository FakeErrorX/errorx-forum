import { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { prisma } from "./prisma"
import bcrypt from "bcryptjs"
import { generateUniqueUsername } from "./username-generator"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
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
          id: (user as { userId: number }).userId.toString(), // Use custom userId as the session ID
          email: user.email,
          name: user.name,
          image: user.image,
        }
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // For OAuth providers, we need to get the user's custom userId
      if (account?.provider === "google") {
        // Find user by email to get their custom userId
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email! },
          select: { userId: true, username: true }
        });
        
        if (dbUser) {
          // User exists, use their custom userId
          user.id = (dbUser as { userId: number }).userId.toString();
        } else {
          // User doesn't exist, PrismaAdapter will create them
          // We'll handle username generation in the JWT callback after user creation
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        // For OAuth providers, we need to ensure we have the custom userId
        if (account?.provider === "google") {
          // Always fetch the userId from database for OAuth users
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email! },
            select: { userId: true, username: true }
          });
          
          if (dbUser) {
            // Check if user needs a username generated
            if (!dbUser.username) {
              try {
                const generatedUsername = await generateUniqueUsername(user.name, user.email!);
                await prisma.user.update({
                  where: { email: user.email! },
                  data: { username: generatedUsername }
                });
                console.log(`Generated username "${generatedUsername}" for user ${user.email}`);
              } catch (error) {
                console.error('Failed to generate username for Google OAuth user:', error);
              }
            }
            
            token.id = (dbUser as { userId: number }).userId.toString()
            token.userId = (dbUser as { userId: number }).userId.toString()
          }
        } else {
          // Credentials provider - user.id is already the userId
          token.id = user.id
          token.userId = user.id
        }
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as { id: string }).id = token.id as string // Custom userId      
        (session.user as { userId: string }).userId = token.userId as string // Also expose as userId
      }
      return session
    },
  },
  pages: {
    signIn: "/signin",
  },
}
