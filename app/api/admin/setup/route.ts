import { NextRequest, NextResponse } from 'next/server';
import { createUser, getUserByEmail } from '@/lib/db';
import { UserRole, ADMIN_SUBDOMAIN } from '@/lib/auth-config';
import { buildSubdomainUrl } from '@/lib/utils';

// This endpoint creates an admin user - should be secured in production
// Access it once to create your admin account, then disable or protect it

export async function POST(request: NextRequest) {
  try {
    // Check for secret key in header for basic protection
    const secretKey = request.headers.get('x-admin-setup-key');
    const expectedKey = process.env.ADMIN_SECRET_KEY || 'marketplace-admin-2026';

    if (secretKey !== expectedKey) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      // If user exists, check if they're already an admin
      if (existingUser.role === UserRole.ADMIN) {
        return NextResponse.json({
          message: 'Admin user already exists',
          adminUrl: buildSubdomainUrl(ADMIN_SUBDOMAIN),
        });
      }
      return NextResponse.json(
        { error: 'User already exists with different role' },
        { status: 409 }
      );
    }

    // Create admin user
    const user = await createUser({
      name,
      email,
      password,
      role: UserRole.ADMIN,
    });

    return NextResponse.json({
      success: true,
      message: 'Admin user created successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      adminSubdomain: ADMIN_SUBDOMAIN,
      adminUrl: buildSubdomainUrl(ADMIN_SUBDOMAIN),
    });
  } catch (error) {
    console.error('Admin setup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to check admin subdomain
export async function GET() {
  return NextResponse.json({
    adminSubdomain: ADMIN_SUBDOMAIN,
    adminUrl: buildSubdomainUrl(ADMIN_SUBDOMAIN),
    message: 'Use POST with x-admin-setup-key header to create admin user',
  });
}
