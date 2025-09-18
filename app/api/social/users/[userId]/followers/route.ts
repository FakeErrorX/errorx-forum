import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { SocialFeaturesService } from '@/lib/social-features-service'

interface UserParams {
  params: Promise<{
    userId: string
  }>
}

// GET /api/social/users/[userId]/followers - Get user followers
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

    const followers = await SocialFeaturesService.getUserFollowers(userId, limit, offset)

    return NextResponse.json({ 
      followers,
      pagination: {
        limit,
        offset,
        hasMore: followers.length === limit
      }
    })
  } catch (error) {
    console.error('Error fetching user followers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch followers' },
      { status: 500 }
    )
  }
}