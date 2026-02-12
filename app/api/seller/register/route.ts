import { NextRequest, NextResponse } from 'next/server';
import { createUser, getUserByEmail, createSeller, isSubdomainAvailable } from '@/lib/db';
import { UserRole, isReservedSubdomain } from '@/lib/auth-config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      // Step 1 – Account
      name,
      email,
      password,
      // Step 2 – Company
      businessName,
      businessEmail,
      businessPhone,
      businessType,
      yearEstablished,
      employeeCount,
      annualRevenue,
      registrationNumber,
      description,
      website,
      // Step 3 – Location & Trade
      country,
      state,
      city,
      address,
      postalCode,
      factoryAddress,
      factorySize,
      nearestPort,
      mainMarkets,
      certifications,
      // Step 4 – Storefront
      subdomain,
      customDomain,
      mainProducts,
    } = body;

    // Validate required fields
    if (!name || !email || !password || !businessName || !businessEmail || !subdomain) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!country || !city) {
      return NextResponse.json(
        { error: 'Country and city are required' },
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

    // Check if user already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // Create user account
    const user = await createUser({
      name,
      email,
      password,
      role: UserRole.SELLER,
    });

    // Create seller profile + linked company
    const seller = await createSeller({
      userId: user.id,
      businessName,
      businessEmail,
      businessPhone,
      description,
      subdomain: sanitizedSubdomain,
      customDomain: customDomain || undefined,
      // Company fields
      businessType,
      yearEstablished: yearEstablished ? parseInt(yearEstablished, 10) : undefined,
      employeeCount,
      annualRevenue,
      registrationNumber,
      website,
      country,
      state,
      city,
      address,
      postalCode,
      factoryAddress,
      factorySize,
      nearestPort,
      mainMarkets: Array.isArray(mainMarkets) ? mainMarkets : [],
      certifications: Array.isArray(certifications) ? certifications : [],
      mainProducts,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      seller: {
        id: seller.id,
        businessName: seller.businessName,
        subdomain: seller.subdomain,
        status: seller.status,
      },
    });
  } catch (error) {
    console.error('Seller registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
