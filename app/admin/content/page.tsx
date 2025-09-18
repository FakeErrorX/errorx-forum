'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Clock, 
  Shield, 
  FileText, 
  CheckCircle, 
  AlertTriangle,
  BarChart3,
  Settings
} from 'lucide-react';
import { ContentScheduler } from '@/components/content/content-scheduler';
import { ModerationRules } from '@/components/content/moderation-rules';
import { ContentTemplates } from '@/components/content/content-templates';
import { ModerationAction } from '@/lib/content-management';

// Mock data for demonstration
const mockCategories = [
  { id: '1', name: 'General Discussion' },
  { id: '2', name: 'Tech Support' },
  { id: '3', name: 'Feature Requests' },
  { id: '4', name: 'Bug Reports' },
];

const mockPrefixes = [
  { id: '1', name: 'Important', color: '#ef4444' },
  { id: '2', name: 'Help', color: '#3b82f6' },
  { id: '3', name: 'Question', color: '#10b981' },
  { id: '4', name: 'Announcement', color: '#8b5cf6' },
];

const mockScheduledPosts = [
  {
    id: '1',
    title: 'Weekly Community Update',
    content: 'This week we have some exciting updates...',
    scheduledFor: new Date(Date.now() + 86400000),
    author: { name: 'Admin', username: 'admin' },
    category: { name: 'Announcements' },
    published: false,
  },
  {
    id: '2',
    title: 'Maintenance Notice',
    content: 'Scheduled maintenance will occur...',
    scheduledFor: new Date(Date.now() + 172800000),
    author: { name: 'Admin', username: 'admin' },
    category: { name: 'System' },
    published: false,
  },
];

const mockModerationRules = [
  {
    id: '1',
    name: 'Spam Detection',
    description: 'Detects common spam patterns',
    pattern: '\\b(buy|sell|cheap|discount)\\b.*\\b(viagra|casino|lottery)\\b',
    action: ModerationAction.HIDE,
    enabled: true,
    severity: 3,
    categoryIds: [] as string[],
  },
  {
    id: '2',
    name: 'Profanity Filter',
    description: 'Filters inappropriate language',
    pattern: '\\b(badword1|badword2|badword3)\\b',
    action: ModerationAction.FLAG,
    enabled: true,
    severity: 2,
    categoryIds: [] as string[],
  },
];

