"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Bell, 
  Eye, 
  Lock, 
  Trash2, 
  Download, 
  AlertTriangle,
  Smartphone,
  Mail,
  Globe,
  Users,
  MessageSquare,
  Heart,
  UserCheck,
  Settings,
  Database
} from 'lucide-react';
import { toast } from 'sonner';

interface UserSettings {
  // Privacy Settings
  privacy: {
    showOnline: boolean;
    showEmail: boolean;
    showBirthday: boolean;
    showLocation: boolean;
    allowProfileViews: boolean;
    allowDirectMessages: boolean;
    allowMentions: boolean;
    searchableProfile: boolean;
    showActivity: boolean;
  };
  
  // Notification Preferences
  notifications: {
    email: {
      mentions: boolean;
      replies: boolean;
      follows: boolean;
      likes: boolean;
      messages: boolean;
      newsletters: boolean;
      digest: boolean;
      security: boolean;
    };
    push: {
      mentions: boolean;
      replies: boolean;
      follows: boolean;
      likes: boolean;
      messages: boolean;
      system: boolean;
    };
    frequency: {
      digestFrequency: 'never' | 'daily' | 'weekly' | 'monthly';
      quietHours: {
        enabled: boolean;
        start: string;
        end: string;
      };
    };
  };
  
  // Content & Display
  content: {
    theme: 'light' | 'dark' | 'system';
    language: string;
    timezone: string;
    postsPerPage: number;
    showImages: boolean;
    showAvatars: boolean;
    autoPlayVideos: boolean;
    compactMode: boolean;
  };
  
  // Security Settings
  security: {
    twoFactorEnabled: boolean;
    loginNotifications: boolean;
    sessionTimeout: number;
    trustedDevices: string[];
  };
}

interface EnhancedSettingsProps {
  settings: UserSettings;
  onSave: (section: keyof UserSettings, data: any) => Promise<void>;
  isLoading?: boolean;
}

const languages = [
  { code: 'en', name: 'English' },
];

const timezones = [
  'UTC',
  'Asia/Dhaka',
];

