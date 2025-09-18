import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

class RateLimiter {
  private store: RateLimitStore = {};
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  private cleanup() {
    const now = Date.now();
    Object.keys(this.store).forEach(key => {
      if (this.store[key].resetTime < now) {
        delete this.store[key];
      }
    });
  }

  private getKey(identifier: string, endpoint: string): string {
    return `${identifier}:${endpoint}`;
  }

  private getClientIdentifier(request: NextRequest): string {
    // Try to get user ID from session/token first
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      // Extract user ID from token if available
      // This would need actual token verification
      const userId = this.extractUserIdFromToken(authHeader);
      if (userId) return `user:${userId}`;
    }

    // Fall back to IP address
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const clientIp = forwarded?.split(',')[0] || realIp || 'unknown';
    
    return `ip:${clientIp}`;
  }

  private extractUserIdFromToken(authHeader: string): string | null {
    // This is a placeholder - implement actual JWT/session verification
    try {
      // Extract and verify JWT token
      // Return user ID if valid
      return null;
    } catch {
      return null;
    }
  }

  check(request: NextRequest, config: RateLimitConfig, endpoint: string = 'default'): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
    total: number;
  } {
    const identifier = this.getClientIdentifier(request);
    const key = this.getKey(identifier, endpoint);
    const now = Date.now();

    if (!this.store[key] || this.store[key].resetTime < now) {
      this.store[key] = {
        count: 1,
        resetTime: now + config.windowMs,
      };
      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetTime: this.store[key].resetTime,
        total: config.maxRequests,
      };
    }

    this.store[key].count++;

    return {
      allowed: this.store[key].count <= config.maxRequests,
      remaining: Math.max(0, config.maxRequests - this.store[key].count),
      resetTime: this.store[key].resetTime,
      total: config.maxRequests,
    };
  }

  destroy() {
    clearInterval(this.cleanupInterval);
  }
}

// Global rate limiter instance
const rateLimiter = new RateLimiter();

// Predefined rate limit configurations
export const rateLimitConfigs = {
  // Authentication endpoints - stricter limits
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts per 15 minutes
  } as RateLimitConfig,

  // API endpoints - moderate limits
  api: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60, // 60 requests per minute
  } as RateLimitConfig,

  // Search endpoints - higher limits
  search: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30, // 30 searches per minute
  } as RateLimitConfig,

  // Upload endpoints - stricter limits
  upload: {
    windowMs: 10 * 60 * 1000, // 10 minutes
    maxRequests: 10, // 10 uploads per 10 minutes
  } as RateLimitConfig,

  // Password reset - very strict
  passwordReset: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3, // 3 attempts per hour
  } as RateLimitConfig,

  // General endpoints - relaxed limits
  general: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests per minute
  } as RateLimitConfig,

  // Posting content - moderate limits
  posting: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 posts per minute
  } as RateLimitConfig,

  // Admin endpoints - moderate limits
  admin: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests per minute
  } as RateLimitConfig,
};

export function createRateLimitMiddleware(config: RateLimitConfig, endpoint?: string) {
  return (request: NextRequest) => {
    const result = rateLimiter.check(request, config, endpoint);

    if (!result.allowed) {
      return NextResponse.json(
        {
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': result.total.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString(),
            'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    return null; // Allow request to proceed
  };
}

export function withRateLimit(
  handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>,
  config: RateLimitConfig,
  endpoint?: string
) {
  return async (request: NextRequest, ...args: any[]) => {
    const rateLimitResult = createRateLimitMiddleware(config, endpoint)(request);
    
    if (rateLimitResult) {
      return rateLimitResult;
    }

    try {
      const response = await handler(request, ...args);
      
      // Add rate limit headers to successful responses
      const result = rateLimiter.check(request, config, endpoint);
      response.headers.set('X-RateLimit-Limit', result.total.toString());
      response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
      response.headers.set('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000).toString());
      
      return response;
    } catch (error) {
      console.error('Handler error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

// Utility function to check if request should be rate limited
export function shouldRateLimit(request: NextRequest): boolean {
  // Skip rate limiting for health checks, static assets, etc.
  const pathname = request.nextUrl.pathname;
  
  const skipPaths = [
    '/health',
    '/_next',
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml',
  ];

  return !skipPaths.some(path => pathname.startsWith(path));
}

export default rateLimiter;