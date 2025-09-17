import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const ignoreSchema = z.object({ userId: z.string() })

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const su = session?.user as { id?: string } | undefined
    if (!su?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const ignores = await prisma.ignore.findMany({ where: { ignorerId: su.id }, include: { ignored: { select: { id: true, userId: true, username: true, name: true, image: true } } } })
    return NextResponse.json({ ignores })
  } catch (error) {
    console.error('Error listing ignores:', error)
    return NextResponse.json({ error: 'Failed to list ignores' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const su = session?.user as { id?: string } | undefined
    if (!su?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await request.json()
    const { userId } = ignoreSchema.parse(body)
    if (userId === su.id) return NextResponse.json({ error: 'Cannot ignore yourself' }, { status: 400 })
    await prisma.ignore.upsert({ where: { ignorerId_ignoredId: { ignorerId: su.id, ignoredId: userId } }, update: {}, create: { ignorerId: su.id, ignoredId: userId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 })
    }
    console.error('Error ignoring:', error)
    return NextResponse.json({ error: 'Failed to ignore' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const su = session?.user as { id?: string } | undefined
    if (!su?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await request.json()
    const { userId } = ignoreSchema.parse(body)
    await prisma.ignore.deleteMany({ where: { ignorerId: su.id, ignoredId: userId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 })
    }
    console.error('Error unignoring:', error)
    return NextResponse.json({ error: 'Failed to unignore' }, { status: 500 })
  }
}


