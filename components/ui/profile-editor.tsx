"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { FileUpload } from '@/components/ui/file-upload';
import { CalendarIcon, Camera, Globe, MapPin, Briefcase, Github, Twitter, Linkedin, Instagram, Facebook, Youtube } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

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

interface ProfileEditorProps {
  user: UserProfile;
  onSave: (updatedUser: Partial<UserProfile>) => Promise<void>;
  isLoading?: boolean;
}

const timezones = [
  'UTC',
  'Asia/Dhaka',
  // Add more timezones as needed
];

const socialPlatforms = [
  { key: 'twitter', name: 'Twitter', icon: Twitter, placeholder: 'https://twitter.com/username' },
  { key: 'github', name: 'GitHub', icon: Github, placeholder: 'https://github.com/username' },
  { key: 'linkedin', name: 'LinkedIn', icon: Linkedin, placeholder: 'https://linkedin.com/in/username' },
  { key: 'instagram', name: 'Instagram', icon: Instagram, placeholder: 'https://instagram.com/username' },
  { key: 'facebook', name: 'Facebook', icon: Facebook, placeholder: 'https://facebook.com/username' },
  { key: 'youtube', name: 'YouTube', icon: Youtube, placeholder: 'https://youtube.com/@username' },
];

export function ProfileEditor({ user, onSave, isLoading = false }: ProfileEditorProps) {
  const [formData, setFormData] = useState({
    name: user.name || '',
    username: user.username || '',
    bio: user.bio || '',
    location: user.location || '',
    website: user.website || '',
    birthday: user.birthday,
    timezone: user.timezone || 'UTC',
    socialLinks: user.socialLinks || {},
    interests: user.interests || [],
    skills: user.skills || [],
  });

  const [newInterest, setNewInterest] = useState('');
  const [newSkill, setNewSkill] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSocialLinkChange = (platform: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [platform]: value
      }
    }));
  };

  const addInterest = () => {
    if (newInterest.trim() && !formData.interests.includes(newInterest.trim())) {
      setFormData(prev => ({
        ...prev,
        interests: [...prev.interests, newInterest.trim()]
      }));
      setNewInterest('');
    }
  };

  const removeInterest = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.filter(i => i !== interest)
    }));
  };

  const addSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }));
      setNewSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }));
  };

  const handleAvatarUpload = async (uploadedFiles: any[]) => {
    if (uploadedFiles.length === 0) return;
    
    setAvatarUploading(true);
    try {
      // If files are already uploaded, use the URL directly
      if (uploadedFiles[0].url) {
        await onSave({ image: uploadedFiles[0].url });
        toast.success('Avatar updated successfully');
        return;
      }

      // Otherwise upload the file
      const file = uploadedFiles[0] as File;
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      formDataUpload.append('type', 'avatar');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload,
      });

      if (response.ok) {
        const result = await response.json();
        // Update user avatar immediately
        await onSave({ image: result.url });
        toast.success('Avatar updated successfully');
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      toast.error('Failed to upload avatar');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      await onSave(formData);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  return (
    <div className="space-y-6">
      {/* Avatar Section */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Picture</CardTitle>
          <CardDescription>Upload a new avatar image</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user.image || ""} alt={user.name || "User"} />
              <AvatarFallback className="text-2xl">
                {user.name?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <FileUpload
                onFilesUploaded={handleAvatarUpload}
                maxFiles={1}
                maxFileSize={5 * 1024 * 1024} // 5MB
                allowedMimeTypes={['image/*']}
                disabled={avatarUploading}
              />
              <p className="text-sm text-muted-foreground mt-2">
                Upload a square image, at least 128x128px. Max 5MB.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Your public profile information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Your display name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={formData.username}
                disabled={!user.canChangeUsername}
                onChange={(e) => handleInputChange('username', e.target.value)}
                placeholder="Your username"
                className={!user.canChangeUsername ? "bg-muted" : undefined}
              />
              {!user.canChangeUsername && (
                <p className="text-xs text-muted-foreground">
                  Username changes are limited. Next change available: {user.nextUsernameChangeAt}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              placeholder="A brief description about yourself"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="City, Country"
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  placeholder="https://yourwebsite.com"
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="birthday">Birthday</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.birthday && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.birthday ? format(new Date(formData.birthday), "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.birthday ? new Date(formData.birthday) : undefined}
                    onSelect={(date) => handleInputChange('birthday', date ? date.toISOString() : null)}
                    disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select value={formData.timezone} onValueChange={(value) => handleInputChange('timezone', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select timezone" />
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

      {/* Social Links */}
      <Card>
        <CardHeader>
          <CardTitle>Social Links</CardTitle>
          <CardDescription>Connect your social media profiles</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {socialPlatforms.map((platform) => {
            const Icon = platform.icon;
            return (
              <div key={platform.key} className="space-y-2">
                <Label htmlFor={platform.key} className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {platform.name}
                </Label>
                <Input
                  id={platform.key}
                  value={formData.socialLinks[platform.key as keyof typeof formData.socialLinks] || ''}
                  onChange={(e) => handleSocialLinkChange(platform.key, e.target.value)}
                  placeholder={platform.placeholder}
                />
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Interests */}
      <Card>
        <CardHeader>
          <CardTitle>Interests</CardTitle>
          <CardDescription>Add topics and subjects you're interested in</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newInterest}
              onChange={(e) => setNewInterest(e.target.value)}
              placeholder="Add an interest"
              onKeyPress={(e) => e.key === 'Enter' && addInterest()}
            />
            <Button onClick={addInterest} disabled={!newInterest.trim()}>
              Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.interests.map((interest) => (
              <Badge key={interest} variant="secondary" className="px-3 py-1">
                {interest}
                <button
                  onClick={() => removeInterest(interest)}
                  className="ml-2 text-muted-foreground hover:text-foreground"
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Skills */}
      <Card>
        <CardHeader>
          <CardTitle>Skills</CardTitle>
          <CardDescription>Highlight your expertise and skills</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              placeholder="Add a skill"
              onKeyPress={(e) => e.key === 'Enter' && addSkill()}
            />
            <Button onClick={addSkill} disabled={!newSkill.trim()}>
              Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.skills.map((skill) => (
              <Badge key={skill} variant="default" className="px-3 py-1">
                {skill}
                <button
                  onClick={() => removeSkill(skill)}
                  className="ml-2 text-primary-foreground/70 hover:text-primary-foreground"
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end space-x-4">
        <Button onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}