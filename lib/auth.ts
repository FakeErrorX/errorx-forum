import { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import GoogleProvider from "next-auth/providers/google"
import { prisma } from "./prisma"
import { generateUniqueUsername } from "./username-generator"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
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
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  events: {
    async createUser({ user }) {
      // Set the default roleId for new users after they are created
      try {
        const memberRole = await prisma.role.findUnique({
          where: { name: 'member' },
          select: { id: true }
        });
        
        if (memberRole) {
          await prisma.user.update({
            where: { id: user.id },
            data: { roleId: memberRole.id }
          });
        }
        
        console.log(`Set role for new user: ${user.email}`);
      } catch (error) {
        console.error('Failed to set user role:', error);
      }
    },
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Only allow Google OAuth sign-ins
      if (account?.provider === "google") {
        return true; // Let PrismaAdapter handle user creation/lookup
      }
      return true;
    },
    async jwt({ token, user, account }) {
      // This callback is only used during sign in process when using database sessions
      if (user && account?.provider === "google") {
        // Check if user needs a username generated
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { username: true }
        });
        
        if (dbUser && !dbUser.username) {
          try {
            const generatedUsername = await generateUniqueUsername(user.name, user.email!);
            await prisma.user.update({
              where: { id: user.id },
              data: { username: generatedUsername }
            });
            console.log(`Generated username "${generatedUsername}" for user ${user.email}`);
          } catch (error) {
            console.error('Failed to generate username for Google OAuth user:', error);
          }
        }
      }
      return token;
    },
    async session({ session, user }) {
      if (user && session.user) {
        // Get user data from database including role
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { 
            userId: true, 
            username: true,
            image: true,
            bio: true,
            role: {
              select: {
                id: true,
                name: true,
                displayName: true,
                color: true
              }
            }
          }
        });
        
        if (dbUser) {
          (session.user as { id: string }).id = user.id; // Internal UUID
          (session.user as { userId: string }).userId = dbUser.userId.toString(); // Custom sequential ID
          (session.user as { username?: string }).username = dbUser.username || undefined;
          session.user.image = dbUser.image || session.user.image;
          type RoleShape = { id: string; name: string; displayName: string; color?: string | null };
          (session.user as { role?: RoleShape }).role = dbUser.role as RoleShape | undefined;
          (session.user as { bio?: string }).bio = dbUser.bio || undefined;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/signin",
  },
}
