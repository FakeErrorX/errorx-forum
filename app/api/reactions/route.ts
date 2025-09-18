import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { RatingService, ReactionType } from '@/lib/rating-service'

// Toggle reaction on a post or comment
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
    const { postId, commentId, reactionType } = body

    if (!postId && !commentId) {
      return NextResponse.json(
        { error: 'Either postId or commentId is required' },
        { status: 400 }
      )
    }

    if (!reactionType) {
      return NextResponse.json(
        { error: 'reactionType is required' },
        { status: 400 }
      )
    }

    // Validate reaction type
    const validReactions: ReactionType[] = ['like', 'love', 'laugh', 'wow', 'sad', 'angry', 'thumbsup', 'thumbsdown']
    if (!validReactions.includes(reactionType)) {
      return NextResponse.json(
        { error: 'Invalid reaction type' },
        { status: 400 }
      )
    }

    const result = await RatingService.toggleReaction({
      userId,
      postId,
      commentId,
      reactionType
    })

    if (result.success) {
      return NextResponse.json({
        reactions: result.reactions
      })
    } else {
      return NextResponse.json(
        { error: 'Failed to toggle reaction' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Error in reaction endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}