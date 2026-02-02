'use client';

import { useEffect, useState } from 'react';
import { signOut } from 'next-auth/react';
import { Loader2 } from 'lucide-react';

export default function LogoutPage() {
  const [status, setStatus] = useState('Signing out...');

  useEffect(() => {
    const performSignOut = async () => {
      try {
        // First, call our custom signout API to clear cross-subdomain cookies
        // Call it on the current domain
        const localResponse = await fetch('/api/auth/signout', { 
          method: 'POST',
          credentials: 'include',
        });
        console.log('[Logout] Local signout response:', await localResponse.json());
        
        setStatus('Clearing session...');
        
        // Then call NextAuth signOut to clear client-side state
        await signOut({ redirect: false });
        
        setStatus('Redirecting...');
        
        // Small delay to ensure cookies are processed
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Force a hard refresh to clear any cached state
        // Use replace to prevent back navigation to logout page
        window.location.replace('/');
      } catch (error) {
        console.error('Sign out error:', error);
        // Still try to redirect
        window.location.replace('/');
      }
    };
    performSignOut();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600 mx-auto mb-4" />
        <p className="text-gray-600">{status}</p>
      </div>
    </div>
  );
}
