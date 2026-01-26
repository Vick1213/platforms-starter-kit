import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getSellerByUserId } from '@/lib/db';
import { UserRole } from '@/lib/auth-config';
import { SellerDashboard } from './dashboard';

export default async function SellerPage() {
  const session = await auth();

  // Redirect to login if not authenticated
  if (!session?.user) {
    redirect('/auth/login?callbackUrl=/seller');
  }

  // Check if user has seller role
  if (session.user.role !== UserRole.SELLER && session.user.role !== UserRole.ADMIN) {
    redirect('/auth/seller-register');
  }

  // Get seller data
  const seller = await getSellerByUserId(session.user.id);

  if (!seller) {
    redirect('/auth/seller-register');
  }

  return <SellerDashboard seller={seller} user={session.user} />;
}
