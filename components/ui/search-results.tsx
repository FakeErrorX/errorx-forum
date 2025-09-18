'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  User, 
  Calendar, 
  MessageSquare, 
  Heart, 
  Folder,
  Tag,
  Clock,
  Star
} from 'lucide-react';

interface SearchResult {
  type: 'post' | 'user' | 'category' | 'tag';
  id: string;
  title: string;
  content?: string;
  url: string;
  relevanceScore: number;
  metadata?: Record<string, any>;
}

interface SearchResultsProps {
  results: SearchResult[];
  isLoading?: boolean;
  query: string;
  totalCount: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  onResultClick?: (result: SearchResult) => void;
}

export function SearchResults({
  results,
  isLoading = false,
  query,
  totalCount,
  currentPage,
  onPageChange,
  onResultClick
}: SearchResultsProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-5/6"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">🔍</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No results found for "{query}"
        </h3>
        <p className="text-gray-600 mb-6">
          Try adjusting your search terms or filters
        </p>
        <div className="text-sm text-gray-500">
          <p>Suggestions:</p>
          <ul className="mt-2 space-y-1">
            <li>• Check your spelling</li>
            <li>• Try more general terms</li>
            <li>• Remove some filters</li>
            <li>• Browse popular categories</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Results Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold">
            Search Results for "{query}"
          </h2>
          <p className="text-gray-600 mt-1">
            {totalCount.toLocaleString()} results found
          </p>
        </div>
      </div>

      {/* Results List */}
      <div className="space-y-4">
        {results.map((result) => (
          <SearchResultCard 
            key={`${result.type}-${result.id}`}
            result={result}
            onClick={onResultClick}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalCount > 20 && (
        <div className="flex justify-center mt-8">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            {/* Page numbers */}
            {Array.from({ length: Math.min(5, Math.ceil(totalCount / 20)) }, (_, i) => {
              const page = currentPage - 2 + i;
              if (page < 1 || page > Math.ceil(totalCount / 20)) return null;
              
              return (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    page === currentPage
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              );
            })}
            
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= Math.ceil(totalCount / 20)}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SearchResultCard({ 
  result, 
  onClick 
}: { 
  result: SearchResult; 
  onClick?: (result: SearchResult) => void;
}) {
  const handleClick = () => {
    if (onClick) {
      onClick(result);
    }
  };

  const getResultIcon = () => {
    switch (result.type) {
      case 'post':
        return <MessageSquare className="h-5 w-5 text-blue-500" />;
      case 'user':
        return <User className="h-5 w-5 text-green-500" />;
      case 'category':
        return <Folder className="h-5 w-5 text-purple-500" />;
      case 'tag':
        return <Tag className="h-5 w-5 text-orange-500" />;
      default:
        return null;
    }
  };

  const getResultTypeLabel = () => {
    return result.type.charAt(0).toUpperCase() + result.type.slice(1);
  };

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={handleClick}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            {getResultIcon()}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs">
                {getResultTypeLabel()}
              </Badge>
              {result.relevanceScore && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Star className="h-3 w-3" />
                  {Math.round(result.relevanceScore)}% match
                </div>
              )}
            </div>
            
            <h3 className="text-lg font-medium text-gray-900 mb-2 hover:text-blue-600">
              <Link href={result.url}>
                {result.title}
              </Link>
            </h3>
            
            {result.content && (
              <p className="text-gray-600 mb-3 line-clamp-2">
                {result.content}
              </p>
            )}
            
            {/* Type-specific metadata */}
            <div className="flex items-center gap-4 text-sm text-gray-500">
              {result.type === 'post' && result.metadata && (
                <>
                  {result.metadata.author && (
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      <span>{result.metadata.author}</span>
                    </div>
                  )}
                  {result.metadata.category && (
                    <div className="flex items-center gap-1">
                      <Folder className="h-4 w-4" />
                      <span>{result.metadata.category}</span>
                    </div>
                  )}
                  {result.metadata.comments !== undefined && (
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-4 w-4" />
                      <span>{result.metadata.comments}</span>
                    </div>
                  )}
                  {result.metadata.likes !== undefined && (
                    <div className="flex items-center gap-1">
                      <Heart className="h-4 w-4" />
                      <span>{result.metadata.likes}</span>
                    </div>
                  )}
                  {result.metadata.createdAt && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(result.metadata.createdAt).toLocaleDateString()}</span>
                    </div>
                  )}
                </>
              )}
              
              {result.type === 'user' && result.metadata && (
                <>
                  {result.metadata.avatar && (
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={result.metadata.avatar} />
                      <AvatarFallback>
                        {result.metadata.username?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  {result.metadata.username && (
                    <span>@{result.metadata.username}</span>
                  )}
                  {result.metadata.posts !== undefined && (
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-4 w-4" />
                      <span>{result.metadata.posts} posts</span>
                    </div>
                  )}
                  {result.metadata.followers !== undefined && (
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      <span>{result.metadata.followers} followers</span>
                    </div>
                  )}
                </>
              )}
              
              {result.type === 'category' && result.metadata && (
                <>
                  {result.metadata.posts !== undefined && (
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-4 w-4" />
                      <span>{result.metadata.posts} posts</span>
                    </div>
                  )}
                </>
              )}
              
              {result.type === 'tag' && result.metadata && (
                <>
                  {result.metadata.posts !== undefined && (
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-4 w-4" />
                      <span>{result.metadata.posts} posts</span>
                    </div>
                  )}
                </>
              )}
            </div>
            
            {/* Tags for posts */}
            {result.type === 'post' && result.metadata?.tags && result.metadata.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {result.metadata.tags.slice(0, 3).map((tag: string, index: number) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {result.metadata.tags.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{result.metadata.tags.length - 3} more
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}