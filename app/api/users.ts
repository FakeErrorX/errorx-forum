import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export interface UserProfile {
  id: string;
  name: string | null;
  username: string | null;
  email: string;
  image: string | null;
  bio: string | null;
  postCount: number;
  reputation: number;
  isActive: boolean;
  preferences: {
    theme: 'light' | 'dark' | 'system';
    notifications: boolean;
    emailUpdates: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserData {
  name: string;
  username: string;
  email: string;
  password: string;
  image?: string;
  bio?: string;
}

/**
 * Create a new user profile in the database
 */
export async function createUser(userData: CreateUserData): Promise<UserProfile> {
  try {
    const hashedPassword = await bcrypt.hash(userData.password, 12);
    
    const userProfile = await prisma.user.create({
      data: {
        name: userData.name,
        username: userData.username,
        email: userData.email,
        image: userData.image || null,
        bio: userData.bio || null,
        postCount: 0,
        reputation: 0,
        isActive: true,
        preferences: {
          theme: 'system',
          notifications: true,
          emailUpdates: true
        },
        // Store password in a custom field (you might want to use a separate table)
        password: hashedPassword,
      }
    });

    return userProfile as UserProfile;
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw new Error(`Failed to create user profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get user profile by user ID
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return null;
    }

    return user as UserProfile;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
}

/**
 * Get user profile by email
 */
export async function getUserByEmail(email: string): Promise<UserProfile | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return null;
    }

    return user as UserProfile;
  } catch (error) {
    console.error('Error getting user by email:', error);
    return null;
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string, 
  updates: Partial<Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<UserProfile> {
  try {
    const result = await prisma.user.update({
      where: { id: userId },
      data: updates
    });

    return result as UserProfile;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw new Error('Failed to update user profile');
  }
}

/**
 * Check if user profile exists
 */
export async function userProfileExists(userId: string): Promise<boolean> {
  try {
    const profile = await getUserProfile(userId);
    return profile !== null;
  } catch (error) {
    console.error('Error checking user profile existence:', error);
    return false;
  }
}

/**
 * Check if email is already in use
 */
export async function emailExists(email: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { email }
    });
    return user !== null;
  } catch (error) {
    console.error('Error checking email existence:', error);
    return false;
  }
}

/**
 * Check if username is already in use
 */
export async function usernameExists(username: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { username }
    });
    return user !== null;
  } catch (error) {
    console.error('Error checking username existence:', error);
    return false;
  }
}

/**
 * Increment user's post count
 */
export async function incrementUserPostCount(userId: string): Promise<void> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { postCount: { increment: 1 } }
    });
  } catch (error) {
    console.error('Error incrementing user post count:', error);
    throw new Error('Failed to increment post count');
  }
}

/**
 * Update user reputation
 */
export async function updateUserReputation(userId: string, reputationChange: number): Promise<void> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { 
        reputation: { 
          increment: reputationChange 
        } 
      }
    });
  } catch (error) {
    console.error('Error updating user reputation:', error);
    throw new Error('Failed to update reputation');
  }
}

/**
 * Verify user password
 */
export async function verifyPassword(email: string, password: string): Promise<UserProfile | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user || !user.password) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return null;
    }

    return user as UserProfile;
  } catch (error) {
    console.error('Error verifying password:', error);
    return null;
  }
}

/**
 * Update user password
 */
export async function updatePassword(userId: string, newPassword: string): Promise<void> {
  try {
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });
  } catch (error) {
    console.error('Error updating password:', error);
    throw new Error('Failed to update password');
  }
}
