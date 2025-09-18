"use client"

import React, { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { 
  Heart, Star, Smile, Frown, ThumbsUp, ThumbsDown,
  Laugh, Zap, Eye, Heart as HeartIcon
} from 'lucide-react'
import { cn } from '@/lib/utils'

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

interface RatingDisplayProps {
  postId?: string
  replyId?: string
  commentId?: string
  initialStats?: RatingStats
  showLikes?: boolean
  showRatings?: boolean
  showReactions?: boolean
  interactive?: boolean
  compact?: boolean
  className?: string
}

const reactionIcons: { [key: string]: React.ComponentType<{ className?: string }> } = {
  like: Heart,
  love: HeartIcon,
  laugh: Laugh,
  wow: Zap,
  sad: Frown,
  angry: Frown,
  thumbsup: ThumbsUp,
  thumbsdown: ThumbsDown
}

const reactionLabels: { [key: string]: string } = {
  like: 'Like',
  love: 'Love',
  laugh: 'Laugh',
  wow: 'Wow',
  sad: 'Sad',
  angry: 'Angry',
  thumbsup: 'Thumbs Up',
  thumbsdown: 'Thumbs Down'
}

export function RatingDisplay({
  postId,
  replyId,
  commentId,
  initialStats,
  showLikes = true,
  showRatings = false,
  showReactions = false,
  interactive = true,
  compact = false,
  className
}: RatingDisplayProps) {
  const [stats, setStats] = useState<RatingStats | null>(initialStats || null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load stats if not provided
  useEffect(() => {
    if (!initialStats && (postId || replyId || commentId)) {
      loadStats()
    }
  }, [postId, replyId, commentId, initialStats])

  const loadStats = useCallback(async () => {
    if (!postId && !replyId && !commentId) return

    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (postId) params.append('postId', postId)
      if (replyId) params.append('replyId', replyId)
      if (commentId) params.append('commentId', commentId)

      const response = await fetch(`/api/ratings?${params.toString()}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load rating stats')
      }

      setStats(data)
    } catch (error) {
      console.error('Error loading rating stats:', error)
      setError(error instanceof Error ? error.message : 'Failed to load ratings')
    } finally {
      setLoading(false)
    }
  }, [postId, replyId, commentId])

  const handleLike = useCallback(async () => {
    if (!interactive || loading) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/likes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          postId,
          commentId
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to toggle like')
      }

      // Update stats
      setStats(prev => prev ? {
        ...prev,
        totalLikes: data.totalLikes,
        userLike: data.isLiked
      } : null)

    } catch (error) {
      console.error('Error toggling like:', error)
      setError(error instanceof Error ? error.message : 'Failed to toggle like')
    } finally {
      setLoading(false)
    }
  }, [interactive, loading, postId, commentId])

  const handleRating = useCallback(async (rating: number) => {
    if (!interactive || loading) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/ratings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          postId,
          replyId,
          rating
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to set rating')
      }

      // Update stats
      setStats(prev => prev ? {
        ...prev,
        averageRating: data.averageRating,
        ratingCount: data.ratingCount,
        userRating: rating
      } : null)

    } catch (error) {
      console.error('Error setting rating:', error)
      setError(error instanceof Error ? error.message : 'Failed to set rating')
    } finally {
      setLoading(false)
    }
  }, [interactive, loading, postId, replyId])

  const handleReaction = useCallback(async (reactionType: string) => {
    if (!interactive || loading) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/reactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          postId,
          commentId,
          reactionType
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to toggle reaction')
      }

      // Update stats
      setStats(prev => prev ? {
        ...prev,
        reactions: data.reactions,
        userReactions: prev.userReactions?.includes(reactionType) 
          ? prev.userReactions.filter(r => r !== reactionType)
          : [...(prev.userReactions || []), reactionType]
      } : null)

    } catch (error) {
      console.error('Error toggling reaction:', error)
      setError(error instanceof Error ? error.message : 'Failed to toggle reaction')
    } finally {
      setLoading(false)
    }
  }, [interactive, loading, postId, commentId])

  if (loading && !stats) {
    return <div className="text-sm text-muted-foreground">Loading ratings...</div>
  }

  if (error && !stats) {
    return <div className="text-sm text-destructive">Error: {error}</div>
  }

  if (!stats) return null

  const hasAnyRatings = showLikes || showRatings || showReactions

  if (!hasAnyRatings) return null

  return (
    <div className={cn("space-y-2", className)}>
      {error && (
        <div className="text-xs text-destructive">{error}</div>
      )}

      <div className={cn(
        "flex items-center gap-4",
        compact && "gap-2"
      )}>
        {/* Like Button */}
        {showLikes && (
          <Button
            variant={stats.userLike ? "default" : "ghost"}
            size={compact ? "sm" : "default"}
            onClick={handleLike}
            disabled={!interactive || loading}
            className={cn(
              "gap-1",
              stats.userLike && "text-red-500 hover:text-red-600"
            )}
          >
            <Heart className={cn(
              "w-4 h-4",
              stats.userLike && "fill-current"
            )} />
            {!compact && "Like"}
            {stats.totalLikes > 0 && (
              <span className="text-xs">({stats.totalLikes})</span>
            )}
          </Button>
        )}

        {/* Star Rating */}
        {showRatings && (postId || replyId) && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Button
                  key={star}
                  variant="ghost"
                  size="sm"
                  className="w-6 h-6 p-0"
                  onClick={() => handleRating(star)}
                  disabled={!interactive || loading}
                >
                  <Star className={cn(
                    "w-4 h-4",
                    (stats.userRating && star <= stats.userRating) || (!stats.userRating && star <= stats.averageRating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted-foreground"
                  )} />
                </Button>
              ))}
            </div>
            {!compact && stats.ratingCount > 0 && (
              <span className="text-xs text-muted-foreground">
                {stats.averageRating.toFixed(1)} ({stats.ratingCount})
              </span>
            )}
          </div>
        )}

        {/* Reactions */}
        {showReactions && (
          <div className="flex items-center gap-1">
            {Object.entries(reactionIcons).map(([type, Icon]) => {
              const count = stats.reactions[type] || 0
              const isActive = stats.userReactions?.includes(type)
              
              if (!interactive && count === 0) return null

              return (
                <Button
                  key={type}
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "gap-1",
                    compact && "w-6 h-6 p-0"
                  )}
                  onClick={() => handleReaction(type)}
                  disabled={!interactive || loading}
                  title={reactionLabels[type]}
                >
                  <Icon className="w-4 h-4" />
                  {!compact && count > 0 && (
                    <span className="text-xs">({count})</span>
                  )}
                </Button>
              )
            })}
          </div>
        )}
      </div>

      {/* Compact stats summary */}
      {compact && (stats.totalLikes > 0 || stats.ratingCount > 0) && (
        <div className="text-xs text-muted-foreground flex items-center gap-2">
          {stats.totalLikes > 0 && (
            <span>{stats.totalLikes} likes</span>
          )}
          {stats.ratingCount > 0 && (
            <span>{stats.averageRating.toFixed(1)} ★ ({stats.ratingCount})</span>
          )}
        </div>
      )}
    </div>
  )
}

export default RatingDisplay