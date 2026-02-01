import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getSellerBySubdomain, getActiveProductsBySellerId, getStoreCustomization } from '@/lib/db';
import { getSellerPortalUrl } from '@/lib/utils';
import { 
  ShoppingBag, Search, Filter, Grid, List, ChevronDown, Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SessionProvider } from 'next-auth/react';
import { StoreOwnerCheck } from '@/components/store-owner-check';
import { 
  StoreCustomization,
  mergeWithDefaults, 
  generateCSSVariables, 
  generateGoogleFontsUrl,
} from '@/lib/store-customization-types';

const sellerPortalUrl = getSellerPortalUrl();

export async function generateMetadata({
  params
}: {
  params: Promise<{ subdomain: string }>;
}): Promise<Metadata> {
  const { subdomain } = await params;
  const seller = await getSellerBySubdomain(subdomain);
  
  if (!seller) {
    return { title: 'Products' };
  }

  return {
    title: `All Products | ${seller.businessName}`,
    description: `Browse all products from ${seller.businessName}`,
  };
}

export default async function ProductsPage({
  params,
  searchParams: searchParamsPromise
}: {
  params: Promise<{ subdomain: string }>;
  searchParams: Promise<{ category?: string; sort?: string; search?: string }>;
}) {
  const { subdomain } = await params;
  const searchParams = await searchParamsPromise;
  const seller = await getSellerBySubdomain(subdomain);

  if (!seller || seller.status !== 'approved') {
    notFound();
  }

  const products = await getActiveProductsBySellerId(seller.id);
  
  // Fetch store customization
  const rawCustomization = await getStoreCustomization(seller.id);
  const customization = mergeWithDefaults(rawCustomization as Partial<StoreCustomization> | null);
  
  // Generate CSS variables and font URL
  const cssVariables = generateCSSVariables(customization);
  const googleFontsUrl = generateGoogleFontsUrl(customization);
  
  // Get visible navigation items
  const visibleNavItems = customization.navigation.filter(item => item.visible);

  // Filter and sort products
  let filteredProducts = [...products];
  
  // Search filter
  if (searchParams.search) {
    const searchLower = searchParams.search.toLowerCase();
    filteredProducts = filteredProducts.filter(p => 
      p.name.toLowerCase().includes(searchLower) ||
      p.description?.toLowerCase().includes(searchLower)
    );
  }

  // Sort
  switch (searchParams.sort) {
    case 'price-low':
      filteredProducts.sort((a, b) => (a.minPrice || 0) - (b.minPrice || 0));
      break;
    case 'price-high':
      filteredProducts.sort((a, b) => (b.minPrice || 0) - (a.minPrice || 0));
      break;
    case 'newest':
      filteredProducts.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      break;
    case 'name':
      filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
      break;
  }

  return (
    <SessionProvider>
      <div className="min-h-screen" style={{ backgroundColor: customization.colors.background }}>
        {/* Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href={googleFontsUrl} rel="stylesheet" />
        
        {/* Custom CSS Variables */}
        <style>{cssVariables}</style>
        <style>{`
          .store-primary-bg { background-color: var(--store-primary); }
          .store-primary-text { color: var(--store-primary); }
          .store-gradient { background: linear-gradient(to right, var(--store-primary), var(--store-accent)); }
          .store-heading-font { font-family: var(--store-heading-font); }
          .store-body-font { font-family: var(--store-body-font); }
          .store-text { color: var(--store-text); }
          .store-text-muted { color: var(--store-text-muted); }
          .store-border { border-color: var(--store-border); }
          body { font-family: var(--store-body-font); }
          h1, h2, h3, h4, h5, h6 { font-family: var(--store-heading-font); }
        `}</style>

        {/* Store Owner Toolbar */}
        <StoreOwnerCheck
          sellerUserId={seller.userId}
          sellerId={seller.id}
          sellerSubdomain={seller.subdomain}
          sellerPortalUrl={sellerPortalUrl}
        />

        {/* Header */}
        <header 
          className="border-b sticky top-0 z-40"
          style={{ backgroundColor: customization.colors.headerBackground }}
        >
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              {seller.logo ? (
                <img src={seller.logo} alt={seller.businessName} className="w-10 h-10 rounded-lg object-cover" />
              ) : (
                <div className="w-10 h-10 store-gradient rounded-lg flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-white" />
                </div>
              )}
              <span className="text-lg font-bold store-heading-font" style={{ color: customization.colors.text }}>
                {seller.businessName}
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-6 text-sm">
              {visibleNavItems.map((item) => (
                <Link 
                  key={item.id} 
                  href={item.href} 
                  className={item.href === '/products' ? 'store-primary-text font-medium' : 'opacity-70 hover:opacity-100'}
                  style={{ color: item.href === '/products' ? customization.colors.primary : customization.colors.text }}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="flex items-center gap-3">
              <Link href="/cart">
                <Button className="store-gradient text-white">
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  Cart
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Breadcrumb */}
        <div className="max-w-7xl mx-auto px-4 py-4">
          <nav className="flex items-center gap-2 text-sm store-text-muted">
            <Link href="/" className="hover:underline">Home</Link>
            <span>/</span>
            <span className="store-text font-medium">All Products</span>
          </nav>
        </div>

        {/* Page Header */}
        <div className="max-w-7xl mx-auto px-4 pb-6">
          <h1 className="text-3xl font-bold store-heading-font store-text">All Products</h1>
          <p className="store-text-muted mt-2">
            Showing {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Filters & Search */}
        <div className="max-w-7xl mx-auto px-4 pb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <form className="relative flex-1 max-w-md">
              <input
                type="text"
                name="search"
                defaultValue={searchParams.search}
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
                style={{ borderColor: customization.colors.border }}
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </form>

            {/* Sort */}
            <div className="flex items-center gap-4">
              <select
                name="sort"
                defaultValue={searchParams.sort || ''}
                className="px-4 py-2 border rounded-lg text-sm"
                style={{ borderColor: customization.colors.border }}
                onChange={(e) => {
                  const url = new URL(window.location.href);
                  if (e.target.value) {
                    url.searchParams.set('sort', e.target.value);
                  } else {
                    url.searchParams.delete('sort');
                  }
                  window.location.href = url.toString();
                }}
              >
                <option value="">Sort by</option>
                <option value="newest">Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name">Name A-Z</option>
              </select>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        <div className="max-w-7xl mx-auto px-4 pb-12">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium store-text">No products found</p>
              <p className="store-text-muted mt-1">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div 
              className="grid gap-6"
              style={{ 
                gridTemplateColumns: `repeat(${customization.productGrid.columns}, minmax(0, 1fr))` 
              }}
            >
              {filteredProducts.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  className="group bg-white rounded-lg border overflow-hidden hover:shadow-lg transition-all"
                  style={{ borderColor: customization.colors.border }}
                >
                  {/* Product Image */}
                  <div className="aspect-square bg-gray-100 relative overflow-hidden">
                    {product.images?.[0]?.url ? (
                      <img
                        src={product.images[0].url}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="w-12 h-12 text-gray-300" />
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    <h3 className="font-semibold store-text group-hover:text-primary transition-colors line-clamp-2">
                      {product.name}
                    </h3>
                    
                    {customization.productGrid.showPrice && product.minPrice && (
                      <p className="mt-2 text-lg font-bold store-primary-text">
                        ${product.minPrice.toFixed(2)}
                        {product.priceUnit && (
                          <span className="text-sm font-normal store-text-muted">/{product.priceUnit}</span>
                        )}
                      </p>
                    )}

                    {customization.productGrid.showMoq && product.moq && (
                      <p className="text-sm store-text-muted mt-1">
                        MOQ: {product.moq} units
                      </p>
                    )}

                    {customization.productGrid.showRating && product.rating && (
                      <div className="flex items-center gap-1 mt-2">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                        <span className="text-sm">{product.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer 
          className="py-8 px-4"
          style={{ backgroundColor: customization.colors.footerBackground }}
        >
          <div className="max-w-7xl mx-auto text-center">
            <p className="text-white/70 text-sm">
              © {new Date().getFullYear()} {seller.businessName}. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </SessionProvider>
  );
}
