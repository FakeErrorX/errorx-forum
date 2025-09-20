import { NextRequest, NextResponse } from 'next/server';
import { 
  securityHeaders, 
  generateCSP, 
  generateNonce, 
  createSecurityMiddleware,
  InputValidator,
  RequestSecurity 
} from './security';
import { 
  createMonitoringMiddleware, 
  performance 
} from './monitoring';

interface MiddlewareConfig {
  security?: {
    enabled: boolean;
    allowedOrigins?: string[];
    requireCSRF?: boolean;
    detectSuspiciousActivity?: boolean;
    addSecurityHeaders?: boolean;
  };
  monitoring?: {
    enabled: boolean;
  };
  cors?: {
    enabled: boolean;
    allowedOrigins?: string[];
    allowedMethods?: string[];
    allowedHeaders?: string[];
    credentials?: boolean;
  };
}

class SecurityPerformanceMiddleware {
  private config: MiddlewareConfig;

  constructor(config: MiddlewareConfig = {}) {
    this.config = {
      security: {
        enabled: true,
        allowedOrigins: [process.env.NEXTAUTH_URL || 'http://localhost:3000'],
        requireCSRF: false,
        detectSuspiciousActivity: true,
        addSecurityHeaders: true,
        ...config.security,
      },
      monitoring: {
        enabled: true,
        ...config.monitoring,
      },
      cors: {
        enabled: true,
        allowedOrigins: [process.env.NEXTAUTH_URL || 'http://localhost:3000'],
        allowedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token'],
        credentials: true,
        ...config.cors,
      },
    };
  }

  private addSecurityHeaders(response: NextResponse, nonce?: string): NextResponse {
    if (!this.config.security?.addSecurityHeaders) return response;

    // Add standard security headers
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    // Add CSP header
    response.headers.set('Content-Security-Policy', generateCSP(nonce));

    return response;
  }

  private handleCORS(request: NextRequest, response?: NextResponse): NextResponse | null {
    if (!this.config.cors?.enabled) return null;

    const origin = request.headers.get('origin');
    const allowedOrigins = this.config.cors.allowedOrigins || [];

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      const preflightResponse = new NextResponse(null, { status: 200 });
      
      if (origin && allowedOrigins.includes(origin)) {
        preflightResponse.headers.set('Access-Control-Allow-Origin', origin);
      }
      
      if (this.config.cors.credentials) {
        preflightResponse.headers.set('Access-Control-Allow-Credentials', 'true');
      }
      
      preflightResponse.headers.set(
        'Access-Control-Allow-Methods',
        this.config.cors.allowedMethods?.join(', ') || 'GET, POST, PUT, DELETE'
      );
      
      preflightResponse.headers.set(
        'Access-Control-Allow-Headers',
        this.config.cors.allowedHeaders?.join(', ') || 'Content-Type, Authorization'
      );
      
      preflightResponse.headers.set('Access-Control-Max-Age', '86400');
      
      return this.addSecurityHeaders(preflightResponse);
    }

    // Add CORS headers to actual response
    if (response && origin && allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      
      if (this.config.cors.credentials) {
        response.headers.set('Access-Control-Allow-Credentials', 'true');
      }
    }

