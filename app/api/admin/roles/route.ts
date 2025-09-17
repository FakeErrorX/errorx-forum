import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { z } from 'zod'

// Validation schemas
const createRoleSchema = z.object({
  name: z.string().min(1).max(50).regex(/^[a-z0-9_]+$/, 'Name must contain only lowercase letters, numbers, and underscores'),
  displayName: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  permissions: z.array(z.string()).optional().default([])
})

const updateRoleSchema = createRoleSchema.partial().extend({
  id: z.string()
})

// GET /api/admin/roles - Get all roles
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    type SessionUserWithId = { id?: string }
    const su = session?.user as unknown as SessionUserWithId | undefined
    if (!su?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to view roles
    const permissionCheck = await hasPermission(su.id, PERMISSIONS.ADMIN_ROLES_MANAGE)
    if (!permissionCheck.hasPermission) {
      return NextResponse.json({ 
        error: 'Insufficient permissions',
        details: `Required: ${permissionCheck.requiredPermission}, User role: ${permissionCheck.userRole}`
      }, { status: 403 })
    }

    const roles = await prisma.role.findMany({
      include: {
        permissions: {
          include: {
            permission: true
          }
        },
        _count: {
          select: {
            users: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    return NextResponse.json({ roles })
  } catch (error) {
    console.error('Error fetching roles:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/roles - Create new role
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    type SessionUserWithId = { id?: string }
    const su = session?.user as unknown as SessionUserWithId | undefined
    if (!su?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to create roles
    const permissionCheck = await hasPermission(su.id, PERMISSIONS.ADMIN_ROLES_MANAGE)
    if (!permissionCheck.hasPermission) {
      return NextResponse.json({ 
        error: 'Insufficient permissions',
        details: `Required: ${permissionCheck.requiredPermission}, User role: ${permissionCheck.userRole}`
      }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = createRoleSchema.parse(body)

    // Check if role name already exists
    const existingRole = await prisma.role.findUnique({
      where: { name: validatedData.name }
    })

    if (existingRole) {
      return NextResponse.json({ error: 'Role name already exists' }, { status: 400 })
    }

    // Create the role
    const role = await prisma.role.create({
      data: {
        name: validatedData.name,
        displayName: validatedData.displayName,
        description: validatedData.description,
        color: validatedData.color || '#6b7280',
        isSystem: false,
        isActive: true
      }
    })

    // Assign permissions to the role
    if (validatedData.permissions.length > 0) {
      const permissions = await prisma.permission.findMany({
        where: {
          name: {
            in: validatedData.permissions
          }
        }
      })

      await prisma.rolePermission.createMany({
        data: permissions.map(permission => ({
          roleId: role.id,
          permissionId: permission.id
        }))
      })
    }

    // Fetch the created role with permissions
    const createdRole = await prisma.role.findUnique({
      where: { id: role.id },
      include: {
        permissions: {
          include: {
            permission: true
          }
        },
        _count: {
          select: {
            users: true
          }
        }
      }
    })

    return NextResponse.json({ role: createdRole }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation error', 
        details: error.issues 
      }, { status: 400 })
    }

    console.error('Error creating role:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/admin/roles - Update role
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    type SessionUserWithId = { id?: string }
    const su = session?.user as unknown as SessionUserWithId | undefined
    if (!su?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to update roles
    const permissionCheck = await hasPermission(su.id, PERMISSIONS.ADMIN_ROLES_MANAGE)
    if (!permissionCheck.hasPermission) {
      return NextResponse.json({ 
        error: 'Insufficient permissions',
        details: `Required: ${permissionCheck.requiredPermission}, User role: ${permissionCheck.userRole}`
      }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = updateRoleSchema.parse(body)

    // Check if role exists
    const existingRole = await prisma.role.findUnique({
      where: { id: validatedData.id }
    })

    if (!existingRole) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }

    // Check if it's a system role
    if (existingRole.isSystem) {
      return NextResponse.json({ error: 'Cannot modify system roles' }, { status: 400 })
    }

    // Check if new name conflicts with existing role
    if (validatedData.name && validatedData.name !== existingRole.name) {
      const nameConflict = await prisma.role.findUnique({
        where: { name: validatedData.name }
      })

      if (nameConflict) {
        return NextResponse.json({ error: 'Role name already exists' }, { status: 400 })
      }
    }

    // Update the role
    const updatedRole = await prisma.role.update({
      where: { id: validatedData.id },
      data: {
        name: validatedData.name,
        displayName: validatedData.displayName,
        description: validatedData.description,
        color: validatedData.color
      }
    })

    // Update permissions if provided
    if (validatedData.permissions !== undefined) {
      // Remove existing permissions
      await prisma.rolePermission.deleteMany({
        where: { roleId: validatedData.id }
      })

      // Add new permissions
      if (validatedData.permissions.length > 0) {
        const permissions = await prisma.permission.findMany({
          where: {
            name: {
              in: validatedData.permissions
            }
          }
        })

        await prisma.rolePermission.createMany({
          data: permissions.map(permission => ({
            roleId: validatedData.id,
            permissionId: permission.id
          }))
        })
      }
    }

    // Fetch the updated role with permissions
    const finalRole = await prisma.role.findUnique({
      where: { id: validatedData.id },
      include: {
        permissions: {
          include: {
            permission: true
          }
        },
        _count: {
          select: {
            users: true
          }
        }
      }
    })

    return NextResponse.json({ role: finalRole })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation error', 
        details: error.issues 
      }, { status: 400 })
    }

    console.error('Error updating role:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
