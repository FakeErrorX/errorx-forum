import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { z } from 'zod'

const resolveReportSchema = z.object({
  status: z.enum(['resolved', 'dismissed']),
  resolution: z.string().optional(),
})

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const { id: reportId } = await params
    const body = await request.json()
    const { status, resolution } = resolveReportSchema.parse(body)

    const report = await prisma.report.findUnique({
      where: { id: reportId }
    })

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    if (report.status !== 'pending') {
      return NextResponse.json({ error: 'Report already resolved' }, { status: 409 })
    }

    const updatedReport = await prisma.report.update({
      where: { id: reportId },
      data: {
        status,
        resolvedBy: su.id,
        resolvedAt: new Date(),
        description: resolution ? `${report.description}\n\nResolution: ${resolution}` : report.description
      },
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

    return NextResponse.json({ report: updatedReport })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 })
    }
    console.error('Error resolving report:', error)
    return NextResponse.json({ error: 'Failed to resolve report' }, { status: 500 })
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

    const permissionCheck = await hasPermission(su.id, PERMISSIONS.MODERATE_REPORTS)
    if (!permissionCheck.hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: reportId } = await params

    const report = await prisma.report.findUnique({
      where: { id: reportId },
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

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    return NextResponse.json({ report })
  } catch (error) {
    console.error('Error fetching report:', error)
    return NextResponse.json({ error: 'Failed to fetch report' }, { status: 500 })
  }
}
