import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { SocialFeaturesService } from '@/lib/social-features-service'
import { z } from 'zod'

// POST /api/social/follow - Follow a user
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const followSchema = z.object({
      userId: z.string().min(1)
    })

    const body = await request.json()
    const { userId } = followSchema.parse(body)

    const follow = await SocialFeaturesService.followUser({
      followerId: session.user.id,
      followingId: userId
    })

    return NextResponse.json(follow, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error following user:', error)
    const message = error instanceof Error ? error.message : 'Failed to follow user'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// DELETE /api/social/follow - Unfollow a user
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const result = await SocialFeaturesService.unfollowUser(session.user.id, userId)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error unfollowing user:', error)
    const message = error instanceof Error ? error.message : 'Failed to unfollow user'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}