import { prisma } from './prisma'

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
 * Check if user has a specific permission
 */
export async function hasPermission(userId: string, permissionName: string): Promise<PermissionCheck> {
  const user = await getUserWithRole(userId)
  
  if (!user || !user.role) {
    return {
      hasPermission: false,
      userRole: 'none',
      requiredPermission: permissionName
    }
  }

  const hasPermission = user.role.permissions.some(
    rolePermission => rolePermission.permission.name === permissionName
  )

  return {
    hasPermission,
    userRole: user.role.name,
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
 * Permission constants for easy reference
 */
export const PERMISSIONS = {
  // Admin permissions
  ADMIN_ACCESS: 'admin.access',
  ADMIN_USERS_MANAGE: 'admin.users.manage',
  ADMIN_ROLES_MANAGE: 'admin.roles.manage',
  ADMIN_CATEGORIES_MANAGE: 'admin.categories.manage',
  ADMIN_SETTINGS_MANAGE: 'admin.settings.manage',
  ADMIN_ANALYTICS_VIEW: 'admin.analytics.view',

  // Post permissions
  POSTS_CREATE: 'posts.create',
  POSTS_EDIT_OWN: 'posts.edit.own',
  POSTS_EDIT_ALL: 'posts.edit.all',
  POSTS_DELETE_OWN: 'posts.delete.own',
  POSTS_DELETE_ALL: 'posts.delete.all',
  POSTS_PIN: 'posts.pin',
  POSTS_FEATURE: 'posts.feature',
  POSTS_LOCK: 'posts.lock',
  POSTS_TAG: 'posts.tag',

  // Comment permissions
  COMMENTS_CREATE: 'comments.create',
  COMMENTS_EDIT_OWN: 'comments.edit.own',
  COMMENTS_EDIT_ALL: 'comments.edit.all',
  COMMENTS_DELETE_OWN: 'comments.delete.own',
  COMMENTS_DELETE_ALL: 'comments.delete.all',

  // User permissions
  USERS_VIEW_PROFILES: 'users.view.profiles',
  USERS_EDIT_PROFILE: 'users.edit.profile',
  USERS_MANAGE_ROLES: 'users.manage.roles',
  USERS_BAN: 'users.ban',

  // File permissions
  FILES_UPLOAD: 'files.upload',
  FILES_DELETE_OWN: 'files.delete.own',
  FILES_DELETE_ALL: 'files.delete.all',

  // Moderation permissions
  MODERATE_CONTENT: 'moderate.content',
  MODERATE_USERS: 'moderate.users',
  MODERATE_REPORTS: 'moderate.reports',
  
  // User permissions
  USERS_REPORT: 'users.report',
  USERS_WATCH: 'users.watch',
} as const

/**
 * Role constants for easy reference
 */
export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  STAFF: 'staff',
  MOD: 'mod',
  AUTHOR: 'author',
  MEMBER: 'member',
} as const
