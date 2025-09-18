'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import {
  User,
  Clock,
  MessageSquare,
  Heart,
  Eye,
  TrendingUp,
  TrendingDown,
  Calendar,
  MapPin,
  Smartphone,
  Monitor,
  Tablet,
  Search
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface UserAnalytics {
  user: {
    id: string;
    username: string;
    email: string;
    avatar?: string;
    joinedAt: string;
    lastActive: string;
    role: string;
    isVerified: boolean;
  };
  engagement: {
    totalSessions: number;
    avgSessionDuration: number;
    totalPageViews: number;
    postsCreated: number;
    commentsCreated: number;
    reactionsGiven: number;
    reactionsReceived: number;
    followerCount: number;
    followingCount: number;
  };
  activity: {
    activityByDay: Array<{
      date: string;
      sessions: number;
      posts: number;
      comments: number;
    }>;
    activityByHour: Array<{
      hour: number;
      activity: number;
    }>;
    topCategories: Array<{
      category: string;
      posts: number;
      engagement: number;
    }>;
  };
  devices: {
    deviceTypes: Array<{
      type: string;
      sessions: number;
      percentage: number;
    }>;
    browsers: Array<{
      browser: string;
      sessions: number;
      percentage: number;
    }>;
    operatingSystems: Array<{
      os: string;
      sessions: number;
      percentage: number;
    }>;
  };
  geography: {
    countries: Array<{
      country: string;
      sessions: number;
      percentage: number;
    }>;
    cities: Array<{
      city: string;
      sessions: number;
    }>;
  };
}

interface UserAnalyticsViewProps {
  className?: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function UserAnalyticsView({ className }: UserAnalyticsViewProps) {
  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  const fetchUserAnalytics = async (userId: string) => {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/analytics/users/${userId}?period=${period}`);
      const data = await response.json();
      
      if (data.success) {
        setAnalytics(data.data);
      }
    } catch (error) {
      console.error('Error fetching user analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserSearch = async () => {
    if (!searchQuery) return;
    
    // In a real implementation, you'd search for users by username/email
    // For now, assuming searchQuery is a user ID
    setSelectedUserId(searchQuery);
    await fetchUserAnalytics(searchQuery);
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const getDeviceIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'mobile': return <Smartphone className="h-4 w-4" />;
      case 'tablet': return <Tablet className="h-4 w-4" />;
      default: return <Monitor className="h-4 w-4" />;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">User Analytics</h1>
          <p className="text-gray-600 mt-1">
            Detailed insights into individual user behavior and engagement
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={(value: any) => setPeriod(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* User Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search User
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              placeholder="Enter user ID, username, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleUserSearch()}
              className="flex-1"
            />
            <Button onClick={handleUserSearch} disabled={!searchQuery || isLoading}>
              {isLoading ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* User Profile */}
      {analytics && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>User Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={analytics.user.avatar} />
                  <AvatarFallback>
                    {analytics.user.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-semibold">{analytics.user.username}</h3>
                    <Badge variant={analytics.user.role === 'ADMIN' ? 'destructive' : 'secondary'}>
                      {analytics.user.role}
                    </Badge>
                    {analytics.user.isVerified && (
                      <Badge variant="default">Verified</Badge>
                    )}
                  </div>
                  <p className="text-gray-600 mb-2">{analytics.user.email}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Joined {new Date(analytics.user.joinedAt).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Last active {new Date(analytics.user.lastActive).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Engagement Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Sessions</p>
                    <p className="text-3xl font-bold">{formatNumber(analytics.engagement.totalSessions)}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {formatDuration(analytics.engagement.avgSessionDuration)} avg
                    </p>
                  </div>
                  <User className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Page Views</p>
                    <p className="text-3xl font-bold">{formatNumber(analytics.engagement.totalPageViews)}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {(analytics.engagement.totalPageViews / analytics.engagement.totalSessions).toFixed(1)} per session
                    </p>
                  </div>
                  <Eye className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Posts Created</p>
                    <p className="text-3xl font-bold">{formatNumber(analytics.engagement.postsCreated)}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {formatNumber(analytics.engagement.commentsCreated)} comments
                    </p>
                  </div>
                  <MessageSquare className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Reactions</p>
                    <p className="text-3xl font-bold">{formatNumber(analytics.engagement.reactionsReceived)}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {formatNumber(analytics.engagement.reactionsGiven)} given
                    </p>
                  </div>
                  <Heart className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Activity Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Activity Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analytics.activity.activityByDay}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="sessions" stackId="1" stroke="#8884d8" fill="#8884d8" />
                      <Area type="monotone" dataKey="posts" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
                      <Area type="monotone" dataKey="comments" stackId="1" stroke="#ffc658" fill="#ffc658" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Activity by Hour</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.activity.activityByHour}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="activity" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Device and Geography */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Device Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.devices.deviceTypes.map((device, index) => (
                    <div key={device.type} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getDeviceIcon(device.type)}
                        <span className="font-medium">{device.type}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">{device.sessions} sessions</span>
                        <Badge variant="secondary">{device.percentage.toFixed(1)}%</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Geographic Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.geography.countries.slice(0, 5).map((country, index) => (
                    <div key={country.country} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span className="font-medium">{country.country}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">{country.sessions} sessions</span>
                        <Badge variant="secondary">{country.percentage.toFixed(1)}%</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Categories */}
          <Card>
            <CardHeader>
              <CardTitle>Top Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {analytics.activity.topCategories.slice(0, 6).map((category, index) => (
                  <div key={category.category} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{category.category}</h4>
                      <Badge variant="secondary">#{index + 1}</Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      <div>{category.posts} posts</div>
                      <div>{category.engagement} engagement</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Social Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Social Engagement</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {analytics.engagement.followerCount}
                  </div>
                  <div className="text-sm text-gray-600">Followers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {analytics.engagement.followingCount}
                  </div>
                  <div className="text-sm text-gray-600">Following</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {analytics.engagement.reactionsGiven}
                  </div>
                  <div className="text-sm text-gray-600">Reactions Given</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {analytics.engagement.reactionsReceived}
                  </div>
                  <div className="text-sm text-gray-600">Reactions Received</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* No Data State */}
      {!analytics && !isLoading && (
        <Card>
          <CardContent className="p-12 text-center">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No User Selected</h3>
            <p className="text-gray-600">
              Search for a user above to view their detailed analytics and engagement metrics.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}