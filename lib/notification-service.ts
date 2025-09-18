/**
 * Enhanced Notification Service
 * Handles creating, sending, and managing notifications
 */

import { prisma } from '@/lib/prisma'
import { webSocketManager } from '@/lib/websocket-server'
// import { sendNotificationEmail } from '@/lib/email-notifications'

export type NotificationType = 'mention' | 'reply' | 'follow' | 'like' | 'trophy' | 'message' | 'system'

export interface CreateNotificationData {
  type: NotificationType
  title: string
  message: string
  userId: string
  fromUserId?: string
  postId?: string
  commentId?: string
  conversationId?: string
  data?: Record<string, any>
  emailNotification?: boolean
  pushNotification?: boolean
}

export interface NotificationPreferences {
  mentions: { email: boolean; push: boolean; realtime: boolean }
  replies: { email: boolean; push: boolean; realtime: boolean }
  follows: { email: boolean; push: boolean; realtime: boolean }
  likes: { email: boolean; push: boolean; realtime: boolean }
  messages: { email: boolean; push: boolean; realtime: boolean }
  system: { email: boolean; push: boolean; realtime: boolean }
  emailDigest: 'instant' | 'hourly' | 'daily' | 'weekly' | 'never'
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  mentions: { email: true, push: true, realtime: true },
  replies: { email: true, push: true, realtime: true },
  follows: { email: false, push: true, realtime: true },
  likes: { email: false, push: false, realtime: true },
  messages: { email: true, push: true, realtime: true },
  system: { email: true, push: true, realtime: true },
  emailDigest: 'daily'
}

export class NotificationService {
  /**
   * Create and send a notification
   */
  static async createNotification(data: CreateNotificationData) {
    try {
      // Create notification in database
      const notification = await prisma.notification.create({
        data: {
          type: data.type,
          title: data.title,
          message: data.message,
          userId: data.userId,
          fromUserId: data.fromUserId,
          postId: data.postId,
          commentId: data.commentId,
          data: data.data as any,
          isRead: false,
          createdAt: new Date()
        } as any
      })

      // Get user's notification preferences
      const preferences = await this.getUserNotificationPreferences(data.userId)
      const typeKey = `${data.type}s` // Convert 'mention' to 'mentions', etc.
      const typePrefs = (preferences as any)[typeKey] || (preferences as any)[data.type] || DEFAULT_PREFERENCES.mentions

      // Send real-time notification if enabled
      if (typePrefs.realtime) {
        webSocketManager.sendNotificationToUser(data.userId, {
          id: notification.id,
          type: data.type,
          title: data.title,
          message: data.message,
          data: data.data,
          userId: data.userId,
          fromUserId: data.fromUserId,
          postId: data.postId,
          commentId: data.commentId,
          createdAt: notification.createdAt
        })
      }

      // Send email notification if enabled
      if (typePrefs.email && data.emailNotification !== false) {
        await this.sendEmailNotification(notification)
      }

      // Send push notification if enabled
      if (typePrefs.push && data.pushNotification !== false) {
        await this.sendPushNotification(notification)
      }

      return notification
    } catch (error) {
      console.error('Error creating notification:', error)
      throw error
    }
  }

  /**
   * Create mention notification when user is mentioned
   */
  static async createMentionNotification(mentionedUserId: string, mentionerUserId: string, postId: string, content: string) {
    const mentioner = await prisma.user.findUnique({
      where: { id: mentionerUserId },
      select: { username: true, name: true }
    })

    if (!mentioner) return

    await this.createNotification({
      type: 'mention',
      title: 'You were mentioned',
      message: `${mentioner.username || mentioner.name} mentioned you in a post`,
      userId: mentionedUserId,
      fromUserId: mentionerUserId,
      postId,
      data: { content: content.substring(0, 200) }
    })
  }

  /**
   * Create reply notification
   */
  static async createReplyNotification(postAuthorId: string, replierId: string, postId: string, replyContent: string) {
    if (postAuthorId === replierId) return // Don't notify self

    const replier = await prisma.user.findUnique({
      where: { id: replierId },
      select: { username: true, name: true }
    })

    if (!replier) return

    await this.createNotification({
      type: 'reply',
      title: 'New reply to your post',
      message: `${replier.username || replier.name} replied to your post`,
      userId: postAuthorId,
      fromUserId: replierId,
      postId,
      data: { content: replyContent.substring(0, 200) }
    })
  }

  /**
   * Create follow notification
   */
  static async createFollowNotification(followedUserId: string, followerId: string) {
    const follower = await prisma.user.findUnique({
      where: { id: followerId },
      select: { username: true, name: true }
    })

    if (!follower) return

    await this.createNotification({
      type: 'follow',
      title: 'New follower',
      message: `${follower.username || follower.name} started following you`,
      userId: followedUserId,
      fromUserId: followerId
    })
  }

