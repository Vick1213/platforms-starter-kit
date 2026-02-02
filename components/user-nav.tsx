'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Store, LogOut, ChevronDown, User, ShieldCheck, MessageCircle } from 'lucide-react';
import type { UserRole } from '@/lib/auth-config';
import { getSellerPortalUrl, getMainSiteUrl } from '@/lib/utils';

type UserNavProps = {
  user: {
    name?: string | null;
    email?: string | null;
    role?: UserRole;
  } | null;
};

export function UserNav({ user }: UserNavProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch unread message count
  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      // Poll for updates every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchUnreadCount = async () => {
    try {
      const res = await fetch('/api/chat?role=buyer');
      if (res.ok) {
        const data = await res.json();
        setUnreadMessages(data.unreadCount || 0);
      }
    } catch (error) {
      // Silently fail - user might not have chat access
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFullSignOut = async () => {
    setShowDropdown(false);
    // Redirect to dedicated logout page which handles cross-subdomain cookie clearing
    window.location.href = '/auth/logout';
  };

  const handleSignOutToMain = () => {
    setShowDropdown(false);
    // Just redirect to main site, stay logged in
    window.location.href = getMainSiteUrl();
  };

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

  const isSeller = user.role === 'SELLER';
  const isAdmin = user.role === 'ADMIN';

  return (
    <div className="flex items-center gap-4">
      <span className="text-gray-600">Hi, {user.name?.split(' ')[0] || 'User'}</span>
      
      {/* Messages Link */}
      <Link 
        href="/messages" 
        className="text-gray-600 hover:text-orange-600 flex items-center gap-1 relative"
      >
        <MessageCircle className="w-4 h-4" />
        <span className="hidden md:inline">Messages</span>
        {unreadMessages > 0 && (
          <span className="absolute -top-1 -right-1 md:-top-1 md:-right-2 w-4 h-4 bg-orange-500 text-white text-[10px] rounded-full flex items-center justify-center">
            {unreadMessages > 9 ? '9+' : unreadMessages}
          </span>
        )}
      </Link>

      {isSeller && (
        <a href={getSellerPortalUrl()} className="text-orange-600 hover:underline font-medium flex items-center gap-1">
          <Store className="w-4 h-4" />
          My Store
        </a>
      )}
      
      {/* Sign Out Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button 
          onClick={() => {
            // For regular users, sign out directly without dropdown
            if (!isSeller && !isAdmin) {
              handleFullSignOut();
            } else {
              setShowDropdown(!showDropdown);
            }
          }}
          className="text-gray-600 hover:text-orange-600 cursor-pointer flex items-center gap-1"
        >
          Sign Out
          {(isSeller || isAdmin) && <ChevronDown className="w-3 h-3" />}
        </button>
        
        {showDropdown && (isSeller || isAdmin) && (
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border py-1 z-50">
            <div className="px-3 py-2 border-b">
              <p className="text-xs text-gray-500">Signed in as</p>
              <p className="text-sm font-medium text-gray-900 truncate">{user.email}</p>
              <p className="text-xs text-orange-600 flex items-center gap-1 mt-1">
                {isAdmin && <><ShieldCheck className="w-3 h-3" /> Admin</>}
                {isSeller && !isAdmin && <><Store className="w-3 h-3" /> Seller</>}
              </p>
            </div>
            
            {isSeller && (
              <button
                onClick={handleSignOutToMain}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                Exit Seller Portal
                <span className="text-xs text-gray-400 ml-auto">Stay signed in</span>
              </button>
            )}
            
            {isAdmin && (
              <button
                onClick={handleSignOutToMain}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                Exit Admin Panel
                <span className="text-xs text-gray-400 ml-auto">Stay signed in</span>
              </button>
            )}
            
            <div className="border-t mt-1 pt-1">
              <button
                onClick={handleFullSignOut}
                className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out Completely
              </button>
            </div>
          </div>
        )}
        
        {/* Simple sign out for regular users */}
        {showDropdown && !isSeller && !isAdmin && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border py-1 z-50">
            <button
              onClick={handleFullSignOut}
              className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
