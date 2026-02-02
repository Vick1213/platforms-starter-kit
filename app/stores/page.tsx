import Link from 'next/link';
import { auth } from '@/auth';
import { getAllSellers } from '@/lib/db';
import { buildSubdomainUrl, rootDomain, isVercelPreview } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Factory, Shield, Store } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: `All Suppliers | ${rootDomain}`,
  description: `Browse approved supplier stores on ${rootDomain}`,
};

export default async function StoresPage() {
  const session = await auth();
  const sellers = await getAllSellers();
  const approved = sellers.filter(s => s.status === 'approved');

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-8 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-orange-600">Suppliers</p>
            <h1 className="text-3xl font-bold text-gray-900">Browse supplier stores</h1>
            <p className="text-gray-600 mt-2">Verified manufacturers ready to receive inquiries.</p>
          </div>
          <div className="hidden md:flex items-center gap-3">
            {session?.user ? (
              <span className="text-sm text-gray-600">Hi, {session.user.name || session.user.email}</span>
            ) : (
              <Link href="/auth/register" className="text-sm text-orange-600 hover:underline">Sign up</Link>
            )}
            <Link href="/auth/login">
              <Button variant="outline" size="sm">Sign in</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10">
        {approved.length === 0 ? (
          <div className="bg-white border rounded-2xl p-10 text-center">
            <Store className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900">No suppliers yet</h2>
            <p className="text-gray-600 mt-2">Be the first to list your factory and get in front of importers.</p>
            <Link href="/auth/seller-register" className="inline-block mt-6">
              <Button className="bg-gradient-to-r from-orange-500 to-amber-500">List your factory</Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {approved.map((seller) => (
              <Link key={seller.id} href={buildSubdomainUrl(seller.subdomain)} className="group block">
                <div className="p-6 rounded-2xl bg-white border shadow-sm transition-all group-hover:shadow-lg">
                  <div className="flex items-center gap-4 mb-4">
                    {seller.logo ? (
                      <img src={seller.logo} alt={seller.businessName} className="w-12 h-12 rounded-lg object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white font-semibold">
                        {seller.businessName.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate group-hover:text-orange-600">{seller.businessName}</h3>
                      <p className="text-sm text-gray-500 truncate">
                        {isVercelPreview ? `${seller.subdomain}---${rootDomain}` : `${seller.subdomain}.${rootDomain}`}
                      </p>
                    </div>
                  </div>
                  {seller.description && (
                    <p className="text-sm text-gray-600 line-clamp-3 mb-3">{seller.description}</p>
                  )}
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    {seller.verified && (
                      <span className="flex items-center gap-1 text-green-600">
                        <Shield className="w-4 h-4" /> Verified
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Factory className="w-4 h-4" /> Manufacturer
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
