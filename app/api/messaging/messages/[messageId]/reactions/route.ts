import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { MessagingService } from '@/lib/messaging-service'
import { z } from 'zod'

interface MessageParams {
  params: Promise<{
    messageId: string
  }>
}

// POST /api/messaging/messages/[messageId]/reactions - Add or remove reaction
export async function POST(request: NextRequest, { params }: MessageParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { messageId } = await params
    const reactionSchema = z.object({
      emoji: z.string().min(1).max(10)
    })

    const body = await request.json()
    const { emoji } = reactionSchema.parse(body)

    const result = await MessagingService.addMessageReaction({
      messageId,
      userId: session.user.id,
      emoji
    })

    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid reaction data', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error adding message reaction:', error)
    return NextResponse.json(
      { error: 'Failed to add reaction' },
      { status: 500 }
    )
  }
}