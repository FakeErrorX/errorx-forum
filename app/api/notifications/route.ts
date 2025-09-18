import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NotificationService } from '@/lib/notification-service'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    type SessionUserWithId = { id?: string }
    const su = session?.user as unknown as SessionUserWithId | undefined
    if (!su?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const type = searchParams.get('type') as any

    const result = await NotificationService.getUserNotifications(su.id, {
      limit,
      offset,
      unreadOnly,
      type
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    type SessionUserWithId = { id?: string }
    const su = session?.user as unknown as SessionUserWithId | undefined
    if (!su?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type, title, message, userId, ...data } = body

    // Only allow creating notifications for the authenticated user or by admins
    if (userId !== su.id) {
      // Check if user is admin - simplified for now
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const notification = await NotificationService.createNotification({
      type,
      title,
      message,
      userId: su.id,
      ...data
    })

    return NextResponse.json(notification, { status: 201 })
  } catch (error) {
    console.error('Error creating notification:', error)
    return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    type SessionUserWithId = { id?: string }
    const su = session?.user as unknown as SessionUserWithId | undefined
    if (!su?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, notificationId, notificationIds } = body

    if (action === 'mark_read' && (notificationId || notificationIds)) {
      const ids = notificationId ? [notificationId] : notificationIds
      await NotificationService.markAsRead(su.id, ids)
    } else if (action === 'mark_all_read') {
      await NotificationService.markAllAsRead(su.id)
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating notifications:', error)
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 })
  }
}
