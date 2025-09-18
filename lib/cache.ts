import { NextRequest, NextResponse } from 'next/server';

interface CacheConfig {
  ttl: number; // Time to live in seconds
  staleWhileRevalidate?: number; // Additional time to serve stale content
  tags?: string[]; // Cache tags for invalidation
  vary?: string[]; // Headers to vary cache by
}

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
  staleUntil: number;
  tags: string[];
  headers?: Record<string, string>;
}

class MemoryCache {
  private cache = new Map<string, CacheEntry>();
  private tagIndex = new Map<string, Set<string>>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.staleUntil) {
        this.delete(key);
      }
    }
  }

  private generateKey(request: NextRequest, config: CacheConfig): string {
    const url = new URL(request.url);
    let key = `${request.method}:${url.pathname}${url.search}`;

    // Include varying headers in the key
    if (config.vary) {
      const varyParts = config.vary.map(header => {
        const value = request.headers.get(header) || '';
        return `${header}:${value}`;
      }).join('|');
      
      if (varyParts) {
        key += `|vary:${varyParts}`;
      }
    }

    return key;
  }

  private updateTagIndex(key: string, tags: string[]) {
    tags.forEach(tag => {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set());
      }
      this.tagIndex.get(tag)!.add(key);
    });
  }

  private removeFromTagIndex(key: string, tags: string[]) {
    tags.forEach(tag => {
      const tagSet = this.tagIndex.get(tag);
      if (tagSet) {
        tagSet.delete(key);
        if (tagSet.size === 0) {
          this.tagIndex.delete(tag);
        }
      }
    });
  }

  set(request: NextRequest, data: any, config: CacheConfig, headers?: Record<string, string>): void {
    const key = this.generateKey(request, config);
    const now = Date.now();
    const ttlMs = config.ttl * 1000;
    const staleMs = (config.staleWhileRevalidate || 0) * 1000;

    const entry: CacheEntry = {
      data,
      timestamp: now,
      ttl: config.ttl,
      staleUntil: now + ttlMs + staleMs,
      tags: config.tags || [],
      headers,
    };

    // Remove old entry from tag index if it exists
    const oldEntry = this.cache.get(key);
    if (oldEntry) {
      this.removeFromTagIndex(key, oldEntry.tags);
    }

    this.cache.set(key, entry);
    this.updateTagIndex(key, entry.tags);
  }

  get(request: NextRequest, config: CacheConfig): {
    data: any;
    isStale: boolean;
    headers?: Record<string, string>;
  } | null {
    const key = this.generateKey(request, config);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    const now = Date.now();
    const ttlMs = entry.ttl * 1000;
    const isExpired = now > entry.timestamp + ttlMs;
    const isStale = now > entry.staleUntil;

    if (isStale) {
      this.delete(key);
      return null;
    }

    return {
      data: entry.data,
      isStale: isExpired,
      headers: entry.headers,
    };
  }

  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (entry) {
      this.removeFromTagIndex(key, entry.tags);
      return this.cache.delete(key);
    }
    return false;
  }

  invalidateByTag(tag: string): number {
    const tagSet = this.tagIndex.get(tag);
    if (!tagSet) {
      return 0;
    }

    let count = 0;
    for (const key of tagSet) {
      if (this.cache.delete(key)) {
        count++;
      }
    }

    this.tagIndex.delete(tag);
    return count;
  }

  invalidateByTags(tags: string[]): number {
    return tags.reduce((total, tag) => total + this.invalidateByTag(tag), 0);
  }

  clear(): void {
    this.cache.clear();
    this.tagIndex.clear();
  }

  getStats() {
    return {
      entries: this.cache.size,
      tags: this.tagIndex.size,
      memoryUsage: process.memoryUsage(),
    };
  }

  destroy() {
    clearInterval(this.cleanupInterval);
    this.clear();
  }
}

// Global cache instance
const cache = new MemoryCache();

// Predefined cache configurations
export const cacheConfigs = {
  // Static content - long cache
  static: {
    ttl: 24 * 60 * 60, // 24 hours
    staleWhileRevalidate: 7 * 24 * 60 * 60, // 7 days
  } as CacheConfig,

  // API responses - moderate cache
  api: {
    ttl: 5 * 60, // 5 minutes
    staleWhileRevalidate: 15 * 60, // 15 minutes
    vary: ['authorization'],
  } as CacheConfig,

  // User-specific data - short cache
  userSpecific: {
    ttl: 60, // 1 minute
    staleWhileRevalidate: 5 * 60, // 5 minutes
    vary: ['authorization'],
  } as CacheConfig,

  // Search results - moderate cache
  search: {
    ttl: 10 * 60, // 10 minutes
    staleWhileRevalidate: 30 * 60, // 30 minutes
    tags: ['search'],
  } as CacheConfig,

  // Posts and content - moderate cache with tags
  content: {
    ttl: 15 * 60, // 15 minutes
    staleWhileRevalidate: 60 * 60, // 1 hour
    tags: ['content', 'posts'],
  } as CacheConfig,

  // User profiles - longer cache
  profiles: {
    ttl: 30 * 60, // 30 minutes
    staleWhileRevalidate: 2 * 60 * 60, // 2 hours
    tags: ['profiles'],
  } as CacheConfig,

  // Analytics data - longer cache
  analytics: {
    ttl: 60 * 60, // 1 hour
    staleWhileRevalidate: 4 * 60 * 60, // 4 hours
    tags: ['analytics'],
  } as CacheConfig,
};

