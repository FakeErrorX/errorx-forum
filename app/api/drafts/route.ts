import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const upsertSchema = z.object({
  type: z.enum(['post', 'comment']),
  categoryId: z.string().optional(),
  postId: z.string().optional(),
  content: z.string().min(1)
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const su = session?.user as { id?: string } | undefined
    if (!su?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') as 'post' | 'comment' | null
    const postId = searchParams.get('postId') || undefined
    const categoryId = searchParams.get('categoryId') || undefined

    const where: { userId: string; type?: 'post' | 'comment'; postId?: string; categoryId?: string } = { userId: su.id }
    if (type) where.type = type
    if (postId) where.postId = postId
    if (categoryId) where.categoryId = categoryId

    const drafts = await prisma.draft.findMany({ where, orderBy: { updatedAt: 'desc' } })
    return NextResponse.json({ drafts })
  } catch (error) {
    console.error('Error loading drafts:', error)
    return NextResponse.json({ error: 'Failed to load drafts' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const su = session?.user as { id?: string } | undefined
    if (!su?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await request.json()
    const parsed = upsertSchema.parse(body)

    const draft = await prisma.draft.upsert({
      where: {
        // composite uniqueness simulated via match + deleteMany on create if needed
        id: 'noop' // not used
      },
      update: {},
      create: {
        userId: su.id,
        type: parsed.type,
        categoryId: parsed.categoryId,
        postId: parsed.postId,
        content: parsed.content
      }
    })

    return NextResponse.json({ draft }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 })
    }
    console.error('Error saving draft:', error)
    return NextResponse.json({ error: 'Failed to save draft' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const su = session?.user as { id?: string } | undefined
    if (!su?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Draft id is required' }, { status: 400 })
    await prisma.draft.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting draft:', error)
    return NextResponse.json({ error: 'Failed to delete draft' }, { status: 500 })
  }
}


