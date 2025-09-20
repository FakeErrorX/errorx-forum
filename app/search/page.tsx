"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

interface SearchResult {
  type: 'post' | 'user' | 'category';
  id: number;
  title: string;
  content?: string;
  excerpt?: string;
  author?: {
    userId: number;
    name: string | null;
    username: string | null;
    image: string | null;
  };
  category?: {
    categoryId: number;
    name: string;
    description: string | null;
    icon: string | null;
    color: string | null;
  };
  createdAt: string;
  score: number;
  highlights?: string[];
}

interface SearchFilters {
  category?: string;
  author?: string;
  dateRange?: string;
  sortBy?: string;
}

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [resultType, setResultType] = useState<'all' | 'posts' | 'users' | 'categories'>('all');
  const [totalResults, setTotalResults] = useState(0);

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

  // Load categories for filters
  const loadCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      if (response.ok) {
        const categoriesData = await response.json();
        setCategories(categoriesData || []);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  // Perform search
  const performSearch = async (query: string, type: string = 'all', searchFilters: SearchFilters = {}) => {
    if (!query.trim()) {
      setResults([]);
      setTotalResults(0);
      return;
    }

    setLoading(true);
    setIsSearching(true);
    
    try {
      const params = new URLSearchParams({
        q: query.trim(),
        type,
        ...Object.fromEntries(
          Object.entries(searchFilters).filter(([_, value]) => value && value !== '')
        )
      });

      const response = await fetch(`/api/search?${params}`);
      if (response.ok) {
        const data = await response.json();
        setResults(data.results || []);
        setTotalResults(data.total || 0);
      }
    } catch (error) {
      console.error('Error performing search:', error);
      setResults([]);
      setTotalResults(0);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  };

  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Update URL
      const params = new URLSearchParams({ q: searchQuery.trim() });
      router.push(`/search?${params}`);
      
      // Perform search
      performSearch(searchQuery, resultType, filters);
    }
  };

  // Filter results by type
  const getFilteredResults = () => {
    switch (resultType) {
      case 'posts':
        return results.filter(r => r.type === 'post');
      case 'users':
        return results.filter(r => r.type === 'user');
      case 'categories':
        return results.filter(r => r.type === 'category');
      default:
        return results;
    }
  };

  // Get result counts by type
  const getResultCounts = () => {
    return {
      all: results.length,
      posts: results.filter(r => r.type === 'post').length,
      users: results.filter(r => r.type === 'user').length,
      categories: results.filter(r => r.type === 'category').length,
    };
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

  // Render search result
  const renderSearchResult = (result: SearchResult) => {
    switch (result.type) {
      case 'post':
        return (
          <Card key={`post-${result.id}`} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6" onClick={() => router.push(`/posts/${result.id}`)}>
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <h3 className="font-semibold text-lg line-clamp-2">{result.title}</h3>
                    <p className="text-muted-foreground text-sm line-clamp-2">
                      {result.excerpt || result.content}
                    </p>
                  </div>
                  <Badge variant="outline" className="ml-4">Post</Badge>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center space-x-2">
                    {result.author && (
                      <>
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={result.author.image || ""} />
                          <AvatarFallback className="text-xs">
                            {(result.author.name || result.author.username || "U").charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span>{result.author.name || result.author.username}</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center space-x-4">
                    {result.category && (
                      <Badge variant="secondary" className="text-xs">
                        {result.category.name}
                      </Badge>
                    )}
                    <span>{formatTimeAgo(result.createdAt)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 'user':
        return (
          <Card key={`user-${result.id}`} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6" onClick={() => router.push(`/profile/${result.title}`)}>
              <div className="flex items-center space-x-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={result.author?.image || ""} />
                  <AvatarFallback className="text-lg">
                    {result.title.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold">{result.title}</h3>
                  <p className="text-muted-foreground text-sm">
                    {result.excerpt || "Forum member"}
                  </p>
                </div>
                <Badge variant="outline">User</Badge>
              </div>
            </CardContent>
          </Card>
        );

      case 'category':
        return (
          <Card key={`category-${result.id}`} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6" onClick={() => router.push(`/categories/${result.id}`)}>
              <div className="flex items-center space-x-4">
                <div 
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: `${result.category?.color}20` }}
                >
                  <Icon 
                    icon={result.category?.icon || "lucide:folder"} 
                    className="h-6 w-6" 
                    style={{ color: result.category?.color || "#666" }}
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{result.title}</h3>
                  <p className="text-muted-foreground text-sm">
                    {result.excerpt || result.content}
                  </p>
                </div>
                <Badge variant="outline">Category</Badge>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  useEffect(() => {
    if (status === "loading") return;
    
    const initializeData = async () => {
      await loadCategories();
      await loadCurrentUser();
      
      // Perform initial search if query exists
      if (searchQuery) {
        performSearch(searchQuery);
      }
    };
    
    initializeData();
  }, [status]);

  // Update search when filters change
  useEffect(() => {
    if (searchQuery) {
      performSearch(searchQuery, resultType, filters);
    }
  }, [resultType, filters]);

  const filteredResults = getFilteredResults();
  const resultCounts = getResultCounts();

  return (
    <>
      <PageSEO
        title={searchQuery ? `Search: ${searchQuery} - ErrorX Forum` : "Search - ErrorX Forum"}
        description="Search posts, users, and categories on ErrorX Forum"
        path="/search"
      />
      <div className="min-h-screen bg-background">
        <Header 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          isSearching={isSearching}
          currentUser={currentUser}
          searchPlaceholder="Search posts, users, categories..."
        />

        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            {/* Page Header with Search */}
            <div className="space-y-4">
              <h1 className="text-3xl font-bold text-foreground">Search</h1>
              
              <form onSubmit={handleSearch} className="flex space-x-4">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search posts, users, categories..."
                  className="flex-1"
                />
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <Icon icon="lucide:loader-2" className="h-4 w-4 animate-spin" />
                  ) : (
                    <Icon icon="lucide:search" className="h-4 w-4" />
                  )}
                </Button>
              </form>
            </div>

            {/* Search Filters */}
            {searchQuery && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Search Filters</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Select 
                      value={filters.category || ''} 
                      onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All categories</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category.categoryId} value={category.categoryId.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select 
                      value={filters.dateRange || ''} 
                      onValueChange={(value) => setFilters(prev => ({ ...prev, dateRange: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Any time" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Any time</SelectItem>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="week">This week</SelectItem>
                        <SelectItem value="month">This month</SelectItem>
                        <SelectItem value="year">This year</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select 
                      value={filters.sortBy || 'relevance'} 
                      onValueChange={(value) => setFilters(prev => ({ ...prev, sortBy: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="relevance">Relevance</SelectItem>
                        <SelectItem value="date">Date</SelectItem>
                        <SelectItem value="popularity">Popularity</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button 
                      variant="outline" 
                      onClick={() => setFilters({})}
                      className="w-full"
                    >
                      Clear Filters
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Search Results */}
            {searchQuery && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-muted-foreground">
                    {loading ? 'Searching...' : `${totalResults} results for "${searchQuery}"`}
                  </p>
                </div>

                <Tabs value={resultType} onValueChange={(value) => setResultType(value as any)}>
                  <TabsList>
                    <TabsTrigger value="all">All ({resultCounts.all})</TabsTrigger>
                    <TabsTrigger value="posts">Posts ({resultCounts.posts})</TabsTrigger>
                    <TabsTrigger value="users">Users ({resultCounts.users})</TabsTrigger>
                    <TabsTrigger value="categories">Categories ({resultCounts.categories})</TabsTrigger>
                  </TabsList>

                  <TabsContent value="all" className="space-y-4 mt-6">
                    {loading ? (
                      <div className="space-y-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <Card key={i}>
                            <CardContent className="p-6">
                              <div className="animate-pulse space-y-4">
                                <div className="h-4 bg-muted rounded w-3/4"></div>
                                <div className="h-3 bg-muted rounded w-1/2"></div>
                                <div className="h-3 bg-muted rounded w-1/4"></div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : filteredResults.length > 0 ? (
                      <div className="space-y-4">
                        {filteredResults.map(renderSearchResult)}
                      </div>
                    ) : (
                      <Card>
                        <CardContent className="p-12 text-center">
                          <Icon icon="lucide:search-x" className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                          <h3 className="text-lg font-semibold mb-2">No results found</h3>
                          <p className="text-muted-foreground">
                            Try different keywords or adjust your filters
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>

                  <TabsContent value="posts" className="space-y-4 mt-6">
                    {loading ? (
                      <div className="text-center py-8">
                        <Icon icon="lucide:loader-2" className="h-8 w-8 animate-spin mx-auto" />
                      </div>
                    ) : filteredResults.length > 0 ? (
                      <div className="space-y-4">
                        {filteredResults.map(renderSearchResult)}
                      </div>
                    ) : (
                      <Card>
                        <CardContent className="p-12 text-center">
                          <Icon icon="lucide:file-text" className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                          <h3 className="text-lg font-semibold mb-2">No posts found</h3>
                          <p className="text-muted-foreground">No posts match your search criteria</p>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>

                  <TabsContent value="users" className="space-y-4 mt-6">
                    {loading ? (
                      <div className="text-center py-8">
                        <Icon icon="lucide:loader-2" className="h-8 w-8 animate-spin mx-auto" />
                      </div>
                    ) : filteredResults.length > 0 ? (
                      <div className="space-y-4">
                        {filteredResults.map(renderSearchResult)}
                      </div>
                    ) : (
                      <Card>
                        <CardContent className="p-12 text-center">
                          <Icon icon="lucide:users" className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                          <h3 className="text-lg font-semibold mb-2">No users found</h3>
                          <p className="text-muted-foreground">No users match your search criteria</p>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>

                  <TabsContent value="categories" className="space-y-4 mt-6">
                    {loading ? (
                      <div className="text-center py-8">
                        <Icon icon="lucide:loader-2" className="h-8 w-8 animate-spin mx-auto" />
                      </div>
                    ) : filteredResults.length > 0 ? (
                      <div className="space-y-4">
                        {filteredResults.map(renderSearchResult)}
                      </div>
                    ) : (
                      <Card>
                        <CardContent className="p-12 text-center">
                          <Icon icon="lucide:folder" className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                          <h3 className="text-lg font-semibold mb-2">No categories found</h3>
                          <p className="text-muted-foreground">No categories match your search criteria</p>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            )}

            {/* No search query message */}
            {!searchQuery && (
              <Card>
                <CardContent className="p-12 text-center">
                  <Icon icon="lucide:search" className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Search the forum</h3>
                  <p className="text-muted-foreground">
                    Enter keywords to search for posts, users, and categories
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </>
  );
}