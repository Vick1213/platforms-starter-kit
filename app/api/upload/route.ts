import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { 
  uploadImage, 
  uploadVideo, 
  deleteFile,
  UPLOAD_FOLDERS 
} from '@/lib/cloudinary';

// Max file sizes
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

// Allowed MIME types
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

export async function POST(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const type = formData.get('type') as string | null; // 'product' | 'store-logo' | 'store-banner' | 'avatar' | 'company-video'
    const resourceType = formData.get('resourceType') as 'image' | 'video' | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!type) {
      return NextResponse.json({ error: 'Upload type is required' }, { status: 400 });
    }

    // Determine resource type from file if not specified
    const isVideo = resourceType === 'video' || ALLOWED_VIDEO_TYPES.includes(file.type);
    const isImage = !isVideo && ALLOWED_IMAGE_TYPES.includes(file.type);

    if (!isImage && !isVideo) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: JPEG, PNG, WebP, GIF for images; MP4, WebM for videos' },
        { status: 400 }
      );
    }

    // Check file size
    if (isImage && file.size > MAX_IMAGE_SIZE) {
      return NextResponse.json(
        { error: 'Image file too large. Maximum size is 10MB' },
        { status: 400 }
      );
    }

    if (isVideo && file.size > MAX_VIDEO_SIZE) {
      return NextResponse.json(
        { error: 'Video file too large. Maximum size is 100MB' },
        { status: 400 }
      );
    }

    // Determine folder based on type
    let folder: string;
    switch (type) {
      case 'product':
        folder = isVideo ? UPLOAD_FOLDERS.PRODUCT_VIDEOS : UPLOAD_FOLDERS.PRODUCT_IMAGES;
        break;
      case 'store-logo':
        folder = UPLOAD_FOLDERS.STORE_LOGOS;
        break;
      case 'store-banner':
        folder = UPLOAD_FOLDERS.STORE_BANNERS;
        break;
      case 'avatar':
        folder = UPLOAD_FOLDERS.USER_AVATARS;
        break;
      case 'company-logo':
        folder = UPLOAD_FOLDERS.COMPANY_LOGOS;
        break;
      case 'company-video':
        folder = UPLOAD_FOLDERS.COMPANY_VIDEOS;
        break;
      default:
        return NextResponse.json({ error: 'Invalid upload type' }, { status: 400 });
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = `data:${file.type};base64,${buffer.toString('base64')}`;

    // Upload to Cloudinary
    let result;
    if (isVideo) {
      result = await uploadVideo(base64, folder);
    } else {
      result = await uploadImage(base64, folder);
    }

    return NextResponse.json({
      success: true,
      url: result.url,
      publicId: result.publicId,
      width: result.width,
      height: result.height,
      format: result.format,
      resourceType: result.resourceType,
      ...(result.thumbnail && { thumbnail: result.thumbnail }),
      ...(result.duration && { duration: result.duration }),
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

// DELETE endpoint to remove files
export async function DELETE(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { publicId, resourceType = 'image' } = await request.json();

    if (!publicId) {
      return NextResponse.json({ error: 'Public ID is required' }, { status: 400 });
    }

    const success = await deleteFile(publicId, resourceType);

    if (!success) {
      return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}
