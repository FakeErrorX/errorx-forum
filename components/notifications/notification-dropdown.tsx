"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Bell, Check, CheckCheck, Settings, X } from 'lucide-react'
import { useNotifications, RealtimeNotification } from './notification-provider'
import { formatDistanceToNow } from 'date-fns'

interface NotificationDropdownProps {
  className?: string
}

export function NotificationDropdown({ className }: NotificationDropdownProps) {
  const { unreadCount, notifications, markAsRead, markAllAsRead } = useNotifications()
  const [isOpen, setIsOpen] = useState(false)

  const handleNotificationClick = (notification: RealtimeNotification) => {
    // Mark as read if unread
    if (!('isRead' in notification) || !notification.isRead) {
      markAsRead([notification.id])
    }

    // Navigate to relevant page
    if (notification.postId) {
      window.location.href = `/posts/${notification.postId}`
    } else if (notification.type === 'message') {
      window.location.href = '/conversations'
    } else if (notification.type === 'follow' && notification.fromUserId) {
      window.location.href = `/profile/${notification.fromUserId}`
    }

    setIsOpen(false)
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'mention': return '💬'
      case 'reply': return '💭'
      case 'follow': return '👥'
      case 'like': return '❤️'
      case 'trophy': return '🏆'
      case 'message': return '✉️'
      case 'system': return '🔔'
      case 'warning': return '⚠️'
      case 'ban': return '🚫'
      default: return '📨'
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'mention': return 'bg-blue-100 text-blue-800'
      case 'reply': return 'bg-green-100 text-green-800'
      case 'follow': return 'bg-purple-100 text-purple-800'
      case 'like': return 'bg-pink-100 text-pink-800'
      case 'trophy': return 'bg-yellow-100 text-yellow-800'
      case 'message': return 'bg-indigo-100 text-indigo-800'
      case 'system': return 'bg-gray-100 text-gray-800'
      case 'warning': return 'bg-orange-100 text-orange-800'
      case 'ban': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={className}>
          <div className="relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </div>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-96">
        <div className="pb-3 px-3 pt-3">
          <div className="flex items-center justify-between">
            <DropdownMenuLabel className="text-base font-semibold">
              Notifications
            </DropdownMenuLabel>
            <div className="flex gap-1">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs h-7 px-2"
                >
                  <CheckCheck className="h-3 w-3 mr-1" />
                  Mark all read
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.location.href = '/settings'}
                className="text-xs h-7 px-2"
              >
                <Settings className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
        
        <Separator />
        
        <ScrollArea className="h-96">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No notifications yet</p>
              <p className="text-xs">When you get notifications, they'll show up here</p>
            </div>
          ) : (
            <div className="p-1">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onClick={() => handleNotificationClick(notification)}
                  onMarkRead={() => markAsRead([notification.id])}
                  getIcon={getNotificationIcon}
                  getColor={getNotificationColor}
                />
              ))}
            </div>
          )}
        </ScrollArea>
        
        {notifications.length > 0 && (
          <>
            <Separator />
            <div className="p-2">
              <Button
                variant="ghost"
                className="w-full text-sm"
                onClick={() => {
                  window.location.href = '/notifications'
                  setIsOpen(false)
                }}
              >
                View all notifications
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

interface NotificationItemProps {
  notification: RealtimeNotification & { isRead?: boolean }
  onClick: () => void
  onMarkRead: () => void
  getIcon: (type: string) => string
  getColor: (type: string) => string
}

function NotificationItem({ 
  notification, 
  onClick, 
  onMarkRead, 
  getIcon, 
  getColor 
}: NotificationItemProps) {
  const isUnread = !notification.isRead

  return (
    <DropdownMenuItem
      className={`p-3 cursor-pointer flex items-start gap-3 ${
        isUnread ? 'bg-muted/50' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex-shrink-0">
        {notification.data?.fromUser?.image ? (
          <Avatar className="h-8 w-8">
            <AvatarImage src={notification.data.fromUser.image} />
            <AvatarFallback>
              {notification.data.fromUser.name?.[0] || 
               notification.data.fromUser.username?.[0] || 
               '?'}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center text-white text-sm">
            {getIcon(notification.type)}
          </div>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium truncate">
            {notification.title}
          </p>
          {isUnread && (
            <div className="flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onMarkRead()
                }}
                className="h-6 w-6 p-0 hover:bg-muted"
              >
                <Check className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
        
        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
          {notification.message}
        </p>
        
        <div className="flex items-center gap-2 mt-2">
          <Badge 
            variant="secondary" 
            className={`text-xs ${getColor(notification.type)}`}
          >
            {notification.type}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
          </span>
        </div>
      </div>
      
      {isUnread && (
        <div className="flex-shrink-0">
          <div className="h-2 w-2 rounded-full bg-blue-500" />
        </div>
      )}
    </DropdownMenuItem>
  )
}

export default NotificationDropdown