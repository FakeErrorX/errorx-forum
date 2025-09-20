"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Icon } from '@iconify/react';
import { toast } from "sonner";
import Header from "@/components/layout/header";
import { PageSEO } from "@/components/seo/page-seo";
import { BBCodeEditor } from "@/components/ui/bbcode-editor";
import { ReactionButton } from "@/components/ui/reaction-button";
import { BookmarkButton } from "@/components/ui/bookmark-button";
import { FollowIgnoreButtons } from "@/components/ui/follow-ignore-buttons";
import { RatingDisplay } from "@/components/ui/rating-display";

interface User {
  name: string;
  email: string;
  userId: number;
  image?: string | null;
  username?: string | null;
}

interface Post {
  postId: number;
  title: string;
  content: string;
  categoryId: number;
  authorId: number;
  authorUsername: string;
  isPinned: boolean;
  isFeatured?: boolean;
  isLocked: boolean;
  views: number;
  likes: number;
  replies: number;
  createdAt: string;
  updatedAt: string;
  author: {
    userId: number;
    name: string | null;
    username: string | null;
    image: string | null;
  };
  category: {
    categoryId: number;
    name: string;
    description: string | null;
    icon: string | null;
    color: string | null;
  };
  comments?: Comment[];
  attachments?: any[];
}

interface Comment {
  commentId: number;
  content: string;
  postId: number;
  authorId: number;
  parentCommentId?: number | null;
  createdAt: string;
  updatedAt: string;
  likes: number;
  author: {
    userId: number;
    name: string | null;
    username: string | null;
    image: string | null;
  };
  replies?: Comment[];
}

