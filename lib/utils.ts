import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const protocol =
  process.env.NODE_ENV === 'production' ? 'https' : 'http';

// Helper to strip protocol from URL if present
function stripProtocol(url: string): string {
  return url.replace(/^https?:\/\//, '');
}

// Determine root domain - use Vercel URL in production if custom domain not set
export const rootDomain = (() => {
  // Explicit custom domain takes priority
  if (process.env.NEXT_PUBLIC_ROOT_DOMAIN && 
      process.env.NEXT_PUBLIC_ROOT_DOMAIN !== 'localhost:3000') {
    return stripProtocol(process.env.NEXT_PUBLIC_ROOT_DOMAIN);
  }
  // Use Vercel deployment URL in production
  if (process.env.VERCEL_URL) {
    return stripProtocol(process.env.VERCEL_URL);
  }
  // Fallback
  return stripProtocol(process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000');
})();

// Check if we're on a Vercel preview deployment (*.vercel.app or *.vercel.dev)
export const isVercelPreview = rootDomain.includes('.vercel.app') || rootDomain.includes('.vercel.dev');

/**
 * Build a subdomain URL that works correctly for:
 * - Local development: subdomain.localhost:3000
 * - Vercel preview: subdomain---project-name.vercel.app (using --- prefix syntax)
 * - Custom domain: subdomain.yourdomain.com
 * 
 * NOTE: Vercel does NOT support wildcard subdomains on *.vercel.app
 * Instead, we use the "---" prefix syntax for multi-tenant preview URLs
 * See: https://vercel.com/platforms/docs/multi-tenant-platforms/preview-url-prefixes
 */
export function buildSubdomainUrl(subdomain: string): string {
  // Local development
  if (rootDomain.includes('localhost')) {
    return `${protocol}://${subdomain}.${rootDomain}`;
  }
  
  // Vercel preview deployment - use --- prefix syntax
  if (isVercelPreview) {
    return `${protocol}://${subdomain}---${rootDomain}`;
  }
  
  // Custom domain - use traditional subdomain
  return `${protocol}://${subdomain}.${rootDomain}`;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
