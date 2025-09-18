'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import {
  Users,
  MessageSquare,
  Eye,
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  Globe,
  Target,
  Zap,
  RefreshCw
} from 'lucide-react';

interface DashboardMetrics {
  overview: {
    totalUsers: number;
    activeUsers: number;
    totalPosts: number;
    totalComments: number;
    dailyGrowth: {
      users: number;
      posts: number;
      comments: number;
    };
  };
  engagement: {
    avgSessionTime: number;
    bounceRate: number;
    pageViews: number;
    engagementRate: number;
  };
  content: {
    topPosts: Array<{
      id: string;
      title: string;
      views: number;
      engagement: number;
    }>;
    topCategories: Array<{
      id: string;
      name: string;
      posts: number;
      engagement: number;
    }>;
  };
  traffic: {
    sources: Array<{
      source: string;
      visitors: number;
      percentage: number;
    }>;
    referrers: Array<{
      referrer: string;
      visitors: number;
    }>;
  };
  performance: {
    avgResponseTime: number;
    errorRate: number;
    uptime: number;
  };
}

interface RealTimeMetrics {
  activeUsers: number;
  onlineNow: number;
  recentPosts: number;
  recentComments: number;
}

interface AnalyticsDashboardProps {
  className?: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function AnalyticsDashboard({ className }: AnalyticsDashboardProps) {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [realTimeMetrics, setRealTimeMetrics] = useState<RealTimeMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    fetchDashboardMetrics();
    fetchRealTimeMetrics();
    
    // Set up real-time updates
    const interval = setInterval(fetchRealTimeMetrics, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, [period]);

  const fetchDashboardMetrics = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/analytics/dashboard?period=${period}`);
      const data = await response.json();
      
      if (data.success) {
        setMetrics(data.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRealTimeMetrics = async () => {
    try {
      const response = await fetch('/api/analytics/realtime');
      const data = await response.json();
      
      if (data.success) {
        setRealTimeMetrics(data.data);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Error fetching real-time metrics:', error);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatPercentage = (num: number): string => {
    return `${num.toFixed(1)}%`;
  };

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  if (isLoading || !metrics) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Comprehensive insights into your forum's performance
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
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={fetchDashboardMetrics}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Real-time Stats */}
      {realTimeMetrics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-500" />
              Real-time Activity
              <Badge variant="secondary" className="ml-auto">
                Updated {lastUpdated.toLocaleTimeString()}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {realTimeMetrics.onlineNow}
                </div>
                <div className="text-sm text-gray-600">Online Now</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {realTimeMetrics.activeUsers}
                </div>
                <div className="text-sm text-gray-600">Active Users (1h)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {realTimeMetrics.recentPosts}
                </div>
                <div className="text-sm text-gray-600">New Posts (1h)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {realTimeMetrics.recentComments}
                </div>
                <div className="text-sm text-gray-600">New Comments (1h)</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-3xl font-bold">{formatNumber(metrics.overview.totalUsers)}</p>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  +{formatPercentage(metrics.overview.dailyGrowth.users)} growth
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-3xl font-bold">{formatNumber(metrics.overview.activeUsers)}</p>
                <p className="text-sm text-gray-600 mt-1">
                  {formatPercentage(metrics.engagement.engagementRate)} engagement
                </p>
              </div>
              <Activity className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Posts</p>
                <p className="text-3xl font-bold">{formatNumber(metrics.overview.totalPosts)}</p>
                <p className="text-sm text-blue-600 flex items-center mt-1">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  +{formatNumber(metrics.overview.dailyGrowth.posts)} new
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
                <p className="text-sm font-medium text-gray-600">Page Views</p>
                <p className="text-3xl font-bold">{formatNumber(metrics.engagement.pageViews)}</p>
                <p className="text-sm text-gray-600 mt-1">
                  {formatTime(metrics.engagement.avgSessionTime)} avg session
                </p>
              </div>
              <Eye className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Engagement Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Engagement Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Engagement Rate</span>
                <span className="text-sm font-bold text-green-600">
                  {formatPercentage(metrics.engagement.engagementRate)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full" 
                  style={{ width: `${metrics.engagement.engagementRate}%` }}
                />
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Bounce Rate</span>
                <span className="text-sm font-bold text-red-600">
                  {formatPercentage(metrics.engagement.bounceRate)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-red-600 h-2 rounded-full" 
                  style={{ width: `${metrics.engagement.bounceRate}%` }}
                />
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Avg Session Time</span>
                <span className="text-sm font-bold">
                  {formatTime(metrics.engagement.avgSessionTime)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Traffic Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={metrics.traffic.sources}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ source, percentage }) => `${source} (${percentage.toFixed(1)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="visitors"
                  >
                    {metrics.traffic.sources.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Posts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.content.topPosts.slice(0, 5).map((post, index) => (
                <div key={post.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{post.title}</p>
                    <p className="text-xs text-gray-600">
                      {formatNumber(post.views)} views • {post.engagement} engagements
                    </p>
                  </div>
                  <Badge variant="secondary">#{index + 1}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.content.topCategories.slice(0, 5).map((category, index) => (
                <div key={category.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{category.name}</p>
                    <p className="text-xs text-gray-600">
                      {formatNumber(category.posts)} posts • {category.engagement} engagement
                    </p>
                  </div>
                  <Badge variant="secondary">#{index + 1}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {metrics.performance.avgResponseTime.toFixed(0)}ms
              </div>
              <div className="text-sm text-gray-600">Avg Response Time</div>
              <div className="mt-2">
                <Badge variant={metrics.performance.avgResponseTime < 200 ? 'default' : 'destructive'}>
                  {metrics.performance.avgResponseTime < 200 ? 'Excellent' : 'Needs Attention'}
                </Badge>
              </div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {formatPercentage(metrics.performance.errorRate)}
              </div>
              <div className="text-sm text-gray-600">Error Rate</div>
              <div className="mt-2">
                <Badge variant={metrics.performance.errorRate < 1 ? 'default' : 'destructive'}>
                  {metrics.performance.errorRate < 1 ? 'Good' : 'High'}
                </Badge>
              </div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatPercentage(metrics.performance.uptime)}
              </div>
              <div className="text-sm text-gray-600">Uptime</div>
              <div className="mt-2">
                <Badge variant={metrics.performance.uptime > 99 ? 'default' : 'destructive'}>
                  {metrics.performance.uptime > 99 ? 'Excellent' : 'Poor'}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}