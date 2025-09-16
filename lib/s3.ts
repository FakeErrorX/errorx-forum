// Defer AWS SDK imports and env validation until used on the server
type S3ClientBundle = {
  s3: import('@aws-sdk/client-s3').S3Client;
  PutObjectCommand: typeof import('@aws-sdk/client-s3').PutObjectCommand;
  GetObjectCommand: typeof import('@aws-sdk/client-s3').GetObjectCommand;
  DeleteObjectCommand: typeof import('@aws-sdk/client-s3').DeleteObjectCommand;
  HeadObjectCommand: typeof import('@aws-sdk/client-s3').HeadObjectCommand;
  getSignedUrl: typeof import('@aws-sdk/s3-request-presigner').getSignedUrl;
};

let _s3Client: S3ClientBundle | null = null;
async function getS3Client() {
  if (typeof window !== 'undefined') {
    throw new Error('S3 operations are server-side only');
  }
  if (_s3Client) return _s3Client;

  const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } = await import('@aws-sdk/client-s3');
  const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');

  for (const [key, value] of Object.entries({
    S3_REGION: process.env.S3_REGION,
    S3_ENDPOINT: process.env.S3_ENDPOINT,
    S3_ACCESS_KEY: process.env.S3_ACCESS_KEY,
    S3_SECRET_KEY: process.env.S3_SECRET_KEY,
    S3_BUCKET_NAME: process.env.S3_BUCKET_NAME,
    S3_BUCKET_URL: process.env.S3_BUCKET_URL,
  })) {
    if (!value) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }

  _s3Client = {
    s3: new S3Client({
      region: process.env.S3_REGION!,
      endpoint: process.env.S3_ENDPOINT!,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY!,
        secretAccessKey: process.env.S3_SECRET_KEY!,
      },
      forcePathStyle: true,
    }),
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand,
    HeadObjectCommand,
    getSignedUrl,
  };

  return _s3Client;
}

// File upload to S3
export async function uploadToS3(
  file: Buffer | Uint8Array | string,
  key: string,
  contentType: string,
  metadata?: Record<string, string>
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const { s3, PutObjectCommand } = await getS3Client();
    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: key,
      Body: file,
      ContentType: contentType,
      Metadata: metadata,
    });

    await s3.send(command);
    
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
    const { s3, PutObjectCommand, getSignedUrl } = await getS3Client();
    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: key,
      ContentType: contentType,
    });

    const url = await getSignedUrl(s3, command, { expiresIn });
    
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
    const { s3, GetObjectCommand, getSignedUrl } = await getS3Client();
    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: key,
    });

    const url = await getSignedUrl(s3, command, { expiresIn });
    
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
    const { s3, DeleteObjectCommand } = await getS3Client();
    const command = new DeleteObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: key,
    });

    await s3.send(command);
    
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
    const { s3, HeadObjectCommand } = await getS3Client();
    const command = new HeadObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: key,
    });

    await s3.send(command);
    return true;
  } catch (error) {
    return false;
  }
}

// Get file metadata
export async function getFileMetadata(key: string): Promise<{ success: boolean; metadata?: Record<string, unknown>; error?: string }> {
  try {
    const { s3, HeadObjectCommand } = await getS3Client();
    const command = new HeadObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: key,
    });

    const response = await s3.send(command);
    
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
  const baseUrl = process.env.S3_BUCKET_URL || '';
  return baseUrl ? `${baseUrl}/${key}` : key;
}

// Extract S3 key from public URL
export function extractKeyFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    const pathParts = urlObj.pathname.split('/').filter(Boolean);

    // Contabo special handling
    if (hostname.includes('contabostorage.com')) {
      const keyIndex = pathParts.findIndex(part => part.includes(':errorx'));
      if (keyIndex !== -1 && keyIndex + 1 < pathParts.length) {
        return pathParts.slice(keyIndex + 1).join('/');
      }
      return pathParts.join('/') || null;
    }

    // Amazon S3 hostnames
    if (hostname.includes('amazonaws.com')) {
      if (pathParts.length > 1) {
        return pathParts.slice(1).join('/');
      }
      return pathParts.join('/') || null;
    }

    // Generic case: custom domain or r2.dev
    return pathParts.join('/') || null;
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

