import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Enhanced permission definitions
const ENHANCED_PERMISSIONS = {
  // General permissions
  GENERAL: {
    VIEW_FORUM: 'general.view_forum',
    SEARCH: 'general.search',
    VIEW_PROFILES: 'general.view_profiles',
    VIEW_MEMBER_LIST: 'general.view_member_list',
    BYPASS_FLOOD_CHECK: 'general.bypass_flood_check',
    BYPASS_USER_PRIVACY: 'general.bypass_user_privacy',
  },

  // Profile permissions
  PROFILE: {
    EDIT_OWN_PROFILE: 'profile.edit_own',
    CHANGE_USERNAME: 'profile.change_username',
    CHANGE_TITLE: 'profile.change_title',
    UPLOAD_AVATAR: 'profile.upload_avatar',
    USE_SIGNATURE: 'profile.use_signature',
    POST_ON_PROFILES: 'profile.post_on_profiles',
    EDIT_PROFILE_POSTS: 'profile.edit_profile_posts',
    DELETE_PROFILE_POSTS: 'profile.delete_profile_posts',
  },

  // Thread/Post permissions
  THREAD: {
    VIEW_THREADS: 'thread.view',
    VIEW_CONTENT: 'thread.view_content',
    CREATE_THREAD: 'thread.create',
    REPLY_TO_THREAD: 'thread.reply',
    EDIT_OWN_POSTS: 'thread.edit_own_posts',
    DELETE_OWN_POSTS: 'thread.delete_own_posts',
    EDIT_ANY_POST: 'thread.edit_any_post',
    DELETE_ANY_POST: 'thread.delete_any_post',
    VIEW_DELETED_POSTS: 'thread.view_deleted',
    PERMANENTLY_DELETE: 'thread.permanently_delete',
    MOVE_THREADS: 'thread.move',
    COPY_THREADS: 'thread.copy',
    MERGE_THREADS: 'thread.merge',
    SPLIT_THREADS: 'thread.split',
    STICK_THREADS: 'thread.stick',
    FEATURE_THREADS: 'thread.feature',
    LOCK_THREADS: 'thread.lock',
    APPROVE_POSTS: 'thread.approve_posts',
    RATE_POSTS: 'thread.rate_posts',
    VIEW_POST_RATINGS: 'thread.view_post_ratings',
  },

  // Media & Attachments
  MEDIA: {
    UPLOAD_ATTACHMENTS: 'media.upload_attachments',
    VIEW_ATTACHMENTS: 'media.view_attachments',
    DELETE_ANY_ATTACHMENT: 'media.delete_any_attachment',
    EMBED_MEDIA: 'media.embed_media',
    USE_BBCODE: 'media.use_bbcode',
    USE_HTML: 'media.use_html',
  },

  // Conversation permissions
  CONVERSATION: {
    START_CONVERSATIONS: 'conversation.start',
    REPLY_TO_CONVERSATIONS: 'conversation.reply',
    EDIT_OWN_MESSAGES: 'conversation.edit_own',
    DELETE_OWN_MESSAGES: 'conversation.delete_own',
    LEAVE_CONVERSATIONS: 'conversation.leave',
    INVITE_TO_CONVERSATIONS: 'conversation.invite',
    UPLOAD_ATTACHMENTS: 'conversation.upload_attachments',
  },

  // Moderation permissions
  MODERATION: {
    VIEW_MODERATION_LOG: 'moderation.view_log',
    DELETE_POSTS: 'moderation.delete_posts',
    EDIT_POSTS: 'moderation.edit_posts',
    MOVE_POSTS: 'moderation.move_posts',
    WARN_USERS: 'moderation.warn_users',
    BAN_USERS: 'moderation.ban_users',
    EDIT_USER_PROFILES: 'moderation.edit_user_profiles',
    VIEW_USER_IPS: 'moderation.view_user_ips',
    VIEW_WARNING_SYSTEM: 'moderation.view_warning_system',
    MANAGE_REPORTED_CONTENT: 'moderation.manage_reports',
    BYPASS_PERMISSIONS: 'moderation.bypass_permissions',
  },

  // Admin permissions
  ADMIN: {
    ACCESS_ADMIN_PANEL: 'admin.access_panel',
    MANAGE_USERS: 'admin.manage_users',
    MANAGE_ROLES: 'admin.manage_roles',
    MANAGE_PERMISSIONS: 'admin.manage_permissions',
    MANAGE_NODES: 'admin.manage_nodes',
    MANAGE_STYLES: 'admin.manage_styles',
    MANAGE_TROPHIES: 'admin.manage_trophies',
    MANAGE_BB_CODES: 'admin.manage_bb_codes',
    MANAGE_CUSTOM_FIELDS: 'admin.manage_custom_fields',
    VIEW_STATISTICS: 'admin.view_statistics',
    MANAGE_SETTINGS: 'admin.manage_settings',
    IMPORT_EXPORT: 'admin.import_export',
    RUN_QUERIES: 'admin.run_queries',
    VIEW_ERROR_LOGS: 'admin.view_error_logs',
  },

  // Special permissions
  SPECIAL: {
    SUPER_ADMIN: 'special.super_admin',
    FOUNDER: 'special.founder',
    BYPASS_ALL_PERMISSIONS: 'special.bypass_all',
  }
} as const

