import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { MessagingService } from '@/lib/messaging-service'
import { z } from 'zod'

// GET /api/messaging/conversations - Get user conversations
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const conversations = await MessagingService.getUserConversations(
      session.user.id,
      limit,
      offset
    )

    return NextResponse.json({ 
      conversations,
      pagination: {
        limit,
        offset,
        hasMore: conversations.length === limit
      }
    })
  } catch (error) {
    console.error('Error fetching conversations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    )
  }
}

// POST /api/messaging/conversations - Create new conversation
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const createConversationSchema = z.object({
      title: z.string().optional(),
      type: z.enum(['direct', 'group']).optional().default('direct'),
      description: z.string().optional(),
      participantIds: z.array(z.string()).min(1),
    })

    const body = await request.json()
    const validatedData = createConversationSchema.parse(body)

    // Add current user to participants if not already included
    if (!validatedData.participantIds.includes(session.user.id)) {
      validatedData.participantIds.push(session.user.id)
    }

    const conversation = await MessagingService.createConversation({
      ...validatedData,
      createdById: session.user.id,
    })

    return NextResponse.json(conversation, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error creating conversation:', error)
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    )
  }
}