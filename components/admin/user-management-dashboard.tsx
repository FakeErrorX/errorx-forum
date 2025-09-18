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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Shield, AlertTriangle, Award, Activity, Settings } from 'lucide-react';

interface UserManagementDashboardProps {
  users: any[];
  onUserUpdate: (userId: string, action: string, data?: any) => void;
}

export default function UserManagementDashboard({
  users,
  onUserUpdate,
}: UserManagementDashboardProps) {
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [showWarnDialog, setShowWarnDialog] = useState(false);
  const [showBadgeDialog, setShowBadgeDialog] = useState(false);

  const [banForm, setBanForm] = useState({
    type: 'ACCOUNT',
    reason: '',
    publicReason: '',
    duration: '',
    ipAddress: '',
  });

  const [warnForm, setWarnForm] = useState({
    type: 'CONTENT_VIOLATION',
    reason: '',
    publicReason: '',
    expiresAt: '',
  });

  const [badgeForm, setBadgeForm] = useState({
    badgeId: '',
    reason: '',
  });

  const [availableBadges, setAvailableBadges] = useState([]);

  useEffect(() => {
    // Fetch available badges
    fetch('/api/admin/badges')
      .then(res => res.json())
      .then(data => setAvailableBadges(data))
      .catch(console.error);
  }, []);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filterStatus === 'banned') return matchesSearch && user.isBanned;
    if (filterStatus === 'verified') return matchesSearch && user.isVerified;
    if (filterStatus === 'unverified') return matchesSearch && !user.isVerified;
    
    return matchesSearch;
  });

  const handleBanUser = async () => {
    if (!selectedUser) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/users/bans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          ...banForm,
          duration: banForm.duration ? parseInt(banForm.duration) : undefined,
        }),
      });

      if (response.ok) {
        onUserUpdate(selectedUser.id, 'ban', banForm);
        setShowBanDialog(false);
        setBanForm({
          type: 'ACCOUNT',
          reason: '',
          publicReason: '',
          duration: '',
          ipAddress: '',
        });
      }
    } catch (error) {
      console.error('Failed to ban user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWarnUser = async () => {
    if (!selectedUser) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/users/warnings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          ...warnForm,
        }),
      });

      if (response.ok) {
        onUserUpdate(selectedUser.id, 'warn', warnForm);
        setShowWarnDialog(false);
        setWarnForm({
          type: 'CONTENT_VIOLATION',
          reason: '',
          publicReason: '',
          expiresAt: '',
        });
      }
    } catch (error) {
      console.error('Failed to warn user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAwardBadge = async () => {
    if (!selectedUser) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/${selectedUser.id}/badges`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(badgeForm),
      });

      if (response.ok) {
        onUserUpdate(selectedUser.id, 'badge', badgeForm);
        setShowBadgeDialog(false);
        setBadgeForm({ badgeId: '', reason: '' });
      }
    } catch (error) {
      console.error('Failed to award badge:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            User Management Dashboard
          </CardTitle>
          <CardDescription>
            Manage users, their permissions, and moderation actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search users by username or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="unverified">Unverified</SelectItem>
                <SelectItem value="banned">Banned</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reputation</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{user.username || user.name}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {user.isVerified && (
                        <Badge variant="secondary">Verified</Badge>
                      )}
                      {user.isBanned && (
                        <Badge variant="destructive">Banned</Badge>
                      )}
                      {user.role && (
                        <Badge variant="outline">{user.role.name}</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{user.reputation || 0}</TableCell>
                  <TableCell>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Dialog open={showBanDialog && selectedUser?.id === user.id} onOpenChange={(open) => {
                        setShowBanDialog(open);
                        if (open) setSelectedUser(user);
                      }}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Shield className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Ban User</DialogTitle>
                            <DialogDescription>
                              Ban {user.username || user.name} from the forum
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="ban-type">Ban Type</Label>
                              <Select value={banForm.type} onValueChange={(value) => 
                                setBanForm(prev => ({ ...prev, type: value }))
                              }>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="ACCOUNT">Account Ban</SelectItem>
                                  <SelectItem value="IP">IP Ban</SelectItem>
                                  <SelectItem value="POSTING">Posting Ban</SelectItem>
                                  <SelectItem value="MESSAGING">Messaging Ban</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="ban-reason">Internal Reason</Label>
                              <Textarea
                                id="ban-reason"
                                value={banForm.reason}
                                onChange={(e) => setBanForm(prev => ({ 
                                  ...prev, reason: e.target.value 
                                }))}
                                placeholder="Internal reason for ban..."
                              />
                            </div>
                            <div>
                              <Label htmlFor="ban-public">Public Reason</Label>
                              <Textarea
                                id="ban-public"
                                value={banForm.publicReason}
                                onChange={(e) => setBanForm(prev => ({ 
                                  ...prev, publicReason: e.target.value 
                                }))}
                                placeholder="Public reason shown to user..."
                              />
                            </div>
                            <div>
                              <Label htmlFor="ban-duration">Duration (days)</Label>
                              <Input
                                id="ban-duration"
                                type="number"
                                value={banForm.duration}
                                onChange={(e) => setBanForm(prev => ({ 
                                  ...prev, duration: e.target.value 
                                }))}
                                placeholder="Leave empty for permanent"
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setShowBanDialog(false)}>
                              Cancel
                            </Button>
                            <Button 
                              variant="destructive" 
                              onClick={handleBanUser}
                              disabled={isLoading || !banForm.reason}
                            >
                              {isLoading ? 'Banning...' : 'Ban User'}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      <Dialog open={showWarnDialog && selectedUser?.id === user.id} onOpenChange={(open) => {
                        setShowWarnDialog(open);
                        if (open) setSelectedUser(user);
                      }}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-yellow-600 hover:text-yellow-700"
                          >
                            <AlertTriangle className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Warn User</DialogTitle>
                            <DialogDescription>
                              Issue a warning to {user.username || user.name}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="warn-type">Warning Type</Label>
                              <Select value={warnForm.type} onValueChange={(value) => 
                                setWarnForm(prev => ({ ...prev, type: value }))
                              }>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="CONTENT_VIOLATION">Content Violation</SelectItem>
                                  <SelectItem value="BEHAVIOR_WARNING">Behavior Warning</SelectItem>
                                  <SelectItem value="SPAM_WARNING">Spam Warning</SelectItem>
                                  <SelectItem value="GUIDELINE_REMINDER">Guideline Reminder</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="warn-reason">Internal Reason</Label>
                              <Textarea
                                id="warn-reason"
                                value={warnForm.reason}
                                onChange={(e) => setWarnForm(prev => ({ 
                                  ...prev, reason: e.target.value 
                                }))}
                                placeholder="Internal reason for warning..."
                              />
                            </div>
                            <div>
                              <Label htmlFor="warn-public">Public Reason</Label>
                              <Textarea
                                id="warn-public"
                                value={warnForm.publicReason}
                                onChange={(e) => setWarnForm(prev => ({ 
                                  ...prev, publicReason: e.target.value 
                                }))}
                                placeholder="Public reason shown to user..."
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setShowWarnDialog(false)}>
                              Cancel
                            </Button>
                            <Button 
                              onClick={handleWarnUser}
                              disabled={isLoading || !warnForm.reason}
                            >
                              {isLoading ? 'Warning...' : 'Issue Warning'}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      <Dialog open={showBadgeDialog && selectedUser?.id === user.id} onOpenChange={(open) => {
                        setShowBadgeDialog(open);
                        if (open) setSelectedUser(user);
                      }}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Award className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Award Badge</DialogTitle>
                            <DialogDescription>
                              Award a badge to {user.username || user.name}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="badge-select">Badge</Label>
                              <Select value={badgeForm.badgeId} onValueChange={(value) => 
                                setBadgeForm(prev => ({ ...prev, badgeId: value }))
                              }>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a badge" />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableBadges.map((badge: any) => (
                                    <SelectItem key={badge.id} value={badge.id}>
                                      {badge.displayName}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="badge-reason">Reason</Label>
                              <Textarea
                                id="badge-reason"
                                value={badgeForm.reason}
                                onChange={(e) => setBadgeForm(prev => ({ 
                                  ...prev, reason: e.target.value 
                                }))}
                                placeholder="Reason for awarding this badge..."
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setShowBadgeDialog(false)}>
                              Cancel
                            </Button>
                            <Button 
                              onClick={handleAwardBadge}
                              disabled={isLoading || !badgeForm.badgeId}
                            >
                              {isLoading ? 'Awarding...' : 'Award Badge'}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {/* View user details */}}
                      >
                        <Activity className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}