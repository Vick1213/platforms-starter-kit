import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getSellerByUserId } from '@/lib/db';
import { UserRole } from '@/lib/auth-config';
import { SellerDashboard } from './dashboard';

// Ensure this page is always dynamic (not cached)
export const dynamic = 'force-dynamic';

export default async function SellerPage() {
  const session = await auth();

  // Redirect to login if not authenticated
  if (!session?.user) {
    redirect('/auth/login?callbackUrl=/seller');
  }

  // Get seller data
  const seller = await getSellerByUserId(session.user.id);

  // If user doesn't have a seller profile, redirect to become seller page
  if (!seller) {
    redirect('/seller/become');
  }

  return <SellerDashboard seller={seller} user={session.user} />;
}
