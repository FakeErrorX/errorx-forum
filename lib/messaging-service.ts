/**
 * Messaging Service
 * Handles all messaging functionality including conversations, messages, and real-time features
 */

import { prisma } from '@/lib/prisma'
import { webSocketManager } from '@/lib/websocket-server'

export interface CreateConversationData {
  title?: string
  type?: 'direct' | 'group'
  description?: string
  participantIds: string[]
  createdById: string
}

export interface SendMessageData {
  conversationId: string
  senderId: string
  content: string
  type?: 'text' | 'image' | 'file' | 'system' | 'voice'
  replyToId?: string
  attachments?: MessageAttachmentData[]
}

export interface MessageAttachmentData {
  fileName: string
  fileUrl: string
  fileType: string
  fileSize: number
}

export interface MessageReactionData {
  messageId: string
  userId: string
  emoji: string
}

export class MessagingService {
  /**
   * Create a new conversation
   */
  static async createConversation(data: CreateConversationData) {
    try {
      // For direct conversations, check if one already exists between the users
      if (data.type === 'direct' && data.participantIds.length === 2) {
        const existingConversation = await (prisma as any).conversation.findFirst({
          where: {
            type: 'direct',
            participants: {
              every: {
                userId: { in: data.participantIds }
              }
            }
          },
          include: {
            participants: {
              include: { user: { select: { id: true, username: true, name: true, image: true } } }
            },
            messages: {
              take: 1,
              orderBy: { createdAt: 'desc' },
              include: {
                sender: { select: { id: true, username: true, name: true, image: true } }
              }
            }
          }
        })

        if (existingConversation) {
          return existingConversation
        }
      }

      const conversation = await (prisma as any).conversation.create({
        data: {
          title: data.title,
          type: data.type || 'direct',
          description: data.description,
          participants: {
            create: data.participantIds.map((userId, index) => ({
              userId,
              isOwner: userId === data.createdById,
              isAdmin: userId === data.createdById || (data.type === 'group' && index === 0)
            }))
          }
        },
        include: {
          participants: {
            include: { user: { select: { id: true, username: true, name: true, image: true } } }
          }
        }
      })

      // Broadcast conversation creation to participants via WebSocket
      data.participantIds.forEach(userId => {
        (webSocketManager as any).sendNotificationToUser(userId, {
          type: 'conversation_created',
          title: 'New Conversation',
          message: `You have been added to a new conversation`,
          data: { conversation, createdBy: data.createdById }
        })
      })

      return conversation
    } catch (error) {
      console.error('Error creating conversation:', error)
      throw new Error('Failed to create conversation')
    }
  }

  /**
   * Send a message in a conversation
   */
  static async sendMessage(data: SendMessageData) {
    try {
      // Verify user is participant in conversation
      const participant = await (prisma as any).conversationParticipant.findFirst({
        where: {
          conversationId: data.conversationId,
          userId: data.senderId
        }
      })

      if (!participant) {
        throw new Error('User is not a participant in this conversation')
      }

      const message = await (prisma as any).conversationMessage.create({
        data: {
          conversationId: data.conversationId,
          senderId: data.senderId,
          content: data.content,
          type: data.type || 'text',
          replyToId: data.replyToId,
          attachments: data.attachments ? {
            create: data.attachments.map(att => ({
              fileName: att.fileName,
              fileUrl: att.fileUrl,
              fileType: att.fileType,
              fileSize: att.fileSize
            }))
          } : undefined
        },
        include: {
          sender: { select: { id: true, username: true, name: true, image: true } },
          attachments: true,
          reactions: {
            include: { user: { select: { id: true, username: true } } }
          },
          replyTo: {
            include: {
              sender: { select: { id: true, username: true, name: true } }
            }
          }
        }
      })

      // Update conversation's lastMessageAt
      await (prisma as any).conversation.update({
        where: { id: data.conversationId },
        data: { lastMessageAt: new Date() }
      })

      // Get all participants
      const participants = await (prisma as any).conversationParticipant.findMany({
        where: {
          conversationId: data.conversationId
        },
        select: { userId: true }
      })

      // Broadcast message to all participants via WebSocket
      participants.forEach((participant: any) => {
        if (participant.userId !== data.senderId) {
          (webSocketManager as any).sendNotificationToUser(participant.userId, {
            type: 'message_received',
            title: 'New Message',
            message: data.content,
            data: { message, conversationId: data.conversationId }
          })
        }
      })

      return message
    } catch (error) {
      console.error('Error sending message:', error)
      throw new Error('Failed to send message')
    }
  }

