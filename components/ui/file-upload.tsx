'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface UploadResult {
  success: boolean;
  url?: string;
  publicId?: string;
  width?: number;
  height?: number;
  format?: string;
  thumbnail?: string;
  duration?: number;
  error?: string;
}

interface FileUploadProps {
  type: 'product' | 'store-logo' | 'store-banner' | 'avatar' | 'company-logo' | 'company-video' | 'favicon';
  accept?: 'image' | 'video' | 'both';
  maxFiles?: number;
  onUpload?: (result: UploadResult) => void;
  onUploadStart?: () => void;
  onUploadComplete?: (results: UploadResult[]) => void;
  onError?: (error: string) => void;
  className?: string;
  buttonText?: string;
  showPreview?: boolean;
  previewUrl?: string;
  disabled?: boolean;
}

export function FileUpload({
  type,
  accept = 'image',
  maxFiles = 1,
  onUpload,
  onUploadStart,
  onUploadComplete,
  onError,
  className,
  buttonText = 'Upload',
  showPreview = false,
  previewUrl,
  disabled = false,
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(previewUrl || null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const getAcceptTypes = () => {
    switch (accept) {
      case 'image':
        return 'image/jpeg,image/png,image/webp,image/gif';
      case 'video':
        return 'video/mp4,video/webm,video/quicktime';
      case 'both':
        return 'image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime';
      default:
        return 'image/jpeg,image/png,image/webp,image/gif';
    }
  };

  const uploadFile = async (file: File): Promise<UploadResult> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    
    // Determine resource type
    if (file.type.startsWith('video/')) {
      formData.append('resourceType', 'video');
    } else {
      formData.append('resourceType', 'image');
    }

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Upload failed');
    }

    return result;
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const filesToUpload = Array.from(files).slice(0, maxFiles);
    
    setIsUploading(true);
    setUploadProgress(0);
    onUploadStart?.();

    const results: UploadResult[] = [];
    
    try {
      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        
        // Create preview for images
        if (showPreview && file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (e) => setPreview(e.target?.result as string);
          reader.readAsDataURL(file);
        }

        const result = await uploadFile(file);
        results.push(result);
        onUpload?.(result);
        
        // Update progress
        setUploadProgress(Math.round(((i + 1) / filesToUpload.length) * 100));
      }

      onUploadComplete?.(results);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      onError?.(errorMessage);
      results.push({ success: false, error: errorMessage });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, []);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  return (
    <div className={cn('relative', className)}>
      <input
        ref={inputRef}
        type="file"
        accept={getAcceptTypes()}
        multiple={maxFiles > 1}
        onChange={handleChange}
        className="hidden"
        disabled={disabled || isUploading}
      />
      
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
          dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400',
          disabled && 'opacity-50 cursor-not-allowed',
          isUploading && 'pointer-events-none'
        )}
      >
        {showPreview && preview ? (
          <div className="relative">
            <img
              src={preview}
              alt="Preview"
              className="max-h-40 mx-auto rounded-lg object-cover"
            />
            <p className="mt-2 text-sm text-gray-500">Click or drag to replace</p>
          </div>
        ) : (
          <>
            <div className="mb-3">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <p className="text-sm text-gray-600">
              <span className="font-medium text-blue-600 hover:text-blue-500">
                {buttonText}
              </span>
              {' '}or drag and drop
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {accept === 'image' && 'PNG, JPG, WebP, GIF up to 10MB'}
              {accept === 'video' && 'MP4, WebM up to 100MB'}
              {accept === 'both' && 'Images up to 10MB, Videos up to 100MB'}
            </p>
          </>
        )}

        {isUploading && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-sm text-gray-500 mt-1">Uploading... {uploadProgress}%</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Multi-image upload with gallery preview
interface MultiImageUploadProps {
  type: 'product' | 'store-logo' | 'store-banner' | 'avatar' | 'company-logo';
  maxFiles?: number;
  initialImages?: { url: string; publicId: string }[];
  onChange?: (images: { url: string; publicId: string }[]) => void;
  className?: string;
}

export function MultiImageUpload({
  type,
  maxFiles = 10,
  initialImages = [],
  onChange,
  className,
}: MultiImageUploadProps) {
  const [images, setImages] = useState<{ url: string; publicId: string }[]>(initialImages);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleUpload = (result: UploadResult) => {
    if (result.success && result.url && result.publicId) {
      const newImages = [...images, { url: result.url, publicId: result.publicId }];
      setImages(newImages);
      onChange?.(newImages);
    }
  };

  const handleDelete = async (publicId: string) => {
    setIsDeleting(publicId);
    
    try {
      const response = await fetch('/api/upload', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicId, resourceType: 'image' }),
      });

      if (response.ok) {
        const newImages = images.filter((img) => img.publicId !== publicId);
        setImages(newImages);
        onChange?.(newImages);
      }
    } catch (error) {
      console.error('Failed to delete image:', error);
    } finally {
      setIsDeleting(null);
    }
  };

  const canUploadMore = images.length < maxFiles;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Image Gallery */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {images.map((image) => (
            <div key={image.publicId} className="relative group">
              <img
                src={image.url}
                alt="Uploaded"
                className="w-full h-32 object-cover rounded-lg"
              />
              <button
                onClick={() => handleDelete(image.publicId)}
                disabled={isDeleting === image.publicId}
                className={cn(
                  'absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full',
                  'opacity-0 group-hover:opacity-100 transition-opacity',
                  'hover:bg-red-600 disabled:opacity-50'
                )}
              >
                {isDeleting === image.publicId ? (
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Area */}
      {canUploadMore && (
        <FileUpload
          type={type}
          accept="image"
          maxFiles={maxFiles - images.length}
          onUpload={handleUpload}
          buttonText={images.length === 0 ? 'Upload Images' : 'Add More Images'}
        />
      )}

      <p className="text-xs text-gray-500">
        {images.length} / {maxFiles} images uploaded
      </p>
    </div>
  );
}
