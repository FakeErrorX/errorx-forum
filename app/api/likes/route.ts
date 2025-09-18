import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { RatingService } from '@/lib/rating-service'

// Toggle like on a post or comment
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = (session.user as any)?.id
    const body = await request.json()
    const { postId, commentId } = body

    if (!postId && !commentId) {
      return NextResponse.json(
        { error: 'Either postId or commentId is required' },
        { status: 400 }
      )
    }

    const result = await RatingService.toggleLike({
      userId,
      postId,
      commentId
    })

    if (result.success) {
      return NextResponse.json({
        isLiked: result.isLiked,
        totalLikes: result.totalLikes
      })
    } else {
      return NextResponse.json(
        { error: 'Failed to toggle like' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Error in like endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}