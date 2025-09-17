import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { z } from 'zod'

const createReportSchema = z.object({
  contentType: z.enum(['post', 'comment']),
  contentId: z.string(),
  reason: z.string().min(1).max(100),
  description: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    type SessionUserWithId = { id?: string }
    const su = session?.user as unknown as SessionUserWithId | undefined
    if (!su?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const permissionCheck = await hasPermission(su.id, PERMISSIONS.MODERATE_REPORTS)
    if (!permissionCheck.hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'pending'
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const reports = await prisma.report.findMany({
      where: { status },
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
      include: {
        reporter: {
          select: {
            userId: true,
            username: true,
            name: true
          }
        },
        resolver: {
          select: {
            userId: true,
            username: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json({ reports })
  } catch (error) {
    console.error('Error fetching reports:', error)
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    type SessionUserWithId = { id?: string }
    const su = session?.user as unknown as SessionUserWithId | undefined
    if (!su?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const permissionCheck = await hasPermission(su.id, PERMISSIONS.USERS_REPORT)
    if (!permissionCheck.hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { contentType, contentId, reason, description } = createReportSchema.parse(body)

    // Check if content exists
    if (contentType === 'post') {
      const post = await prisma.post.findUnique({ where: { id: contentId } })
      if (!post) {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 })
      }
    } else if (contentType === 'comment') {
      const comment = await prisma.comment.findUnique({ where: { id: contentId } })
      if (!comment) {
        return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
      }
    }

    // Check if user already reported this content
    const existingReport = await prisma.report.findFirst({
      where: {
        reporterId: su.id,
        contentType,
        contentId
      }
    })

    if (existingReport) {
      return NextResponse.json({ error: 'You have already reported this content' }, { status: 409 })
    }

    const report = await prisma.report.create({
      data: {
        reporterId: su.id,
        contentType,
        contentId,
        reason,
        description
      }
    })

    return NextResponse.json({ report }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 })
    }
    console.error('Error creating report:', error)
    return NextResponse.json({ error: 'Failed to create report' }, { status: 500 })
  }
}
