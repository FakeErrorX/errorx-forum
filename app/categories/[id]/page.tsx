"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
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

interface ForumCategory {
  categoryId: number;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  postCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ForumPost {
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
}

export default function CategoryDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession();
  const [category, setCategory] = useState<ForumCategory | null>(null);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'pinned'>('recent');

  const categoryId = params.id as string;

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

  // Load category data
  const loadCategory = async () => {
    if (!categoryId) return;
    
    try {
      const response = await fetch(`/api/categories/${categoryId}`);
      if (response.ok) {
        const categoryData = await response.json();
        setCategory(categoryData);
      } else {
        router.push('/404');
      }
    } catch (error) {
      console.error('Error loading category:', error);
      router.push('/404');
    }
  };

  // Load posts for this category
  const loadPosts = async () => {
    if (!categoryId) return;
    
    try {
      const response = await fetch(`/api/posts?categoryId=${categoryId}&limit=25&offset=0`);
      if (response.ok) {
        const postsData = await response.json();
        setPosts(postsData || []);
      }
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "loading") return;
    
    const initializeData = async () => {
      await loadCategory();
      await loadPosts();
      await loadCurrentUser();
    };
    
    initializeData();
  }, [status, categoryId]);

  // Sort posts based on selected criteria
  const getSortedPosts = () => {
    const allPosts = [...posts];
    
    switch (sortBy) {
      case 'popular':
        return allPosts.sort((a, b) => (b.likes + b.views) - (a.likes + a.views));
      case 'pinned':
        return allPosts.filter(post => post.isPinned);
      case 'recent':
      default:
        return allPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  };

  const formatTimeAgo = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Icon icon="lucide:folder-x" className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Category not found</h2>
          <p className="text-muted-foreground mb-4">The category you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => router.push("/categories")}>Browse Categories</Button>
        </div>
      </div>
    );
  }

  const sortedPosts = getSortedPosts();

  return (
    <>
      <PageSEO
        title={`${category.name} - ErrorX Forum`}
        description={category.description || `Browse posts in the ${category.name} category`}
        path={`/categories/${category.categoryId}`}
      />
      <div className="min-h-screen bg-background">
        <Header 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          isSearching={isSearching}
          currentUser={currentUser}
          searchPlaceholder={`Search in ${category.name}...`}
        />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            {/* Breadcrumb */}
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <button onClick={() => router.push("/")} className="hover:text-foreground">
                Home
              </button>
              <Icon icon="lucide:chevron-right" className="h-4 w-4" />
              <button onClick={() => router.push("/categories")} className="hover:text-foreground">
                Categories
              </button>
              <Icon icon="lucide:chevron-right" className="h-4 w-4" />
              <span className="text-foreground">{category.name}</span>
            </div>

            {/* Category Header */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div 
                      className="p-4 rounded-xl flex-shrink-0"
                      style={{ backgroundColor: `${category.color}20`, border: `2px solid ${category.color}40` }}
                    >
                      <Icon 
                        icon={category.icon || "lucide:folder"} 
                        className="h-8 w-8" 
                        style={{ color: category.color || "#666" }} 
                      />
                    </div>
                    <div className="space-y-2">
                      <CardTitle className="text-3xl">{category.name}</CardTitle>
                      <CardDescription className="text-lg">
                        {category.description || "No description available"}
                      </CardDescription>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Icon icon="lucide:message-square" className="h-4 w-4" />
                          <span>{category.postCount} posts</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Icon icon="lucide:calendar" className="h-4 w-4" />
                          <span>Created {formatTimeAgo(category.createdAt)}</span>
                        </div>
                        <Badge 
                          variant="outline"
                          style={{ 
                            borderColor: category.color || "#666", 
                            color: category.color || "#666" 
                          }}
                        >
                          {category.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  {session?.user && (
                    <Button onClick={() => router.push("/create-post")}>
                      <Icon icon="lucide:plus" className="mr-2 h-4 w-4" />
                      New Post
                    </Button>
                  )}
                </div>
              </CardHeader>
            </Card>

            {/* Posts Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">
                  Posts ({posts.length})
                </h2>
              </div>

              <Tabs value={sortBy} onValueChange={(value) => setSortBy(value as 'recent' | 'popular' | 'pinned')}>
                <TabsList className="grid w-full grid-cols-3 md:w-[400px]">
                  <TabsTrigger value="recent">Recent</TabsTrigger>
                  <TabsTrigger value="popular">Popular</TabsTrigger>
                  <TabsTrigger value="pinned">Pinned</TabsTrigger>
                </TabsList>

                <TabsContent value="recent" className="space-y-4 mt-6">
                  {sortedPosts.length > 0 ? (
                    sortedPosts.map((post) => (
                      <PostCard
                        key={post.postId}
                        post={post}
                        category={category}
                        onAuthorClick={(username) => router.push(`/profile/${username}`)}
                        onPostClick={() => router.push(`/posts/${post.postId}`)}
                        formatTimeAgo={formatTimeAgo}
                      />
                    ))
                  ) : (
                    <Card>
                      <CardContent className="p-12 text-center">
                        <Icon icon="lucide:message-square" className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No posts found</h3>
                        <p className="text-muted-foreground mb-4">
                          Be the first to start a discussion in this category!
                        </p>
                        {session?.user && (
                          <Button onClick={() => router.push("/create-post")}>
                            <Icon icon="lucide:plus" className="mr-2 h-4 w-4" />
                            Create First Post
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="popular" className="space-y-4 mt-6">
                  {sortedPosts.length > 0 ? (
                    sortedPosts.map((post) => (
                      <PostCard
                        key={post.postId}
                        post={post}
                        category={category}
                        onAuthorClick={(username) => router.push(`/profile/${username}`)}
                        onPostClick={() => router.push(`/posts/${post.postId}`)}
                        formatTimeAgo={formatTimeAgo}
                      />
                    ))
                  ) : (
                    <Card>
                      <CardContent className="p-12 text-center">
                        <Icon icon="lucide:trending-up" className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No popular posts</h3>
                        <p className="text-muted-foreground">Popular posts will appear here</p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="pinned" className="space-y-4 mt-6">
                  {sortedPosts.length > 0 ? (
                    sortedPosts.map((post) => (
                      <PostCard
                        key={post.postId}
                        post={post}
                        category={category}
                        onAuthorClick={(username) => router.push(`/profile/${username}`)}
                        onPostClick={() => router.push(`/posts/${post.postId}`)}
                        formatTimeAgo={formatTimeAgo}
                      />
                    ))
                  ) : (
                    <Card>
                      <CardContent className="p-12 text-center">
                        <Icon icon="lucide:pin" className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No pinned posts</h3>
                        <p className="text-muted-foreground">Pinned posts will appear here</p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}