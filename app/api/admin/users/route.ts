import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hasEnhancedPermission, ENHANCED_PERMISSIONS } from '@/lib/permissions'
import { z } from 'zod'

const UpdateUserSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  username: z.string().optional(),
  email: z.string().email().optional(),
  roleId: z.string().optional(),
  secondaryRoles: z.array(z.string()).optional(),
  isBanned: z.boolean().optional(),
  banReason: z.string().optional(),
  banExpiresAt: z.string().datetime().optional().nullable(),
  isActive: z.boolean().optional(),
  customTitle: z.string().optional().nullable(),
  warningPoints: z.number().min(0).optional(),
})

const CreateWarningSchema = z.object({
  userId: z.string(),
  title: z.string().optional(),
  reason: z.string().min(1),
  points: z.number().min(1).max(100),
  expiresAt: z.string().datetime().optional(),
  isActive: z.boolean().default(true),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    type SessionUserWithId = { id?: string }
    const su = session?.user as unknown as SessionUserWithId | undefined
    if (!su?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin permissions
    const hasAccess = await hasEnhancedPermission(su.id, ENHANCED_PERMISSIONS.ADMIN.MANAGE_USERS)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
    const search = searchParams.get('search') || ''
    const roleFilter = searchParams.get('role') || ''
    const statusFilter = searchParams.get('status') || ''
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc'

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (roleFilter) {
      where.role = { name: roleFilter }
    }

    if (statusFilter === 'banned') {
      where.isBanned = true
    } else if (statusFilter === 'active') {
      where.isBanned = false
      where.isActive = true
    } else if (statusFilter === 'inactive') {
      where.isActive = false
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        include: {
          role: true,
          secondaryRoles: {
            include: {
              role: true
            }
          },
          warnings: {
            where: { isActive: true },
            orderBy: { createdAt: 'desc' }
          },
          sessions: {
            where: { expires: { gt: new Date() } },
            take: 5,
            orderBy: { expires: 'desc' }
          },
          userIpLogs: {
            take: 10,
            orderBy: { timestamp: 'desc' }
          },
          _count: {
            select: {
              posts: true,
              comments: true,
              userTrophies: true
            }
          }
        },
        orderBy: { [sortBy]: sortOrder }
      }),
      prisma.user.count({ where })
    ])

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    type SessionUserWithId = { id?: string }
    const su = session?.user as unknown as SessionUserWithId | undefined
    if (!su?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin permissions
    const hasAccess = await hasEnhancedPermission(su.id, ENHANCED_PERMISSIONS.ADMIN.MANAGE_USERS)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const data = UpdateUserSchema.parse(body)

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: data.id },
      include: { role: true }
    })

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Prevent modifying super admin users unless you're a super admin
    const isSuperAdmin = await hasEnhancedPermission(su.id, ENHANCED_PERMISSIONS.SPECIAL.SUPER_ADMIN)
    if (existingUser.role?.name === 'super_admin' && !isSuperAdmin) {
      return NextResponse.json({ error: 'Cannot modify super admin users' }, { status: 403 })
    }

    // Update user
    const updateData: any = {}
    
    if (data.name !== undefined) updateData.name = data.name
    if (data.username !== undefined) updateData.username = data.username
    if (data.email !== undefined) updateData.email = data.email
    if (data.roleId !== undefined) updateData.roleId = data.roleId
    if (data.isBanned !== undefined) updateData.isBanned = data.isBanned
    if (data.banReason !== undefined) updateData.bannedReason = data.banReason
    if (data.banExpiresAt !== undefined) updateData.bannedUntil = data.banExpiresAt ? new Date(data.banExpiresAt) : null
    if (data.isActive !== undefined) updateData.isActive = data.isActive
    if (data.customTitle !== undefined) updateData.title = data.customTitle
    if (data.warningPoints !== undefined) updateData.warningPoints = data.warningPoints

    const updatedUser = await prisma.user.update({
      where: { id: data.id },
      data: updateData,
      include: {
        role: true,
        secondaryRoles: {
          include: {
            role: true
          }
        },
        warnings: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: {
            posts: true,
            comments: true,
            userTrophies: true
          }
        }
      }
    })

    // Update secondary roles if provided
    if (data.secondaryRoles !== undefined) {
      // Remove existing secondary roles
      await prisma.userSecondaryRole.deleteMany({
        where: { userId: data.id }
      })

      // Add new secondary roles
      if (data.secondaryRoles.length > 0) {
        await prisma.userSecondaryRole.createMany({
          data: data.secondaryRoles.map(roleId => ({
            userId: data.id,
            roleId
          }))
        })
      }
    }

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Error updating user:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
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

    const body = await request.json()
    const action = body.action

    if (action === 'create_warning') {
      // Check moderation permissions
      const hasAccess = await hasEnhancedPermission(su.id, ENHANCED_PERMISSIONS.MODERATION.WARN_USERS)
      if (!hasAccess) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
      }

      const data = CreateWarningSchema.parse(body)

      const warning = await prisma.warning.create({
        data: {
          userId: data.userId,
          givenById: su.id,
          title: data.title || 'Warning',
          reason: data.reason,
          points: data.points,
          expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
          isActive: data.isActive
        },
        include: {
          user: true,
          givenBy: true
        }
      })

      // Update user warning points
      await prisma.user.update({
        where: { id: data.userId },
        data: {
          warningPoints: {
            increment: data.points
          }
        }
      })

      return NextResponse.json(warning, { status: 201 })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error processing user action:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}