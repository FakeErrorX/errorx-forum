'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  MessageSquare, 
  Flag, 
  Trophy, 
  TrendingUp, 
  Shield,
  Activity,
  Clock
} from 'lucide-react'

interface DashboardStats {
  totalUsers: number
  totalPosts: number
  totalReports: number
  totalTrophies: number
  userGrowth: number
  postGrowth: number
  reportGrowth: number
  onlineUsers: number
}

interface RecentActivity {
  id: string
  type: 'user' | 'post' | 'report' | 'warning'
  message: string
  timestamp: Date
  user?: string
}

// Mock data - replace with real API calls
const mockStats: DashboardStats = {
  totalUsers: 1234,
  totalPosts: 5678,
  totalReports: 12,
  totalTrophies: 45,
  userGrowth: 12.5,
  postGrowth: 8.3,
  reportGrowth: -15.2,
  onlineUsers: 89
}

const mockActivities: RecentActivity[] = [
  {
    id: '1',
    type: 'user',
    message: 'New user registration: john_doe',
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    user: 'john_doe'
  },
  {
    id: '2',
    type: 'report',
    message: 'New report submitted for inappropriate content',
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    user: 'moderator'
  },
  {
    id: '3',
    type: 'warning',
    message: 'Warning issued to user: spam_user',
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    user: 'admin'
  },
  {
    id: '4',
    type: 'post',
    message: 'Post deleted: Spam content removed',
    timestamp: new Date(Date.now() - 45 * 60 * 1000),
    user: 'moderator'
  }
]

function StatCard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend 
}: { 
  title: string
  value: string | number
  description: string
  icon: React.ElementType
  trend?: number
}) {
  const trendColor = trend && trend > 0 ? 'text-green-600' : trend && trend < 0 ? 'text-red-600' : 'text-gray-600'
  const trendIcon = trend && trend > 0 ? '↗' : trend && trend < 0 ? '↘' : '→'

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
          <span>{description}</span>
          {trend !== undefined && (
            <span className={`flex items-center ${trendColor}`}>
              {trendIcon} {Math.abs(trend)}%
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function ActivityCard({ activity }: { activity: RecentActivity }) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user': return <Users className="h-4 w-4" />
      case 'post': return <MessageSquare className="h-4 w-4" />
      case 'report': return <Flag className="h-4 w-4" />
      case 'warning': return <Shield className="h-4 w-4" />
      default: return <Activity className="h-4 w-4" />
    }
  }

  const getActivityBadge = (type: string) => {
    switch (type) {
      case 'user': return <Badge variant="secondary">User</Badge>
      case 'post': return <Badge variant="outline">Post</Badge>
      case 'report': return <Badge variant="destructive">Report</Badge>
      case 'warning': return <Badge variant="secondary">Warning</Badge>
      default: return <Badge>Activity</Badge>
    }
  }

  const timeAgo = (timestamp: Date) => {
    const minutes = Math.floor((Date.now() - timestamp.getTime()) / (1000 * 60))
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  return (
    <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex-shrink-0 mt-1">
        {getActivityIcon(activity.type)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2 mb-1">
          {getActivityBadge(activity.type)}
          <span className="text-xs text-muted-foreground flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            {timeAgo(activity.timestamp)}
          </span>
        </div>
        <p className="text-sm text-foreground">{activity.message}</p>
        {activity.user && (
          <p className="text-xs text-muted-foreground mt-1">
            by {activity.user}
          </p>
        )}
      </div>
    </div>
  )
}

export function AdminDashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Overview of your forum's performance and activity
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            Export Report
          </Button>
          <Button size="sm">
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value={mockStats.totalUsers.toLocaleString()}
          description="Active members"
          icon={Users}
          trend={mockStats.userGrowth}
        />
        <StatCard
          title="Total Posts"
          value={mockStats.totalPosts.toLocaleString()}
          description="Forum posts"
          icon={MessageSquare}
          trend={mockStats.postGrowth}
        />
        <StatCard
          title="Open Reports"
          value={mockStats.totalReports}
          description="Pending review"
          icon={Flag}
          trend={mockStats.reportGrowth}
        />
        <StatCard
          title="Trophies Awarded"
          value={mockStats.totalTrophies}
          description="This month"
          icon={Trophy}
        />
      </div>

      {/* Charts and Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common administrative tasks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Button variant="outline" className="justify-start">
                <Users className="mr-2 h-4 w-4" />
                Manage Users
              </Button>
              <Button variant="outline" className="justify-start">
                <Flag className="mr-2 h-4 w-4" />
                Review Reports
              </Button>
              <Button variant="outline" className="justify-start">
                <Shield className="mr-2 h-4 w-4" />
                Configure Permissions
              </Button>
              <Button variant="outline" className="justify-start">
                <Trophy className="mr-2 h-4 w-4" />
                Manage Trophies
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>
              Current system health and metrics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Online Users</span>
                <span className="font-medium">{mockStats.onlineUsers}</span>
              </div>
              <Progress value={75} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Server Load</span>
                <span className="font-medium">23%</span>
              </div>
              <Progress value={23} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Database Size</span>
                <span className="font-medium">1.2 GB</span>
              </div>
              <Progress value={45} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Cache Hit Rate</span>
                <span className="font-medium">94%</span>
              </div>
              <Progress value={94} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Latest administrative actions and system events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockActivities.map((activity) => (
              <ActivityCard key={activity.id} activity={activity} />
            ))}
          </div>
          <div className="mt-4 text-center">
            <Button variant="outline" size="sm">
              View All Activities
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}