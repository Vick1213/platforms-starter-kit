import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getSellerByUserId } from '@/lib/db';
import { redis } from '@/lib/redis';
import { 
  StoreCustomization, 
  defaultStoreCustomization, 
  mergeWithDefaults 
} from '@/lib/store-customization-types';

// GET /api/seller/customization - Get store customization
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const seller = await getSellerByUserId(session.user.id);
    
    if (!seller) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 });
    }

    const customization = await redis.get<StoreCustomization>(`store:custom:${seller.id}`);

    return NextResponse.json({
      customization: customization || null,
    });
  } catch (error) {
    console.error('Error fetching customization:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customization' },
      { status: 500 }
    );
  }
}

// PUT /api/seller/customization - Update store customization
export async function PUT(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const seller = await getSellerByUserId(session.user.id);
    
    if (!seller) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 });
    }

    const customization: Partial<StoreCustomization> = await request.json();

    // Validate colors if provided
    const colorRegex = /^#[0-9A-Fa-f]{6}$/;
    if (customization.colors?.primary && !colorRegex.test(customization.colors.primary)) {
      return NextResponse.json(
        { error: 'Invalid primary color format' },
        { status: 400 }
      );
    }

    // Merge with defaults to ensure all fields exist
    const mergedCustomization = mergeWithDefaults(customization);

    // Save customization
    await redis.set(`store:custom:${seller.id}`, mergedCustomization);

    return NextResponse.json({
      success: true,
      customization,
    });
  } catch (error) {
    console.error('Error updating customization:', error);
    return NextResponse.json(
      { error: 'Failed to update customization' },
      { status: 500 }
    );
  }
}
