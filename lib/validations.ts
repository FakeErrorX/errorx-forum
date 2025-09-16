import { z } from 'zod';

// User validation schemas
export const userSchema = z.object({
  id: z.string().min(1, 'User ID is required'),
  email: z.string().email('Invalid email format'),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be less than 30 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
  image: z.string().url('Invalid image URL').optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  location: z.string().max(100, 'Location must be less than 100 characters').optional(),
  website: z.string().url('Invalid website URL').optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createUserSchema = userSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateUserSchema = createUserSchema.partial();

// Post validation schemas
export const postSchema = z.object({
  id: z.string().min(1, 'Post ID is required'),
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters'),
  content: z.string()
    .min(10, 'Content must be at least 10 characters')
    .max(10000, 'Content must be less than 10,000 characters'),
  categoryId: z.string().min(1, 'Category ID is required'),
  authorId: z.string().min(1, 'Author ID is required'),
  authorUsername: z.string().min(1, 'Author username is required'),
  isPinned: z.boolean().default(false),
  isLocked: z.boolean().default(false),
  views: z.number().int().min(0).default(0),
  likes: z.number().int().min(0).default(0),
  replies: z.number().int().min(0).default(0),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createPostSchema = postSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updatePostSchema = createPostSchema.partial().omit({
  authorId: true,
  authorUsername: true,
});

// Category validation schemas
export const categorySchema = z.object({
  id: z.string().min(1, 'Category ID is required'),
  name: z.string()
    .min(1, 'Category name is required')
    .max(50, 'Category name must be less than 50 characters'),
  description: z.string()
    .max(200, 'Description must be less than 200 characters')
    .optional(),
  icon: z.string().max(50, 'Icon must be less than 50 characters').optional(),
  color: z.string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color')
    .optional(),
  categoryId: z.number().int().positive('Category ID must be positive'),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createCategorySchema = categorySchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Comment validation schemas
export const commentSchema = z.object({
  id: z.string().min(1, 'Comment ID is required'),
  content: z.string()
    .min(10, 'Content must be at least 10 characters')
    .max(2000, 'Content must be less than 2,000 characters'),
  postId: z.string().min(1, 'Post ID is required'),
  authorId: z.string().min(1, 'Author ID is required'),
  authorUsername: z.string().min(1, 'Author username is required'),
  parentId: z.string().optional(),
  likes: z.number().int().min(0).default(0),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createCommentSchema = commentSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// File upload validation schemas
export const fileUploadSchema = z.object({
  file: z.instanceof(File, { message: 'File is required' }),
  userId: z.string().min(1, 'User ID is required'),
  folder: z.string().default('uploads'),
});

export const fileMetadataSchema = z.object({
  originalName: z.string().min(1, 'Original name is required'),
  size: z.number().int().positive('File size must be positive'),
  mimeType: z.string().min(1, 'MIME type is required'),
  userId: z.string().min(1, 'User ID is required'),
  folder: z.string().default('uploads'),
});

// API request validation schemas
export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(25),
  offset: z.coerce.number().int().min(0).default(0),
});

export const searchSchema = z.object({
  query: z.string().min(1, 'Search query is required').max(100, 'Search query too long'),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  offset: z.coerce.number().int().min(0).default(0),
});

// Authentication validation schemas
export const signupSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be less than 30 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
  email: z.string().email('Invalid email format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password too long')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number'),
});

export const signinSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password too long')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number'),
});

// Settings validation schemas
export const userPreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).default('system'),
  notifications: z.object({
    email: z.boolean().default(true),
    push: z.boolean().default(true),
    mentions: z.boolean().default(true),
  }).default({
    email: true,
    push: true,
    mentions: true,
  }),
  privacy: z.object({
    profileVisibility: z.enum(['public', 'private']).default('public'),
    showEmail: z.boolean().default(false),
  }).default({
    profileVisibility: 'public',
    showEmail: false,
  }),
});

// Environment validation schema
export const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  
  // NextAuth
  NEXTAUTH_URL: z.string().url('NEXTAUTH_URL must be a valid URL'),
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),
  
  // OAuth
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  
  // Site Configuration
  SITE_URL: z.string().url('SITE_URL must be a valid URL'),
  SITE_NAME: z.string().min(1, 'SITE_NAME is required'),
  SITE_DESCRIPTION: z.string().min(1, 'SITE_DESCRIPTION is required'),
  
  // Social Media
  TWITTER_HANDLE: z.string().min(1, 'TWITTER_HANDLE is required'),
  TWITTER_SITE: z.string().min(1, 'TWITTER_SITE is required'),
  TWITTER_URL: z.string().url('TWITTER_URL must be a valid URL'),
  GITHUB_URL: z.string().url('GITHUB_URL must be a valid URL'),
  TELEGRAM_URL: z.string().url('TELEGRAM_URL must be a valid URL'),
  FACEBOOK_URL: z.string().url('FACEBOOK_URL must be a valid URL'),
  
  // S3/R2 Storage
  S3_REGION: z.string().min(1, 'S3_REGION is required'),
  S3_ENDPOINT: z.string().url('S3_ENDPOINT must be a valid URL'),
  S3_ACCESS_KEY: z.string().min(1, 'S3_ACCESS_KEY is required'),
  S3_SECRET_KEY: z.string().min(1, 'S3_SECRET_KEY is required'),
  S3_BUCKET_NAME: z.string().min(1, 'S3_BUCKET_NAME is required'),
  S3_BUCKET_URL: z.string().url('S3_BUCKET_URL must be a valid URL'),
  
  // API Security
  ALLOWED_ORIGINS: z.string().min(1, 'ALLOWED_ORIGINS is required'),
  
  // Development
  LOCALHOST_PORT: z.string().default('3000'),
  
  // Email
  SMTP_HOST: z.string().min(1, 'SMTP_HOST is required'),
  SMTP_PORT: z.coerce.number().int().min(1).max(65535),
  SMTP_SECURE: z.enum(['true', 'false']).transform(val => val === 'true'),
  SMTP_USER: z.string().email('SMTP_USER must be a valid email'),
  SMTP_PASS: z.string().min(1, 'SMTP_PASS is required'),
  SMTP_FROM: z.string().email('SMTP_FROM must be a valid email'),
});

// Utility functions
export function validateEnv() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues.map(err => `${err.path.join('.')}: ${err.message}`);
      throw new Error(`Environment validation failed:\n${missingVars.join('\n')}`);
    }
    throw error;
  }
}

export function createValidationError(message: string, field?: string) {
  return {
    error: 'Validation Error',
    message,
    field,
  };
}

export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      throw new Error(`Validation failed: ${JSON.stringify(errorMessages)}`);
    }
    throw error;
  }
}
