import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getSellerBySubdomain, getStoreCustomization } from '@/lib/db';
import { getProductBySlug } from '@/lib/product-db';
import { protocol, rootDomain, getSellerPortalUrl } from '@/lib/utils';
import { 
  ShoppingBag, Star, Shield, Truck, MessageCircle, ChevronLeft,
  Package, Share2, Heart, Clock, CheckCircle, AlertCircle, Send
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
import { ProductEnquiryClient } from './product-enquiry-client';
import { ProductReviewsClient } from './product-reviews-client';

const sellerPortalUrl = getSellerPortalUrl();

export async function generateMetadata({
  params
}: {
  params: Promise<{ subdomain: string; slug: string }>;
}): Promise<Metadata> {
  const { subdomain, slug } = await params;
  const seller = await getSellerBySubdomain(subdomain);
  
  if (!seller) {
    return { title: rootDomain };
  }

  const product = await getProductBySlug(slug);
  
  if (!product || product.company?.seller?.id !== seller.id) {
    return { title: `Product Not Found | ${seller.businessName}` };
  }

  return {
    title: `${product.name} | ${seller.businessName}`,
    description: product.description || `View ${product.name} at ${seller.businessName}`,
  };
}

export default async function ProductPage({
  params
}: {
  params: Promise<{ subdomain: string; slug: string }>;
}) {
  const { subdomain, slug } = await params;
  const seller = await getSellerBySubdomain(subdomain);

  if (!seller || seller.status !== 'approved') {
    notFound();
  }

  const product = await getProductBySlug(slug);
  
  if (!product || product.company?.seller?.id !== seller.id) {
    notFound();
  }

  // Fetch store customization
  const rawCustomization = await getStoreCustomization(seller.id);
  const customization = mergeWithDefaults(rawCustomization as Partial<StoreCustomization> | null);
  
  // Generate CSS variables and font URL
  const cssVariables = generateCSSVariables(customization);
  const googleFontsUrl = generateGoogleFontsUrl(customization);

  const primaryImage = product.images?.[0]?.url;
  const otherImages = product.images?.slice(1) || [];

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
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm">
                <MessageCircle className="w-4 h-4 mr-2" />
                Contact
              </Button>
              <Button className="store-gradient text-white">
                <ShoppingBag className="w-4 h-4 mr-2" />
                Cart
              </Button>
            </div>
          </div>
        </header>

        {/* Breadcrumb */}
        <div className="max-w-7xl mx-auto px-4 py-4">
          <nav className="flex items-center gap-2 text-sm store-text-muted">
            <Link href="/" className="hover:underline">Home</Link>
            <span>/</span>
            <Link href="/products" className="hover:underline">Products</Link>
            <span>/</span>
            <span className="store-text font-medium">{product.name}</span>
          </nav>
        </div>

        {/* Product Details */}
        <main className="max-w-7xl mx-auto px-4 pb-12">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Product Images */}
            <div>
              <div 
                className="aspect-square rounded-2xl overflow-hidden bg-gray-100 mb-4"
                style={{ borderColor: customization.colors.border }}
              >
                {primaryImage ? (
                  <img
                    src={primaryImage}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-24 h-24" style={{ color: customization.colors.border }} />
                  </div>
                )}
              </div>
              {otherImages.length > 0 && (
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {otherImages.map((img: { id: string; url: string }, i: number) => (
                    <button
                      key={img.id || i}
                      className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 hover:border-orange-500 transition-colors"
                      style={{ borderColor: customization.colors.border }}
                    >
                      <img src={img.url} alt={`${product.name} ${i + 2}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold store-heading-font store-text mb-2">
                    {product.name}
                  </h1>
                  <div className="flex items-center gap-4 text-sm store-text-muted">
                    {product.categoryId && (
                      <span className="px-2 py-1 rounded-full" style={{ backgroundColor: customization.colors.primary + '15', color: customization.colors.primary }}>
                        {product.categoryId}
                      </span>
                    )}
                    {seller.verified && (
                      <span className="flex items-center gap-1 text-green-600">
                        <Shield className="w-4 h-4" />
                        Verified Seller
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 rounded-full border hover:bg-gray-50" style={{ borderColor: customization.colors.border }}>
                    <Heart className="w-5 h-5" style={{ color: customization.colors.textMuted }} />
                  </button>
                  <button className="p-2 rounded-full border hover:bg-gray-50" style={{ borderColor: customization.colors.border }}>
                    <Share2 className="w-5 h-5" style={{ color: customization.colors.textMuted }} />
                  </button>
                </div>
              </div>

              {/* Price */}
              <div className="mb-6 p-4 rounded-xl" style={{ backgroundColor: customization.colors.primary + '10' }}>
                <p className="text-3xl font-bold" style={{ color: customization.colors.primary }}>
                  {product.minPrice != null && product.maxPrice != null
                    ? (product.minPrice === product.maxPrice 
                        ? `$${product.minPrice.toFixed(2)}`
                        : `$${product.minPrice.toFixed(2)} - $${product.maxPrice.toFixed(2)}`)
                    : product.minPrice != null
                        ? `$${product.minPrice.toFixed(2)}`
                        : 'Contact for price'
                  }
                </p>
                {product.moq && product.moq > 1 && (
                  <p className="text-sm store-text-muted mt-1">
                    Minimum Order Quantity: <strong>{product.moq} units</strong>
                  </p>
                )}
              </div>

              {/* Description */}
              {product.description && (
                <div className="mb-6">
                  <h3 className="font-semibold store-text mb-2">Description</h3>
                  <p className="store-text-muted whitespace-pre-wrap">{product.description}</p>
                </div>
              )}

              {/* Trust Signals */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="flex items-center gap-2 p-3 rounded-lg border" style={{ borderColor: customization.colors.border }}>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-sm store-text">Quality Assured</span>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg border" style={{ borderColor: customization.colors.border }}>
                  <Truck className="w-5 h-5" style={{ color: customization.colors.primary }} />
                  <span className="text-sm store-text">Worldwide Shipping</span>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg border" style={{ borderColor: customization.colors.border }}>
                  <Shield className="w-5 h-5" style={{ color: customization.colors.primary }} />
                  <span className="text-sm store-text">Secure Payment</span>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg border" style={{ borderColor: customization.colors.border }}>
                  <Clock className="w-5 h-5" style={{ color: customization.colors.primary }} />
                  <span className="text-sm store-text">Fast Response</span>
                </div>
              </div>

              {/* CTA Section - Contact Seller */}
              <div className="space-y-3">
                <ProductEnquiryClient 
                  productId={product.id}
                  productName={product.name}
                  productImage={primaryImage}
                  sellerId={seller.id}
                  sellerName={seller.businessName}
                />
              </div>
            </div>
          </div>

          {/* Reviews Section */}
          <ProductReviewsClient 
            productId={product.id}
            productName={product.name}
            sellerId={seller.id}
          />
        </main>

        {/* Footer */}
        <footer 
          className="border-t py-8"
          style={{ backgroundColor: customization.colors.footerBackground, color: customization.colors.text }}
        >
          <div className="max-w-7xl mx-auto px-4 text-center text-sm opacity-80">
            © {new Date().getFullYear()} {seller.businessName}. All rights reserved.
          </div>
        </footer>
      </div>
    </SessionProvider>
  );
}
