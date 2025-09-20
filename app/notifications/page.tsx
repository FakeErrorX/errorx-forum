"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Icon } from '@iconify/react';
import { toast } from "sonner";
import Header from "@/components/layout/header";
import { PageSEO } from "@/components/seo/page-seo";

interface User {
  name: string;
  email: string;
  userId: number;
  image?: string | null;
  username?: string | null;
}

interface Notification {
  notificationId: number;
  type: 'like' | 'comment' | 'reply' | 'follow' | 'mention' | 'post' | 'system';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  relatedUserId?: number | null;
  relatedPostId?: number | null;
  relatedCommentId?: number | null;
  relatedUser?: {
    userId: number;
    name: string | null;
    username: string | null;
    image: string | null;
  } | null;
  relatedPost?: {
    postId: number;
    title: string;
  } | null;
}

export default function NotificationsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAsRead, setMarkingAsRead] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

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

  // Load notifications
  const loadNotifications = async () => {
    try {
      const response = await fetch('/api/notifications');
      if (response.ok) {
        const notificationsData = await response.json();
        setNotifications(notificationsData.notifications || []);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: number) => {
    if (markingAsRead.includes(notificationId)) return;
    
    setMarkingAsRead(prev => [...prev, notificationId]);
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.notificationId === notificationId 
              ? { ...notif, isRead: true }
              : notif
          )
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark notification as read');
    } finally {
      setMarkingAsRead(prev => prev.filter(id => id !== notificationId));
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/read-all', {
        method: 'PATCH',
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, isRead: true }))
        );
        toast.success('All notifications marked as read');
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Failed to mark all notifications as read');
    }
  };

  // Handle notification click
  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read first
    if (!notification.isRead) {
      await markAsRead(notification.notificationId);
    }

    // Navigate to related content
    if (notification.relatedPostId) {
      router.push(`/posts/${notification.relatedPostId}`);
    } else if (notification.relatedUserId && notification.relatedUser?.username) {
      router.push(`/profile/${notification.relatedUser.username}`);
    }
  };

  // Get notification icon
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return 'lucide:heart';
      case 'comment':
        return 'lucide:message-square';
      case 'reply':
        return 'lucide:reply';
      case 'follow':
        return 'lucide:user-plus';
      case 'mention':
        return 'lucide:at-sign';
      case 'post':
        return 'lucide:file-text';
      case 'system':
        return 'lucide:settings';
      default:
        return 'lucide:bell';
    }
  };

  // Get notification color
  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'like':
        return 'text-red-500';
      case 'comment':
        return 'text-blue-500';
      case 'reply':
        return 'text-green-500';
      case 'follow':
        return 'text-purple-500';
      case 'mention':
        return 'text-orange-500';
      case 'post':
        return 'text-indigo-500';
      case 'system':
        return 'text-gray-500';
      default:
        return 'text-gray-400';
    }
  };

  // Filter notifications
  const getFilteredNotifications = () => {
    switch (filter) {
      case 'unread':
        return notifications.filter(n => !n.isRead);
      case 'read':
        return notifications.filter(n => n.isRead);
      default:
        return notifications;
    }
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

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session?.user) {
      router.push("/signin");
      return;
    }

    const initializeData = async () => {
      await loadNotifications();
      await loadCurrentUser();
    };
    
    initializeData();
  }, [status, session, router]);

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

  const filteredNotifications = getFilteredNotifications();
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <>
      <PageSEO
        title="Notifications - ErrorX Forum"
        description="View your notifications and updates from the forum"
        path="/notifications"
      />
      <div className="min-h-screen bg-background">
        <Header 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          isSearching={isSearching}
          currentUser={currentUser}
          searchPlaceholder="Search notifications..."
        />

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Notifications</h1>
                <p className="text-muted-foreground mt-1">
                  Stay up to date with your forum activity
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  {unreadCount} unread
                </Badge>
                {unreadCount > 0 && (
                  <Button variant="outline" onClick={markAllAsRead}>
                    <Icon icon="lucide:check-check" className="mr-2 h-4 w-4" />
                    Mark All Read
                  </Button>
                )}
              </div>
            </div>

            {/* Filter Tabs */}
            <Tabs value={filter} onValueChange={(value) => setFilter(value as 'all' | 'unread' | 'read')}>
              <TabsList className="grid w-full grid-cols-3 md:w-[400px]">
                <TabsTrigger value="all">All ({notifications.length})</TabsTrigger>
                <TabsTrigger value="unread">Unread ({unreadCount})</TabsTrigger>
                <TabsTrigger value="read">Read ({notifications.length - unreadCount})</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4 mt-6">
                {filteredNotifications.length > 0 ? (
                  <Card>
                    <CardContent className="p-0">
                      {filteredNotifications.map((notification, index) => (
                        <div key={notification.notificationId}>
                          <div
                            className={`p-4 hover:bg-muted/50 cursor-pointer transition-colors ${
                              !notification.isRead ? 'bg-primary/5 border-l-4 border-l-primary' : ''
                            }`}
                            onClick={() => handleNotificationClick(notification)}
                          >
                            <div className="flex items-start space-x-3">
                              {/* Notification Icon */}
                              <div className={`p-2 rounded-lg bg-muted ${getNotificationColor(notification.type)}`}>
                                <Icon 
                                  icon={getNotificationIcon(notification.type)} 
                                  className="h-4 w-4" 
                                />
                              </div>

                              {/* Related User Avatar */}
                              {notification.relatedUser && (
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={notification.relatedUser.image || ""} />
                                  <AvatarFallback className="text-xs">
                                    {(notification.relatedUser.name || notification.relatedUser.username || "U").charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                              )}

                              {/* Notification Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <h4 className={`font-medium ${!notification.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                                    {notification.title}
                                  </h4>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-xs text-muted-foreground">
                                      {formatTimeAgo(notification.createdAt)}
                                    </span>
                                    {!notification.isRead && (
                                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                                    )}
                                  </div>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {notification.message}
                                </p>
                                {notification.relatedPost && (
                                  <p className="text-xs text-primary mt-2 font-medium">
                                    Post: {notification.relatedPost.title}
                                  </p>
                                )}
                              </div>

                              {/* Mark as read button */}
                              {!notification.isRead && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markAsRead(notification.notificationId);
                                  }}
                                  disabled={markingAsRead.includes(notification.notificationId)}
                                >
                                  {markingAsRead.includes(notification.notificationId) ? (
                                    <Icon icon="lucide:loader-2" className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Icon icon="lucide:check" className="h-4 w-4" />
                                  )}
                                </Button>
                              )}
                            </div>
                          </div>
                          {index < filteredNotifications.length - 1 && <Separator />}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <Icon icon="lucide:bell-off" className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No notifications</h3>
                      <p className="text-muted-foreground">
                        {filter === 'unread' ? "You're all caught up!" : "No notifications to show"}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="unread" className="space-y-4 mt-6">
                {filteredNotifications.length > 0 ? (
                  <Card>
                    <CardContent className="p-0">
                      {filteredNotifications.map((notification, index) => (
                        <div key={notification.notificationId}>
                          <div
                            className="p-4 hover:bg-muted/50 cursor-pointer transition-colors bg-primary/5 border-l-4 border-l-primary"
                            onClick={() => handleNotificationClick(notification)}
                          >
                            <div className="flex items-start space-x-3">
                              <div className={`p-2 rounded-lg bg-muted ${getNotificationColor(notification.type)}`}>
                                <Icon 
                                  icon={getNotificationIcon(notification.type)} 
                                  className="h-4 w-4" 
                                />
                              </div>
                              {notification.relatedUser && (
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={notification.relatedUser.image || ""} />
                                  <AvatarFallback className="text-xs">
                                    {(notification.relatedUser.name || notification.relatedUser.username || "U").charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-medium text-foreground">
                                    {notification.title}
                                  </h4>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-xs text-muted-foreground">
                                      {formatTimeAgo(notification.createdAt)}
                                    </span>
                                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                                  </div>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {notification.message}
                                </p>
                                {notification.relatedPost && (
                                  <p className="text-xs text-primary mt-2 font-medium">
                                    Post: {notification.relatedPost.title}
                                  </p>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notification.notificationId);
                                }}
                                disabled={markingAsRead.includes(notification.notificationId)}
                              >
                                {markingAsRead.includes(notification.notificationId) ? (
                                  <Icon icon="lucide:loader-2" className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Icon icon="lucide:check" className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                          {index < filteredNotifications.length - 1 && <Separator />}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <Icon icon="lucide:check-circle" className="h-12 w-12 mx-auto text-green-500 mb-4" />
                      <h3 className="text-lg font-semibold mb-2">All caught up!</h3>
                      <p className="text-muted-foreground">
                        You have no unread notifications.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="read" className="space-y-4 mt-6">
                {filteredNotifications.length > 0 ? (
                  <Card>
                    <CardContent className="p-0">
                      {filteredNotifications.map((notification, index) => (
                        <div key={notification.notificationId}>
                          <div
                            className="p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                            onClick={() => handleNotificationClick(notification)}
                          >
                            <div className="flex items-start space-x-3">
                              <div className={`p-2 rounded-lg bg-muted ${getNotificationColor(notification.type)}`}>
                                <Icon 
                                  icon={getNotificationIcon(notification.type)} 
                                  className="h-4 w-4" 
                                />
                              </div>
                              {notification.relatedUser && (
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={notification.relatedUser.image || ""} />
                                  <AvatarFallback className="text-xs">
                                    {(notification.relatedUser.name || notification.relatedUser.username || "U").charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-medium text-muted-foreground">
                                    {notification.title}
                                  </h4>
                                  <span className="text-xs text-muted-foreground">
                                    {formatTimeAgo(notification.createdAt)}
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {notification.message}
                                </p>
                                {notification.relatedPost && (
                                  <p className="text-xs text-primary mt-2 font-medium">
                                    Post: {notification.relatedPost.title}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                          {index < filteredNotifications.length - 1 && <Separator />}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <Icon icon="lucide:inbox" className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No read notifications</h3>
                      <p className="text-muted-foreground">
                        Read notifications will appear here.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </>
  );
}