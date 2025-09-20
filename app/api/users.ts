import { prisma } from "@/lib/prisma"

// Extended Prisma user type that includes custom fields
interface PrismaUserWithCustomFields {
  id: string;
  userId: number;
  name: string | null;
  username: string | null;
  email: string;
  image: string | null;
  bio: string | null;
  postCount: number;
  reputation: number;
  isActive: boolean;
  preferences: Record<string, unknown>;
  lastUsernameChangeAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  userId: number; // Custom sequential user ID (only public ID)
  name: string | null;
  username: string | null;
  email: string;
  image: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  birthday: string | null;
  timezone: string | null;
  socialLinks: {
    twitter?: string;
    github?: string;
    linkedin?: string;
    discord?: string;
    instagram?: string;
    youtube?: string;
  };
  interests: string[];
  skills: string[];
  postCount: number;
  reputation: number;
  isActive: boolean;
  preferences: {
    theme: 'light' | 'dark' | 'system';
    notifications: boolean;
    emailUpdates: boolean;
  };
  lastUsernameChangeAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserData {
  name: string;
  username: string;
  email: string;
  image?: string;
  bio?: string;
}

/**
 * Create a new user profile in the database (Google OAuth only)
 * This function is now primarily used for Google OAuth user creation
 */
export async function createUser(userData: CreateUserData): Promise<UserProfile> {
  try {
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
        }
      }
    });

    const { id, ...userWithoutId } = userProfile;
    return {
      ...userWithoutId,
      birthday: null,
      location: null,
      website: null,
      timezone: null,
      socialLinks: {},
      interests: [],
      skills: [],
      preferences: (userProfile as PrismaUserWithCustomFields).preferences as {
        theme: 'light' | 'dark' | 'system';
        notifications: boolean;
        emailUpdates: boolean;
      }
    } as UserProfile;
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
      where: { id: userId },
      select: {
        id: true,
        userId: true,
        name: true,
        username: true,
        email: true,
        image: true,
        bio: true,
        location: true,
        website: true,
        birthday: true,
        timezone: true,
        postCount: true,
        reputation: true,
        isActive: true,
        preferences: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return null;
    }

    // Get extended profile data if it exists
    const extendedProfile = await prisma.userProfile.findUnique({
      where: { userId: userId },
      select: {
        socialLinks: true,
        interests: true,
        skills: true,
      }
    });

    const { id, ...userWithoutId } = user;
    return {
      ...userWithoutId,
      birthday: user.birthday ? user.birthday.toISOString() : null,
      socialLinks: (extendedProfile?.socialLinks as any) || {},
      interests: extendedProfile?.interests || [],
      skills: extendedProfile?.skills || [],
      preferences: ((user as PrismaUserWithCustomFields).preferences || {}) as {
        theme: 'light' | 'dark' | 'system';
        notifications: boolean;
        emailUpdates: boolean;
      }
    } as UserProfile;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
}

export async function getUserProfileByCustomId(customUserId: number): Promise<UserProfile | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { userId: customUserId },
      select: {
        id: true,
        userId: true,
        name: true,
        username: true,
        email: true,
        image: true,
        bio: true,
        location: true,
        website: true,
        birthday: true,
        timezone: true,
        postCount: true,
        reputation: true,
        isActive: true,
        preferences: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return null;
    }

    // Get extended profile data if it exists
    const extendedProfile = await prisma.userProfile.findUnique({
      where: { userId: user.id },
      select: {
        socialLinks: true,
        interests: true,
        skills: true,
      }
    });

    const { id, ...userWithoutId } = user;
    return {
      ...userWithoutId,
      birthday: user.birthday ? user.birthday.toISOString() : null,
      socialLinks: (extendedProfile?.socialLinks as any) || {},
      interests: extendedProfile?.interests || [],
      skills: extendedProfile?.skills || [],
      preferences: ((user as PrismaUserWithCustomFields).preferences || {}) as {
        theme: 'light' | 'dark' | 'system';
        notifications: boolean;
        emailUpdates: boolean;
      }
    } as UserProfile;
  } catch (error) {
    console.error('Error getting user profile by custom ID:', error);
    return null;
  }
}

/**
 * Get user profile by email
 */
export async function getUserByEmail(email: string): Promise<UserProfile | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        userId: true,
        name: true,
        username: true,
        email: true,
        image: true,
        bio: true,
        location: true,
        website: true,
        birthday: true,
        timezone: true,
        postCount: true,
        reputation: true,
        isActive: true,
        preferences: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return null;
    }

    // Get extended profile data if it exists
    const extendedProfile = await prisma.userProfile.findUnique({
      where: { userId: user.id },
      select: {
        socialLinks: true,
        interests: true,
        skills: true,
      }
    });

    const { id, ...userWithoutId } = user;
    return {
      ...userWithoutId,
      birthday: user.birthday ? user.birthday.toISOString() : null,
      socialLinks: (extendedProfile?.socialLinks as any) || {},
      interests: extendedProfile?.interests || [],
      skills: extendedProfile?.skills || [],
      preferences: ((user as PrismaUserWithCustomFields).preferences || {}) as {
        theme: 'light' | 'dark' | 'system';
        notifications: boolean;
        emailUpdates: boolean;
      }
    } as UserProfile;
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
    // Separate updates for User model and UserProfile model
    const { socialLinks, interests, skills, birthday, ...userUpdates } = updates;
    
    // Update User model
    const userUpdateData: any = { ...userUpdates };
    if (birthday !== undefined) {
      userUpdateData.birthday = birthday ? new Date(birthday) : null;
    }
    
    const result = await prisma.user.update({
      where: { id: userId },
      data: userUpdateData,
      select: {
        id: true,
        userId: true,
        name: true,
        username: true,
        email: true,
        image: true,
        bio: true,
        location: true,
        website: true,
        birthday: true,
        timezone: true,
        postCount: true,
        reputation: true,
        isActive: true,
        preferences: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Update or create UserProfile if extended fields are provided
    if (socialLinks !== undefined || interests !== undefined || skills !== undefined) {
      const profileData: any = {};
      if (socialLinks !== undefined) profileData.socialLinks = socialLinks;
      if (interests !== undefined) profileData.interests = interests;
      if (skills !== undefined) profileData.skills = skills;

      await prisma.userProfile.upsert({
        where: { userId: userId },
        update: profileData,
        create: {
          userId: userId,
          ...profileData,
        }
      });
    }

    // Get updated extended profile data
    const extendedProfile = await prisma.userProfile.findUnique({
      where: { userId: userId },
      select: {
        socialLinks: true,
        interests: true,
        skills: true,
      }
    });

    const { id, ...userWithoutId } = result;
    return {
      ...userWithoutId,
      birthday: result.birthday ? result.birthday.toISOString() : null,
      socialLinks: (extendedProfile?.socialLinks as any) || {},
      interests: extendedProfile?.interests || [],
      skills: extendedProfile?.skills || [],
      preferences: ((result as PrismaUserWithCustomFields).preferences || {}) as {
        theme: 'light' | 'dark' | 'system';
        notifications: boolean;
        emailUpdates: boolean;
      }
    } as UserProfile;
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
