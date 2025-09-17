import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createConversationSchema = z.object({
  title: z.string().optional(),
  participantIds: z.array(z.string()).min(1), // at least one recipient
  firstMessage: z.string().min(1)
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const su = session?.user as { id?: string } | undefined
    if (!su?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const conversations = await prisma.conversationParticipant.findMany({
      where: { userId: su.id },
      include: {
        conversation: {
          include: {
            participants: {
              include: { user: { select: { id: true, userId: true, username: true, name: true, image: true } } }
            },
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              include: { sender: { select: { id: true, userId: true, username: true, name: true } } }
            }
          }
        }
      },
      orderBy: { joinedAt: 'desc' }
    })

    const data = conversations.map(cp => ({
      id: cp.conversationId,
      title: cp.conversation.title,
      lastMessage: cp.conversation.messages[0] || null,
      participants: cp.conversation.participants.map(p => ({
        id: p.user.id,
        userId: p.user.userId,
        username: p.user.username,
        name: p.user.name,
        image: p.user.image,
        isOwner: p.isOwner
      }))
    }))

    return NextResponse.json({ conversations: data })
  } catch (error) {
    console.error('Error listing conversations:', error)
    return NextResponse.json({ error: 'Failed to list conversations' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const su = session?.user as { id?: string } | undefined
    if (!su?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const parsed = createConversationSchema.parse(body)

    // ensure unique participants inc. creator
    const participantIds = Array.from(new Set([su.id, ...parsed.participantIds]))

    const conversation = await prisma.conversation.create({
      data: {
        title: parsed.title,
        participants: {
          create: participantIds.map(userId => ({ userId, isOwner: userId === su.id }))
        },
        messages: {
          create: [{ senderId: su.id, content: parsed.firstMessage }]
        }
      },
      include: {
        participants: true,
        messages: { orderBy: { createdAt: 'desc' }, take: 1 }
      }
    })

    return NextResponse.json({ conversation }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 })
    }
    console.error('Error creating conversation:', error)
    return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 })
  }
}


