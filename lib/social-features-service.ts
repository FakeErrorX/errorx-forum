/**
 * Social Features Service
 * Handles user following, blocking, activity feeds, mentions, and social interactions
 */

import { prisma } from '@/lib/prisma'
import { webSocketManager } from '@/lib/websocket-server'
import { NotificationService } from '@/lib/notification-service'

export interface FollowUserData {
  followerId: string
  followingId: string
}

export interface BlockUserData {
  blockerId: string
  blockedId: string
  reason?: string
}

export interface ActivityFeedData {
  userId: string
  actorId: string
  type: 'follow' | 'post_created' | 'comment_created' | 'like_given' | 'mention' | 'profile_view' | 'unfollow'
  entityType: 'user' | 'post' | 'comment' | 'message'
  entityId?: string
  metadata?: Record<string, any>
}

export interface SocialInteractionData {
  userId: string
  targetUserId?: string
  type: 'profile_view' | 'follow' | 'unfollow' | 'block' | 'unblock'
  metadata?: Record<string, any>
}

export class SocialFeaturesService {
  /**
   * Follow a user
   */
  static async followUser(data: FollowUserData) {
    try {
      // Prevent self-following
      if (data.followerId === data.followingId) {
        throw new Error('Cannot follow yourself')
      }

      // Check if already following
      const existingFollow = await (prisma as any).follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: data.followerId,
            followingId: data.followingId
          }
        }
      })

      if (existingFollow) {
        throw new Error('Already following this user')
      }

      // Check if the target user has blocked the follower
      const isBlocked = await this.isUserBlocked(data.followingId, data.followerId)
      if (isBlocked) {
        throw new Error('Cannot follow this user')
      }

      // Create follow relationship
      const follow = await (prisma as any).follow.create({
        data: {
          followerId: data.followerId,
          followingId: data.followingId
        },
        include: {
          follower: { select: { id: true, username: true, name: true, image: true } },
          following: { select: { id: true, username: true, name: true, image: true } }
        }
      })

      // Log social interaction
      await this.logSocialInteraction({
        userId: data.followerId,
        targetUserId: data.followingId,
        type: 'follow'
      })

      // Create activity feed entry
      await this.createActivityFeedEntry({
        userId: data.followingId,
        actorId: data.followerId,
        type: 'follow',
        entityType: 'user',
        entityId: data.followingId,
        metadata: {
          followerUsername: follow.follower.username,
          followerName: follow.follower.name
        }
      })

      // Send notification
      await (NotificationService as any).createNotification({
        userId: data.followingId,
        type: 'follow',
        title: 'New Follower',
        message: `${follow.follower.username || follow.follower.name} started following you`,
        fromUserId: data.followerId,
        data: { follower: follow.follower }
      })

      // Send real-time notification
      (webSocketManager as any).sendNotificationToUser(data.followingId, {
        type: 'follow',
        title: 'New Follower',
        message: `${follow.follower.username || follow.follower.name} started following you`,
        data: { follower: follow.follower }
      })

      return follow
    } catch (error) {
      console.error('Error following user:', error)
      throw error
    }
  }

  /**
   * Unfollow a user
   */
  static async unfollowUser(followerId: string, followingId: string) {
    try {
      const follow = await (prisma as any).follow.findUnique({
        where: {
          followerId_followingId: {
            followerId,
            followingId
          }
        },
        include: {
          follower: { select: { id: true, username: true, name: true } },
          following: { select: { id: true, username: true, name: true } }
        }
      })

      if (!follow) {
        throw new Error('Follow relationship not found')
      }

      // Delete follow relationship
      await (prisma as any).follow.delete({
        where: {
          followerId_followingId: {
            followerId,
            followingId
          }
        }
      })

      // Log social interaction
      await this.logSocialInteraction({
        userId: followerId,
        targetUserId: followingId,
        type: 'unfollow'
      })

      // Create activity feed entry for unfollow
      await this.createActivityFeedEntry({
        userId: followingId,
        actorId: followerId,
        type: 'unfollow',
        entityType: 'user',
        entityId: followingId,
        metadata: {
          followerUsername: follow.follower.username,
          followerName: follow.follower.name
        }
      })

      return { success: true, follow }
    } catch (error) {
      console.error('Error unfollowing user:', error)
      throw error
    }
  }

  /**
   * Block a user
   */
  static async blockUser(data: BlockUserData) {
    try {
      // Prevent self-blocking
      if (data.blockerId === data.blockedId) {
        throw new Error('Cannot block yourself')
      }

      // Check if already blocked
      const existingBlock = await (prisma as any).userBlock.findUnique({
        where: {
          blockerId_blockedId: {
            blockerId: data.blockerId,
            blockedId: data.blockedId
          }
        }
      })

      if (existingBlock) {
        throw new Error('User already blocked')
      }

      // Create block relationship
      const block = await (prisma as any).userBlock.create({
        data: {
          blockerId: data.blockerId,
          blockedId: data.blockedId,
          reason: data.reason
        },
        include: {
          blocker: { select: { id: true, username: true, name: true } },
          blocked: { select: { id: true, username: true, name: true } }
        }
      })

      // Remove any existing follow relationships
      await (prisma as any).follow.deleteMany({
        where: {
          OR: [
            { followerId: data.blockerId, followingId: data.blockedId },
            { followerId: data.blockedId, followingId: data.blockerId }
          ]
        }
      })

      // Log social interaction
      await this.logSocialInteraction({
        userId: data.blockerId,
        targetUserId: data.blockedId,
        type: 'block',
        metadata: { reason: data.reason }
      })

      return block
    } catch (error) {
      console.error('Error blocking user:', error)
      throw error
    }
  }

  /**
   * Unblock a user
   */
  static async unblockUser(blockerId: string, blockedId: string) {
    try {
      const block = await (prisma as any).userBlock.findUnique({
        where: {
          blockerId_blockedId: {
            blockerId,
            blockedId
          }
        },
        include: {
          blocker: { select: { id: true, username: true, name: true } },
          blocked: { select: { id: true, username: true, name: true } }
        }
      })

      if (!block) {
        throw new Error('Block relationship not found')
      }

      // Delete block relationship
      await (prisma as any).userBlock.delete({
        where: {
          blockerId_blockedId: {
            blockerId,
            blockedId
          }
        }
      })

      // Log social interaction
      await this.logSocialInteraction({
        userId: blockerId,
        targetUserId: blockedId,
        type: 'unblock'
      })

      return { success: true, block }
    } catch (error) {
      console.error('Error unblocking user:', error)
      throw error
    }
  }

  /**
   * Get user's followers
   */
  static async getUserFollowers(userId: string, limit = 20, offset = 0) {
    try {
      const followers = await (prisma as any).follow.findMany({
        where: { followingId: userId },
        include: {
          follower: {
            select: {
              id: true,
              username: true,
              name: true,
              image: true,
              bio: true,
              reputation: true,
              postCount: true,
              lastActivity: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      })

      return followers.map((f: any) => ({
        ...f.follower,
        followedAt: f.createdAt
      }))
    } catch (error) {
      console.error('Error getting user followers:', error)
      throw new Error('Failed to get followers')
    }
  }

  /**
   * Get users that a user is following
   */
  static async getUserFollowing(userId: string, limit = 20, offset = 0) {
    try {
      const following = await (prisma as any).follow.findMany({
        where: { followerId: userId },
        include: {
          following: {
            select: {
              id: true,
              username: true,
              name: true,
              image: true,
              bio: true,
              reputation: true,
              postCount: true,
              lastActivity: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      })

      return following.map((f: any) => ({
        ...f.following,
        followedAt: f.createdAt
      }))
    } catch (error) {
      console.error('Error getting user following:', error)
      throw new Error('Failed to get following')
    }
  }

  /**
   * Get user's blocked users
   */
  static async getUserBlocked(userId: string, limit = 20, offset = 0) {
    try {
      const blocked = await (prisma as any).userBlock.findMany({
        where: { blockerId: userId },
        include: {
          blocked: {
            select: {
              id: true,
              username: true,
              name: true,
              image: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      })

      return blocked.map((b: any) => ({
        ...b.blocked,
        blockedAt: b.createdAt,
        reason: b.reason
      }))
    } catch (error) {
      console.error('Error getting blocked users:', error)
      throw new Error('Failed to get blocked users')
    }
  }

  /**
   * Get user's activity feed
   */
  static async getUserActivityFeed(userId: string, limit = 50, offset = 0) {
    try {
      const activities = await (prisma as any).activityFeed.findMany({
        where: { userId },
        include: {
          actor: {
            select: {
              id: true,
              username: true,
              name: true,
              image: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      })

      return activities
    } catch (error) {
      console.error('Error getting activity feed:', error)
      throw new Error('Failed to get activity feed')
    }
  }

  /**
   * Mark activity feed items as read
   */
  static async markActivityFeedAsRead(userId: string, activityIds?: string[]) {
    try {
      const whereClause: any = { userId }
      
      if (activityIds && activityIds.length > 0) {
        whereClause.id = { in: activityIds }
      }

      await (prisma as any).activityFeed.updateMany({
        where: whereClause,
        data: { isRead: true }
      })

      return { success: true }
    } catch (error) {
      console.error('Error marking activity feed as read:', error)
      throw new Error('Failed to mark activity feed as read')
    }
  }

  /**
   * Create activity feed entry
   */
  static async createActivityFeedEntry(data: ActivityFeedData) {
    try {
      // Don't create activity for self-actions (except profile views)
      if (data.userId === data.actorId && data.type !== 'profile_view') {
        return null
      }

      const activity = await (prisma as any).activityFeed.create({
        data: {
          userId: data.userId,
          actorId: data.actorId,
          type: data.type,
          entityType: data.entityType,
          entityId: data.entityId,
          metadata: data.metadata
        },
        include: {
          actor: {
            select: {
              id: true,
              username: true,
              name: true,
              image: true
            }
          }
        }
      })

      return activity
    } catch (error) {
      console.error('Error creating activity feed entry:', error)
      // Don't throw error for activity feed failures
      return null
    }
  }

  /**
   * Log social interaction
   */
  static async logSocialInteraction(data: SocialInteractionData) {
    try {
      const interaction = await (prisma as any).socialInteraction.create({
        data: {
          userId: data.userId,
          targetUserId: data.targetUserId,
          type: data.type,
          metadata: data.metadata
        }
      })

      return interaction
    } catch (error) {
      console.error('Error logging social interaction:', error)
      // Don't throw error for logging failures
      return null
    }
  }

  /**
   * Check if user is blocked
   */
  static async isUserBlocked(userId: string, potentialBlockerId: string): Promise<boolean> {
    try {
      const block = await (prisma as any).userBlock.findUnique({
        where: {
          blockerId_blockedId: {
            blockerId: potentialBlockerId,
            blockedId: userId
          }
        }
      })

      return !!block
    } catch (error) {
      console.error('Error checking if user is blocked:', error)
      return false
    }
  }

  /**
   * Check follow status between users
   */
  static async getFollowStatus(userId: string, targetUserId: string) {
    try {
      const [isFollowing, isFollower, isBlocked, isBlockedBy] = await Promise.all([
        (prisma as any).follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: userId,
              followingId: targetUserId
            }
          }
        }),
        (prisma as any).follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: targetUserId,
              followingId: userId
            }
          }
        }),
        (prisma as any).userBlock.findUnique({
          where: {
            blockerId_blockedId: {
              blockerId: userId,
              blockedId: targetUserId
            }
          }
        }),
        (prisma as any).userBlock.findUnique({
          where: {
            blockerId_blockedId: {
              blockerId: targetUserId,
              blockedId: userId
            }
          }
        })
      ])

      return {
        isFollowing: !!isFollowing,
        isFollower: !!isFollower,
        isBlocked: !!isBlocked,
        isBlockedBy: !!isBlockedBy,
        isMutualFollow: !!isFollowing && !!isFollower
      }
    } catch (error) {
      console.error('Error getting follow status:', error)
      return {
        isFollowing: false,
        isFollower: false,
        isBlocked: false,
        isBlockedBy: false,
        isMutualFollow: false
      }
    }
  }

  /**
   * Get user social stats
   */
  static async getUserSocialStats(userId: string) {
    try {
      const [followersCount, followingCount, blockedCount] = await Promise.all([
        (prisma as any).follow.count({ where: { followingId: userId } }),
        (prisma as any).follow.count({ where: { followerId: userId } }),
        (prisma as any).userBlock.count({ where: { blockerId: userId } })
      ])

      return {
        followersCount,
        followingCount,
        blockedCount
      }
    } catch (error) {
      console.error('Error getting user social stats:', error)
      return {
        followersCount: 0,
        followingCount: 0,
        blockedCount: 0
      }
    }
  }

  /**
   * Get suggested users to follow
   */
  static async getSuggestedUsers(userId: string, limit = 10) {
    try {
      // Get users followed by people the current user follows
      const suggestedUsers = await (prisma as any).user.findMany({
        where: {
          AND: [
            { id: { not: userId } }, // Not the current user
            {
              // Users who are followed by people the current user follows
              following: {
                some: {
                  follower: {
                    following: {
                      some: { followingId: userId }
                    }
                  }
                }
              }
            },
            {
              // Users the current user is not already following
              following: {
                none: { followerId: userId }
              }
            },
            {
              // Users who haven't blocked the current user
              blockedBy: {
                none: { blockerId: userId }
              }
            },
            {
              // Users the current user hasn't blocked
              blockedUsers: {
                none: { blockedId: userId }
              }
            }
          ]
        },
        select: {
          id: true,
          username: true,
          name: true,
          image: true,
          bio: true,
          reputation: true,
          postCount: true,
          lastActivity: true
        },
        take: limit
      })

      return suggestedUsers
    } catch (error) {
      console.error('Error getting suggested users:', error)
      return []
    }
  }

  /**
   * Record profile view
   */
  static async recordProfileView(viewerId: string, profileUserId: string) {
    try {
      // Don't record self-views
      if (viewerId === profileUserId) {
        return null
      }

      // Log the interaction
      await this.logSocialInteraction({
        userId: viewerId,
        targetUserId: profileUserId,
        type: 'profile_view'
      })

      // Update profile views count
      await (prisma as any).user.update({
        where: { id: profileUserId },
        data: {
          profileViews: {
            increment: 1
          }
        }
      })

      // Create activity feed entry (only for profile views from followers)
      const isFollower = await (prisma as any).follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: viewerId,
            followingId: profileUserId
          }
        }
      })

      if (isFollower) {
        await this.createActivityFeedEntry({
          userId: profileUserId,
          actorId: viewerId,
          type: 'profile_view',
          entityType: 'user',
          entityId: profileUserId
        })
      }

      return { success: true }
    } catch (error) {
      console.error('Error recording profile view:', error)
      return null
    }
  }
}