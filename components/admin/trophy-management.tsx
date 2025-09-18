'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
import { Switch } from '@/components/ui/switch'
import { 
  Trophy,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Search,
  Users,
  Star,
  Award,
  Target
} from 'lucide-react'

interface TrophyData {
  id: string
  name: string
  description: string
  icon: string
  criteria: string
  type: 'automatic' | 'manual'
  isActive: boolean
  awardedCount: number
  createdAt: string
  conditions: {
    postCount?: number
    reputationPoints?: number
    daysRegistered?: number
    trophiesReceived?: number
  }
}

// Mock data
const mockTrophies: TrophyData[] = [
  {
    id: '1',
    name: 'First Post',
    description: 'Awarded for making your first post',
    icon: '🎯',
    criteria: 'Make your first post',
    type: 'automatic',
    isActive: true,
    awardedCount: 234,
    createdAt: '2024-01-01',
    conditions: { postCount: 1 }
  },
  {
    id: '2',
    name: 'Veteran Member',
    description: 'Awarded for being a member for 1 year',
    icon: '🏆',
    criteria: 'Registered for 365 days',
    type: 'automatic',
    isActive: true,
    awardedCount: 45,
    createdAt: '2024-01-01',
    conditions: { daysRegistered: 365 }
  },
  {
    id: '3',
    name: 'Community Helper',
    description: 'Awarded for outstanding community support',
    icon: '⭐',
    criteria: 'Manual award for exceptional help',
    type: 'manual',
    isActive: true,
    awardedCount: 12,
    createdAt: '2024-01-01',
    conditions: {}
  }
]

function TrophyIcon({ icon }: { icon: string }) {
  return (
    <div className="w-10 h-10 flex items-center justify-center bg-muted rounded-lg text-lg">
      {icon}
    </div>
  )
}

function TrophyTypebadge({ type }: { type: 'automatic' | 'manual' }) {
  return (
    <Badge variant={type === 'automatic' ? 'secondary' : 'outline'}>
      {type === 'automatic' ? 'Auto' : 'Manual'}
    </Badge>
  )
}

