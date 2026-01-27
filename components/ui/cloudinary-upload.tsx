'use client';

import { CldUploadWidget, CldImage } from 'next-cloudinary';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CloudinaryUploadResult {
  info: {
    public_id: string;
    secure_url: string;
    width: number;
    height: number;
    format: string;
    resource_type: string;
    thumbnail_url?: string;
    duration?: number;
  };
}

interface CloudinaryUploadButtonProps {
  type: 'product' | 'store-logo' | 'store-banner' | 'avatar' | 'company-logo' | 'company-video';
  onUpload?: (result: {
    publicId: string;
    url: string;
    width: number;
    height: number;
    format: string;
    resourceType: string;
  }) => void;
  buttonText?: string;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  maxFiles?: number;
  resourceType?: 'image' | 'video' | 'auto';
}

// Map type to Cloudinary folder
const getFolderForType = (type: string): string => {
  const folders: Record<string, string> = {
    'product': 'supplyme/products',
    'store-logo': 'supplyme/stores/logos',
    'store-banner': 'supplyme/stores/banners',
    'avatar': 'supplyme/users/avatars',
    'company-logo': 'supplyme/companies/logos',
    'company-video': 'supplyme/companies/videos',
  };
  return folders[type] || 'supplyme/misc';
};

export function CloudinaryUploadButton({
  type,
  onUpload,
  buttonText = 'Upload',
  className,
  variant = 'default',
  maxFiles = 1,
  resourceType = 'image',
}: CloudinaryUploadButtonProps) {
  const folder = getFolderForType(type);

  const handleSuccess = (result: CloudinaryUploadResult) => {
    const { info } = result;
    onUpload?.({
      publicId: info.public_id,
      url: info.secure_url,
      width: info.width,
      height: info.height,
      format: info.format,
      resourceType: info.resource_type,
    });
  };

  return (
    <CldUploadWidget
      uploadPreset="supplyme_unsigned" // We'll create this in Cloudinary dashboard
      options={{
        folder,
        maxFiles,
        resourceType,
        clientAllowedFormats: resourceType === 'video' 
          ? ['mp4', 'webm', 'mov'] 
          : ['jpg', 'jpeg', 'png', 'webp', 'gif'],
        maxFileSize: resourceType === 'video' ? 100000000 : 10000000, // 100MB video, 10MB image
        sources: ['local', 'url', 'camera'],
        showUploadMoreButton: maxFiles > 1,
        singleUploadAutoClose: maxFiles === 1,
      }}
      onSuccess={handleSuccess as any}
    >
      {({ open }) => (
        <Button
          type="button"
          variant={variant}
          className={className}
          onClick={() => open()}
        >
          {buttonText}
        </Button>
      )}
    </CldUploadWidget>
  );
}

// Signed upload version (more secure, requires server signature)
interface SignedCloudinaryUploadProps {
  type: 'product' | 'store-logo' | 'store-banner' | 'avatar' | 'company-logo' | 'company-video';
  onUpload?: (result: {
    publicId: string;
    url: string;
    width: number;
    height: number;
  }) => void;
  buttonText?: string;
  className?: string;
  maxFiles?: number;
  resourceType?: 'image' | 'video' | 'auto';
}

export function SignedCloudinaryUpload({
  type,
  onUpload,
  buttonText = 'Upload',
  className,
  maxFiles = 1,
  resourceType = 'image',
}: SignedCloudinaryUploadProps) {
  const [isLoading, setIsLoading] = useState(false);

  const getSignature = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/upload/signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get upload signature');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Signature error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccess = (result: CloudinaryUploadResult) => {
    const { info } = result;
    onUpload?.({
      publicId: info.public_id,
      url: info.secure_url,
      width: info.width,
      height: info.height,
    });
  };

  return (
    <CldUploadWidget
      signatureEndpoint="/api/upload/signature"
      options={{
        folder: getFolderForType(type),
        maxFiles,
        resourceType,
        clientAllowedFormats: resourceType === 'video' 
          ? ['mp4', 'webm', 'mov'] 
          : ['jpg', 'jpeg', 'png', 'webp', 'gif'],
        maxFileSize: resourceType === 'video' ? 100000000 : 10000000,
        sources: ['local', 'url', 'camera'],
      }}
      onSuccess={handleSuccess as any}
    >
      {({ open }) => (
        <Button
          type="button"
          className={className}
          onClick={() => open()}
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : buttonText}
        </Button>
      )}
    </CldUploadWidget>
  );
}

// Image display component with Cloudinary optimizations
interface OptimizedImageProps {
  publicId: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  crop?: 'fill' | 'fit' | 'scale' | 'thumb';
  priority?: boolean;
}

export function OptimizedImage({
  publicId,
  alt,
  width,
  height,
  className,
  crop = 'fill',
  priority = false,
}: OptimizedImageProps) {
  return (
    <CldImage
      src={publicId}
      alt={alt}
      width={width}
      height={height}
      crop={crop}
      className={className}
      priority={priority}
      loading={priority ? 'eager' : 'lazy'}
      format="auto"
      quality="auto"
    />
  );
}

// Avatar component
interface AvatarImageProps {
  publicId?: string;
  fallbackUrl?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const avatarSizes = {
  sm: 32,
  md: 48,
  lg: 64,
  xl: 96,
};

export function AvatarImage({
  publicId,
  fallbackUrl,
  name,
  size = 'md',
  className,
}: AvatarImageProps) {
  const pixels = avatarSizes[size];
  
  if (publicId) {
    return (
      <CldImage
        src={publicId}
        alt={name || 'Avatar'}
        width={pixels}
        height={pixels}
        crop="fill"
        gravity="face"
        className={cn('rounded-full object-cover', className)}
        format="auto"
        quality="auto"
      />
    );
  }

  if (fallbackUrl) {
    return (
      <img
        src={fallbackUrl}
        alt={name || 'Avatar'}
        width={pixels}
        height={pixels}
        className={cn('rounded-full object-cover', className)}
      />
    );
  }

  // Generate initials
  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  return (
    <div
      className={cn(
        'rounded-full bg-gray-200 flex items-center justify-center font-medium text-gray-600',
        className
      )}
      style={{ width: pixels, height: pixels, fontSize: pixels * 0.4 }}
    >
      {initials}
    </div>
  );
}
