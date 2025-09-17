'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Users, Shield, Search, Filter, UserPlus } from 'lucide-react'
import { toast } from 'sonner'

interface User {
  id: string
  userId: number
  username?: string
  name?: string
  email: string
  image?: string
  createdAt: string
  role?: {
    id: string
    name: string
    displayName: string
    color?: string
  }
}

interface Role {
  id: string
  name: string
  displayName: string
  color?: string
  _count: {
    users: number
  }
}

export default function UsersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  type SessionRole = { name: string }
  type SessionUserWithRole = { role?: SessionRole }
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRole, setSelectedRole] = useState<string>('all')
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [isBulkAssignOpen, setIsBulkAssignOpen] = useState(false)
  const [bulkRoleId, setBulkRoleId] = useState('')

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
    fetchRoles()
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

  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/admin/roles')
      if (!response.ok) throw new Error('Failed to fetch roles')
      const data = await response.json()
      setRoles(data.roles || [])
    } catch (error) {
      console.error('Error fetching roles:', error)
      toast.error('Failed to fetch roles')
    }
  }

  const handleRoleChange = async (userId: string, roleId: string) => {
    try {
      const response = await fetch('/api/admin/users/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, roleId })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update role')
      }

      toast.success('User role updated successfully')
      fetchUsers()
    } catch (error) {
      console.error('Error updating role:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update role')
    }
  }

  const handleBulkRoleAssign = async () => {
    if (selectedUsers.length === 0 || !bulkRoleId) return

    try {
      const response = await fetch('/api/admin/users/roles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: selectedUsers,
          roleId: bulkRoleId
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update roles')
      }

      toast.success(`Role assigned to ${selectedUsers.length} users successfully`)
      setSelectedUsers([])
      setIsBulkAssignOpen(false)
      setBulkRoleId('')
      fetchUsers()
    } catch (error) {
      console.error('Error bulk updating roles:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update roles')
    }
  }

  const handleSelectUser = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers([...selectedUsers, userId])
    } else {
      setSelectedUsers(selectedUsers.filter(id => id !== userId))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(filteredUsers.map(user => user.id))
    } else {
      setSelectedUsers([])
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesRole = selectedRole === 'all' || user.role?.name === selectedRole

    return matchesSearch && matchesRole
  })

  const isAllSelected = filteredUsers.length > 0 && selectedUsers.length === filteredUsers.length
  const isPartiallySelected = selectedUsers.length > 0 && selectedUsers.length < filteredUsers.length

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading users...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-gray-600">Manage user roles and permissions</p>
        </div>
        {selectedUsers.length > 0 && (
          <Dialog open={isBulkAssignOpen} onOpenChange={setIsBulkAssignOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="w-4 h-4 mr-2" />
                Assign Role to {selectedUsers.length} User(s)
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Bulk Role Assignment</DialogTitle>
                <DialogDescription>
                  Assign a role to {selectedUsers.length} selected users
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Select Role</label>
                  <Select value={bulkRoleId} onValueChange={setBulkRoleId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: role.color }}
                            />
                            {role.displayName}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsBulkAssignOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleBulkRoleAssign} disabled={!bulkRoleId}>
                  Assign Role
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={selectedRole} onValueChange={setSelectedRole}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {roles.map((role) => (
              <SelectItem key={role.id} value={role.name}>
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: role.color }}
                  />
                  {role.displayName}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Users ({filteredUsers.length})</CardTitle>
              <CardDescription>
                Manage user roles and permissions
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={isAllSelected}
                ref={(el: HTMLButtonElement | null) => {
                  if (el) {
                    (el as unknown as { indeterminate: boolean }).indeterminate = isPartiallySelected
                  }
                }}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm text-gray-600">Select All</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <Checkbox
                    checked={selectedUsers.includes(user.id)}
                    onCheckedChange={(checked) => handleSelectUser(user.id, checked as boolean)}
                  />
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={user.image || ''} />
                    <AvatarFallback>
                      {user.name?.charAt(0) || user.username?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">
                      {user.name || user.username || 'Unnamed User'}
                    </div>
                    <div className="text-sm text-gray-600">
                      @{user.username || 'no-username'} • {user.email}
                    </div>
                    <div className="text-xs text-gray-500">
                      User ID: {user.userId} • Joined: {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
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
                  <Select
                    value={user.role?.id || ''}
                    onValueChange={(roleId) => handleRoleChange(user.id, roleId)}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No Role</SelectItem>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: role.color }}
                            />
                            {role.displayName}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