async function createPermissions() {
  console.log('Creating permissions...')

  const permissionCategories = [
    { category: 'general', permissions: Object.values(ENHANCED_PERMISSIONS.GENERAL) },
    { category: 'profile', permissions: Object.values(ENHANCED_PERMISSIONS.PROFILE) },
    { category: 'thread', permissions: Object.values(ENHANCED_PERMISSIONS.THREAD) },
    { category: 'media', permissions: Object.values(ENHANCED_PERMISSIONS.MEDIA) },
    { category: 'conversation', permissions: Object.values(ENHANCED_PERMISSIONS.CONVERSATION) },
    { category: 'moderation', permissions: Object.values(ENHANCED_PERMISSIONS.MODERATION) },
    { category: 'admin', permissions: Object.values(ENHANCED_PERMISSIONS.ADMIN) },
    { category: 'special', permissions: Object.values(ENHANCED_PERMISSIONS.SPECIAL) },
  ]

  for (const { category, permissions } of permissionCategories) {
    for (const permission of permissions) {
      await prisma.permission.upsert({
        where: { name: permission },
        create: {
          name: permission,
          displayName: permission.split('.').pop()?.replace(/_/g, ' ').toUpperCase() || permission,
          category,
          isSystem: true
        },
        update: {}
      })
    }
  }
}

async function createRoles() {
  console.log('Creating roles...')

  // Guest role (unregistered users)
  const guestRole = await prisma.role.upsert({
    where: { name: 'guest' },
    create: {
      name: 'guest',
      displayName: 'Guest',
      description: 'Unregistered users',
      color: '#9CA3AF',
      isSystem: true
    },
    update: {}
  })

  // Member role (default registered users)
  const memberRole = await prisma.role.upsert({
    where: { name: 'member' },
    create: {
      name: 'member',
      displayName: 'Member',
      description: 'Regular forum members',
      color: '#6B7280',
      isSystem: true
    },
    update: {}
  })

  // Premium Member role
  const premiumRole = await prisma.role.upsert({
    where: { name: 'premium_member' },
    create: {
      name: 'premium_member',
      displayName: 'Premium Member',
      description: 'Premium members with additional features',
      color: '#F59E0B',
      isSystem: false
    },
    update: {}
  })

  // Moderator role
  const moderatorRole = await prisma.role.upsert({
    where: { name: 'moderator' },
    create: {
      name: 'moderator',
      displayName: 'Moderator',
      description: 'Forum moderators',
      color: '#059669',
      isSystem: true
    },
    update: {}
  })

  // Senior Moderator role
  const seniorModRole = await prisma.role.upsert({
    where: { name: 'senior_moderator' },
    create: {
      name: 'senior_moderator',
      displayName: 'Senior Moderator',
      description: 'Senior forum moderators with additional permissions',
      color: '#047857',
      isSystem: true
    },
    update: {}
  })

  // Administrator role
  const adminRole = await prisma.role.upsert({
    where: { name: 'administrator' },
    create: {
      name: 'administrator',
      displayName: 'Administrator',
      description: 'Forum administrators',
      color: '#DC2626',
      isSystem: true
    },
    update: {}
  })

  // Super Admin role
  const superAdminRole = await prisma.role.upsert({
    where: { name: 'super_admin' },
    create: {
      name: 'super_admin',
      displayName: 'Super Administrator',
      description: 'Super administrators with full access',
      color: '#7C2D12',
      isSystem: true
    },
    update: {}
  })

  return { guestRole, memberRole, premiumRole, moderatorRole, seniorModRole, adminRole, superAdminRole }
}

