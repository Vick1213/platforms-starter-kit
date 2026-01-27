'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Settings, Eye, EyeOff, ExternalLink, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StoreOwnerToolbarProps {
  sellerId: string;
  sellerSubdomain: string;
  sellerPortalUrl: string;
}

export function StoreOwnerToolbar({ 
  sellerId, 
  sellerSubdomain,
  sellerPortalUrl 
}: StoreOwnerToolbarProps) {
  const [viewMode, setViewMode] = useState<'owner' | 'customer'>('owner');
  const [isMinimized, setIsMinimized] = useState(false);

  if (viewMode === 'customer' && isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-4 right-4 z-50 bg-orange-600 text-white p-3 rounded-full shadow-lg hover:bg-orange-700 transition-colors"
        title="Show owner toolbar"
      >
        <Eye className="h-5 w-5" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 text-white border-t border-gray-700 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium">You&apos;re viewing your store</span>
            </div>
            
            <div className="h-4 w-px bg-gray-600" />
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode(viewMode === 'owner' ? 'customer' : 'owner')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  viewMode === 'customer' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {viewMode === 'customer' ? (
                  <>
                    <Eye className="h-4 w-4" />
                    Viewing as Customer
                  </>
                ) : (
                  <>
                    <EyeOff className="h-4 w-4" />
                    View as Customer
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={`${sellerPortalUrl}/seller/settings`}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg text-sm font-medium transition-colors"
            >
              <Settings className="h-4 w-4" />
              Edit Store
            </a>
            
            <a
              href={`${sellerPortalUrl}/seller`}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              Seller Dashboard
            </a>

            {viewMode === 'customer' && (
              <button
                onClick={() => setIsMinimized(true)}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                title="Minimize toolbar"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
