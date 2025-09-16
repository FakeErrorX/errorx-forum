import { NextRequest, NextResponse } from 'next/server';
import { validateOrigin, createSecureErrorResponse } from './lib/api-security';

export function middleware(request: NextRequest) {
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