function CreateTrophyDialog({ 
  isOpen, 
  onClose, 
  onSave 
}: { 
  isOpen: boolean
  onClose: () => void 
  onSave: (trophy: Partial<TrophyData>) => void
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '🏆',
    type: 'automatic' as 'automatic' | 'manual',
    isActive: true,
    postCount: '',
    reputationPoints: '',
    daysRegistered: '',
    trophiesReceived: ''
  })

  const handleSubmit = () => {
    const conditions: any = {}
    if (formData.postCount) conditions.postCount = parseInt(formData.postCount)
    if (formData.reputationPoints) conditions.reputationPoints = parseInt(formData.reputationPoints)
    if (formData.daysRegistered) conditions.daysRegistered = parseInt(formData.daysRegistered)
    if (formData.trophiesReceived) conditions.trophiesReceived = parseInt(formData.trophiesReceived)

    const trophy: Partial<TrophyData> = {
      name: formData.name,
      description: formData.description,
      icon: formData.icon,
      type: formData.type,
      isActive: formData.isActive,
      conditions
    }

    onSave(trophy)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Trophy</DialogTitle>
          <DialogDescription>
            Create a new trophy to reward your community members
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="trophy-name">Trophy Name</Label>
            <Input
              id="trophy-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter trophy name"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="trophy-description">Description</Label>
            <Textarea
              id="trophy-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe what this trophy is for"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="trophy-icon">Icon</Label>
              <Input
                id="trophy-icon"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                placeholder="🏆"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="trophy-type">Type</Label>
              <Select 
                value={formData.type} 
                onValueChange={(value: 'automatic' | 'manual') => 
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="automatic">Automatic</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {formData.type === 'automatic' && (
            <div className="space-y-4">
              <Label>Award Conditions (at least one required)</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="post-count">Minimum Posts</Label>
                  <Input
                    id="post-count"
                    type="number"
                    value={formData.postCount}
                    onChange={(e) => setFormData({ ...formData, postCount: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="reputation">Reputation Points</Label>
                  <Input
                    id="reputation"
                    type="number"
                    value={formData.reputationPoints}
                    onChange={(e) => setFormData({ ...formData, reputationPoints: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="days-registered">Days Registered</Label>
                  <Input
                    id="days-registered"
                    type="number"
                    value={formData.daysRegistered}
                    onChange={(e) => setFormData({ ...formData, daysRegistered: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="trophies-received">Trophies Received</Label>
                  <Input
                    id="trophies-received"
                    type="number"
                    value={formData.trophiesReceived}
                    onChange={(e) => setFormData({ ...formData, trophiesReceived: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Switch
              id="trophy-active"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
            />
            <Label htmlFor="trophy-active">Active</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!formData.name.trim()}>
            Create Trophy
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function TrophyManagement() {
  const [trophies, setTrophies] = useState<TrophyData[]>(mockTrophies)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  const filteredTrophies = trophies.filter(trophy => {
    const matchesSearch = trophy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trophy.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === 'all' || trophy.type === typeFilter
    
    return matchesSearch && matchesType
  })

  const handleCreateTrophy = (trophy: Partial<TrophyData>) => {
    const newTrophy: TrophyData = {
      id: Date.now().toString(),
      name: trophy.name!,
      description: trophy.description!,
      icon: trophy.icon!,
      criteria: generateCriteria(trophy.conditions!),
      type: trophy.type!,
      isActive: trophy.isActive!,
      awardedCount: 0,
      createdAt: new Date().toISOString(),
      conditions: trophy.conditions!
    }
    setTrophies([...trophies, newTrophy])
  }

  const generateCriteria = (conditions: any): string => {
    const parts = []
    if (conditions.postCount) parts.push(`${conditions.postCount} posts`)
    if (conditions.reputationPoints) parts.push(`${conditions.reputationPoints} reputation`)
    if (conditions.daysRegistered) parts.push(`${conditions.daysRegistered} days registered`)
    if (conditions.trophiesReceived) parts.push(`${conditions.trophiesReceived} trophies`)
    return parts.join(', ') || 'Manual award'
  }

  const handleDeleteTrophy = (id: string) => {
    setTrophies(trophies.filter(t => t.id !== id))
  }

  const handleToggleActive = (id: string) => {
    setTrophies(trophies.map(t => 
      t.id === id ? { ...t, isActive: !t.isActive } : t
    ))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Trophy Management</h2>
          <p className="text-muted-foreground">
            Create and manage trophies to reward your community
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Users className="mr-2 h-4 w-4" />
            Award Manually
          </Button>
          <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Trophy
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Trophies</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trophies.length}</div>
            <p className="text-xs text-muted-foreground">
              {trophies.filter(t => t.isActive).length} active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Awards Given</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {trophies.reduce((sum, t) => sum + t.awardedCount, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all trophies
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Auto Trophies</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {trophies.filter(t => t.type === 'automatic').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Automated awards
            </p>
          </CardContent>
        </Card>
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
                  placeholder="Search trophies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="automatic">Automatic</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Trophies Table */}
      <Card>
        <CardHeader>
          <CardTitle>Trophies ({filteredTrophies.length})</CardTitle>
          <CardDescription>
            Manage your forum's trophy system and rewards
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Trophy</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Criteria</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Awarded</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTrophies.map((trophy) => (
                <TableRow key={trophy.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <TrophyIcon icon={trophy.icon} />
                      <div>
                        <div className="font-medium">{trophy.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {trophy.description}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <TrophyTypebadge type={trophy.type} />
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <div className="text-sm">{trophy.criteria}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={trophy.isActive ? 'secondary' : 'outline'}>
                      {trophy.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{trophy.awardedCount}</div>
                    <div className="text-xs text-muted-foreground">times</div>
                  </TableCell>
                  <TableCell>
                    {new Date(trophy.createdAt).toLocaleDateString()}
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
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Trophy
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleActive(trophy.id)}>
                          <Star className="mr-2 h-4 w-4" />
                          {trophy.isActive ? 'Deactivate' : 'Activate'}
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Users className="mr-2 h-4 w-4" />
                          View Recipients
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDeleteTrophy(trophy.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Trophy
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

      {/* Create Trophy Dialog */}
      <CreateTrophyDialog
        isOpen={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSave={handleCreateTrophy}
      />
    </div>
  )
}