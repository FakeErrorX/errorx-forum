'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Smartphone, 
  Download, 
  Bell, 
  BellOff, 
  Trash2, 
  RefreshCw,
  Database,
  Wifi,
  WifiOff,
  Monitor,
  Settings
} from 'lucide-react';
import { usePWA } from '@/components/providers/pwa-provider';
import { useOnlineStatus } from '@/lib/pwa-utils';
import { toast } from 'sonner';

export default function PWASettingsPage() {
  const { isOnline, isInstalled, canInstall, installPWA, cacheSize, clearCache } = usePWA();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkNotificationStatus();
  }, []);

  const checkNotificationStatus = () => {
    if ('Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted');
    }
  };

  const handleInstallApp = async () => {
    setIsLoading(true);
    try {
      const success = await installPWA();
      if (success) {
        toast.success('App installed successfully!');
      } else {
        toast.error('Installation failed or was cancelled');
      }
    } catch (error) {
      toast.error('Installation failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationToggle = async (enabled: boolean) => {
    if (!enabled) {
      setNotificationsEnabled(false);
      return;
    }

    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationsEnabled(permission === 'granted');
      
      if (permission === 'granted') {
        toast.success('Notifications enabled');
      } else {
        toast.error('Notification permission denied');
      }
    }
  };

  const handleClearCache = async () => {
    setIsLoading(true);
    try {
      await clearCache();
      toast.success('Cache cleared successfully');
    } catch (error) {
      toast.error('Failed to clear cache');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCacheSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="container mx-auto py-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">PWA Settings</h1>
          <p className="text-gray-600 mt-1">
            Manage your Progressive Web App experience
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isOnline ? (
            <Badge variant="default" className="flex items-center gap-1">
              <Wifi className="h-3 w-3" />
              Online
            </Badge>
          ) : (
            <Badge variant="destructive" className="flex items-center gap-1">
              <WifiOff className="h-3 w-3" />
              Offline
            </Badge>
          )}
        </div>
      </div>

      {/* Installation Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            App Installation
          </CardTitle>
          <CardDescription>
            Install ErrorX Forum as a native app on your device
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Installation Status</Label>
              <p className="text-sm text-gray-600">
                {isInstalled 
                  ? 'App is installed and ready to use' 
                  : 'App is not installed on this device'
                }
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isInstalled ? (
                <Badge variant="default" className="flex items-center gap-1">
                  <Monitor className="h-3 w-3" />
                  Installed
                </Badge>
              ) : canInstall ? (
                <Button 
                  onClick={handleInstallApp} 
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  {isLoading ? 'Installing...' : 'Install App'}
                </Button>
              ) : (
                <Badge variant="secondary">Not Available</Badge>
              )}
            </div>
          </div>

          {!isInstalled && !canInstall && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">Installation Requirements</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Use a supported browser (Chrome, Edge, Firefox, Safari)</li>
                <li>• Visit the site multiple times to trigger install prompt</li>
                <li>• Ensure the site is served over HTTPS</li>
                <li>• Browser may have specific requirements for PWA installation</li>
              </ul>
            </div>
          )}

          {isInstalled && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg text-center">
                <Smartphone className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                <h4 className="font-medium text-sm mb-1">Mobile Experience</h4>
                <p className="text-xs text-gray-600">Native app feel on mobile devices</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg text-center">
                <Database className="h-6 w-6 text-green-600 mx-auto mb-2" />
                <h4 className="font-medium text-sm mb-1">Offline Access</h4>
                <p className="text-xs text-gray-600">Read content without internet</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg text-center">
                <Bell className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                <h4 className="font-medium text-sm mb-1">Push Notifications</h4>
                <p className="text-xs text-gray-600">Stay updated with real-time alerts</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Push Notifications
          </CardTitle>
          <CardDescription>
            Receive notifications about new posts, comments, and messages
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="notifications" className="text-base font-medium">
                Enable Notifications
              </Label>
              <p className="text-sm text-gray-600">
                Get notified about important updates even when the app is closed
              </p>
            </div>
            <Switch
              id="notifications"
              checked={notificationsEnabled}
              onCheckedChange={handleNotificationToggle}
            />
          </div>

          {!notificationsEnabled && (
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center gap-2 mb-2">
                <BellOff className="h-4 w-4 text-yellow-600" />
                <span className="font-medium text-yellow-800">Notifications Disabled</span>
              </div>
              <p className="text-sm text-yellow-700">
                Enable notifications to stay updated with the latest activity in the forum.
              </p>
            </div>
          )}

          {notificationsEnabled && (
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <Bell className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-800">Notifications Enabled</span>
              </div>
              <p className="text-sm text-green-700">
                You'll receive notifications for new messages, post replies, and important updates.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cache Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Cache Management
          </CardTitle>
          <CardDescription>
            Manage cached data for offline access and performance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Cache Size</Label>
              <p className="text-sm text-gray-600">
                Current amount of data cached for offline access
              </p>
            </div>
            <Badge variant="secondary" className="font-mono">
              {formatCacheSize(cacheSize)}
            </Badge>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Clear Cache</Label>
              <p className="text-sm text-gray-600">
                Remove all cached data to free up storage space
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={handleClearCache}
              disabled={isLoading || cacheSize === 0}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              {isLoading ? 'Clearing...' : 'Clear Cache'}
            </Button>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium mb-2">What's Cached?</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Recent forum posts and comments</li>
              <li>• User profiles and images</li>
              <li>• Static assets (CSS, JavaScript, icons)</li>
              <li>• API responses for faster loading</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* PWA Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            PWA Features
          </CardTitle>
          <CardDescription>
            Available Progressive Web App capabilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <WifiOff className="h-4 w-4 text-blue-600" />
                <span className="font-medium">Offline Mode</span>
              </div>
              <p className="text-sm text-gray-600">
                Continue browsing cached content when offline
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <RefreshCw className="h-4 w-4 text-green-600" />
                <span className="font-medium">Background Sync</span>
              </div>
              <p className="text-sm text-gray-600">
                Actions sync automatically when connection returns
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Download className="h-4 w-4 text-purple-600" />
                <span className="font-medium">App-like Experience</span>
              </div>
              <p className="text-sm text-gray-600">
                Native app feel with full-screen mode
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Smartphone className="h-4 w-4 text-orange-600" />
                <span className="font-medium">Home Screen Icon</span>
              </div>
              <p className="text-sm text-gray-600">
                Add to home screen for quick access
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}