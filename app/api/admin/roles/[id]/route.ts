import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

// DELETE /api/admin/roles/[id] - Delete role
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: roleId } = await context.params
    const session = await getServerSession(authOptions)
    type SessionUserWithId = { id?: string }
    const su = session?.user as unknown as SessionUserWithId | undefined
    if (!su?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to delete roles
    const permissionCheck = await hasPermission(su.id, PERMISSIONS.ADMIN_ROLES_MANAGE)
    if (!permissionCheck.hasPermission) {
      return NextResponse.json({ 
        error: 'Insufficient permissions',
        details: `Required: ${permissionCheck.requiredPermission}, User role: ${permissionCheck.userRole}`
      }, { status: 403 })
    }

    // Check if role exists
    const existingRole = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        _count: {
          select: {
            users: true
          }
        }
      }
    })

    if (!existingRole) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }

    // Check if it's a system role
    if (existingRole.isSystem) {
      return NextResponse.json({ error: 'Cannot delete system roles' }, { status: 400 })
    }

    // Check if role has users assigned
    if (existingRole._count.users > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete role with assigned users',
        details: `This role has ${existingRole._count.users} user(s) assigned. Please reassign users to other roles first.`
      }, { status: 400 })
    }

    // Delete the role (permissions will be deleted automatically due to cascade)
    await prisma.role.delete({
      where: { id: roleId }
    })

    return NextResponse.json({ message: 'Role deleted successfully' })
  } catch (error) {
    console.error('Error deleting role:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/admin/roles/[id] - Get specific role
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: roleId } = await context.params
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

    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        permissions: {
          include: {
            permission: true
          }
        },
        users: {
          select: {
            id: true,
            userId: true,
            username: true,
            name: true,
            email: true,
            createdAt: true
          }
        },
        _count: {
          select: {
            users: true
          }
        }
      }
    })

    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }

    return NextResponse.json({ role })
  } catch (error) {
    console.error('Error fetching role:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
