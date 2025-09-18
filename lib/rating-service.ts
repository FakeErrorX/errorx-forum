import { prisma } from '@/lib/prisma'

export type RatingType = 'like' | 'rating' | 'reaction'
export type ReactionType = 'like' | 'love' | 'laugh' | 'wow' | 'sad' | 'angry' | 'thumbsup' | 'thumbsdown'

export interface RatingStats {
  totalLikes: number
  totalRating: number
  averageRating: number
  ratingCount: number
  reactions: { [key: string]: number }
  userRating?: number
  userLike?: boolean
  userReactions?: string[]
}

export interface UserRatingAction {
  userId: string
  postId?: string
  replyId?: string
  commentId?: string
}

export class RatingService {
  /**
   * Toggle like on a post/comment
   */
  static async toggleLike(action: UserRatingAction): Promise<{ success: boolean; isLiked: boolean; totalLikes: number }> {
    try {
      const { userId, postId, commentId } = action

      if (!postId && !commentId) {
        throw new Error('Either postId or commentId must be provided')
      }

      // Check if user already liked this item
      const existingLike = await prisma.like.findFirst({
        where: {
          userId,
          ...(postId && { postId }),
          ...(commentId && { commentId })
        }
      })

      let isLiked: boolean
      let totalLikes: number

      if (existingLike) {
        // Remove like
        await prisma.like.delete({
          where: { id: existingLike.id }
        })
        isLiked = false

        // Update count
        if (postId) {
          await prisma.post.update({
            where: { id: postId },
            data: { likes: { decrement: 1 } }
          })
          const post = await prisma.post.findUnique({
            where: { id: postId },
            select: { likes: true }
          })
          totalLikes = post?.likes || 0
        } else {
          await prisma.comment.update({
            where: { id: commentId },
            data: { likes: { decrement: 1 } }
          })
          const comment = await prisma.comment.findUnique({
            where: { id: commentId },
            select: { likes: true }
          })
          totalLikes = comment?.likes || 0
        }
      } else {
        // Add like
        await prisma.like.create({
          data: {
            userId,
            ...(postId && { postId }),
            ...(commentId && { commentId })
          }
        })
        isLiked = true

        // Update count
        if (postId) {
          await prisma.post.update({
            where: { id: postId },
            data: { likes: { increment: 1 } }
          })
          const post = await prisma.post.findUnique({
            where: { id: postId },
            select: { likes: true }
          })
          totalLikes = post?.likes || 0
        } else {
          await prisma.comment.update({
            where: { id: commentId },
            data: { likes: { increment: 1 } }
          })
          const comment = await prisma.comment.findUnique({
            where: { id: commentId },
            select: { likes: true }
          })
          totalLikes = comment?.likes || 0
        }
      }

      return { success: true, isLiked, totalLikes }
    } catch (error) {
      console.error('Error toggling like:', error)
      return { success: false, isLiked: false, totalLikes: 0 }
    }
  }

  /**
   * Add or update rating (1-5 stars)
   */
  static async setRating(
    action: UserRatingAction & { rating: number }
  ): Promise<{ success: boolean; averageRating: number; ratingCount: number }> {
    try {
      const { userId, postId, replyId, rating } = action

      if (!postId && !replyId) {
        throw new Error('Either postId or replyId must be provided')
      }

      if (rating < 1 || rating > 5) {
        throw new Error('Rating must be between 1 and 5')
      }

      // Upsert rating
      await prisma.postRating.upsert({
        where: {
          ...(postId ? { userId_postId: { userId, postId } } : { userId_replyId: { userId, replyId: replyId! } })
        },
        update: {
          rating
        },
        create: {
          userId,
          ...(postId && { postId }),
          ...(replyId && { replyId }),
          rating
        }
      })

      // Calculate new average rating
      const stats = await this.calculateRatingStats({ postId, replyId })

      return {
        success: true,
        averageRating: stats.averageRating,
        ratingCount: stats.ratingCount
      }
    } catch (error) {
      console.error('Error setting rating:', error)
      return { success: false, averageRating: 0, ratingCount: 0 }
    }
  }

  /**
   * Toggle reaction on a post/comment
   */
  static async toggleReaction(
    action: UserRatingAction & { reactionType: ReactionType }
  ): Promise<{ success: boolean; reactions: { [key: string]: number } }> {
    try {
      const { userId, postId, commentId, reactionType } = action

      if (!postId && !commentId) {
        throw new Error('Either postId or commentId must be provided')
      }

      // Check if user already has this reaction
      const existingReaction = await prisma.reaction.findFirst({
        where: {
          userId,
          type: reactionType,
          ...(postId && { postId }),
          ...(commentId && { commentId })
        }
      })

      if (existingReaction) {
        // Remove reaction
        await prisma.reaction.delete({
          where: { id: existingReaction.id }
        })
      } else {
        // Add reaction
        await prisma.reaction.create({
          data: {
            userId,
            type: reactionType,
            ...(postId && { postId }),
            ...(commentId && { commentId })
          }
        })
      }

      // Get updated reaction counts
      const reactions = await this.getReactionCounts({ postId, commentId })

      return { success: true, reactions }
    } catch (error) {
      console.error('Error toggling reaction:', error)
      return { success: false, reactions: {} }
    }
  }

