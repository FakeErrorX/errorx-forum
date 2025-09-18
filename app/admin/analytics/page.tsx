'use client';

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnalyticsDashboard } from '@/components/ui/analytics-dashboard';
import { UserAnalyticsView } from '@/components/ui/user-analytics-view';
import {
  BarChart3,
  Users,
  FileText,
  Globe,
  TrendingUp,
  Activity,
  Shield,
  Database
} from 'lucide-react';

export default function AdminAnalyticsPage() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics & Insights</h1>
          <p className="text-gray-600 mt-1">
            Comprehensive analytics and insights for your forum
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-500" />
          <span className="text-sm font-medium text-blue-600">Admin Access</span>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Analytics</p>
                <p className="text-xl font-bold">Dashboard</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">User Insights</p>
                <p className="text-xl font-bold">Analytics</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FileText className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Content</p>
                <p className="text-xl font-bold">Performance</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Activity className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Real-time</p>
                <p className="text-xl font-bold">Monitoring</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Content
          </TabsTrigger>
          <TabsTrigger value="traffic" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Traffic
          </TabsTrigger>
          <TabsTrigger value="engagement" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Engagement
          </TabsTrigger>
          <TabsTrigger value="realtime" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Real-time
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <AnalyticsDashboard />
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <UserAnalyticsView />
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Content Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Content Analytics</h3>
                <p className="text-gray-600">
                  Detailed content performance metrics and insights coming soon.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="traffic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Traffic Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Traffic Analytics</h3>
                <p className="text-gray-600">
                  Comprehensive traffic analysis and geographic insights coming soon.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Engagement Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Engagement Analytics</h3>
                <p className="text-gray-600">
                  Deep engagement metrics and user behavior analysis coming soon.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="realtime" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-green-500" />
                Real-time Monitoring
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Real-time Monitoring</h3>
                <p className="text-gray-600">
                  Live activity monitoring and real-time event tracking coming soon.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <Card className="border-t">
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>
              Analytics data is updated in real-time and aggregated for optimal performance.
            </div>
            <div className="flex items-center gap-2">
              <span>Powered by</span>
              <span className="font-medium text-blue-600">ErrorX Analytics</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}