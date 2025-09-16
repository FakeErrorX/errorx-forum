"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Icon } from '@iconify/react';
import { ModeToggle } from "@/components/mode-toggle";
import { toast } from "sonner";
import { extractKeyFromUrl } from "@/lib/s3";

interface User {
  userId: number; // Custom sequential user ID
  name: string | null;
  username: string | null;
  email: string;
  image: string | null;
  bio: string | null;
  postCount: number;
  reputation: number;
  isActive: boolean;
  preferences: {
    theme: 'light' | 'dark' | 'system';
    notifications: boolean;
    emailUpdates: boolean;
  };
  createdAt: string; // API returns dates as strings
  updatedAt: string;
  canChangeUsername?: boolean;
  usernameChangeDaysLeft?: number;
  nextUsernameChangeAt?: string | null;
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
  createdAt: string; // API returns dates as strings
  updatedAt: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { theme, resolvedTheme } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [userPosts, setUserPosts] = useState<UserPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);

  // Helper function to format dates
  const formatDate = (date: string | Date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };
  
  // Form states
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [website, setWebsite] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarDeleting, setAvatarDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [canChangeUsername, setCanChangeUsername] = useState<boolean>(true);
  const [usernameChangeDaysLeft, setUsernameChangeDaysLeft] = useState<number>(0);
  const [nextUsernameChangeAt, setNextUsernameChangeAt] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<string>("");

  // Load user posts
  const loadUserPosts = async (userId: string) => {
    setPostsLoading(true);
    try {
      const response = await fetch('/api/posts?limit=50&offset=0');
      if (response.ok) {
        const postsData = await response.json();
        const userPostsData = postsData.filter((post: { authorId: string }) => post.authorId === userId);
        setUserPosts(userPostsData);
      }
    } catch (error) {
      console.error('Error loading user posts:', error);
      setUserPosts([]);
    } finally {
      setPostsLoading(false);
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

  useEffect(() => {
    const loadUserData = async () => {
      if (status === "loading") return;
      
      if (!session?.user) {
        router.push("/signin");
        return;
      }

      try {
        const response = await fetch('/api/users');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          setName(userData.name || "");
          setUsername(userData.username || "");
          setBio(userData.bio || "");
          setAvatarUrl(userData.image || "");
          setLocation(""); // Not stored in current schema
          setWebsite(""); // Not stored in current schema
          setCanChangeUsername(userData.canChangeUsername !== false);
          setUsernameChangeDaysLeft(userData.usernameChangeDaysLeft || 0);
          setNextUsernameChangeAt(userData.nextUsernameChangeAt || null);
          
          // Load user posts
          await loadUserPosts(userData.id);
        } else {
          router.push("/signin");
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        router.push("/signin");
      } finally {
        setLoading(false);
      }
    };
    loadUserData();
  }, [session, status, router]);

  // Live countdown for username change
  useEffect(() => {
    if (!nextUsernameChangeAt) {
      setCountdown("");
      return;
    }
    const target = new Date(nextUsernameChangeAt).getTime();
    const tick = () => {
      const now = Date.now();
      const diff = Math.max(0, target - now);
      const totalSeconds = Math.floor(diff / 1000);
      const days = Math.floor(totalSeconds / (24 * 3600));
      const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      const parts: string[] = [];
      if (days > 0) parts.push(`${days}d`);
      parts.push(`${hours}h`, `${minutes}m`, `${seconds}s`);
      setCountdown(parts.join(" "));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [nextUsernameChangeAt]);

  const handleSaveProfile = async () => {
    if (!user) return;
    
    setSaveLoading(true);
    setError("");

    try {
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          username,
          bio,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || "Failed to update profile. Please try again.");
        return;
      }

      const updatedUser = await response.json();
      
      // Update local user state
      setUser(updatedUser);
      
      setIsEditing(false);
    } catch (error: unknown) {
      setError((error as Error).message || "Failed to update profile. Please try again.");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut({ callbackUrl: "/signin" });
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleAvatarUpload = async (file: {
    key: string;
    url: string;
    name: string;
    size: number;
    type: string;
  }) => {
    if (!user) return;
    
    setAvatarUploading(true);
    try {
      // Delete old avatar if it exists and is from S3
      if (user.image) {
        const oldKey = extractKeyFromUrl(user.image);
        if (oldKey) {
          try {
            // Delete old avatar from S3
            const deleteResponse = await fetch('/api/files', {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ key: oldKey }),
            });
            
            if (!deleteResponse.ok) {
              console.warn('Failed to delete old avatar, but continuing with upload');
            }
          } catch (deleteError) {
            console.warn('Error deleting old avatar:', deleteError);
            // Continue with upload even if deletion fails
          }
        }
      }

      // Update user profile with new avatar
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: file.url,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to update avatar");
        return;
      }

      const updatedUser = await response.json();
      setUser(updatedUser);
      setAvatarUrl(file.url);
      toast.success("Avatar updated successfully!");
    } catch (error: unknown) {
      console.error('Avatar upload error:', error);
      toast.error("Failed to update avatar. Please try again.");
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleAvatarDelete = () => {
    setShowDeleteDialog(true);
  };

  const confirmAvatarDelete = async () => {
    if (!user) return;
    
    setAvatarDeleting(true);
    setShowDeleteDialog(false);
    try {
      // Delete current avatar from S3 if it exists
      if (user.image) {
        const oldKey = extractKeyFromUrl(user.image);
        if (oldKey) {
          try {
            const deleteResponse = await fetch('/api/files', {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ key: oldKey }),
            });
            
            if (!deleteResponse.ok) {
              console.warn('Failed to delete avatar from S3, but continuing with profile update');
            }
          } catch (deleteError) {
            console.warn('Error deleting avatar from S3:', deleteError);
            // Continue with profile update even if S3 deletion fails
          }
        }
      }

      // Update user profile to remove avatar
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to remove avatar");
        return;
      }

      const updatedUser = await response.json();
      setUser(updatedUser);
      setAvatarUrl("");
      toast.success("Avatar removed successfully!");
    } catch (error: unknown) {
      console.error('Avatar deletion error:', error);
      toast.error("Failed to remove avatar. Please try again.");
    } finally {
      setAvatarDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Icon icon="lucide:loader-2" className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>Please sign in to view your profile</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/signin")} className="w-full">
              Sign In
            </Button>
          </CardContent>
        </Card>
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
            </div>
            
            <div className="flex items-center space-x-4">
              <ModeToggle />
              <Button variant="outline" onClick={handleLogout}>
                <Icon icon="lucide:log-out" className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Profile Header */}
          <Card>
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
                {!isEditing ? (
                  <>
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-20 w-20">
                        <AvatarImage src={user.image || undefined} alt={user.name || "User"} />
                        <AvatarFallback className="text-2xl">
                          {user.name?.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h1 className="text-3xl font-bold text-foreground">{user.name}</h1>
                        <p className="text-lg text-muted-foreground">@{user.username || "username"}</p>
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-4 mb-2">
                        <Badge variant="secondary">Member</Badge>
                        <Badge variant="secondary" className="text-xs font-mono">
                          User ID: {user.userId}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        {user.bio && (
                          <p className="text-muted-foreground">{user.bio}</p>
                        )}
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
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
                  </>
                ) : (
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-4 mb-2">
                      <h1 className="text-3xl font-bold text-foreground">Edit Profile</h1>
                      <Badge variant="secondary">Member</Badge>
                    </div>
                    <div className="space-y-4">
                      {error && (
                        <Alert variant="destructive">
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      )}
                      
                      {/* Avatar Upload */}
                      <div className="space-y-2">
                        <Label>Avatar</Label>
                        <div className="flex items-center space-x-4">
                          <div className="relative group">
                            <Avatar className="h-16 w-16">
                              <AvatarImage src={avatarUrl || user?.image || undefined} alt={user?.name || "User"} />
                              <AvatarFallback className="text-lg">
                                {user?.name?.charAt(0).toUpperCase() || "U"}
                              </AvatarFallback>
                            </Avatar>
                            
                            {/* Upload Overlay - Only show when no avatar exists */}
                            {!(user?.image || avatarUrl) && (
                              <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      // Create a temporary file object for upload
                                      const tempFile = {
                                        key: '',
                                        url: '',
                                        name: file.name,
                                        size: file.size,
                                        type: file.type
                                      };
                                      
                                      // Upload the file
                                      const formData = new FormData();
                                      formData.append('file', file);
                                      formData.append('folder', 'avatars');
                                      formData.append('allowedTypes', 'images');
                                      
                                      fetch('/api/upload', {
                                        method: 'POST',
                                        body: formData,
                                      })
                                      .then(response => response.json())
                                      .then(data => {
                                        if (data.success) {
                                          handleAvatarUpload(data.file);
                                        } else {
                                          toast.error(data.error || 'Upload failed');
                                        }
                                      })
                                      .catch(error => {
                                        console.error('Upload error:', error);
                                        toast.error('Upload failed');
                                      });
                                    }
                                  }}
                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                  disabled={avatarUploading || avatarDeleting}
                                />
                                {avatarUploading ? (
                                  <Icon icon="lucide:loader-2" className="h-6 w-6 text-white animate-spin" />
                                ) : (
                                  <Icon icon="lucide:upload" className="h-6 w-6 text-white" />
                                )}
                              </div>
                            )}
                            
                            {/* Delete Button */}
                            {(user?.image || avatarUrl) && (
                              <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    disabled={avatarDeleting || avatarUploading}
                                    className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                  >
                                    {avatarDeleting ? (
                                      <Icon icon="lucide:loader-2" className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <Icon icon="lucide:x" className="h-3 w-3" />
                                    )}
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Avatar</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete your avatar? This action cannot be undone and your avatar will be permanently removed.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={confirmAvatarDelete}>
                                      Delete Avatar
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <p className="text-sm text-muted-foreground">
                              {user?.image || avatarUrl 
                                ? "Hover over avatar to delete current image" 
                                : "Hover over avatar to upload new image"
                              }
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Max 2MB • JPG, PNG, GIF, WebP, SVG
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="name">Display Name</Label>
                        <Input
                          id="name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Enter your display name"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          value={username}
                          disabled={!canChangeUsername}
                          className={!canChangeUsername ? "bg-muted" : undefined}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="Choose a username"
                        />
                        {!canChangeUsername && (
                          <p className="text-xs text-muted-foreground">
                            You can change your username after {countdown || `${usernameChangeDaysLeft} day${usernameChangeDaysLeft === 1 ? '' : 's'}` }.
                          </p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Input
                          id="bio"
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          placeholder="Tell us about yourself"
                        />
                      </div>
                    </div>
                </div>
                )}
                
                <div className="flex space-x-2">
                  {!isEditing ? (
                    <>
                      <Button onClick={() => setIsEditing(true)}>
                        <Icon icon="lucide:edit" className="h-4 w-4 mr-2" />
                        Edit Profile
                      </Button>
                      <Button variant="outline" onClick={() => router.push("/settings")}>
                        <Icon icon="lucide:settings" className="h-4 w-4 mr-2" />
                        Settings
                      </Button>
                    </>
                  ) : (
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setIsEditing(false);
                          setError("");
                          // Reset form
                          setName(user.name || "");
                          setUsername(user.username || "");
                          setBio(user.bio || "");
                        }}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleSaveProfile} disabled={saveLoading}>
                        {saveLoading ? (
                          <>
                            <Icon icon="lucide:loader-2" className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Icon icon="lucide:save" className="h-4 w-4 mr-2" />
                            Save
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Tabs */}
          <Tabs defaultValue="posts" className="w-full">
            <TabsList>
              <TabsTrigger value="posts">Posts</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="posts" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Your Posts</h2>
                <Badge variant="outline">{userPosts.length} posts</Badge>
              </div>
              
              {postsLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Icon icon="lucide:loader-2" className="h-8 w-8 mx-auto mb-4 animate-spin" />
                  <p>Loading your posts...</p>
                </div>
              ) : userPosts.length > 0 ? (
                userPosts.map((post) => (
                  <Card key={post.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            {post.isPinned && (
                              <Badge variant="secondary" className="text-xs">
                                <Icon icon="lucide:star" className="h-3 w-3 mr-1" />
                                Pinned
                              </Badge>
                            )}
                            {post.isLocked && (
                              <Badge variant="destructive" className="text-xs">
                                <Icon icon="lucide:lock" className="h-3 w-3 mr-1" />
                                Locked
                              </Badge>
                            )}
                          </div>
                          <h3 className="font-medium text-foreground hover:text-primary cursor-pointer">
                            {post.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {post.content}
                          </p>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
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
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Icon icon="lucide:message-square" className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p>You haven&apos;t created any posts yet</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="activity" className="space-y-4">
              <div className="text-center py-8 text-muted-foreground">
                <Icon icon="lucide:activity" className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p>Activity feed will appear here</p>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <div className="text-center py-8 text-muted-foreground">
                <Icon icon="lucide:settings" className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p>Account settings will appear here</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
