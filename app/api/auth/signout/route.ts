import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  const cookieStore = await cookies();
  
  // Cookie names used by NextAuth
  const cookieNames = [
    // Production cookies
    '__Secure-authjs.session-token',
    '__Secure-authjs.callback-url',
    '__Host-authjs.csrf-token',
    // Development cookies
    'authjs.session-token',
    'authjs.callback-url',
    'authjs.csrf-token',
    // Legacy NextAuth cookies (just in case)
    'next-auth.session-token',
    'next-auth.callback-url',
    'next-auth.csrf-token',
    '__Secure-next-auth.session-token',
    '__Secure-next-auth.callback-url',
  ];

  const isProduction = process.env.NODE_ENV === 'production';
  const domain = isProduction ? '.supplyme.asia' : undefined;

  // Delete all auth-related cookies
  for (const name of cookieNames) {
    // Delete with domain (for cross-subdomain cookies)
    cookieStore.delete({
      name,
      path: '/',
      domain,
    });
    
    // Also try deleting without domain (for subdomain-specific cookies)
    cookieStore.delete({
      name,
      path: '/',
    });
  }

  return NextResponse.json({ success: true });
}
