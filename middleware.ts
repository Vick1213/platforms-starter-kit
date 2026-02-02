import { type NextRequest, NextResponse } from 'next/server';
import { rootDomain, isVercelPreview, isCustomDomain } from '@/lib/utils';
import { 
  isAdminSubdomain, 
  isSellerSubdomain, 
  getPortalType 
} from '@/lib/auth-config';

/**
 * Extract subdomain from request hostname
 * 
 * Supports:
 * 1. Local development: subdomain.localhost:3000
 * 2. Vercel preview: subdomain---project.vercel.app (--- prefix syntax)
 * 3. Custom domain: subdomain.supplyme.asia (real wildcards with Vercel nameservers)
 */
function extractSubdomain(request: NextRequest): string | null {
  const url = request.url;
  const host = request.headers.get('host') || '';
  const hostname = host.split(':')[0].toLowerCase();

  console.log('[Middleware] URL:', url);
  console.log('[Middleware] Host:', host);
  console.log('[Middleware] Hostname:', hostname);
  console.log('[Middleware] Root Domain:', rootDomain);
  console.log('[Middleware] Is Custom Domain:', isCustomDomain);
  console.log('[Middleware] Is Vercel Preview:', isVercelPreview);

  // ============================================
  // 1. LOCAL DEVELOPMENT
  // ============================================
  if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
    // Try to extract subdomain from localhost URL
    const fullUrlMatch = url.match(/http:\/\/([^.]+)\.localhost/);
    if (fullUrlMatch && fullUrlMatch[1]) {
      console.log('[Middleware] Local subdomain found:', fullUrlMatch[1]);
      return fullUrlMatch[1];
    }

    // Fallback to host header approach
    if (hostname.includes('.localhost')) {
      const subdomain = hostname.split('.')[0];
      console.log('[Middleware] Local subdomain from host:', subdomain);
      return subdomain;
    }

    console.log('[Middleware] Local - no subdomain');
    return null;
  }

  // ============================================
  // 2. VERCEL PREVIEW (*.vercel.app, *.vercel.dev)
  // ============================================
  // Wildcard subdomains DON'T work on *.vercel.app
  // Use "---" prefix syntax instead (requires paid Vercel plan)
  if (hostname.includes('.vercel.app') || hostname.includes('.vercel.dev')) {
    // Check for "---" prefix syntax
    if (hostname.includes('---')) {
      const firstPart = hostname.split('.')[0];
      const tenantParts = firstPart.split('---');
      console.log('[Middleware] Vercel --- prefix detected:', tenantParts);
      return tenantParts.length > 0 ? tenantParts[0] : null;
    }
    
    console.log('[Middleware] Vercel preview - no --- prefix, main domain');
    return null;
  }

  // ============================================
  // 3. CUSTOM DOMAIN (supplyme.asia)
  // ============================================
  // With custom domain + wildcard (*.supplyme.asia) configured in Vercel,
  // real subdomains work: seller.supplyme.asia, admin-xxx.supplyme.asia
  // 
  // Requirements:
  // - Nameservers pointed to ns1.vercel-dns.com, ns2.vercel-dns.com
  // - Both supplyme.asia AND *.supplyme.asia added in Project Settings > Domains
  
  // Get the root domain without port
  const rootDomainClean = rootDomain.split(':')[0].toLowerCase();
  
  console.log('[Middleware] Checking custom domain. Root:', rootDomainClean);
  
  // Check if this is the apex or www domain (no subdomain)
  if (hostname === rootDomainClean || hostname === `www.${rootDomainClean}`) {
    console.log('[Middleware] Apex or www domain - no subdomain');
    return null;
  }
  
  // Check if hostname ends with the root domain (it's a subdomain)
  if (hostname.endsWith(`.${rootDomainClean}`)) {
    const subdomain = hostname.replace(`.${rootDomainClean}`, '');
    console.log('[Middleware] Custom domain subdomain found:', subdomain);
    return subdomain;
  }

  console.log('[Middleware] No subdomain detected');
  return null;
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

    // SELLER PORTAL (seller.supplyme.asia)
    // This is where sellers register and manage their stores
    if (isSellerSubdomain(subdomain)) {
      // Rewrite root to seller portal landing page
      // The page itself will redirect to /seller if user is a seller
      if (pathname === '/') {
        return NextResponse.rewrite(new URL('/seller-portal', request.url), {
          headers: requestHeaders,
        });
      }
      // Allow seller dashboard, auth, and seller-portal routes
      if (pathname.startsWith('/seller') || pathname.startsWith('/auth')) {
        return NextResponse.next({
          request: { headers: requestHeaders },
        });
      }
      // Redirect other routes to seller portal
      return NextResponse.redirect(new URL('/', request.url));
    }

    // STORE SUBDOMAIN (customer-facing store pages)
    // Block admin and seller pages from store subdomains
    if (pathname.startsWith('/admin') || pathname.startsWith('/seller')) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Rewrite store subdomain paths to /store/[subdomain]/...
    // Root path -> /store/[subdomain]
    // /products -> /store/[subdomain]/products
    // /products/slug -> /store/[subdomain]/products/slug
    // /about, /contact, /cart, /categories -> /store/[subdomain]/...
    if (pathname === '/') {
      return NextResponse.rewrite(new URL(`/store/${subdomain}`, request.url), {
        headers: requestHeaders,
      });
    }
    
    // Rewrite all other store paths (products, about, contact, cart, categories, etc.)
    // Don't rewrite auth routes - those should work as-is
    if (!pathname.startsWith('/auth') && !pathname.startsWith('/api')) {
      return NextResponse.rewrite(new URL(`/store/${subdomain}${pathname}`, request.url), {
        headers: requestHeaders,
      });
    }
  }

  // ============================================
  // VERCEL PREVIEW - ALLOW PATH-BASED ACCESS
  // ============================================
  // The --- prefix syntax requires a PAID Vercel plan (Pro/Enterprise)
  // For free tier, we allow path-based access to admin/seller on Vercel
  // Example: platforms-starter-kit-xi-rouge.vercel.app/admin
  // ============================================
  
  if (!subdomain && isVercelPreview) {
    // On Vercel preview without subdomain, allow direct path access
    if (pathname.startsWith('/admin') || pathname.startsWith('/seller') || pathname.startsWith('/auth')) {
      return NextResponse.next({
        request: { headers: requestHeaders },
      });
    }
  }

  // MAIN DOMAIN - block direct admin access (must use secret subdomain)
  // Skip this check on Vercel preview since subdomains don't work there
  if (!subdomain && !isVercelPreview && pathname.startsWith('/admin')) {
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