async function assignPermissionsToRoles() {
  console.log('Assigning permissions to roles...')

  // Get all permissions
  const permissions = await prisma.permission.findMany()
  const roles = await prisma.role.findMany()

  // Helper function to assign permissions to role
  async function assignPermissions(roleName: string, permissionNames: string[]) {
    const role = roles.find(r => r.name === roleName)
    if (!role) return

    for (const permName of permissionNames) {
      const permission = permissions.find(p => p.name === permName)
      if (!permission) continue

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id
          }
        },
        create: {
          roleId: role.id,
          permissionId: permission.id
        },
        update: {}
      })
    }
  }

  // Guest permissions
  await assignPermissions('guest', [
    ENHANCED_PERMISSIONS.GENERAL.VIEW_FORUM,
    ENHANCED_PERMISSIONS.GENERAL.SEARCH,
    ENHANCED_PERMISSIONS.GENERAL.VIEW_PROFILES,
    ENHANCED_PERMISSIONS.THREAD.VIEW_THREADS,
    ENHANCED_PERMISSIONS.THREAD.VIEW_CONTENT,
    ENHANCED_PERMISSIONS.MEDIA.VIEW_ATTACHMENTS,
  ])

  // Member permissions (includes guest + additional)
  await assignPermissions('member', [
    ...Object.values(ENHANCED_PERMISSIONS.GENERAL),
    ...Object.values(ENHANCED_PERMISSIONS.PROFILE),
    ENHANCED_PERMISSIONS.THREAD.VIEW_THREADS,
    ENHANCED_PERMISSIONS.THREAD.VIEW_CONTENT,
    ENHANCED_PERMISSIONS.THREAD.CREATE_THREAD,
    ENHANCED_PERMISSIONS.THREAD.REPLY_TO_THREAD,
    ENHANCED_PERMISSIONS.THREAD.EDIT_OWN_POSTS,
    ENHANCED_PERMISSIONS.THREAD.DELETE_OWN_POSTS,
    ENHANCED_PERMISSIONS.THREAD.RATE_POSTS,
    ENHANCED_PERMISSIONS.THREAD.VIEW_POST_RATINGS,
    ENHANCED_PERMISSIONS.MEDIA.UPLOAD_ATTACHMENTS,
    ENHANCED_PERMISSIONS.MEDIA.VIEW_ATTACHMENTS,
    ENHANCED_PERMISSIONS.MEDIA.EMBED_MEDIA,
    ENHANCED_PERMISSIONS.MEDIA.USE_BBCODE,
    ...Object.values(ENHANCED_PERMISSIONS.CONVERSATION),
  ])

  // Premium Member permissions (includes member + additional)
  await assignPermissions('premium_member', [
    ENHANCED_PERMISSIONS.MEDIA.USE_HTML,
    ENHANCED_PERMISSIONS.GENERAL.BYPASS_FLOOD_CHECK,
  ])

  // Moderator permissions
  await assignPermissions('moderator', [
    ...Object.values(ENHANCED_PERMISSIONS.GENERAL),
    ...Object.values(ENHANCED_PERMISSIONS.PROFILE),
    ...Object.values(ENHANCED_PERMISSIONS.THREAD),
    ...Object.values(ENHANCED_PERMISSIONS.MEDIA),
    ...Object.values(ENHANCED_PERMISSIONS.CONVERSATION),
    ENHANCED_PERMISSIONS.MODERATION.VIEW_MODERATION_LOG,
    ENHANCED_PERMISSIONS.MODERATION.DELETE_POSTS,
    ENHANCED_PERMISSIONS.MODERATION.EDIT_POSTS,
    ENHANCED_PERMISSIONS.MODERATION.MOVE_POSTS,
    ENHANCED_PERMISSIONS.MODERATION.WARN_USERS,
    ENHANCED_PERMISSIONS.MODERATION.VIEW_WARNING_SYSTEM,
    ENHANCED_PERMISSIONS.MODERATION.MANAGE_REPORTED_CONTENT,
  ])

  // Senior Moderator permissions
  await assignPermissions('senior_moderator', [
    ENHANCED_PERMISSIONS.MODERATION.BAN_USERS,
    ENHANCED_PERMISSIONS.MODERATION.EDIT_USER_PROFILES,
    ENHANCED_PERMISSIONS.MODERATION.VIEW_USER_IPS,
    ENHANCED_PERMISSIONS.MODERATION.BYPASS_PERMISSIONS,
  ])

  // Administrator permissions
  await assignPermissions('administrator', [
    ...Object.values(ENHANCED_PERMISSIONS.GENERAL),
    ...Object.values(ENHANCED_PERMISSIONS.PROFILE),
    ...Object.values(ENHANCED_PERMISSIONS.THREAD),
    ...Object.values(ENHANCED_PERMISSIONS.MEDIA),
    ...Object.values(ENHANCED_PERMISSIONS.CONVERSATION),
    ...Object.values(ENHANCED_PERMISSIONS.MODERATION),
    ...Object.values(ENHANCED_PERMISSIONS.ADMIN),
  ])

  // Super Admin permissions (all permissions)
  await assignPermissions('super_admin', [
    ...Object.values(ENHANCED_PERMISSIONS.GENERAL),
    ...Object.values(ENHANCED_PERMISSIONS.PROFILE),
    ...Object.values(ENHANCED_PERMISSIONS.THREAD),
    ...Object.values(ENHANCED_PERMISSIONS.MEDIA),
    ...Object.values(ENHANCED_PERMISSIONS.CONVERSATION),
    ...Object.values(ENHANCED_PERMISSIONS.MODERATION),
    ...Object.values(ENHANCED_PERMISSIONS.ADMIN),
    ...Object.values(ENHANCED_PERMISSIONS.SPECIAL),
  ])
}

