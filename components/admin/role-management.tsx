'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
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
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  Shield,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Search,
  Users,
  Lock,
  Unlock,
  Copy
} from 'lucide-react'
import { ENHANCED_PERMISSIONS, PermissionCategory } from '@/lib/permissions'

interface Role {
  id: string
  name: string
  description: string
  color: string
  userCount: number
  isDefault: boolean
  isSystem: boolean
  permissions: string[]
  createdAt: string
}

// Mock data
const mockRoles: Role[] = [
  {
    id: '1',
    name: 'Super Admin',
    description: 'Full system access with all permissions',
    color: '#ef4444',
    userCount: 2,
    isDefault: false,
    isSystem: true,
    permissions: Object.values(ENHANCED_PERMISSIONS).flatMap(category => Object.values(category)),
    createdAt: '2024-01-01'
  },
  {
    id: '2',
    name: 'Admin',
    description: 'Administrative access with most permissions',
    color: '#f59e0b',
    userCount: 5,
    isDefault: false,
    isSystem: false,
    permissions: [
      ENHANCED_PERMISSIONS.ADMIN.ACCESS_ADMIN_PANEL,
      ENHANCED_PERMISSIONS.ADMIN.MANAGE_USERS,
      ENHANCED_PERMISSIONS.ADMIN.MANAGE_ROLES,
      ENHANCED_PERMISSIONS.MODERATION.VIEW_MODERATION_LOG,
      ENHANCED_PERMISSIONS.MODERATION.DELETE_POSTS,
      ENHANCED_PERMISSIONS.MODERATION.WARN_USERS,
      ENHANCED_PERMISSIONS.THREAD.EDIT_ANY_POST,
      ENHANCED_PERMISSIONS.THREAD.DELETE_ANY_POST
    ],
    createdAt: '2024-01-01'
  },
  {
    id: '3',
    name: 'Moderator',
    description: 'Content moderation and user management',
    color: '#10b981',
    userCount: 12,
    isDefault: false,
    isSystem: false,
    permissions: [
      ENHANCED_PERMISSIONS.MODERATION.VIEW_MODERATION_LOG,
      ENHANCED_PERMISSIONS.MODERATION.DELETE_POSTS,
      ENHANCED_PERMISSIONS.MODERATION.EDIT_POSTS,
      ENHANCED_PERMISSIONS.MODERATION.WARN_USERS,
      ENHANCED_PERMISSIONS.THREAD.EDIT_ANY_POST,
      ENHANCED_PERMISSIONS.THREAD.DELETE_ANY_POST,
      ENHANCED_PERMISSIONS.THREAD.LOCK_THREADS,
      ENHANCED_PERMISSIONS.THREAD.STICK_THREADS
    ],
    createdAt: '2024-01-01'
  },
  {
    id: '4',
    name: 'Member',
    description: 'Standard forum member permissions',
    color: '#6366f1',
    userCount: 1205,
    isDefault: true,
    isSystem: false,
    permissions: [
      ENHANCED_PERMISSIONS.GENERAL.VIEW_FORUM,
      ENHANCED_PERMISSIONS.GENERAL.SEARCH,
      ENHANCED_PERMISSIONS.GENERAL.VIEW_PROFILES,
      ENHANCED_PERMISSIONS.PROFILE.EDIT_OWN_PROFILE,
      ENHANCED_PERMISSIONS.PROFILE.UPLOAD_AVATAR,
      ENHANCED_PERMISSIONS.THREAD.VIEW_THREADS,
      ENHANCED_PERMISSIONS.THREAD.VIEW_CONTENT,
      ENHANCED_PERMISSIONS.THREAD.CREATE_THREAD,
      ENHANCED_PERMISSIONS.THREAD.REPLY_TO_THREAD,
      ENHANCED_PERMISSIONS.THREAD.EDIT_OWN_POSTS,
      ENHANCED_PERMISSIONS.THREAD.DELETE_OWN_POSTS,
      ENHANCED_PERMISSIONS.MEDIA.UPLOAD_ATTACHMENTS,
      ENHANCED_PERMISSIONS.MEDIA.VIEW_ATTACHMENTS,
      ENHANCED_PERMISSIONS.CONVERSATION.START_CONVERSATIONS,
      ENHANCED_PERMISSIONS.CONVERSATION.REPLY_TO_CONVERSATIONS
    ],
    createdAt: '2024-01-01'
  }
]

