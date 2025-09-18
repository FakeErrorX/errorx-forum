import { prisma } from '@/lib/prisma'

export interface TrophyCondition {
  postCount?: number
  reputationPoints?: number
  daysRegistered?: number
  trophiesReceived?: number
  commentsReceived?: number
  likesReceived?: number
  threadsCreated?: number
}

export interface TrophyAwardEvent {
  userId: string
  action: 'post_created' | 'comment_created' | 'like_received' | 'reputation_gained' | 'user_registered' | 'trophy_received'
  metadata?: Record<string, any>
}

export class TrophyService {
  /**
   * Convert custom userId (number) to UUID (string) for internal operations
   * @param customUserId - The custom sequential user ID
   * @returns The UUID string or null if user not found
   */
  static async getUuidFromCustomId(customUserId: number): Promise<string | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { userId: customUserId },
        select: { id: true }
      })
      return user?.id || null
    } catch (error) {
      console.error('Error converting custom userId to UUID:', error)
      return null
    }
  }

  /**
   * Convert UUID (string) to custom userId (number) for public APIs
   * @param uuid - The UUID (User.id field)
   * @returns The custom userId number or null if user not found
   */
  static async getCustomIdFromUuid(uuid: string): Promise<number | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: uuid },
        select: { userId: true }
      })
      return user?.userId || null
    } catch (error) {
      console.error('Error converting UUID to custom userId:', error)
      return null
    }
  }

  /**
   * Validate that a user exists by UUID
   * @param userId - The UUID (User.id field) of the user
   * @returns True if user exists, false otherwise
   */
  static async userExists(userId: string): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true }
      })
      return !!user
    } catch (error) {
      console.error('Error checking if user exists:', error)
      return false
    }
  }

  /**
   * Check and award trophies for a user based on their current stats
   * @param userId - The UUID (User.id field) of the user
   */
  static async checkAndAwardTrophies(userId: string): Promise<string[]> {
    try {
      // Get user with current stats
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          posts: true,
          _count: {
            select: {
              posts: true,
              // Add other counts when models are available
            }
          }
        }
      })

      if (!user) {
        throw new Error('User not found')
      }

      // Get all active trophies (schema doesn't have type field, so we get all active)
      const automaticTrophies = await prisma.trophy.findMany({
        where: {
          isActive: true
        }
      })

      // Get trophies user already has
      const userTrophies = await prisma.userTrophy.findMany({
        where: { userId },
        select: { trophyId: true }
      })

      const userTrophyIds = userTrophies.map((ut: { trophyId: string }) => ut.trophyId)
      const awardedTrophies: string[] = []

      // Calculate user stats
      const userStats = await this.calculateUserStats(userId)

      // Check each trophy against user stats
      for (const trophy of automaticTrophies) {
        if (userTrophyIds.includes(trophy.id)) {
          continue // User already has this trophy
        }

        const conditions = trophy.criteria as TrophyCondition
        if (this.checkTrophyConditions(userStats, conditions)) {
          await this.awardTrophy(userId, trophy.id)
          awardedTrophies.push(trophy.id)
        }
      }

      return awardedTrophies
    } catch (error) {
      console.error('Error checking and awarding trophies:', error)
      return []
    }
  }

  /**
   * Handle trophy events when user actions occur
   */
  static async handleTrophyEvent(event: TrophyAwardEvent): Promise<string[]> {
    try {
      // Check for trophies after the action
      const awardedTrophies = await this.checkAndAwardTrophies(event.userId)

      // Log the event for analytics
      await this.logTrophyEvent(event)

      return awardedTrophies
    } catch (error) {
      console.error('Error handling trophy event:', error)
      return []
    }
  }

  /**
   * Calculate comprehensive user statistics
   */
  /**
   * Calculate user statistics for trophy evaluation
   * @param userId - The UUID (User.id field) of the user
   */
  private static async calculateUserStats(userId: string): Promise<TrophyCondition> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        posts: {
          include: {
            _count: {
              select: {
                // comments: true, // Uncomment when comments model is available
              }
            }
          }
        },
        _count: {
          select: {
            posts: true,
            // comments: true, // Uncomment when available
          }
        }
      }
    })

    if (!user) {
      return {}
    }

    // Calculate days registered
    const daysRegistered = Math.floor(
      (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    )

    // Calculate post count
    const postCount = user._count.posts

    // Calculate threads created (posts that are not replies)
    const threadsCreated = user.posts.filter(post => 
      // Assuming a thread is a post without a parent
      true // Replace with actual thread detection logic
    ).length

    // Calculate reputation points (placeholder - implement based on your reputation system)
    const reputationPoints = await this.calculateReputationPoints(userId)

    // Calculate comments received on user's posts (simplified)
    const commentsReceived = 0 // TODO: Implement when comment counts are available

    // Calculate likes received (placeholder)
    const likesReceived = await this.calculateLikesReceived(userId)

    // Get current trophy count
    const trophiesReceived = await prisma.userTrophy.count({
      where: { userId }
    })

    return {
      postCount,
      reputationPoints,
      daysRegistered,
      trophiesReceived,
      commentsReceived,
      likesReceived,
      threadsCreated
    }
  }

  /**
   * Check if user meets trophy conditions
   */
  private static checkTrophyConditions(
    userStats: TrophyCondition, 
    trophyConditions: TrophyCondition
  ): boolean {
    // Check each condition - all specified conditions must be met
    if (trophyConditions.postCount && (userStats.postCount || 0) < trophyConditions.postCount) {
      return false
    }

    if (trophyConditions.reputationPoints && (userStats.reputationPoints || 0) < trophyConditions.reputationPoints) {
      return false
    }

    if (trophyConditions.daysRegistered && (userStats.daysRegistered || 0) < trophyConditions.daysRegistered) {
      return false
    }

    if (trophyConditions.trophiesReceived && (userStats.trophiesReceived || 0) < trophyConditions.trophiesReceived) {
      return false
    }

    if (trophyConditions.commentsReceived && (userStats.commentsReceived || 0) < trophyConditions.commentsReceived) {
      return false
    }

    if (trophyConditions.likesReceived && (userStats.likesReceived || 0) < trophyConditions.likesReceived) {
      return false
    }

    if (trophyConditions.threadsCreated && (userStats.threadsCreated || 0) < trophyConditions.threadsCreated) {
      return false
    }

    return true
  }

  /**
   * Award a trophy to a user
   * @param userId - The UUID (User.id field) of the user
   * @param trophyId - The trophy ID to award
   */
  private static async awardTrophy(userId: string, trophyId: string): Promise<void> {
    try {
      // Check if user already has this trophy
      const existingAward = await prisma.userTrophy.findUnique({
        where: {
          userId_trophyId: {
            userId,
            trophyId
          }
        }
      })

      if (existingAward) {
        return // User already has this trophy
      }

      // Award the trophy
      await prisma.userTrophy.create({
        data: {
          userId,
          trophyId,
          earnedAt: new Date()
        }
      })

      // Update trophy awarded count (Note: schema doesn't have awardedCount field)
      // await prisma.trophy.update({
      //   where: { id: trophyId },
      //   data: {
      //     awardedCount: {
      //       increment: 1
      //     }
      //   }
      // })

      // Create notification (when notification system is available)
      await this.createTrophyNotification(userId, trophyId)

    } catch (error) {
      console.error('Error awarding trophy:', error)
      throw error
    }
  }

  /**
   * Calculate user's reputation points
   */
  private static async calculateReputationPoints(userId: string): Promise<number> {
    // Placeholder implementation - replace with actual reputation calculation
    // This could be based on likes, helpful marks, moderator actions, etc.
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        posts: true
      }
    })

    if (!user) return 0

    // Simple calculation: 1 point per post, bonus for older posts
    let points = user.posts.length

    // Bonus points for account age
    const daysRegistered = Math.floor(
      (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    )
    points += Math.floor(daysRegistered / 30) // 1 point per month

    return points
  }

  /**
   * Calculate likes received by user
   */
  private static async calculateLikesReceived(userId: string): Promise<number> {
    // Placeholder - implement when like/reaction system is available
    return 0
  }

  /**
   * Log trophy events for analytics
   */
  private static async logTrophyEvent(event: TrophyAwardEvent): Promise<void> {
    // Placeholder - implement when audit log system is available
    console.log('Trophy event:', event)
  }

  /**
   * Create notification for trophy award
   */
  private static async createTrophyNotification(userId: string, trophyId: string): Promise<void> {
    try {
      const trophy = await prisma.trophy.findUnique({
        where: { id: trophyId }
      })

      if (!trophy) return

      // Create notification (when notification model is available)
      // await prisma.notification.create({
      //   data: {
      //     userId,
      //     type: 'trophy_awarded',
      //     title: 'Trophy Awarded!',
      //     message: `You've earned the "${trophy.name}" trophy!`,
      //     metadata: {
      //       trophyId,
      //       trophyName: trophy.name,
      //       trophyIcon: trophy.icon
      //     }
      //   }
      // })

      console.log(`Trophy awarded notification for user ${userId}: ${trophy.name}`)
    } catch (error) {
      console.error('Error creating trophy notification:', error)
    }
  }

  /**
   * Get user's trophies with progress towards unearned trophies
   * @param userId - The UUID (User.id field) of the user
   */
  static async getUserTrophyProgress(userId: string) {
    try {
      const userStats = await this.calculateUserStats(userId)
      
      // Get all trophies
      const allTrophies = await prisma.trophy.findMany({
        where: { isActive: true }
      })

      // Get user's current trophies
      const userTrophies = await prisma.userTrophy.findMany({
        where: { userId },
        include: {
          trophy: true
        }
      })

      const userTrophyIds = userTrophies.map((ut: any) => ut.trophyId)

      // Calculate progress for unearned trophies
      const trophyProgress = allTrophies.map((trophy: any) => {
        const isEarned = userTrophyIds.includes(trophy.id)
        const conditions = trophy.criteria as TrophyCondition
        
        let progress = 0
        if (!isEarned) { // Remove type check since schema doesn't have type field
          // Calculate progress percentage
          const progressFactors = []
          
          if (conditions.postCount) {
            progressFactors.push((userStats.postCount || 0) / conditions.postCount)
          }
          if (conditions.reputationPoints) {
            progressFactors.push((userStats.reputationPoints || 0) / conditions.reputationPoints)
          }
          if (conditions.daysRegistered) {
            progressFactors.push((userStats.daysRegistered || 0) / conditions.daysRegistered)
          }
          
          if (progressFactors.length > 0) {
            progress = Math.min(1, Math.max(...progressFactors))
          }
        }

        return {
          trophy,
          isEarned,
          progress: isEarned ? 1 : progress,
          awardedAt: isEarned ? userTrophies.find((ut: any) => ut.trophyId === trophy.id)?.earnedAt : null
        }
      })

      return {
        earnedTrophies: userTrophies,
        allTrophyProgress: trophyProgress,
        userStats
      }
    } catch (error) {
      console.error('Error getting user trophy progress:', error)
      return {
        earnedTrophies: [],
        allTrophyProgress: [],
        userStats: {}
      }
    }
  }

  /**
   * Manually award a trophy to a user (admin function)
   */
  static async manuallyAwardTrophy(userId: string, trophyId: string, awardedBy: string): Promise<boolean> {
    try {
      await this.awardTrophy(userId, trophyId)
      
      // Log manual award (when audit system is available)
      console.log(`Trophy ${trophyId} manually awarded to user ${userId} by ${awardedBy}`)
      
      return true
    } catch (error) {
      console.error('Error manually awarding trophy:', error)
      return false
    }
  }

  /**
   * Recalculate all trophies for all users (maintenance function)
   */
  static async recalculateAllTrophies(): Promise<number> {
    try {
      const users = await prisma.user.findMany({
        select: { id: true }
      })

      let totalAwarded = 0

      for (const user of users) {
        const awarded = await this.checkAndAwardTrophies(user.id)
        totalAwarded += awarded.length
      }

      return totalAwarded
    } catch (error) {
      console.error('Error recalculating all trophies:', error)
      return 0
    }
  }
}

