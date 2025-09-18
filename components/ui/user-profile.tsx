'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  MapPin, 
  Link as LinkIcon, 
  Calendar, 
  Award, 
  Activity, 
  Settings,
  Shield,
  CheckCircle
} from 'lucide-react';

interface UserProfileProps {
  userId: string;
  isOwnProfile?: boolean;
  onProfileUpdate?: (data: any) => void;
}

export default function UserProfile({ 
  userId, 
  isOwnProfile = false, 
  onProfileUpdate 
}: UserProfileProps) {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [badges, setBadges] = useState<any[]>([]);
  const [reputationHistory, setReputationHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  const [profileForm, setProfileForm] = useState({
    bio: '',
    location: '',
    website: '',
    twitter: '',
    github: '',
    linkedin: '',
    isPublic: true,
    showEmail: false,
    showLocation: true,
    showSocialMedia: true,
  });

  useEffect(() => {
    fetchUserData();
  }, [userId]);

  const fetchUserData = async () => {
    setIsLoading(true);
    try {
      // Fetch user basic info and profile
      const [userRes, profileRes, activitiesRes, badgesRes, reputationRes] = await Promise.all([
        fetch(`/api/users/${userId}`),
        fetch(`/api/users/${userId}/profile`),
        fetch(`/api/users/${userId}/activities?limit=10`),
        fetch(`/api/users/${userId}/badges`),
        fetch(`/api/users/${userId}/reputation?limit=10`),
      ]);

      if (userRes.ok) {
        const userData = await userRes.json();
        setUser(userData);
      }

      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setProfile(profileData);
        setProfileForm({
          bio: profileData.bio || '',
          location: profileData.location || '',
          website: profileData.website || '',
          twitter: profileData.twitter || '',
          github: profileData.github || '',
          linkedin: profileData.linkedin || '',
          isPublic: profileData.isPublic ?? true,
          showEmail: profileData.showEmail ?? false,
          showLocation: profileData.showLocation ?? true,
          showSocialMedia: profileData.showSocialMedia ?? true,
        });
      }

      if (activitiesRes.ok) {
        const activitiesData = await activitiesRes.json();
        setActivities(activitiesData);
      }

      if (badgesRes.ok) {
        const badgesData = await badgesRes.json();
        setBadges(badgesData);
      }

      if (reputationRes.ok) {
        const reputationData = await reputationRes.json();
        setReputationHistory(reputationData);
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileUpdate = async () => {
    try {
      const response = await fetch(`/api/users/${userId}/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileForm),
      });

      if (response.ok) {
        const updatedProfile = await response.json();
        setProfile(updatedProfile);
        setIsEditing(false);
        onProfileUpdate?.(updatedProfile);
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold mb-2">User not found</h2>
        <p className="text-muted-foreground">The requested user profile could not be found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={user.image} alt={user.username} />
              <AvatarFallback className="text-2xl">
                {user.username?.[0]?.toUpperCase() || user.name?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{user.username || user.name}</h1>
                {user.isVerified && (
                  <CheckCircle className="h-6 w-6 text-blue-500" />
                )}
                {user.role && (
                  <Badge variant="secondary">{user.role.name}</Badge>
                )}
              </div>
              
              <div className="flex items-center gap-4 text-muted-foreground mb-4">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Joined {formatDate(user.createdAt)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Award className="h-4 w-4" />
                  <span>{user.reputation || 0} reputation</span>
                </div>
                {profile?.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{profile.location}</span>
                  </div>
                )}
              </div>

              {profile?.bio && (
                <p className="text-muted-foreground mb-4">{profile.bio}</p>
              )}

              <div className="flex gap-2">
                {profile?.website && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={profile.website} target="_blank" rel="noopener noreferrer">
                      <LinkIcon className="h-4 w-4 mr-1" />
                      Website
                    </a>
                  </Button>
                )}
                {profile?.github && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={`https://github.com/${profile.github}`} target="_blank" rel="noopener noreferrer">
                      GitHub
                    </a>
                  </Button>
                )}
                {profile?.twitter && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={`https://twitter.com/${profile.twitter}`} target="_blank" rel="noopener noreferrer">
                      Twitter
                    </a>
                  </Button>
                )}
                {isOwnProfile && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    <Settings className="h-4 w-4 mr-1" />
                    {isEditing ? 'Cancel' : 'Edit Profile'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Profile Form */}
      {isEditing && (
        <Card>
          <CardHeader>
            <CardTitle>Edit Profile</CardTitle>
            <CardDescription>Update your profile information and privacy settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={profileForm.bio}
                onChange={(e) => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="Tell us about yourself..."
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={profileForm.location}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="City, Country"
                />
              </div>
              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={profileForm.website}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, website: e.target.value }))}
                  placeholder="https://yourwebsite.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="twitter">Twitter</Label>
                <Input
                  id="twitter"
                  value={profileForm.twitter}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, twitter: e.target.value }))}
                  placeholder="username"
                />
              </div>
              <div>
                <Label htmlFor="github">GitHub</Label>
                <Input
                  id="github"
                  value={profileForm.github}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, github: e.target.value }))}
                  placeholder="username"
                />
              </div>
              <div>
                <Label htmlFor="linkedin">LinkedIn</Label>
                <Input
                  id="linkedin"
                  value={profileForm.linkedin}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, linkedin: e.target.value }))}
                  placeholder="username"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <Button onClick={handleProfileUpdate}>
                Save Changes
              </Button>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Profile Tabs */}
      <Tabs defaultValue="activity" className="space-y-4">
        <TabsList>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          <TabsTrigger value="badges">Badges</TabsTrigger>
          <TabsTrigger value="reputation">Reputation</TabsTrigger>
        </TabsList>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activities.length > 0 ? (
                <div className="space-y-4">
                  {activities.map((activity, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 border rounded">
                      <div className="flex-1">
                        <p className="font-medium">{activity.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(activity.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No recent activity to display.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="badges">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Badges ({badges.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {badges.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {badges.map((badgeEarned) => (
                    <div key={badgeEarned.id} className="flex items-center gap-3 p-3 border rounded">
                      {badgeEarned.badge.icon && (
                        <span className="text-2xl">{badgeEarned.badge.icon}</span>
                      )}
                      <div>
                        <h4 className="font-medium">{badgeEarned.badge.displayName}</h4>
                        <p className="text-sm text-muted-foreground">
                          {badgeEarned.badge.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Earned {formatDate(badgeEarned.earnedAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No badges earned yet.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reputation">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Reputation History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {reputationHistory.length > 0 ? (
                <div className="space-y-3">
                  {reputationHistory.map((entry, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium">{entry.reason}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(entry.createdAt)}
                        </p>
                      </div>
                      <Badge variant={entry.change > 0 ? 'default' : 'destructive'}>
                        {entry.change > 0 ? '+' : ''}{entry.change}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No reputation history to display.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}