export function EnhancedSettings({ settings, onSave, isLoading = false }: EnhancedSettingsProps) {
  const [localSettings, setLocalSettings] = useState(settings);
  const [activeTab, setActiveTab] = useState('privacy');
  const [saving, setSaving] = useState<string | null>(null);

  const updateLocalSetting = (section: keyof UserSettings, path: string, value: any) => {
    setLocalSettings(prev => {
      const newSettings = { ...prev };
      const keys = path.split('.');
      let current: any = newSettings[section];
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newSettings;
    });
  };

  const saveSection = async (section: keyof UserSettings) => {
    setSaving(section);
    try {
      await onSave(section, localSettings[section]);
      toast.success(`${section.charAt(0).toUpperCase() + section.slice(1)} settings saved`);
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(null);
    }
  };

  const exportData = async () => {
    try {
      const response = await fetch('/api/users/export');
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'my-data.json';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Data exported successfully');
      }
    } catch (error) {
      toast.error('Failed to export data');
    }
  };

  const deleteAccount = async () => {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try {
        const response = await fetch('/api/users/delete', { method: 'DELETE' });
        if (response.ok) {
          toast.success('Account deletion initiated');
          // Redirect to home page
          window.location.href = '/';
        }
      } catch (error) {
        toast.error('Failed to delete account');
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your account preferences and privacy</p>
        </div>
        <Settings className="h-8 w-8 text-muted-foreground" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="privacy" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Privacy
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Display
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Security
          </TabsTrigger>
        </TabsList>

        {/* Privacy Settings */}
        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Profile Visibility
              </CardTitle>
              <CardDescription>
                Control who can see your profile information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show online status</Label>
                  <p className="text-sm text-muted-foreground">
                    Let others see when you're online
                  </p>
                </div>
                <Switch
                  checked={localSettings.privacy.showOnline}
                  onCheckedChange={(checked) => updateLocalSetting('privacy', 'showOnline', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show email address</Label>
                  <p className="text-sm text-muted-foreground">
                    Display your email on your public profile
                  </p>
                </div>
                <Switch
                  checked={localSettings.privacy.showEmail}
                  onCheckedChange={(checked) => updateLocalSetting('privacy', 'showEmail', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show birthday</Label>
                  <p className="text-sm text-muted-foreground">
                    Display your birthday on your profile
                  </p>
                </div>
                <Switch
                  checked={localSettings.privacy.showBirthday}
                  onCheckedChange={(checked) => updateLocalSetting('privacy', 'showBirthday', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show location</Label>
                  <p className="text-sm text-muted-foreground">
                    Display your location on your profile
                  </p>
                </div>
                <Switch
                  checked={localSettings.privacy.showLocation}
                  onCheckedChange={(checked) => updateLocalSetting('privacy', 'showLocation', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Searchable profile</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow your profile to appear in search results
                  </p>
                </div>
                <Switch
                  checked={localSettings.privacy.searchableProfile}
                  onCheckedChange={(checked) => updateLocalSetting('privacy', 'searchableProfile', checked)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Interaction Permissions
              </CardTitle>
              <CardDescription>
                Control how others can interact with you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Allow direct messages</Label>
                  <p className="text-sm text-muted-foreground">
                    Let others send you private messages
                  </p>
                </div>
                <Switch
                  checked={localSettings.privacy.allowDirectMessages}
                  onCheckedChange={(checked) => updateLocalSetting('privacy', 'allowDirectMessages', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Allow mentions</Label>
                  <p className="text-sm text-muted-foreground">
                    Let others mention you in posts and comments
                  </p>
                </div>
                <Switch
                  checked={localSettings.privacy.allowMentions}
                  onCheckedChange={(checked) => updateLocalSetting('privacy', 'allowMentions', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Allow profile views</Label>
                  <p className="text-sm text-muted-foreground">
                    Let others view your full profile
                  </p>
                </div>
                <Switch
                  checked={localSettings.privacy.allowProfileViews}
                  onCheckedChange={(checked) => updateLocalSetting('privacy', 'allowProfileViews', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show activity</Label>
                  <p className="text-sm text-muted-foreground">
                    Display your recent activity on your profile
                  </p>
                </div>
                <Switch
                  checked={localSettings.privacy.showActivity}
                  onCheckedChange={(checked) => updateLocalSetting('privacy', 'showActivity', checked)}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button 
              onClick={() => saveSection('privacy')} 
              disabled={saving === 'privacy'}
            >
              {saving === 'privacy' ? 'Saving...' : 'Save Privacy Settings'}
            </Button>
          </div>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Notifications
              </CardTitle>
              <CardDescription>
                Choose what email notifications you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4" />
                    Mentions
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    When someone mentions you in a post or comment
                  </p>
                </div>
                <Switch
                  checked={localSettings.notifications.email.mentions}
                  onCheckedChange={(checked) => updateLocalSetting('notifications', 'email.mentions', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Replies
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    When someone replies to your posts or comments
                  </p>
                </div>
                <Switch
                  checked={localSettings.notifications.email.replies}
                  onCheckedChange={(checked) => updateLocalSetting('notifications', 'email.replies', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    New followers
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    When someone starts following you
                  </p>
                </div>
                <Switch
                  checked={localSettings.notifications.email.follows}
                  onCheckedChange={(checked) => updateLocalSetting('notifications', 'email.follows', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    Likes and reactions
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    When someone likes or reacts to your content
                  </p>
                </div>
                <Switch
                  checked={localSettings.notifications.email.likes}
                  onCheckedChange={(checked) => updateLocalSetting('notifications', 'email.likes', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Direct messages</Label>
                  <p className="text-sm text-muted-foreground">
                    When you receive a new private message
                  </p>
                </div>
                <Switch
                  checked={localSettings.notifications.email.messages}
                  onCheckedChange={(checked) => updateLocalSetting('notifications', 'email.messages', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Security alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Important security and account notifications
                  </p>
                </div>
                <Switch
                  checked={localSettings.notifications.email.security}
                  onCheckedChange={(checked) => updateLocalSetting('notifications', 'email.security', checked)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Push Notifications
              </CardTitle>
              <CardDescription>
                Manage real-time notifications in your browser
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Mentions</Label>
                  <p className="text-sm text-muted-foreground">
                    Instant notifications for mentions
                  </p>
                </div>
                <Switch
                  checked={localSettings.notifications.push.mentions}
                  onCheckedChange={(checked) => updateLocalSetting('notifications', 'push.mentions', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Replies</Label>
                  <p className="text-sm text-muted-foreground">
                    Instant notifications for replies
                  </p>
                </div>
                <Switch
                  checked={localSettings.notifications.push.replies}
                  onCheckedChange={(checked) => updateLocalSetting('notifications', 'push.replies', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Direct messages</Label>
                  <p className="text-sm text-muted-foreground">
                    Instant notifications for messages
                  </p>
                </div>
                <Switch
                  checked={localSettings.notifications.push.messages}
                  onCheckedChange={(checked) => updateLocalSetting('notifications', 'push.messages', checked)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notification Frequency</CardTitle>
              <CardDescription>
                Control how often you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Email digest frequency</Label>
                <Select 
                  value={localSettings.notifications.frequency.digestFrequency} 
                  onValueChange={(value: any) => updateLocalSetting('notifications', 'frequency.digestFrequency', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="never">Never</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Quiet hours</Label>
                    <p className="text-sm text-muted-foreground">
                      Disable notifications during specified hours
                    </p>
                  </div>
                  <Switch
                    checked={localSettings.notifications.frequency.quietHours.enabled}
                    onCheckedChange={(checked) => updateLocalSetting('notifications', 'frequency.quietHours.enabled', checked)}
                  />
                </div>

                {localSettings.notifications.frequency.quietHours.enabled && (
                  <div className="grid grid-cols-2 gap-4 ml-6">
                    <div className="space-y-2">
                      <Label>Start time</Label>
                      <Input
                        type="time"
                        value={localSettings.notifications.frequency.quietHours.start}
                        onChange={(e) => updateLocalSetting('notifications', 'frequency.quietHours.start', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End time</Label>
                      <Input
                        type="time"
                        value={localSettings.notifications.frequency.quietHours.end}
                        onChange={(e) => updateLocalSetting('notifications', 'frequency.quietHours.end', e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button 
              onClick={() => saveSection('notifications')} 
              disabled={saving === 'notifications'}
            >
              {saving === 'notifications' ? 'Saving...' : 'Save Notification Settings'}
            </Button>
          </div>
        </TabsContent>

        {/* Content & Display Settings */}
        <TabsContent value="content" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Language & Region
              </CardTitle>
              <CardDescription>
                Set your preferred language and timezone
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Language</Label>
                  <Select 
                    value={localSettings.content.language} 
                    onValueChange={(value) => updateLocalSetting('content', 'language', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((lang) => (
                        <SelectItem key={lang.code} value={lang.code}>
                          {lang.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <Select 
                    value={localSettings.content.timezone} 
                    onValueChange={(value) => updateLocalSetting('content', 'timezone', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timezones.map((tz) => (
                        <SelectItem key={tz} value={tz}>
                          {tz}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Display Preferences</CardTitle>
              <CardDescription>
                Customize how content is displayed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Theme</Label>
                <Select 
                  value={localSettings.content.theme} 
                  onValueChange={(value: any) => updateLocalSetting('content', 'theme', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Posts per page</Label>
                <Select 
                  value={localSettings.content.postsPerPage.toString()} 
                  onValueChange={(value) => updateLocalSetting('content', 'postsPerPage', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show images</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically load images in posts
                  </p>
                </div>
                <Switch
                  checked={localSettings.content.showImages}
                  onCheckedChange={(checked) => updateLocalSetting('content', 'showImages', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show avatars</Label>
                  <p className="text-sm text-muted-foreground">
                    Display user avatars in posts and comments
                  </p>
                </div>
                <Switch
                  checked={localSettings.content.showAvatars}
                  onCheckedChange={(checked) => updateLocalSetting('content', 'showAvatars', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-play videos</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically play videos when visible
                  </p>
                </div>
                <Switch
                  checked={localSettings.content.autoPlayVideos}
                  onCheckedChange={(checked) => updateLocalSetting('content', 'autoPlayVideos', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Compact mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Show more content in less space
                  </p>
                </div>
                <Switch
                  checked={localSettings.content.compactMode}
                  onCheckedChange={(checked) => updateLocalSetting('content', 'compactMode', checked)}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button 
              onClick={() => saveSection('content')} 
              disabled={saving === 'content'}
            >
              {saving === 'content' ? 'Saving...' : 'Save Display Settings'}
            </Button>
          </div>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Account Security
              </CardTitle>
              <CardDescription>
                Manage your account security settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Two-factor authentication</Label>
                  <p className="text-sm text-muted-foreground">
                    Add an extra layer of security to your account
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {localSettings.security.twoFactorEnabled ? (
                    <Badge variant="default">Enabled</Badge>
                  ) : (
                    <Badge variant="secondary">Disabled</Badge>
                  )}
                  <Button variant="outline" size="sm">
                    {localSettings.security.twoFactorEnabled ? 'Disable' : 'Enable'}
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Login notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified of new login attempts
                  </p>
                </div>
                <Switch
                  checked={localSettings.security.loginNotifications}
                  onCheckedChange={(checked) => updateLocalSetting('security', 'loginNotifications', checked)}
                />
              </div>

              <div className="space-y-2">
                <Label>Session timeout</Label>
                <Select 
                  value={localSettings.security.sessionTimeout.toString()} 
                  onValueChange={(value) => updateLocalSetting('security', 'sessionTimeout', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="240">4 hours</SelectItem>
                    <SelectItem value="720">12 hours</SelectItem>
                    <SelectItem value="1440">24 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Data Management
              </CardTitle>
              <CardDescription>
                Control your data and account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Export your data</Label>
                  <p className="text-sm text-muted-foreground">
                    Download a copy of all your data
                  </p>
                </div>
                <Button variant="outline" onClick={exportData}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>

              <Separator />

              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p><strong>Danger Zone</strong></p>
                    <p>Once you delete your account, there is no going back. Please be certain.</p>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={deleteAccount}
                      className="mt-2"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Account
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button 
              onClick={() => saveSection('security')} 
              disabled={saving === 'security'}
            >
              {saving === 'security' ? 'Saving...' : 'Save Security Settings'}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}