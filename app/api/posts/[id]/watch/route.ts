import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    type SessionUserWithId = { id?: string }
    const su = session?.user as unknown as SessionUserWithId | undefined
    if (!su?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const permissionCheck = await hasPermission(su.id, PERMISSIONS.USERS_WATCH)
    if (!permissionCheck.hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: postId } = await params

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: postId }
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Check if already watching
    const existingWatch = await prisma.watch.findUnique({
      where: {
        userId_postId: {
          userId: su.id,
          postId: postId
        }
      }
    })

    if (existingWatch) {
      return NextResponse.json({ error: 'Already watching this post' }, { status: 409 })
    }

    // Add to watch list
    await prisma.watch.create({
      data: {
        userId: su.id,
        postId: postId
      }
    })

    return NextResponse.json({ success: true, watching: true })
  } catch (error) {
    console.error('Error watching post:', error)
    return NextResponse.json({ error: 'Failed to watch post' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    type SessionUserWithId = { id?: string }
    const su = session?.user as unknown as SessionUserWithId | undefined
    if (!su?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: postId } = await params

    // Remove from watch list
    await prisma.watch.deleteMany({
      where: {
        userId: su.id,
        postId: postId
      }
    })

    return NextResponse.json({ success: true, watching: false })
  } catch (error) {
    console.error('Error unwatching post:', error)
    return NextResponse.json({ error: 'Failed to unwatch post' }, { status: 500 })
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    type SessionUserWithId = { id?: string }
    const su = session?.user as unknown as SessionUserWithId | undefined
    if (!su?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: postId } = await params

    // Check if user is watching this post
    const watch = await prisma.watch.findUnique({
      where: {
        userId_postId: {
          userId: su.id,
          postId: postId
        }
      }
    })

    return NextResponse.json({ watching: !!watch })
  } catch (error) {
    console.error('Error checking watch status:', error)
    return NextResponse.json({ error: 'Failed to check watch status' }, { status: 500 })
  }
}
