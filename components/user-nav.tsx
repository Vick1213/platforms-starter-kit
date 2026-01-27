'use client';

import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { Store } from 'lucide-react';
import type { UserRole } from '@/lib/auth-config';

type UserNavProps = {
  user: {
    name?: string | null;
    email?: string | null;
    role?: UserRole;
  } | null;
};

export function UserNav({ user }: UserNavProps) {
  if (!user) {
    return (
      <>
        <Link href="/auth/login" className="text-gray-600 hover:text-orange-600">
          Sign In
        </Link>
        <Link href="/auth/register" className="text-orange-600 font-medium hover:underline">
          Register
        </Link>
      </>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <span className="text-gray-600">Hi, {user.name?.split(' ')[0] || 'User'}</span>
      {user.role === 'SELLER' && (
        <Link href="/seller" className="text-orange-600 hover:underline font-medium">
          Seller Dashboard
        </Link>
      )}
      <button 
        onClick={() => signOut({ callbackUrl: '/' })}
        className="text-gray-600 hover:text-orange-600 cursor-pointer"
      >
        Sign Out
      </button>
    </div>
  );
}
