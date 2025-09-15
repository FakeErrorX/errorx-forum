"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Icon } from '@iconify/react';
import { ModeToggle } from "@/components/mode-toggle";

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
  const { theme, resolvedTheme } = useTheme();
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

  const handleLogout = async () => {
    try {
      await signOut({ callbackUrl: "/signin" });
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-background border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <button 
                  onClick={() => router.push("/")}
                  className="hover:opacity-80 transition-opacity"
                >
                  <Image 
                    src={resolvedTheme === 'dark' ? '/logo-light.png' : '/logo-dark.png'} 
                    alt="ErrorX Logo" 
                    width={100}
                    height={32}
                    className="h-8 w-auto"
                  />
                </button>
              </div>
              <Button variant="ghost" onClick={() => router.push("/members")}>
                <Icon icon="lucide:users" className="h-4 w-4 mr-2" />
                Members
              </Button>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative">
                <Icon icon="lucide:search" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search posts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
                {isSearching && (
                  <Icon icon="lucide:loader-2" className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin" />
                )}
              </div>

              {/* User Menu */}
              {session?.user ? (
                <div className="flex items-center space-x-4">
                  <ModeToggle />
                    <Button variant="ghost" size="sm">
                      <Icon icon="lucide:bell" className="h-4 w-4" />
                    </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={currentUser?.image || session.user.image || ""} alt={currentUser?.name || session.user.name || "User"} />
                          <AvatarFallback>{(currentUser?.name || session.user.name || "U").charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">{currentUser?.name || session.user.name}</p>
                          <p className="text-xs leading-none text-muted-foreground">
                            {currentUser?.username ? `@${currentUser.username}` : session.user.email}
                          </p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => router.push("/profile")}>
                          <Icon icon="lucide:user" className="mr-2 h-4 w-4" />
                          <span>Profile</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push("/settings")}>
                          <Icon icon="lucide:settings" className="mr-2 h-4 w-4" />
                          <span>Settings</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout}>
                          <Icon icon="lucide:log-out" className="mr-2 h-4 w-4" />
                          <span>Log out</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <ModeToggle />
                  <Button variant="ghost" onClick={() => router.push("/signin")}>
                    Sign In
                  </Button>
                  <Button onClick={() => router.push("/signup")}>
                    Sign Up
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Sidebar - Categories */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Icon icon="lucide:message-square" className="h-5 w-5" />
                  <span>Categories</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {categories.length > 0 ? (
                  categories.map((category) => (
                    <div key={category.categoryId} className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                      <div className="flex items-start space-x-3">
                        <div className="text-muted-foreground mt-0.5">
                          <Icon icon={category.icon || "lucide:folder"} className="h-5 w-5" style={{ color: category.color || "#666" }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-foreground">{category.name}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{category.description || "No description"}</p>
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
                  <div className="text-center py-8 text-muted-foreground">
                    <Icon icon="lucide:folder-open" className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p>No categories found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Content - Posts */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground">
                {isSearching ? `Search Results (${searchResults.length})` : 'Recent Posts'}
              </h2>
              {session?.user && !isSearching && (
                <Button>
                  <Icon icon="lucide:plus" className="mr-2 h-4 w-4" />
                  New Post
                </Button>
              )}
            </div>

            <Tabs defaultValue="recent" className="w-full">
              <TabsList>
                <TabsTrigger value="recent">Recent</TabsTrigger>
                <TabsTrigger value="trending">Trending</TabsTrigger>
                <TabsTrigger value="pinned">Pinned</TabsTrigger>
              </TabsList>

              <TabsContent value="recent" className="space-y-4">
                {(isSearching ? searchResults : posts).length > 0 ? (
                  (isSearching ? searchResults : posts).map((post) => {
                    const category = getCategoryById(post.categoryId);
                    return (
                      <Card key={post.postId} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-start space-x-4">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src="" alt={post.authorUsername} />
                              <AvatarFallback>{post.authorUsername.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-2">
                                {post.isPinned && (
                                  <Badge variant="secondary" className="text-xs">
                                    <Icon icon="lucide:star" className="h-3 w-3 mr-1" />
                                    Pinned
                                  </Badge>
                                )}
                                {category && (
                                  <Badge variant="outline" className="text-xs">
                                    {category.name}
                                  </Badge>
                                )}
                              </div>
                              <h3 className="font-medium text-foreground hover:text-primary cursor-pointer">
                                {post.title}
                              </h3>
                                <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                                  <span>by <button 
                                    onClick={() => router.push(`/${post.authorUsername}`)}
                                    className="text-primary hover:underline"
                                  >
                                    {post.authorUsername}
                                  </button></span>
                                <span className="flex items-center">
                                  <Icon icon="lucide:clock" className="h-3 w-3 mr-1" />
                                  {formatTimeAgo(post.createdAt)}
                                </span>
                                <span>{post.replies} replies</span>
                                <span>{post.views} views</span>
                                <span>{post.likes} likes</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Icon icon="lucide:message-square" className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p>{isSearching ? 'No posts found matching your search' : 'No posts found'}</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="trending" className="space-y-4">
                <div className="text-center py-8 text-gray-500">
                  <Icon icon="lucide:trending-up" className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Trending posts will appear here</p>
                </div>
              </TabsContent>

              <TabsContent value="pinned" className="space-y-4">
                {posts.filter(post => post.isPinned).length > 0 ? (
                  posts.filter(post => post.isPinned).map((post) => {
                    const category = getCategoryById(post.categoryId);
                    return (
                      <Card key={post.postId} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-start space-x-4">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src="" alt={post.authorUsername} />
                              <AvatarFallback>{post.authorUsername.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-2">
                                <Badge variant="secondary" className="text-xs">
                                  <Icon icon="lucide:star" className="h-3 w-3 mr-1" />
                                  Pinned
                                </Badge>
                                {category && (
                                  <Badge variant="outline" className="text-xs">
                                    {category.name}
                                  </Badge>
                                )}
                              </div>
                              <h3 className="font-medium text-foreground hover:text-primary cursor-pointer">
                                {post.title}
                              </h3>
                                <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                                  <span>by <button 
                                    onClick={() => router.push(`/${post.authorUsername}`)}
                                    className="text-primary hover:underline"
                                  >
                                    {post.authorUsername}
                                  </button></span>
                                <span className="flex items-center">
                                  <Icon icon="lucide:clock" className="h-3 w-3 mr-1" />
                                  {formatTimeAgo(post.createdAt)}
                                </span>
                                <span>{post.replies} replies</span>
                                <span>{post.views} views</span>
                                <span>{post.likes} likes</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Icon icon="lucide:star" className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p>No pinned posts found</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}
