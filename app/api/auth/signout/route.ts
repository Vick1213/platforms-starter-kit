import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  const isProduction = process.env.NODE_ENV === 'production';
  const rootDomain = '.supplyme.asia';
  
  // All possible cookie names used by NextAuth/Auth.js
  const cookieNames = [
    // Auth.js v5 cookies (production with __Secure- prefix)
    '__Secure-authjs.session-token',
    '__Secure-authjs.callback-url',
    '__Secure-authjs.csrf-token',
    // Auth.js v5 cookies (development / non-secure)
    'authjs.session-token',
    'authjs.callback-url',
    'authjs.csrf-token',
    // Legacy NextAuth v4 cookies (just in case)
    'next-auth.session-token',
    'next-auth.callback-url',
    'next-auth.csrf-token',
    '__Secure-next-auth.session-token',
    '__Secure-next-auth.callback-url',
    // Host prefixed (cannot have domain)
    '__Host-authjs.csrf-token',
    '__Host-next-auth.csrf-token',
  ];

  // Read incoming cookies to log what we're clearing
  const cookieStore = await cookies();
  const existingCookies = cookieStore.getAll();
  console.log('[Signout] Existing cookies before clear:', existingCookies.map(c => c.name));

  // Build response with Set-Cookie headers to clear all cookies
  const response = NextResponse.json({ 
    success: true,
    clearedCookies: cookieNames,
    existingCookies: existingCookies.map(c => c.name),
  });
  
  // Generate multiple Set-Cookie headers for comprehensive clearing
  const setCookieHeaders: string[] = [];
  
  for (const name of cookieNames) {
    const isHostPrefixed = name.startsWith('__Host-');
    const isSecurePrefixed = name.startsWith('__Secure-') || name.startsWith('__Host-');
    
    if (isProduction) {
      if (isHostPrefixed) {
        // __Host- cookies CANNOT have a domain and MUST have path=/ and Secure
        setCookieHeaders.push(
          `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Secure; HttpOnly; SameSite=Lax`
        );
      } else {
        // Clear with root domain (affects all subdomains)
        setCookieHeaders.push(
          `${name}=; Path=/; Domain=${rootDomain}; Expires=Thu, 01 Jan 1970 00:00:00 GMT;${isSecurePrefixed ? ' Secure;' : ''} HttpOnly; SameSite=Lax`
        );
        
        // Also clear without domain (subdomain-specific cookies)
        setCookieHeaders.push(
          `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT;${isSecurePrefixed ? ' Secure;' : ''} HttpOnly; SameSite=Lax`
        );
      }
    } else {
      // Development - simpler cookie clearing
      setCookieHeaders.push(
        `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax`
      );
    }
  }

  // Set all cookies using headers for better control
  for (const header of setCookieHeaders) {
    response.headers.append('Set-Cookie', header);
  }

  console.log('[Signout] Set-Cookie headers count:', setCookieHeaders.length);

  return response;
}

// Also handle GET for direct navigation
export async function GET() {
  return POST();
}
