import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getSellerBySubdomain } from '@/lib/db';
import { protocol, rootDomain, getMainSiteUrl, getSellerPortalUrl } from '@/lib/utils';
import { ShoppingBag, Star, Shield, Truck, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StoreOwnerCheck } from '@/components/store-owner-check';
import { SessionProvider } from 'next-auth/react';

// Get URLs at build time for static generation
const mainSiteUrl = getMainSiteUrl();
const sellerPortalUrl = getSellerPortalUrl();

export async function generateMetadata({
  params
}: {
  params: Promise<{ subdomain: string }>;
}): Promise<Metadata> {
  const { subdomain } = await params;
  const seller = await getSellerBySubdomain(subdomain);

  if (!seller) {
    return {
      title: rootDomain
    };
  }

  return {
    title: `${seller.businessName} | ${rootDomain}`,
    description: seller.description || `Shop at ${seller.businessName} on ${rootDomain}`
  };
}

export default async function StorePage({
  params
}: {
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;
  const seller = await getSellerBySubdomain(subdomain);

  // Show "store not found" page for non-existent or unapproved stores
  if (!seller || seller.status !== 'approved') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex flex-col">
        <header className="w-full py-4 px-6 border-b bg-white/80 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto">
            <Link href={mainSiteUrl} className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                Supply Me
              </span>
            </Link>
          </div>
        </header>
        
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="w-12 h-12 text-orange-500" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Store Not Found
            </h1>
            <p className="text-gray-600 mb-2">
              The store <span className="font-semibold text-orange-600">&quot;{subdomain}&quot;</span> doesn&apos;t exist or is not yet available.
            </p>
            <p className="text-gray-500 text-sm mb-8">
              {!seller 
                ? "This subdomain hasn't been registered yet." 
                : "This store is pending approval from our team."}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href={mainSiteUrl}>
                <Button className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-8">
                  Visit Supply Me
                </Button>
              </Link>
              <Link href={`${sellerPortalUrl}/auth/seller-register`}>
                <Button variant="outline" className="px-8">
                  Register This Store
                </Button>
              </Link>
            </div>
          </div>
        </main>
        
        <footer className="py-4 px-6 border-t bg-white/80 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto text-center text-sm text-gray-500">
            © 2026 Supply Me. All rights reserved.
          </div>
        </footer>
      </div>
    );
  }

  return (
    <SessionProvider>
      <div className="min-h-screen bg-gray-50 pb-16">
        {/* Store Owner Toolbar - only shows if logged-in user owns this store */}
        <StoreOwnerCheck
          sellerUserId={seller.userId}
          sellerId={seller.id}
          sellerSubdomain={seller.subdomain}
          sellerPortalUrl={sellerPortalUrl}
        />

        {/* Store Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          {/* Top Bar */}
          <div className="flex items-center justify-between py-2 text-sm border-b">
            <div className="flex items-center gap-4 text-gray-600">
              <span className="flex items-center gap-1">
                <Truck className="w-4 h-4" />
                Free shipping on orders over $50
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/auth/login" className="text-gray-600 hover:text-orange-600">
                Sign In
              </Link>
              <Link href="/auth/register" className="text-gray-600 hover:text-orange-600">
                Register
              </Link>
            </div>
          </div>
          
          {/* Main Header */}
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              {seller.logo ? (
                <img src={seller.logo} alt={seller.businessName} className="w-12 h-12 rounded-lg object-cover" />
              ) : (
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6 text-white" />
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold text-gray-900">{seller.businessName}</h1>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  {seller.verified && (
                    <span className="flex items-center gap-1 text-green-600">
                      <Shield className="w-4 h-4" />
                      Verified Seller
                    </span>
                  )}
                  {seller.rating > 0 && (
                    <span className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      {seller.rating.toFixed(1)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-xl mx-8">
              <div className="relative">
                <input
                  type="text"
                  placeholder={`Search in ${seller.businessName}...`}
                  className="w-full px-4 py-2 pl-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Cart */}
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm">
                <MessageCircle className="w-4 h-4 mr-2" />
                Contact
              </Button>
              <Button className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600">
                <ShoppingBag className="w-4 h-4 mr-2" />
                Cart (0)
              </Button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex items-center gap-6 py-3 text-sm">
            <Link href="/" className="text-orange-600 font-medium">Home</Link>
            <Link href="/products" className="text-gray-600 hover:text-orange-600">All Products</Link>
            <Link href="/categories" className="text-gray-600 hover:text-orange-600">Categories</Link>
            <Link href="/about" className="text-gray-600 hover:text-orange-600">About Us</Link>
          </nav>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="relative bg-gradient-to-r from-orange-500 to-amber-500">
        {seller.banner ? (
          <img src={seller.banner} alt="Store Banner" className="w-full h-64 object-cover" />
        ) : (
          <div className="h-64 flex items-center justify-center">
            <div className="text-center text-white">
              <h2 className="text-4xl font-bold mb-4">Welcome to {seller.businessName}</h2>
              <p className="text-lg text-orange-100 max-w-2xl">
                {seller.description || 'Discover amazing products at great prices'}
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Store Info Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-xl p-6 shadow-sm border flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
              <Truck className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Fast Shipping</h3>
              <p className="text-sm text-gray-500">Quick delivery to your door</p>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <Shield className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Secure Payment</h3>
              <p className="text-sm text-gray-500">Your payment is protected</p>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">24/7 Support</h3>
              <p className="text-sm text-gray-500">We're here to help</p>
            </div>
          </div>
        </div>

        {/* Products Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Featured Products</h2>
            <Link href="/products" className="text-orange-600 hover:underline text-sm font-medium">
              View all →
            </Link>
          </div>
          
          {/* Empty State */}
          <div className="bg-white rounded-xl p-12 text-center border">
            <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No products yet</h3>
            <p className="text-gray-500 mb-6">This store is setting up their inventory. Check back soon!</p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg flex items-center justify-center">
                <ShoppingBag className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-gray-900">{seller.businessName}</span>
            </div>
            <p className="text-sm text-gray-500">
              Powered by{' '}
              <Link href={`${protocol}://${rootDomain}`} className="text-orange-600 hover:underline">
                Supply Me
              </Link>
            </p>
          </div>
        </div>
      </footer>
    </div>
    </SessionProvider>
  );
}
