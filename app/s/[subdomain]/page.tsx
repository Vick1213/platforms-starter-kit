import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getSellerBySubdomain } from '@/lib/db';
import { redis } from '@/lib/redis';
import { protocol, rootDomain, buildSubdomainUrl } from '@/lib/utils';
import { StoreOwnerCheck } from '@/components/store-owner-check';
import { SessionProvider } from 'next-auth/react';

// Store customization interface
interface StoreCustomization {
  primaryColor: string;
  accentColor: string;
  headerStyle: 'minimal' | 'standard' | 'bold';
  showBanner: boolean;
  bannerText: string;
  socialLinks: {
    website: string;
    facebook: string;
    instagram: string;
    linkedin: string;
    whatsapp: string;
  };
  contactInfo: {
    email: string;
    phone: string;
    address: string;
  };
  aboutUs: string;
  policies: {
    shipping: string;
    returns: string;
    privacy: string;
  };
}

const defaultCustomization: StoreCustomization = {
  primaryColor: '#0ea5e9',
  accentColor: '#f97316',
  headerStyle: 'standard',
  showBanner: false,
  bannerText: '',
  socialLinks: {
    website: '',
    facebook: '',
    instagram: '',
    linkedin: '',
    whatsapp: '',
  },
  contactInfo: {
    email: '',
    phone: '',
    address: '',
  },
  aboutUs: '',
  policies: {
    shipping: '',
    returns: '',
    privacy: '',
  },
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

  return {
    title: `${seller.businessName} | Supply Me`,
    description: seller.description || `Visit ${seller.businessName}'s store on Supply Me`
  };
}

