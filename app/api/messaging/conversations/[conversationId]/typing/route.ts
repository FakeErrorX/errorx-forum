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

// POST /api/messaging/conversations/[conversationId]/typing - Start typing indicator
export async function POST(request: NextRequest, { params }: ConversationParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { conversationId } = await params
    await MessagingService.startTyping(
      conversationId,
      session.user.id
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error starting typing indicator:', error)
    return NextResponse.json(
      { error: 'Failed to start typing indicator' },
      { status: 500 }
    )
  }
}

// DELETE /api/messaging/conversations/[conversationId]/typing - Stop typing indicator
export async function DELETE(request: NextRequest, { params }: ConversationParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { conversationId } = await params
    await MessagingService.stopTyping(
      conversationId,
      session.user.id
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error stopping typing indicator:', error)
    return NextResponse.json(
      { error: 'Failed to stop typing indicator' },
      { status: 500 }
    )
  }
}