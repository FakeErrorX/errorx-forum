import { PrismaClient, User } from '@prisma/client';
import { prisma } from './prisma';
// import bcrypt from 'bcrypt'; // Commented out until package is installed
import crypto from 'crypto';

// Define enum types to match schema
export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  BANNED = 'BANNED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  DEACTIVATED = 'DEACTIVATED'
}

export enum VerificationStatus {
  UNVERIFIED = 'UNVERIFIED',
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED'
}

export enum VerificationType {
  EMAIL = 'EMAIL',
  PHONE = 'PHONE',
  IDENTITY = 'IDENTITY',
  EXPERT = 'EXPERT',
  ORGANIZATION = 'ORGANIZATION'
}

export enum BanType {
  TEMPORARY = 'TEMPORARY',
  PERMANENT = 'PERMANENT',
  IP_BAN = 'IP_BAN',
  SHADOW_BAN = 'SHADOW_BAN'
}

export enum WarningType {
  MINOR = 'MINOR',
  MAJOR = 'MAJOR',
  SEVERE = 'SEVERE',
  FINAL = 'FINAL'
}

export enum UserActivityType {
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  POST_CREATED = 'POST_CREATED',
  COMMENT_CREATED = 'COMMENT_CREATED',
  PROFILE_UPDATED = 'PROFILE_UPDATED',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  EMAIL_CHANGED = 'EMAIL_CHANGED',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  ACCOUNT_UNLOCKED = 'ACCOUNT_UNLOCKED',
  SUSPENSION = 'SUSPENSION',
  BAN = 'BAN',
  WARNING_ISSUED = 'WARNING_ISSUED',
  REPUTATION_CHANGED = 'REPUTATION_CHANGED'
}

