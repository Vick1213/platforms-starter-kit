'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function ClearCookiesPage() {
  const [clearing, setClearing] = useState(false);
  const [cleared, setCleared] = useState(false);

  const clearAuthCookies = () => {
    setClearing(true);
    
    // List of cookie names to clear
    const cookieNames = [
      'authjs.session-token',
      'authjs.callback-url', 
      'authjs.csrf-token',
      '__Secure-authjs.session-token',
      '__Secure-authjs.callback-url',
      '__Secure-authjs.csrf-token',
      '__Host-authjs.csrf-token',
      'next-auth.session-token',
      'next-auth.callback-url',
      'next-auth.csrf-token',
    ];

    // Domains to clear from
    const domains = [
      '',                      // Current domain
      '.supplyme.asia',        // Root domain with leading dot
      'supplyme.asia',         // Root domain without leading dot
    ];

    // Clear each cookie for each domain
    cookieNames.forEach(name => {
      domains.forEach(domain => {
        // Clear with various path options
        const paths = ['/', ''];
        paths.forEach(path => {
          let cookieStr = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path || '/'}`;
          if (domain) {
            cookieStr += `; domain=${domain}`;
          }
          document.cookie = cookieStr;
          
          // Also try with secure flag
          document.cookie = cookieStr + '; secure';
        });
      });
    });

    // Wait a moment then redirect
    setTimeout(() => {
      setClearing(false);
      setCleared(true);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        {cleared ? (
          <>
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Cookies Cleared!</h1>
            <p className="text-gray-600 mb-6">
              Your authentication cookies have been cleared. You can now sign in again.
            </p>
            <Link href="/auth/login">
              <Button className="w-full bg-orange-500 hover:bg-orange-600">
                Sign In
              </Button>
            </Link>
          </>
        ) : (
          <>
            <AlertCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Clear Auth Cookies</h1>
            <p className="text-gray-600 mb-6">
              If you're having trouble staying signed in across different store pages, 
              clearing your authentication cookies can help fix the issue.
            </p>
            <Button 
              onClick={clearAuthCookies}
              disabled={clearing}
              className="w-full bg-orange-500 hover:bg-orange-600"
            >
              {clearing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Clearing...
                </>
              ) : (
                'Clear Cookies & Sign Out'
              )}
            </Button>
            <Link href="/" className="block mt-4 text-sm text-gray-500 hover:text-gray-700">
              Cancel
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
