"use client"
import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ReactionButton } from './reaction-button'
import { BookmarkButton } from './bookmark-button'
import { PollDisplay } from './poll-display'
import { PollCreator } from './poll-creator'
import { Icon } from '@iconify/react'

interface Poll {
  id: string
  question: string
  isMultiple: boolean
  closesAt?: string
  options: Array<{ id: string; text: string; votes: number }>
}

interface PostCardProps {
  post: {
    postId: number
    title: string
    content: string
    categoryId: number
    authorId: number
    authorUsername: string
    isPinned: boolean
    isFeatured?: boolean
    isLocked: boolean
    views: number
    likes: number
    replies: number
    createdAt: string
    author: {
      userId: number
      name: string | null
      username: string | null
      image: string | null
    }
    category: {
      categoryId: number
      name: string
      description: string | null
      icon: string | null
      color: string | null
    }
  }
  category: {
    categoryId: number
    name: string
    description: string | null
    icon: string | null
    color: string | null
  } | null
  onAuthorClick: (username: string) => void
  onPostClick?: () => void
  showPoll?: boolean
  showCreatePoll?: boolean
  formatTimeAgo: (date: string) => string
}

export function PostCard({ 
  post, 
  category, 
  onAuthorClick, 
  onPostClick,
  showPoll = false,
  showCreatePoll = false,
  formatTimeAgo 
}: PostCardProps) {
  const [poll, setPoll] = useState<Poll | null>(null)
  const [showPollCreator, setShowPollCreator] = useState(false)

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start space-x-3 sm:space-x-4">
          <Avatar className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
            <AvatarImage src="" alt={post.authorUsername} />
            <AvatarFallback className="text-xs sm:text-sm">
              {post.authorUsername.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {post.isPinned && (
                <Badge variant="secondary" className="text-xs">
                  <Icon icon="lucide:star" className="h-3 w-3 mr-1" />
                  Pinned
                </Badge>
              )}
              {post.isFeatured && (
                <Badge variant="default" className="text-xs">
                  <Icon icon="lucide:flame" className="h-3 w-3 mr-1" />
                  Featured
                </Badge>
              )}
              {category && (
                <Badge variant="outline" className="text-xs">
                  {category.name}
                </Badge>
              )}
            </div>
            
            <h3 
              className="font-medium text-foreground hover:text-primary cursor-pointer text-sm sm:text-base line-clamp-2"
              onClick={onPostClick}
            >
              {post.title}
            </h3>
            
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 text-xs sm:text-sm text-muted-foreground">
              <span>
                by{' '}
                <button 
                  onClick={() => onAuthorClick(post.authorUsername)}
                  className="text-primary hover:underline"
                >
                  {post.authorUsername}
                </button>
              </span>
              <span className="flex items-center">
                <Icon icon="lucide:clock" className="h-3 w-3 mr-1" />
                {formatTimeAgo(post.createdAt)}
              </span>
              <span className="hidden sm:inline">{post.replies} replies</span>
              <span className="hidden sm:inline">{post.views} views</span>
              <span className="hidden sm:inline">{post.likes} likes</span>
              <div className="flex sm:hidden gap-3 text-xs">
                <span>{post.replies}</span>
                <span>{post.views}</span>
                <span>{post.likes}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 mt-3">
              <ReactionButton 
                postId={post.postId.toString()}
                onReactionChange={(type, reacted) => {
                  console.log(`Reaction ${type}: ${reacted ? 'added' : 'removed'}`)
                }}
              />
              <BookmarkButton 
                postId={post.postId.toString()}
                onBookmarkChange={(bookmarked) => {
                  console.log(`Bookmark: ${bookmarked ? 'added' : 'removed'}`)
                }}
              />
            </div>

            {/* Poll display */}
            {showPoll && (
              <PollDisplay 
                postId={post.postId.toString()}
                poll={poll || undefined}
                onPollUpdate={setPoll}
              />
            )}

            {/* Poll creator */}
            {showCreatePoll && !poll && (
              <div className="mt-4">
                {!showPollCreator ? (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowPollCreator(true)}
                  >
                    <Icon icon="lucide:plus" className="h-4 w-4 mr-1" />
                    Add Poll
                  </Button>
                ) : (
                  <PollCreator 
                    postId={post.postId.toString()}
                    onPollCreated={(newPoll) => {
                      setPoll(newPoll)
                      setShowPollCreator(false)
                    }}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
