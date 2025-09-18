'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { 
  Search,
  MoreHorizontal,
  UserPlus,
  Shield,
  Ban,
  AlertTriangle,
  Eye,
  Edit,
  Trash2,
  Download,
  Filter
} from 'lucide-react'

interface User {
  id: string
  username: string
  email: string
  role: string
  status: 'active' | 'banned' | 'warning'
  posts: number
  trophies: number
  joinDate: string
  lastActive: string
  avatar?: string
  warningPoints: number
}

interface UserWarning {
  id: string
  reason: string
  points: number
  issuedBy: string
  issuedAt: string
}

// Mock data
const mockUsers: User[] = [
  {
    id: '1',
    username: 'john_doe',
    email: 'john@example.com',
    role: 'Member',
    status: 'active',
    posts: 145,
    trophies: 12,
    joinDate: '2024-01-15',
    lastActive: '2024-09-18',
    warningPoints: 0
  },
  {
    id: '2',
    username: 'jane_smith',
    email: 'jane@example.com',
    role: 'Moderator',
    status: 'active',
    posts: 892,
    trophies: 45,
    joinDate: '2023-08-22',
    lastActive: '2024-09-18',
    warningPoints: 0
  },
  {
    id: '3',
    username: 'spam_user',
    email: 'spam@example.com',
    role: 'Member',
    status: 'warning',
    posts: 23,
    trophies: 1,
    joinDate: '2024-09-10',
    lastActive: '2024-09-17',
    warningPoints: 2
  }
]

function UserStatusBadge({ status }: { status: User['status'] }) {
  switch (status) {
    case 'active':
      return <Badge variant="secondary">Active</Badge>
    case 'banned':
      return <Badge variant="destructive">Banned</Badge>
    case 'warning':
      return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Warning</Badge>
    default:
      return <Badge variant="outline">Unknown</Badge>
  }
}

function UserWarningDialog({ 
  user, 
  isOpen, 
  onClose 
}: { 
  user: User
  isOpen: boolean
  onClose: () => void 
}) {
  const [reason, setReason] = useState('')
  const [points, setPoints] = useState('1')

  const handleSubmit = async () => {
    try {
      // API call to issue warning
      console.log('Issuing warning:', { userId: user.id, reason, points })
      onClose()
    } catch (error) {
      console.error('Error issuing warning:', error)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Issue Warning</DialogTitle>
          <DialogDescription>
            Issue a warning to {user.username}. This will be recorded in their profile.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="reason">Reason</Label>
            <Textarea
              id="reason"
              placeholder="Enter the reason for this warning..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="points">Warning Points</Label>
            <Select value={points} onValueChange={setPoints}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 Point</SelectItem>
                <SelectItem value="2">2 Points</SelectItem>
                <SelectItem value="3">3 Points</SelectItem>
                <SelectItem value="5">5 Points</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!reason.trim()}>
            Issue Warning
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function UserBanDialog({ 
  user, 
  isOpen, 
  onClose 
}: { 
  user: User
  isOpen: boolean
  onClose: () => void 
}) {
  const [reason, setReason] = useState('')
  const [duration, setDuration] = useState('7')

  const handleSubmit = async () => {
    try {
      // API call to ban user
      console.log('Banning user:', { userId: user.id, reason, duration })
      onClose()
    } catch (error) {
      console.error('Error banning user:', error)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ban User</DialogTitle>
          <DialogDescription>
            Ban {user.username} from the forum. This action can be reversed later.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="ban-reason">Reason</Label>
            <Textarea
              id="ban-reason"
              placeholder="Enter the reason for this ban..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="duration">Duration</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 Day</SelectItem>
                <SelectItem value="7">7 Days</SelectItem>
                <SelectItem value="30">30 Days</SelectItem>
                <SelectItem value="365">1 Year</SelectItem>
                <SelectItem value="permanent">Permanent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleSubmit} disabled={!reason.trim()}>
            Ban User
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>(mockUsers)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [warningDialogOpen, setWarningDialogOpen] = useState(false)
  const [banDialogOpen, setBanDialogOpen] = useState(false)

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter
    
    return matchesSearch && matchesRole && matchesStatus
  })

  const handleWarning = (user: User) => {
    setSelectedUser(user)
    setWarningDialogOpen(true)
  }

  const handleBan = (user: User) => {
    setSelectedUser(user)
    setBanDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
          <p className="text-muted-foreground">
            Manage users, roles, and moderation actions
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export Users
          </Button>
          <Button size="sm">
            <UserPlus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="Admin">Admin</SelectItem>
                <SelectItem value="Moderator">Moderator</SelectItem>
                <SelectItem value="Member">Member</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="banned">Banned</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
          <CardDescription>
            Manage your forum members and their permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Posts</TableHead>
                <TableHead>Trophies</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>
                          {user.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.username}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                        {user.warningPoints > 0 && (
                          <div className="text-xs text-yellow-600">
                            {user.warningPoints} warning points
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{user.role}</Badge>
                  </TableCell>
                  <TableCell>
                    <UserStatusBadge status={user.status} />
                  </TableCell>
                  <TableCell>{user.posts}</TableCell>
                  <TableCell>{user.trophies}</TableCell>
                  <TableCell>{new Date(user.joinDate).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(user.lastActive).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          View Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit User
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Shield className="mr-2 h-4 w-4" />
                          Change Role
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleWarning(user)}>
                          <AlertTriangle className="mr-2 h-4 w-4" />
                          Issue Warning
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleBan(user)}
                          className="text-red-600"
                        >
                          <Ban className="mr-2 h-4 w-4" />
                          Ban User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialogs */}
      {selectedUser && (
        <>
          <UserWarningDialog
            user={selectedUser}
            isOpen={warningDialogOpen}
            onClose={() => {
              setWarningDialogOpen(false)
              setSelectedUser(null)
            }}
          />
          <UserBanDialog
            user={selectedUser}
            isOpen={banDialogOpen}
            onClose={() => {
              setBanDialogOpen(false)
              setSelectedUser(null)
            }}
          />
        </>
      )}
    </div>
  )
}