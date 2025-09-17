import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createPollSchema = z.object({
  question: z.string().min(1).max(200),
  options: z.array(z.string().min(1).max(100)).min(2).max(10),
  isMultiple: z.boolean().optional(),
  closesAt: z.string().datetime().optional(),
})

const voteSchema = z.object({
  optionIds: z.array(z.string()).min(1),
})

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: postId } = await params
    const poll = await prisma.poll.findUnique({
      where: { postId },
      include: { options: true }
    })
    if (!poll) return NextResponse.json({ poll: null })
    return NextResponse.json({ poll })
  } catch (error) {
    console.error('Error fetching poll:', error)
    return NextResponse.json({ error: 'Failed to fetch poll' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    const su = session?.user as { id?: string } | undefined
    if (!su?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: postId } = await params
    const body = await request.json()
    const parsed = createPollSchema.parse(body)

    // ensure author owns post
    const post = await prisma.post.findUnique({ where: { id: postId } })
    if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    if (post.authorId !== su.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const poll = await prisma.poll.create({
      data: {
        postId,
        question: parsed.question,
        isMultiple: parsed.isMultiple ?? false,
        closesAt: parsed.closesAt ? new Date(parsed.closesAt) : null,
        options: {
          create: parsed.options.map(text => ({ text })),
        },
      },
      include: { options: true },
    })
    return NextResponse.json({ poll }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 })
    }
    console.error('Error creating poll:', error)
    return NextResponse.json({ error: 'Failed to create poll' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    const su = session?.user as { id?: string } | undefined
    if (!su?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: postId } = await params
    const body = await request.json()
    const parsed = voteSchema.parse(body)

    const poll = await prisma.poll.findUnique({ where: { postId } })
    if (!poll) return NextResponse.json({ error: 'Poll not found' }, { status: 404 })

    // validate options belong to poll
    const opts = await prisma.pollOption.findMany({ where: { id: { in: parsed.optionIds }, pollId: poll.id } })
    if (opts.length !== parsed.optionIds.length) return NextResponse.json({ error: 'Invalid options' }, { status: 400 })

    if (!poll.isMultiple && parsed.optionIds.length > 1) {
      return NextResponse.json({ error: 'Multiple selections not allowed' }, { status: 400 })
    }

    // remove existing votes for this poll by user to allow change
    await prisma.pollVote.deleteMany({ where: { pollId: poll.id, userId: su.id } })

    // create votes and increment counters
    await prisma.$transaction([
      ...parsed.optionIds.map(optionId => prisma.pollVote.create({ data: { pollId: poll.id, optionId, userId: su.id as string } })),
      ...parsed.optionIds.map(optionId => prisma.pollOption.update({ where: { id: optionId }, data: { votes: { increment: 1 } } })),
    ])

    const updated = await prisma.poll.findUnique({ where: { id: poll.id }, include: { options: true } })
    return NextResponse.json({ poll: updated })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 })
    }
    console.error('Error voting:', error)
    return NextResponse.json({ error: 'Failed to vote' }, { status: 500 })
  }
}


