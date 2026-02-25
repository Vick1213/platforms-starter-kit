import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getSellerByUserId, updateSeller } from '@/lib/db';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';

// GET /api/seller/profile - Get seller profile and customization
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const subdomain = searchParams.get('subdomain');

    // Public store lookup by subdomain (for storefront pages)
    if (subdomain) {
      const seller = await prisma.seller.findUnique({
        where: { subdomain },
        select: {
          id: true,
          businessName: true,
          subdomain: true,
          logo: true,
        },
      });

      if (!seller) {
        return NextResponse.json({ error: 'Seller not found' }, { status: 404 });
      }

      return NextResponse.json({
        id: seller.id,
        name: seller.businessName,
        subdomain: seller.subdomain,
        logo: seller.logo,
      });
    }

    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const seller = await getSellerByUserId(session.user.id);
    
    if (!seller) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 });
    }

    // Get customization data
    const customization = await redis.get(`store:custom:${seller.id}`);

    return NextResponse.json({
      seller,
      customization: customization || null,
    });
  } catch (error) {
    console.error('Error fetching seller profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

// PUT /api/seller/profile - Update seller profile
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

    const body = await request.json();
    const {
      businessName,
      businessEmail,
      businessPhone,
      description,
      logo,
      banner,
    } = body;

    // Validate required fields
    if (!businessName || !businessEmail) {
      return NextResponse.json(
        { error: 'Business name and email are required' },
        { status: 400 }
      );
    }

    // Update seller
    const updated = await updateSeller(seller.id, {
      businessName,
      businessEmail,
      businessPhone: businessPhone || null,
      description: description || null,
      logo: logo || null,
      banner: banner || null,
    });

    return NextResponse.json({
      success: true,
      seller: updated,
    });
  } catch (error) {
    console.error('Error updating seller profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
