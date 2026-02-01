import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getSellerBySubdomain, getStoreCustomization } from '@/lib/db';
import { getSellerPortalUrl } from '@/lib/utils';
import { 
  ShoppingBag, Shield, Users, Award, Star, CheckCircle
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
    return { title: 'About Us' };
  }

  return {
    title: `About Us | ${seller.businessName}`,
    description: `Learn more about ${seller.businessName}`,
  };
}

export default async function AboutPage({
  params
}: {
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;
  const seller = await getSellerBySubdomain(subdomain);

  if (!seller || seller.status !== 'approved') {
    notFound();
  }

  // Fetch store customization
  const rawCustomization = await getStoreCustomization(seller.id);
  const customization = mergeWithDefaults(rawCustomization as Partial<StoreCustomization> | null);
  
  // Generate CSS variables and font URL
  const cssVariables = generateCSSVariables(customization);
  const googleFontsUrl = generateGoogleFontsUrl(customization);
  
  // Get visible navigation items
  const visibleNavItems = customization.navigation.filter(item => item.visible);

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
                  className={item.href === '/about' ? 'store-primary-text font-medium' : 'opacity-70 hover:opacity-100'}
                  style={{ color: item.href === '/about' ? customization.colors.primary : customization.colors.text }}
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

        {/* Hero Section */}
        <div 
          className="py-16 px-4"
          style={{ 
            background: `linear-gradient(135deg, ${customization.colors.primary}20, ${customization.colors.accent}20)` 
          }}
        >
          <div className="max-w-4xl mx-auto text-center">
            {seller.logo && (
              <img 
                src={seller.logo} 
                alt={seller.businessName} 
                className="w-24 h-24 rounded-full mx-auto mb-6 object-cover border-4 border-white shadow-lg"
              />
            )}
            <h1 className="text-4xl font-bold store-heading-font store-text mb-4">
              About {seller.businessName}
            </h1>
            {seller.verified && (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full mb-6">
                <Shield className="w-4 h-4" />
                <span className="text-sm font-medium">Verified Seller</span>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 py-12">
          {/* About Text */}
          {(customization.aboutUs || seller.description) && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold store-heading-font store-text mb-4">Our Story</h2>
              <div className="prose prose-lg max-w-none store-text">
                <p className="whitespace-pre-line">
                  {customization.aboutUs || seller.description}
                </p>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            {seller.rating > 0 && (
              <div className="text-center p-6 bg-white rounded-lg border" style={{ borderColor: customization.colors.border }}>
                <Star className="w-8 h-8 mx-auto mb-2 text-amber-500" />
                <p className="text-3xl font-bold store-text">{seller.rating.toFixed(1)}</p>
                <p className="text-sm store-text-muted">Rating</p>
              </div>
            )}
            <div className="text-center p-6 bg-white rounded-lg border" style={{ borderColor: customization.colors.border }}>
              <Award className="w-8 h-8 mx-auto mb-2 store-primary-text" />
              <p className="text-3xl font-bold store-text">
                {new Date().getFullYear() - (seller.createdAt ? new Date(seller.createdAt).getFullYear() : new Date().getFullYear())}+
              </p>
              <p className="text-sm store-text-muted">Years</p>
            </div>
            <div className="text-center p-6 bg-white rounded-lg border" style={{ borderColor: customization.colors.border }}>
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <p className="text-3xl font-bold store-text">100%</p>
              <p className="text-sm store-text-muted">Authentic</p>
            </div>
          </div>

          {/* Trust Badges */}
          {customization.trustBadges.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold store-heading-font store-text mb-6 text-center">Why Choose Us</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {customization.trustBadges.map((badge) => (
                  <div 
                    key={badge.id}
                    className="p-6 bg-white rounded-lg border text-center"
                    style={{ borderColor: customization.colors.border }}
                  >
                    <div 
                      className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center"
                      style={{ backgroundColor: `${customization.colors.primary}20` }}
                    >
                      {badge.icon === 'truck' && <ShoppingBag className="w-6 h-6 store-primary-text" />}
                      {badge.icon === 'shield' && <Shield className="w-6 h-6 store-primary-text" />}
                      {badge.icon === 'star' && <Star className="w-6 h-6 store-primary-text" />}
                    </div>
                    <h3 className="font-semibold store-text mb-2">{badge.title}</h3>
                    <p className="text-sm store-text-muted">{badge.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Testimonials */}
          {customization.testimonials.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold store-heading-font store-text mb-6 text-center">What Our Customers Say</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {customization.testimonials.map((testimonial) => (
                  <div 
                    key={testimonial.id}
                    className="p-6 bg-white rounded-lg border"
                    style={{ borderColor: customization.colors.border }}
                  >
                    <div className="flex items-center gap-1 mb-3">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i}
                          className={`w-4 h-4 ${i < testimonial.rating ? 'text-amber-500 fill-amber-500' : 'text-gray-300'}`}
                        />
                      ))}
                    </div>
                    <p className="store-text mb-4 italic">"{testimonial.content}"</p>
                    <div className="flex items-center gap-3">
                      {testimonial.avatar && (
                        <img 
                          src={testimonial.avatar} 
                          alt={testimonial.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      )}
                      <div>
                        <p className="font-medium store-text">{testimonial.name}</p>
                        {testimonial.company && (
                          <p className="text-sm store-text-muted">{testimonial.company}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <div 
            className="text-center p-8 rounded-lg"
            style={{ 
              background: `linear-gradient(135deg, ${customization.colors.primary}, ${customization.colors.accent})` 
            }}
          >
            <h2 className="text-2xl font-bold text-white mb-4 store-heading-font">Ready to Shop?</h2>
            <p className="text-white/90 mb-6">Discover our amazing products and great deals</p>
            <Link href="/products">
              <Button size="lg" variant="secondary">
                Browse Products
              </Button>
            </Link>
          </div>
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