// Helper functions to trigger trophy checks

/**
 * Call this when a user creates a post
 */
export async function onPostCreated(userId: string, postId: string) {
  return TrophyService.handleTrophyEvent({
    userId,
    action: 'post_created',
    metadata: { postId }
  })
}

/**
 * Call this when a user creates a comment
 */
export async function onCommentCreated(userId: string, commentId: string) {
  return TrophyService.handleTrophyEvent({
    userId,
    action: 'comment_created',
    metadata: { commentId }
  })
}

/**
 * Call this when a user receives a like
 */
export async function onLikeReceived(userId: string, contentId: string, contentType: string) {
  return TrophyService.handleTrophyEvent({
    userId,
    action: 'like_received',
    metadata: { contentId, contentType }
  })
}

/**
 * Call this when a user gains reputation
 */
export async function onReputationGained(userId: string, amount: number, reason: string) {
  return TrophyService.handleTrophyEvent({
    userId,
    action: 'reputation_gained',
    metadata: { amount, reason }
  })
}

/**
 * Call this when a user registers (for welcome trophies)
 */
export async function onUserRegistered(userId: string) {
  return TrophyService.handleTrophyEvent({
    userId,
    action: 'user_registered',
    metadata: {}
  })
}

/**
 * Call this when a user receives a trophy (for combo trophies)
 */
export async function onTrophyReceived(userId: string, trophyId: string) {
  return TrophyService.handleTrophyEvent({
    userId,
    action: 'trophy_received',
    metadata: { trophyId }
  })
}