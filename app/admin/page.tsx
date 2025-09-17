'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Users, 
  Shield, 
  Settings, 
  BarChart3, 
  FileText, 
  MessageSquare,
  UserCheck,
  AlertTriangle,
  TrendingUp,
  Activity,
  Flag
} from 'lucide-react'
import { toast } from 'sonner'

interface Stats {
  totalUsers: number
  totalPosts: number
  totalComments: number
  totalCategories: number
  recentUsers: Array<{
    id: string
    username?: string
    name?: string
    email: string
    createdAt: string
    role?: {
      displayName: string
      color?: string
    }
  }>
  roleStats: Array<{
    role: {
      name: string
      displayName: string
      color?: string
    }
    count: number
  }>
}

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  type SessionRole = { name: string; displayName?: string; color?: string }
  type SessionUserWithRole = { id?: string; username?: string; name?: string; role?: SessionRole }

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/signin')
      return
    }

    // Check if user has admin access
    const su = session.user as unknown as SessionUserWithRole
    if (!su?.role || !['super_admin', 'admin'].includes(su.role.name)) {
      router.push('/')
      toast.error('Access denied. Admin privileges required.')
      return
    }

    fetchStats()
  }, [session, status, router])

  const fetchStats = async () => {
    try {
      // Fetch users
      const usersResponse = await fetch('/api/users')
      const usersData = await usersResponse.json()
      
      // Fetch posts
      const postsResponse = await fetch('/api/posts')
      const postsData = await postsResponse.json()
      
      // Fetch categories
      const categoriesResponse = await fetch('/api/categories')
      const categoriesData = await categoriesResponse.json()
      
      // Fetch roles
      const rolesResponse = await fetch('/api/admin/roles')
      const rolesData = await rolesResponse.json()

      // Calculate stats
      const totalUsers = usersData.users?.length || 0
      const totalPosts = postsData.posts?.length || 0
      const totalComments = postsData.posts?.reduce(
        (sum: number, post: { comments?: unknown[] }) => sum + (post.comments?.length || 0),
        0
      ) || 0
      const totalCategories = categoriesData.categories?.length || 0
      
      // Get recent users (last 5)
      const recentUsers = usersData.users?.slice(0, 5) || []
      
      // Calculate role stats
      const roleStats = rolesData.roles?.map((role: { name: string; displayName: string; color?: string; _count?: { users?: number } }) => ({
        role: {
          name: role.name,
          displayName: role.displayName,
          color: role.color
        },
        count: role._count?.users || 0
      })) || []

      setStats({
        totalUsers,
        totalPosts,
        totalComments,
        totalCategories,
        recentUsers,
        roleStats
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-600">Welcome back, {session?.user?.name || 'Admin'}!</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              +2 from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalPosts || 0}</div>
            <p className="text-xs text-muted-foreground">
              +12 from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Comments</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalComments || 0}</div>
            <p className="text-xs text-muted-foreground">
              +8 from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalCategories || 0}</div>
            <p className="text-xs text-muted-foreground">
              Active categories
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Users */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5" />
                  Recent Users
                </CardTitle>
                <CardDescription>
                  Latest registered users
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats?.recentUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {user.name || user.username || 'Unnamed User'}
                        </p>
                        <p className="text-sm text-gray-600">
                          @{user.username || 'no-username'}
                        </p>
                      </div>
                      <div className="text-right">
                        {user.role && (
                          <Badge
                            variant="outline"
                            className="flex items-center gap-1"
                            style={{ borderColor: user.role.color }}
                          >
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: user.role.color }}
                            />
                            {user.role.displayName}
                          </Badge>
                        )}
                        <p className="text-xs text-gray-500">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Role Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Role Distribution
                </CardTitle>
                <CardDescription>
                  Users by role
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats?.roleStats.map((roleStat) => (
                    <div key={roleStat.role.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: roleStat.role.color }}
                        />
                        <span className="font-medium">{roleStat.role.displayName}</span>
                      </div>
                      <Badge variant="secondary">{roleStat.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Manage user accounts and roles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Link href="/admin/users">
                  <Button className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Manage Users
                  </Button>
                </Link>
                <Link href="/admin/roles">
                  <Button variant="outline" className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Manage Roles
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Role Management</CardTitle>
              <CardDescription>
                Configure roles and permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Link href="/admin/roles">
                  <Button className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Manage Roles
                  </Button>
                </Link>
                <Link href="/admin/users">
                  <Button variant="outline" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Assign Roles
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Content Reports</CardTitle>
              <CardDescription>Review and moderate reported content</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => window.open('/admin/reports', '_blank')}>
                <Flag className="h-4 w-4 mr-2" />
                Open Reports Panel
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
              <CardDescription>
                Configure forum settings and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Forum Maintenance</h4>
                    <p className="text-sm text-gray-600">Put the forum in maintenance mode</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Configure
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Email Settings</h4>
                    <p className="text-sm text-gray-600">Configure email notifications</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Configure
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Security Settings</h4>
                    <p className="text-sm text-gray-600">Configure security policies</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Configure
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
