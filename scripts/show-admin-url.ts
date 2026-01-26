/**
 * Admin Setup Script
 * 
 * Run this script to see your admin subdomain and setup instructions.
 * Usage: npx tsx scripts/show-admin-url.ts
 */

import { createHash } from 'crypto';

const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY || 'marketplace-admin-2026';
const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000';
const PROTOCOL = process.env.NODE_ENV === 'production' ? 'https' : 'http';

function generateAdminSubdomain(secretKey: string): string {
  const hash = createHash('sha256').update(secretKey).digest('hex');
  return `admin-${hash.substring(0, 12)}`;
}

const adminSubdomain = generateAdminSubdomain(ADMIN_SECRET_KEY);
const adminUrl = `${PROTOCOL}://${adminSubdomain}.${ROOT_DOMAIN}`;

console.log('\n========================================');
console.log('  MarketPlace Admin Setup');
console.log('========================================\n');
console.log('Admin Secret Key:', ADMIN_SECRET_KEY);
console.log('Admin Subdomain:', adminSubdomain);
console.log('Admin URL:', adminUrl);
console.log('\n----------------------------------------\n');
console.log('To create an admin user, make a POST request:');
console.log(`
curl -X POST ${PROTOCOL}://${ROOT_DOMAIN}/api/admin/setup \\
  -H "Content-Type: application/json" \\
  -H "x-admin-setup-key: ${ADMIN_SECRET_KEY}" \\
  -d '{"name": "Admin User", "email": "admin@example.com", "password": "SecurePassword123"}'
`);
console.log('----------------------------------------\n');
console.log('Portal URLs:');
console.log(`  Main Site:     ${PROTOCOL}://${ROOT_DOMAIN}`);
console.log(`  Admin Portal:  ${adminUrl}`);
console.log(`  Seller Portal: ${PROTOCOL}://seller.${ROOT_DOMAIN}`);
console.log('\n========================================\n');
