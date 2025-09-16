import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// S3 Configuration for Cloudflare R2
// Validate required environment variables
const requiredEnvVars = {
  S3_REGION: process.env.S3_REGION,
  S3_ENDPOINT: process.env.S3_ENDPOINT,
  S3_ACCESS_KEY: process.env.S3_ACCESS_KEY,
  S3_SECRET_KEY: process.env.S3_SECRET_KEY,
  S3_BUCKET_NAME: process.env.S3_BUCKET_NAME,
  S3_BUCKET_URL: process.env.S3_BUCKET_URL,
};

for (const [key, value] of Object.entries(requiredEnvVars)) {
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const s3Client = new S3Client({
  region: process.env.S3_REGION!,
  endpoint: process.env.S3_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET_KEY!,
  },
  forcePathStyle: true, // Required for R2 and other S3-compatible services
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME!;

// File upload to S3
export async function uploadToS3(
  file: Buffer | Uint8Array | string,
  key: string,
  contentType: string,
  metadata?: Record<string, string>
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: file,
      ContentType: contentType,
      Metadata: metadata,
    });

    await s3Client.send(command);
    
    // For Cloudflare R2, use the custom domain
  const baseUrl = process.env.S3_BUCKET_URL!;
  const url = `${baseUrl}/${key}`;
    
    return { success: true, url };
  } catch (error) {
    console.error('S3 upload error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Upload failed' 
    };
  }
}

// Generate presigned URL for upload
export async function generatePresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn: number = 3600 // 1 hour
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn });
    
    return { success: true, url };
  } catch (error) {
    console.error('S3 presigned URL error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to generate presigned URL' 
    };
  }
}

// Generate presigned URL for download/view
export async function generatePresignedDownloadUrl(
  key: string,
  expiresIn: number = 3600 // 1 hour
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn });
    
    return { success: true, url };
  } catch (error) {
    console.error('S3 presigned download URL error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to generate download URL' 
    };
  }
}

// Delete file from S3
export async function deleteFromS3(key: string): Promise<{ success: boolean; error?: string }> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
    
    return { success: true };
  } catch (error) {
    console.error('S3 delete error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Delete failed' 
    };
  }
}

// Check if file exists in S3
export async function fileExists(key: string): Promise<boolean> {
  try {
    const command = new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
    return true;
  } catch (error) {
    return false;
  }
}

// Get file metadata
export async function getFileMetadata(key: string): Promise<{ success: boolean; metadata?: any; error?: string }> {
  try {
    const command = new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const response = await s3Client.send(command);
    
    return { 
      success: true, 
      metadata: {
        contentType: response.ContentType,
        contentLength: response.ContentLength,
        lastModified: response.LastModified,
        metadata: response.Metadata,
      }
    };
  } catch (error) {
    console.error('S3 metadata error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get metadata' 
    };
  }
}

// Generate unique file key
export function generateFileKey(originalName: string, userId: string, folder: string = 'uploads'): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = originalName.split('.').pop() || '';
  const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
  
  return `${folder}/${userId}/${timestamp}-${randomString}-${sanitizedName}`;
}

// Get public URL for file
export function getPublicUrl(key: string): string {
  const baseUrl = process.env.S3_BUCKET_URL!;
  return `${baseUrl}/${key}`;
}

// Extract S3 key from public URL
export function extractKeyFromUrl(url: string): string | null {
  try {
    // Handle custom domain URLs
    const customDomain = process.env.S3_BUCKET_URL!;
    if (url.includes(customDomain)) {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/').filter(Boolean);
      return pathParts.join('/');
    }
    
    // Handle Cloudflare R2 URLs (default R2 domain)
    // Format: https://pub-{account-id}.r2.dev/{key}
    if (url.includes('.r2.dev')) {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/').filter(Boolean);
      return pathParts.join('/');
    }
    
    // Handle Contabo S3 URLs with access key in path
    // Format: https://eu2.contabostorage.com/{accessKey}:errorx/{key}
    if (url.includes('contabostorage.com') && url.includes(':errorx/')) {
      const urlParts = url.split('/');
      const keyIndex = urlParts.findIndex(part => part.includes(':errorx'));
      if (keyIndex !== -1 && keyIndex + 1 < urlParts.length) {
        return urlParts.slice(keyIndex + 1).join('/');
      }
    }
    
    // Handle standard S3 URLs
    // Format: https://bucket.s3.region.amazonaws.com/key or https://s3.region.amazonaws.com/bucket/key
    if (url.includes('amazonaws.com')) {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/').filter(Boolean);
      
      // Remove bucket name if it's the first part
      if (pathParts.length > 1) {
        return pathParts.slice(1).join('/');
      }
      return pathParts.join('/');
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting key from URL:', error);
    return null;
  }
}

// Validate file type
export function validateFileType(fileName: string, allowedTypes: string[]): boolean {
  const extension = fileName.split('.').pop()?.toLowerCase();
  return extension ? allowedTypes.includes(extension) : false;
}

// Get file size in MB
export function getFileSizeMB(sizeInBytes: number): number {
  return sizeInBytes / (1024 * 1024);
}

// Validate file size
export function validateFileSize(sizeInBytes: number, maxSizeMB: number): boolean {
  return getFileSizeMB(sizeInBytes) <= maxSizeMB;
}

// Allowed file types for different use cases
export const ALLOWED_FILE_TYPES = {
  images: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
  documents: ['pdf', 'doc', 'docx', 'txt', 'md'],
  archives: ['zip', 'rar', '7z', 'tar', 'gz'],
  videos: ['mp4', 'avi', 'mov', 'wmv', 'webm'],
  audio: ['mp3', 'wav', 'ogg', 'm4a'],
  all: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'pdf', 'doc', 'docx', 'txt', 'md', 'zip', 'rar', '7z', 'tar', 'gz', 'mp4', 'avi', 'mov', 'wmv', 'webm', 'mp3', 'wav', 'ogg', 'm4a']
};

