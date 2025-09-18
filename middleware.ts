import { NextRequest, NextResponse } from 'next/server';
import { validateOrigin, createSecureErrorResponse } from './lib/api-security';
import { getToken } from 'next-auth/jwt';
import { hasPermission, PERMISSIONS } from './lib/permissions';
import { logger, logSecurityEvent } from '@/lib/logging';
import rateLimiter from '@/lib/rate-limiter';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  try {
    // Log request (commented out to reduce verbosity)
    // logger.logRequest(request);

    // Apply rate limiting
    const rateLimitResult = applyRateLimit(request);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    // Only apply to API routes
    if (pathname.startsWith('/api/')) {
      // Block direct browser navigations to API endpoints (avoid exposing JSON in browser)
      const secFetchMode = request.headers.get('sec-fetch-mode');
      const secFetchDest = request.headers.get('sec-fetch-dest');
      const acceptHeader = request.headers.get('accept') || '';
      const isNavigation =
        secFetchMode === 'navigate' ||
        secFetchDest === 'document' ||
        acceptHeader.includes('text/html');

      if (isNavigation && request.method === 'GET') {
        return new NextResponse('ErrorX', {
          status: 404,
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'X-Robots-Tag': 'noindex, nofollow'
          }
        });
      }

      // Validate the request origin
      if (!validateOrigin(request)) {
        logSecurityEvent({
          type: 'suspicious_activity',
          severity: 'high',
          ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          userAgent: request.headers.get('user-agent') || undefined,
          details: {
            reason: 'Invalid origin',
            path: pathname,
            origin: request.headers.get('origin'),
          },
        });

        return createSecureErrorResponse(
          'Access denied. API access is restricted to authorized domains only.',
          403
        );
      }

      // Check admin route access
      if (pathname.startsWith('/api/admin/')) {
        const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
        const userId = (token as unknown as { id?: string; userId?: string } | null)?.userId || (token as unknown as { id?: string } | null)?.id;
        
        if (!userId) {
          logSecurityEvent({
            type: 'auth_failure',
            severity: 'medium',
            ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
            userAgent: request.headers.get('user-agent') || undefined,
            details: {
              reason: 'No token for admin route',
              path: pathname,
            },
          });
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user has admin access
        const permissionCheck = await hasPermission(userId, PERMISSIONS.ADMIN_ACCESS);
        if (!permissionCheck.hasPermission) {
          logSecurityEvent({
            type: 'auth_failure',
            severity: 'high',
            ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
            userAgent: request.headers.get('user-agent') || undefined,
            userId,
            details: {
              reason: 'Insufficient permissions for admin route',
              path: pathname,
              userRole: permissionCheck.userRole,
              requiredPermission: permissionCheck.requiredPermission,
            },
          });

          return NextResponse.json({ 
            error: 'Insufficient permissions',
            details: `Required: ${permissionCheck.requiredPermission}, User role: ${permissionCheck.userRole}`
          }, { status: 403 });
        }
      }
      
      // Allow the request and add CORS headers
      const response = NextResponse.next();
      
      const origin = request.headers.get('origin');
      if (origin) {
        response.headers.set('Access-Control-Allow-Origin', origin);
      }
      
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      response.headers.set('Access-Control-Allow-Credentials', 'true');
      
      // Add security headers
      addSecurityHeaders(response);
      
      return response;
    }
    
    // For non-API requests, add security headers and continue
    const response = NextResponse.next();
    addSecurityHeaders(response);
    return response;

  } catch (error) {
    logger.error('Middleware error', error instanceof Error ? error : new Error(String(error)), {
      path: pathname,
      method: request.method,
    });

    // Log security event for middleware failures
    logSecurityEvent({
      type: 'suspicious_activity',
      severity: 'medium',
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || undefined,
      details: {
        error: error instanceof Error ? error.message : String(error),
        path: pathname,
        method: request.method,
      },
    });

    // Allow request to continue even if middleware fails
    return NextResponse.next();
  }
}

function applyRateLimit(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

  try {
    // Define rate limits based on endpoint type
    let rateLimit = { windowMs: 60 * 1000, maxRequests: 100 }; // Default: 100 requests per minute

    // Authentication endpoints - stricter limits
    if (pathname.startsWith('/api/auth/') || pathname.startsWith('/signin') || pathname.startsWith('/signup')) {
      rateLimit = { windowMs: 15 * 60 * 1000, maxRequests: 5 }; // 5 requests per 15 minutes
    }
    // Upload endpoints
    else if (pathname.includes('/upload') || pathname.includes('/file')) {
      rateLimit = { windowMs: 10 * 60 * 1000, maxRequests: 10 }; // 10 requests per 10 minutes
    }
    // Search endpoints
    else if (pathname.includes('/search')) {
      rateLimit = { windowMs: 60 * 1000, maxRequests: 30 }; // 30 requests per minute
    }
    // API endpoints
    else if (pathname.startsWith('/api/')) {
      rateLimit = { windowMs: 60 * 1000, maxRequests: 60 }; // 60 requests per minute
    }
    // General page requests
    else {
      rateLimit = { windowMs: 60 * 1000, maxRequests: 200 }; // 200 requests per minute
    }

    const result = rateLimiter.check(request, rateLimit);
    
    if (!result.allowed) {
      const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);
      
      // Log rate limit violations for auth and admin endpoints
      if (pathname.startsWith('/api/auth/') || pathname.startsWith('/api/admin/')) {
        logSecurityEvent({
          type: 'rate_limit',
          severity: 'medium',
          ip,
          userAgent: request.headers.get('user-agent') || undefined,
          details: {
            type: pathname.startsWith('/api/auth/') ? 'auth' : 'admin',
            path: pathname,
            remaining: result.remaining,
            resetTime: result.resetTime,
          },
        });
      }
      
      return new NextResponse('Rate limit exceeded', { 
        status: 429,
        headers: {
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Limit': result.total.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString(),
        },
      });
    }

    return null; // No rate limit applied
  } catch (error) {
    logger.error('Rate limiting error', error instanceof Error ? error : new Error(String(error)), {
      ip,
      path: pathname,
    });
    return null; // Allow request on rate limiting error
  }
}

function addSecurityHeaders(response: NextResponse) {
  // Security headers - Relaxed configuration
  response.headers.set('X-Frame-Options', 'ALLOWALL');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'unsafe-url');
  response.headers.set('X-XSS-Protection', '0');
  
  // Content Security Policy - Permissive configuration
  const csp = [
    "default-src *",
    "script-src * 'unsafe-eval' 'unsafe-inline'",
    "style-src * 'unsafe-inline'",
    "font-src *",
    "img-src * data: blob:",
    "media-src * data: blob:",
    "connect-src *",
    "object-src *",
    "base-uri *",
    "form-action *",
    "frame-ancestors *",
    "frame-src *",
    "child-src *",
    "worker-src * blob:",
    "manifest-src *",
  ].join('; ');
  
  response.headers.set('Content-Security-Policy', csp);

  // HSTS (disabled for development)
  // if (process.env.NODE_ENV === 'production') {
  //   response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  // }

  // Permissions Policy - Permissive
  response.headers.set('Permissions-Policy', 'camera=*, microphone=*, geolocation=*, payment=*, usb=*');
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
