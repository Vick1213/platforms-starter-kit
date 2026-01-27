import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { generateSignedUploadParams, UPLOAD_FOLDERS } from '@/lib/cloudinary';

export async function POST(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type } = await request.json();

    if (!type) {
      return NextResponse.json({ error: 'Upload type is required' }, { status: 400 });
    }

    // Determine folder based on type
    let folder: string;
    switch (type) {
      case 'product':
        folder = UPLOAD_FOLDERS.PRODUCT_IMAGES;
        break;
      case 'product-video':
        folder = UPLOAD_FOLDERS.PRODUCT_VIDEOS;
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

    const signedParams = generateSignedUploadParams(folder);

    return NextResponse.json({
      ...signedParams,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME || 'dej5gdswt',
    });
  } catch (error) {
    console.error('Signature generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate upload signature' },
      { status: 500 }
    );
  }
}