async function createDefaultTrophies() {
  console.log('Creating default trophies...')

  const defaultTrophies = [
    {
      name: 'Welcome!',
      description: 'Welcome to the community! Thanks for joining us.',
      criteria: JSON.stringify({ type: 'user_registered' }),
      icon: 'celebration',
      points: 10,
      category: 'welcome',
      rarity: 'common'
    },
    {
      name: 'First Post',
      description: 'Made your first post on the forum.',
      criteria: JSON.stringify({ type: 'post_count', count: 1 }),
      icon: 'edit',
      points: 5,
      category: 'posting',
      rarity: 'common'
    },
    {
      name: 'Active Member',
      description: 'Posted 100 times on the forum.',
      criteria: JSON.stringify({ type: 'post_count', count: 100 }),
      icon: 'star',
      points: 50,
      category: 'posting',
      rarity: 'uncommon'
    },
    {
      name: 'Prolific Poster',
      description: 'Posted 1000 times on the forum.',
      criteria: JSON.stringify({ type: 'post_count', count: 1000 }),
      icon: 'trophy',
      points: 100,
      category: 'posting',
      rarity: 'rare'
    },
    {
      name: 'Well Liked',
      description: 'Received 100 likes on your posts.',
      criteria: JSON.stringify({ type: 'like_count', count: 100 }),
      icon: 'heart',
      points: 75,
      category: 'engagement',
      rarity: 'uncommon'
    },
    {
      name: 'Popular',
      description: 'Received 500 likes on your posts.',
      criteria: JSON.stringify({ type: 'like_count', count: 500 }),
      icon: 'thumbs-up',
      points: 150,
      category: 'engagement',
      rarity: 'rare'
    },
    {
      name: 'Anniversary',
      description: 'Been a member for one year.',
      criteria: JSON.stringify({ type: 'member_duration', days: 365 }),
      icon: 'calendar',
      points: 100,
      category: 'milestone',
      rarity: 'rare'
    },
    {
      name: 'Veteran',
      description: 'Been a member for five years.',
      criteria: JSON.stringify({ type: 'member_duration', days: 1825 }),
      icon: 'shield',
      points: 250,
      category: 'milestone',
      rarity: 'epic'
    },
    {
      name: 'Legend',
      description: 'Posted 10,000 times and received 5,000 likes.',
      criteria: JSON.stringify({ 
        type: 'combined', 
        requirements: [
          { type: 'post_count', count: 10000 },
          { type: 'like_count', count: 5000 }
        ]
      }),
      icon: 'crown',
      points: 500,
      category: 'achievement',
      rarity: 'legendary'
    }
  ]

  for (const trophy of defaultTrophies) {
    await prisma.trophy.create({
      data: trophy
    })
  }
}

