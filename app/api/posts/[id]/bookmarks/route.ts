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
    await prisma.bookmark.upsert({
      where: { userId_postId: { userId: su.id, postId } },
      update: {},
      create: { userId: su.id, postId },
    })
    return NextResponse.json({ success: true, bookmarked: true })
  } catch (error) {
    console.error('Error bookmarking post:', error)
    return NextResponse.json({ error: 'Failed to bookmark' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    const su = session?.user as { id?: string } | undefined
    if (!su?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: postId } = await params
    await prisma.bookmark.deleteMany({ where: { userId: su.id, postId } })
    return NextResponse.json({ success: true, bookmarked: false })
  } catch (error) {
    console.error('Error removing bookmark:', error)
    return NextResponse.json({ error: 'Failed to remove bookmark' }, { status: 500 })
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    const su = session?.user as { id?: string } | undefined
    if (!su?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: postId } = await params
    const bm = await prisma.bookmark.findUnique({ where: { userId_postId: { userId: su.id, postId } } })
    return NextResponse.json({ bookmarked: !!bm })
  } catch (error) {
    console.error('Error checking bookmark:', error)
    return NextResponse.json({ error: 'Failed to check bookmark' }, { status: 500 })
  }
}


