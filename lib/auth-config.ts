// Admin subdomain configuration
// The admin subdomain is pre-computed from the secret key using SHA-256
// To generate: echo -n "YOUR_SECRET_KEY" | shasum -a 256 | cut -c1-12
// Then prefix with "admin-"

// Default admin subdomain for key "marketplace-admin-2026"
// Change this in production by setting ADMIN_SUBDOMAIN env variable
export const ADMIN_SUBDOMAIN = process.env.ADMIN_SUBDOMAIN || 'admin-fe7b9bce29ac';

// Reserved subdomains that cannot be registered by sellers
export const RESERVED_SUBDOMAINS = [
  'admin',
  'api',
  'www',
  'mail',
  'ftp',
  'seller',
  'sellers',
  'auth',
  'login',
  'register',
  'signup',
  'app',
  'dashboard',
  'help',
  'support',
  'blog',
  'static',
  'assets',
  'cdn',
  ADMIN_SUBDOMAIN,
];

// Check if a subdomain is the admin subdomain
export function isAdminSubdomain(subdomain: string): boolean {
  return subdomain === ADMIN_SUBDOMAIN;
}

// Check if a subdomain is the seller portal
export function isSellerSubdomain(subdomain: string): boolean {
  return subdomain === 'seller' || subdomain === 'sellers';
}

// Check if subdomain is reserved
export function isReservedSubdomain(subdomain: string): boolean {
  return RESERVED_SUBDOMAINS.includes(subdomain.toLowerCase());
}

// User roles
export enum UserRole {
  USER = 'USER',
  SELLER = 'SELLER',
  ADMIN = 'ADMIN',
}

// Portal types based on subdomain
export enum PortalType {
  MAIN = 'MAIN',
  ADMIN = 'ADMIN',
  SELLER = 'SELLER',
  STORE = 'STORE',
}

export function getPortalType(subdomain: string | null): PortalType {
  if (!subdomain) return PortalType.MAIN;
  if (isAdminSubdomain(subdomain)) return PortalType.ADMIN;
  if (isSellerSubdomain(subdomain)) return PortalType.SELLER;
  return PortalType.STORE;
}
