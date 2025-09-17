import { NextRequest, NextResponse } from 'next/server';
import { validateOrigin, createSecureErrorResponse } from './lib/api-security';
import { getToken } from 'next-auth/jwt';
import { hasPermission, PERMISSIONS } from './lib/permissions';

export async function middleware(request: NextRequest) {
  // Only apply to API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
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
      return createSecureErrorResponse(
        'Access denied. API access is restricted to authorized domains only.',
        403
      );
    }

    // Check admin route access
    if (request.nextUrl.pathname.startsWith('/api/admin/')) {
      const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
      const userId = (token as unknown as { id?: string; userId?: string } | null)?.userId || (token as unknown as { id?: string } | null)?.id;
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Check if user has admin access
      const permissionCheck = await hasPermission(userId, PERMISSIONS.ADMIN_ACCESS);
      if (!permissionCheck.hasPermission) {
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
    
    return response;
  }
  
  // Allow non-API requests to pass through
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/(.*)',
  ],
};