export default function PostDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commenting, setCommenting] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const postId = params.id as string;

  // Load current user data
  const loadCurrentUser = async () => {
    if (!session?.user) return;
    
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const userData = await response.json();
        setCurrentUser(userData);
      }
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  };

  // Load post data
  const loadPost = async () => {
    if (!postId) return;
    
    try {
      const response = await fetch(`/api/posts/${postId}`);
      if (response.ok) {
        const postData = await response.json();
        setPost(postData);
        setComments(postData.comments || []);
        
        // Increment view count
        await fetch(`/api/posts/${postId}/view`, { method: 'POST' });
      } else {
        router.push('/404');
      }
    } catch (error) {
      console.error('Error loading post:', error);
      router.push('/404');
    } finally {
      setLoading(false);
    }
  };

  // Submit comment
  const handleSubmitComment = async () => {
    if (!newComment.trim() || !session?.user || !post) return;

    setCommenting(true);
    try {
      const response = await fetch(`/api/posts/${post.postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newComment.trim(),
        }),
      });

      if (response.ok) {
        setNewComment("");
        await loadPost(); // Reload to get updated comments
        toast.success("Comment added successfully!");
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to add comment");
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error("Failed to add comment");
    } finally {
      setCommenting(false);
    }
  };

  // Submit reply to comment
  const handleSubmitReply = async (parentCommentId: number) => {
    if (!replyContent.trim() || !session?.user || !post) return;

    setCommenting(true);
    try {
      const response = await fetch(`/api/posts/${post.postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: replyContent.trim(),
          parentCommentId,
        }),
      });

      if (response.ok) {
        setReplyContent("");
        setReplyingTo(null);
        await loadPost(); // Reload to get updated comments
        toast.success("Reply added successfully!");
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to add reply");
      }
    } catch (error) {
      console.error('Error adding reply:', error);
      toast.error("Failed to add reply");
    } finally {
      setCommenting(false);
    }
  };

  // Format time ago
  const formatTimeAgo = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  // Get user initials
  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Render comment tree
  const renderComment = (comment: Comment, depth: number = 0) => {
    return (
      <div key={comment.commentId} className={`space-y-3 ${depth > 0 ? 'ml-8 border-l-2 border-muted pl-4' : ''}`}>
        <div className="flex items-start space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={comment.author.image || ""} alt={comment.author.name || "User"} />
            <AvatarFallback className="text-xs">
              {getInitials(comment.author.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  if (comment.author.username) {
                    router.push(`/profile/${comment.author.username}`);
                  }
                }}
                className="font-medium text-sm hover:underline"
              >
                {comment.author.name || comment.author.username || "Anonymous"}
              </button>
              <span className="text-xs text-muted-foreground">
                {formatTimeAgo(comment.createdAt)}
              </span>
            </div>
            <div className="text-sm prose dark:prose-invert max-w-none">
              {comment.content}
            </div>
            <div className="flex items-center space-x-4 text-xs">
              <ReactionButton
                commentId={comment.commentId.toString()}
              />
              {session?.user && (
                <button
                  onClick={() => {
                    setReplyingTo(comment.commentId);
                    setReplyContent("");
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Reply
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Reply form */}
        {replyingTo === comment.commentId && (
          <div className="ml-11 space-y-2">
            <Textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Write a reply..."
              className="min-h-[80px]"
            />
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                onClick={() => handleSubmitReply(comment.commentId)}
                disabled={commenting || !replyContent.trim()}
              >
                {commenting ? (
                  <>
                    <Icon icon="lucide:loader-2" className="mr-2 h-3 w-3 animate-spin" />
                    Replying...
                  </>
                ) : (
                  "Reply"
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setReplyingTo(null);
                  setReplyContent("");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Render replies */}
        {comment.replies && comment.replies.map(reply => renderComment(reply, depth + 1))}
      </div>
    );
  };

  useEffect(() => {
    loadCurrentUser();
    loadPost();
  }, [postId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Icon icon="lucide:file-x" className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Post not found</h2>
          <p className="text-muted-foreground mb-4">The post you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => router.push("/")}>Go Home</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageSEO
        title={`${post.title} - ErrorX Forum`}
        description={post.content.slice(0, 160)}
        path={`/posts/${post.postId}`}
      />
      <div className="min-h-screen bg-background">
        <Header
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          isSearching={isSearching}
          currentUser={currentUser}
          searchPlaceholder="Search posts..."
        />

        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            {/* Breadcrumb */}
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <button onClick={() => router.push("/")} className="hover:text-foreground">
                Home
              </button>
              <Icon icon="lucide:chevron-right" className="h-4 w-4" />
              <button
                onClick={() => router.push(`/categories/${post.category.categoryId}`)}
                className="hover:text-foreground"
              >
                {post.category.name}
              </button>
              <Icon icon="lucide:chevron-right" className="h-4 w-4" />
              <span className="truncate">{post.title}</span>
            </div>

            {/* Post Content */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant="outline"
                        className="flex items-center space-x-1"
                        style={{ borderColor: post.category.color || "#666" }}
                      >
                        {post.category.icon && (
                          <Icon
                            icon={post.category.icon}
                            className="h-3 w-3"
                            style={{ color: post.category.color || "#666" }}
                          />
                        )}
                        <span>{post.category.name}</span>
                      </Badge>
                      {post.isPinned && <Badge variant="secondary">Pinned</Badge>}
                      {post.isFeatured && <Badge variant="default">Featured</Badge>}
                      {post.isLocked && (
                        <Badge variant="destructive" className="flex items-center space-x-1">
                          <Icon icon="lucide:lock" className="h-3 w-3" />
                          <span>Locked</span>
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-2xl">{post.title}</CardTitle>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={post.author.image || ""} alt={post.author.name || "User"} />
                          <AvatarFallback className="text-xs">
                            {getInitials(post.author.name)}
                          </AvatarFallback>
                        </Avatar>
                        <button
                          onClick={() => {
                            if (post.author.username) {
                              router.push(`/profile/${post.author.username}`);
                            }
                          }}
                          className="hover:underline"
                        >
                          {post.author.name || post.author.username || "Anonymous"}
                        </button>
                      </div>
                      <span>•</span>
                      <span>{formatTimeAgo(post.createdAt)}</span>
                      <span>•</span>
                      <div className="flex items-center space-x-1">
                        <Icon icon="lucide:eye" className="h-4 w-4" />
                        <span>{post.views} views</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <BookmarkButton postId={post.postId.toString()} />
                    {session?.user && currentUser?.userId !== post.author.userId && (
                      <FollowIgnoreButtons targetUserId={post.author.userId.toString()} />
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose dark:prose-invert max-w-none mb-6">
                  {post.content}
                </div>

                {/* Post Actions */}
                <div className="flex items-center justify-between border-t pt-4">
                  <div className="flex items-center space-x-4">
                    <ReactionButton
                      postId={post.postId.toString()}
                    />
                    <div className="flex items-center space-x-1 text-muted-foreground">
                      <Icon icon="lucide:message-square" className="h-4 w-4" />
                      <span>{post.replies} replies</span>
                    </div>
                  </div>
                  <RatingDisplay postId={post.postId.toString()} />
                </div>
              </CardContent>
            </Card>

            {/* Comments Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Icon icon="lucide:message-square" className="h-5 w-5" />
                  <span>Comments ({comments.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Add Comment Form */}
                {session?.user && !post.isLocked ? (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={currentUser?.image || ""} alt={currentUser?.name || "User"} />
                        <AvatarFallback className="text-xs">
                          {getInitials(currentUser?.name || null)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <BBCodeEditor
                          value={newComment}
                          onChange={setNewComment}
                          placeholder="Write a comment..."
                          maxLength={2000}
                          className="min-h-[100px]"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button
                        onClick={handleSubmitComment}
                        disabled={commenting || !newComment.trim()}
                      >
                        {commenting ? (
                          <>
                            <Icon icon="lucide:loader-2" className="mr-2 h-4 w-4 animate-spin" />
                            Posting...
                          </>
                        ) : (
                          <>
                            <Icon icon="lucide:send" className="mr-2 h-4 w-4" />
                            Post Comment
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ) : post.isLocked ? (
                  <Alert>
                    <Icon icon="lucide:lock" className="h-4 w-4" />
                    <AlertDescription>
                      This post is locked. New comments cannot be added.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert>
                    <Icon icon="lucide:user" className="h-4 w-4" />
                    <AlertDescription>
                      Please sign in to comment on this post.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Comments List */}
                {comments.length > 0 ? (
                  <div className="space-y-6">
                    <Separator />
                    {comments.filter(comment => !comment.parentCommentId).map(comment => renderComment(comment))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Icon icon="lucide:message-square" className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p>No comments yet. Be the first to comment!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </>
  );
}