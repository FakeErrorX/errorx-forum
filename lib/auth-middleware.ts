import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { hasPermission, hasAnyPermission, hasRole, hasAnyRole, hasEnhancedPermission, PERMISSIONS, ROLES, ENHANCED_PERMISSIONS, PermissionKey } from './permissions'

// Type for route permission requirements
export interface RoutePermission {
  permission: PermissionKey
  allowSelf?: boolean // Allow users to access their own resources
  allowOwner?: boolean // Allow resource owners to access their resources
}

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

/**
 * Enhanced Permission Middleware Functions
 */

/**
 * Permission checking middleware for enhanced permissions
 */
export async function withPermission(
  handler: (request: NextRequest, userId: string) => Promise<NextResponse>,
  routePermission: RoutePermission
) {
  return async (request: NextRequest) => {
    try {
      const session = await getServerSession(authOptions)
      type SessionUserWithId = { id?: string }
      const su = session?.user as unknown as SessionUserWithId | undefined
      
      if (!su?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      // Check if user has the required permission
      const hasAccess = await hasEnhancedPermission(su.id, routePermission.permission)
      
      if (!hasAccess.hasPermission) {
        // Check for self-access if allowed
        if (routePermission.allowSelf) {
          const { searchParams } = new URL(request.url)
          const targetUserId = searchParams.get('userId') || searchParams.get('id')
          
          if (targetUserId && targetUserId === su.id) {
            return handler(request, su.id)
          }
        }

        return NextResponse.json({ 
          error: 'Insufficient permissions',
          required: routePermission.permission 
        }, { status: 403 })
      }

      return handler(request, su.id)
    } catch (error) {
      console.error('Permission middleware error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}

/**
 * Common permission sets for different user levels
 */
export const PERMISSION_SETS = {
  // Admin permissions
  ADMIN_FULL: [
    ENHANCED_PERMISSIONS.ADMIN.ACCESS_ADMIN_PANEL,
    ENHANCED_PERMISSIONS.ADMIN.MANAGE_USERS,
    ENHANCED_PERMISSIONS.ADMIN.MANAGE_ROLES,
    ENHANCED_PERMISSIONS.ADMIN.MANAGE_PERMISSIONS,
    ENHANCED_PERMISSIONS.ADMIN.MANAGE_NODES,
    ENHANCED_PERMISSIONS.ADMIN.MANAGE_TROPHIES,
    ENHANCED_PERMISSIONS.ADMIN.MANAGE_BB_CODES,
    ENHANCED_PERMISSIONS.ADMIN.VIEW_STATISTICS,
    ENHANCED_PERMISSIONS.ADMIN.MANAGE_SETTINGS
  ],

  // Moderator permissions
  MODERATOR: [
    ENHANCED_PERMISSIONS.MODERATION.VIEW_MODERATION_LOG,
    ENHANCED_PERMISSIONS.MODERATION.DELETE_POSTS,
    ENHANCED_PERMISSIONS.MODERATION.EDIT_POSTS,
    ENHANCED_PERMISSIONS.MODERATION.MOVE_POSTS,
    ENHANCED_PERMISSIONS.MODERATION.WARN_USERS,
    ENHANCED_PERMISSIONS.MODERATION.MANAGE_REPORTED_CONTENT,
    ENHANCED_PERMISSIONS.THREAD.EDIT_ANY_POST,
    ENHANCED_PERMISSIONS.THREAD.DELETE_ANY_POST,
    ENHANCED_PERMISSIONS.THREAD.MOVE_THREADS,
    ENHANCED_PERMISSIONS.THREAD.LOCK_THREADS,
    ENHANCED_PERMISSIONS.THREAD.STICK_THREADS
  ],

  // Member permissions
  MEMBER: [
    ENHANCED_PERMISSIONS.GENERAL.VIEW_FORUM,
    ENHANCED_PERMISSIONS.GENERAL.SEARCH,
    ENHANCED_PERMISSIONS.GENERAL.VIEW_PROFILES,
    ENHANCED_PERMISSIONS.PROFILE.EDIT_OWN_PROFILE,
    ENHANCED_PERMISSIONS.PROFILE.UPLOAD_AVATAR,
    ENHANCED_PERMISSIONS.PROFILE.USE_SIGNATURE,
    ENHANCED_PERMISSIONS.THREAD.VIEW_THREADS,
    ENHANCED_PERMISSIONS.THREAD.VIEW_CONTENT,
    ENHANCED_PERMISSIONS.THREAD.CREATE_THREAD,
    ENHANCED_PERMISSIONS.THREAD.REPLY_TO_THREAD,
    ENHANCED_PERMISSIONS.THREAD.EDIT_OWN_POSTS,
    ENHANCED_PERMISSIONS.THREAD.DELETE_OWN_POSTS,
    ENHANCED_PERMISSIONS.THREAD.RATE_POSTS,
    ENHANCED_PERMISSIONS.MEDIA.UPLOAD_ATTACHMENTS,
    ENHANCED_PERMISSIONS.MEDIA.VIEW_ATTACHMENTS,
    ENHANCED_PERMISSIONS.MEDIA.USE_BBCODE,
    ENHANCED_PERMISSIONS.CONVERSATION.START_CONVERSATIONS,
    ENHANCED_PERMISSIONS.CONVERSATION.REPLY_TO_CONVERSATIONS,
    ENHANCED_PERMISSIONS.CONVERSATION.EDIT_OWN_MESSAGES,
    ENHANCED_PERMISSIONS.CONVERSATION.DELETE_OWN_MESSAGES
  ],

  // Guest permissions
  GUEST: [
    ENHANCED_PERMISSIONS.GENERAL.VIEW_FORUM,
    ENHANCED_PERMISSIONS.GENERAL.SEARCH,
    ENHANCED_PERMISSIONS.GENERAL.VIEW_PROFILES,
    ENHANCED_PERMISSIONS.THREAD.VIEW_THREADS,
    ENHANCED_PERMISSIONS.THREAD.VIEW_CONTENT,
    ENHANCED_PERMISSIONS.MEDIA.VIEW_ATTACHMENTS
  ]
} as const

/**
 * Helper function to check multiple enhanced permissions
 */
export async function hasAnyOfEnhancedPermissions(userId: string, permissions: PermissionKey[]): Promise<boolean> {
  for (const permission of permissions) {
    const hasAccess = await hasEnhancedPermission(userId, permission)
    if (hasAccess.hasPermission) return true
  }
  return false
}

/**
 * Helper function to check if user can perform action on resource
 */
export async function canAccessResource(
  userId: string, 
  resourceOwnerId: string | null, 
  requiredPermission: PermissionKey,
  allowSelfAccess: boolean = false
): Promise<boolean> {
  // Check if user has the general permission
  const hasGeneralAccess = await hasEnhancedPermission(userId, requiredPermission)
  if (hasGeneralAccess.hasPermission) return true

  // Check if user can access their own resource
  if (allowSelfAccess && resourceOwnerId === userId) return true

  return false
}

/**
 * Permission-based route protection decorator
 */
export function requirePermissions(...permissions: PermissionKey[]) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value

    descriptor.value = async function (request: NextRequest) {
      const session = await getServerSession(authOptions)
      type SessionUserWithId = { id?: string }
      const su = session?.user as unknown as SessionUserWithId | undefined
      
      if (!su?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const hasAccess = await hasAnyOfEnhancedPermissions(su.id, permissions)
      if (!hasAccess) {
        return NextResponse.json({ 
          error: 'Insufficient permissions',
          required: permissions 
        }, { status: 403 })
      }

      return originalMethod.call(this, request)
    }

    return descriptor
  }
}
