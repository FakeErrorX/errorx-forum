import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { z } from 'zod'

// Validation schemas
const assignRoleSchema = z.object({
  userId: z.string(),
  roleId: z.string()
})

const bulkAssignRoleSchema = z.object({
  userIds: z.array(z.string()),
  roleId: z.string()
})

// POST /api/admin/users/roles - Assign role to user
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    type SessionUserWithId = { id?: string }
    const su = session?.user as unknown as SessionUserWithId | undefined
    if (!su?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to manage user roles
    const permissionCheck = await hasPermission(su.id, PERMISSIONS.USERS_MANAGE_ROLES)
    if (!permissionCheck.hasPermission) {
      return NextResponse.json({ 
        error: 'Insufficient permissions',
        details: `Required: ${permissionCheck.requiredPermission}, User role: ${permissionCheck.userRole}`
      }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = assignRoleSchema.parse(body)

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: validatedData.userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if role exists
    const role = await prisma.role.findUnique({
      where: { id: validatedData.roleId }
    })

    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }

    // Update user's role
    const updatedUser = await prisma.user.update({
      where: { id: validatedData.userId },
      data: { roleId: validatedData.roleId },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json({ 
      user: updatedUser,
      message: `Role "${role.displayName}" assigned to user successfully`
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation error', 
        details: error.issues 
      }, { status: 400 })
    }

    console.error('Error assigning role:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/admin/users/roles - Bulk assign roles
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    type SessionUserWithId = { id?: string }
    const su = session?.user as unknown as SessionUserWithId | undefined
    if (!su?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to manage user roles
    const permissionCheck = await hasPermission(su.id, PERMISSIONS.USERS_MANAGE_ROLES)
    if (!permissionCheck.hasPermission) {
      return NextResponse.json({ 
        error: 'Insufficient permissions',
        details: `Required: ${permissionCheck.requiredPermission}, User role: ${permissionCheck.userRole}`
      }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = bulkAssignRoleSchema.parse(body)

    // Check if role exists
    const role = await prisma.role.findUnique({
      where: { id: validatedData.roleId }
    })

    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }

    // Check if all users exist
    const users = await prisma.user.findMany({
      where: {
        id: {
          in: validatedData.userIds
        }
      }
    })

    if (users.length !== validatedData.userIds.length) {
      return NextResponse.json({ 
        error: 'Some users not found',
        details: `Found ${users.length} users out of ${validatedData.userIds.length} requested`
      }, { status: 400 })
    }

    // Update all users' roles
    await prisma.user.updateMany({
      where: {
        id: {
          in: validatedData.userIds
        }
      },
      data: { roleId: validatedData.roleId }
    })

    return NextResponse.json({ 
      message: `Role "${role.displayName}" assigned to ${validatedData.userIds.length} users successfully`
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation error', 
        details: error.issues 
      }, { status: 400 })
    }

    console.error('Error bulk assigning roles:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
