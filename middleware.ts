import { type NextRequest, NextResponse } from 'next/server';
import { rootDomain } from '@/lib/utils';
import { 
  isAdminSubdomain, 
  isSellerSubdomain, 
  getPortalType 
} from '@/lib/auth-config';

function extractSubdomain(request: NextRequest): string | null {
  const url = request.url;
  const host = request.headers.get('host') || '';
  const hostname = host.split(':')[0];

  // Local development environment
  if (url.includes('localhost') || url.includes('127.0.0.1')) {
    // Try to extract subdomain from the full URL
    const fullUrlMatch = url.match(/http:\/\/([^.]+)\.localhost/);
    if (fullUrlMatch && fullUrlMatch[1]) {
      return fullUrlMatch[1];
    }

    // Fallback to host header approach
    if (hostname.includes('.localhost')) {
      return hostname.split('.')[0];
    }

    return null;
  }

  // Production environment
  const rootDomainFormatted = rootDomain.split(':')[0];

  // Handle preview deployment URLs (tenant---branch-name.vercel.app)
  if (hostname.includes('---') && hostname.endsWith('.vercel.app')) {
    const parts = hostname.split('---');
    return parts.length > 0 ? parts[0] : null;
  }

  // Regular subdomain detection
  const isSubdomain =
    hostname !== rootDomainFormatted &&
    hostname !== `www.${rootDomainFormatted}` &&
    hostname.endsWith(`.${rootDomainFormatted}`);

  return isSubdomain ? hostname.replace(`.${rootDomainFormatted}`, '') : null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const subdomain = extractSubdomain(request);
  const portalType = getPortalType(subdomain);

  // Always allow API routes
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Create response with portal context headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-portal-type', portalType);
  requestHeaders.set('x-subdomain', subdomain || '');

  // Handle different portal types
  if (subdomain) {
    // ADMIN PORTAL (secret subdomain)
    if (isAdminSubdomain(subdomain)) {
      // Rewrite root to admin dashboard
      if (pathname === '/') {
        return NextResponse.rewrite(new URL('/admin', request.url), {
          headers: requestHeaders,
        });
      }
      // Allow admin and auth routes
      if (pathname.startsWith('/admin') || pathname.startsWith('/auth')) {
        return NextResponse.next({
          request: { headers: requestHeaders },
        });
      }
      // Redirect other routes to admin
      return NextResponse.redirect(new URL('/admin', request.url));
    }

    // SELLER PORTAL
    if (isSellerSubdomain(subdomain)) {
      // Rewrite root to seller dashboard
      if (pathname === '/') {
        return NextResponse.rewrite(new URL('/seller', request.url), {
          headers: requestHeaders,
        });
      }
      // Allow seller and auth routes
      if (pathname.startsWith('/seller') || pathname.startsWith('/auth')) {
        return NextResponse.next({
          request: { headers: requestHeaders },
        });
      }
      // Redirect other routes to seller dashboard
      return NextResponse.redirect(new URL('/seller', request.url));
    }

    // STORE SUBDOMAIN (customer-facing store pages)
    // Block admin and seller pages from store subdomains
    if (pathname.startsWith('/admin') || pathname.startsWith('/seller')) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Rewrite root to store page
    if (pathname === '/') {
      return NextResponse.rewrite(new URL(`/store/${subdomain}`, request.url), {
        headers: requestHeaders,
      });
    }

    // Handle legacy subdomain format
    if (pathname === '/') {
      return NextResponse.rewrite(new URL(`/s/${subdomain}`, request.url), {
        headers: requestHeaders,
      });
    }
  }

  // MAIN DOMAIN - block direct admin access (must use secret subdomain)
  if (!subdomain && pathname.startsWith('/admin')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Allow normal access on main domain
  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * 1. /_next (Next.js internals)
     * 2. all root files inside /public (e.g. /favicon.ico)
     */
    '/((?!_next|[\\w-]+\\.\\w+).*)'
  ]
};
