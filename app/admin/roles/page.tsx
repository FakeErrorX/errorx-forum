'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/admin/admin-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Edit, Trash2, Users, Shield, Settings } from 'lucide-react'
import { toast } from 'sonner'

interface Role {
  id: string
  name: string
  displayName: string
  description?: string
  color?: string
  isSystem: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
  permissions: {
    permission: {
      id: string
      name: string
      displayName: string
      category?: string
    }
  }[]
  _count: {
    users: number
  }
}

interface Permission {
  id: string
  name: string
  displayName: string
  description?: string
  category?: string
  isSystem: boolean
}

export default function AdminRolesPage() {
  return (
    <AdminLayout>
      <RolesPage />
    </AdminLayout>
  )
}

function RolesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  type SessionRole = { name: string }
  type SessionUserWithRole = { role?: SessionRole }
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Record<string, Permission[]>>({})
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    color: '#6b7280',
    permissions: [] as string[]
  })

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

    fetchRoles()
    fetchPermissions()
  }, [session, status, router])

  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/admin/roles')
      if (!response.ok) throw new Error('Failed to fetch roles')
      const data = await response.json()
      setRoles(data.roles)
    } catch (error) {
      console.error('Error fetching roles:', error)
      toast.error('Failed to fetch roles')
    } finally {
      setLoading(false)
    }
  }

  const fetchPermissions = async () => {
    try {
      const response = await fetch('/api/admin/permissions')
      if (!response.ok) throw new Error('Failed to fetch permissions')
      const data = await response.json()
      setPermissions(data.permissions)
    } catch (error) {
      console.error('Error fetching permissions:', error)
      toast.error('Failed to fetch permissions')
    }
  }

  const handleCreateRole = async () => {
    try {
      const response = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create role')
      }

      toast.success('Role created successfully')
      setIsCreateDialogOpen(false)
      resetForm()
      fetchRoles()
    } catch (error) {
      console.error('Error creating role:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create role')
    }
  }

  const handleUpdateRole = async () => {
    if (!editingRole) return

    try {
      const response = await fetch('/api/admin/roles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingRole.id,
          ...formData
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update role')
      }

      toast.success('Role updated successfully')
      setIsEditDialogOpen(false)
      setEditingRole(null)
      resetForm()
      fetchRoles()
    } catch (error) {
      console.error('Error updating role:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update role')
    }
  }

  const handleDeleteRole = async (roleId: string) => {
    try {
      const response = await fetch(`/api/admin/roles/${roleId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete role')
      }

      toast.success('Role deleted successfully')
      fetchRoles()
    } catch (error) {
      console.error('Error deleting role:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete role')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      displayName: '',
      description: '',
      color: '#6b7280',
      permissions: []
    })
  }

  const openEditDialog = (role: Role) => {
    setEditingRole(role)
    setFormData({
      name: role.name,
      displayName: role.displayName,
      description: role.description || '',
      color: role.color || '#6b7280',
      permissions: role.permissions.map(p => p.permission.name)
    })
    setIsEditDialogOpen(true)
  }

  const filteredRoles = roles.filter(role =>
    role.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Role Management</h1>
          <p className="text-gray-600">Manage user roles and permissions</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="w-4 h-4 mr-2" />
              Create Role
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Role</DialogTitle>
              <DialogDescription>
                Create a new role with specific permissions
              </DialogDescription>
            </DialogHeader>
            <RoleForm
              formData={formData}
              setFormData={setFormData}
              permissions={permissions}
              editingRole={editingRole}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateRole}>
                Create Role
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-6">
        <Input
          placeholder="Search roles..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="grid gap-4">
        {filteredRoles.map((role) => (
          <Card key={role.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: role.color }}
                  />
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {role.displayName}
                      {role.isSystem && (
                        <Badge variant="secondary" className="text-xs">
                          System
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {role.name} • {role._count.users} user(s)
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(role)}
                    disabled={role.isSystem}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={role.isSystem}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Role</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete the role &quot;{role.displayName}&quot;? 
                          This action cannot be undone and all users with this role will be affected.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteRole(role.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {role.description && (
                <p className="text-sm text-gray-600 mb-4">{role.description}</p>
              )}
              <div className="flex flex-wrap gap-2">
                {role.permissions.map(({ permission }) => (
                  <Badge key={permission.id} variant="outline" className="text-xs">
                    {permission.displayName}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Role Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
            <DialogDescription>
              Update role details and permissions
            </DialogDescription>
          </DialogHeader>
          <RoleForm
            formData={formData}
            setFormData={setFormData}
            permissions={permissions}
            editingRole={editingRole}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateRole}>
              Update Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

interface RoleFormProps {
  formData: {
    name: string
    displayName: string
    description: string
    color: string
    permissions: string[]
  }
  setFormData: (data: {
    name: string
    displayName: string
    description: string
    color: string
    permissions: string[]
  }) => void
  permissions: Record<string, Permission[]>
  editingRole?: Role | null
}

function RoleForm({ formData, setFormData, permissions, editingRole }: RoleFormProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('')

  const handlePermissionToggle = (permissionName: string, checked: boolean) => {
    if (checked) {
      setFormData({
        ...formData,
        permissions: [...formData.permissions, permissionName]
      })
    } else {
      setFormData({
        ...formData,
        permissions: formData.permissions.filter(p => p !== permissionName)
      })
    }
  }

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category)
  }

  const handleSelectAllInCategory = (category: string, checked: boolean) => {
    const categoryPermissions = permissions[category] || []
    const categoryPermissionNames = categoryPermissions.map(p => p.name)
    
    if (checked) {
      const newPermissions = [...new Set([...formData.permissions, ...categoryPermissionNames])]
      setFormData({ ...formData, permissions: newPermissions })
    } else {
      const newPermissions = formData.permissions.filter(p => !categoryPermissionNames.includes(p))
      setFormData({ ...formData, permissions: newPermissions })
    }
  }

  const isCategoryFullySelected = (category: string) => {
    const categoryPermissions = permissions[category] || []
    return categoryPermissions.every(p => formData.permissions.includes(p.name))
  }

  const isCategoryPartiallySelected = (category: string) => {
    const categoryPermissions = permissions[category] || []
    const selectedInCategory = categoryPermissions.filter(p => formData.permissions.includes(p.name))
    return selectedInCategory.length > 0 && selectedInCategory.length < categoryPermissions.length
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Role Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., moderator"
            disabled={editingRole?.isSystem}
          />
        </div>
        <div>
          <Label htmlFor="displayName">Display Name</Label>
          <Input
            id="displayName"
            value={formData.displayName}
            onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
            placeholder="e.g., Moderator"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe this role's purpose..."
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="color">Color</Label>
        <div className="flex items-center gap-2">
          <Input
            id="color"
            type="color"
            value={formData.color}
            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
            className="w-16 h-10"
          />
          <Input
            value={formData.color}
            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
            placeholder="#6b7280"
            className="flex-1"
          />
        </div>
      </div>

      <div>
        <Label>Permissions</Label>
        <Tabs value={selectedCategory} onValueChange={handleCategorySelect} className="mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="">All Permissions</TabsTrigger>
            <TabsTrigger value="admin">Admin</TabsTrigger>
          </TabsList>
          
          <TabsContent value="" className="space-y-4">
            {Object.entries(permissions).map(([category, categoryPermissions]) => (
              <div key={category} className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium capitalize">{category}</h4>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={isCategoryFullySelected(category)}
                      ref={(el: HTMLButtonElement | null) => {
                        if (el) {
                          (el as unknown as { indeterminate: boolean }).indeterminate = isCategoryPartiallySelected(category)
                        }
                      }}
                      onCheckedChange={(checked) => handleSelectAllInCategory(category, checked as boolean)}
                    />
                    <span className="text-sm text-gray-600">Select All</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 ml-4">
                  {categoryPermissions.map((permission) => (
                    <div key={permission.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={permission.id}
                        checked={formData.permissions.includes(permission.name)}
                        onCheckedChange={(checked) => handlePermissionToggle(permission.name, checked as boolean)}
                      />
                      <Label htmlFor={permission.id} className="text-sm">
                        {permission.displayName}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