  /**
   * Get conversations for a user
   */
  static async getUserConversations(userId: string, limit = 20, offset = 0) {
    try {
      const conversations = await (prisma as any).conversation.findMany({
        where: {
          participants: {
            some: {
              userId
            }
          }
        },
        include: {
          participants: {
            include: { user: { select: { id: true, username: true, name: true, image: true } } }
          },
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            include: {
              sender: { select: { id: true, username: true, name: true, image: true } }
            }
          }
        },
        orderBy: { updatedAt: 'desc' },
        take: limit,
        skip: offset
      })

      // Get unread message counts for each conversation
      const conversationsWithUnread = await Promise.all(
        conversations.map(async (conversation: any) => {
          const participant = conversation.participants.find((p: any) => p.userId === userId)
          const unreadCount = await (prisma as any).conversationMessage.count({
            where: {
              conversationId: conversation.id,
              createdAt: {
                gt: participant?.lastReadAt || new Date(0)
              },
              senderId: { not: userId }
            }
          })

          return {
            ...conversation,
            unreadCount
          }
        })
      )

      return conversationsWithUnread
    } catch (error) {
      console.error('Error getting user conversations:', error)
      throw new Error('Failed to get conversations')
    }
  }

  /**
   * Get messages in a conversation
   */
  static async getConversationMessages(
    conversationId: string,
    userId: string,
    limit = 50,
    offset = 0,
    beforeMessageId?: string
  ) {
    try {
      // Verify user is participant
      const participant = await (prisma as any).conversationParticipant.findFirst({
        where: {
          conversationId,
          userId
        }
      })

      if (!participant) {
        throw new Error('User is not a participant in this conversation')
      }

      let whereClause: any = { conversationId }

      if (beforeMessageId) {
        const beforeMessage = await (prisma as any).conversationMessage.findUnique({
          where: { id: beforeMessageId },
          select: { createdAt: true }
        })
        if (beforeMessage) {
          whereClause.createdAt = { lt: beforeMessage.createdAt }
        }
      }

      const messages = await (prisma as any).conversationMessage.findMany({
        where: whereClause,
        include: {
          sender: { select: { id: true, username: true, name: true, image: true } },
          attachments: true,
          reactions: {
            include: { user: { select: { id: true, username: true } } }
          },
          replyTo: {
            include: {
              sender: { select: { id: true, username: true, name: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      })

      return messages.reverse() // Return in chronological order
    } catch (error) {
      console.error('Error getting conversation messages:', error)
      throw new Error('Failed to get messages')
    }
  }

  /**
   * Mark messages as read
   */
  static async markMessagesAsRead(conversationId: string, userId: string) {
    try {
      // Update participant's lastReadAt
      await (prisma as any).conversationParticipant.updateMany({
        where: {
          conversationId,
          userId
        },
        data: { lastReadAt: new Date() }
      })

      // Broadcast read status to other participants
      const participants = await (prisma as any).conversationParticipant.findMany({
        where: {
          conversationId,
          userId: { not: userId }
        },
        select: { userId: true }
      })

      participants.forEach((participant: any) => {
        (webSocketManager as any).sendNotificationToUser(participant.userId, {
          type: 'messages_read',
          title: 'Messages Read',
          message: 'Messages have been read',
          data: {
            conversationId,
            readByUserId: userId,
            readAt: new Date()
          }
        })
      })
    } catch (error) {
      console.error('Error marking messages as read:', error)
      throw new Error('Failed to mark messages as read')
    }
  }

  /**
   * Add reaction to a message
   */
  static async addMessageReaction(data: MessageReactionData) {
    try {
      // Check if reaction already exists
      const existingReaction = await (prisma as any).messageReaction.findFirst({
        where: {
          messageId: data.messageId,
          userId: data.userId,
          emoji: data.emoji
        }
      })

      if (existingReaction) {
        // Remove reaction if it exists
        await (prisma as any).messageReaction.delete({
          where: { id: existingReaction.id }
        })
        return { action: 'removed', reaction: existingReaction }
      } else {
        // Add new reaction
        const reaction = await (prisma as any).messageReaction.create({
          data: {
            messageId: data.messageId,
            userId: data.userId,
            emoji: data.emoji
          },
          include: {
            user: { select: { id: true, username: true, name: true } }
          }
        })

        // Get message to find conversation
        const message = await (prisma as any).conversationMessage.findUnique({
          where: { id: data.messageId },
          select: { conversationId: true }
        })

        if (message) {
          // Broadcast reaction to conversation participants
          const participants = await (prisma as any).conversationParticipant.findMany({
            where: {
              conversationId: message.conversationId
            },
            select: { userId: true }
          })

          participants.forEach((participant: any) => {
            (webSocketManager as any).sendNotificationToUser(participant.userId, {
              type: 'message_reaction_added',
              title: 'Message Reaction',
              message: `${data.emoji} reaction added`,
              data: {
                messageId: data.messageId,
                reaction
              }
            })
          })
        }

        return { action: 'added', reaction }
      }
    } catch (error) {
      console.error('Error adding message reaction:', error)
      throw new Error('Failed to add reaction')
    }
  }

  /**
   * Start typing indicator
   */
  static async startTyping(conversationId: string, userId: string) {
    try {
      const expiresAt = new Date(Date.now() + 10000) // 10 seconds

      await (prisma as any).typingIndicator.upsert({
        where: {
          conversationId_userId: {
            conversationId,
            userId
          }
        },
        update: { expiresAt },
        create: {
          conversationId,
          userId,
          expiresAt
        }
      })

      // Broadcast typing indicator
      const participants = await (prisma as any).conversationParticipant.findMany({
        where: {
          conversationId,
          userId: { not: userId }
        },
        select: { userId: true }
      })

      const typingUser = await (prisma as any).user.findUnique({
        where: { id: userId },
        select: { id: true, username: true, name: true }
      })

      participants.forEach((participant: any) => {
        (webSocketManager as any).sendNotificationToUser(participant.userId, {
          type: 'user_typing',
          title: 'Typing',
          message: `${typingUser?.username || 'User'} is typing...`,
          data: {
            conversationId,
            user: typingUser
          }
        })
      })
    } catch (error) {
      console.error('Error starting typing indicator:', error)
    }
  }

  /**
   * Stop typing indicator
   */
  static async stopTyping(conversationId: string, userId: string) {
    try {
      await (prisma as any).typingIndicator.deleteMany({
        where: {
          conversationId,
          userId
        }
      })

      // Broadcast stop typing
      const participants = await (prisma as any).conversationParticipant.findMany({
        where: {
          conversationId,
          userId: { not: userId }
        },
        select: { userId: true }
      })

      participants.forEach((participant: any) => {
        (webSocketManager as any).sendNotificationToUser(participant.userId, {
          type: 'user_stopped_typing',
          title: 'Stopped Typing',
          message: 'User stopped typing',
          data: {
            conversationId,
            userId
          }
        })
      })
    } catch (error) {
      console.error('Error stopping typing indicator:', error)
    }
  }

  /**
   * Search messages
   */
  static async searchMessages(userId: string, query: string, conversationId?: string) {
    try {
      const whereClause: any = {
        content: {
          contains: query,
          mode: 'insensitive'
        },
        conversation: {
          participants: {
            some: {
              userId
            }
          }
        }
      }

      if (conversationId) {
        whereClause.conversationId = conversationId
      }

      const messages = await (prisma as any).conversationMessage.findMany({
        where: whereClause,
        include: {
          sender: { select: { id: true, username: true, name: true, image: true } },
          conversation: { select: { id: true, title: true, type: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 50
      })

      return messages
    } catch (error) {
      console.error('Error searching messages:', error)
      throw new Error('Failed to search messages')
    }
  }

  /**
   * Leave conversation
   */
  static async leaveConversation(conversationId: string, userId: string) {
    try {
      await (prisma as any).conversationParticipant.updateMany({
        where: {
          conversationId,
          userId
        },
        data: { leftAt: new Date() }
      })

      // Send system message about user leaving
      const user = await (prisma as any).user.findUnique({
        where: { id: userId },
        select: { username: true, name: true }
      })

      await this.sendMessage({
        conversationId,
        senderId: userId,
        content: `${user?.username || user?.name || 'User'} left the conversation`,
        type: 'system'
      })
    } catch (error) {
      console.error('Error leaving conversation:', error)
      throw new Error('Failed to leave conversation')
    }
  }

  /**
   * Clean up expired typing indicators
   */
  static async cleanupExpiredTypingIndicators() {
    try {
      await (prisma as any).typingIndicator.deleteMany({
        where: {
          expiresAt: {
            lt: new Date()
          }
        }
      })
    } catch (error) {
      console.error('Error cleaning up typing indicators:', error)
    }
  }
}