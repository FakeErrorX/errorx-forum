import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Check if the path is a username pattern (single segment, not a known route)
  const segments = pathname.split('/').filter(Boolean)
  
  // If it's a single segment and not a known route, redirect to profile
  if (segments.length === 1) {
    const username = segments[0]
    
    // Skip redirect for known routes
    const knownRoutes = [
      'signin',
      'signup', 
      'profile',
      'settings',
      'reset-password',
      'api',
      'favicon.ico',
      '_next',
      'static'
    ]
    
    if (!knownRoutes.includes(username)) {
      return NextResponse.redirect(new URL(`/profile/${username}`, request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
