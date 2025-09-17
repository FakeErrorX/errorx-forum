import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    const su = session?.user as { id?: string } | undefined
    if (!su?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: postId } = await params
    const { type } = await request.json()
    if (!type) return NextResponse.json({ error: 'type is required' }, { status: 400 })

    await prisma.reaction.upsert({
      where: {
        userId_postId_type: {
          userId: su.id,
          postId,
          type,
        },
      },
      update: {},
      create: { userId: su.id, postId, type },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error reacting to post:', error)
    return NextResponse.json({ error: 'Failed to add reaction' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    const su = session?.user as { id?: string } | undefined
    if (!su?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: postId } = await params
    const { type } = await request.json()
    if (!type) return NextResponse.json({ error: 'type is required' }, { status: 400 })

    await prisma.reaction.deleteMany({ where: { userId: su.id, postId, type } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing reaction:', error)
    return NextResponse.json({ error: 'Failed to remove reaction' }, { status: 500 })
  }
}


