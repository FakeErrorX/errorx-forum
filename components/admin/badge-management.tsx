'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Award } from 'lucide-react';

interface BadgeManagementProps {
  onBadgeCreate?: (badge: any) => void;
  onBadgeUpdate?: (badgeId: string, badge: any) => void;
  onBadgeDelete?: (badgeId: string) => void;
}

export default function BadgeManagement({
  onBadgeCreate,
  onBadgeUpdate,
  onBadgeDelete,
}: BadgeManagementProps) {
  const [badges, setBadges] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingBadge, setEditingBadge] = useState<any>(null);

  const [badgeForm, setBadgeForm] = useState({
    name: '',
    displayName: '',
    description: '',
    icon: '',
    color: '',
    category: '',
    rarity: 'COMMON',
    points: 0,
    requirements: {},
  });

  useEffect(() => {
    fetchBadges();
  }, []);

  const fetchBadges = async () => {
    try {
      const response = await fetch('/api/admin/badges');
      const data = await response.json();
      setBadges(data);
    } catch (error) {
      console.error('Failed to fetch badges:', error);
    }
  };

  const resetForm = () => {
    setBadgeForm({
      name: '',
      displayName: '',
      description: '',
      icon: '',
      color: '',
      category: '',
      rarity: 'COMMON',
      points: 0,
      requirements: {},
    });
    setEditingBadge(null);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const method = editingBadge ? 'PATCH' : 'POST';
      const url = editingBadge 
        ? `/api/admin/badges/${editingBadge.id}` 
        : '/api/admin/badges';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(badgeForm),
      });

      if (response.ok) {
        const badge = await response.json();
        
        if (editingBadge) {
          setBadges(prev => prev.map((b: any) => 
            b.id === editingBadge.id ? badge : b
          ));
          onBadgeUpdate?.(editingBadge.id, badge);
        } else {
          setBadges(prev => [badge, ...prev]);
          onBadgeCreate?.(badge);
        }
        
        setShowCreateDialog(false);
        resetForm();
      }
    } catch (error) {
      console.error('Failed to save badge:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (badge: any) => {
    setBadgeForm({
      name: badge.name,
      displayName: badge.displayName,
      description: badge.description,
      icon: badge.icon || '',
      color: badge.color || '',
      category: badge.category || '',
      rarity: badge.rarity || 'COMMON',
      points: badge.points || 0,
      requirements: badge.requirements || {},
    });
    setEditingBadge(badge);
    setShowCreateDialog(true);
  };

  const handleDelete = async (badgeId: string) => {
    if (!confirm('Are you sure you want to delete this badge?')) return;

    try {
      const response = await fetch(`/api/admin/badges/${badgeId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setBadges(prev => prev.filter((b: any) => b.id !== badgeId));
        onBadgeDelete?.(badgeId);
      }
    } catch (error) {
      console.error('Failed to delete badge:', error);
    }
  };

  const rarityColors = {
    COMMON: 'bg-gray-500',
    UNCOMMON: 'bg-green-500',
    RARE: 'bg-blue-500',
    EPIC: 'bg-purple-500',
    LEGENDARY: 'bg-orange-500',
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Badge Management
              </CardTitle>
              <CardDescription>
                Create and manage user achievement badges
              </CardDescription>
            </div>
            <Dialog open={showCreateDialog} onOpenChange={(open) => {
              setShowCreateDialog(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Badge
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingBadge ? 'Edit Badge' : 'Create New Badge'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingBadge 
                      ? 'Update badge details and requirements'
                      : 'Create a new achievement badge for users'
                    }
                  </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Name (System)</Label>
                    <Input
                      id="name"
                      value={badgeForm.name}
                      onChange={(e) => setBadgeForm(prev => ({ 
                        ...prev, name: e.target.value 
                      }))}
                      placeholder="badge_name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input
                      id="displayName"
                      value={badgeForm.displayName}
                      onChange={(e) => setBadgeForm(prev => ({ 
                        ...prev, displayName: e.target.value 
                      }))}
                      placeholder="Badge Name"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={badgeForm.description}
                      onChange={(e) => setBadgeForm(prev => ({ 
                        ...prev, description: e.target.value 
                      }))}
                      placeholder="Description of what this badge represents..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="icon">Icon</Label>
                    <Input
                      id="icon"
                      value={badgeForm.icon}
                      onChange={(e) => setBadgeForm(prev => ({ 
                        ...prev, icon: e.target.value 
                      }))}
                      placeholder="🏆 or icon URL"
                    />
                  </div>
                  <div>
                    <Label htmlFor="color">Color</Label>
                    <Input
                      id="color"
                      type="color"
                      value={badgeForm.color}
                      onChange={(e) => setBadgeForm(prev => ({ 
                        ...prev, color: e.target.value 
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      value={badgeForm.category}
                      onChange={(e) => setBadgeForm(prev => ({ 
                        ...prev, category: e.target.value 
                      }))}
                      placeholder="e.g., Participation, Achievement, Special"
                    />
                  </div>
                  <div>
                    <Label htmlFor="rarity">Rarity</Label>
                    <Select value={badgeForm.rarity} onValueChange={(value) => 
                      setBadgeForm(prev => ({ ...prev, rarity: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="COMMON">Common</SelectItem>
                        <SelectItem value="UNCOMMON">Uncommon</SelectItem>
                        <SelectItem value="RARE">Rare</SelectItem>
                        <SelectItem value="EPIC">Epic</SelectItem>
                        <SelectItem value="LEGENDARY">Legendary</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="points">Reputation Points</Label>
                    <Input
                      id="points"
                      type="number"
                      value={badgeForm.points}
                      onChange={(e) => setBadgeForm(prev => ({ 
                        ...prev, points: parseInt(e.target.value) || 0 
                      }))}
                      placeholder="0"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSubmit}
                    disabled={isLoading || !badgeForm.name || !badgeForm.displayName}
                  >
                    {isLoading 
                      ? (editingBadge ? 'Updating...' : 'Creating...') 
                      : (editingBadge ? 'Update Badge' : 'Create Badge')
                    }
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {badges.map((badge: any) => (
              <Card key={badge.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {badge.icon && (
                        <span className="text-2xl">{badge.icon}</span>
                      )}
                      <div>
                        <CardTitle className="text-lg">{badge.displayName}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge 
                            variant="secondary"
                            className={`text-white ${rarityColors[badge.rarity as keyof typeof rarityColors]}`}
                          >
                            {badge.rarity}
                          </Badge>
                          {badge.points > 0 && (
                            <Badge variant="outline">
                              +{badge.points} points
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(badge)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(badge.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">
                    {badge.description}
                  </p>
                  {badge.category && (
                    <Badge variant="outline" className="text-xs">
                      {badge.category}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {badges.length === 0 && (
            <div className="text-center py-8">
              <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No badges created yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first achievement badge to get started.
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Badge
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}