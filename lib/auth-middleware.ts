import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { hasPermission, hasAnyPermission, hasRole, hasAnyRole, PERMISSIONS, ROLES } from './permissions'

export interface AuthMiddlewareOptions {
  requiredPermission?: string
  requiredPermissions?: string[]
  requiredRole?: string
  requiredRoles?: string[]
  requireAllPermissions?: boolean
  requireAllRoles?: boolean
}

/**
 * Middleware helper for role-based access control
 */
export async function authMiddleware(
  request: NextRequest,
  options: AuthMiddlewareOptions = {}
): Promise<NextResponse | null> {
  const session = await getServerSession(authOptions)

  type SessionUserWithId = { id?: string }
  const su = session?.user as unknown as SessionUserWithId | undefined
  if (!su?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = su.id

  // Check role-based access
  if (options.requiredRole) {
    const hasRequiredRole = await hasRole(userId, options.requiredRole)
    if (!hasRequiredRole) {
      return NextResponse.json({ 
        error: 'Insufficient role',
        details: `Required role: ${options.requiredRole}`
      }, { status: 403 })
    }
  }

  if (options.requiredRoles) {
    const hasRequiredRoles = await hasAnyRole(userId, options.requiredRoles)
    if (!hasRequiredRoles) {
      return NextResponse.json({ 
        error: 'Insufficient role',
        details: `Required roles: ${options.requiredRoles.join(' OR ')}`
      }, { status: 403 })
    }
  }

  // Check permission-based access
  if (options.requiredPermission) {
    const permissionCheck = await hasPermission(userId, options.requiredPermission)
    if (!permissionCheck.hasPermission) {
      return NextResponse.json({ 
        error: 'Insufficient permissions',
        details: `Required: ${permissionCheck.requiredPermission}, User role: ${permissionCheck.userRole}`
      }, { status: 403 })
    }
  }

  if (options.requiredPermissions) {
    let permissionCheck
    if (options.requireAllPermissions) {
      permissionCheck = await hasAnyPermission(userId, options.requiredPermissions)
    } else {
      permissionCheck = await hasAnyPermission(userId, options.requiredPermissions)
    }

    if (!permissionCheck.hasPermission) {
      return NextResponse.json({ 
        error: 'Insufficient permissions',
        details: `Required: ${permissionCheck.requiredPermission}, User role: ${permissionCheck.userRole}`
      }, { status: 403 })
    }
  }

  return null // Allow access
}

/**
 * Convenience functions for common permission checks
 */
export const requireAdmin = (request: NextRequest) => 
  authMiddleware(request, { requiredPermission: PERMISSIONS.ADMIN_ACCESS })

export const requireSuperAdmin = (request: NextRequest) => 
  authMiddleware(request, { requiredRole: ROLES.SUPER_ADMIN })

export const requireModerator = (request: NextRequest) => 
  authMiddleware(request, { 
    requiredRoles: [ROLES.MOD, ROLES.STAFF, ROLES.ADMIN, ROLES.SUPER_ADMIN] 
  })

export const requirePostEdit = (request: NextRequest) => 
  authMiddleware(request, { 
    requiredPermissions: [PERMISSIONS.POSTS_EDIT_OWN, PERMISSIONS.POSTS_EDIT_ALL],
    requireAllPermissions: false
  })

export const requirePostDelete = (request: NextRequest) => 
  authMiddleware(request, { 
    requiredPermissions: [PERMISSIONS.POSTS_DELETE_OWN, PERMISSIONS.POSTS_DELETE_ALL],
    requireAllPermissions: false
  })

export const requireCommentEdit = (request: NextRequest) => 
  authMiddleware(request, { 
    requiredPermissions: [PERMISSIONS.COMMENTS_EDIT_OWN, PERMISSIONS.COMMENTS_EDIT_ALL],
    requireAllPermissions: false
  })

export const requireCommentDelete = (request: NextRequest) => 
  authMiddleware(request, { 
    requiredPermissions: [PERMISSIONS.COMMENTS_DELETE_OWN, PERMISSIONS.COMMENTS_DELETE_ALL],
    requireAllPermissions: false
  })

export const requireUserManagement = (request: NextRequest) => 
  authMiddleware(request, { requiredPermission: PERMISSIONS.USERS_MANAGE_ROLES })

export const requireRoleManagement = (request: NextRequest) => 
  authMiddleware(request, { requiredPermission: PERMISSIONS.ADMIN_ROLES_MANAGE })
