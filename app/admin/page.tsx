import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getAllSellers, getAllUsers } from '@/lib/db';
import { getAllSubdomains } from '@/lib/subdomains';
import { UserRole, ADMIN_SUBDOMAIN } from '@/lib/auth-config';
import { protocol, rootDomain } from '@/lib/utils';
import type { Metadata } from 'next';
import { AdminDashboard } from './dashboard';

export const metadata: Metadata = {
  title: `Admin Dashboard | ${rootDomain}`,
  description: `Manage ${rootDomain} platform`
};

export default async function AdminPage() {
  const session = await auth();

  // Redirect to login if not authenticated
  if (!session?.user) {
    redirect(`/auth/login?callbackUrl=${protocol}://${ADMIN_SUBDOMAIN}.${rootDomain}/admin`);
  }

  // Check if user has admin role
  if (session.user.role !== UserRole.ADMIN) {
    redirect('/');
  }

  // Fetch data
  const [tenants, sellers, users] = await Promise.all([
    getAllSubdomains(),
    getAllSellers(),
    getAllUsers(),
  ]);

  return (
    <AdminDashboard 
      tenants={tenants} 
      sellers={sellers} 
      users={users}
      currentUser={session.user}
    />
  );
}