function PermissionCard({ 
  category, 
  permissions, 
  selectedPermissions, 
  onPermissionToggle 
}: {
  category: string
  permissions: Record<string, string>
  selectedPermissions: string[]
  onPermissionToggle: (permission: string) => void
}) {
  const categoryPermissions = Object.values(permissions)
  const allSelected = categoryPermissions.every(p => selectedPermissions.includes(p))
  const someSelected = categoryPermissions.some(p => selectedPermissions.includes(p))

  const toggleAll = () => {
    if (allSelected) {
      // Remove all permissions from this category
      categoryPermissions.forEach(p => {
        if (selectedPermissions.includes(p)) {
          onPermissionToggle(p)
        }
      })
    } else {
      // Add all permissions from this category
      categoryPermissions.forEach(p => {
        if (!selectedPermissions.includes(p)) {
          onPermissionToggle(p)
        }
      })
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{category}</CardTitle>
          <Checkbox
            checked={allSelected}
            onCheckedChange={toggleAll}
          />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {Object.entries(permissions).map(([key, value]) => (
            <div key={value} className="flex items-center space-x-2">
              <Checkbox
                checked={selectedPermissions.includes(value)}
                onCheckedChange={() => onPermissionToggle(value)}
              />
              <Label className="text-sm cursor-pointer flex-1">
                {key.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
              </Label>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function CreateRoleDialog({ 
  isOpen, 
  onClose, 
  onSave,
  editRole
}: { 
  isOpen: boolean
  onClose: () => void 
  onSave: (role: Partial<Role>) => void
  editRole?: Role | null
}) {
  const [formData, setFormData] = useState({
    name: editRole?.name || '',
    description: editRole?.description || '',
    color: editRole?.color || '#6366f1',
    permissions: editRole?.permissions || []
  })

  const handlePermissionToggle = (permission: string) => {
    const newPermissions = formData.permissions.includes(permission)
      ? formData.permissions.filter(p => p !== permission)
      : [...formData.permissions, permission]
    
    setFormData({ ...formData, permissions: newPermissions })
  }

  const handleSubmit = () => {
    onSave({
      name: formData.name,
      description: formData.description,
      color: formData.color,
      permissions: formData.permissions
    })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{editRole ? 'Edit Role' : 'Create New Role'}</DialogTitle>
          <DialogDescription>
            {editRole ? 'Modify the role settings and permissions' : 'Create a new role with specific permissions'}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-6 p-1">
            {/* Basic Info */}
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="role-name">Role Name</Label>
                <Input
                  id="role-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter role name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role-description">Description</Label>
                <Textarea
                  id="role-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe this role"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role-color">Color</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="role-color"
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-20 h-10"
                  />
                  <Input
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="#6366f1"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Permissions */}
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium">Permissions</h4>
                <p className="text-sm text-muted-foreground">
                  Select which permissions this role should have
                </p>
              </div>
              
              <div className="grid gap-4">
                {Object.entries(ENHANCED_PERMISSIONS).map(([category, permissions]) => (
                  <PermissionCard
                    key={category}
                    category={category.replace(/_/g, ' ')}
                    permissions={permissions}
                    selectedPermissions={formData.permissions}
                    onPermissionToggle={handlePermissionToggle}
                  />
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!formData.name.trim()}>
            {editRole ? 'Save Changes' : 'Create Role'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function RoleManagement() {
  const [roles, setRoles] = useState<Role[]>(mockRoles)
  const [searchTerm, setSearchTerm] = useState('')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editRole, setEditRole] = useState<Role | null>(null)

  const filteredRoles = roles.filter(role => 
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCreateRole = (roleData: Partial<Role>) => {
    const newRole: Role = {
      id: Date.now().toString(),
      name: roleData.name!,
      description: roleData.description!,
      color: roleData.color!,
      userCount: 0,
      isDefault: false,
      isSystem: false,
      permissions: roleData.permissions!,
      createdAt: new Date().toISOString()
    }
    setRoles([...roles, newRole])
  }

  const handleEditRole = (roleData: Partial<Role>) => {
    if (!editRole) return
    
    setRoles(roles.map(role => 
      role.id === editRole.id 
        ? { ...role, ...roleData }
        : role
    ))
    setEditRole(null)
  }

  const handleDeleteRole = (id: string) => {
    setRoles(roles.filter(r => r.id !== id))
  }

  const handleDuplicateRole = (role: Role) => {
    const newRole: Role = {
      ...role,
      id: Date.now().toString(),
      name: `${role.name} (Copy)`,
      userCount: 0,
      isDefault: false,
      isSystem: false,
      createdAt: new Date().toISOString()
    }
    setRoles([...roles, newRole])
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Role Management</h2>
          <p className="text-muted-foreground">
            Manage user roles and permissions
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Users className="mr-2 h-4 w-4" />
            Assign Roles
          </Button>
          <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Role
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Roles</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roles.length}</div>
            <p className="text-xs text-muted-foreground">
              {roles.filter(r => r.isSystem).length} system roles
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {roles.reduce((sum, r) => sum + r.userCount, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all roles
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custom Roles</CardTitle>
            <Edit className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {roles.filter(r => !r.isSystem).length}
            </div>
            <p className="text-xs text-muted-foreground">
              User-created roles
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Default Role</CardTitle>
            <Lock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {roles.find(r => r.isDefault)?.userCount || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Default members
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Search Roles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search roles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardContent>
      </Card>

      {/* Roles Table */}
      <Card>
        <CardHeader>
          <CardTitle>Roles ({filteredRoles.length})</CardTitle>
          <CardDescription>
            Manage your forum's role hierarchy and permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRoles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: role.color }}
                      />
                      <div>
                        <div className="font-medium flex items-center space-x-2">
                          <span>{role.name}</span>
                          {role.isDefault && (
                            <Badge variant="secondary" className="text-xs">Default</Badge>
                          )}
                          {role.isSystem && (
                            <Badge variant="outline" className="text-xs">System</Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {role.description}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{role.userCount}</div>
                    <div className="text-xs text-muted-foreground">members</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{role.permissions.length}</div>
                    <div className="text-xs text-muted-foreground">permissions</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={role.isSystem ? 'secondary' : 'outline'}>
                      {role.isSystem ? 'System' : 'Custom'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(role.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => setEditRole(role)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Role
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicateRole(role)}>
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicate Role
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Users className="mr-2 h-4 w-4" />
                          View Members
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {!role.isSystem && (
                          <DropdownMenuItem 
                            onClick={() => handleDeleteRole(role.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Role
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Role Dialog */}
      <CreateRoleDialog
        isOpen={createDialogOpen || !!editRole}
        onClose={() => {
          setCreateDialogOpen(false)
          setEditRole(null)
        }}
        onSave={editRole ? handleEditRole : handleCreateRole}
        editRole={editRole}
      />
    </div>
  )
}