  /**
   * Get comprehensive rating stats for a post/comment
   */
  static async getRatingStats(
    target: { postId?: string; replyId?: string; commentId?: string },
    userId?: string
  ): Promise<RatingStats> {
    try {
      const { postId, replyId, commentId } = target

      // Get like count and user's like status
      let totalLikes = 0
      let userLike = false

      if (postId || commentId) {
        const likeCount = await prisma.like.count({
          where: {
            ...(postId && { postId }),
            ...(commentId && { commentId })
          }
        })
        totalLikes = likeCount

        if (userId) {
          const userLikeRecord = await prisma.like.findFirst({
            where: {
              userId,
              ...(postId && { postId }),
              ...(commentId && { commentId })
            }
          })
          userLike = !!userLikeRecord
        }
      }

      // Get rating stats
      const ratingStats = await this.calculateRatingStats({ postId, replyId })

      // Get user's rating if provided
      let userRating: number | undefined
      if (userId && (postId || replyId)) {
        const userRatingRecord = await prisma.postRating.findFirst({
          where: {
            userId,
            ...(postId && { postId }),
            ...(replyId && { replyId })
          }
        })
        userRating = userRatingRecord?.rating
      }

      // Get reaction counts
      const reactions = await this.getReactionCounts({ postId, commentId })

      // Get user's reactions
      let userReactions: string[] = []
      if (userId && (postId || commentId)) {
        const userReactionRecords = await prisma.reaction.findMany({
          where: {
            userId,
            ...(postId && { postId }),
            ...(commentId && { commentId })
          },
          select: { type: true }
        })
        userReactions = userReactionRecords.map(r => r.type)
      }

      return {
        totalLikes,
        totalRating: ratingStats.totalRating,
        averageRating: ratingStats.averageRating,
        ratingCount: ratingStats.ratingCount,
        reactions,
        userRating,
        userLike,
        userReactions
      }
    } catch (error) {
      console.error('Error getting rating stats:', error)
      return {
        totalLikes: 0,
        totalRating: 0,
        averageRating: 0,
        ratingCount: 0,
        reactions: {},
        userLike: false,
        userReactions: []
      }
    }
  }

  /**
   * Get top-rated posts
   */
  static async getTopRatedPosts(limit: number = 10): Promise<Array<{
    postId: string
    averageRating: number
    ratingCount: number
    title?: string
  }>> {
    try {
      // This is a complex query that would benefit from a database view
      // For now, we'll do a simplified version
      const ratings = await prisma.postRating.groupBy({
        by: ['postId'],
        where: {
          postId: { not: null }
        },
        _avg: {
          rating: true
        },
        _count: {
          rating: true
        },
        having: {
          rating: {
            _count: {
              gte: 5 // Minimum 5 ratings to be considered
            }
          }
        },
        orderBy: {
          _avg: {
            rating: 'desc'
          }
        },
        take: limit
      })

      return ratings.map(rating => ({
        postId: rating.postId!,
        averageRating: rating._avg.rating || 0,
        ratingCount: rating._count.rating
      }))
    } catch (error) {
      console.error('Error getting top rated posts:', error)
      return []
    }
  }

  /**
   * Get user's rating activity
   */
  static async getUserRatingActivity(userId: string): Promise<{
    likesGiven: number
    likesReceived: number
    ratingsGiven: number
    averageRatingGiven: number
    reactionsGiven: number
  }> {
    try {
      // Likes given
      const likesGiven = await prisma.like.count({
        where: { userId }
      })

      // Likes received (on user's posts/comments)
      const likesReceived = await prisma.like.count({
        where: {
          OR: [
            { post: { authorId: userId } },
            { comment: { authorId: userId } }
          ]
        }
      })

      // Ratings given
      const ratingsGiven = await prisma.postRating.count({
        where: { userId }
      })

      // Average rating given
      const avgRatingResult = await prisma.postRating.aggregate({
        where: { userId },
        _avg: { rating: true }
      })
      const averageRatingGiven = avgRatingResult._avg.rating || 0

      // Reactions given
      const reactionsGiven = await prisma.reaction.count({
        where: { userId }
      })

      return {
        likesGiven,
        likesReceived,
        ratingsGiven,
        averageRatingGiven,
        reactionsGiven
      }
    } catch (error) {
      console.error('Error getting user rating activity:', error)
      return {
        likesGiven: 0,
        likesReceived: 0,
        ratingsGiven: 0,
        averageRatingGiven: 0,
        reactionsGiven: 0
      }
    }
  }

  // Private helper methods

  private static async calculateRatingStats(target: { postId?: string; replyId?: string }): Promise<{
    totalRating: number
    averageRating: number
    ratingCount: number
  }> {
    const { postId, replyId } = target

    const ratingStats = await prisma.postRating.aggregate({
      where: {
        ...(postId && { postId }),
        ...(replyId && { replyId })
      },
      _avg: { rating: true },
      _sum: { rating: true },
      _count: { rating: true }
    })

    return {
      totalRating: ratingStats._sum.rating || 0,
      averageRating: ratingStats._avg.rating || 0,
      ratingCount: ratingStats._count.rating || 0
    }
  }

  private static async getReactionCounts(target: { postId?: string; commentId?: string }): Promise<{ [key: string]: number }> {
    const { postId, commentId } = target

    const reactionCounts = await prisma.reaction.groupBy({
      by: ['type'],
      where: {
        ...(postId && { postId }),
        ...(commentId && { commentId })
      },
      _count: {
        type: true
      }
    })

    const reactions: { [key: string]: number } = {}
    reactionCounts.forEach(reaction => {
      reactions[reaction.type] = reaction._count.type
    })

    return reactions
  }
}