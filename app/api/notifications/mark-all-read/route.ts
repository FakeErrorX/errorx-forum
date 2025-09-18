import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NotificationService } from '@/lib/notification-service'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    type SessionUserWithId = { id?: string }
    const su = session?.user as unknown as SessionUserWithId | undefined
    if (!su?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await NotificationService.markAllAsRead(su.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error marking all notifications as read:', error)
    return NextResponse.json({ error: 'Failed to mark notifications as read' }, { status: 500 })
  }
}