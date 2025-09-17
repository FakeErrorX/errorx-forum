"use client"
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Icon } from '@iconify/react'

interface ReactionButtonProps {
  postId?: string
  commentId?: string
  currentReactions?: { type: string; count: number; userReacted: boolean }[]
  onReactionChange?: (type: string, reacted: boolean) => void
}

const REACTION_TYPES = [
  { type: 'like', emoji: '👍', label: 'Like' },
  { type: 'love', emoji: '❤️', label: 'Love' },
  { type: 'laugh', emoji: '😂', label: 'Laugh' },
  { type: 'wow', emoji: '😮', label: 'Wow' },
  { type: 'sad', emoji: '😢', label: 'Sad' },
  { type: 'angry', emoji: '😠', label: 'Angry' },
]

export function ReactionButton({ postId, commentId, currentReactions = [], onReactionChange }: ReactionButtonProps) {
  const [loading, setLoading] = useState(false)
  const [reactions, setReactions] = useState(currentReactions)

  const handleReaction = async (type: string) => {
    if (loading) return
    
    setLoading(true)
    try {
      const endpoint = postId ? `/api/posts/${postId}/reactions` : `/api/comments/${commentId}/reactions`
      const existingReaction = reactions.find(r => r.type === type && r.userReacted)
      
      const response = await fetch(endpoint, {
        method: existingReaction ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      })
      
      if (response.ok) {
        const newReactions = [...reactions]
        const reactionIndex = newReactions.findIndex(r => r.type === type)
        
        if (existingReaction) {
          // Remove reaction
          if (reactionIndex >= 0) {
            newReactions[reactionIndex] = {
              ...newReactions[reactionIndex],
              count: Math.max(0, newReactions[reactionIndex].count - 1),
              userReacted: false
            }
          }
        } else {
          // Add reaction
          if (reactionIndex >= 0) {
            newReactions[reactionIndex] = {
              ...newReactions[reactionIndex],
              count: newReactions[reactionIndex].count + 1,
              userReacted: true
            }
          } else {
            newReactions.push({ type, count: 1, userReacted: true })
          }
        }
        
        setReactions(newReactions)
        onReactionChange?.(type, !existingReaction)
      }
    } catch (error) {
      console.error('Error updating reaction:', error)
    } finally {
      setLoading(false)
    }
  }

  const getReactionCount = (type: string) => {
    return reactions.find(r => r.type === type)?.count || 0
  }

  const hasUserReacted = (type: string) => {
    return reactions.find(r => r.type === type)?.userReacted || false
  }

  return (
    <div className="flex items-center gap-1">
      {REACTION_TYPES.map(({ type, emoji, label }) => {
        const count = getReactionCount(type)
        const userReacted = hasUserReacted(type)
        
        return (
          <Button
            key={type}
            variant={userReacted ? "default" : "ghost"}
            size="sm"
            className={`h-8 px-2 ${userReacted ? 'bg-primary text-primary-foreground' : ''}`}
            onClick={() => handleReaction(type)}
            disabled={loading}
          >
            <span className="mr-1">{emoji}</span>
            {count > 0 && <span className="text-xs">{count}</span>}
          </Button>
        )
      })}
    </div>
  )
}
