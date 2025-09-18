"use client"

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { io, Socket } from 'socket.io-client'
import { toast } from 'sonner'

export interface RealtimeNotification {
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

interface NotificationContextType {
  socket: Socket | null
  isConnected: boolean
  unreadCount: number
  notifications: RealtimeNotification[]
  markAsRead: (notificationIds: string[]) => void
  markAllAsRead: () => void
  joinRoom: (room: string) => void
  leaveRoom: (room: string) => void
  startTyping: (data: { postId?: string; conversationId?: string }) => void
  stopTyping: (data: { postId?: string; conversationId?: string }) => void
}

const NotificationContext = createContext<NotificationContextType>({
  socket: null,
  isConnected: false,
  unreadCount: 0,
  notifications: [],
  markAsRead: () => {},
  markAllAsRead: () => {},
  joinRoom: () => {},
  leaveRoom: () => {},
  startTyping: () => {},
  stopTyping: () => {}
})

export const useNotifications = () => useContext(NotificationContext)

interface NotificationProviderProps {
  children: React.ReactNode
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const { data: session, status } = useSession()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([])

  // Initialize socket connection
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || '', {
        path: '/api/socket',
        transports: ['websocket', 'polling']
      })

      socketInstance.on('connect', () => {
        console.log('Socket connected:', socketInstance.id)
        setIsConnected(true)
        
        // Authenticate with the server
        // For now, we'll use a simple authentication method
        // In production, you might want to use JWT tokens
        socketInstance.emit('authenticate', session.user?.email || '')
      })

      socketInstance.on('disconnect', () => {
        console.log('Socket disconnected')
        setIsConnected(false)
      })

      socketInstance.on('authenticated', (data) => {
        console.log('Socket authenticated:', data)
      })

      socketInstance.on('auth_error', (error) => {
        console.error('Socket authentication error:', error)
        toast.error('Failed to connect to real-time notifications')
      })

      // Handle new notifications
      socketInstance.on('notification:new', (notification: RealtimeNotification) => {
        console.log('New notification received:', notification)
        
        setNotifications(prev => [notification, ...prev.slice(0, 49)]) // Keep last 50
        setUnreadCount(prev => prev + 1)
        
        // Show toast notification
        showNotificationToast(notification)
      })

      // Handle unread count updates
      socketInstance.on('notification:unread_count', (count: number) => {
        setUnreadCount(count)
      })

      // Handle broadcast notifications (e.g., system-wide)
      socketInstance.on('notification:broadcast', (notification: RealtimeNotification) => {
        showNotificationToast(notification)
      })

      // Handle system notifications
      socketInstance.on('notification:system', (notification: Omit<RealtimeNotification, 'userId'>) => {
        showNotificationToast(notification as RealtimeNotification)
      })

      // Handle typing indicators
      socketInstance.on('typing:user_typing', (data: { userId: string; username: string }) => {
        // Handle typing indicator UI updates
        console.log(`${data.username} is typing...`)
      })

      socketInstance.on('typing:user_stopped', (data: { userId: string }) => {
        // Handle stop typing indicator UI updates
        console.log(`User ${data.userId} stopped typing`)
      })

      setSocket(socketInstance)

      return () => {
        socketInstance.disconnect()
      }
    }
  }, [session, status])

  const showNotificationToast = useCallback((notification: RealtimeNotification) => {
    const getIcon = (type: string) => {
      switch (type) {
        case 'mention': return '💬'
        case 'reply': return '💭'
        case 'follow': return '👥'
        case 'like': return '❤️'
        case 'trophy': return '🏆'
        case 'message': return '✉️'
        case 'system': return '🔔'
        default: return '📨'
      }
    }

    toast(notification.title, {
      description: notification.message,
      icon: getIcon(notification.type),
      action: notification.postId ? {
        label: 'View',
        onClick: () => {
          if (notification.postId) {
            window.location.href = `/posts/${notification.postId}`
          } else if (notification.type === 'message') {
            window.location.href = '/conversations'
          }
        }
      } : undefined,
      duration: 5000
    })
  }, [])

  const markAsRead = useCallback((notificationIds: string[]) => {
    if (socket) {
      socket.emit('notification:mark_read', notificationIds)
      setNotifications(prev => 
        prev.map(n => 
          notificationIds.includes(n.id) ? { ...n, isRead: true } : n
        )
      )
    }
  }, [socket])

  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        setUnreadCount(0)
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      toast.error('Failed to mark notifications as read')
    }
  }, [])

  const joinRoom = useCallback((room: string) => {
    if (socket) {
      socket.emit('join_room', room)
    }
  }, [socket])

  const leaveRoom = useCallback((room: string) => {
    if (socket) {
      socket.emit('leave_room', room)
    }
  }, [socket])

  const startTyping = useCallback((data: { postId?: string; conversationId?: string }) => {
    if (socket) {
      socket.emit('typing:start', data)
    }
  }, [socket])

  const stopTyping = useCallback((data: { postId?: string; conversationId?: string }) => {
    if (socket) {
      socket.emit('typing:stop', data)
    }
  }, [socket])

  // Load initial notifications
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const response = await fetch('/api/notifications?limit=20')
        if (response.ok) {
          const data = await response.json()
          setNotifications(data.notifications || [])
          setUnreadCount(data.unreadCount || 0)
        }
      } catch (error) {
        console.error('Error loading notifications:', error)
      }
    }

    if (session?.user) {
      loadNotifications()
    }
  }, [session])

  const value: NotificationContextType = {
    socket,
    isConnected,
    unreadCount,
    notifications,
    markAsRead,
    markAllAsRead,
    joinRoom,
    leaveRoom,
    startTyping,
    stopTyping
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export default NotificationProvider