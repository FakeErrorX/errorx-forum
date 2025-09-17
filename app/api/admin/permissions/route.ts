import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

// GET /api/admin/permissions - Get all permissions
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    type SessionUserWithId = { id?: string }
    const su = session?.user as unknown as SessionUserWithId | undefined
    if (!su?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to view permissions
    const permissionCheck = await hasPermission(su.id, PERMISSIONS.ADMIN_ROLES_MANAGE)
    if (!permissionCheck.hasPermission) {
      return NextResponse.json({ 
        error: 'Insufficient permissions',
        details: `Required: ${permissionCheck.requiredPermission}, User role: ${permissionCheck.userRole}`
      }, { status: 403 })
    }

    const permissions = await prisma.permission.findMany({
      orderBy: [
        { category: 'asc' },
        { displayName: 'asc' }
      ]
    })

    // Group permissions by category
    const groupedPermissions = permissions.reduce((acc: Record<string, typeof permissions>, permission) => {
      const category = permission.category || 'Other'
      if (!acc[category]) {
        acc[category] = [] as typeof permissions
      }
      acc[category].push(permission)
      return acc
    }, {} as Record<string, typeof permissions>)

    return NextResponse.json({ permissions: groupedPermissions })
  } catch (error) {
    console.error('Error fetching permissions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
