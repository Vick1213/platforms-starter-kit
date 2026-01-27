import { NextResponse } from 'next/server';

export async function POST() {
  const isProduction = process.env.NODE_ENV === 'production';
  const domain = isProduction ? '.supplyme.asia' : 'localhost';
  
  // Cookie names used by NextAuth/Auth.js
  const cookieNames = [
    // Auth.js v5 cookies (production)
    '__Secure-authjs.session-token',
    '__Secure-authjs.callback-url',
    '__Host-authjs.csrf-token',
    // Auth.js v5 cookies (development)
    'authjs.session-token',
    'authjs.callback-url',
    'authjs.csrf-token',
  ];

  // Build response with Set-Cookie headers to clear all cookies
  const response = NextResponse.json({ success: true });
  
  for (const name of cookieNames) {
    // Clear cookie with domain (cross-subdomain)
    response.cookies.set(name, '', {
      expires: new Date(0),
      path: '/',
      domain: isProduction ? domain : undefined,
      secure: isProduction,
      httpOnly: true,
      sameSite: 'lax',
    });
    
    // Also clear without domain (subdomain-specific)
    if (isProduction) {
      response.cookies.set(name, '', {
        expires: new Date(0),
        path: '/',
        secure: true,
        httpOnly: true,
        sameSite: 'lax',
      });
    }
  }

  return response;
}
