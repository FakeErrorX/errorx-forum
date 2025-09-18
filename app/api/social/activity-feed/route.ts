import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { SocialFeaturesService } from '@/lib/social-features-service'

// GET /api/social/activity-feed - Get user's activity feed
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const activities = await SocialFeaturesService.getUserActivityFeed(
      session.user.id,
      limit,
      offset
    )

    return NextResponse.json({ 
      activities,
      pagination: {
        limit,
        offset,
        hasMore: activities.length === limit
      }
    })
  } catch (error) {
    console.error('Error fetching activity feed:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activity feed' },
      { status: 500 }
    )
  }
}

// POST /api/social/activity-feed/read - Mark activity feed items as read
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const activityIds = body.activityIds || undefined

    const result = await SocialFeaturesService.markActivityFeedAsRead(
      session.user.id,
      activityIds
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error marking activity feed as read:', error)
    return NextResponse.json(
      { error: 'Failed to mark activity feed as read' },
      { status: 500 }
    )
  }
}