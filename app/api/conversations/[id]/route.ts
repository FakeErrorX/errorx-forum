import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const sendMessageSchema = z.object({
  content: z.string().min(1),
})

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    const su = session?.user as { id?: string } | undefined
    if (!su?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params

    const canAccess = await prisma.conversationParticipant.findFirst({ where: { conversationId: id, userId: su.id } })
    if (!canAccess) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        participants: { include: { user: { select: { id: true, userId: true, username: true, name: true } } } },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: { sender: { select: { id: true, userId: true, username: true, name: true } } }
        }
      }
    })
    if (!conversation) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // mark read
    await prisma.conversationParticipant.update({ where: { conversationId_userId: { conversationId: id, userId: su.id } }, data: { lastReadAt: new Date() } })

    return NextResponse.json({ conversation })
  } catch (error) {
    console.error('Error getting conversation:', error)
    return NextResponse.json({ error: 'Failed to get conversation' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    const su = session?.user as { id?: string } | undefined
    if (!su?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    const body = await request.json()
    const parsed = sendMessageSchema.parse(body)

    const cp = await prisma.conversationParticipant.findFirst({ where: { conversationId: id, userId: su.id } })
    if (!cp) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const message = await prisma.conversationMessage.create({ data: { conversationId: id, senderId: su.id, content: parsed.content } })
    await prisma.conversation.update({ where: { id }, data: { updatedAt: new Date() } })

    return NextResponse.json({ message }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 })
    }
    console.error('Error sending message:', error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}


