'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Clock, Save, Send } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ContentSchedulerProps {
  categories: Array<{ id: string; name: string }>;
  prefixes?: Array<{ id: string; name: string; color?: string }>;
  onSchedule?: (data: any) => void;
  onSaveDraft?: (data: any) => void;
}

export function ContentScheduler({ categories, prefixes, onSchedule, onSaveDraft }: ContentSchedulerProps) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    categoryId: '',
    prefixId: '',
    scheduledFor: undefined as Date | undefined,
    tags: '',
    metadata: {},
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (action: 'schedule' | 'draft') => {
    setIsLoading(true);
    try {
      const data = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      };

      if (action === 'schedule') {
        if (!formData.scheduledFor) {
          alert('Please select a scheduled date');
          return;
        }
        await onSchedule?.(data);
      } else {
        await onSaveDraft?.(data);
      }

      // Reset form
      setFormData({
        title: '',
        content: '',
        categoryId: '',
        prefixId: '',
        scheduledFor: undefined,
        tags: '',
        metadata: {},
      });
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Content Scheduler
        </CardTitle>
        <CardDescription>
          Create and schedule posts for future publication or save as drafts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            placeholder="Enter post title..."
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.categoryId}
              onValueChange={(value) => setFormData(prev => ({ ...prev, categoryId: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {prefixes && prefixes.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="prefix">Thread Prefix (Optional)</Label>
              <Select
                value={formData.prefixId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, prefixId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select prefix" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No prefix</SelectItem>
                  {prefixes.map((prefix) => (
                    <SelectItem key={prefix.id} value={prefix.id}>
                      <span
                        className="inline-block w-3 h-3 rounded mr-2"
                        style={{ backgroundColor: prefix.color || '#6B7280' }}
                      />
                      {prefix.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="content">Content</Label>
          <Textarea
            id="content"
            placeholder="Write your post content..."
            className="min-h-[200px]"
            value={formData.content}
            onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tags">Tags (comma-separated)</Label>
          <Input
            id="tags"
            placeholder="technology, news, discussion..."
            value={formData.tags}
            onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label>Schedule for Publication</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData.scheduledFor && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.scheduledFor ? (
                  format(formData.scheduledFor, "PPP 'at' p")
                ) : (
                  <span>Pick a date and time</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={formData.scheduledFor}
                onSelect={(date) => setFormData(prev => ({ ...prev, scheduledFor: date }))}
                disabled={(date) => date < new Date()}
                initialFocus
              />
              <div className="p-3 border-t">
                <Input
                  type="time"
                  value={formData.scheduledFor ? format(formData.scheduledFor, 'HH:mm') : ''}
                  onChange={(e) => {
                    if (formData.scheduledFor && e.target.value) {
                      const [hours, minutes] = e.target.value.split(':');
                      const newDate = new Date(formData.scheduledFor);
                      newDate.setHours(parseInt(hours), parseInt(minutes));
                      setFormData(prev => ({ ...prev, scheduledFor: newDate }));
                    }
                  }}
                />
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex gap-2 pt-4">
          <Button
            variant="outline"
            onClick={() => handleSubmit('draft')}
            disabled={isLoading || !formData.title || !formData.content}
            className="flex-1"
          >
            <Save className="mr-2 h-4 w-4" />
            Save as Draft
          </Button>
          <Button
            onClick={() => handleSubmit('schedule')}
            disabled={isLoading || !formData.title || !formData.content || !formData.categoryId}
            className="flex-1"
          >
            <Send className="mr-2 h-4 w-4" />
            {formData.scheduledFor ? 'Schedule Post' : 'Publish Now'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}