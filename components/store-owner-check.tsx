'use client';

import { useSession } from 'next-auth/react';
import { StoreOwnerToolbar } from './store-owner-toolbar';

interface StoreOwnerCheckProps {
  sellerUserId: string;
  sellerId: string;
  sellerSubdomain: string;
  sellerPortalUrl: string;
}

export function StoreOwnerCheck({ 
  sellerUserId,
  sellerId, 
  sellerSubdomain,
  sellerPortalUrl 
}: StoreOwnerCheckProps) {
  const { data: session } = useSession();
  
  // Only show toolbar if the logged-in user owns this store
  const isOwner = session?.user?.id === sellerUserId;
  
  if (!isOwner) {
    return null;
  }

  return (
    <StoreOwnerToolbar
      sellerId={sellerId}
      sellerSubdomain={sellerSubdomain}
      sellerPortalUrl={sellerPortalUrl}
    />
  );
}
