import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { SocialFeaturesService } from '@/lib/social-features-service'

interface UserParams {
  params: Promise<{
    userId: string
  }>
}

// GET /api/social/users/[userId]/following - Get users that this user is following
export async function GET(request: NextRequest, { params }: UserParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId } = await params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const following = await SocialFeaturesService.getUserFollowing(userId, limit, offset)

    return NextResponse.json({ 
      following,
      pagination: {
        limit,
        offset,
        hasMore: following.length === limit
      }
    })
  } catch (error) {
    console.error('Error fetching user following:', error)
    return NextResponse.json(
      { error: 'Failed to fetch following' },
      { status: 500 }
    )
  }
}