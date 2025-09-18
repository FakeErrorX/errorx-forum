import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import crypto from 'crypto';

// Security headers configuration
export const securityHeaders = {
  // Prevent XSS attacks
  'X-XSS-Protection': '1; mode=block',
  
  // Prevent content type sniffing
  'X-Content-Type-Options': 'nosniff',
  
  // Prevent clickjacking
  'X-Frame-Options': 'DENY',
  
  // Strict transport security (HTTPS only)
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  
  // Referrer policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Permissions policy
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  
  // Cross-origin policies - Relaxed for development
  'Cross-Origin-Embedder-Policy': 'unsafe-none',
  'Cross-Origin-Opener-Policy': 'unsafe-none',
  'Cross-Origin-Resource-Policy': 'cross-origin',
};

// Content Security Policy - Permissive configuration
export function generateCSP(nonce?: string) {
  const policies = [
    "default-src *",
    `script-src * 'unsafe-eval' 'unsafe-inline' ${nonce ? `'nonce-${nonce}'` : ""}`,
    "style-src * 'unsafe-inline'",
    "font-src *",
    "img-src * data: blob:",
    "media-src * data: blob:",
    "object-src *",
    "base-uri *",
    "form-action *",
    "frame-ancestors *",
    "frame-src *",
    "child-src *",
    "connect-src *",
    "worker-src * blob:",
    "manifest-src *",
  ];

  return policies.join('; ');
}

// Generate cryptographically secure nonce
export function generateNonce(): string {
  return crypto.randomBytes(16).toString('base64');
}

// Input validation and sanitization
export class InputValidator {
  static sanitizeString(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript protocols
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim();
  }

  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  }

  static validateUsername(username: string): boolean {
    const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
    return usernameRegex.test(username);
  }

  static validatePassword(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (password.length > 128) {
      errors.push('Password must be less than 128 characters');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  static validateUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      return ['http:', 'https:'].includes(parsedUrl.protocol);
    } catch {
      return false;
    }
  }

  static sanitizeHtml(html: string): string {
    // Basic HTML sanitization - in production, use a library like DOMPurify
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  }

  static validateFileUpload(file: File, allowedTypes: string[], maxSize: number): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (file.size > maxSize) {
      errors.push(`File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`);
    }

    if (!allowedTypes.includes(file.type)) {
      errors.push(`File type ${file.type} is not allowed`);
    }

    // Additional security checks
    const suspiciousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.vbs', '.js'];
    const fileName = file.name.toLowerCase();
    
    if (suspiciousExtensions.some(ext => fileName.endsWith(ext))) {
      errors.push('File type not allowed for security reasons');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

// SQL Injection prevention helpers
export class SQLSanitizer {
  static escapeString(str: string): string {
    return str.replace(/'/g, "''").replace(/\\/g, '\\\\');
  }

  static validateNumericId(id: string): boolean {
    return /^\d+$/.test(id);
  }

  static validateUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }
}

// Request origin and CSRF protection
export class RequestSecurity {
  static validateOrigin(request: NextRequest, allowedOrigins: string[]): boolean {
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');
    
    if (!origin && !referer) {
      return false; // Reject requests without origin/referer
    }

    const requestOrigin = origin || (referer ? new URL(referer).origin : '');
    return allowedOrigins.includes(requestOrigin);
  }

  static validateCSRFToken(request: NextRequest, sessionToken: string): boolean {
    const csrfToken = request.headers.get('x-csrf-token');
    
    if (!csrfToken || !sessionToken) {
      return false;
    }

    // In production, implement proper CSRF token validation
    // This should match tokens generated during session creation
    return csrfToken === this.generateCSRFToken(sessionToken);
  }

  static generateCSRFToken(sessionToken: string): string {
    return crypto
      .createHmac('sha256', process.env.CSRF_SECRET || 'fallback-secret')
      .update(sessionToken)
      .digest('hex');
  }

  static detectSuspiciousActivity(request: NextRequest): {
    isSuspicious: boolean;
    reasons: string[];
  } {
    const reasons: string[] = [];
    const userAgent = request.headers.get('user-agent') || '';
    const referer = request.headers.get('referer') || '';

    // Check for common bot patterns
    const botPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /curl/i,
      /wget/i,
    ];

    if (botPatterns.some(pattern => pattern.test(userAgent))) {
      reasons.push('Bot-like user agent detected');
    }

    // Check for suspicious user agents
    if (userAgent.length < 10 || userAgent.length > 512) {
      reasons.push('Unusual user agent length');
    }

    // Check for SQL injection patterns in URL
    const sqlPatterns = [
      /(\bor\b|\band\b)\s+\d+\s*=\s*\d+/i,
      /union\s+select/i,
      /drop\s+table/i,
      /insert\s+into/i,
      /delete\s+from/i,
    ];

    const url = request.url;
    if (sqlPatterns.some(pattern => pattern.test(url))) {
      reasons.push('SQL injection attempt detected');
    }

    // Check for XSS patterns
    const xssPatterns = [
      /<script/i,
      /javascript:/i,
      /onerror\s*=/i,
      /onload\s*=/i,
    ];

    if (xssPatterns.some(pattern => pattern.test(url))) {
      reasons.push('XSS attempt detected');
    }

    return {
      isSuspicious: reasons.length > 0,
      reasons,
    };
  }
}

// Security middleware factory
export function createSecurityMiddleware(options: {
  allowedOrigins?: string[];
  requireCSRF?: boolean;
  detectSuspiciousActivity?: boolean;
} = {}) {
  return async (request: NextRequest) => {
    const {
      allowedOrigins = [],
      requireCSRF = false,
      detectSuspiciousActivity = true,
    } = options;

    // Check for suspicious activity
    if (detectSuspiciousActivity) {
      const suspiciousCheck = RequestSecurity.detectSuspiciousActivity(request);
      if (suspiciousCheck.isSuspicious) {
        console.warn('Suspicious activity detected:', {
          url: request.url,
          userAgent: request.headers.get('user-agent'),
          reasons: suspiciousCheck.reasons,
        });
        
        return NextResponse.json(
          { error: 'Request blocked for security reasons' },
          { status: 403 }
        );
      }
    }

    // Validate origin for state-changing requests
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
      if (allowedOrigins.length > 0) {
        if (!RequestSecurity.validateOrigin(request, allowedOrigins)) {
          return NextResponse.json(
            { error: 'Invalid origin' },
            { status: 403 }
          );
        }
      }

      // CSRF protection for authenticated requests
      if (requireCSRF) {
        const authHeader = request.headers.get('authorization');
        if (authHeader) {
          // Extract session token and validate CSRF
          // This would need integration with your auth system
          // if (!RequestSecurity.validateCSRFToken(request, sessionToken)) {
          //   return NextResponse.json(
          //     { error: 'Invalid CSRF token' },
          //     { status: 403 }
          //   );
          // }
        }
      }
    }

    return null; // Allow request to proceed
  };
}

// securityHeaders already exported at top of file