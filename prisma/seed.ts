import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database with default roles and permissions...')

  // Create default permissions
  const permissions = [
    // Admin permissions
    { name: 'admin.access', displayName: 'Access Admin Panel', description: 'Access to admin dashboard and tools', category: 'admin' },
    { name: 'admin.users.manage', displayName: 'Manage Users', description: 'Create, edit, and delete user accounts', category: 'admin' },
    { name: 'admin.roles.manage', displayName: 'Manage Roles', description: 'Create, edit, and delete roles and permissions', category: 'admin' },
    { name: 'admin.categories.manage', displayName: 'Manage Categories', description: 'Create, edit, and delete forum categories', category: 'admin' },
    { name: 'admin.settings.manage', displayName: 'Manage Settings', description: 'Access and modify system settings', category: 'admin' },
    { name: 'admin.analytics.view', displayName: 'View Analytics', description: 'Access to analytics and reports', category: 'admin' },

    // Post permissions
    { name: 'posts.create', displayName: 'Create Posts', description: 'Create new forum posts', category: 'posts' },
    { name: 'posts.edit.own', displayName: 'Edit Own Posts', description: 'Edit posts created by the user', category: 'posts' },
    { name: 'posts.edit.all', displayName: 'Edit All Posts', description: 'Edit any post in the forum', category: 'posts' },
    { name: 'posts.delete.own', displayName: 'Delete Own Posts', description: 'Delete posts created by the user', category: 'posts' },
    { name: 'posts.delete.all', displayName: 'Delete All Posts', description: 'Delete any post in the forum', category: 'posts' },
    { name: 'posts.pin', displayName: 'Pin Posts', description: 'Pin posts to the top of categories', category: 'posts' },
    { name: 'posts.feature', displayName: 'Feature Posts', description: 'Mark posts as featured and set featured order', category: 'posts' },
    { name: 'posts.lock', displayName: 'Lock Posts', description: 'Lock posts to prevent new comments', category: 'posts' },
    { name: 'posts.tag', displayName: 'Tag Posts', description: 'Add and manage tags on posts', category: 'posts' },

    // Comment permissions
    { name: 'comments.create', displayName: 'Create Comments', description: 'Create comments on posts', category: 'comments' },
    { name: 'comments.edit.own', displayName: 'Edit Own Comments', description: 'Edit comments created by the user', category: 'comments' },
    { name: 'comments.edit.all', displayName: 'Edit All Comments', description: 'Edit any comment in the forum', category: 'comments' },
    { name: 'comments.delete.own', displayName: 'Delete Own Comments', description: 'Delete comments created by the user', category: 'comments' },
    { name: 'comments.delete.all', displayName: 'Delete All Comments', description: 'Delete any comment in the forum', category: 'comments' },

    // User permissions
    { name: 'users.view.profiles', displayName: 'View User Profiles', description: 'View other user profiles', category: 'users' },
    { name: 'users.edit.profile', displayName: 'Edit Own Profile', description: 'Edit own user profile', category: 'users' },
    { name: 'users.manage.roles', displayName: 'Manage User Roles', description: 'Assign and remove roles from users', category: 'users' },
    { name: 'users.ban', displayName: 'Ban Users', description: 'Ban and unban users from the forum', category: 'users' },

    // File permissions
    { name: 'files.upload', displayName: 'Upload Files', description: 'Upload files to the forum', category: 'files' },
    { name: 'files.delete.own', displayName: 'Delete Own Files', description: 'Delete files uploaded by the user', category: 'files' },
    { name: 'files.delete.all', displayName: 'Delete All Files', description: 'Delete any file in the forum', category: 'files' },

    // Moderation permissions
    { name: 'moderate.content', displayName: 'Moderate Content', description: 'Moderate posts and comments', category: 'moderation' },
    { name: 'moderate.users', displayName: 'Moderate Users', description: 'Moderate user behavior and reports', category: 'moderation' },
    { name: 'moderate.reports', displayName: 'Handle Reports', description: 'View and handle content reports', category: 'moderation' },
    
    // User permissions
    { name: 'users.report', displayName: 'Report Content', description: 'Report inappropriate content', category: 'users' },
    { name: 'users.watch', displayName: 'Watch Posts', description: 'Subscribe to posts for notifications', category: 'users' },
  ]

  console.log('📝 Creating permissions...')
  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { name: permission.name },
      update: permission,
      create: { ...permission, isSystem: true }
    })
  }

  // Create default roles
  const roles = [
    {
      name: 'super_admin',
      displayName: 'Super Admin',
      description: 'Full access to all features and settings',
      color: '#dc2626', // Red
      isSystem: true,
      permissions: [
        'admin.access', 'admin.users.manage', 'admin.roles.manage', 'admin.categories.manage', 'admin.settings.manage', 'admin.analytics.view',
        'posts.create', 'posts.edit.own', 'posts.edit.all', 'posts.delete.own', 'posts.delete.all', 'posts.pin', 'posts.feature', 'posts.lock', 'posts.tag',
        'comments.create', 'comments.edit.own', 'comments.edit.all', 'comments.delete.own', 'comments.delete.all',
        'users.view.profiles', 'users.edit.profile', 'users.manage.roles', 'users.ban',
        'files.upload', 'files.delete.own', 'files.delete.all',
        'moderate.content', 'moderate.users', 'moderate.reports'
      ]
    },
    {
      name: 'admin',
      displayName: 'Admin',
      description: 'Administrative access to most features',
      color: '#ea580c', // Orange
      isSystem: true,
      permissions: [
        'admin.access', 'admin.users.manage', 'admin.categories.manage', 'admin.analytics.view',
        'posts.create', 'posts.edit.own', 'posts.edit.all', 'posts.delete.own', 'posts.delete.all', 'posts.pin', 'posts.feature', 'posts.lock', 'posts.tag',
        'comments.create', 'comments.edit.own', 'comments.edit.all', 'comments.delete.own', 'comments.delete.all',
        'users.view.profiles', 'users.edit.profile', 'users.manage.roles', 'users.ban',
        'files.upload', 'files.delete.own', 'files.delete.all',
        'moderate.content', 'moderate.users', 'moderate.reports'
      ]
    },
    {
      name: 'staff',
      displayName: 'Staff',
      description: 'Staff members with moderation powers',
      color: '#2563eb', // Blue
      isSystem: true,
      permissions: [
        'posts.create', 'posts.edit.own', 'posts.edit.all', 'posts.delete.own', 'posts.pin', 'posts.lock', 'posts.tag',
        'comments.create', 'comments.edit.own', 'comments.edit.all', 'comments.delete.own', 'comments.delete.all',
        'users.view.profiles', 'users.edit.profile', 'users.report', 'users.watch',
        'files.upload', 'files.delete.own',
        'moderate.content', 'moderate.users', 'moderate.reports'
      ]
    },
    {
      name: 'mod',
      displayName: 'Moderator',
      description: 'Community moderators with content moderation powers',
      color: '#16a34a', // Green
      isSystem: true,
      permissions: [
        'posts.create', 'posts.edit.own', 'posts.pin', 'posts.lock', 'posts.tag',
        'comments.create', 'comments.edit.own', 'comments.delete.own',
        'users.view.profiles', 'users.edit.profile', 'users.report', 'users.watch',
        'files.upload', 'files.delete.own',
        'moderate.content', 'moderate.reports'
      ]
    },
    {
      name: 'author',
      displayName: 'Author',
      description: 'Content creators with enhanced posting privileges',
      color: '#9333ea', // Purple
      isSystem: true,
      permissions: [
        'posts.create', 'posts.edit.own', 'posts.delete.own',
        'comments.create', 'comments.edit.own', 'comments.delete.own',
        'users.view.profiles', 'users.edit.profile',
        'files.upload', 'files.delete.own'
      ]
    },
    {
      name: 'member',
      displayName: 'Member',
      description: 'Regular forum members',
      color: '#6b7280', // Gray
      isSystem: true,
      permissions: [
        'posts.create', 'posts.edit.own', 'posts.delete.own', 'posts.tag',
        'comments.create', 'comments.edit.own', 'comments.delete.own',
        'users.view.profiles', 'users.edit.profile', 'users.report', 'users.watch',
        'files.upload', 'files.delete.own'
      ]
    }
  ]

  console.log('👥 Creating roles...')
  for (const roleData of roles) {
    const { permissions: rolePermissions, ...roleInfo } = roleData
    
    const role = await prisma.role.upsert({
      where: { name: roleData.name },
      update: roleInfo,
      create: roleInfo
    })

    // Assign permissions to role
    for (const permissionName of rolePermissions) {
      const permission = await prisma.permission.findUnique({
        where: { name: permissionName }
      })

      if (permission) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId: permission.id
            }
          },
          update: {},
          create: {
            roleId: role.id,
            permissionId: permission.id
          }
        })
      }
    }
  }

  // Update existing users to have the member role
  console.log('🔄 Updating existing users...')
  const memberRole = await prisma.role.findUnique({
    where: { name: 'member' }
  })

  if (memberRole) {
    await prisma.user.updateMany({
      where: { roleId: null },
      data: { roleId: memberRole.id }
    })
  }

  console.log('✅ Database seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
