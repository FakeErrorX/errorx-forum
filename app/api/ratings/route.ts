import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { RatingService } from '@/lib/rating-service'

// Set or update rating for a post or reply
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
    const { postId, replyId, rating } = body

    if (!postId && !replyId) {
      return NextResponse.json(
        { error: 'Either postId or replyId is required' },
        { status: 400 }
      )
    }

    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be a number between 1 and 5' },
        { status: 400 }
      )
    }

    const result = await RatingService.setRating({
      userId,
      postId,
      replyId,
      rating
    })

    if (result.success) {
      return NextResponse.json({
        averageRating: result.averageRating,
        ratingCount: result.ratingCount
      })
    } else {
      return NextResponse.json(
        { error: 'Failed to set rating' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Error in rating endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Get rating stats for a post or reply
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const postId = searchParams.get('postId')
    const replyId = searchParams.get('replyId')
    const commentId = searchParams.get('commentId')

    if (!postId && !replyId && !commentId) {
      return NextResponse.json(
        { error: 'postId, replyId, or commentId is required' },
        { status: 400 }
      )
    }

    // Get user ID if authenticated
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id

    const stats = await RatingService.getRatingStats(
      { postId: postId || undefined, replyId: replyId || undefined, commentId: commentId || undefined },
      userId
    )

    return NextResponse.json(stats)

  } catch (error) {
    console.error('Error getting rating stats:', error)
    return NextResponse.json(
      { error: 'Failed to get rating stats' },
      { status: 500 }
    )
  }
}