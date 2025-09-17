"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Icon } from '@iconify/react';
import { toast } from "sonner";
import Header from "@/components/layout/header";
import { useFormValidation } from "@/hooks/use-form-validation";
import { createPostSchema } from "@/lib/validations";

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

export default function CreatePostPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [prefixes, setPrefixes] = useState<{ id: string; name: string; color?: string }[]>([]);
  const [selectedPrefixId, setSelectedPrefixId] = useState<string>("");

  // Form validation
  const {
    values,
    errors,
    isSubmitting,
    handleChange,
    handleSubmit,
    setError,
  } = useFormValidation({
    schema: createPostSchema,
    initialValues: {
      title: "",
      content: "",
      categoryId: "",
      authorId: "",
      authorUsername: "",
      isPinned: false,
      isLocked: false,
      views: 0,
      likes: 0,
      replies: 0,
    },
    onSubmit: async (values) => {
      await handleCreatePost(values);
    },
  });

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

  // Load categories
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

  // Load prefixes (optionally by category)
  const loadPrefixes = async (categoryId?: string) => {
    try {
      const url = categoryId ? `/api/prefixes?categoryId=${encodeURIComponent(categoryId)}` : '/api/prefixes'
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setPrefixes(data.prefixes || [])
      }
    } catch (error) {
      console.error('Error loading prefixes:', error)
    }
  }

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session?.user) {
      router.push("/signin");
      return;
    }

    const initializeData = async () => {
      await loadCategories();
      await loadPrefixes();
      await loadCurrentUser();
      setLoading(false);
    };
    
    initializeData();
  }, [status, session, router]);

  // Draft autosave (title/content/category/prefix)
  useEffect(() => {
    const handle = setTimeout(async () => {
      if (!session?.user) return
      if (!values.title && !values.content) return
      try {
        await fetch('/api/drafts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'post',
            categoryId: values.categoryId || undefined,
            content: JSON.stringify({ title: values.title, content: values.content, prefixId: selectedPrefixId || undefined })
          })
        })
      } catch (e) {
        // ignore autosave errors
      }
    }, 2000)
    return () => clearTimeout(handle)
  }, [values.title, values.content, values.categoryId, selectedPrefixId, session])

  // When category changes, load its prefixes
  useEffect(() => {
    if (values.categoryId) {
      loadPrefixes(values.categoryId)
      setSelectedPrefixId("")
    }
  }, [values.categoryId])

  // Create post function
  const handleCreatePost = async (values: { title: string; content: string; categoryId: string }) => {
    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: values.title.trim(),
          content: values.content.trim(),
          categoryId: values.categoryId,
          prefixId: selectedPrefixId || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create post');
      }

      const newPost = await response.json();
      
      toast.success("Post created successfully!", {
        description: "Your post has been published to the forum."
      });
      
      // Redirect to the post or home page
      router.push("/");
    } catch (error: unknown) {
      console.error('Error creating post:', error);
      setError("title", (error as Error).message || "Failed to create post. Please try again.");
      toast.error("Failed to create post", {
        description: (error as Error).message || "Please try again."
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isSearching={isSearching}
        currentUser={currentUser}
        searchPlaceholder="Search posts..."
      />

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Create New Post</h1>
              <p className="text-muted-foreground mt-1">Share your knowledge with the community</p>
            </div>
            <Button variant="outline" onClick={() => router.back()}>
              <Icon icon="lucide:arrow-left" className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>

          {/* Create Post Form */}
          <Card>
            <CardHeader>
              <CardTitle>Post Details</CardTitle>
              <CardDescription>
                Fill in the details for your new forum post
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {Object.keys(errors).length > 0 && (
                  <Alert variant="destructive">
                    <Icon icon="lucide:alert-circle" className="h-4 w-4" />
                    <AlertDescription>
                      {Object.values(errors).join(", ")}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Category Selection */}
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select value={values.categoryId} onValueChange={(value) => handleChange("categoryId", value)} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category for your post" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.filter(cat => cat.isActive).map((category) => (
                        <SelectItem key={category.categoryId} value={category.categoryId.toString()}>
                          <div className="flex items-center space-x-2">
                            {category.icon && (
                              <Icon 
                                icon={category.icon} 
                                className="h-4 w-4" 
                                style={{ color: category.color || "#666" }} 
                              />
                            )}
                            <span>{category.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {values.categoryId && (
                    <p className="text-sm text-muted-foreground">
                      {categories.find(cat => cat.categoryId.toString() === values.categoryId)?.description || "No description available"}
                    </p>
                  )}
                  {errors.categoryId && (
                    <p className="text-sm text-red-500">{errors.categoryId}</p>
                  )}
                </div>

              {/* Thread Prefix (optional) */}
              <div className="space-y-2">
                <Label htmlFor="prefix">Thread Prefix</Label>
                <Select value={selectedPrefixId} onValueChange={setSelectedPrefixId}>
                  <SelectTrigger>
                    <SelectValue placeholder={prefixes.length ? "Select a prefix (optional)" : "No prefixes available"} />
                  </SelectTrigger>
                  <SelectContent>
                    {prefixes.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        <div className="flex items-center gap-2">
                          <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: p.color || '#999' }} />
                          <span>{p.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

                {/* Post Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">Post Title *</Label>
                  <Input
                    id="title"
                    value={values.title}
                    onChange={(e) => handleChange("title", e.target.value)}
                    placeholder="Enter a descriptive title for your post"
                    className="text-lg"
                    required
                    minLength={5}
                    maxLength={200}
                  />
                  <p className="text-sm text-muted-foreground">
                    {values.title.length}/200 characters
                  </p>
                  {errors.title && (
                    <p className="text-sm text-red-500">{errors.title}</p>
                  )}
                </div>

                {/* Post Content */}
                <div className="space-y-2">
                  <Label htmlFor="content">Post Content *</Label>
                  <Textarea
                    id="content"
                    value={values.content}
                    onChange={(e) => handleChange("content", e.target.value)}
                    placeholder="Write your post content here. Be detailed and helpful to the community."
                    className="min-h-[300px] text-base"
                    required
                    minLength={10}
                    maxLength={10000}
                  />
                  <p className="text-sm text-muted-foreground">
                    {values.content.length}/10,000 characters
                  </p>
                  {errors.content && (
                    <p className="text-sm text-red-500">{errors.content}</p>
                  )}
                </div>

                {/* Form Actions */}
                <div className="flex items-center justify-end space-x-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || !values.title.trim() || !values.content.trim() || !values.categoryId}
                  >
                    {isSubmitting ? (
                      <>
                        <Icon icon="lucide:loader-2" className="mr-2 h-4 w-4 animate-spin" />
                        Creating Post...
                      </>
                    ) : (
                      <>
                        <Icon icon="lucide:plus" className="mr-2 h-4 w-4" />
                        Create Post
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Posting Guidelines */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Icon icon="lucide:info" className="h-5 w-5" />
                <span>Posting Guidelines</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-start space-x-2">
                  <Icon icon="lucide:check-circle" className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Be respectful and constructive in your posts</span>
                </div>
                <div className="flex items-start space-x-2">
                  <Icon icon="lucide:check-circle" className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Use clear, descriptive titles that help others find your post</span>
                </div>
                <div className="flex items-start space-x-2">
                  <Icon icon="lucide:check-circle" className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Provide detailed information and context in your content</span>
                </div>
                <div className="flex items-start space-x-2">
                  <Icon icon="lucide:check-circle" className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Choose the most appropriate category for your post</span>
                </div>
                <div className="flex items-start space-x-2">
                  <Icon icon="lucide:check-circle" className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Search existing posts before creating a new one to avoid duplicates</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