async function createDefaultNodes() {
  console.log('Creating default nodes...')

  // Main Categories
  const general = await prisma.node.create({
    data: {
      name: 'General Discussion',
      description: 'General discussions about anything and everything',
      nodeType: 'category',
      displayOrder: 1,
      icon: 'message-circle',
      color: '#3B82F6',
      isActive: true
    }
  })

  const tech = await prisma.node.create({
    data: {
      name: 'Technology',
      description: 'Discussions about technology, programming, and development',
      nodeType: 'category',
      displayOrder: 2,
      icon: 'cpu',
      color: '#10B981',
      isActive: true
    }
  })

  const gaming = await prisma.node.create({
    data: {
      name: 'Gaming',
      description: 'Gaming discussions, reviews, and news',
      nodeType: 'category',
      displayOrder: 3,
      icon: 'gamepad',
      color: '#8B5CF6',
      isActive: true
    }
  })

  // Subcategories
  await prisma.node.create({
    data: {
      name: 'Web Development',
      description: 'Frontend, backend, and full-stack web development',
      nodeType: 'category',
      displayOrder: 1,
      parentId: tech.id,
      icon: 'code',
      color: '#F59E0B',
      isActive: true
    }
  })

  await prisma.node.create({
    data: {
      name: 'Mobile Development',
      description: 'iOS, Android, and cross-platform mobile development',
      nodeType: 'category',
      displayOrder: 2,
      parentId: tech.id,
      icon: 'smartphone',
      color: '#EF4444',
      isActive: true
    }
  })

  await prisma.node.create({
    data: {
      name: 'PC Gaming',
      description: 'PC gaming discussions and hardware',
      nodeType: 'category',
      displayOrder: 1,
      parentId: gaming.id,
      icon: 'monitor',
      color: '#6366F1',
      isActive: true
    }
  })

  await prisma.node.create({
    data: {
      name: 'Console Gaming',
      description: 'PlayStation, Xbox, Nintendo discussions',
      nodeType: 'category',
      displayOrder: 2,
      parentId: gaming.id,
      icon: 'gamepad-2',
      color: '#EC4899',
      isActive: true
    }
  })
}

async function createDefaultBBCodes() {
  console.log('Creating default BB codes...')

  const defaultBBCodes = [
    {
      tag: 'b',
      replacement: '<strong>$1</strong>',
      example: '[b]Bold text[/b]',
      description: 'Make text bold',
      hasOption: false,
      parseContent: true
    },
    {
      tag: 'i',
      replacement: '<em>$1</em>',
      example: '[i]Italic text[/i]',
      description: 'Make text italic',
      hasOption: false,
      parseContent: true
    },
    {
      tag: 'u',
      replacement: '<u>$1</u>',
      example: '[u]Underlined text[/u]',
      description: 'Underline text',
      hasOption: false,
      parseContent: true
    },
    {
      tag: 's',
      replacement: '<s>$1</s>',
      example: '[s]Strikethrough text[/s]',
      description: 'Strikethrough text',
      hasOption: false,
      parseContent: true
    },
    {
      tag: 'url',
      replacement: '<a href="$option" target="_blank" rel="noopener noreferrer">$1</a>',
      example: '[url=https://example.com]Link text[/url]',
      description: 'Create a hyperlink',
      hasOption: true,
      parseContent: false
    },
    {
      tag: 'img',
      replacement: '<img src="$1" alt="Image" style="max-width: 100%; height: auto;" />',
      example: '[img]https://example.com/image.jpg[/img]',
      description: 'Embed an image',
      hasOption: false,
      parseContent: false
    },
    {
      tag: 'code',
      replacement: '<code class="inline-code">$1</code>',
      example: '[code]console.log("Hello World");[/code]',
      description: 'Inline code',
      hasOption: false,
      parseContent: false
    },
    {
      tag: 'quote',
      replacement: '<blockquote class="forum-quote">$1</blockquote>',
      example: '[quote]Quoted text[/quote]',
      description: 'Quote text',
      hasOption: false,
      parseContent: true
    },
    {
      tag: 'color',
      replacement: '<span style="color: $option;">$1</span>',
      example: '[color=red]Red text[/color]',
      description: 'Change text color',
      hasOption: true,
      parseContent: true
    },
    {
      tag: 'size',
      replacement: '<span style="font-size: $option;">$1</span>',
      example: '[size=20px]Large text[/size]',
      description: 'Change text size',
      hasOption: true,
      parseContent: true
    },
    {
      tag: 'center',
      replacement: '<div style="text-align: center;">$1</div>',
      example: '[center]Centered text[/center]',
      description: 'Center align text',
      hasOption: false,
      parseContent: true
    },
    {
      tag: 'spoiler',
      replacement: '<details class="spoiler"><summary>Spoiler</summary>$1</details>',
      example: '[spoiler]Hidden content[/spoiler]',
      description: 'Hide content behind spoiler tag',
      hasOption: false,
      parseContent: true
    }
  ]

  for (const bbcode of defaultBBCodes) {
    await prisma.bBCode.upsert({
      where: { tag: bbcode.tag },
      create: bbcode,
      update: {}
    })
  }
}

async function main() {
  try {
    console.log('🌱 Starting enhanced forum seeding...')

    await createPermissions()
    await createRoles()
    await assignPermissionsToRoles()
    await createDefaultTrophies()
    await createDefaultNodes()
    await createDefaultBBCodes()

    console.log('✅ Enhanced forum seeding completed successfully!')
  } catch (error) {
    console.error('❌ Error during seeding:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