    return null;
  }

  private async validateInput(request: NextRequest): Promise<NextResponse | null> {
    if (request.method === 'GET') return null;

    try {
      const contentType = request.headers.get('content-type') || '';
      
      if (contentType.includes('application/json')) {
        const clone = request.clone();
        const body = await clone.json();
        
        // Validate and sanitize common fields
        if (body.email && !InputValidator.validateEmail(body.email)) {
          return NextResponse.json(
            { error: 'Invalid email format' },
            { status: 400 }
          );
        }
        
        if (body.username && !InputValidator.validateUsername(body.username)) {
          return NextResponse.json(
            { error: 'Invalid username format' },
            { status: 400 }
          );
        }
        
        if (body.password) {
          const passwordValidation = InputValidator.validatePassword(body.password);
          if (!passwordValidation.isValid) {
            return NextResponse.json(
              { error: 'Password validation failed', details: passwordValidation.errors },
              { status: 400 }
            );
          }
        }
        
        if (body.url && !InputValidator.validateUrl(body.url)) {
          return NextResponse.json(
            { error: 'Invalid URL format' },
            { status: 400 }
          );
        }
      }
    } catch (error) {
      // If JSON parsing fails, let the original handler deal with it
      return null;
    }

    return null;
  }

  public createMiddleware() {
    return async (
      request: NextRequest,
      handler: (request: NextRequest) => Promise<NextResponse>
    ): Promise<NextResponse> => {
      const startTime = Date.now();

      try {
        // Handle CORS preflight
        const corsResponse = this.handleCORS(request);
        if (corsResponse) {
          return corsResponse;
        }

        // Security checks
        if (this.config.security?.enabled) {
          const securityMiddleware = createSecurityMiddleware({
            allowedOrigins: this.config.security.allowedOrigins,
            requireCSRF: this.config.security.requireCSRF,
            detectSuspiciousActivity: this.config.security.detectSuspiciousActivity,
          });

          const securityResult = await securityMiddleware(request);
          if (securityResult) {
            return this.addSecurityHeaders(securityResult);
          }
        }

        // Input validation
        const inputValidation = await this.validateInput(request);
        if (inputValidation) {
          return this.addSecurityHeaders(inputValidation);
        }

        // Execute handler directly (no caching)
        let response = await handler(request);

        // Add CORS headers to response
        this.handleCORS(request, response);

        // Add security headers
        response = this.addSecurityHeaders(response);

        // Performance monitoring
        if (this.config.monitoring?.enabled) {
          const duration = Date.now() - startTime;
          performance.recordMetric('middleware_duration', duration, {
            method: request.method,
            endpoint: new URL(request.url).pathname,
            status: response.status.toString(),
          });
        }

        return response;

      } catch (error) {
        console.error('Middleware error:', error);
        
        const errorResponse = NextResponse.json(
          { error: 'Internal server error' },
          { status: 500 }
        );

        // Record error metrics
        if (this.config.monitoring?.enabled) {
          const duration = Date.now() - startTime;
          performance.recordMetric('middleware_error', 1, {
            method: request.method,
            endpoint: new URL(request.url).pathname,
            error: (error as Error).name,
          });
          
          performance.recordMetric('middleware_duration', duration, {
            method: request.method,
            endpoint: new URL(request.url).pathname,
            status: '500',
          });
        }

        return this.addSecurityHeaders(errorResponse);
      }
    };
  }
}

// Predefined middleware configurations
export const middlewareConfigs = {
  // API endpoints - security only
  api: {
    security: { enabled: true, detectSuspiciousActivity: true },
    monitoring: { enabled: true },
  } as MiddlewareConfig,

  // Authentication endpoints - strict security
  auth: {
    security: { enabled: true, requireCSRF: true },
    monitoring: { enabled: true },
  } as MiddlewareConfig,

  // Admin endpoints - enhanced security
  admin: {
    security: { 
      enabled: true, 
      detectSuspiciousActivity: true,
      requireCSRF: true,
    },
    monitoring: { enabled: true },
  } as MiddlewareConfig,

  // Upload endpoints
  upload: {
    security: { enabled: true },
    monitoring: { enabled: true },
  } as MiddlewareConfig,

  // Search endpoints
  search: {
    security: { enabled: true },
    monitoring: { enabled: true },
  } as MiddlewareConfig,

  // Static content - minimal security
  static: {
    security: { enabled: true, addSecurityHeaders: false },
    monitoring: { enabled: false },
  } as MiddlewareConfig,

  // Public pages - basic security
  public: {
    security: { enabled: true, detectSuspiciousActivity: false },
    monitoring: { enabled: true },
  } as MiddlewareConfig,
};

// Utility functions for common use cases
export function withSecurity(handler: (request: NextRequest) => Promise<NextResponse>) {
  const middleware = new SecurityPerformanceMiddleware(middlewareConfigs.api);
  const middlewareFunction = middleware.createMiddleware();
  return (request: NextRequest) => middlewareFunction(request, handler);
}

export function withMonitoring(handler: (request: NextRequest) => Promise<NextResponse>) {
  const monitoringMiddleware = createMonitoringMiddleware();
  return (request: NextRequest) => monitoringMiddleware(request, handler);
}

export { SecurityPerformanceMiddleware };