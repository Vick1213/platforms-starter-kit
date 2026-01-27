import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const protocol =
  process.env.NODE_ENV === 'production' ? 'https' : 'http';

// Helper to strip protocol from URL if present
function stripProtocol(url: string): string {
  return url.replace(/^https?:\/\//, '');
}

/**
 * Custom Domain Configuration:
 * - Set NEXT_PUBLIC_ROOT_DOMAIN=supplyme.asia in Vercel environment variables
 * - Point domain nameservers to ns1.vercel-dns.com and ns2.vercel-dns.com
 * - Add both supplyme.asia AND *.supplyme.asia in Vercel Project Settings > Domains
 */
export const rootDomain = (() => {
  // Check for custom domain first (for production with your own domain)
  const customDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN;
  if (customDomain && 
      customDomain !== 'localhost:3000' &&
      !customDomain.includes('.vercel.app') &&
      !customDomain.includes('.vercel.dev')) {
    return stripProtocol(customDomain);
  }
  
  // Vercel deployment URL (preview deployments)
  if (process.env.VERCEL_URL) {
    return stripProtocol(process.env.VERCEL_URL);
  }
  
  // Fallback for local development
  return 'localhost:3000';
})();

// Check if we're on a Vercel preview deployment (*.vercel.app or *.vercel.dev)
// This is NOT a custom domain scenario
export const isVercelPreview = (() => {
  const vercelUrl = process.env.VERCEL_URL || '';
  return vercelUrl.includes('.vercel.app') || vercelUrl.includes('.vercel.dev');
})();

// Check if using custom domain (like supplyme.asia)
export const isCustomDomain = (() => {
  const customDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN;
  return customDomain && 
         customDomain !== 'localhost:3000' &&
         !customDomain.includes('.vercel.app') &&
         !customDomain.includes('.vercel.dev');
})();

/**
 * Build a subdomain URL that works correctly for:
 * - Local development: subdomain.localhost:3000
 * - Vercel preview: subdomain---project-name.vercel.app (using --- prefix syntax)
 * - Custom domain: subdomain.supplyme.asia (real wildcard subdomains)
 * 
 * For Vercel preview deployments (*.vercel.app):
 *   - Wildcard subdomains don't work
 *   - Use "---" prefix syntax: seller---platforms-starter-kit.vercel.app
 * 
 * For custom domains (supplyme.asia):
 *   - Add *.supplyme.asia in Vercel Project Settings > Domains
 *   - Point nameservers to ns1.vercel-dns.com and ns2.vercel-dns.com
 *   - Real subdomains work: seller.supplyme.asia, admin-xxx.supplyme.asia
 */
export function buildSubdomainUrl(subdomain: string): string {
  // Local development
  if (rootDomain.includes('localhost')) {
    return `${protocol}://${subdomain}.${rootDomain}`;
  }
  
  // Custom domain - use traditional subdomain (wildcard works with Vercel nameservers)
  if (isCustomDomain) {
    return `https://${subdomain}.${rootDomain}`;
  }
  
  // Vercel preview deployment - use --- prefix syntax
  // This only works on paid Vercel plans
  if (isVercelPreview) {
    const vercelUrl = process.env.VERCEL_URL || rootDomain;
    return `https://${subdomain}---${vercelUrl}`;
  }
  
  // Fallback to traditional subdomain
  return `${protocol}://${subdomain}.${rootDomain}`;
}

// Get the seller portal URL
export function getSellerPortalUrl(): string {
  return buildSubdomainUrl('seller');
}

// Get the main site URL
export function getMainSiteUrl(): string {
  return `${protocol}://${rootDomain}`;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
