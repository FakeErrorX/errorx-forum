'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Filter, X, Clock, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SearchFilters {
  type: 'general' | 'posts' | 'users' | 'categories' | 'tags';
  category?: string;
  tags: string[];
  author?: string;
  dateFrom?: Date;
  dateTo?: Date;
  sort: 'relevance' | 'date' | 'popularity' | 'rating';
}

interface SearchResult {
  type: 'post' | 'user' | 'category' | 'tag';
  id: string;
  title: string;
  content?: string;
  url: string;
  relevanceScore: number;
  metadata?: Record<string, any>;
}

interface SearchComponentProps {
  onSearch: (query: string, filters: SearchFilters) => void;
  onResultClick?: (result: SearchResult) => void;
  suggestions?: string[];
  trending?: Array<{ topic: string; mentions: number }>;
  isLoading?: boolean;
}

export function SearchComponent({
  onSearch,
  onResultClick,
  suggestions = [],
  trending = [],
  isLoading = false
}: SearchComponentProps) {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({
    type: 'general',
    tags: [],
    sort: 'relevance'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Load recent searches from localStorage
    const stored = localStorage.getItem('recentSearches');
    if (stored) {
      setRecentSearches(JSON.parse(stored));
    }
  }, []);

  const handleSearch = (searchQuery?: string) => {
    const searchTerm = searchQuery || query;
    if (!searchTerm.trim()) return;

    // Save to recent searches
    const newRecentSearches = [searchTerm, ...recentSearches.filter(s => s !== searchTerm)].slice(0, 5);
    setRecentSearches(newRecentSearches);
    localStorage.setItem('recentSearches', JSON.stringify(newRecentSearches));

    onSearch(searchTerm, filters);
    setShowSuggestions(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const addTag = (tag: string) => {
    if (!filters.tags.includes(tag)) {
      setFilters(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
  };

  const removeTag = (tag: string) => {
    setFilters(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const clearFilters = () => {
    setFilters({
      type: 'general',
      tags: [],
      sort: 'relevance'
    });
  };

  const hasActiveFilters = filters.type !== 'general' || 
    filters.category || 
    filters.tags.length > 0 || 
    filters.author || 
    filters.dateFrom || 
    filters.dateTo || 
    filters.sort !== 'relevance';

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      {/* Main Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          onFocus={() => setShowSuggestions(true)}
          placeholder="Search posts, users, categories..."
          className="pl-10 pr-20 h-12 text-lg"
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
          <Button
            variant={showFilters ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="p-2"
          >
            <Filter className="h-4 w-4" />
            {hasActiveFilters && <span className="ml-1 text-xs">•</span>}
          </Button>
          <Button 
            onClick={() => handleSearch()}
            disabled={!query.trim() || isLoading}
            className="px-4"
          >
            {isLoading ? 'Searching...' : 'Search'}
          </Button>
        </div>
      </div>

      {/* Search Suggestions Dropdown */}
      {showSuggestions && (query || recentSearches.length > 0 || trending.length > 0) && (
        <Card className="absolute top-14 left-0 right-0 z-50 max-h-96 overflow-y-auto">
          <CardContent className="p-0">
            {/* Query Suggestions */}
            {query && suggestions.length > 0 && (
              <div className="p-3 border-b">
                <h4 className="text-sm font-medium text-gray-600 mb-2">Suggestions</h4>
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2 hover:bg-gray-50 cursor-pointer rounded"
                    onClick={() => {
                      setQuery(suggestion);
                      handleSearch(suggestion);
                    }}
                  >
                    <Search className="h-4 w-4 text-gray-400" />
                    <span>{suggestion}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Recent Searches */}
            {!query && recentSearches.length > 0 && (
              <div className="p-3 border-b">
                <h4 className="text-sm font-medium text-gray-600 mb-2">Recent Searches</h4>
                {recentSearches.map((search, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2 hover:bg-gray-50 cursor-pointer rounded"
                    onClick={() => {
                      setQuery(search);
                      handleSearch(search);
                    }}
                  >
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span>{search}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Trending Topics */}
            {!query && trending.length > 0 && (
              <div className="p-3">
                <h4 className="text-sm font-medium text-gray-600 mb-2">Trending</h4>
                {trending.slice(0, 5).map((trend, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 hover:bg-gray-50 cursor-pointer rounded"
                    onClick={() => {
                      setQuery(trend.topic);
                      handleSearch(trend.topic);
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span>{trend.topic}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {trend.mentions}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Advanced Filters */}
      {showFilters && (
        <Card className="mt-4">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Advanced Filters</CardTitle>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear All
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search Type */}
              <div>
                <label className="block text-sm font-medium mb-2">Search Type</label>
                <Select 
                  value={filters.type} 
                  onValueChange={(value) => setFilters(prev => ({ ...prev, type: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">All Content</SelectItem>
                    <SelectItem value="posts">Posts Only</SelectItem>
                    <SelectItem value="users">Users Only</SelectItem>
                    <SelectItem value="categories">Categories Only</SelectItem>
                    <SelectItem value="tags">Tags Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort Order */}
              <div>
                <label className="block text-sm font-medium mb-2">Sort By</label>
                <Select 
                  value={filters.sort} 
                  onValueChange={(value) => setFilters(prev => ({ ...prev, sort: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Relevance</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="popularity">Popularity</SelectItem>
                    <SelectItem value="rating">Rating</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Author Filter */}
              <div>
                <label className="block text-sm font-medium mb-2">Author</label>
                <Input
                  value={filters.author || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, author: e.target.value || undefined }))}
                  placeholder="Username"
                />
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium mb-2">Tags</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {filters.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => removeTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
              <Input
                placeholder="Add tags (press Enter)"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    const target = e.target as HTMLInputElement;
                    const tag = target.value.trim();
                    if (tag) {
                      addTag(tag);
                      target.value = '';
                    }
                  }
                }}
              />
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">From Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      {filters.dateFrom ? filters.dateFrom.toLocaleDateString() : 'Select date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filters.dateFrom}
                      onSelect={(date) => setFilters(prev => ({ ...prev, dateFrom: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">To Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      {filters.dateTo ? filters.dateTo.toLocaleDateString() : 'Select date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filters.dateTo}
                      onSelect={(date) => setFilters(prev => ({ ...prev, dateTo: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}