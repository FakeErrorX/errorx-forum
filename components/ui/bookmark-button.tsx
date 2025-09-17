"use client"
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Icon } from '@iconify/react'

interface BookmarkButtonProps {
  postId: string
  onBookmarkChange?: (bookmarked: boolean) => void
}

export function BookmarkButton({ postId, onBookmarkChange }: BookmarkButtonProps) {
  const [bookmarked, setBookmarked] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Check initial bookmark status
    const checkBookmark = async () => {
      try {
        const response = await fetch(`/api/posts/${postId}/bookmarks`)
        if (response.ok) {
          const data = await response.json()
          setBookmarked(data.bookmarked)
        }
      } catch (error) {
        console.error('Error checking bookmark:', error)
      }
    }
    checkBookmark()
  }, [postId])

  const handleBookmark = async () => {
    if (loading) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/posts/${postId}/bookmarks`, {
        method: bookmarked ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (response.ok) {
        const newBookmarked = !bookmarked
        setBookmarked(newBookmarked)
        onBookmarkChange?.(newBookmarked)
      }
    } catch (error) {
      console.error('Error updating bookmark:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant={bookmarked ? "default" : "ghost"}
      size="sm"
      onClick={handleBookmark}
      disabled={loading}
      className={bookmarked ? 'bg-primary text-primary-foreground' : ''}
    >
      <Icon 
        icon={bookmarked ? "lucide:bookmark" : "lucide:bookmark-plus"} 
        className="h-4 w-4 mr-1" 
      />
      {bookmarked ? 'Bookmarked' : 'Bookmark'}
    </Button>
  )
}
