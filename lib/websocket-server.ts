/**
 * WebSocket Server for Real-time Notifications
 * Handles real-time communication for the forum
 */

import { Server as SocketIOServer } from 'socket.io'
import { Server as HTTPServer } from 'http'
import { NextApiRequest } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export interface NotificationData {
  id: string
  type: 'mention' | 'reply' | 'follow' | 'like' | 'trophy' | 'message' | 'system'
  title: string
  message: string
  data?: Record<string, any>
  userId: string
  fromUserId?: string
  postId?: string
  commentId?: string
  createdAt: Date
}

export interface UserSession {
  userId: string
  username: string
  socketId: string
  joinedAt: Date
}

class WebSocketManager {
  private io: SocketIOServer | null = null
  private activeSessions = new Map<string, UserSession>()
  private userSockets = new Map<string, Set<string>>() // userId -> Set of socketIds

  initialize(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.NEXTAUTH_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true,
      },
      path: "/api/socket",
    })

    this.io.on('connection', (socket) => {
      // console.log('Socket connected:', socket.id)

      // Handle authentication  
      socket.on('authenticate', async (sessionData: any) => {
        try {
          // For now, we'll accept the session data directly from the client
          // In production, implement proper JWT token verification
          if (sessionData?.user?.id) {
            const userId = sessionData.user.id
            const username = sessionData.user.username || sessionData.user.name || 'Unknown'
            
            // Store user session
            const userSession: UserSession = {
              userId,
              username,
              socketId: socket.id,
              joinedAt: new Date()
            }
            
            this.activeSessions.set(socket.id, userSession)
            
            // Track user's sockets
            if (!this.userSockets.has(userId)) {
              this.userSockets.set(userId, new Set())
            }
            this.userSockets.get(userId)!.add(socket.id)
            
            // Join user to their personal room
            socket.join(`user:${userId}`)
            
            // Send initial data
            socket.emit('authenticated', {
              userId,
              username,
              timestamp: new Date()
            })

            // Send unread notifications count
            const unreadCount = await this.getUnreadNotificationCount(userId)
            socket.emit('notification:unread_count', unreadCount)

            // console.log(`User ${username} (${userId}) authenticated with socket ${socket.id}`)
          } else {
            socket.emit('auth_error', 'Invalid session')
          }
        } catch (error) {
          console.error('Socket authentication error:', error)
          socket.emit('auth_error', 'Authentication failed')
        }
      })

      // Handle joining specific rooms (e.g., post comments)
      socket.on('join_room', (room: string) => {
        const session = this.activeSessions.get(socket.id)
        if (session) {
          socket.join(room)
          // console.log(`User ${session.username} joined room: ${room}`)
        }
      })

      // Handle leaving rooms
      socket.on('leave_room', (room: string) => {
        socket.leave(room)
      })

      // Handle marking notifications as read
      socket.on('notification:mark_read', async (notificationIds: string[]) => {
        const session = this.activeSessions.get(socket.id)
        if (session) {
          await this.markNotificationsRead(session.userId, notificationIds)
          const unreadCount = await this.getUnreadNotificationCount(session.userId)
          socket.emit('notification:unread_count', unreadCount)
        }
      })

      // Handle typing indicators
      socket.on('typing:start', (data: { postId?: string, conversationId?: string }) => {
        const session = this.activeSessions.get(socket.id)
        if (session) {
          const room = data.postId ? `post:${data.postId}` : `conversation:${data.conversationId}`
          socket.to(room).emit('typing:user_typing', {
            userId: session.userId,
            username: session.username
          })
        }
      })

      socket.on('typing:stop', (data: { postId?: string, conversationId?: string }) => {
        const session = this.activeSessions.get(socket.id)
        if (session) {
          const room = data.postId ? `post:${data.postId}` : `conversation:${data.conversationId}`
          socket.to(room).emit('typing:user_stopped', {
            userId: session.userId
          })
        }
      })

      // Handle disconnect
      socket.on('disconnect', () => {
        const session = this.activeSessions.get(socket.id)
        if (session) {
          // console.log(`User ${session.username} disconnected`)
          
          // Remove from user sockets tracking
          const userSockets = this.userSockets.get(session.userId)
          if (userSockets) {
            userSockets.delete(socket.id)
            if (userSockets.size === 0) {
              this.userSockets.delete(session.userId)
            }
          }
          
          this.activeSessions.delete(socket.id)
        }
      })
    })

    // console.log('WebSocket server initialized')
  }

  private async verifySocketToken(token: string) {
    // For now, we'll use a simple approach
    // In production, you might want to use JWT tokens
    try {
      // This is a simplified verification - you might want to implement
      // proper JWT token verification here
      return null // Placeholder for now
    } catch (error) {
      return null
    }
  }

  private async getUnreadNotificationCount(userId: string): Promise<number> {
    try {
      return await prisma.notification.count({
        where: {
          userId,
          isRead: false
        }
      })
    } catch (error) {
      console.error('Error getting unread notification count:', error)
      return 0
    }
  }

  private async markNotificationsRead(userId: string, notificationIds: string[]) {
    try {
      await prisma.notification.updateMany({
        where: {
          id: { in: notificationIds },
          userId
        },
        data: {
          isRead: true,
          readAt: new Date()
        } as any
      })
    } catch (error) {
      console.error('Error marking notifications as read:', error)
    }
  }

  // Send notification to specific user
  sendNotificationToUser(userId: string, notification: NotificationData) {
    if (!this.io) return

    const userSockets = this.userSockets.get(userId)
    if (userSockets && userSockets.size > 0) {
      this.io.to(`user:${userId}`).emit('notification:new', notification)
      // console.log(`Sent notification to user ${userId}:`, notification.title)
    }
  }

  // Send notification to room (e.g., all users viewing a post)
  sendNotificationToRoom(room: string, notification: NotificationData) {
    if (!this.io) return
    this.io.to(room).emit('notification:broadcast', notification)
  }

  // Broadcast system-wide notification
  broadcastSystemNotification(notification: Omit<NotificationData, 'userId'>) {
    if (!this.io) return
    this.io.emit('notification:system', notification)
  }

  // Get online users count
  getOnlineUsersCount(): number {
    return this.userSockets.size
  }

  // Get active sessions
  getActiveSessions(): UserSession[] {
    return Array.from(this.activeSessions.values())
  }

  // Check if user is online
  isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId)
  }
}

export const webSocketManager = new WebSocketManager()
export default webSocketManager