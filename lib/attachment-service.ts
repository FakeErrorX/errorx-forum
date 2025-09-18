import { prisma } from '@/lib/prisma'
import { uploadToS3, deleteFromS3, getPublicUrl, generatePresignedDownloadUrl } from '@/lib/s3'
import crypto from 'crypto'
import path from 'path'

export interface AttachmentUploadOptions {
  maxFileSize?: number // in bytes
  allowedMimeTypes?: string[]
  allowedExtensions?: string[]
  generateThumbnails?: boolean
}

export interface UploadedAttachment {
  id: string
  attachmentId: number
  filename: string
  originalName: string
  mimeType: string
  fileSize: number
  url: string
  downloadUrl?: string
}

export class AttachmentService {
  // Default file upload limits
  static readonly DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
  static readonly DEFAULT_ALLOWED_MIME_TYPES = [
    // Images
    'image/jpeg',
    'image/png', 
    'image/gif',
    'image/webp',
    'image/svg+xml',
    
    // Documents
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    
    // Archives
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
    
    // Code/Text
    'text/css',
    'text/javascript',
    'application/json',
    'text/xml',
    'text/csv'
  ]
  
  static readonly DEFAULT_ALLOWED_EXTENSIONS = [
    '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg',
    '.pdf', '.txt', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
    '.zip', '.rar', '.7z',
    '.css', '.js', '.json', '.xml', '.csv'
  ]

  /**
   * Validate a file before upload
   */
  static validateFile(
    file: File, 
    options: AttachmentUploadOptions = {}
  ): { isValid: boolean; error?: string } {
    const maxSize = options.maxFileSize || this.DEFAULT_MAX_FILE_SIZE
    const allowedMimeTypes = options.allowedMimeTypes || this.DEFAULT_ALLOWED_MIME_TYPES
    const allowedExtensions = options.allowedExtensions || this.DEFAULT_ALLOWED_EXTENSIONS

    // Check file size
    if (file.size > maxSize) {
      return {
        isValid: false,
        error: `File size (${this.formatFileSize(file.size)}) exceeds maximum allowed size (${this.formatFileSize(maxSize)})`
      }
    }

    // Check MIME type
    if (!allowedMimeTypes.includes(file.type)) {
      return {
        isValid: false,
        error: `File type "${file.type}" is not allowed`
      }
    }

    // Check file extension
    const extension = path.extname(file.name).toLowerCase()
    if (!allowedExtensions.includes(extension)) {
      return {
        isValid: false,
        error: `File extension "${extension}" is not allowed`
      }
    }

    // Additional security checks
    if (this.isPotentiallyDangerous(file.name, file.type)) {
      return {
        isValid: false,
        error: 'File appears to contain potentially dangerous content'
      }
    }

    return { isValid: true }
  }

