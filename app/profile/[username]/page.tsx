"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Icon } from '@iconify/react';

interface PublicUser {
  id: string;
  name: string | null;
  username: string | null;
  email: string;
  image: string | null;
  bio: string | null;
  postCount: number;
  reputation: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UserPost {
  id: string;
  title: string;
  content: string;
  categoryId: string;
  authorId: string;
  authorUsername: string;
  isPinned: boolean;
  isLocked: boolean;
  views: number;
  likes: number;
  replies: number;
  createdAt: string;
  updatedAt: string;
}

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [error, setError] = useState("");

  const username = params.username as string;

  // Format date helper
  const formatDate = (date: string | Date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const formatTimeAgo = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
    return `${Math.floor(diffInSeconds / 31536000)}y ago`;
  };

  // Load user data
  useEffect(() => {
    const loadUserData = async () => {
      if (!username) return;

      setLoading(true);
      setError("");

      try {
        const response = await fetch(`/api/users/username/${username}`);
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          await loadUserPosts(userData.id);
          
          // Update URL to shorter format if not already
          if (window.location.pathname.startsWith('/profile/')) {
            window.history.replaceState(null, '', `/${username}`);
          }
        } else if (response.status === 404) {
          setError("User not found");
        } else {
          setError("Failed to load user profile");
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        setError("Failed to load user profile");
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [username]);

  // Load user posts
  const loadUserPosts = async (userId: string) => {
    setPostsLoading(true);
    try {
      const response = await fetch(`/api/posts?authorId=${userId}&limit=50`);
      if (response.ok) {
        const postsData = await response.json();
        setPosts(postsData);
      }
    } catch (error) {
      console.error('Error loading user posts:', error);
    } finally {
      setPostsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center space-x-2">
            <Icon icon="lucide:loader-2" className="h-6 w-6 animate-spin" />
            <span>Loading profile...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <Icon icon="lucide:user-x" className="h-16 w-16 mx-auto text-muted-foreground" />
            <h1 className="text-2xl font-bold">User Not Found</h1>
            <p className="text-muted-foreground">
              The user you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => router.back()}>
              <Icon icon="lucide:arrow-left" className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Public Profile</h1>
            <p className="text-muted-foreground">Viewing @{user.username}'s profile</p>
          </div>
          <Button variant="outline" onClick={() => router.back()}>
            <Icon icon="lucide:arrow-left" className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        {/* Profile Header */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={user.image || ""} alt={user.name || "User"} />
                <AvatarFallback className="text-2xl">
                  {user.name?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-4 mb-2">
                  <h2 className="text-3xl font-bold text-foreground">{user.name || "Anonymous"}</h2>
                  <Badge variant="secondary">@{user.username}</Badge>
                  <Badge variant={user.isActive ? "default" : "secondary"}>
                    {user.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                
                {user.bio && (
                  <p className="text-muted-foreground mb-4 max-w-2xl">{user.bio}</p>
                )}
                
                <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <Icon icon="lucide:calendar" className="h-4 w-4 mr-1" />
                    Joined {formatDate(user.createdAt)}
                  </div>
                  <div className="flex items-center">
                    <Icon icon="lucide:message-square" className="h-4 w-4 mr-1" />
                    {user.postCount} posts
                  </div>
                  <div className="flex items-center">
                    <Icon icon="lucide:star" className="h-4 w-4 mr-1" />
                    {user.reputation} reputation
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Tabs */}
        <Tabs defaultValue="posts" className="space-y-6">
          <TabsList>
            <TabsTrigger value="posts">Posts ({user.postCount})</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
          </TabsList>

          {/* Posts Tab */}
          <TabsContent value="posts" className="space-y-4">
            {postsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center space-x-2">
                  <Icon icon="lucide:loader-2" className="h-5 w-5 animate-spin" />
                  <span>Loading posts...</span>
                </div>
              </div>
            ) : posts.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <Icon icon="lucide:file-text" className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No posts yet</h3>
                    <p className="text-muted-foreground">
                      {user.name || user.username} hasn't created any posts yet.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <Card key={post.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg line-clamp-2 mb-2">
                            {post.title}
                          </CardTitle>
                          <CardDescription className="line-clamp-3">
                            {post.content}
                          </CardDescription>
                        </div>
                        {post.isPinned && (
                          <Badge variant="secondary" className="ml-2">
                            <Icon icon="lucide:pin" className="h-3 w-3 mr-1" />
                            Pinned
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center space-x-4">
                          <span className="flex items-center">
                            <Icon icon="lucide:eye" className="h-3 w-3 mr-1" />
                            {post.views}
                          </span>
                          <span className="flex items-center">
                            <Icon icon="lucide:heart" className="h-3 w-3 mr-1" />
                            {post.likes}
                          </span>
                          <span className="flex items-center">
                            <Icon icon="lucide:message-circle" className="h-3 w-3 mr-1" />
                            {post.replies}
                          </span>
                        </div>
                        <span className="flex items-center">
                          <Icon icon="lucide:clock" className="h-3 w-3 mr-1" />
                          {formatTimeAgo(post.createdAt)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* About Tab */}
          <TabsContent value="about" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>About @{user.username}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{user.postCount}</div>
                    <div className="text-sm text-muted-foreground">Posts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{user.reputation}</div>
                    <div className="text-sm text-muted-foreground">Reputation</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Joined</div>
                  </div>
                  <div className="text-center">
                    <Badge variant={user.isActive ? "default" : "secondary"}>
                      {user.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <div className="text-sm text-muted-foreground mt-1">Status</div>
                  </div>
                </div>
                
                {user.bio && (
                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-2">Bio</h4>
                    <p className="text-muted-foreground">{user.bio}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
