'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Shield, Plus, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { ModerationAction } from '@/lib/content-management';

interface ModerationRule {
  id: string;
  name: string;
  description?: string;
  pattern: string;
  action: ModerationAction;
  enabled: boolean;
  severity: number;
  categoryIds: string[];
}

interface ModerationRulesProps {
  rules: ModerationRule[];
  categories: Array<{ id: string; name: string }>;
  onCreateRule?: (rule: Omit<ModerationRule, 'id'>) => void;
  onUpdateRule?: (id: string, rule: Partial<ModerationRule>) => void;
  onDeleteRule?: (id: string) => void;
}

export function ModerationRules({ 
  rules, 
  categories, 
  onCreateRule, 
  onUpdateRule, 
  onDeleteRule 
}: ModerationRulesProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingRule, setEditingRule] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    pattern: '',
    action: ModerationAction.FLAG as ModerationAction,
    enabled: true,
    severity: 1,
    categoryIds: [] as string[],
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      pattern: '',
      action: ModerationAction.FLAG,
      enabled: true,
      severity: 1,
      categoryIds: [],
    });
    setIsCreating(false);
    setEditingRule(null);
  };

  const handleSubmit = async () => {
    try {
      if (editingRule) {
        await onUpdateRule?.(editingRule, formData);
      } else {
        await onCreateRule?.(formData);
      }
      resetForm();
    } catch (error) {
      console.error('Error saving rule:', error);
    }
  };

  const startEdit = (rule: ModerationRule) => {
    setFormData({
      name: rule.name,
      description: rule.description || '',
      pattern: rule.pattern,
      action: rule.action,
      enabled: rule.enabled,
      severity: rule.severity,
      categoryIds: rule.categoryIds,
    });
    setEditingRule(rule.id);
    setIsCreating(true);
  };

  const getSeverityColor = (severity: number) => {
    if (severity >= 3) return 'bg-red-100 text-red-800';
    if (severity >= 2) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getActionColor = (action: ModerationAction) => {
    switch (action) {
      case ModerationAction.BAN_USER:
        return 'bg-red-100 text-red-800';
      case ModerationAction.DELETE:
        return 'bg-orange-100 text-orange-800';
      case ModerationAction.HIDE:
        return 'bg-yellow-100 text-yellow-800';
      case ModerationAction.FLAG:
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Auto-Moderation Rules
          </CardTitle>
          <CardDescription>
            Configure automatic content moderation rules to maintain forum quality
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm text-muted-foreground">
              {rules.length} rule{rules.length !== 1 ? 's' : ''} configured
            </div>
            <Button onClick={() => setIsCreating(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Rule
            </Button>
          </div>

          {isCreating && (
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-lg">
                  {editingRule ? 'Edit Rule' : 'Create New Rule'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Rule Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Spam Detection"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="action">Action</Label>
                    <Select
                      value={formData.action}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, action: value as ModerationAction }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ModerationAction.FLAG}>Flag for Review</SelectItem>
                        <SelectItem value={ModerationAction.HIDE}>Hide Content</SelectItem>
                        <SelectItem value={ModerationAction.DELETE}>Delete Content</SelectItem>
                        <SelectItem value={ModerationAction.BAN_USER}>Ban User</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Input
                    id="description"
                    placeholder="Describe what this rule does..."
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pattern">Pattern (Regular Expression)</Label>
                  <Textarea
                    id="pattern"
                    placeholder="e.g., \\b(buy|sell|cheap|discount)\\b.*\\b(viagra|casino|lottery)\\b"
                    value={formData.pattern}
                    onChange={(e) => setFormData(prev => ({ ...prev, pattern: e.target.value }))}
                    className="font-mono text-sm"
                  />
                  <div className="text-xs text-muted-foreground">
                    Use regular expressions to match patterns in content. Be careful with complex patterns.
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="severity">Severity (1-5)</Label>
                    <Select
                      value={formData.severity.toString()}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, severity: parseInt(value) }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 - Low</SelectItem>
                        <SelectItem value="2">2 - Medium</SelectItem>
                        <SelectItem value="3">3 - High</SelectItem>
                        <SelectItem value="4">4 - Critical</SelectItem>
                        <SelectItem value="5">5 - Severe</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2 pt-6">
                    <Switch
                      id="enabled"
                      checked={formData.enabled}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enabled: checked }))}
                    />
                    <Label htmlFor="enabled">Enable Rule</Label>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSubmit} disabled={!formData.name || !formData.pattern}>
                    {editingRule ? 'Update Rule' : 'Create Rule'}
                  </Button>
                  <Button variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-2">
            {rules.map((rule) => (
              <Card key={rule.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{rule.name}</h4>
                        <Badge className={getSeverityColor(rule.severity)}>
                          Severity {rule.severity}
                        </Badge>
                        <Badge className={getActionColor(rule.action)}>
                          {rule.action.replace('_', ' ')}
                        </Badge>
                        {!rule.enabled && (
                          <Badge variant="secondary">Disabled</Badge>
                        )}
                      </div>
                      {rule.description && (
                        <p className="text-sm text-muted-foreground mb-2">{rule.description}</p>
                      )}
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {rule.pattern}
                      </code>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={rule.enabled}
                        onCheckedChange={(checked) => onUpdateRule?.(rule.id, { enabled: checked })}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEdit(rule)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteRule?.(rule.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {rules.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Moderation Rules</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first auto-moderation rule to start protecting your forum
                  </p>
                  <Button onClick={() => setIsCreating(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Rule
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}