  /**
   * Upload a file and create attachment record
   */
  static async uploadAttachment(
    file: File,
    options: AttachmentUploadOptions = {}
  ): Promise<UploadedAttachment> {
    // Validate file
    const validation = this.validateFile(file, options)
    if (!validation.isValid) {
      throw new Error(validation.error)
    }

    try {
      // Generate unique filename
      const originalName = file.name
      const extension = path.extname(originalName)
      const hash = crypto.randomBytes(16).toString('hex')
      const timestamp = Date.now()
      const filename = `attachments/${timestamp}-${hash}${extension}`

      // Convert File to Buffer for server-side processing
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      // Upload to S3
      const uploadResult = await uploadToS3(buffer, filename, file.type)
      
      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Failed to upload to S3')
      }

      // Create database record
      const attachment = await prisma.postAttachment.create({
        data: {
          filename,
          originalName,
          mimeType: file.type,
          fileSize: file.size,
          downloadCount: 0
        }
      })

      // Get file URL
      const url = getPublicUrl(filename)

      return {
        id: attachment.id,
        attachmentId: attachment.attachmentId,
        filename: attachment.filename,
        originalName: attachment.originalName,
        mimeType: attachment.mimeType,
        fileSize: attachment.fileSize,
        url,
        downloadUrl: `/api/attachments/${attachment.attachmentId}/download`
      }
    } catch (error) {
      console.error('Error uploading attachment:', error)
      throw new Error('Failed to upload attachment')
    }
  }

  /**
   * Attach files to a post
   */
  /**
   * Attach files to a regular post (copies to PostSimpleAttachment)
   */
  static async attachToPost(
    postId: string, 
    attachmentIds: string[]
  ): Promise<void> {
    try {
      // Get the attachment records
      const attachments = await prisma.postAttachment.findMany({
        where: {
          id: { in: attachmentIds },
          postId: null,
          replyId: null
        }
      })

      // Copy to PostSimpleAttachment for regular posts
      for (const attachment of attachments) {
        await prisma.postSimpleAttachment.create({
          data: {
            postId,
            filename: attachment.filename,
            originalName: attachment.originalName,
            mimeType: attachment.mimeType,
            fileSize: attachment.fileSize,
            downloadCount: 0
          }
        })
      }

      // Clean up temporary attachments
      await prisma.postAttachment.deleteMany({
        where: {
          id: { in: attachmentIds }
        }
      })
    } catch (error) {
      console.error('Error attaching files to post:', error)
      throw new Error('Failed to attach files to post')
    }
  }

  /**
   * Attach files to a reply
   */
  static async attachToReply(
    replyId: string, 
    attachmentIds: string[]
  ): Promise<void> {
    try {
      await prisma.postAttachment.updateMany({
        where: {
          id: { in: attachmentIds },
          postId: null,
          replyId: null // Only attach unattached files
        },
        data: {
          replyId
        }
      })
    } catch (error) {
      console.error('Error attaching files to reply:', error)
      throw new Error('Failed to attach files to reply')
    }
  }

  /**
   * Get attachments for a post
   */
  /**
   * Get attachments for a regular post
   */
  static async getPostAttachments(postId: string): Promise<UploadedAttachment[]> {
    try {
      const attachments = await prisma.postSimpleAttachment.findMany({
        where: { postId },
        orderBy: { uploadedAt: 'asc' }
      })

      return attachments.map(attachment => ({
        id: attachment.id,
        attachmentId: attachment.attachmentId,
        filename: attachment.filename,
        originalName: attachment.originalName,
        mimeType: attachment.mimeType,
        fileSize: attachment.fileSize,
        url: getPublicUrl(attachment.filename),
        downloadUrl: `/api/attachments/${attachment.attachmentId}/download`
      }))
    } catch (error) {
      console.error('Error fetching post attachments:', error)
      return []
    }
  }

  /**
   * Get attachments for an enhanced post
   */
  static async getEnhancedPostAttachments(postId: string): Promise<UploadedAttachment[]> {
    try {
      const attachments = await prisma.postAttachment.findMany({
        where: { postId },
        orderBy: { uploadedAt: 'asc' }
      })

      return attachments.map((attachment) => ({
        id: attachment.id,
        attachmentId: attachment.attachmentId,
        filename: attachment.filename,
        originalName: attachment.originalName,
        mimeType: attachment.mimeType,
        fileSize: attachment.fileSize,
        url: getPublicUrl(attachment.filename),
        downloadUrl: `/api/attachments/${attachment.attachmentId}/download`
      }))
    } catch (error) {
      console.error('Error getting post attachments:', error)
      return []
    }
  }

  /**
   * Get attachments for a reply
   */
  static async getReplyAttachments(replyId: string): Promise<UploadedAttachment[]> {
    try {
      const attachments = await prisma.postAttachment.findMany({
        where: { replyId },
        orderBy: { uploadedAt: 'asc' }
      })

      return attachments.map((attachment) => ({
        id: attachment.id,
        attachmentId: attachment.attachmentId,
        filename: attachment.filename,
        originalName: attachment.originalName,
        mimeType: attachment.mimeType,
        fileSize: attachment.fileSize,
        url: getPublicUrl(attachment.filename),
        downloadUrl: `/api/attachments/${attachment.attachmentId}/download`
      }))
    } catch (error) {
      console.error('Error getting reply attachments:', error)
      return []
    }
  }

  /**
   * Get attachment by ID (checks both PostSimpleAttachment and PostAttachment)
   */
  static async getAttachment(attachmentId: number): Promise<UploadedAttachment | null> {
    try {
      // First try PostSimpleAttachment (for regular posts)
      const simpleAttachment = await prisma.postSimpleAttachment.findUnique({
        where: { attachmentId }
      })

      if (simpleAttachment) {
        return {
          id: simpleAttachment.id,
          attachmentId: simpleAttachment.attachmentId,
          filename: simpleAttachment.filename,
          originalName: simpleAttachment.originalName,
          mimeType: simpleAttachment.mimeType,
          fileSize: simpleAttachment.fileSize,
          url: getPublicUrl(simpleAttachment.filename),
          downloadUrl: `/api/attachments/${simpleAttachment.attachmentId}/download`
        }
      }

      // Then try PostAttachment (for enhanced posts)
      const attachment = await prisma.postAttachment.findUnique({
        where: { attachmentId }
      })

      if (!attachment) return null

      return {
        id: attachment.id,
        attachmentId: attachment.attachmentId,
        filename: attachment.filename,
        originalName: attachment.originalName,
        mimeType: attachment.mimeType,
        fileSize: attachment.fileSize,
        url: getPublicUrl(attachment.filename),
        downloadUrl: `/api/attachments/${attachment.attachmentId}/download`
      }
    } catch (error) {
      console.error('Error getting attachment:', error)
      return null
    }
  }

  /**
   * Delete an attachment
   */
  static async deleteAttachment(attachmentId: number): Promise<boolean> {
    try {
      const attachment = await prisma.postAttachment.findUnique({
        where: { attachmentId }
      })

      if (!attachment) return false

      // Delete from S3
      await deleteFromS3(attachment.filename)

      // Delete from database
      await prisma.postAttachment.delete({
        where: { attachmentId }
      })

      return true
    } catch (error) {
      console.error('Error deleting attachment:', error)
      return false
    }
  }

  /**
   * Track download of an attachment
   */
  static async trackDownload(attachmentId: number): Promise<void> {
    try {
      // Try PostSimpleAttachment first
      const simpleAttachment = await prisma.postSimpleAttachment.findUnique({
        where: { attachmentId }
      })

      if (simpleAttachment) {
        await prisma.postSimpleAttachment.update({
          where: { attachmentId },
          data: {
            downloadCount: {
              increment: 1
            }
          }
        })
        return
      }

      // Then try PostAttachment
      await prisma.postAttachment.update({
        where: { attachmentId },
        data: {
          downloadCount: {
            increment: 1
          }
        }
      })
    } catch (error) {
      console.error('Error tracking download:', error)
    }
  }

  /**
   * Clean up orphaned attachments (not attached to any post/reply)
   */
  static async cleanupOrphanedAttachments(olderThanHours: number = 24): Promise<number> {
    try {
      const cutoffDate = new Date(Date.now() - olderThanHours * 60 * 60 * 1000)
      
      const orphanedAttachments = await prisma.postAttachment.findMany({
        where: {
          postId: null,
          replyId: null,
          uploadedAt: {
            lt: cutoffDate
          }
        }
      })

      let deletedCount = 0
      for (const attachment of orphanedAttachments) {
        const success = await this.deleteAttachment(attachment.attachmentId)
        if (success) deletedCount++
      }

      return deletedCount
    } catch (error) {
      console.error('Error cleaning up orphaned attachments:', error)
      return 0
    }
  }

  /**
   * Get user's attachment usage statistics
   */
  static async getUserAttachmentStats(userId: string): Promise<{
    totalAttachments: number
    totalSize: number
    imageCount: number
    documentCount: number
    otherCount: number
  }> {
    try {
      // This would require joining with posts/replies to get user's attachments
      // For now, return a placeholder implementation
      const stats = await prisma.postAttachment.aggregate({
        where: {
          OR: [
            { post: { authorId: userId } },
            { reply: { authorId: userId } }
          ]
        },
        _count: true,
        _sum: {
          fileSize: true
        }
      })

      return {
        totalAttachments: stats._count || 0,
        totalSize: stats._sum.fileSize || 0,
        imageCount: 0, // Would need additional query
        documentCount: 0, // Would need additional query
        otherCount: 0 // Would need additional query
      }
    } catch (error) {
      console.error('Error getting user attachment stats:', error)
      return {
        totalAttachments: 0,
        totalSize: 0,
        imageCount: 0,
        documentCount: 0,
        otherCount: 0
      }
    }
  }

  // Utility methods

  /**
   * Format file size in human-readable format
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  /**
   * Check if file is an image
   */
  static isImage(mimeType: string): boolean {
    return mimeType.startsWith('image/')
  }

  /**
   * Check if file is a document
   */
  static isDocument(mimeType: string): boolean {
    return [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain'
    ].includes(mimeType)
  }

  /**
   * Check if file is potentially dangerous
   */
  private static isPotentiallyDangerous(filename: string, mimeType: string): boolean {
    const dangerousExtensions = [
      '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar',
      '.app', '.deb', '.pkg', '.dmg', '.msi', '.run', '.sh', '.ps1'
    ]
    
    const extension = path.extname(filename).toLowerCase()
    
    // Check dangerous extensions
    if (dangerousExtensions.includes(extension)) {
      return true
    }

    // Check for executable MIME types
    if (mimeType.includes('executable') || 
        mimeType.includes('x-msdownload') ||
        mimeType.includes('x-msdos-program')) {
      return true
    }

    // Check for scripts disguised as other files
    if (filename.includes('..') || filename.includes('\\') || filename.includes('/')) {
      return true
    }

    return false
  }

  /**
   * Generate thumbnail for image attachments
   */
  static async generateThumbnail(
    attachmentId: number,
    maxWidth: number = 200,
    maxHeight: number = 200
  ): Promise<string | null> {
    // This would integrate with an image processing service
    // For now, return null indicating no thumbnail generation
    return null
  }
}