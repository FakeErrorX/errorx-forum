"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Icon } from '@iconify/react';
import Header from "@/components/layout/header";
import { PageSEO } from "@/components/seo/page-seo";
import { OrganizationSchema, WebsiteSchema } from "@/components/seo/structured-data";
import { PostCard } from "@/components/ui/post-card";

interface User {
  name: string;
  email: string;
  userId: number; // Custom sequential user ID
  image?: string | null;
  username?: string | null;
}

interface ForumCategory {
  categoryId: number; // Custom sequential category ID
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  postCount: number;
  isActive: boolean;
  createdAt: string; // API returns dates as strings
  updatedAt: string;
}

interface ForumPost {
  postId: number; // Custom sequential post ID
  title: string;
  content: string;
  categoryId: number; // Custom sequential category ID
  authorId: number; // Custom sequential user ID
  authorUsername: string;
  isPinned: boolean;
  isFeatured?: boolean;
  isLocked: boolean;
  views: number;
  likes: number;
  replies: number;
  createdAt: string; // API returns dates as strings
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

export default function HomePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [searchResults, setSearchResults] = useState<ForumPost[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

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

  // Load data from API
  const loadData = async () => {
    try {
      const [categoriesResponse, postsResponse] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/posts?limit=25&offset=0')
      ]);
      
      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json();
        setCategories(categoriesData || []);
      }
      
      if (postsResponse.ok) {
        const postsData = await postsResponse.json();
        setPosts(postsData || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/posts?search=${encodeURIComponent(query)}`);
      const results = await response.json();
      setSearchResults(results || []);
    } catch (error) {
      console.error('Error searching posts:', error);
      setSearchResults([]);
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

  const getCategoryById = (categoryId: number) => {
    return categories.find(cat => cat.categoryId === categoryId);
  };

  useEffect(() => {
    if (status === "loading") return;
    
    const initializeData = async () => {
      await loadData();
      await loadCurrentUser();
      setLoading(false);
    };
    
    initializeData();
  }, [status]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);


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
        title="ErrorX Forum - Developer Community"
        description="Join our community of developers and tech enthusiasts. Share methods, resources, tips, tricks, earning methods, cracking, modding, and more."
        path="/"
      />
      <OrganizationSchema />
      <WebsiteSchema />
      <div className="min-h-screen bg-background">
        <Header 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          isSearching={isSearching}
        currentUser={currentUser}
        searchPlaceholder="Search posts..."
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {/* Left Sidebar - Categories */}
          <div className="xl:col-span-1 order-2 xl:order-1">
            <Card className="sticky top-4">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <Icon icon="lucide:message-square" className="h-5 w-5" />
                  <span>Categories</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {categories.length > 0 ? (
                  categories.map((category) => (
                    <div key={category.categoryId} className="p-3 sm:p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                      <div className="flex items-start space-x-3">
                        <div className="text-muted-foreground mt-0.5 flex-shrink-0">
                          <Icon icon={category.icon || "lucide:folder"} className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: category.color || "#666" }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-foreground text-sm sm:text-base truncate">{category.name}</h3>
                          <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">{category.description || "No description"}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-muted-foreground">{category.postCount} posts</span>
                            <div className="text-xs text-muted-foreground">
                              {category.isActive ? 'Active' : 'Inactive'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 sm:py-8 text-muted-foreground">
                    <Icon icon="lucide:folder-open" className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 text-muted-foreground/50" />
                    <p className="text-sm sm:text-base">No categories found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Content - Posts */}
          <div className="xl:col-span-3 order-1 xl:order-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-4">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                {isSearching ? `Search Results (${searchResults.length})` : 'Recent Posts'}
              </h2>
              {session?.user && !isSearching && (
                <Button 
                  className="w-full sm:w-auto"
                  onClick={() => router.push("/create-post")}
                >
                  <Icon icon="lucide:plus" className="mr-2 h-4 w-4" />
                  New Post
                </Button>
              )}
            </div>

            <Tabs defaultValue="recent" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="recent" className="text-xs sm:text-sm">Recent</TabsTrigger>
                <TabsTrigger value="featured" className="text-xs sm:text-sm">Featured</TabsTrigger>
                <TabsTrigger value="trending" className="text-xs sm:text-sm">Trending</TabsTrigger>
                <TabsTrigger value="pinned" className="text-xs sm:text-sm">Pinned</TabsTrigger>
              </TabsList>
              <TabsContent value="featured" className="space-y-3 sm:space-y-4">
                {posts.filter(post => post.isFeatured).length > 0 ? (
                  posts.filter(post => post.isFeatured).map((post) => {
                    const category = getCategoryById(post.categoryId);
                    return (
                      <PostCard
                        key={post.postId}
                        post={post}
                        category={category || null}
                        onAuthorClick={(username) => router.push(`/${username}`)}
                        onPostClick={() => router.push(`/posts/${post.postId}`)}
                        formatTimeAgo={formatTimeAgo}
                      />
                    );
                  })
                ) : (
                  <div className="text-center py-6 sm:py-8 text-muted-foreground">
                    <Icon icon="lucide:flame" className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 text-muted-foreground/50" />
                    <p className="text-sm sm:text-base">No featured posts yet</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="recent" className="space-y-3 sm:space-y-4">
                {(isSearching ? searchResults : posts).length > 0 ? (
                  (isSearching ? searchResults : posts).map((post) => {
                    const category = getCategoryById(post.categoryId);
                    return (
                      <PostCard
                        key={post.postId}
                        post={post}
                        category={category || null}
                        onAuthorClick={(username) => router.push(`/${username}`)}
                        onPostClick={() => router.push(`/posts/${post.postId}`)}
                        formatTimeAgo={formatTimeAgo}
                      />
                    );
                  })
                ) : (
                  <div className="text-center py-6 sm:py-8 text-muted-foreground">
                    <Icon icon="lucide:message-square" className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 text-muted-foreground/50" />
                    <p className="text-sm sm:text-base">{isSearching ? 'No posts found matching your search' : 'No posts found'}</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="trending" className="space-y-3 sm:space-y-4">
                <div className="text-center py-6 sm:py-8 text-muted-foreground">
                  <Icon icon="lucide:trending-up" className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 text-muted-foreground/50" />
                  <p className="text-sm sm:text-base">Trending posts will appear here</p>
                </div>
              </TabsContent>

              <TabsContent value="pinned" className="space-y-3 sm:space-y-4">
                {posts.filter(post => post.isPinned).length > 0 ? (
                  posts.filter(post => post.isPinned).map((post) => {
                    const category = getCategoryById(post.categoryId);
                    return (
                      <PostCard
                        key={post.postId}
                        post={post}
                        category={category || null}
                        onAuthorClick={(username) => router.push(`/${username}`)}
                        onPostClick={() => router.push(`/posts/${post.postId}`)}
                        formatTimeAgo={formatTimeAgo}
                      />
                    );
                  })
                ) : (
                  <div className="text-center py-6 sm:py-8 text-muted-foreground">
                    <Icon icon="lucide:star" className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 text-muted-foreground/50" />
                    <p className="text-sm sm:text-base">No pinned posts found</p>
                  </div>
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
