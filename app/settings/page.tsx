"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ProfileEditor } from "@/components/ui/profile-editor";
import { EnhancedSettings } from "@/components/ui/enhanced-settings";
import { toast } from "sonner";
import { Icon } from '@iconify/react';

interface UserProfile {
  id: string;
  userId: number;
  name: string | null;
  username: string | null;
  email: string;
  image: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  birthday: string | null;
  timezone: string | null;
  socialLinks: {
    twitter?: string;
    github?: string;
    linkedin?: string;
    discord?: string;
    instagram?: string;
    youtube?: string;
  };
  interests: string[];
  skills: string[];
  postCount: number;
  reputation: number;
  isActive: boolean;
  canChangeUsername?: boolean;
  usernameChangeDaysLeft?: number;
  nextUsernameChangeAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface UserSettings {
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
  security: {
    twoFactorEnabled: boolean;
    loginNotifications: boolean;
    sessionTimeout: number;
    trustedDevices: string[];
  };
}

export default function SettingsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load user data and settings
  useEffect(() => {
    const loadData = async () => {
      if (status === "loading") return;
      
      if (!session) {
        router.push("/signin");
        return;
      }

      try {
        // Load user profile
        const userResponse = await fetch('/api/users');
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUser({
            ...userData,
            socialLinks: userData.socialLinks || {},
            interests: userData.interests || [],
            skills: userData.skills || [],
          });
        } else if (userResponse.status === 401) {
          router.push("/signin");
          return;
        } else {
          setError("Failed to load user data. Please refresh the page.");
          return;
        }

        // Load user settings (with defaults if not found)
        const settingsResponse = await fetch('/api/users/settings');
        let settingsData: UserSettings;
        
        if (settingsResponse.ok) {
          settingsData = await settingsResponse.json();
        } else {
          // Use default settings if none exist
          settingsData = {
            privacy: {
              showOnline: true,
              showEmail: false,
              showBirthday: false,
              showLocation: true,
              allowProfileViews: true,
              allowDirectMessages: true,
              allowMentions: true,
              searchableProfile: true,
              showActivity: true,
            },
            notifications: {
              email: {
                mentions: true,
                replies: true,
                follows: true,
                likes: false,
                messages: true,
                newsletters: false,
                digest: true,
                security: true,
              },
              push: {
                mentions: true,
                replies: true,
                follows: false,
                likes: false,
                messages: true,
                system: true,
              },
              frequency: {
                digestFrequency: 'weekly',
                quietHours: {
                  enabled: false,
                  start: '22:00',
                  end: '08:00',
                },
              },
            },
            content: {
              theme: 'system',
              language: 'en',
              timezone: 'UTC',
              postsPerPage: 20,
              showImages: true,
              showAvatars: true,
              autoPlayVideos: false,
              compactMode: false,
            },
            security: {
              twoFactorEnabled: false,
              loginNotifications: true,
              sessionTimeout: 1440, // 24 hours
              trustedDevices: [],
            },
          };
        }
        
        setSettings(settingsData);
      } catch (error) {
        console.error('Error loading data:', error);
        setError("Failed to load data. Please check your connection and try again.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [session, status, router]);

  const handleProfileSave = async (profileData: Partial<UserProfile>) => {
    try {
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
        toast.success("Profile updated successfully!");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update profile");
      }
    } catch (error) {
      console.error('Profile save error:', error);
      throw error;
    }
  };

  const handleSettingsSave = async (section: keyof UserSettings, data: any) => {
    try {
      const response = await fetch('/api/users/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          section,
          data,
        }),
      });

      if (response.ok) {
        if (settings) {
          setSettings({
            ...settings,
            [section]: data,
          });
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update settings");
      }
    } catch (error) {
      console.error('Settings save error:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center space-x-2">
            <Icon icon="lucide:loader-2" className="h-6 w-6 animate-spin" />
            <span>Loading settings...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!user || !settings) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <Icon icon="lucide:alert-circle" className="h-12 w-12 mx-auto text-muted-foreground" />
            <p className="text-lg">Failed to load settings</p>
            <Button onClick={() => window.location.reload()}>
              <Icon icon="lucide:refresh-cw" className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground">Manage your account and preferences</p>
          </div>
          <Button variant="outline" onClick={() => router.back()}>
            <Icon icon="lucide:arrow-left" className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <Alert variant="destructive">
            <Icon icon="lucide:alert-circle" className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Settings Tabs */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile">Profile & Account</TabsTrigger>
            <TabsTrigger value="settings">Privacy & Settings</TabsTrigger>
          </TabsList>

          {/* Profile Editor Tab */}
          <TabsContent value="profile">
            <ProfileEditor 
              user={user} 
              onSave={handleProfileSave}
              isLoading={loading}
            />
          </TabsContent>

          {/* Enhanced Settings Tab */}
          <TabsContent value="settings">
            <EnhancedSettings 
              settings={settings} 
              onSave={handleSettingsSave}
              isLoading={loading}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
