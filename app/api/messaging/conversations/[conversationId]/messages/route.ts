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

// GET /api/messaging/conversations/[conversationId]/messages - Get conversation messages
export async function GET(request: NextRequest, { params }: ConversationParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { conversationId } = await params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const beforeMessageId = searchParams.get('before') || undefined

    const messages = await MessagingService.getConversationMessages(
      conversationId,
      session.user.id,
      limit,
      offset,
      beforeMessageId
    )

    return NextResponse.json({ 
      messages,
      pagination: {
        limit,
        offset,
        hasMore: messages.length === limit
      }
    })
  } catch (error) {
    console.error('Error fetching conversation messages:', error)
    
    if (error instanceof Error && error.message.includes('not a participant')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

// POST /api/messaging/conversations/[conversationId]/messages - Send message
export async function POST(request: NextRequest, { params }: ConversationParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { conversationId } = await params
    const sendMessageSchema = z.object({
      content: z.string().min(1).max(10000),
      type: z.enum(['text', 'image', 'file', 'system', 'voice']).optional().default('text'),
      replyToId: z.string().optional(),
      attachments: z.array(z.object({
        fileName: z.string(),
        fileUrl: z.string().url(),
        fileType: z.string(),
        fileSize: z.number()
      })).optional()
    })

    const body = await request.json()
    const validatedData = sendMessageSchema.parse(body)

    const message = await MessagingService.sendMessage({
      conversationId,
      senderId: session.user.id,
      ...validatedData
    })

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid message data', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error sending message:', error)
    
    if (error instanceof Error && error.message.includes('not a participant')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}