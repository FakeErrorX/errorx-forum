"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Icon } from '@iconify/react';
import { toast } from "sonner";

interface FileUploadProps {
  onUploadComplete?: (file: {
    key: string;
    url: string;
    name: string;
    size: number;
    type: string;
  }) => void;
  folder?: string;
  allowedTypes?: 'images' | 'documents' | 'archives' | 'videos' | 'audio' | 'all';
  maxSizeMB?: number;
  className?: string;
}

export function FileUpload({ 
  onUploadComplete, 
  folder = 'uploads', 
  allowedTypes = 'images',
  maxSizeMB = 10,
  className = ""
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Validate file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`File too large. Maximum size: ${maxSizeMB}MB`);
      return;
    }

    await uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);
      formData.append('allowedTypes', allowedTypes);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      toast.success("File uploaded successfully!");
      
      if (onUploadComplete) {
        onUploadComplete(data.file);
      }

    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={className}>
      <Card 
        className={`cursor-pointer transition-all duration-200 ${
          dragActive ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
        } ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <CardContent className="p-6">
          <div className="text-center">
            {isUploading ? (
              <div className="space-y-4">
                <Icon icon="lucide:upload" className="h-8 w-8 mx-auto text-primary animate-pulse" />
                <div>
                  <p className="text-sm font-medium">Uploading...</p>
                  <Progress value={uploadProgress} className="w-full mt-2" />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Icon 
                  icon="lucide:upload-cloud" 
                  className={`h-12 w-12 mx-auto ${
                    dragActive ? 'text-primary' : 'text-muted-foreground'
                  }`} 
                />
                <div>
                  <p className="text-sm font-medium">
                    {dragActive ? 'Drop file here' : 'Click to upload or drag and drop'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {allowedTypes === 'images' && 'Images only'}
                    {allowedTypes === 'documents' && 'Documents only'}
                    {allowedTypes === 'all' && 'Any file type'}
                    {!['images', 'documents', 'all'].includes(allowedTypes) && `${allowedTypes} files`}
                    {' • '}Max {maxSizeMB}MB
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={(e) => handleFileSelect(e.target.files)}
        accept={allowedTypes === 'images' ? 'image/*' : undefined}
      />
    </div>
  );
}

// Image preview component
interface ImagePreviewProps {
  src: string;
  alt: string;
  className?: string;
  onRemove?: () => void;
}

export function ImagePreview({ src, alt, className = "", onRemove }: ImagePreviewProps) {
  return (
    <div className={`relative group ${className}`}>
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover rounded-lg"
      />
      {onRemove && (
        <Button
          size="sm"
          variant="destructive"
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={onRemove}
        >
          <Icon icon="lucide:x" className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

// File list component
interface FileListProps {
  files: Array<{
    key: string;
    url: string;
    name: string;
    size: number;
    type: string;
  }>;
  onRemove?: (key: string) => void;
  className?: string;
}

export function FileList({ files, onRemove, className = "" }: FileListProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return 'lucide:image';
    if (type.startsWith('video/')) return 'lucide:video';
    if (type.startsWith('audio/')) return 'lucide:music';
    if (type.includes('pdf')) return 'lucide:file-text';
    if (type.includes('zip') || type.includes('rar')) return 'lucide:archive';
    return 'lucide:file';
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {files.map((file) => (
        <div key={file.key} className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center space-x-3">
            <Icon icon={getFileIcon(file.type)} className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open(file.url, '_blank')}
            >
              <Icon icon="lucide:external-link" className="h-4 w-4" />
            </Button>
            {onRemove && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onRemove(file.key)}
              >
                <Icon icon="lucide:trash-2" className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
