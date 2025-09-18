'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/admin/admin-layout'
import UserManagementDashboard from '@/components/admin/user-management-dashboard'
import BadgeManagement from '@/components/admin/badge-management'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Users, Award, Shield, Settings } from 'lucide-react'
import { toast } from 'sonner'

interface User {
  id: string
  userId: number
  username?: string
  name?: string
  email: string
  image?: string
  createdAt: string
  reputation?: number
  isVerified?: boolean
  isBanned?: boolean
  role?: {
    id: string
    name: string
    displayName: string
    color?: string
  }
}

export default function AdminUsersPage() {
  return (
    <AdminLayout>
      <UsersPage />
    </AdminLayout>
  )
}

function UsersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  type SessionRole = { name: string }
  type SessionUserWithRole = { role?: SessionRole }
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

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

    fetchUsers()
  }, [session, status, router])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      if (!response.ok) throw new Error('Failed to fetch users')
      const data = await response.json()
      setUsers(data.users || [])
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  const handleUserUpdate = (userId: string, action: string, data?: any) => {
    // Refresh user data after updates
    fetchUsers()
    
    switch (action) {
      case 'ban':
        toast.success('User banned successfully')
        break
      case 'warn':
        toast.success('Warning issued successfully')
        break
      case 'badge':
        toast.success('Badge awarded successfully')
        break
      default:
        toast.success('User updated successfully')
    }
  }

  const handleBadgeCreate = (badge: any) => {
    toast.success(`Badge "${badge.displayName}" created successfully`)
  }

  const handleBadgeUpdate = (badgeId: string, badge: any) => {
    toast.success(`Badge "${badge.displayName}" updated successfully`)
  }

  const handleBadgeDelete = (badgeId: string) => {
    toast.success('Badge deleted successfully')
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading user management...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="h-8 w-8" />
          Advanced User Management
        </h1>
        <p className="text-muted-foreground">
          Comprehensive user management, moderation tools, and badge system
        </p>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            User Management
          </TabsTrigger>
          <TabsTrigger value="badges" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            Badge System
          </TabsTrigger>
          <TabsTrigger value="moderation" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Moderation
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <UserManagementDashboard 
            users={users}
            onUserUpdate={handleUserUpdate}
          />
        </TabsContent>

        <TabsContent value="badges">
          <BadgeManagement
            onBadgeCreate={handleBadgeCreate}
            onBadgeUpdate={handleBadgeUpdate}
            onBadgeDelete={handleBadgeDelete}
          />
        </TabsContent>

        <TabsContent value="moderation">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Moderation Tools
              </CardTitle>
              <CardDescription>
                Advanced moderation features and automated systems
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Moderation Dashboard</h3>
                <p className="text-muted-foreground mb-4">
                  Advanced moderation tools including auto-moderation, content filtering, and reporting systems.
                </p>
                <p className="text-sm text-muted-foreground">
                  This section will include comprehensive moderation features in future updates.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                User Analytics
              </CardTitle>
              <CardDescription>
                User engagement metrics and behavior analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">User Analytics Dashboard</h3>
                <p className="text-muted-foreground mb-4">
                  Comprehensive analytics including user growth, engagement metrics, and behavioral insights.
                </p>
                <p className="text-sm text-muted-foreground">
                  Advanced analytics features will be implemented in future updates.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
