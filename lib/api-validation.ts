import { NextRequest, NextResponse } from 'next/server';
import { z, ZodSchema } from 'zod';
import { createSecureErrorResponse } from './api-security';

export interface ValidationOptions {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

export function createValidationMiddleware(options: ValidationOptions) {
  return async (request: NextRequest) => {
    const errors: string[] = [];

    try {
      // Validate request body if schema provided
      if (options.body && request.method !== 'GET') {
        const body = await request.json();
        options.body.parse(body);
      }

      // Validate query parameters if schema provided
      if (options.query) {
        const url = new URL(request.url);
        const queryParams = Object.fromEntries(url.searchParams.entries());
        options.query.parse(queryParams);
      }

      // Validate route parameters if schema provided
      if (options.params) {
        // This would need to be implemented based on your routing structure
        // For now, we'll skip this as Next.js handles route params differently
      }

    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.issues.map(err => {
          const field = err.path.join('.');
          return `${field}: ${err.message}`;
        });
        errors.push(...errorMessages);
      } else {
        errors.push('Invalid request format');
      }
    }

    if (errors.length > 0) {
      return createSecureErrorResponse(
        `Validation failed: ${errors.join(', ')}`,
        400
      );
    }

    return null; // No validation errors
  };
}

export function validateRequestBody<T>(schema: ZodSchema<T>, body: unknown): T {
  try {
    return schema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map(err => {
        const field = err.path.join('.');
        return `${field}: ${err.message}`;
      });
      throw new Error(`Body validation failed: ${errorMessages.join(', ')}`);
    }
    throw error;
  }
}

export function validateQueryParams<T>(schema: ZodSchema<T>, searchParams: URLSearchParams): T {
  try {
    const params = Object.fromEntries(searchParams.entries());
    return schema.parse(params);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map(err => {
        const field = err.path.join('.');
        return `${field}: ${err.message}`;
      });
      throw new Error(`Query validation failed: ${errorMessages.join(', ')}`);
    }
    throw error;
  }
}

export function createValidationErrorResponse(message: string, status: number = 400) {
  return createSecureErrorResponse(message, status);
}

export function handleValidationError(error: unknown): NextResponse {
  if (error instanceof Error) {
    return createValidationErrorResponse(error.message);
  }
  return createValidationErrorResponse('Validation failed');
}
