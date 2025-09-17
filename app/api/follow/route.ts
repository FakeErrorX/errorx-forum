import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const followSchema = z.object({ userId: z.string() })

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const su = session?.user as { id?: string } | undefined
    if (!su?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const following = await prisma.follow.findMany({ where: { followerId: su.id }, include: { following: { select: { id: true, userId: true, username: true, name: true, image: true } } } })
    const followers = await prisma.follow.findMany({ where: { followingId: su.id }, include: { follower: { select: { id: true, userId: true, username: true, name: true, image: true } } } })

    return NextResponse.json({ following, followers })
  } catch (error) {
    console.error('Error listing follow data:', error)
    return NextResponse.json({ error: 'Failed to list follow data' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const su = session?.user as { id?: string } | undefined
    if (!su?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await request.json()
    const { userId } = followSchema.parse(body)
    if (userId === su.id) return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 })
    await prisma.follow.upsert({ where: { followerId_followingId: { followerId: su.id, followingId: userId } }, update: {}, create: { followerId: su.id, followingId: userId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 })
    }
    console.error('Error following:', error)
    return NextResponse.json({ error: 'Failed to follow' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const su = session?.user as { id?: string } | undefined
    if (!su?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await request.json()
    const { userId } = followSchema.parse(body)
    await prisma.follow.deleteMany({ where: { followerId: su.id, followingId: userId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 })
    }
    console.error('Error unfollowing:', error)
    return NextResponse.json({ error: 'Failed to unfollow' }, { status: 500 })
  }
}


