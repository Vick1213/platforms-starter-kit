import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createSeller, getSellerByUserId, isSubdomainAvailable } from '@/lib/db';
import { isReservedSubdomain } from '@/lib/auth-config';

/**
 * API route for existing authenticated users to become sellers
 * This is different from /api/seller/register which creates both user and seller
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'You must be signed in to become a seller' },
        { status: 401 }
      );
    }

    // Check if user already has a seller profile
    const existingSeller = await getSellerByUserId(session.user.id);
    if (existingSeller) {
      return NextResponse.json(
        { error: 'You already have a seller profile', seller: existingSeller },
        { status: 409 }
      );
    }

    const body = await request.json();
    const { 
      businessName, 
      businessEmail, 
      businessPhone, 
      subdomain, 
      customDomain,
      description 
    } = body;

    // Validate required fields
    if (!businessName || !businessEmail || !subdomain) {
      return NextResponse.json(
        { error: 'Business name, email, and subdomain are required' },
        { status: 400 }
      );
    }

    // Validate subdomain format
    const sanitizedSubdomain = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (sanitizedSubdomain !== subdomain.toLowerCase()) {
      return NextResponse.json(
        { error: 'Subdomain can only contain lowercase letters, numbers, and hyphens' },
        { status: 400 }
      );
    }

    if (sanitizedSubdomain.length < 3) {
      return NextResponse.json(
        { error: 'Subdomain must be at least 3 characters' },
        { status: 400 }
      );
    }

    // Check if subdomain is reserved
    if (isReservedSubdomain(sanitizedSubdomain)) {
      return NextResponse.json(
        { error: 'This subdomain is reserved' },
        { status: 400 }
      );
    }

    // Check subdomain availability
    const available = await isSubdomainAvailable(sanitizedSubdomain);
    if (!available) {
      return NextResponse.json(
        { error: 'This subdomain is already taken' },
        { status: 409 }
      );
    }

    // Create seller profile for existing user
    const seller = await createSeller({
      userId: session.user.id,
      businessName,
      businessEmail,
      businessPhone,
      description,
      subdomain: sanitizedSubdomain,
      customDomain: customDomain || undefined,
    });

    return NextResponse.json({
      success: true,
      seller: {
        id: seller.id,
        businessName: seller.businessName,
        subdomain: seller.subdomain,
        status: seller.status,
      },
    });
  } catch (error) {
    console.error('Become seller error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
