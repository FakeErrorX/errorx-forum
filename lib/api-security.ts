import { NextResponse } from 'next/server';

/**
 * Add security headers to API responses
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY');
  
  // Enable XSS filtering
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Control referrer information
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Prevent caching of sensitive data
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  
  // Remove server information
  response.headers.delete('X-Powered-By');
  
  return response;
}

/**
 * Create a secure error response
 */
export function createSecureErrorResponse(message: string, status: number = 400): NextResponse {
  const response = NextResponse.json(
    { 
      error: message,
      timestamp: new Date().toISOString()
    },
    { status }
  );
  
  return addSecurityHeaders(response);
}

/**
 * Create a secure success response
 */
export function createSecureResponse(data: any, status: number = 200): NextResponse {
  const response = NextResponse.json(data, { status });
  return addSecurityHeaders(response);
}

/**
 * Validate request origin
 */
export function validateOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const host = request.headers.get('host');
  
  // Get allowed origins from environment
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
  
  // Get the site URL from environment
  const siteUrl = process.env.NEXTAUTH_URL;
  if (!siteUrl) {
    console.error('NEXTAUTH_URL environment variable is required');
    return false;
  }
  
  const siteDomain = new URL(siteUrl).hostname;
  
  // Check if the request is from an allowed origin
  if (origin) {
    try {
      const originDomain = new URL(origin).hostname;
      return allowedOrigins.some(allowed => 
        new URL(allowed).hostname === originDomain
      );
    } catch {
      return false;
    }
  }
  
  // Check if the request is from the same domain (no origin header)
  const localhostPort = process.env.LOCALHOST_PORT || '3000';
  const localhostUrl = `localhost:${localhostPort}`;
  
  const isSameDomain = Boolean(
    host === siteDomain || 
    host === localhostUrl ||
    (referer && referer.includes(siteDomain)) ||
    (referer && referer.includes(localhostUrl))
  );
  
  return isSameDomain;
}