// Cache middleware factory
export function createCacheMiddleware(config: CacheConfig) {
  return async (
    request: NextRequest,
    handler: (request: NextRequest) => Promise<NextResponse>
  ): Promise<NextResponse> => {
    // Only cache GET requests
    if (request.method !== 'GET') {
      return handler(request);
    }

    // Check cache first
    const cached = cache.get(request, config);
    if (cached) {
      const response = NextResponse.json(cached.data);
      
      // Add cache headers
      response.headers.set('X-Cache', cached.isStale ? 'STALE' : 'HIT');
      response.headers.set('Cache-Control', `max-age=${config.ttl}`);
      
      if (cached.headers) {
        Object.entries(cached.headers).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
      }

      // If stale, trigger background revalidation
      if (cached.isStale) {
        setImmediate(async () => {
          try {
            const freshResponse = await handler(request);
            if (freshResponse.ok) {
              const freshData = await freshResponse.json();
              const responseHeaders: Record<string, string> = {};
              
              freshResponse.headers.forEach((value, key) => {
                if (!key.startsWith('x-cache')) {
                  responseHeaders[key] = value;
                }
              });
              
              cache.set(request, freshData, config, responseHeaders);
            }
          } catch (error) {
            console.error('Background revalidation failed:', error);
          }
        });
      }

      return response;
    }

    // Execute handler and cache result
    try {
      const response = await handler(request);
      
      if (response.ok && response.headers.get('content-type')?.includes('application/json')) {
        const data = await response.json();
        
        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          if (!key.startsWith('x-cache')) {
            responseHeaders[key] = value;
          }
        });
        
        cache.set(request, data, config, responseHeaders);
        
        const cachedResponse = NextResponse.json(data);
        cachedResponse.headers.set('X-Cache', 'MISS');
        cachedResponse.headers.set('Cache-Control', `max-age=${config.ttl}`);
        
        Object.entries(responseHeaders).forEach(([key, value]) => {
          cachedResponse.headers.set(key, value);
        });
        
        return cachedResponse;
      }
      
      return response;
    } catch (error) {
      console.error('Handler execution failed:', error);
      throw error;
    }
  };
}

// Cache invalidation utilities
export const cacheInvalidation = {
  // Invalidate all content-related cache
  invalidateContent: () => {
    return cache.invalidateByTags(['content', 'posts', 'comments']);
  },

  // Invalidate user-specific cache
  invalidateUser: (userId: string) => {
    return cache.invalidateByTags([`user:${userId}`, 'profiles']);
  },

  // Invalidate search cache
  invalidateSearch: () => {
    return cache.invalidateByTag('search');
  },

  // Invalidate analytics cache
  invalidateAnalytics: () => {
    return cache.invalidateByTag('analytics');
  },

  // Invalidate by multiple tags
  invalidateByTags: (tags: string[]) => {
    return cache.invalidateByTags(tags);
  },

  // Clear all cache
  clearAll: () => {
    cache.clear();
  },

  // Get cache statistics
  getStats: () => {
    return cache.getStats();
  },
};

// Utility function to add cache headers to responses
export function addCacheHeaders(response: NextResponse, config: CacheConfig): NextResponse {
  response.headers.set('Cache-Control', `max-age=${config.ttl}`);
  
  if (config.staleWhileRevalidate) {
    response.headers.set(
      'Cache-Control',
      `max-age=${config.ttl}, stale-while-revalidate=${config.staleWhileRevalidate}`
    );
  }

  if (config.vary) {
    response.headers.set('Vary', config.vary.join(', '));
  }

  return response;
}

// Browser cache utilities
export const browserCache = {
  // Cache for static assets
  static: 'public, max-age=31536000, immutable', // 1 year
  
  // Cache for dynamic content
  dynamic: 'public, max-age=300, stale-while-revalidate=600', // 5 minutes
  
  // No cache for sensitive data
  noCache: 'private, no-cache, no-store, must-revalidate',
  
  // Short cache for API responses
  api: 'public, max-age=60, stale-while-revalidate=300', // 1 minute
};

export default cache;