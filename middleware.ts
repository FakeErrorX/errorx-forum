import { NextRequest, NextResponse } from 'next/server';
import { validateOrigin, createSecureErrorResponse } from './lib/api-security';

export function middleware(request: NextRequest) {
  // Only apply to API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
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
