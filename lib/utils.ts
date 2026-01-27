import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const protocol =
  process.env.NODE_ENV === 'production' ? 'https' : 'http';

// Determine root domain - use Vercel URL in production if custom domain not set
export const rootDomain = (() => {
  // Explicit custom domain takes priority
  if (process.env.NEXT_PUBLIC_ROOT_DOMAIN && 
      process.env.NEXT_PUBLIC_ROOT_DOMAIN !== 'localhost:3000') {
    return process.env.NEXT_PUBLIC_ROOT_DOMAIN;
  }
  // Use Vercel deployment URL in production
  if (process.env.VERCEL_URL) {
    return process.env.VERCEL_URL;
  }
  // Fallback
  return process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000';
})();

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
