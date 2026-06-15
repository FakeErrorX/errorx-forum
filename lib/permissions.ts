import 'server-only'

import { prisma } from './prisma'
import {
  ENHANCED_PERMISSIONS,
  PERMISSIONS,
  ROLES,
  type PermissionCategory,
  type PermissionKey,
  type PermissionValue,
} from './permissions-data'

export { ENHANCED_PERMISSIONS, PERMISSIONS, ROLES }
export type { PermissionCategory, PermissionKey, PermissionValue }

export interface UserWithRole {
  id: string
  userId: number
  email: string
  name?: string | null
  username?: string | null
  role?: {
    id: string
    name: string
    displayName: string
    color?: string | null
    permissions: {
      permission: {
        name: string
        displayName: string
        category?: string | null
      }
    }[]
  } | null
}

export interface PermissionCheck {
  hasPermission: boolean
  userRole?: string
  requiredPermission?: string
}

const LEGACY_PERMISSION_MAP: Record<string, PermissionKey> = {
  'admin.access': ENHANCED_PERMISSIONS.ADMIN.ACCESS_ADMIN_PANEL,
  'admin.users.manage': ENHANCED_PERMISSIONS.ADMIN.MANAGE_USERS,
  'admin.roles.manage': ENHANCED_PERMISSIONS.ADMIN.MANAGE_ROLES,
  'admin.categories.manage': ENHANCED_PERMISSIONS.ADMIN.MANAGE_NODES,
  'admin.settings.manage': ENHANCED_PERMISSIONS.ADMIN.MANAGE_SETTINGS,
  'admin.analytics.view': ENHANCED_PERMISSIONS.ADMIN.VIEW_STATISTICS,
  'posts.create': ENHANCED_PERMISSIONS.THREAD.CREATE_THREAD,
  'posts.edit.own': ENHANCED_PERMISSIONS.THREAD.EDIT_OWN_POSTS,
  'posts.edit.all': ENHANCED_PERMISSIONS.THREAD.EDIT_ANY_POST,
  'posts.delete.own': ENHANCED_PERMISSIONS.THREAD.DELETE_OWN_POSTS,
  'posts.delete.all': ENHANCED_PERMISSIONS.THREAD.DELETE_ANY_POST,
  'posts.pin': ENHANCED_PERMISSIONS.THREAD.STICK_THREADS,
  'posts.feature': ENHANCED_PERMISSIONS.THREAD.FEATURE_THREADS,
  'posts.lock': ENHANCED_PERMISSIONS.THREAD.LOCK_THREADS,
  'comments.create': ENHANCED_PERMISSIONS.THREAD.REPLY_TO_THREAD,
  'comments.edit.own': ENHANCED_PERMISSIONS.THREAD.EDIT_OWN_POSTS,
  'comments.edit.all': ENHANCED_PERMISSIONS.THREAD.EDIT_ANY_POST,
  'comments.delete.own': ENHANCED_PERMISSIONS.THREAD.DELETE_OWN_POSTS,
  'comments.delete.all': ENHANCED_PERMISSIONS.THREAD.DELETE_ANY_POST,
  'users.view.profiles': ENHANCED_PERMISSIONS.GENERAL.VIEW_PROFILES,
  'users.edit.profile': ENHANCED_PERMISSIONS.PROFILE.EDIT_OWN_PROFILE,
  'users.manage.roles': ENHANCED_PERMISSIONS.ADMIN.MANAGE_ROLES,
  'users.ban': ENHANCED_PERMISSIONS.MODERATION.BAN_USERS,
  'files.upload': ENHANCED_PERMISSIONS.MEDIA.UPLOAD_ATTACHMENTS,
  'files.delete.own': ENHANCED_PERMISSIONS.MEDIA.UPLOAD_ATTACHMENTS,
  'files.delete.all': ENHANCED_PERMISSIONS.MEDIA.DELETE_ANY_ATTACHMENTS,
  'moderate.content': ENHANCED_PERMISSIONS.MODERATION.EDIT_POSTS,
  'moderate.users': ENHANCED_PERMISSIONS.MODERATION.WARN_USERS,
  'moderate.reports': ENHANCED_PERMISSIONS.MODERATION.MANAGE_REPORTED_CONTENT,
}
/**
 * Get user with role and permissions
 */
export async function getUserWithRole(userId: string): Promise<UserWithRole | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
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

  if (!user) return null

  return {
    id: user.id,
    userId: user.userId,
    email: user.email,
    name: user.name,
    username: user.username,
    role: user.role ? {
      id: user.role.id,
      name: user.role.name,
      displayName: user.role.displayName,
      color: user.role.color,
      permissions: user.role.permissions
    } : null
  }
}

/**
 * Check if user has a specific permission (LEGACY - bridges to enhanced permissions)
 */
export async function hasPermission(userId: string, permissionName: string): Promise<PermissionCheck> {
  // Map legacy permission to enhanced permission
  const enhancedPermission = LEGACY_PERMISSION_MAP[permissionName]
  
  if (!enhancedPermission) {
    console.warn(`Legacy permission '${permissionName}' not mapped to enhanced permission`)
    return {
      hasPermission: false,
      userRole: 'unknown',
      requiredPermission: permissionName
    }
  }

  // Use enhanced permission system
  const permissionCheck = await hasEnhancedPermission(userId, enhancedPermission)
  
  const user = await getUserWithRole(userId)
  
  return {
    hasPermission: permissionCheck.hasPermission,
    userRole: user?.role?.name || 'none',
    requiredPermission: permissionName
  }
}

