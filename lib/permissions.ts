import { prisma } from './prisma'

// Enhanced Enterprise Permission System
export const ENHANCED_PERMISSIONS = {
  // General permissions
  GENERAL: {
    VIEW_FORUM: 'general:view_forum',
    SEARCH: 'general:search',
    VIEW_PROFILES: 'general:view_profiles',
    USE_TAGGING: 'general:use_tagging',
    BYPASS_FLOOD_CHECK: 'general:bypass_flood_check',
    IGNORE_USER_PRIVACY: 'general:ignore_user_privacy',
    BYPASS_MAXIMUM_MESSAGE_COUNT: 'general:bypass_maximum_message_count',
    RECEIVE_ADMIN_EMAIL: 'general:receive_admin_email',
  },

  // Profile permissions
  PROFILE: {
    EDIT_OWN_PROFILE: 'profile:edit_own_profile',
    UPLOAD_AVATAR: 'profile:upload_avatar',
    EDIT_SIGNATURE: 'profile:edit_signature',
    USE_SIGNATURE: 'profile:use_signature',
    EDIT_CUSTOM_TITLE: 'profile:edit_custom_title',
    FOLLOW_USERS: 'profile:follow_users',
    IGNORE_USERS: 'profile:ignore_users',
    VIEW_ONLINE_STATUS: 'profile:view_online_status',
    EDIT_PRIVACY_SETTINGS: 'profile:edit_privacy_settings',
    CHANGE_USERNAME: 'profile:change_username',
    EDIT_DATE_OF_BIRTH: 'profile:edit_date_of_birth',
    VIEW_WARNING_DETAILS: 'profile:view_warning_details',
  },

  // Thread and post permissions
  THREAD: {
    VIEW_THREADS: 'thread:view_threads',
    VIEW_CONTENT: 'thread:view_content',
    CREATE_THREAD: 'thread:create_thread',
    REPLY_TO_THREAD: 'thread:reply_to_thread',
    EDIT_OWN_POSTS: 'thread:edit_own_posts',
    DELETE_OWN_POSTS: 'thread:delete_own_posts',
    EDIT_ANY_POST: 'thread:edit_any_post',
    DELETE_ANY_POST: 'thread:delete_any_post',
    VIEW_DELETED_POSTS: 'thread:view_deleted_posts',
    UNDELETE_POSTS: 'thread:undelete_posts',
    MOVE_THREADS: 'thread:move_threads',
    COPY_THREADS: 'thread:copy_threads',
    MERGE_THREADS: 'thread:merge_threads',
    LOCK_THREADS: 'thread:lock_threads',
    STICK_THREADS: 'thread:stick_threads',
    RATE_POSTS: 'thread:rate_posts',
    VIEW_POST_RATINGS: 'thread:view_post_ratings',
    POST_WITHOUT_APPROVAL: 'thread:post_without_approval',
    APPROVE_UNAPPROVED_POSTS: 'thread:approve_unapproved_posts',
    BYPASS_DUPLICATE_CHECK: 'thread:bypass_duplicate_check',
    FEATURE_THREADS: 'thread:feature_threads',
  },

  // Media permissions
  MEDIA: {
    UPLOAD_ATTACHMENTS: 'media:upload_attachments',
    VIEW_ATTACHMENTS: 'media:view_attachments',
    DELETE_OWN_ATTACHMENTS: 'media:delete_own_attachments',
    DELETE_ANY_ATTACHMENTS: 'media:delete_any_attachments',
    USE_BBCODE: 'media:use_bbcode',
    USE_HTML: 'media:use_html',
    EMBED_MEDIA: 'media:embed_media',
    USE_CUSTOM_BBCODE: 'media:use_custom_bbcode',
  },

  // Conversation permissions
  CONVERSATION: {
    START_CONVERSATIONS: 'conversation:start_conversations',
    REPLY_TO_CONVERSATIONS: 'conversation:reply_to_conversations',
    EDIT_OWN_MESSAGES: 'conversation:edit_own_messages',
    DELETE_OWN_MESSAGES: 'conversation:delete_own_messages',
    LEAVE_CONVERSATIONS: 'conversation:leave_conversations',
    INVITE_TO_CONVERSATIONS: 'conversation:invite_to_conversations',
    UPLOAD_ATTACHMENTS: 'conversation:upload_attachments',
    BYPASS_PRIVACY: 'conversation:bypass_privacy',
    EDIT_ANY_MESSAGE: 'conversation:edit_any_message',
    DELETE_ANY_MESSAGE: 'conversation:delete_any_message',
  },

  // Moderation permissions
  MODERATION: {
    VIEW_MODERATION_LOG: 'moderation:view_moderation_log',
    DELETE_POSTS: 'moderation:delete_posts',
    UNDELETE_POSTS: 'moderation:undelete_posts',
    EDIT_POSTS: 'moderation:edit_posts',
    MOVE_POSTS: 'moderation:move_posts',
    WARN_USERS: 'moderation:warn_users',
    BAN_USERS: 'moderation:ban_users',
    MANAGE_REPORTED_CONTENT: 'moderation:manage_reported_content',
    VIEW_IP_ADDRESSES: 'moderation:view_ip_addresses',
    MANAGE_SPAM: 'moderation:manage_spam',
    CLEAN_SPAM: 'moderation:clean_spam',
    BYPASS_USER_PRIVACY: 'moderation:bypass_user_privacy',
  },

  // Administrative permissions
  ADMIN: {
    ACCESS_ADMIN_PANEL: 'admin:access_admin_panel',
    MANAGE_USERS: 'admin:manage_users',
    MANAGE_ROLES: 'admin:manage_roles',
    MANAGE_PERMISSIONS: 'admin:manage_permissions',
    MANAGE_NODES: 'admin:manage_nodes',
    MANAGE_TROPHIES: 'admin:manage_trophies',
    MANAGE_BB_CODES: 'admin:manage_bb_codes',
    VIEW_STATISTICS: 'admin:view_statistics',
    MANAGE_SETTINGS: 'admin:manage_settings',
    MANAGE_STYLE_PROPERTIES: 'admin:manage_style_properties',
    MANAGE_TEMPLATES: 'admin:manage_templates',
    MANAGE_PHRASES: 'admin:manage_phrases',
    RUN_MAINTENANCE: 'admin:run_maintenance',
    MANAGE_ADD_ONS: 'admin:manage_add_ons',
  },

  // Special permissions
  SPECIAL: {
    SUPER_ADMIN: 'special:super_admin',
    SYSTEM_USER: 'special:system_user',
    GUEST_ACCESS: 'special:guest_access',
  },
} as const

