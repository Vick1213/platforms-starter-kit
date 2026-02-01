import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getSellerBySubdomain, getStoreCustomization } from '@/lib/db';
import { getSellerPortalUrl } from '@/lib/utils';
import { 
  ShoppingBag, Mail, Phone, MapPin, Clock, MessageCircle, Send
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
    return { title: 'Contact' };
  }

  return {
    title: `Contact Us | ${seller.businessName}`,
    description: `Get in touch with ${seller.businessName}`,
  };
}

export default async function ContactPage({
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
                  className={item.href === '/contact' ? 'store-primary-text font-medium' : 'opacity-70 hover:opacity-100'}
                  style={{ color: item.href === '/contact' ? customization.colors.primary : customization.colors.text }}
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
            <span className="store-text font-medium">Contact Us</span>
          </nav>
        </div>

        {/* Page Content */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold store-heading-font store-text mb-2">Contact Us</h1>
            <p className="store-text-muted mb-8">
              Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
            </p>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Contact Form */}
              <div className="bg-white p-6 rounded-lg border" style={{ borderColor: customization.colors.border }}>
                <h2 className="text-xl font-semibold store-heading-font mb-4">Send a Message</h2>
                <form className="space-y-4">
                  <div>
                    <Label htmlFor="name">Your Name</Label>
                    <Input id="name" placeholder="John Doe" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" placeholder="john@example.com" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Input id="subject" placeholder="How can we help?" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="message">Message</Label>
                    <textarea
                      id="message"
                      rows={5}
                      placeholder="Your message..."
                      className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2"
                      style={{ borderColor: customization.colors.border }}
                    />
                  </div>
                  <Button className="w-full store-gradient text-white">
                    <Send className="w-4 h-4 mr-2" />
                    Send Message
                  </Button>
                </form>
              </div>

              {/* Contact Info */}
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-lg border" style={{ borderColor: customization.colors.border }}>
                  <h2 className="text-xl font-semibold store-heading-font mb-4">Contact Information</h2>
                  <div className="space-y-4">
                    {customization.contactInfo.email && (
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full store-primary-bg/10 flex items-center justify-center flex-shrink-0">
                          <Mail className="w-5 h-5 store-primary-text" />
                        </div>
                        <div>
                          <p className="font-medium store-text">Email</p>
                          <a 
                            href={`mailto:${customization.contactInfo.email}`}
                            className="text-sm store-text-muted hover:underline"
                          >
                            {customization.contactInfo.email}
                          </a>
                        </div>
                      </div>
                    )}
                    
                    {customization.contactInfo.phone && (
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full store-primary-bg/10 flex items-center justify-center flex-shrink-0">
                          <Phone className="w-5 h-5 store-primary-text" />
                        </div>
                        <div>
                          <p className="font-medium store-text">Phone</p>
                          <a 
                            href={`tel:${customization.contactInfo.phone}`}
                            className="text-sm store-text-muted hover:underline"
                          >
                            {customization.contactInfo.phone}
                          </a>
                        </div>
                      </div>
                    )}
                    
                    {customization.contactInfo.address && (
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full store-primary-bg/10 flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-5 h-5 store-primary-text" />
                        </div>
                        <div>
                          <p className="font-medium store-text">Address</p>
                          <p className="text-sm store-text-muted whitespace-pre-line">
                            {customization.contactInfo.address}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {customization.contactInfo.businessHours && (
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full store-primary-bg/10 flex items-center justify-center flex-shrink-0">
                          <Clock className="w-5 h-5 store-primary-text" />
                        </div>
                        <div>
                          <p className="font-medium store-text">Business Hours</p>
                          <p className="text-sm store-text-muted whitespace-pre-line">
                            {customization.contactInfo.businessHours}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Contact */}
                <div className="bg-white p-6 rounded-lg border" style={{ borderColor: customization.colors.border }}>
                  <h2 className="text-xl font-semibold store-heading-font mb-4">Quick Contact</h2>
                  <p className="text-sm store-text-muted mb-4">
                    Need immediate assistance? Use our chat feature for quick responses.
                  </p>
                  <Button variant="outline" className="w-full">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Start Live Chat
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer 
          className="py-8 px-4 mt-12"
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
