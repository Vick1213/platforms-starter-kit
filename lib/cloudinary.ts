/**
 * Cloudinary Configuration & Upload Utilities
 * 
 * Handles image and video uploads for:
 * - Product images
 * - Store logos and banners
 * - Company videos
 * - User avatars
 */

import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary from environment
cloudinary.config({
  secure: true, // Use HTTPS
});

// Upload presets for different content types
export const UPLOAD_FOLDERS = {
  PRODUCT_IMAGES: 'supplyme/products',
  PRODUCT_VIDEOS: 'supplyme/products/videos',
  STORE_LOGOS: 'supplyme/stores/logos',
  STORE_BANNERS: 'supplyme/stores/banners',
  COMPANY_LOGOS: 'supplyme/companies/logos',
  COMPANY_VIDEOS: 'supplyme/companies/videos',
  USER_AVATARS: 'supplyme/users/avatars',
} as const;

// Image transformation presets
export const IMAGE_TRANSFORMS = {
  thumbnail: { width: 150, height: 150, crop: 'fill', quality: 'auto' },
  productCard: { width: 400, height: 400, crop: 'fill', quality: 'auto' },
  productDetail: { width: 800, height: 800, crop: 'limit', quality: 'auto' },
  banner: { width: 1200, height: 400, crop: 'fill', quality: 'auto' },
  logo: { width: 200, height: 200, crop: 'fit', quality: 'auto' },
  avatar: { width: 100, height: 100, crop: 'fill', quality: 'auto', gravity: 'face' },
} as const;

export interface UploadResult {
  url: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
  resourceType: 'image' | 'video';
  duration?: number; // For videos
  thumbnail?: string; // For videos
}

/**
 * Upload an image to Cloudinary
 */
export async function uploadImage(
  file: string | Buffer,
  folder: string,
  options?: {
    publicId?: string;
    transformation?: typeof IMAGE_TRANSFORMS[keyof typeof IMAGE_TRANSFORMS];
  }
): Promise<UploadResult> {
  const uploadOptions: any = {
    folder,
    resource_type: 'image',
    overwrite: true,
  };

  if (options?.publicId) {
    uploadOptions.public_id = options.publicId;
  }

  if (options?.transformation) {
    uploadOptions.transformation = options.transformation;
  }

  // Handle base64 or URL
  const fileToUpload = typeof file === 'string' 
    ? file 
    : `data:image/png;base64,${file.toString('base64')}`;

  const result = await cloudinary.uploader.upload(fileToUpload, uploadOptions);

  return {
    url: result.secure_url,
    publicId: result.public_id,
    width: result.width,
    height: result.height,
    format: result.format,
    resourceType: 'image',
  };
}

/**
 * Upload a video to Cloudinary
 */
export async function uploadVideo(
  file: string | Buffer,
  folder: string,
  options?: {
    publicId?: string;
  }
): Promise<UploadResult> {
  const uploadOptions: any = {
    folder,
    resource_type: 'video',
    overwrite: true,
    eager: [
      { width: 400, height: 300, crop: 'fill', format: 'jpg' }, // Thumbnail
    ],
    eager_async: true,
  };

  if (options?.publicId) {
    uploadOptions.public_id = options.publicId;
  }

  // Handle base64 or URL
  const fileToUpload = typeof file === 'string' 
    ? file 
    : `data:video/mp4;base64,${file.toString('base64')}`;

  const result = await cloudinary.uploader.upload(fileToUpload, uploadOptions);

  // Generate thumbnail URL
  const thumbnailUrl = cloudinary.url(result.public_id, {
    resource_type: 'video',
    format: 'jpg',
    transformation: [{ width: 400, height: 300, crop: 'fill' }],
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
    width: result.width,
    height: result.height,
    format: result.format,
    resourceType: 'video',
    duration: result.duration,
    thumbnail: thumbnailUrl,
  };
}

/**
 * Delete a file from Cloudinary
 */
export async function deleteFile(publicId: string, resourceType: 'image' | 'video' = 'image'): Promise<boolean> {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    return result.result === 'ok';
  } catch (error) {
    console.error('Error deleting file from Cloudinary:', error);
    return false;
  }
}

/**
 * Delete multiple files from Cloudinary
 */
export async function deleteFiles(publicIds: string[], resourceType: 'image' | 'video' = 'image'): Promise<void> {
  await cloudinary.api.delete_resources(publicIds, {
    resource_type: resourceType,
  });
}

/**
 * Get optimized URL with transformations
 */
export function getOptimizedUrl(
  publicId: string,
  transformation: keyof typeof IMAGE_TRANSFORMS | typeof IMAGE_TRANSFORMS[keyof typeof IMAGE_TRANSFORMS]
): string {
  const transform = typeof transformation === 'string' 
    ? IMAGE_TRANSFORMS[transformation] 
    : transformation;

  return cloudinary.url(publicId, {
    transformation: [transform],
    secure: true,
  });
}

/**
 * Generate a signed upload URL for client-side uploads
 */
export function generateSignedUploadParams(folder: string): {
  timestamp: number;
  signature: string;
  cloudName: string;
  apiKey: string;
  folder: string;
} {
  const timestamp = Math.round(new Date().getTime() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder },
    process.env.CLOUDINARY_URL?.split(':')[2]?.split('@')[0] || ''
  );

  return {
    timestamp,
    signature,
    cloudName: cloudinary.config().cloud_name || '',
    apiKey: cloudinary.config().api_key || '',
    folder,
  };
}

export { cloudinary };
