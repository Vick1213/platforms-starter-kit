import { NextRequest, NextResponse } from 'next/server';
import { isSubdomainAvailable } from '@/lib/db';
import { isReservedSubdomain } from '@/lib/auth-config';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const subdomain = searchParams.get('subdomain');

  if (!subdomain) {
    return NextResponse.json(
      { error: 'Subdomain is required' },
      { status: 400 }
    );
  }

  const sanitized = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '');

  // Check if reserved
  if (isReservedSubdomain(sanitized)) {
    return NextResponse.json({ available: false, reason: 'reserved' });
  }

  // Check availability
  const available = await isSubdomainAvailable(sanitized);
  
  return NextResponse.json({ available });
}
