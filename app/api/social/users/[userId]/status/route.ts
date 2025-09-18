import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { SocialFeaturesService } from '@/lib/social-features-service'

interface UserParams {
  params: Promise<{
    userId: string
  }>
}

// GET /api/social/users/[userId]/status - Get follow/block status between users
export async function GET(request: NextRequest, { params }: UserParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId } = await params
    const [status, stats] = await Promise.all([
      SocialFeaturesService.getFollowStatus(session.user.id, userId),
      SocialFeaturesService.getUserSocialStats(userId)
    ])

    return NextResponse.json({ 
      ...status,
      ...stats
    })
  } catch (error) {
    console.error('Error fetching user status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user status' },
      { status: 500 }
    )
  }
}

// POST /api/social/users/[userId]/view - Record profile view
export async function POST(request: NextRequest, { params }: UserParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId } = await params
    const result = await SocialFeaturesService.recordProfileView(session.user.id, userId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error recording profile view:', error)
    return NextResponse.json(
      { error: 'Failed to record profile view' },
      { status: 500 }
    )
  }
}