// Type definitions for enhanced permissions
export type PermissionKey = string
export type PermissionCategory = keyof typeof ENHANCED_PERMISSIONS
export type PermissionValue<T extends PermissionCategory> = 
  typeof ENHANCED_PERMISSIONS[T][keyof typeof ENHANCED_PERMISSIONS[T]]

// Flatten all enhanced permissions into a single object for easy access
export const ALL_ENHANCED_PERMISSIONS = Object.values(ENHANCED_PERMISSIONS).reduce(
  (acc, category) => ({ ...acc, ...category }),
  {}
) as Record<string, string>

// Legacy permission mapping to enhanced permissions
const LEGACY_PERMISSION_MAP: Record<string, PermissionKey> = {
  // Admin permissions
  'admin.access': ENHANCED_PERMISSIONS.ADMIN.ACCESS_ADMIN_PANEL,
  'admin.users.manage': ENHANCED_PERMISSIONS.ADMIN.MANAGE_USERS,
  'admin.roles.manage': ENHANCED_PERMISSIONS.ADMIN.MANAGE_ROLES,
  'admin.categories.manage': ENHANCED_PERMISSIONS.ADMIN.MANAGE_NODES,
  'admin.settings.manage': ENHANCED_PERMISSIONS.ADMIN.MANAGE_SETTINGS,
  'admin.analytics.view': ENHANCED_PERMISSIONS.ADMIN.VIEW_STATISTICS,

  // Post permissions
  'posts.create': ENHANCED_PERMISSIONS.THREAD.CREATE_THREAD,
  'posts.edit.own': ENHANCED_PERMISSIONS.THREAD.EDIT_OWN_POSTS,
  'posts.edit.all': ENHANCED_PERMISSIONS.THREAD.EDIT_ANY_POST,
  'posts.delete.own': ENHANCED_PERMISSIONS.THREAD.DELETE_OWN_POSTS,
  'posts.delete.all': ENHANCED_PERMISSIONS.THREAD.DELETE_ANY_POST,
  'posts.pin': ENHANCED_PERMISSIONS.THREAD.STICK_THREADS,
  'posts.feature': ENHANCED_PERMISSIONS.THREAD.FEATURE_THREADS,
  'posts.lock': ENHANCED_PERMISSIONS.THREAD.LOCK_THREADS,

  // Comment permissions
  'comments.create': ENHANCED_PERMISSIONS.THREAD.REPLY_TO_THREAD,
  'comments.edit.own': ENHANCED_PERMISSIONS.THREAD.EDIT_OWN_POSTS,
  'comments.edit.all': ENHANCED_PERMISSIONS.THREAD.EDIT_ANY_POST,
  'comments.delete.own': ENHANCED_PERMISSIONS.THREAD.DELETE_OWN_POSTS,
  'comments.delete.all': ENHANCED_PERMISSIONS.THREAD.DELETE_ANY_POST,

  // User permissions
  'users.view.profiles': ENHANCED_PERMISSIONS.GENERAL.VIEW_PROFILES,
  'users.edit.profile': ENHANCED_PERMISSIONS.PROFILE.EDIT_OWN_PROFILE,
  'users.manage.roles': ENHANCED_PERMISSIONS.ADMIN.MANAGE_ROLES,
  'users.ban': ENHANCED_PERMISSIONS.MODERATION.BAN_USERS,

  // File permissions
  'files.upload': ENHANCED_PERMISSIONS.MEDIA.UPLOAD_ATTACHMENTS,
  'files.delete.own': ENHANCED_PERMISSIONS.MEDIA.UPLOAD_ATTACHMENTS,
  'files.delete.all': ENHANCED_PERMISSIONS.MEDIA.DELETE_ANY_ATTACHMENTS,

  // Moderation permissions
  'moderate.content': ENHANCED_PERMISSIONS.MODERATION.EDIT_POSTS,
  'moderate.users': ENHANCED_PERMISSIONS.MODERATION.WARN_USERS,
  'moderate.reports': ENHANCED_PERMISSIONS.MODERATION.MANAGE_REPORTED_CONTENT,
}

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