export default async function SubdomainPage({
  params
}: {
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;
  const seller = await getSellerBySubdomain(subdomain);

  if (!seller) {
    notFound();
  }

  // Get customization
  const customization = await redis.get<StoreCustomization>(`seller:customization:${seller.id}`) || defaultCustomization;

  // Build seller portal URL for owner toolbar
  const sellerPortalUrl = buildSubdomainUrl('seller');

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

        {/* Announcement Banner */}
        {customization.showBanner && customization.bannerText && (
          <div 
            className="text-white text-center py-2 px-4 text-sm"
            style={{ backgroundColor: customization.accentColor }}
          >
            {customization.bannerText}
          </div>
        )}

      {/* Header */}
      <header 
        className={`bg-white shadow-sm ${
          customization.headerStyle === 'bold' ? 'py-6' : 
          customization.headerStyle === 'minimal' ? 'py-2' : 'py-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {seller.logo ? (
                <img 
                  src={seller.logo} 
                  alt={seller.businessName}
                  className={`rounded-lg object-cover ${
                    customization.headerStyle === 'bold' ? 'h-16 w-16' : 
                    customization.headerStyle === 'minimal' ? 'h-8 w-8' : 'h-12 w-12'
                  }`}
                />
              ) : (
                <div 
                  className={`rounded-lg flex items-center justify-center text-white font-bold ${
                    customization.headerStyle === 'bold' ? 'h-16 w-16 text-2xl' : 
                    customization.headerStyle === 'minimal' ? 'h-8 w-8 text-sm' : 'h-12 w-12 text-lg'
                  }`}
                  style={{ backgroundColor: customization.primaryColor }}
                >
                  {seller.businessName.charAt(0)}
                </div>
              )}
              <div>
                <h1 
                  className={`font-bold ${
                    customization.headerStyle === 'bold' ? 'text-3xl' : 
                    customization.headerStyle === 'minimal' ? 'text-lg' : 'text-xl'
                  }`}
                  style={{ color: customization.primaryColor }}
                >
                  {seller.businessName}
                </h1>
                {seller.verified && (
                  <span className="inline-flex items-center gap-1 text-green-600 text-sm">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Verified Seller
                  </span>
                )}
              </div>
            </div>
            <Link
              href={`${protocol}://${rootDomain}`}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              ← Back to Supply Me
            </Link>
          </div>
        </div>
      </header>

      {/* Banner Image */}
      {seller.banner && (
        <div className="w-full h-48 md:h-64 overflow-hidden">
          <img 
            src={seller.banner} 
            alt="Store banner"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* About Section */}
        {(seller.description || customization.aboutUs) && (
          <section className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 
              className="text-xl font-semibold mb-4"
              style={{ color: customization.primaryColor }}
            >
              About Us
            </h2>
            <p className="text-gray-600 whitespace-pre-line">
              {customization.aboutUs || seller.description}
            </p>
          </section>
        )}

        {/* Contact & Social Links */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Contact Info */}
          {(customization.contactInfo.email || customization.contactInfo.phone || customization.contactInfo.address || seller.businessEmail || seller.businessPhone) && (
            <section className="bg-white rounded-lg shadow-sm p-6">
              <h2 
                className="text-xl font-semibold mb-4"
                style={{ color: customization.primaryColor }}
              >
                Contact Us
              </h2>
              <div className="space-y-3">
                {(customization.contactInfo.email || seller.businessEmail) && (
                  <div className="flex items-center gap-3">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <a 
                      href={`mailto:${customization.contactInfo.email || seller.businessEmail}`}
                      className="text-gray-600 hover:underline"
                    >
                      {customization.contactInfo.email || seller.businessEmail}
                    </a>
                  </div>
                )}
                {(customization.contactInfo.phone || seller.businessPhone) && (
                  <div className="flex items-center gap-3">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <a 
                      href={`tel:${customization.contactInfo.phone || seller.businessPhone}`}
                      className="text-gray-600 hover:underline"
                    >
                      {customization.contactInfo.phone || seller.businessPhone}
                    </a>
                  </div>
                )}
                {customization.contactInfo.address && (
                  <div className="flex items-start gap-3">
                    <svg className="h-5 w-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-gray-600">{customization.contactInfo.address}</span>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Social Links */}
          {(customization.socialLinks.website || customization.socialLinks.facebook || customization.socialLinks.instagram || customization.socialLinks.linkedin || customization.socialLinks.whatsapp) && (
            <section className="bg-white rounded-lg shadow-sm p-6">
              <h2 
                className="text-xl font-semibold mb-4"
                style={{ color: customization.primaryColor }}
              >
                Connect With Us
              </h2>
              <div className="flex flex-wrap gap-3">
                {customization.socialLinks.website && (
                  <a 
                    href={customization.socialLinks.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                    Website
                  </a>
                )}
                {customization.socialLinks.whatsapp && (
                  <a 
                    href={`https://wa.me/${customization.socialLinks.whatsapp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    WhatsApp
                  </a>
                )}
                {customization.socialLinks.facebook && (
                  <a 
                    href={customization.socialLinks.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    Facebook
                  </a>
                )}
                {customization.socialLinks.instagram && (
                  <a 
                    href={customization.socialLinks.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-pink-100 text-pink-700 hover:bg-pink-200 transition-colors"
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                    Instagram
                  </a>
                )}
                {customization.socialLinks.linkedin && (
                  <a 
                    href={customization.socialLinks.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                    LinkedIn
                  </a>
                )}
              </div>
            </section>
          )}
        </div>

        {/* Products Section - Placeholder */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 
            className="text-xl font-semibold mb-4"
            style={{ color: customization.primaryColor }}
          >
            Our Products
          </h2>
          <div className="text-center py-12 text-gray-500">
            <svg className="h-16 w-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <p>Products coming soon</p>
          </div>
        </section>

        {/* Policies Section */}
        {(customization.policies.shipping || customization.policies.returns || customization.policies.privacy) && (
          <section className="bg-white rounded-lg shadow-sm p-6">
            <h2 
              className="text-xl font-semibold mb-4"
              style={{ color: customization.primaryColor }}
            >
              Store Policies
            </h2>
            <div className="space-y-6">
              {customization.policies.shipping && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Shipping Policy</h3>
                  <p className="text-gray-600 whitespace-pre-line">{customization.policies.shipping}</p>
                </div>
              )}
              {customization.policies.returns && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Returns & Refunds</h3>
                  <p className="text-gray-600 whitespace-pre-line">{customization.policies.returns}</p>
                </div>
              )}
              {customization.policies.privacy && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Privacy Policy</h3>
                  <p className="text-gray-600 whitespace-pre-line">{customization.policies.privacy}</p>
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} {seller.businessName}. All rights reserved.
            </p>
            <p className="text-sm text-gray-400">
              Powered by{' '}
              <Link 
                href={`${protocol}://${rootDomain}`}
                className="hover:underline"
                style={{ color: customization.primaryColor }}
              >
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
