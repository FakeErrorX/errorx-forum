import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hasEnhancedPermission, ENHANCED_PERMISSIONS } from '@/lib/permissions'
import { z } from 'zod'

const CreateNodeSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  nodeType: z.enum(['category', 'page', 'link']).default('category'),
  displayOrder: z.number().min(0).default(0),
  parentId: z.string().optional().nullable(),
  icon: z.string().optional(),
  color: z.string().optional(),
  style: z.any().optional(),
  isActive: z.boolean().default(true),
  isPrivate: z.boolean().default(false),
  requirePrefix: z.boolean().default(false),
  allowPolls: z.boolean().default(true),
  allowUploads: z.boolean().default(true),
  allowBBCode: z.boolean().default(true),
  autoLockDays: z.number().optional().nullable(),
  minPostLength: z.number().optional().nullable(),
  maxPostLength: z.number().optional().nullable(),
  threadTemplate: z.string().optional().nullable(),
  moderatorIds: z.array(z.string()).optional().default([]),
  permissions: z.array(z.object({
    roleId: z.string(),
    permissionName: z.string(),
    allowed: z.boolean()
  })).optional().default([])
})

const UpdateNodeSchema = CreateNodeSchema.partial().extend({
  id: z.string()
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    type SessionUserWithId = { id?: string }
    const su = session?.user as unknown as SessionUserWithId | undefined
    if (!su?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin permissions
    const hasAccess = await hasEnhancedPermission(su.id, ENHANCED_PERMISSIONS.ADMIN.MANAGE_NODES)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const includeHierarchy = searchParams.get('hierarchy') === 'true'
    const parentId = searchParams.get('parentId')
    const nodeType = searchParams.get('nodeType')
    const active = searchParams.get('active')

    let where: any = {}

    if (parentId !== null) {
      where.parentId = parentId || null
    }

    if (nodeType) {
      where.nodeType = nodeType
    }

    if (active !== null && active !== '') {
      where.isActive = active === 'true'
    }

    if (includeHierarchy) {
      // Get all nodes and build hierarchy
      const allNodes = await prisma.node.findMany({
        where,
        include: {
          parent: true,
          children: {
            include: {
              children: true
            }
          },
          moderators: {
            include: {
              user: true
            }
          },
          permissions: {
            include: {
              role: true
            }
          },
          _count: {
            select: {
              enhancedPosts: true,
              children: true
            }
          }
        },
        orderBy: [
          { displayOrder: 'asc' },
          { name: 'asc' }
        ]
      })

      // Build hierarchy structure
      const rootNodes = allNodes.filter(node => !node.parentId)
      const buildTree = (nodes: any[], parentId: string | null = null): any[] => {
        return nodes
          .filter(node => node.parentId === parentId)
          .map(node => ({
            ...node,
            children: buildTree(nodes, node.id)
          }))
      }

      const hierarchy = buildTree(allNodes)

      return NextResponse.json({ nodes: hierarchy })
    } else {
      // Get flat list of nodes
      const nodes = await prisma.node.findMany({
        where,
        include: {
          parent: true,
          moderators: {
            include: {
              user: true
            }
          },
          permissions: {
            include: {
              role: true
            }
          },
          _count: {
            select: {
              enhancedPosts: true,
              children: true
            }
          }
        },
        orderBy: [
          { displayOrder: 'asc' },
          { name: 'asc' }
        ]
      })

      return NextResponse.json({ nodes })
    }
  } catch (error) {
    console.error('Error fetching nodes:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    type SessionUserWithId = { id?: string }
    const su = session?.user as unknown as SessionUserWithId | undefined
    if (!su?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin permissions
    const hasAccess = await hasEnhancedPermission(su.id, ENHANCED_PERMISSIONS.ADMIN.MANAGE_NODES)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const data = CreateNodeSchema.parse(body)

    const { moderatorIds, permissions, ...nodeData } = data

    // Validate parent exists if parentId is provided
    if (nodeData.parentId) {
      const parentNode = await prisma.node.findUnique({
        where: { id: nodeData.parentId }
      })

      if (!parentNode) {
        return NextResponse.json({ error: 'Parent node not found' }, { status: 400 })
      }
    }

    // Create node
    const node = await prisma.node.create({
      data: nodeData,
      include: {
        parent: true,
        moderators: {
          include: {
            user: true
          }
        },
        permissions: {
          include: {
            role: true
          }
        },
        _count: {
          select: {
            enhancedPosts: true,
            children: true
          }
        }
      }
    })

    // Add moderators if provided
    if (moderatorIds && moderatorIds.length > 0) {
      await prisma.nodeModerator.createMany({
        data: moderatorIds.map(userId => ({
          nodeId: node.id,
          userId
        }))
      })
    }

    // Add permissions if provided
    if (permissions && permissions.length > 0) {
      await prisma.nodePermission.createMany({
        data: permissions.map(perm => ({
          nodeId: node.id,
          roleId: perm.roleId,
          permission: perm.permissionName,
          value: perm.allowed ? 'allow' : 'deny'
        }))
      })
    }

    // Return node with moderators and permissions
    const nodeWithRelations = await prisma.node.findUnique({
      where: { id: node.id },
      include: {
        parent: true,
        moderators: {
          include: {
            user: true
          }
        },
        permissions: {
          include: {
            role: true
          }
        },
        _count: {
          select: {
            enhancedPosts: true,
            children: true
          }
        }
      }
    })

    return NextResponse.json(nodeWithRelations, { status: 201 })
  } catch (error) {
    console.error('Error creating node:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    type SessionUserWithId = { id?: string }
    const su = session?.user as unknown as SessionUserWithId | undefined
    if (!su?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin permissions
    const hasAccess = await hasEnhancedPermission(su.id, ENHANCED_PERMISSIONS.ADMIN.MANAGE_NODES)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const data = UpdateNodeSchema.parse(body)

    const { id, moderatorIds, permissions, ...updateData } = data

    // Check if node exists
    const existingNode = await prisma.node.findUnique({
      where: { id }
    })

    if (!existingNode) {
      return NextResponse.json({ error: 'Node not found' }, { status: 404 })
    }

    // Validate parent exists if parentId is provided
    if (updateData.parentId) {
      const parentNode = await prisma.node.findUnique({
        where: { id: updateData.parentId }
      })

      if (!parentNode) {
        return NextResponse.json({ error: 'Parent node not found' }, { status: 400 })
      }

      // Prevent circular references
      if (updateData.parentId === id) {
        return NextResponse.json({ error: 'Node cannot be its own parent' }, { status: 400 })
      }
    }

    // Update node
    const updatedNode = await prisma.node.update({
      where: { id },
      data: updateData
    })

    // Update moderators if provided
    if (moderatorIds !== undefined) {
      // Remove existing moderators
      await prisma.nodeModerator.deleteMany({
        where: { nodeId: id }
      })

      // Add new moderators
      if (moderatorIds.length > 0) {
        await prisma.nodeModerator.createMany({
          data: moderatorIds.map(userId => ({
            nodeId: id,
            userId
          }))
        })
      }
    }

    // Update permissions if provided
    if (permissions !== undefined) {
      // Remove existing permissions
      await prisma.nodePermission.deleteMany({
        where: { nodeId: id }
      })

      // Add new permissions
      if (permissions.length > 0) {
        await prisma.nodePermission.createMany({
          data: permissions.map(perm => ({
            nodeId: id,
            roleId: perm.roleId,
            permission: perm.permissionName,
            value: perm.allowed ? 'allow' : 'deny'
          }))
        })
      }
    }

    // Return updated node with relations
    const nodeWithRelations = await prisma.node.findUnique({
      where: { id },
      include: {
        parent: true,
        moderators: {
          include: {
            user: true
          }
        },
        permissions: {
          include: {
            role: true
          }
        },
        _count: {
          select: {
            enhancedPosts: true,
            children: true
          }
        }
      }
    })

    return NextResponse.json(nodeWithRelations)
  } catch (error) {
    console.error('Error updating node:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    type SessionUserWithId = { id?: string }
    const su = session?.user as unknown as SessionUserWithId | undefined
    if (!su?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin permissions
    const hasAccess = await hasEnhancedPermission(su.id, ENHANCED_PERMISSIONS.ADMIN.MANAGE_NODES)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Node ID is required' }, { status: 400 })
    }

    // Check if node exists and has content
    const node = await prisma.node.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            enhancedPosts: true,
            children: true
          }
        }
      }
    })

    if (!node) {
      return NextResponse.json({ error: 'Node not found' }, { status: 404 })
    }

    if (node._count.enhancedPosts > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete node that contains posts. Move or delete posts first.' 
      }, { status: 400 })
    }

    if (node._count.children > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete node that has child nodes. Delete child nodes first.' 
      }, { status: 400 })
    }

    // Delete node and related data
    await prisma.$transaction([
      prisma.nodeModerator.deleteMany({ where: { nodeId: id } }),
      prisma.nodePermission.deleteMany({ where: { nodeId: id } }),
      prisma.node.delete({ where: { id } })
    ])

    return NextResponse.json({ message: 'Node deleted successfully' })
  } catch (error) {
    console.error('Error deleting node:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
