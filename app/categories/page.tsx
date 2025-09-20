"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Icon } from '@iconify/react';
import Header from "@/components/layout/header";
import { PageSEO } from "@/components/seo/page-seo";

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
  lastPost?: {
    postId: number;
    title: string;
    author: {
      username: string | null;
      name: string | null;
    };
    createdAt: string;
  } | null;
}

export default function CategoriesPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
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

  // Load categories data
  const loadCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      if (response.ok) {
        const categoriesData = await response.json();
        setCategories(categoriesData || []);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "loading") return;
    
    const initializeData = async () => {
      await loadCategories();
      await loadCurrentUser();
    };
    
    initializeData();
  }, [status]);

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

  return (
    <>
      <PageSEO
        title="Categories - ErrorX Forum"
        description="Browse forum categories and topics. Find discussions on development, programming, tools, and more."
        path="/categories"
      />
      <div className="min-h-screen bg-background">
        <Header 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          isSearching={isSearching}
          currentUser={currentUser}
          searchPlaceholder="Search categories..."
        />

        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Forum Categories</h1>
                <p className="text-muted-foreground mt-1">Browse discussions by category</p>
              </div>
              <Badge variant="secondary" className="text-lg px-4 py-2">
                {categories.filter(cat => cat.isActive).length} categories
              </Badge>
            </div>

            {/* Categories Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {categories.filter(cat => cat.isActive).length > 0 ? (
                categories.filter(cat => cat.isActive).map((category) => (
                  <Card 
                    key={category.categoryId} 
                    className="hover:shadow-lg transition-all duration-200 cursor-pointer group"
                    onClick={() => router.push(`/categories/${category.categoryId}`)}
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-start space-x-4">
                        <div 
                          className="p-3 rounded-lg flex-shrink-0 group-hover:scale-110 transition-transform"
                          style={{ backgroundColor: `${category.color}20`, border: `2px solid ${category.color}40` }}
                        >
                          <Icon 
                            icon={category.icon || "lucide:folder"} 
                            className="h-6 w-6" 
                            style={{ color: category.color || "#666" }} 
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-xl group-hover:text-primary transition-colors">
                            {category.name}
                          </CardTitle>
                          <CardDescription className="mt-2">
                            {category.description || "No description available"}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Category Stats */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <Icon icon="lucide:message-square" className="h-4 w-4" />
                              <span>{category.postCount} posts</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Icon icon="lucide:calendar" className="h-4 w-4" />
                              <span>Created {formatTimeAgo(category.createdAt)}</span>
                            </div>
                          </div>
                          <Badge 
                            variant="outline"
                            style={{ 
                              borderColor: category.color || "#666", 
                              color: category.color || "#666" 
                            }}
                          >
                            Active
                          </Badge>
                        </div>

                        {/* Last Post */}
                        {category.lastPost ? (
                          <div className="p-3 bg-muted/50 rounded-lg">
                            <p className="text-sm font-medium text-foreground mb-1">Latest Post</p>
                            <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                              {category.lastPost.title}
                            </p>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>
                                by {category.lastPost.author.name || category.lastPost.author.username || "Anonymous"}
                              </span>
                              <span>{formatTimeAgo(category.lastPost.createdAt)}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="p-3 bg-muted/30 rounded-lg text-center">
                            <p className="text-sm text-muted-foreground">No posts yet</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full">
                  <Card>
                    <CardContent className="p-12 text-center">
                      <Icon icon="lucide:folder-open" className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No categories found</h3>
                      <p className="text-muted-foreground">
                        No active categories are available at the moment.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>

            {/* Category Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Icon icon="lucide:bar-chart" className="h-5 w-5" />
                  <span>Category Statistics</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {categories.filter(cat => cat.isActive).length}
                    </div>
                    <p className="text-sm text-muted-foreground">Active Categories</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {categories.reduce((sum, cat) => sum + cat.postCount, 0)}
                    </div>
                    <p className="text-sm text-muted-foreground">Total Posts</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {Math.round(categories.reduce((sum, cat) => sum + cat.postCount, 0) / Math.max(categories.filter(cat => cat.isActive).length, 1))}
                    </div>
                    <p className="text-sm text-muted-foreground">Avg Posts per Category</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </>
  );
}