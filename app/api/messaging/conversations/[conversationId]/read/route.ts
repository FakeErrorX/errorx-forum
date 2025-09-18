import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { MessagingService } from '@/lib/messaging-service'
import { z } from 'zod'

interface ConversationParams {
  params: Promise<{
    conversationId: string
  }>
}

// POST /api/messaging/conversations/[conversationId]/read - Mark messages as read
export async function POST(request: NextRequest, { params }: ConversationParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { conversationId } = await params
    await MessagingService.markMessagesAsRead(
      conversationId,
      session.user.id
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error marking messages as read:', error)
    
    if (error instanceof Error && error.message.includes('not a participant')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    return NextResponse.json(
      { error: 'Failed to mark messages as read' },
      { status: 500 }
    )
  }
}