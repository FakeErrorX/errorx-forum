"use client"

import React, { useState, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Upload, X, File, Image, FileText, Archive, 
  AlertTriangle, CheckCircle, Download, Trash2
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface UploadedFile {
  id: string
  attachmentId: number
  filename: string
  originalName: string
  mimeType: string
  fileSize: number
  url: string
  downloadUrl?: string
}

interface FileUploadProps {
  onFilesUploaded?: (files: UploadedFile[]) => void
  onFileRemoved?: (fileId: string) => void
  maxFiles?: number
  maxFileSize?: number // in bytes
  allowedMimeTypes?: string[]
  disabled?: boolean
  className?: string
  showPreview?: boolean
  compact?: boolean
}

interface UploadProgress {
  filename: string
  progress: number
  status: 'uploading' | 'success' | 'error'
  error?: string
}

export function FileUpload({
  onFilesUploaded,
  onFileRemoved,
  maxFiles = 10,
  maxFileSize = 10 * 1024 * 1024, // 10MB
  allowedMimeTypes,
  disabled = false,
  className,
  showPreview = true,
  compact = false
}: FileUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }, [])

  const getFileIcon = useCallback((mimeType: string) => {
    if (mimeType.startsWith('image/')) return Image
    if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) return FileText
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z')) return Archive
    return File
  }, [])

  const validateFile = useCallback((file: File): string | null => {
    if (file.size > maxFileSize) {
      return `File size (${formatFileSize(file.size)}) exceeds maximum allowed size (${formatFileSize(maxFileSize)})`
    }

    if (allowedMimeTypes && !allowedMimeTypes.includes(file.type)) {
      return `File type "${file.type}" is not allowed`
    }

    return null
  }, [maxFileSize, allowedMimeTypes, formatFileSize])

  const uploadFiles = useCallback(async (files: FileList) => {
    if (disabled) return

    const fileArray = Array.from(files)
    
    // Check file count limit
    if (uploadedFiles.length + fileArray.length > maxFiles) {
      setError(`Cannot upload more than ${maxFiles} files`)
      return
    }

    // Validate files
    const validFiles: File[] = []
    const errors: string[] = []

    fileArray.forEach(file => {
      const validationError = validateFile(file)
      if (validationError) {
        errors.push(`${file.name}: ${validationError}`)
      } else {
        validFiles.push(file)
      }
    })

    if (errors.length > 0) {
      setError(errors.join('; '))
      return
    }

    if (validFiles.length === 0) return

    setError(null)

    // Initialize progress tracking
    const progressItems: UploadProgress[] = validFiles.map(file => ({
      filename: file.name,
      progress: 0,
      status: 'uploading'
    }))
    setUploadProgress(progressItems)

    try {
      const formData = new FormData()
      validFiles.forEach(file => {
        formData.append('files', file)
      })

      // Add upload options
      if (maxFileSize) {
        formData.append('maxFileSize', maxFileSize.toString())
      }
      if (allowedMimeTypes) {
        formData.append('allowedMimeTypes', JSON.stringify(allowedMimeTypes))
      }

      const response = await fetch('/api/attachments', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed')
      }

      // Update progress to success
      setUploadProgress(prev => prev.map(item => ({
        ...item,
        progress: 100,
        status: 'success'
      })))

      // Add uploaded files
      const newFiles = result.uploaded || []
      setUploadedFiles(prev => [...prev, ...newFiles])
      onFilesUploaded?.(newFiles)

      // Handle any errors
      if (result.errors && result.errors.length > 0) {
        const errorMessages = result.errors.map((err: any) => `${err.filename}: ${err.error}`).join('; ')
        setError(errorMessages)
      }

      // Clear progress after a delay
      setTimeout(() => {
        setUploadProgress([])
      }, 2000)

    } catch (error) {
      console.error('Upload error:', error)
      setError(error instanceof Error ? error.message : 'Upload failed')
      
      // Update progress to error
      setUploadProgress(prev => prev.map(item => ({
        ...item,
        status: 'error',
        error: error instanceof Error ? error.message : 'Upload failed'
      })))
    }
  }, [disabled, uploadedFiles.length, maxFiles, validateFile, maxFileSize, allowedMimeTypes, onFilesUploaded])

  const handleFileSelect = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      uploadFiles(files)
    }
    // Reset input
    event.target.value = ''
  }, [uploadFiles])

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    setIsDragOver(false)
    
    const files = event.dataTransfer.files
    if (files && files.length > 0) {
      uploadFiles(files)
    }
  }, [uploadFiles])

  const removeFile = useCallback((fileId: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId))
    onFileRemoved?.(fileId)
  }, [onFileRemoved])

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload Area */}
      <Card 
        className={cn(
          "border-2 border-dashed transition-colors cursor-pointer",
          isDragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25",
          disabled && "opacity-50 cursor-not-allowed",
          compact && "p-2"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={!disabled ? handleFileSelect : undefined}
      >
        <CardContent className={cn("p-6 text-center", compact && "p-4")}>
          <Upload className={cn("mx-auto mb-4 text-muted-foreground", compact ? "w-6 h-6" : "w-12 h-12")} />
          <div className="space-y-2">
            <div className={cn("font-medium", compact && "text-sm")}>
              {compact ? "Upload files" : "Drop files here or click to browse"}
            </div>
            {!compact && (
              <div className="text-sm text-muted-foreground">
                Maximum {maxFiles} files, {formatFileSize(maxFileSize)} each
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileChange}
        className="hidden"
        accept={allowedMimeTypes?.join(',')}
        disabled={disabled}
      />

      {/* Upload Progress */}
      {uploadProgress.length > 0 && (
        <div className="space-y-2">
          {uploadProgress.map((item) => (
            <Card key={item.filename}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium truncate">{item.filename}</span>
                  {item.status === 'success' && <CheckCircle className="w-4 h-4 text-green-500" />}
                  {item.status === 'error' && <AlertTriangle className="w-4 h-4 text-red-500" />}
                </div>
                <Progress value={item.progress} className="h-2" />
                {item.status === 'error' && item.error && (
                  <div className="text-xs text-red-500 mt-1">{item.error}</div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Uploaded Files Preview */}
      {showPreview && uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium">Uploaded Files</div>
          {uploadedFiles.map((file) => {
            const FileIcon = getFileIcon(file.mimeType)
            
            return (
              <Card key={file.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 min-w-0">
                      <FileIcon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{file.originalName}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatFileSize(file.fileSize)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {file.downloadUrl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-8 h-8 p-0"
                          onClick={() => window.open(file.downloadUrl, '_blank')}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-8 h-8 p-0 text-destructive hover:text-destructive"
                        onClick={() => removeFile(file.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default FileUpload