  /**
   * Create like notification
   */
  static async createLikeNotification(postAuthorId: string, likerId: string, postId: string) {
    if (postAuthorId === likerId) return // Don't notify self

    const liker = await prisma.user.findUnique({
      where: { id: likerId },
      select: { username: true, name: true }
    })

    if (!liker) return

    await this.createNotification({
      type: 'like',
      title: 'Post liked',
      message: `${liker.username || liker.name} liked your post`,
      userId: postAuthorId,
      fromUserId: likerId,
      postId
    })
  }

  /**
   * Create system notification
   */
  static async createSystemNotification(userId: string, title: string, message: string, data?: Record<string, any>) {
    await this.createNotification({
      type: 'system',
      title,
      message,
      userId,
      data
    })
  }

  /**
   * Get user's notification preferences
   */
  static async getUserNotificationPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { notificationPreferences: true } as any
      }) as any

      if (user?.notificationPreferences) {
        return JSON.parse(user.notificationPreferences as string)
      }

      return DEFAULT_PREFERENCES
    } catch (error) {
      console.error('Error getting notification preferences:', error)
      return DEFAULT_PREFERENCES
    }
  }

  /**
   * Update user's notification preferences
   */
  static async updateNotificationPreferences(userId: string, preferences: Partial<NotificationPreferences>) {
    try {
      const currentPrefs = await this.getUserNotificationPreferences(userId)
      const updatedPrefs = { ...currentPrefs, ...preferences }

      await prisma.user.update({
        where: { id: userId },
        data: {
          notificationPreferences: JSON.stringify(updatedPrefs)
        } as any
      })

      return updatedPrefs
    } catch (error) {
      console.error('Error updating notification preferences:', error)
      throw error
    }
  }

  /**
   * Mark notifications as read
   */
  static async markAsRead(userId: string, notificationIds: string[]) {
    try {
      await prisma.notification.updateMany({
        where: {
          id: { in: notificationIds },
          userId
        },
        data: {
          isRead: true
        }
      })
    } catch (error) {
      console.error('Error marking notifications as read:', error)
      throw error
    }
  }

  /**
   * Mark all notifications as read for user
   */
  static async markAllAsRead(userId: string) {
    try {
      await prisma.notification.updateMany({
        where: {
          userId,
          isRead: false
        },
        data: {
          isRead: true
        }
      })
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      throw error
    }
  }

  /**
   * Get notifications for user with pagination
   */
  static async getUserNotifications(userId: string, options: {
    limit?: number
    offset?: number
    unreadOnly?: boolean
    type?: NotificationType
  } = {}) {
    try {
      const { limit = 20, offset = 0, unreadOnly = false, type } = options

      const notifications = await prisma.notification.findMany({
        where: {
          userId,
          ...(unreadOnly && { isRead: false }),
          ...(type && { type })
        },
        include: {
          fromUser: {
            select: {
              id: true,
              username: true,
              name: true,
              image: true
            }
          }
        } as any,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      })

      const unreadCount = await prisma.notification.count({
        where: {
          userId,
          isRead: false
        }
      })

      return { notifications, unreadCount }
    } catch (error) {
      console.error('Error getting user notifications:', error)
      throw error
    }
  }

  /**
   * Delete old notifications (cleanup job)
   */
  static async cleanupOldNotifications(daysOld: number = 90) {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysOld)

      const result = await prisma.notification.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate
          },
          isRead: true
        }
      })

      console.log(`Cleaned up ${result.count} old notifications`)
      return result.count
    } catch (error) {
      console.error('Error cleaning up old notifications:', error)
      throw error
    }
  }

  /**
   * Send email notification
   */
  private static async sendEmailNotification(notification: any) {
    try {
      // TODO: Send email notification (temporary disabled)
      // await sendNotificationEmail(notification)
    } catch (error) {
      console.error('Error sending email notification:', error)
    }
  }

  /**
   * Send push notification
   */
  private static async sendPushNotification(notification: any) {
    try {
      // Implementation for push notifications using web-push
      // This would integrate with service workers and push subscriptions
      console.log('Push notification would be sent here:', notification.title)
    } catch (error) {
      console.error('Error sending push notification:', error)
    }
  }

  /**
   * Process mention parsing from content
   */
  static extractMentions(content: string): string[] {
    const mentionRegex = /@(\w+)/g
    const mentions: string[] = []
    let match

    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push(match[1])
    }

    return mentions
  }

  /**
   * Process mentions in content and create notifications
   */
  static async processMentions(content: string, authorId: string, postId: string) {
    const mentions = this.extractMentions(content)
    
    for (const username of mentions) {
      try {
        const mentionedUser = await prisma.user.findFirst({
          where: {
            OR: [
              { username },
              { name: username }
            ]
          },
          select: { id: true }
        })

        if (mentionedUser && mentionedUser.id !== authorId) {
          await this.createMentionNotification(mentionedUser.id, authorId, postId, content)
        }
      } catch (error) {
        console.error(`Error processing mention for ${username}:`, error)
      }
    }
  }
}

export default NotificationService