export class UserManagementService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  // User Profile Management
  async createUserProfile(userId: string, profileData: {
    displayName?: string;
    firstName?: string;
    lastName?: string;
    dateOfBirth?: Date;
    gender?: string;
    phoneNumber?: string;
    address?: any;
    socialLinks?: any;
    interests?: string[];
    skills?: string[];
    education?: any;
    experience?: any;
    certifications?: any;
    languages?: string[];
    timezone?: string;
    isPublic?: boolean;
    showOnline?: boolean;
    allowMessages?: boolean;
    allowFollows?: boolean;
  }) {
    return await (this.prisma as any).userProfile.create({
      data: {
        userId,
        ...profileData,
        interests: profileData.interests || [],
        skills: profileData.skills || [],
        languages: profileData.languages || [],
        socialLinks: profileData.socialLinks || {},
        isPublic: profileData.isPublic ?? true,
        showOnline: profileData.showOnline ?? true,
        allowMessages: profileData.allowMessages ?? true,
        allowFollows: profileData.allowFollows ?? true,
      },
    });
  }

  async updateUserProfile(userId: string, updates: Partial<any>) {
    return await (this.prisma as any).userProfile.upsert({
      where: { userId },
      update: updates,
      create: {
        userId,
        ...updates,
      },
    });
  }

  async getUserProfile(userId: string) {
    return await (this.prisma as any).userProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
            image: true,
            reputation: true,
            postCount: true,
            createdAt: true,
            lastActivity: true,
          },
        },
      },
    });
  }

  // User Verification
  async requestVerification(userId: string, type: VerificationType, documentUrl?: string, notes?: string) {
    const verificationCode = crypto.randomBytes(32).toString('hex');
    const verificationToken = crypto.randomBytes(32).toString('hex');

    return await (this.prisma as any).userVerification.create({
      data: {
        userId,
        type,
        status: VerificationStatus.PENDING,
        verificationCode,
        verificationToken,
        documentUrl,
        notes,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });
  }

  async approveVerification(verificationId: string, verifierId: string, notes?: string) {
    return await (this.prisma as any).userVerification.update({
      where: { id: verificationId },
      data: {
        status: VerificationStatus.VERIFIED,
        verifiedById: verifierId,
        verifiedAt: new Date(),
        notes,
      },
    });
  }

  async rejectVerification(verificationId: string, verifierId: string, rejectionReason: string) {
    return await (this.prisma as any).userVerification.update({
      where: { id: verificationId },
      data: {
        status: VerificationStatus.REJECTED,
        verifiedById: verifierId,
        verifiedAt: new Date(),
        rejectionReason,
      },
    });
  }

  async getUserVerifications(userId: string) {
    return await (this.prisma as any).userVerification.findMany({
      where: { userId },
      include: {
        verifiedBy: {
          select: { id: true, name: true, username: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // User Bans and Suspensions
  async banUser(data: {
    userId: string;
    bannedById: string;
    type: BanType;
    reason: string;
    publicReason?: string;
    duration?: number; // minutes
    ipAddress?: string;
  }) {
    const expiresAt = data.duration 
      ? new Date(Date.now() + data.duration * 60 * 1000)
      : null;

    const ban = await (this.prisma as any).userBan.create({
      data: {
        userId: data.userId,
        bannedById: data.bannedById,
        type: data.type,
        reason: data.reason,
        publicReason: data.publicReason,
        duration: data.duration,
        expiresAt,
        ipAddress: data.ipAddress,
      },
    });

    // Update user ban status
    await this.prisma.user.update({
      where: { id: data.userId },
      data: { 
        isBanned: true,
        bannedUntil: expiresAt,
        bannedReason: data.publicReason || data.reason,
        bannedById: data.bannedById,
        banCount: { increment: 1 },
      },
    });

    // Log activity
    await this.logUserActivity({
      userId: data.userId,
      type: UserActivityType.BAN,
      description: `User banned: ${data.reason}`,
      ipAddress: data.ipAddress,
    });

    return ban;
  }

  async unbanUser(userId: string, moderatorId: string) {
    // Deactivate all active bans
    await (this.prisma as any).userBan.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    });

    // Update user status
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        isBanned: false,
        bannedUntil: null,
        bannedReason: null,
        bannedById: null,
      },
    });

    await this.logUserActivity({
      userId,
      type: UserActivityType.ACCOUNT_UNLOCKED,
      description: `User unbanned by moderator`,
    });
  }

  async getUserBans(userId: string) {
    return await (this.prisma as any).userBan.findMany({
      where: { userId },
      include: {
        bannedBy: {
          select: { id: true, name: true, username: true },
        },
        appeals: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Warnings System
  async issueWarning(data: {
    userId: string;
    issuedById: string;
    type: WarningType;
    title: string;
    reason: string;
    points?: number;
    expiresAt?: Date;
  }) {
    const warning = await (this.prisma as any).userWarning.create({
      data: {
        userId: data.userId,
        issuedById: data.issuedById,
        type: data.type,
        title: data.title,
        reason: data.reason,
        points: data.points || 1,
        expiresAt: data.expiresAt,
      },
    });

    // Update user warning points
    await this.prisma.user.update({
      where: { id: data.userId },
      data: {
        warningPoints: { increment: data.points || 1 },
      },
    });

    await this.logUserActivity({
      userId: data.userId,
      type: UserActivityType.WARNING_ISSUED,
      description: `Warning issued: ${data.title}`,
    });

    return warning;
  }

  async removeWarning(warningId: string) {
    const warning = await (this.prisma as any).userWarning.findUnique({
      where: { id: warningId },
    });

    if (warning) {
      await (this.prisma as any).userWarning.update({
        where: { id: warningId },
        data: { isActive: false },
      });

      // Decrease warning points
      await this.prisma.user.update({
        where: { id: warning.userId },
        data: {
          warningPoints: { decrement: warning.points },
        },
      });
    }
  }

  async getUserWarnings(userId: string) {
    return await (this.prisma as any).userWarning.findMany({
      where: { userId, isActive: true },
      include: {
        issuedBy: {
          select: { id: true, name: true, username: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // User Activity Logging
  async logUserActivity(data: {
    userId: string;
    type: UserActivityType;
    description: string;
    ipAddress?: string;
    userAgent?: string;
    location?: string;
    metadata?: any;
  }) {
    return await (this.prisma as any).userActivity.create({
      data: {
        userId: data.userId,
        type: data.type,
        description: data.description,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        location: data.location,
        metadata: data.metadata || {},
      },
    });
  }

  async getUserActivity(userId: string, limit = 50) {
    return await (this.prisma as any).userActivity.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  // User Settings
  async updateUserSettings(userId: string, settings: {
    theme?: string;
    language?: string;
    timezone?: string;
    emailNotifications?: any;
    pushNotifications?: any;
    privacySettings?: any;
    contentSettings?: any;
    moderationSettings?: any;
    customSettings?: any;
  }) {
    return await (this.prisma as any).userSettings.upsert({
      where: { userId },
      update: settings,
      create: {
        userId,
        ...settings,
      },
    });
  }

  async getUserSettings(userId: string) {
    return await (this.prisma as any).userSettings.findUnique({
      where: { userId },
    });
  }

  // Reputation System
  async updateReputation(data: {
    userId: string;
    change: number;
    reason: string;
    sourceId?: string;
    sourceType?: string;
    awardedById?: string;
  }) {
    const user = await this.prisma.user.findUnique({
      where: { id: data.userId },
      select: { reputation: true },
    });

    if (!user) throw new Error('User not found');

    const previousValue = user.reputation;
    const newValue = Math.max(0, previousValue + data.change);

    // Update user reputation
    await this.prisma.user.update({
      where: { id: data.userId },
      data: { reputation: newValue },
    });

    // Log reputation change
    await (this.prisma as any).userReputationHistory.create({
      data: {
        userId: data.userId,
        change: data.change,
        previousValue,
        newValue,
        reason: data.reason,
        sourceId: data.sourceId,
        sourceType: data.sourceType,
        awardedById: data.awardedById,
      },
    });

    await this.logUserActivity({
      userId: data.userId,
      type: UserActivityType.REPUTATION_CHANGED,
      description: `Reputation ${data.change > 0 ? 'increased' : 'decreased'} by ${Math.abs(data.change)}: ${data.reason}`,
    });

    return { previousValue, newValue, change: data.change };
  }

  async getReputationHistory(userId: string, limit = 50) {
    return await (this.prisma as any).userReputationHistory.findMany({
      where: { userId },
      include: {
        awardedBy: {
          select: { id: true, name: true, username: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  // Badge System
  async createBadge(data: {
    name: string;
    displayName: string;
    description: string;
    icon?: string;
    color?: string;
    category?: string;
    rarity?: string;
    points?: number;
    requirements: any;
  }) {
    return await (this.prisma as any).userBadge.create({
      data: {
        name: data.name,
        displayName: data.displayName,
        description: data.description,
        icon: data.icon,
        color: data.color,
        category: data.category,
        rarity: data.rarity || 'common',
        points: data.points || 0,
        requirements: data.requirements,
      },
    });
  }

  async awardBadge(data: {
    userId: string;
    badgeId: string;
    awardedById?: string;
    reason?: string;
  }) {
    const badge = await (this.prisma as any).userBadge.findUnique({
      where: { id: data.badgeId },
    });

    if (!badge) throw new Error('Badge not found');

    const earned = await (this.prisma as any).userBadgeEarned.create({
      data: {
        userId: data.userId,
        badgeId: data.badgeId,
        awardedById: data.awardedById,
        reason: data.reason,
      },
    });

    // Award reputation points if badge has them
    if (badge.points > 0) {
      await this.updateReputation({
        userId: data.userId,
        change: badge.points,
        reason: `Badge earned: ${badge.displayName}`,
        sourceId: badge.id,
        sourceType: 'badge',
        awardedById: data.awardedById,
      });
    }

    return earned;
  }

  async getUserBadges(userId: string) {
    return await (this.prisma as any).userBadgeEarned.findMany({
      where: { userId },
      include: {
        badge: true,
        awardedBy: { select: { username: true } },
      },
      orderBy: { earnedAt: 'desc' },
    });
  }

  async getAllBadges() {
    return await (this.prisma as any).userBadge.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  // Advanced User Search and Management
  async searchUsers(filters: {
    query?: string;
    roleId?: string;
    isVerified?: boolean;
    isBanned?: boolean;
    minReputation?: number;
    maxReputation?: number;
    createdAfter?: Date;
    createdBefore?: Date;
    lastActiveAfter?: Date;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    if (filters.query) {
      where.OR = [
        { name: { contains: filters.query, mode: 'insensitive' } },
        { username: { contains: filters.query, mode: 'insensitive' } },
        { email: { contains: filters.query, mode: 'insensitive' } },
      ];
    }

    if (filters.roleId) where.roleId = filters.roleId;
    if (filters.isBanned !== undefined) where.isBanned = filters.isBanned;
    if (filters.minReputation !== undefined) where.reputation = { gte: filters.minReputation };
    if (filters.maxReputation !== undefined) where.reputation = { ...where.reputation, lte: filters.maxReputation };
    if (filters.createdAfter) where.createdAt = { gte: filters.createdAfter };
    if (filters.createdBefore) where.createdAt = { ...where.createdAt, lte: filters.createdBefore };
    if (filters.lastActiveAfter) where.lastActivity = { gte: filters.lastActiveAfter };

    return await this.prisma.user.findMany({
      where,
      include: {
        role: true,
        // profile: true, // Field may not exist in current schema
        _count: {
          select: {
            posts: true,
            comments: true,
            // warningsReceived: { where: { isActive: true } }, // Field may not exist in current schema
            // bans: { where: { isActive: true } }, // Field may not exist in current schema
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: filters.limit || 50,
      skip: filters.offset || 0,
    });
  }

  async getUserStats(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: {
            posts: true,
            comments: true,
            likes: true,
            follows: true,
            following: true,
            // warningsReceived: { where: { isActive: true } }, // Field may not exist in current schema
            // bans: { where: { isActive: true } }, // Field may not exist in current schema
            // badgesEarned: true, // Field may not exist in current schema
          },
        },
      },
    });

    if (!user) throw new Error('User not found');

    const recentActivity = await this.getUserActivity(userId, 10);
    const badges = await this.getUserBadges(userId);

    return {
      user,
      recentActivity,
      badges: badges.slice(0, 5), // Top 5 badges
      stats: {
        totalPosts: (user as any)._count?.posts || 0,
        totalComments: (user as any)._count?.comments || 0,
        totalLikes: (user as any)._count?.likes || 0,
        followers: (user as any)._count?.follows || 0,
        following: (user as any)._count?.following || 0,
        activeWarnings: (user as any)._count?.warningsReceived || 0,
        activeBans: (user as any)._count?.bans || 0,
        totalBadges: (user as any)._count?.badgesEarned || 0,
        reputation: user.reputation,
        joinDate: user.createdAt,
        lastActive: user.lastActivity,
      },
    };
  }

  // Session Management
  async createUserSession(data: {
    userId: string;
    sessionToken: string;
    deviceInfo?: string;
    ipAddress: string;
    location?: string;
    userAgent?: string;
    expiresAt: Date;
  }) {
    return await (this.prisma as any).userSession.create({
      data: {
        userId: data.userId,
        sessionToken: data.sessionToken,
        deviceInfo: data.deviceInfo,
        ipAddress: data.ipAddress,
        location: data.location,
        userAgent: data.userAgent,
        expiresAt: data.expiresAt,
      },
    });
  }

  async getUserSessions(userId: string) {
    return await this.prisma.userSession.findMany({
      where: { userId, isActive: true },
      orderBy: { lastActivity: 'desc' },
    });
  }

  async revokeUserSession(sessionId: string) {
    return await this.prisma.userSession.update({
      where: { id: sessionId },
      data: { isActive: false },
    });
  }

  // Login Attempts Tracking
  async logLoginAttempt(data: {
    email: string;
    ipAddress: string;
    userAgent?: string;
    isSuccessful: boolean;
    failureReason?: string;
    userId?: string;
    location?: string;
  }) {
    return await (this.prisma as any).userLoginAttempt.create({
      data: {
        email: data.email,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        isSuccessful: data.isSuccessful,
        failureReason: data.failureReason,
        userId: data.userId,
        location: data.location,
      },
    });
  }

  async getFailedLoginAttempts(email: string, since: Date) {
    return await (this.prisma as any).userLoginAttempt.count({
      where: {
        email,
        isSuccessful: false,
        createdAt: { gte: since },
      },
    });
  }
}

export const userManagementService = new UserManagementService();
