"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Icon } from '@iconify/react';

interface User {
  userId: number; // Custom sequential user ID
  name: string | null;
  username: string | null;
  email: string;
  image: string | null;
  bio: string | null;
  postCount: number;
  reputation: number;
  isActive: boolean;
  preferences: {
    theme: 'light' | 'dark' | 'system';
    notifications: boolean;
    emailUpdates: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [clientIp, setClientIp] = useState<string | null>(null);
  const [clientUserAgent, setClientUserAgent] = useState<string | null>(null);
  const [clientOs, setClientOs] = useState<string | null>(null);
  const [clientBrowser, setClientBrowser] = useState<string | null>(null);

  // Account settings
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");

  // Password change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Preferences
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [notifications, setNotifications] = useState(true);
  const [emailUpdates, setEmailUpdates] = useState(true);

  // Load user data
  useEffect(() => {
    const loadUserData = async () => {
      if (status === "loading") return;
      
      if (!session) {
        router.push("/signin");
        return;
      }

      try {
        const response = await fetch('/api/users');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          setName(userData.name || "");
          setUsername(userData.username || "");
          setEmail(userData.email || "");
          setBio(userData.bio || "");
          setTheme(userData.preferences?.theme || 'system');
          setNotifications(userData.preferences?.notifications ?? true);
          setEmailUpdates(userData.preferences?.emailUpdates ?? true);
        } else {
          router.push("/signin");
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        router.push("/signin");
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [session, status, router]);

  useEffect(() => {
    const fetchClientIp = async () => {
      try {
        const res = await fetch('/api/ip');
        if (res.ok) {
          const data = await res.json();
          setClientIp(data.ip || null);
        }
      } catch (err) {
        // ignore ip errors silently
      }
    };

    fetchClientIp();
  }, []);

  useEffect(() => {
    try {
      // navigator only exists in browser
      const ua = typeof navigator !== 'undefined' ? navigator.userAgent : null;
      setClientUserAgent(ua);

      const detectOs = (s: string | null): string | null => {
        if (!s) return null;
        if (/Windows NT/i.test(s)) return 'Windows';
        if (/Android/i.test(s)) return 'Android';
        if (/(iPhone|iPad|iPod)/i.test(s)) return 'iOS';
        if (/Mac OS X/i.test(s)) return 'macOS';
        if (/Linux/i.test(s)) return 'Linux';
        return 'Unknown';
      };

      const detectBrowser = (s: string | null): string | null => {
        if (!s) return null;
        if (/Edg\//i.test(s)) return 'Edge';
        if (/OPR\//i.test(s)) return 'Opera';
        if (/Chrome\//i.test(s) && !/Chromium/i.test(s)) return 'Chrome';
        if (/Firefox\//i.test(s)) return 'Firefox';
        if (/Version\/.+Safari/i.test(s) && !/Chrome\//i.test(s)) return 'Safari';
        return 'Browser';
      };

      setClientOs(detectOs(ua));
      setClientBrowser(detectBrowser(ua));
    } catch (_) {
      // ignore
    }
  }, []);

  const handleSaveAccount = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          username,
          bio,
        }),
      });

      if (response.ok) {
        setSuccess("Account settings updated successfully!");
        toast.success("Account settings updated");
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to update account settings");
      }
    } catch (error) {
      setError("Failed to update account settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setError("New passwords don't match");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch('/api/users/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (response.ok) {
        setSuccess("Password changed successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        toast.success("Password changed successfully");
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to change password");
      }
    } catch (error) {
      setError("Failed to change password. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleSavePreferences = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch('/api/users/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          theme,
          notifications,
          emailUpdates,
        }),
      });

      if (response.ok) {
        setSuccess("Preferences updated successfully!");
        toast.success("Preferences updated");
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to update preferences");
      }
    } catch (error) {
      setError("Failed to update preferences. Please try again.");
    } finally {
      setSaving(false);
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

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground">Manage your account settings and preferences</p>
          </div>
          <Button variant="outline" onClick={() => router.back()}>
            <Icon icon="lucide:arrow-left" className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <Alert>
            <Icon icon="lucide:check-circle" className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <Icon icon="lucide:alert-circle" className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Settings Tabs */}
        <Tabs defaultValue="account" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          {/* Account Settings */}
          <TabsContent value="account" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your public profile information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={user.image || ""} alt={user.name || "User"} />
                    <AvatarFallback className="text-xl">
                      {user.name?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{user.name || "No name set"}</p>
                    <p className="text-sm text-muted-foreground">@{user.username || "no-username"}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Display Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your display name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Choose a username"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    Email cannot be changed. Contact support if needed.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us about yourself"
                    rows={3}
                  />
                </div>

                <Button onClick={handleSaveAccount} disabled={saving}>
                  {saving ? (
                    <>
                      <Icon icon="lucide:loader-2" className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Icon icon="lucide:save" className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Account Statistics</CardTitle>
                <CardDescription>
                  Your forum activity and reputation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{user.postCount}</div>
                    <div className="text-sm text-muted-foreground">Posts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{user.reputation}</div>
                    <div className="text-sm text-muted-foreground">Reputation</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Joined</div>
                  </div>
                  <div className="text-center">
                    <Badge variant={user.isActive ? "default" : "secondary"}>
                      {user.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <div className="text-sm text-muted-foreground mt-1">Status</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preferences */}
          <TabsContent value="preferences" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Appearance & Notifications</CardTitle>
                <CardDescription>
                  Customize your experience
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="theme">Theme</Label>
                  <Select value={theme} onValueChange={(value: 'light' | 'dark' | 'system') => setTheme(value)}>
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

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Push Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications for new posts and replies
                      </p>
                    </div>
                    <Switch
                      checked={notifications}
                      onCheckedChange={setNotifications}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email Updates</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive email notifications for important updates
                      </p>
                    </div>
                    <Switch
                      checked={emailUpdates}
                      onCheckedChange={setEmailUpdates}
                    />
                  </div>
                </div>

                <Button onClick={handleSavePreferences} disabled={saving}>
                  {saving ? (
                    <>
                      <Icon icon="lucide:loader-2" className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Icon icon="lucide:save" className="h-4 w-4 mr-2" />
                      Save Preferences
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>
                  Update your password to keep your account secure
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                  />
                </div>

                <Button onClick={handleChangePassword} disabled={saving}>
                  {saving ? (
                    <>
                      <Icon icon="lucide:loader-2" className="h-4 w-4 mr-2 animate-spin" />
                      Changing...
                    </>
                  ) : (
                    <>
                      <Icon icon="lucide:key" className="h-4 w-4 mr-2" />
                      Change Password
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Active Sessions</CardTitle>
                <CardDescription>
                  Manage your active sessions across devices
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative overflow-hidden rounded-lg border bg-gradient-to-br from-background to-muted p-4 shadow-sm transition hover:shadow-md">
                  <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-br from-primary/10 to-primary/0 blur-2xl" />
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary/10 to-primary/20 text-primary ring-1 ring-primary/20">
                        <Icon
                          icon={
                            clientOs === 'Windows' ? 'mdi:microsoft-windows' :
                            clientOs === 'Android' ? 'mdi:android' :
                            clientOs === 'iOS' ? 'mdi:apple-ios' :
                            clientOs === 'macOS' ? 'mdi:apple' :
                            clientOs === 'Linux' ? 'mdi:linux' : 'lucide:monitor'
                          }
                          className="h-4 w-4"
                        />
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-semibold tracking-tight">Current Session</p>
                        </div>
                        <p className="text-xs text-muted-foreground">Signed in {new Date().toLocaleString()}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          {clientIp && (
                            <span className="inline-flex items-center gap-1 rounded-full border bg-background px-1.5 py-0.5 text-[11px] text-muted-foreground shadow-sm">
                              <Icon icon="lucide:map-pin" className="h-3 w-3" />
                              <span className="font-mono">{clientIp}</span>
                            </span>
                          )}
                          {clientBrowser && (
                            <span className="inline-flex max-w-full items-center gap-1 rounded-full border bg-background px-1.5 py-0.5 text-[11px] text-muted-foreground shadow-sm">
                              <Icon
                                icon={
                                  clientBrowser === 'Chrome' ? 'mdi:google-chrome' :
                                  clientBrowser === 'Edge' ? 'mdi:microsoft-edge' :
                                  clientBrowser === 'Firefox' ? 'mdi:firefox' :
                                  clientBrowser === 'Safari' ? 'simple-icons:safari' :
                                  clientBrowser === 'Opera' ? 'mdi:opera' : 'lucide:globe'
                                }
                                className="h-3 w-3"
                              />
                              <span className="truncate max-w-[120px] sm:max-w-[160px]">{clientBrowser}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="pt-0.5">
                      <Badge variant="default" className="rounded-full px-2 py-0 text-[10px] leading-4 flex items-center gap-1.5">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                        </span>
                        Active
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}
