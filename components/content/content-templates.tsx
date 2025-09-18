'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Plus, 
  Edit, 
  Trash2, 
  Copy, 
  Eye, 
  Lock,
  Globe
} from 'lucide-react';
import { format } from 'date-fns';

interface ContentTemplate {
  id: string;
  name: string;
  description?: string;
  title: string;
  content: string;
  categoryId?: string;
  threadPrefixId?: string;
  tags: string[];
  isPublic: boolean;
  authorId: string;
  author: {
    name: string;
    username: string;
  };
  category?: {
    name: string;
  };
  threadPrefix?: {
    name: string;
    color?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface ContentTemplatesProps {
  templates: ContentTemplate[];
  categories: Array<{ id: string; name: string }>;
  prefixes?: Array<{ id: string; name: string; color?: string }>;
  onCreateTemplate?: (template: any) => void;
  onUpdateTemplate?: (id: string, template: any) => void;
  onDeleteTemplate?: (id: string) => void;
  onUseTemplate?: (template: ContentTemplate) => void;
}

export function ContentTemplates({ 
  templates, 
  categories, 
  prefixes,
  onCreateTemplate, 
  onUpdateTemplate, 
  onDeleteTemplate,
  onUseTemplate
}: ContentTemplatesProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('my-templates');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    title: '',
    content: '',
    categoryId: '',
    threadPrefixId: '',
    tags: '',
    isPublic: false,
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      title: '',
      content: '',
      categoryId: '',
      threadPrefixId: '',
      tags: '',
      isPublic: false,
    });
    setIsCreating(false);
    setEditingTemplate(null);
  };

  const handleSubmit = async () => {
    try {
      const templateData = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      };

      if (editingTemplate) {
        await onUpdateTemplate?.(editingTemplate, templateData);
      } else {
        await onCreateTemplate?.(templateData);
      }
      resetForm();
    } catch (error) {
      console.error('Error saving template:', error);
    }
  };

  const startEdit = (template: ContentTemplate) => {
    setFormData({
      name: template.name,
      description: template.description || '',
      title: template.title,
      content: template.content,
      categoryId: template.categoryId || '',
      threadPrefixId: template.threadPrefixId || '',
      tags: template.tags.join(', '),
      isPublic: template.isPublic,
    });
    setEditingTemplate(template.id);
    setIsCreating(true);
  };

  const myTemplates = templates.filter(t => !t.isPublic);
  const publicTemplates = templates.filter(t => t.isPublic);

  const TemplateCard = ({ template }: { template: ContentTemplate }) => (
    <Card key={template.id} className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {template.name}
              {template.isPublic ? (
                <Globe className="h-4 w-4 text-blue-500" />
              ) : (
                <Lock className="h-4 w-4 text-gray-500" />
              )}
            </CardTitle>
            {template.description && (
              <CardDescription>{template.description}</CardDescription>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onUseTemplate?.(template)}
              title="Use Template"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => startEdit(template)}
              title="Edit Template"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDeleteTemplate?.(template.id)}
              className="text-red-600 hover:text-red-700"
              title="Delete Template"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <div className="font-medium text-sm mb-1">Preview Title:</div>
            <div className="text-sm bg-muted p-2 rounded">{template.title}</div>
          </div>
          <div>
            <div className="font-medium text-sm mb-1">Content Preview:</div>
            <div className="text-sm bg-muted p-2 rounded line-clamp-3">
              {template.content.substring(0, 150)}
              {template.content.length > 150 ? '...' : ''}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {template.category && (
              <Badge variant="secondary">{template.category.name}</Badge>
            )}
            {template.threadPrefix && (
              <Badge 
                variant="secondary" 
                style={{ backgroundColor: template.threadPrefix.color + '20', color: template.threadPrefix.color }}
              >
                {template.threadPrefix.name}
              </Badge>
            )}
            {template.tags.map((tag) => (
              <Badge key={tag} variant="outline">#{tag}</Badge>
            ))}
          </div>
          <div className="text-xs text-muted-foreground">
            Created by {template.author.name} on {format(new Date(template.createdAt), 'MMM d, yyyy')}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Content Templates
              </CardTitle>
              <CardDescription>
                Create reusable templates for consistent content creation
              </CardDescription>
            </div>
            <Button onClick={() => setIsCreating(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Template
            </Button>
          </div>
        </CardHeader>

        {isCreating && (
          <CardContent className="border-t">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">
                {editingTemplate ? 'Edit Template' : 'Create New Template'}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Template Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Bug Report Template"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Input
                    id="description"
                    placeholder="Brief description of template usage"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Post Title Template</Label>
                <Input
                  id="title"
                  placeholder="e.g., [BUG] Issue with {feature}"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content Template</Label>
                <Textarea
                  id="content"
                  placeholder="Create your content template with placeholders like {description}, {steps}, etc."
                  className="min-h-[200px]"
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Default Category (Optional)</Label>
                  <select
                    id="category"
                    className="w-full px-3 py-2 border rounded-md"
                    value={formData.categoryId}
                    onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
                  >
                    <option value="">No default category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {prefixes && prefixes.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="prefix">Default Prefix (Optional)</Label>
                    <select
                      id="prefix"
                      className="w-full px-3 py-2 border rounded-md"
                      value={formData.threadPrefixId}
                      onChange={(e) => setFormData(prev => ({ ...prev, threadPrefixId: e.target.value }))}
                    >
                      <option value="">No default prefix</option>
                      {prefixes.map((prefix) => (
                        <option key={prefix.id} value={prefix.id}>
                          {prefix.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="tags">Default Tags</Label>
                  <Input
                    id="tags"
                    placeholder="bug, help, question"
                    value={formData.tags}
                    onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isPublic"
                  checked={formData.isPublic}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPublic: checked }))}
                />
                <Label htmlFor="isPublic">Make this template public</Label>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSubmit} disabled={!formData.name || !formData.title || !formData.content}>
                  {editingTemplate ? 'Update Template' : 'Create Template'}
                </Button>
                <Button variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="my-templates">My Templates ({myTemplates.length})</TabsTrigger>
          <TabsTrigger value="public-templates">Public Templates ({publicTemplates.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="my-templates" className="space-y-4">
          {myTemplates.length > 0 ? (
            myTemplates.map((template) => (
              <TemplateCard key={template.id} template={template} />
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Templates Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first template to speed up content creation
                </p>
                <Button onClick={() => setIsCreating(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Template
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="public-templates" className="space-y-4">
          {publicTemplates.length > 0 ? (
            publicTemplates.map((template) => (
              <TemplateCard key={template.id} template={template} />
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Public Templates</h3>
                <p className="text-muted-foreground">
                  No public templates are available yet
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}