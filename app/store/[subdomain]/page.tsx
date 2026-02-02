import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getSellerBySubdomain, getActiveProductsBySellerId, getStoreCustomization } from '@/lib/db';
import { protocol, rootDomain, getMainSiteUrl, getSellerPortalUrl } from '@/lib/utils';
import { ShoppingBag, Star, Shield, Truck, MessageCircle, Globe, Facebook, Instagram, Linkedin, Twitter, ChevronDown, Menu, X, Play, Mail, Phone, MapPin, Clock, Youtube, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StoreOwnerCheck } from '@/components/store-owner-check';
import { SessionProvider } from 'next-auth/react';
import { 
  StoreCustomization,
  mergeWithDefaults, 
  generateCSSVariables, 
  generateGoogleFontsUrl,
  HomepageSection,
  NavigationItem,
  TrustBadge,
  Testimonial,
  FAQItem
} from '@/lib/store-customization-types';

// Get URLs at build time for static generation
const mainSiteUrl = getMainSiteUrl();
const sellerPortalUrl = getSellerPortalUrl();

// Icon mapping for trust badges
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  truck: Truck,
  shield: Shield,
  'message-circle': MessageCircle,
  star: Star,
  globe: Globe,
};

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

  // Fetch customization to get favicon
  const rawCustomization = await getStoreCustomization(seller.id);
  const customization = mergeWithDefaults(rawCustomization as Partial<StoreCustomization> | null);

  const metadata: Metadata = {
    title: `${seller.businessName} | ${rootDomain}`,
    description: seller.description || `Shop at ${seller.businessName} on ${rootDomain}`,
  };

  // Add favicon if custom one is set
  if (customization.favicon) {
    metadata.icons = {
      icon: customization.favicon,
      shortcut: customization.favicon,
      apple: customization.favicon,
    };
  }

  return metadata;
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

  // Fetch products for the approved seller
  const products = await getActiveProductsBySellerId(seller.id);
  
  // Fetch store customization and merge with defaults
  const rawCustomization = await getStoreCustomization(seller.id);
  const customization = mergeWithDefaults(rawCustomization as Partial<StoreCustomization> | null);
  
  // Generate CSS variables and font URL
  const cssVariables = generateCSSVariables(customization);
  const googleFontsUrl = generateGoogleFontsUrl(customization);
  
  // Get visible navigation items
  const visibleNavItems = customization.navigation.filter(item => item.visible);
  
  // Get enabled sections sorted by order
  const enabledSections = customization.sections
    .filter(section => section.enabled)
    .sort((a, b) => a.order - b.order);
  
  // Hero height mapping
  const heroHeightMap = {
    small: 'h-48 md:h-64',
    medium: 'h-64 md:h-80',
    large: 'h-80 md:h-96',
    full: 'h-screen',
  };
  
  // Font size multiplier
  const fontSizeClass = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg',
  };

  return (
    <SessionProvider>
      <div className="min-h-screen" style={{ backgroundColor: customization.colors.background }}>
        {/* Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href={googleFontsUrl} rel="stylesheet" />
        
        {/* Custom CSS Variables for theming */}
        <style>{cssVariables}</style>
        <style>{`
          .store-primary-bg { background-color: var(--store-primary); }
          .store-primary-text { color: var(--store-primary); }
          .store-secondary-bg { background-color: var(--store-secondary); }
          .store-secondary-text { color: var(--store-secondary); }
          .store-accent-bg { background-color: var(--store-accent); }
          .store-accent-text { color: var(--store-accent); }
          .store-gradient { background: linear-gradient(to right, var(--store-primary), var(--store-accent)); }
          .store-primary-hover:hover { color: var(--store-primary); }
          .store-ring-focus:focus { --tw-ring-color: var(--store-primary); }
          .store-heading-font { font-family: var(--store-heading-font); }
          .store-body-font { font-family: var(--store-body-font); }
          .store-text { color: var(--store-text); }
          .store-text-muted { color: var(--store-text-muted); }
          .store-border { border-color: var(--store-border); }
          body { font-family: var(--store-body-font); font-size: var(--store-base-font-size); }
          h1, h2, h3, h4, h5, h6 { font-family: var(--store-heading-font); }
        `}</style>
        
        {/* Store Owner Toolbar - only shows if logged-in user owns this store */}
        <StoreOwnerCheck
          sellerUserId={seller.userId}
          sellerId={seller.id}
          sellerSubdomain={seller.subdomain}
          sellerPortalUrl={sellerPortalUrl}
        />

        {/* Announcement Bar */}
        {customization.header.announcement.enabled && customization.header.announcement.text && (
          <div 
            className="text-white text-center py-2 text-sm"
            style={{ backgroundColor: customization.header.announcement.backgroundColor || customization.colors.primary }}
          >
            {customization.header.announcement.link ? (
              <a href={customization.header.announcement.link} className="hover:underline">
                {customization.header.announcement.text}
              </a>
            ) : (
              customization.header.announcement.text
            )}
          </div>
        )}

        {/* Store Header */}
        <header 
          className={`border-b ${customization.header.sticky ? 'sticky top-0 z-50' : ''} ${customization.header.transparent ? 'bg-transparent' : ''}`}
          style={{ 
            backgroundColor: customization.header.transparent ? 'transparent' : customization.colors.headerBackground,
            color: customization.colors.headerBackground === '#111827' || customization.colors.headerBackground === '#1f2937' || customization.colors.headerBackground === '#1e40af' ? '#ffffff' : customization.colors.text
          }}
        >
          <div className="max-w-7xl mx-auto px-4">
            {/* Header Style: Standard */}
            {customization.header.style === 'standard' && (
              <>
                {/* Top Bar */}
                <div className="flex items-center justify-between py-2 text-sm border-b store-border opacity-70">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Truck className="w-4 h-4" />
                      Free shipping on orders over $50
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <Link href="/auth/login" className="hover:opacity-80">Sign In</Link>
                    <Link href="/auth/register" className="hover:opacity-80">Register</Link>
                  </div>
                </div>
                
                {/* Main Header */}
                <div className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-4">
                    {seller.logo ? (
                      <img src={seller.logo} alt={seller.businessName} className="w-12 h-12 rounded-lg object-cover" />
                    ) : (
                      <div className="w-12 h-12 store-gradient rounded-lg flex items-center justify-center">
                        <ShoppingBag className="w-6 h-6 text-white" />
                      </div>
                    )}
                    <div>
                      <h1 className="text-xl font-bold store-heading-font">{seller.businessName}</h1>
                      <div className="flex items-center gap-2 text-sm opacity-70">
                        {seller.verified && (
                          <span className="flex items-center gap-1 text-green-600">
                            <Shield className="w-4 h-4" />
                            Verified
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
                  {customization.header.showSearch && (
                    <div className="flex-1 max-w-xl mx-8 hidden md:block">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder={`Search in ${seller.businessName}...`}
                          className="w-full px-4 py-2 pl-10 border rounded-lg focus:outline-none focus:ring-2 store-ring-focus"
                          style={{ borderColor: customization.colors.border }}
                        />
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                    </div>
                  )}

                  {/* Cart & Contact */}
                  <div className="flex items-center gap-4">
                    <Button variant="outline" size="sm">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Contact
                    </Button>
                    {customization.header.showCart && (
                      <Button className="store-gradient text-white">
                        <ShoppingBag className="w-4 h-4 mr-2" />
                        Cart (0)
                      </Button>
                    )}
                  </div>
                </div>

                {/* Navigation */}
                <nav className="flex items-center gap-6 py-3 text-sm">
                  {visibleNavItems.map((item) => (
                    <Link 
                      key={item.id} 
                      href={item.href} 
                      className={item.href === '/' ? 'store-primary-text font-medium' : 'opacity-70 hover:opacity-100'}
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </>
            )}

            {/* Header Style: Minimal */}
            {customization.header.style === 'minimal' && (
              <div className="flex items-center justify-between py-4">
                <div className="flex items-center gap-4">
                  {seller.logo ? (
                    <img src={seller.logo} alt={seller.businessName} className="w-10 h-10 rounded object-cover" />
                  ) : (
                    <span className="text-xl font-bold store-heading-font">{seller.businessName}</span>
                  )}
                </div>
                <nav className="hidden md:flex items-center gap-6 text-sm">
                  {visibleNavItems.map((item) => (
                    <Link key={item.id} href={item.href} className="hover:opacity-80">
                      {item.label}
                    </Link>
                  ))}
                </nav>
                <div className="flex items-center gap-3">
                  {customization.header.showSearch && (
                    <button className="p-2 hover:opacity-80">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </button>
                  )}
                  {customization.header.showCart && (
                    <button className="p-2 hover:opacity-80">
                      <ShoppingBag className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Header Style: Bold */}
            {customization.header.style === 'bold' && (
              <div className="py-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    {seller.logo ? (
                      <img src={seller.logo} alt={seller.businessName} className="w-14 h-14 rounded-lg object-cover" />
                    ) : (
                      <div className="w-14 h-14 store-accent-bg rounded-lg flex items-center justify-center">
                        <ShoppingBag className="w-8 h-8" style={{ color: customization.colors.headerBackground }} />
                      </div>
                    )}
                    <h1 className="text-2xl font-bold store-heading-font">{seller.businessName}</h1>
                  </div>
                  <div className="flex items-center gap-4">
                    {customization.header.showCart && (
                      <Button className="store-accent-bg" style={{ color: customization.colors.secondary }}>
                        <ShoppingBag className="w-4 h-4 mr-2" />
                        Cart (0)
                      </Button>
                    )}
                  </div>
                </div>
                <nav className="flex items-center gap-8 text-sm font-medium">
                  {visibleNavItems.map((item) => (
                    <Link key={item.id} href={item.href} className="hover:opacity-80 uppercase tracking-wide">
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </div>
            )}

            {/* Header Style: Centered */}
            {customization.header.style === 'centered' && (
              <div className="py-6 text-center">
                <div className="flex justify-center mb-4">
                  {seller.logo ? (
                    <img src={seller.logo} alt={seller.businessName} className="w-16 h-16 rounded-full object-cover" />
                  ) : (
                    <div className="w-16 h-16 store-gradient rounded-full flex items-center justify-center">
                      <ShoppingBag className="w-8 h-8 text-white" />
                    </div>
                  )}
                </div>
                <h1 className="text-2xl font-bold store-heading-font mb-2">{seller.businessName}</h1>
                {seller.description && (
                  <p className="text-sm opacity-70 mb-4 max-w-md mx-auto">{seller.description}</p>
                )}
                <nav className="flex items-center justify-center gap-8 text-sm">
                  {visibleNavItems.map((item) => (
                    <Link key={item.id} href={item.href} className="hover:opacity-80">
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </div>
            )}
          </div>
        </header>

      {/* Hero Section */}
      {customization.hero.type !== 'none' && (
        <section 
          className={`relative ${heroHeightMap[customization.hero.height]} overflow-hidden`}
        >
          {/* Background based on type */}
          {customization.hero.type === 'gradient' && (
            <div 
              className="absolute inset-0"
              style={{ 
                background: `linear-gradient(135deg, ${customization.hero.gradientStart || customization.colors.primary}, ${customization.hero.gradientEnd || customization.colors.accent})`
              }}
            />
          )}
          {customization.hero.type === 'image' && (customization.hero.backgroundImage || seller.banner) && (
            <>
              <img 
                src={customization.hero.backgroundImage || seller.banner || ''} 
                alt="Hero" 
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div 
                className="absolute inset-0 bg-black"
                style={{ opacity: customization.hero.overlayOpacity }}
              />
            </>
          )}
          {customization.hero.type === 'video' && customization.hero.backgroundVideo && (
            <>
              <video 
                autoPlay 
                loop 
                muted 
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
              >
                <source src={customization.hero.backgroundVideo} type="video/mp4" />
              </video>
              <div 
                className="absolute inset-0 bg-black"
                style={{ opacity: customization.hero.overlayOpacity }}
              />
            </>
          )}
          
          {/* Hero Content */}
          <div 
            className={`relative h-full flex items-center justify-center px-4 ${
              customization.hero.textAlignment === 'left' ? 'text-left' : 
              customization.hero.textAlignment === 'right' ? 'text-right' : 'text-center'
            }`}
          >
            <div className="max-w-4xl mx-auto text-white">
              <h2 className="text-3xl md:text-5xl font-bold mb-4 store-heading-font">
                {customization.hero.content.title || `Welcome to ${seller.businessName}`}
              </h2>
              <p className="text-lg md:text-xl opacity-90 max-w-2xl mx-auto mb-6">
                {customization.hero.content.subtitle || seller.description || 'Discover amazing products at great prices'}
              </p>
              {customization.hero.content.cta && (
                <Link href={customization.hero.content.cta.link || '/products'}>
                  <Button size="lg" className="store-accent-bg" style={{ color: customization.colors.text }}>
                    {customization.hero.content.cta.text || 'Shop Now'}
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Main Content - Dynamic Sections */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {enabledSections.map((section) => (
          <RenderSection 
            key={section.id} 
            section={section} 
            customization={customization}
            products={products}
            seller={seller}
          />
        ))}
        
        {/* Products Section (always shown if no sections configured) */}
        {enabledSections.length === 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold store-heading-font store-text">Featured Products</h2>
              <Link href="/products" className="store-primary-text hover:underline text-sm font-medium">
                View all →
              </Link>
            </div>
            <ProductGrid products={products} customization={customization} />
          </section>
        )}
      </main>

      {/* Footer */}
      <footer 
        className="border-t mt-12"
        style={{ 
          backgroundColor: customization.colors.footerBackground,
          color: customization.colors.footerBackground === '#1f2937' || customization.colors.footerBackground === '#111827' || customization.colors.footerBackground === '#1e3a5f' ? '#ffffff' : customization.colors.text
        }}
      >
        <div className="max-w-7xl mx-auto px-4 py-12">
          {/* Footer Style: Detailed */}
          {customization.footer.style === 'detailed' && (
            <div className="grid md:grid-cols-4 gap-8 mb-8">
              {/* Store Info */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  {seller.logo ? (
                    <img src={seller.logo} alt={seller.businessName} className="w-10 h-10 rounded-lg object-cover" />
                  ) : (
                    <div className="w-10 h-10 store-gradient rounded-lg flex items-center justify-center">
                      <ShoppingBag className="w-5 h-5 text-white" />
                    </div>
                  )}
                  <span className="font-semibold">{seller.businessName}</span>
                </div>
                <p className="text-sm opacity-80 mb-4">
                  {customization.aboutUs || seller.description || 'Quality products from a trusted supplier.'}
                </p>
                
                {/* Social Links */}
                {customization.footer.showSocialLinks && (
                  <div className="flex items-center gap-3">
                    {customization.socialLinks.website && (
                      <a href={customization.socialLinks.website} target="_blank" rel="noopener noreferrer" className="opacity-60 hover:opacity-100">
                        <Globe className="w-5 h-5" />
                      </a>
                    )}
                    {customization.socialLinks.facebook && (
                      <a href={customization.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="opacity-60 hover:opacity-100">
                        <Facebook className="w-5 h-5" />
                      </a>
                    )}
                    {customization.socialLinks.instagram && (
                      <a href={customization.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="opacity-60 hover:opacity-100">
                        <Instagram className="w-5 h-5" />
                      </a>
                    )}
                    {customization.socialLinks.twitter && (
                      <a href={customization.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="opacity-60 hover:opacity-100">
                        <Twitter className="w-5 h-5" />
                      </a>
                    )}
                    {customization.socialLinks.linkedin && (
                      <a href={customization.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="opacity-60 hover:opacity-100">
                        <Linkedin className="w-5 h-5" />
                      </a>
                    )}
                    {customization.socialLinks.youtube && (
                      <a href={customization.socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="opacity-60 hover:opacity-100">
                        <Youtube className="w-5 h-5" />
                      </a>
                    )}
                  </div>
                )}
              </div>
              
              {/* Quick Links */}
              <div>
                <h4 className="font-semibold mb-4">Quick Links</h4>
                <ul className="space-y-2 text-sm opacity-80">
                  {visibleNavItems.slice(0, 5).map((item) => (
                    <li key={item.id}>
                      <Link href={item.href} className="hover:opacity-100">
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Contact Info */}
              {(customization.contactInfo.email || customization.contactInfo.phone || customization.contactInfo.address) && (
                <div>
                  <h4 className="font-semibold mb-4">Contact Us</h4>
                  <ul className="space-y-3 text-sm opacity-80">
                    {customization.contactInfo.email && (
                      <li className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        <a href={`mailto:${customization.contactInfo.email}`} className="hover:opacity-100">
                          {customization.contactInfo.email}
                        </a>
                      </li>
                    )}
                    {customization.contactInfo.phone && (
                      <li className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        <a href={`tel:${customization.contactInfo.phone}`} className="hover:opacity-100">
                          {customization.contactInfo.phone}
                        </a>
                      </li>
                    )}
                    {customization.contactInfo.address && (
                      <li className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 mt-0.5" />
                        <span>{customization.contactInfo.address}</span>
                      </li>
                    )}
                    {customization.contactInfo.businessHours && (
                      <li className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{customization.contactInfo.businessHours}</span>
                      </li>
                    )}
                  </ul>
                </div>
              )}
              
              {/* Policies */}
              {(customization.policies.shipping || customization.policies.returns || customization.policies.privacy) && (
                <div>
                  <h4 className="font-semibold mb-4">Policies</h4>
                  <ul className="space-y-2 text-sm opacity-80">
                    {customization.policies.shipping && (
                      <li><Link href="/policies/shipping" className="hover:opacity-100">Shipping Policy</Link></li>
                    )}
                    {customization.policies.returns && (
                      <li><Link href="/policies/returns" className="hover:opacity-100">Return Policy</Link></li>
                    )}
                    {customization.policies.privacy && (
                      <li><Link href="/policies/privacy" className="hover:opacity-100">Privacy Policy</Link></li>
                    )}
                    {customization.policies.terms && (
                      <li><Link href="/policies/terms" className="hover:opacity-100">Terms of Service</Link></li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Footer Style: Simple */}
          {customization.footer.style === 'simple' && (
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-4">
              <div className="flex items-center gap-2">
                {seller.logo ? (
                  <img src={seller.logo} alt={seller.businessName} className="w-8 h-8 rounded object-cover" />
                ) : (
                  <ShoppingBag className="w-5 h-5" />
                )}
                <span className="font-semibold">{seller.businessName}</span>
              </div>
              <nav className="flex items-center gap-6 text-sm">
                {visibleNavItems.slice(0, 4).map((item) => (
                  <Link key={item.id} href={item.href} className="opacity-80 hover:opacity-100">
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          )}

          {/* Footer Style: Minimal */}
          {customization.footer.style === 'minimal' && (
            <div className="text-center py-4">
              <p className="text-sm opacity-80">
                © {new Date().getFullYear()} {seller.businessName}
              </p>
            </div>
          )}

          {/* Footer Style: Centered */}
          {customization.footer.style === 'centered' && (
            <div className="text-center py-8">
              <div className="flex justify-center mb-4">
                {seller.logo ? (
                  <img src={seller.logo} alt={seller.businessName} className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 store-gradient rounded-full flex items-center justify-center">
                    <ShoppingBag className="w-6 h-6 text-white" />
                  </div>
                )}
              </div>
              <h4 className="font-semibold mb-2">{seller.businessName}</h4>
              {customization.footer.showSocialLinks && (
                <div className="flex items-center justify-center gap-4 mb-4">
                  {customization.socialLinks.facebook && (
                    <a href={customization.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="opacity-60 hover:opacity-100">
                      <Facebook className="w-5 h-5" />
                    </a>
                  )}
                  {customization.socialLinks.instagram && (
                    <a href={customization.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="opacity-60 hover:opacity-100">
                      <Instagram className="w-5 h-5" />
                    </a>
                  )}
                  {customization.socialLinks.twitter && (
                    <a href={customization.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="opacity-60 hover:opacity-100">
                      <Twitter className="w-5 h-5" />
                    </a>
                  )}
                </div>
              )}
              <nav className="flex items-center justify-center gap-6 text-sm opacity-80">
                {visibleNavItems.slice(0, 4).map((item) => (
                  <Link key={item.id} href={item.href} className="hover:opacity-100">
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          )}
          
          {/* Copyright */}
          {customization.footer.style !== 'minimal' && (
            <div className="border-t border-white/10 pt-8 flex items-center justify-between">
              <p className="text-sm opacity-60">
                {customization.footer.copyrightText || `© ${new Date().getFullYear()} ${seller.businessName}. All rights reserved.`}
              </p>
              <p className="text-sm opacity-60">
                Powered by{' '}
                <Link href={`${protocol}://${rootDomain}`} className="store-primary-text hover:underline">
                  Supply Me
                </Link>
              </p>
            </div>
          )}
        </div>
      </footer>
    </div>
    </SessionProvider>
  );
}

// ============================================
// HELPER COMPONENTS
// ============================================

interface RenderSectionProps {
  section: HomepageSection;
  customization: StoreCustomization;
  products: any[];
  seller: any;
}

function RenderSection({ section, customization, products, seller }: RenderSectionProps) {
  switch (section.type) {
    case 'featured-products':
      return (
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold store-heading-font store-text">
              {section.title || 'Featured Products'}
            </h2>
            <Link href="/products" className="store-primary-text hover:underline text-sm font-medium">
              View all →
            </Link>
          </div>
          <ProductGrid products={products} customization={customization} />
        </section>
      );

    case 'trust-badges':
      return (
        <section className="mb-12">
          <div className="grid md:grid-cols-3 gap-6">
            {customization.trustBadges.map((badge) => {
              const IconComponent = iconMap[badge.icon] || Shield;
              return (
                <div 
                  key={badge.id} 
                  className="rounded-xl p-6 shadow-sm border flex items-center gap-4"
                  style={{ backgroundColor: customization.colors.background, borderColor: customization.colors.border }}
                >
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: customization.colors.primary + '20' }}
                  >
                    <span style={{ color: customization.colors.primary }}>
                      <IconComponent className="w-6 h-6" />
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold store-text">{badge.title}</h3>
                    <p className="text-sm store-text-muted">{badge.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      );

    case 'about-block':
      return (
        <section className="mb-12">
          <div 
            className="rounded-xl p-8 md:p-12"
            style={{ backgroundColor: customization.colors.primary + '10' }}
          >
            <h2 className="text-2xl font-bold store-heading-font store-text mb-4">
              {section.title || 'About Us'}
            </h2>
            <p className="store-text-muted max-w-3xl">
              {customization.aboutUs || seller.description || 'We are committed to providing quality products and excellent customer service.'}
            </p>
          </div>
        </section>
      );

    case 'testimonials':
      if (!customization.testimonials.length) return null;
      return (
        <section className="mb-12">
          <h2 className="text-2xl font-bold store-heading-font store-text mb-6 text-center">
            {section.title || 'What Our Customers Say'}
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {customization.testimonials.slice(0, 3).map((testimonial) => (
              <div 
                key={testimonial.id} 
                className="rounded-xl p-6 shadow-sm border"
                style={{ backgroundColor: customization.colors.background, borderColor: customization.colors.border }}
              >
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`w-4 h-4 ${i < testimonial.rating ? 'text-amber-500 fill-amber-500' : 'text-gray-300'}`} 
                    />
                  ))}
                </div>
                <p className="store-text-muted mb-4">&quot;{testimonial.content}&quot;</p>
                <div className="flex items-center gap-3">
                  {testimonial.avatar ? (
                    <img src={testimonial.avatar} alt={testimonial.name} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-sm font-medium">{testimonial.name.charAt(0)}</span>
                    </div>
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
        </section>
      );

    case 'faq':
      if (!customization.faq.length) return null;
      return (
        <section className="mb-12">
          <h2 className="text-2xl font-bold store-heading-font store-text mb-6 text-center">
            {section.title || 'Frequently Asked Questions'}
          </h2>
          <div className="max-w-3xl mx-auto space-y-4">
            {customization.faq.map((item) => (
              <details 
                key={item.id} 
                className="rounded-lg border overflow-hidden group"
                style={{ borderColor: customization.colors.border }}
              >
                <summary 
                  className="p-4 cursor-pointer font-medium store-text flex items-center justify-between"
                  style={{ backgroundColor: customization.colors.background }}
                >
                  {item.question}
                  <ChevronDown className="w-5 h-5 transition-transform group-open:rotate-180" />
                </summary>
                <div 
                  className="p-4 border-t store-text-muted"
                  style={{ borderColor: customization.colors.border }}
                >
                  {item.answer}
                </div>
              </details>
            ))}
          </div>
        </section>
      );

    case 'newsletter':
      return (
        <section className="mb-12">
          <div 
            className="rounded-xl p-8 md:p-12 text-center"
            style={{ background: `linear-gradient(135deg, ${customization.colors.primary}, ${customization.colors.accent})` }}
          >
            <h2 className="text-2xl font-bold store-heading-font text-white mb-2">
              {section.title || 'Stay Updated'}
            </h2>
            <p className="text-white/80 mb-6 max-w-md mx-auto">
              Subscribe to our newsletter for exclusive deals and updates.
            </p>
            <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-lg focus:outline-none focus:ring-2"
              />
              <Button className="bg-white text-gray-900 hover:bg-gray-100 px-6">
                Subscribe
              </Button>
            </form>
          </div>
        </section>
      );

    case 'cta-banner':
      return (
        <section className="mb-12">
          <div 
            className="rounded-xl p-8 md:p-12 text-center"
            style={{ background: `linear-gradient(135deg, ${customization.colors.secondary}, ${customization.colors.primary})` }}
          >
            <h2 className="text-2xl md:text-3xl font-bold store-heading-font text-white mb-4">
              {section.title || 'Special Offer'}
            </h2>
            <Link href="/products">
              <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100">
                Shop Now
              </Button>
            </Link>
          </div>
        </section>
      );

    default:
      return null;
  }
}

interface ProductGridProps {
  products: any[];
  customization: StoreCustomization;
}

function ProductGrid({ products, customization }: ProductGridProps) {
  const columnsClass = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
    5: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5',
  };

  const aspectRatioClass = {
    square: 'aspect-square',
    portrait: 'aspect-[3/4]',
    landscape: 'aspect-[4/3]',
  };

  if (products.length === 0) {
    return (
      <div 
        className="rounded-xl p-12 text-center border"
        style={{ backgroundColor: customization.colors.background, borderColor: customization.colors.border }}
      >
        <ShoppingBag className="w-16 h-16 mx-auto mb-4" style={{ color: customization.colors.border }} />
        <h3 className="text-xl font-semibold store-text mb-2">No products yet</h3>
        <p className="store-text-muted">This store is setting up their inventory. Check back soon!</p>
      </div>
    );
  }

  return (
    <div className={`grid ${columnsClass[customization.productGrid.columns]} gap-6`}>
      {products.slice(0, customization.productGrid.productsPerPage).map((product: any) => (
        <div
          key={product.id}
          className="rounded-xl overflow-hidden shadow-sm border hover:shadow-md transition-shadow group flex flex-col"
          style={{ backgroundColor: customization.colors.background, borderColor: customization.colors.border }}
        >
          <Link href={`/products/${product.slug}`}>
            <div className={`${aspectRatioClass[customization.productGrid.imageAspectRatio]} relative bg-gray-100`}>
              {product.images && product.images.length > 0 && product.images[0]?.url ? (
                <img
                  src={product.images[0].url}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ShoppingBag className="w-12 h-12" style={{ color: customization.colors.border }} />
                </div>
              )}
              {product.status === 'ACTIVE' && (
                <span 
                  className="absolute top-2 right-2 text-white text-xs px-2 py-1 rounded-full"
                  style={{ backgroundColor: '#22c55e' }}
                >
                  In Stock
                </span>
              )}
            </div>
          </Link>
          <div className="p-4 flex-1 flex flex-col">
            <Link href={`/products/${product.slug}`}>
              <h3 className="font-semibold store-text mb-1 truncate store-primary-hover">
                {product.name}
              </h3>
            </Link>
            {customization.productGrid.showPrice && (
              <p className="store-primary-text font-bold">
                {product.minPrice != null && product.maxPrice != null
                  ? (product.minPrice === product.maxPrice 
                      ? `$${product.minPrice.toFixed(2)}`
                      : `$${product.minPrice.toFixed(2)} - $${product.maxPrice.toFixed(2)}`)
                  : product.minPrice != null
                      ? `$${product.minPrice.toFixed(2)}`
                      : 'Contact for price'
                }
              </p>
            )}
            {customization.productGrid.showMoq && product.moq && product.moq > 1 && (
              <p className="text-xs store-text-muted mt-1">
                MOQ: {product.moq} units
              </p>
            )}
            {customization.productGrid.showRating && product.rating > 0 && (
              <div className="flex items-center gap-1 mt-1">
                <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                <span className="text-xs store-text-muted">{product.rating.toFixed(1)}</span>
              </div>
            )}
            {/* Action Button */}
            <div className="mt-auto pt-3">
              <Link href={`/products/${product.slug}`} className="block">
                <Button 
                  className="w-full store-gradient text-white text-sm"
                  size="sm"
                >
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  View Details
                </Button>
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
