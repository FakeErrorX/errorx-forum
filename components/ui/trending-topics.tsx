'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  Hash, 
  Clock,
  Filter
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface TrendingTopic {
  topic: string;
  mentions: number;
  score: number;
  category?: string;
  timeframe: string;
}

interface TrendingTopicsProps {
  className?: string;
  onTopicClick?: (topic: string) => void;
  showFilters?: boolean;
  maxItems?: number;
}

export function TrendingTopics({ 
  className,
  onTopicClick,
  showFilters = true,
  maxItems = 10
}: TrendingTopicsProps) {
  const [trending, setTrending] = useState<TrendingTopic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [category, setCategory] = useState<string>('');

  useEffect(() => {
    fetchTrending();
  }, [timeframe, category]);

  const fetchTrending = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        timeframe,
        limit: maxItems.toString()
      });
      if (category) params.append('category', category);

      const response = await fetch(`/api/search/trending?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setTrending(data.data.trending);
      }
    } catch (error) {
      console.error('Error fetching trending topics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTimeframeLabel = (tf: string) => {
    switch (tf) {
      case '1h': return 'Last Hour';
      case '24h': return 'Last 24 Hours';
      case '7d': return 'Last Week';
      case '30d': return 'Last Month';
      default: return tf;
    }
  };

  const getTrendIcon = (score: number, index: number) => {
    if (index === 0) return <TrendingUp className="h-4 w-4 text-red-500" />;
    if (score > 50) return <TrendingUp className="h-4 w-4 text-orange-500" />;
    if (score > 20) return <TrendingUp className="h-4 w-4 text-yellow-500" />;
    return <TrendingUp className="h-4 w-4 text-green-500" />;
  };

  const handleTopicClick = (topic: string) => {
    if (onTopicClick) {
      onTopicClick(topic);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-orange-500" />
            Trending Topics
          </CardTitle>
          {showFilters && (
            <div className="flex items-center gap-2">
              <Select value={timeframe} onValueChange={(value: any) => setTimeframe(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">1 Hour</SelectItem>
                  <SelectItem value="24h">24 Hours</SelectItem>
                  <SelectItem value="7d">7 Days</SelectItem>
                  <SelectItem value="30d">30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        {showFilters && (
          <p className="text-sm text-gray-600">
            Trending in {getTimeframeLabel(timeframe)}
          </p>
        )}
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-4 bg-gray-200 rounded"></div>
                    <div className="h-4 w-24 bg-gray-200 rounded"></div>
                  </div>
                  <div className="h-5 w-12 bg-gray-200 rounded-full"></div>
                </div>
              </div>
            ))}
          </div>
        ) : trending.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Hash className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No trending topics found</p>
            <p className="text-sm mt-1">Try a different timeframe</p>
          </div>
        ) : (
          <div className="space-y-2">
            {trending.map((topic, index) => (
              <div
                key={`${topic.topic}-${topic.timeframe}`}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => handleTopicClick(topic.topic)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-400 w-6 text-center">
                      {index + 1}
                    </span>
                    {getTrendIcon(topic.score, index)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 truncate">
                        #{topic.topic}
                      </span>
                      {topic.category && (
                        <Badge variant="secondary" className="text-xs">
                          {topic.category}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                      <span>{topic.mentions.toLocaleString()} mentions</span>
                      <span>•</span>
                      <span>Score: {Math.round(topic.score)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={index < 3 ? 'default' : 'secondary'} 
                    className="text-xs font-bold"
                  >
                    {topic.mentions}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {!isLoading && trending.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>Updated every hour</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={fetchTrending}
                className="text-xs"
              >
                Refresh
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Compact version for sidebars
export function TrendingTopicsCompact({ 
  onTopicClick,
  maxItems = 5
}: {
  onTopicClick?: (topic: string) => void;
  maxItems?: number;
}) {
  const [trending, setTrending] = useState<TrendingTopic[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTrending();
  }, []);

  const fetchTrending = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/search/trending?timeframe=24h&limit=${maxItems}`);
      const data = await response.json();
      
      if (data.success) {
        setTrending(data.data.trending);
      }
    } catch (error) {
      console.error('Error fetching trending topics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="animate-pulse flex items-center gap-2">
            <div className="h-4 w-4 bg-gray-200 rounded"></div>
            <div className="h-4 flex-1 bg-gray-200 rounded"></div>
            <div className="h-4 w-8 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (trending.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500 text-sm">
        No trending topics
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {trending.map((topic, index) => (
        <div
          key={`${topic.topic}-compact`}
          className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer transition-colors text-sm"
          onClick={() => onTopicClick?.(topic.topic)}
        >
          <TrendingUp className="h-3 w-3 text-orange-500 flex-shrink-0" />
          <span className="flex-1 truncate font-medium">
            #{topic.topic}
          </span>
          <Badge variant="secondary" className="text-xs">
            {topic.mentions}
          </Badge>
        </div>
      ))}
    </div>
  );
}