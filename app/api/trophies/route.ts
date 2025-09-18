import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { TrophyService } from '@/lib/trophy-service'
import { hasEnhancedPermission } from '@/lib/permissions'

// Get all trophies with optional user progress
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    const includeProgress = searchParams.get('includeProgress') === 'true'

    if (includeProgress && userId) {
      // Handle both UUID and custom userId formats
      let targetUserId: string
      
      if (userId.includes('-') && userId.length > 10) {
        // Looks like UUID
        targetUserId = userId
      } else {
        // Assume it's a custom userId number, convert to UUID
        const customId = parseInt(userId)
        if (isNaN(customId)) {
          return Response.json(
            { error: 'Invalid user ID format' },
            { status: 400 }
          )
        }
        
        const uuid = await TrophyService.getUuidFromCustomId(customId)
        if (!uuid) {
          return Response.json(
            { error: 'User not found' },
            { status: 404 }
          )
        }
        targetUserId = uuid
      }

      // Only allow users to see their own progress unless they're admin
      const sessionUserId = (session?.user as any)?.id
      if (sessionUserId && targetUserId === sessionUserId) {
        // Get user's trophy progress
        const progress = await TrophyService.getUserTrophyProgress(targetUserId)
        return Response.json(progress)
      } else if (sessionUserId) {
        // Check if user has admin permission to view other users' progress
        const hasPermission = await hasEnhancedPermission(sessionUserId, 'ADMIN_TROPHIES_VIEW')
        if (hasPermission.hasPermission) {
          const progress = await TrophyService.getUserTrophyProgress(targetUserId)
          return Response.json(progress)
        }
      }
      
      // Unauthorized to view this user's progress
      return Response.json(
        { error: 'Unauthorized to view user progress' },
        { status: 403 }
      )
    }

    // Get all active trophies
    const trophies = await prisma.trophy.findMany({
      where: { isActive: true },
      orderBy: [
        { category: 'asc' },
        { rarity: 'asc' },
        { points: 'desc' }
      ],
      include: {
        _count: {
          select: {
            userTrophies: true
          }
        }
      }
    })

    return Response.json(trophies)
  } catch (error) {
    console.error('Error fetching trophies:', error)
    return Response.json(
      { error: 'Failed to fetch trophies' },
      { status: 500 }
    )
  }
}

// Create a new trophy (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = (session.user as any)?.id
    const hasPermission = await hasEnhancedPermission(userId, 'ADMIN_TROPHIES_MANAGE')
    
    if (!hasPermission.hasPermission) {
      return Response.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, description, criteria, icon, points, category, rarity } = body

    if (!name || !criteria) {
      return Response.json(
        { error: 'Name and criteria are required' },
        { status: 400 }
      )
    }

    const trophy = await prisma.trophy.create({
      data: {
        name,
        description,
        criteria: JSON.stringify(criteria),
        icon,
        points: points || 0,
        category: category || 'general',
        rarity: rarity || 'common'
      }
    })

    return Response.json(trophy, { status: 201 })
  } catch (error) {
    console.error('Error creating trophy:', error)
    return Response.json(
      { error: 'Failed to create trophy' },
      { status: 500 }
    )
  }
}