const mockTemplates = [
  {
    id: '1',
    name: 'Bug Report Template',
    description: 'Standard template for bug reports',
    title: '[BUG] {Issue Title}',
    content: `## Bug Description
{Describe the bug in detail}

## Steps to Reproduce
1. {Step 1}
2. {Step 2}
3. {Step 3}

## Expected Behavior
{What should happen}

## Actual Behavior
{What actually happens}

## Environment
- OS: {Operating System}
- Browser: {Browser and version}
- Version: {App version}

## Additional Information
{Any other relevant information}`,
    categoryId: '4',
    threadPrefixId: '2',
    tags: ['bug', 'report'],
    isPublic: true,
    authorId: '1',
    author: { name: 'Admin', username: 'admin' },
    category: { name: 'Bug Reports' },
    threadPrefix: { name: 'Help', color: '#3b82f6' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export default function ContentManagementPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [scheduledPosts, setScheduledPosts] = useState(mockScheduledPosts);
  const [moderationRules, setModerationRules] = useState(mockModerationRules);
  const [templates, setTemplates] = useState(mockTemplates);

  const handleSchedulePost = async (data: any) => {
    console.log('Scheduling post:', data);
    // In real app, this would call the API
    const newPost = {
      id: Date.now().toString(),
      ...data,
      author: { name: 'Current User', username: 'currentuser' },
      category: mockCategories.find(c => c.id === data.categoryId),
      published: false,
    };
    setScheduledPosts(prev => [...prev, newPost]);
  };

  const handleCreateModerationRule = async (rule: any) => {
    console.log('Creating moderation rule:', rule);
    const newRule = {
      id: Date.now().toString(),
      ...rule,
    };
    setModerationRules(prev => [...prev, newRule]);
  };

  const handleCreateTemplate = async (template: any) => {
    console.log('Creating template:', template);
    const newTemplate = {
      id: Date.now().toString(),
      ...template,
      authorId: '1',
      author: { name: 'Current User', username: 'currentuser' },
      category: mockCategories.find(c => c.id === template.categoryId),
      threadPrefix: mockPrefixes.find(p => p.id === template.threadPrefixId),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setTemplates(prev => [...prev, newTemplate]);
  };

  const stats = {
    scheduledPosts: scheduledPosts.length,
    activeRules: moderationRules.filter(r => r.enabled).length,
    totalTemplates: templates.length,
    publicTemplates: templates.filter(t => t.isPublic).length,
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Content Management</h1>
          <p className="text-muted-foreground">
            Manage content scheduling, moderation, and templates
          </p>
        </div>
        <Settings className="h-8 w-8 text-muted-foreground" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="scheduler">Scheduler</TabsTrigger>
          <TabsTrigger value="moderation">Moderation</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="approvals">Approvals</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Scheduled Posts</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.scheduledPosts}</div>
                <p className="text-xs text-muted-foreground">
                  Posts awaiting publication
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Rules</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeRules}</div>
                <p className="text-xs text-muted-foreground">
                  Moderation rules enabled
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Templates</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalTemplates}</div>
                <p className="text-xs text-muted-foreground">
                  Content templates created
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Public Templates</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.publicTemplates}</div>
                <p className="text-xs text-muted-foreground">
                  Available to all users
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Upcoming Scheduled Posts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {scheduledPosts.slice(0, 3).map((post) => (
                    <div key={post.id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex-1">
                        <div className="font-medium">{post.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {post.category?.name} • {post.scheduledFor.toLocaleDateString()}
                        </div>
                      </div>
                      <Badge variant="secondary">Scheduled</Badge>
                    </div>
                  ))}
                  {scheduledPosts.length === 0 && (
                    <div className="text-center text-muted-foreground py-4">
                      No scheduled posts
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Bug Report Template created</span>
                    </div>
                    <span className="text-xs text-muted-foreground">2h ago</span>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm">Spam rule flagged 3 posts</span>
                    </div>
                    <span className="text-xs text-muted-foreground">4h ago</span>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">Weekly update scheduled</span>
                    </div>
                    <span className="text-xs text-muted-foreground">6h ago</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="scheduler">
          <ContentScheduler
            categories={mockCategories}
            prefixes={mockPrefixes}
            onSchedule={handleSchedulePost}
            onSaveDraft={handleSchedulePost}
          />
        </TabsContent>

        <TabsContent value="moderation">
          <ModerationRules
            rules={moderationRules}
            categories={mockCategories}
            onCreateRule={handleCreateModerationRule}
            onUpdateRule={(id, rule) => {
              setModerationRules(prev => 
                prev.map(r => r.id === id ? { ...r, ...rule } : r)
              );
            }}
            onDeleteRule={(id) => {
              setModerationRules(prev => prev.filter(r => r.id !== id));
            }}
          />
        </TabsContent>

        <TabsContent value="templates">
          <ContentTemplates
            templates={templates}
            categories={mockCategories}
            prefixes={mockPrefixes}
            onCreateTemplate={handleCreateTemplate}
            onUpdateTemplate={(id, template) => {
              setTemplates(prev => 
                prev.map(t => t.id === id ? { ...t, ...template } : t)
              );
            }}
            onDeleteTemplate={(id) => {
              setTemplates(prev => prev.filter(t => t.id !== id));
            }}
            onUseTemplate={(template) => {
              console.log('Using template:', template);
              // In real app, this would populate the create post form
            }}
          />
        </TabsContent>

        <TabsContent value="approvals">
          <Card>
            <CardHeader>
              <CardTitle>Content Approval Queue</CardTitle>
              <CardDescription>
                Review and approve content before publication
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Pending Approvals</h3>
                <p className="text-muted-foreground">
                  All content has been reviewed and approved
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}