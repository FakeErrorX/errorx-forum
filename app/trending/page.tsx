"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Icon } from '@iconify/react';
import Header from "@/components/layout/header";
import { PageSEO } from "@/components/seo/page-seo";
import { PostCard } from "@/components/ui/post-card";

interface User {
  name: string;
  email: string;
  userId: number;
  image?: string | null;
  username?: string | null;
}

interface TrendingTopic {
  tag: string;
  posts: number;
  engagement: number;
  growth: number;
  category?: {
    categoryId: number;
    name: string;
    color: string | null;
    icon: string | null;
  };
}

interface TrendingPost {
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
  engagementScore: number;
}

export default function TrendingPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([]);
  const [trendingPosts, setTrendingPosts] = useState<TrendingPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('week');

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

  // Load trending data
  const loadTrendingData = async () => {
    try {
      const [topicsResponse, postsResponse] = await Promise.all([
        fetch(`/api/trending/topics?timeRange=${timeRange}`),
        fetch(`/api/trending/posts?timeRange=${timeRange}`)
      ]);
      
      if (topicsResponse.ok) {
        const topicsData = await topicsResponse.json();
        setTrendingTopics(topicsData.topics || []);
      }
      
      if (postsResponse.ok) {
        const postsData = await postsResponse.json();
        setTrendingPosts(postsData.posts || []);
      }
    } catch (error) {
      console.error('Error loading trending data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "loading") return;
    
    const initializeData = async () => {
      await loadTrendingData();
      await loadCurrentUser();
    };
    
    initializeData();
  }, [status, timeRange]);

  const formatTimeAgo = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  const getGrowthColor = (growth: number) => {
    if (growth > 20) return 'text-green-600';
    if (growth > 0) return 'text-green-500';
    if (growth < -20) return 'text-red-600';
    if (growth < 0) return 'text-red-500';
    return 'text-gray-500';
  };

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) return 'lucide:trending-up';
    if (growth < 0) return 'lucide:trending-down';
    return 'lucide:minus';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
      </div>
    );
  }

  return (
    <>
      <PageSEO
        title="Trending - ErrorX Forum"
        description="Discover trending topics and popular discussions on ErrorX Forum"
        path="/trending"
      />
      <div className="min-h-screen bg-background">
        <Header 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          isSearching={isSearching}
          currentUser={currentUser}
          searchPlaceholder="Search trending topics..."
        />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground flex items-center space-x-2">
                  <Icon icon="lucide:trending-up" className="h-8 w-8 text-primary" />
                  <span>Trending</span>
                </h1>
                <p className="text-muted-foreground mt-1">Discover what's popular in the community</p>
              </div>
            </div>

            {/* Time Range Selector */}
            <Tabs value={timeRange} onValueChange={(value) => setTimeRange(value as 'today' | 'week' | 'month')}>
              <TabsList>
                <TabsTrigger value="today">Today</TabsTrigger>
                <TabsTrigger value="week">This Week</TabsTrigger>
                <TabsTrigger value="month">This Month</TabsTrigger>
              </TabsList>

              <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Trending Topics */}
                <div className="lg:col-span-1">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Icon icon="lucide:hash" className="h-5 w-5" />
                        <span>Trending Topics</span>
                      </CardTitle>
                      <CardDescription>
                        Most discussed topics {timeRange === 'today' ? 'today' : `this ${timeRange}`}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {trendingTopics.length > 0 ? (
                        <div className="space-y-4">
                          {trendingTopics.slice(0, 10).map((topic, index) => (
                            <div 
                              key={topic.tag} 
                              className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                              onClick={() => router.push(`/search?q=${encodeURIComponent(topic.tag)}`)}
                            >
                              <div className="flex items-center space-x-3">
                                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-medium">
                                  {index + 1}
                                </div>
                                <div>
                                  <p className="font-medium text-sm">#{topic.tag}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {topic.posts} posts
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Icon 
                                  icon={getGrowthIcon(topic.growth)} 
                                  className={`h-4 w-4 ${getGrowthColor(topic.growth)}`} 
                                />
                                <span className={`text-xs font-medium ${getGrowthColor(topic.growth)}`}>
                                  {Math.abs(topic.growth)}%
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <Icon icon="lucide:hash" className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No trending topics found</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Trending Posts */}
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Icon icon="lucide:flame" className="h-5 w-5" />
                        <span>Trending Posts</span>
                      </CardTitle>
                      <CardDescription>
                        Most engaging posts {timeRange === 'today' ? 'today' : `this ${timeRange}`}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {trendingPosts.length > 0 ? (
                        <div className="space-y-4">
                          {trendingPosts.map((post) => (
                            <PostCard
                              key={post.postId}
                              post={post}
                              category={post.category}
                              onAuthorClick={(username) => router.push(`/profile/${username}`)}
                              onPostClick={() => router.push(`/posts/${post.postId}`)}
                              formatTimeAgo={formatTimeAgo}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12 text-muted-foreground">
                          <Icon icon="lucide:flame" className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <h3 className="text-lg font-semibold mb-2">No trending posts</h3>
                          <p className="text-sm">No posts are trending right now</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2">
                      <Icon icon="lucide:eye" className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="text-2xl font-bold">
                          {trendingPosts.reduce((sum, post) => sum + post.views, 0).toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">Total Views</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2">
                      <Icon icon="lucide:heart" className="h-5 w-5 text-red-500" />
                      <div>
                        <p className="text-2xl font-bold">
                          {trendingPosts.reduce((sum, post) => sum + post.likes, 0).toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">Total Likes</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2">
                      <Icon icon="lucide:message-square" className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="text-2xl font-bold">
                          {trendingPosts.reduce((sum, post) => sum + post.replies, 0).toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">Total Replies</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2">
                      <Icon icon="lucide:hash" className="h-5 w-5 text-purple-500" />
                      <div>
                        <p className="text-2xl font-bold">{trendingTopics.length}</p>
                        <p className="text-xs text-muted-foreground">Active Topics</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Categories Trending */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Icon icon="lucide:folder" className="h-5 w-5" />
                    <span>Trending by Category</span>
                  </CardTitle>
                  <CardDescription>
                    See what's trending in each category
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from(new Set(trendingPosts.map(post => post.category.categoryId)))
                      .map(categoryId => {
                        const category = trendingPosts.find(post => post.category.categoryId === categoryId)?.category;
                        const categoryPosts = trendingPosts.filter(post => post.category.categoryId === categoryId);
                        
                        if (!category) return null;
                        
                        return (
                          <div 
                            key={categoryId}
                            className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                            onClick={() => router.push(`/categories/${categoryId}`)}
                          >
                            <div className="flex items-center space-x-3 mb-3">
                              <div 
                                className="p-2 rounded-lg"
                                style={{ backgroundColor: `${category.color}20` }}
                              >
                                <Icon 
                                  icon={category.icon || "lucide:folder"} 
                                  className="h-5 w-5" 
                                  style={{ color: category.color || "#666" }}
                                />
                              </div>
                              <div>
                                <h4 className="font-medium">{category.name}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {categoryPosts.length} trending posts
                                </p>
                              </div>
                            </div>
                            <div className="space-y-2">
                              {categoryPosts.slice(0, 3).map(post => (
                                <div key={post.postId} className="text-sm">
                                  <p className="font-medium line-clamp-1">{post.title}</p>
                                  <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                    <span>{post.views} views</span>
                                    <span>{post.likes} likes</span>
                                    <span>{post.replies} replies</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </CardContent>
              </Card>
            </Tabs>
          </div>
        </main>
      </div>
    </>
  );
}