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
import { RatingDisplay } from './rating-display'
import { BBCodeParser } from '@/lib/bbcode-parser'
import { Icon } from '@iconify/react'

interface PostAttachment {
  id: string
  filename: string
  size: number
  mimetype: string
  url: string
}

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
    attachments?: PostAttachment[]
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
  showRatings?: boolean
  compact?: boolean
  formatTimeAgo: (date: string) => string
}

export function PostCard({ 
  post, 
  category, 
  onAuthorClick, 
  onPostClick,
  showPoll = false,
  showCreatePoll = false,
  showRatings = true,
  compact = false,
  formatTimeAgo 
}: PostCardProps) {
  const [poll, setPoll] = useState<Poll | null>(null)
  const [showPollCreator, setShowPollCreator] = useState(false)
  const [showFullContent, setShowFullContent] = useState(false)

  const bbcodeParser = new BBCodeParser()
  
  // Parse BBCode content
  const parsedContent = bbcodeParser.parse(post.content)
  const isLongContent = post.content.length > 300
  const shouldTruncate = !showFullContent && isLongContent && compact

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const isImageFile = (mimetype: string): boolean => {
    return mimetype.startsWith('image/')
  }

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

            {/* Post content with BBCode rendering */}
            {!compact && (
              <div className="mt-3">
                <div 
                  className={`prose prose-sm max-w-none ${shouldTruncate ? 'line-clamp-3' : ''}`}
                  dangerouslySetInnerHTML={{ 
                    __html: shouldTruncate 
                      ? bbcodeParser.stripTags(post.content).substring(0, 300) + '...'
                      : parsedContent 
                  }}
                />
                {isLongContent && (
                  <Button
                    variant="link"
                    size="sm"
                    className="p-0 h-auto mt-2"
                    onClick={() => setShowFullContent(!showFullContent)}
                  >
                    {showFullContent ? 'Show less' : 'Show more'}
                  </Button>
                )}
              </div>
            )}

            {/* Attachments */}
            {post.attachments && post.attachments.length > 0 && (
              <div className="mt-3 space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Attachments ({post.attachments.length})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {post.attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="border rounded-lg p-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Icon 
                          icon={isImageFile(attachment.mimetype) ? "lucide:image" : "lucide:file"} 
                          className="h-4 w-4 text-muted-foreground flex-shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">
                            {attachment.filename}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(attachment.size)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(attachment.url, '_blank')}
                        >
                          <Icon icon="lucide:download" className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {/* Image preview */}
                      {isImageFile(attachment.mimetype) && (
                        <div className="mt-2">
                          <img
                            src={attachment.url}
                            alt={attachment.filename}
                            className="max-w-full h-auto rounded border max-h-48 object-cover"
                            loading="lazy"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
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

            {/* Action buttons and ratings */}
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-2">
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

              {/* Ratings */}
              {showRatings && (
                <RatingDisplay
                  postId={post.postId.toString()}
                  showLikes={true}
                  showRatings={!compact}
                  showReactions={!compact}
                  compact={compact}
                  interactive={true}
                />
              )}
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
