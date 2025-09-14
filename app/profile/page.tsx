"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
// Removed direct database import
// Remove direct import of server-side functions
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Icon } from '@iconify/react';
import { ModeToggle } from "@/components/mode-toggle";

interface User {
  id: string;
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

  // Load user posts
  const loadUserPosts = async (userId: string) => {
    setPostsLoading(true);
    try {
      const response = await fetch('/api/posts?limit=50&offset=0');
      if (response.ok) {
        const postsData = await response.json();
        const userPostsData = postsData.filter((post: any) => post.authorId === userId);
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
          setLocation(""); // Not stored in current schema
          setWebsite(""); // Not stored in current schema
          
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
    } catch (error: any) {
      setError(error.message || "Failed to update profile. Please try again.");
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
              <Button variant="ghost" onClick={() => router.push("/")}>
                <Icon icon="lucide:arrow-left" className="h-4 w-4 mr-2" />
                Back to Forum
              </Button>
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
                <Avatar className="h-24 w-24">
                  <AvatarImage src={user.image || ""} alt={user.name || "User"} />
                  <AvatarFallback className="text-2xl">
                    {user.name?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-4 mb-2">
                    <h1 className="text-3xl font-bold text-foreground">{user.name}</h1>
                    <Badge variant="secondary">Member</Badge>
                  </div>
                  
                  {!isEditing ? (
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
                  ) : (
                    <div className="space-y-4">
                      {error && (
                        <Alert variant="destructive">
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      )}
                      
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
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="Choose a username"
                        />
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
                  )}
                </div>
                
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
                  <p>You haven't created any posts yet</p>
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
