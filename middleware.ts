import { NextRequest, NextResponse } from 'next/server';
import { validateOrigin, createSecureErrorResponse } from './lib/api-security';
import { getToken } from 'next-auth/jwt';
import { hasPermission, PERMISSIONS } from './lib/permissions';
import { logger, logSecurityEvent } from '@/lib/logging';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  try {

    // Only apply to API routes
    if (pathname.startsWith('/api/')) {
      // Skip security checks for NextAuth callback routes and session routes
      if (pathname.startsWith('/api/auth/')) {
        // Allow NextAuth routes to proceed without any additional security checks
        const response = NextResponse.next();
        // Don't add strict security headers for auth routes
        response.headers.set('X-Content-Type-Options', 'nosniff');
        response.headers.set('X-XSS-Protection', '1; mode=block');
        return response;
      }

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

      // Skip origin validation in development
      if (process.env.NODE_ENV === 'production') {
        // Validate the request origin only in production
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

    return NextResponse.next();
  }
}

function addSecurityHeaders(response: NextResponse) {
  // Basic security headers only - CSP removed
  response.headers.set('X-Frame-Options', 'ALLOWALL');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'unsafe-url');
  response.headers.set('X-XSS-Protection', '0');
  
  // Content Security Policy removed to avoid blocking external resources
  
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