/**
 * Check if user has any of the specified permissions
 */
export async function hasAnyPermission(userId: string, permissionNames: string[]): Promise<PermissionCheck> {
  const user = await getUserWithRole(userId)
  
  if (!user || !user.role) {
    return {
      hasPermission: false,
      userRole: 'none',
      requiredPermission: permissionNames.join(' OR ')
    }
  }

  const hasPermission = user.role.permissions.some(
    rolePermission => permissionNames.includes(rolePermission.permission.name)
  )

  return {
    hasPermission,
    userRole: user.role.name,
    requiredPermission: permissionNames.join(' OR ')
  }
}

/**
 * Check if user has all of the specified permissions
 */
export async function hasAllPermissions(userId: string, permissionNames: string[]): Promise<PermissionCheck> {
  const user = await getUserWithRole(userId)
  
  if (!user || !user.role) {
    return {
      hasPermission: false,
      userRole: 'none',
      requiredPermission: permissionNames.join(' AND ')
    }
  }

  const userPermissions = user.role.permissions.map(rp => rp.permission.name)
  const hasAllPermissions = permissionNames.every(permission => userPermissions.includes(permission))

  return {
    hasPermission: hasAllPermissions,
    userRole: user.role.name,
    requiredPermission: permissionNames.join(' AND ')
  }
}

/**
 * Check if user has a specific role
 */
export async function hasRole(userId: string, roleName: string): Promise<boolean> {
  const user = await getUserWithRole(userId)
  return user?.role?.name === roleName
}

/**
 * Check if user has any of the specified roles
 */
export async function hasAnyRole(userId: string, roleNames: string[]): Promise<boolean> {
  const user = await getUserWithRole(userId)
  return user?.role ? roleNames.includes(user.role.name) : false
}

/**
 * Get all permissions for a user
 */
export async function getUserPermissions(userId: string): Promise<string[]> {
  const user = await getUserWithRole(userId)
  
  if (!user || !user.role) {
    return []
  }

  return user.role.permissions.map(rp => rp.permission.name)
}

/**
 * Get all roles with their permissions
 */
export async function getAllRoles() {
  return await prisma.role.findMany({
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
}

/**
 * Get all permissions grouped by category
 */
export async function getAllPermissions() {
  const permissions = await prisma.permission.findMany({
    orderBy: [
      { category: 'asc' },
      { displayName: 'asc' }
    ]
  })

  // Group permissions by category
  const groupedPermissions = permissions.reduce((acc, permission) => {
    const category = permission.category || 'Other'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(permission)
    return acc
  }, {} as Record<string, typeof permissions>)

  return groupedPermissions
}

/**
 * Check if user can perform an action on a resource
 */
export async function canPerformAction(
  userId: string, 
  action: string, 
  resource: string, 
  resourceOwnerId?: string
): Promise<boolean> {
  const user = await getUserWithRole(userId)
  
  if (!user || !user.role) {
    return false
  }

  // Check for specific permission
  const specificPermission = `${resource}.${action}`
  const hasSpecificPermission = user.role.permissions.some(
    rp => rp.permission.name === specificPermission
  )

  if (hasSpecificPermission) {
    return true
  }

  // Check for "all" permission
  const allPermission = `${resource}.${action}.all`
  const hasAllPermission = user.role.permissions.some(
    rp => rp.permission.name === allPermission
  )

  if (hasAllPermission) {
    return true
  }

  // Check for "own" permission if resource owner is provided
  if (resourceOwnerId && userId === resourceOwnerId) {
    const ownPermission = `${resource}.${action}.own`
    const hasOwnPermission = user.role.permissions.some(
      rp => rp.permission.name === ownPermission
    )
    return hasOwnPermission
  }

  return false
}

/**
 * Enhanced Permission System Functions
 */

/**
 * Check if user has enhanced permission
 */
export async function hasEnhancedPermission(userId: string, permission: PermissionKey): Promise<{hasPermission: boolean}> {
  try {
    const user = await getUserWithRole(userId)

    if (!user || !user.role) {
      return { hasPermission: false }
    }

    // Check role permissions
    const userPermissions = user.role.permissions?.map(rp => rp.permission.name) || []
    
    // Check if user has the specific permission
    const hasPermission = userPermissions.includes(permission)

    return { hasPermission }
  } catch (error) {
    console.error('Error checking enhanced permission:', error)
    return { hasPermission: false }
  }
}

/**
 * Get user's role hierarchy
 */
export async function getUserRoleHierarchy(userId: string) {
  const user = await getUserWithRole(userId)

  if (!user || !user.role) return null

  return {
    primaryRole: user.role,
    secondaryRoles: [] // Not implemented in current schema
  }
}

/**
 * Get all permissions for a user (enhanced system)
 */
export async function getUserEnhancedPermissions(userId: string): Promise<string[]> {
  const user = await getUserWithRole(userId)

  if (!user || !user.role) return []

  // Get permissions from role
  const permissions = user.role.permissions?.map(rp => rp.permission.name) || []
  
  return permissions
}

/**
 * Check if user can access resource with enhanced permissions
 */
export async function canAccessEnhancedResource(
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
