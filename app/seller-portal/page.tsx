import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getSellerByUserId } from '@/lib/db';
import { getMainSiteUrl } from '@/lib/utils';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  Factory, TrendingUp, Shield, Users, ChevronRight, 
  DollarSign, Package, BarChart3, Globe, CheckCircle2, Ship, Calculator
} from 'lucide-react';

// Ensure this page is always dynamic (not cached)
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Manufacturer Portal | Supply Me',
  description: 'List your factory on Supply Me and connect with importers worldwide'
};

export default async function SellerPortalPage() {
  const session = await auth();

  // If user is logged in, check if they already have a seller profile
  let existingSeller = null;
  if (session?.user?.id) {
    existingSeller = await getSellerByUserId(session.user.id);
    // If they have a seller profile, redirect to dashboard
    if (existingSeller) {
      redirect('/seller');
    }
  }

  const features = [
    { icon: Globe, title: 'Global Reach', description: 'Connect with importers from 150+ countries' },
    { icon: Calculator, title: 'Tariff Integration', description: 'Show import duties to buyers' },
    { icon: Ship, title: 'Shipping Partners', description: 'Integrated logistics quotes' },
    { icon: BarChart3, title: 'Analytics Dashboard', description: 'Track inquiries and performance' },
    { icon: Shield, title: 'Verified Badge', description: 'Build trust with verification' },
    { icon: Users, title: 'Direct Communication', description: 'Chat directly with buyers' },
  ];

  const steps = [
    { number: '1', title: 'Create Account', description: 'Sign up with your business email' },
    { number: '2', title: 'Add Factory Details', description: 'List your products, certifications, and capacity' },
    { number: '3', title: 'Get Verified', description: 'Our team verifies your factory credentials' },
    { number: '4', title: 'Start Exporting', description: 'Receive inquiries from global importers' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg flex items-center justify-center">
                <Factory className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold text-gray-900">Manufacturer Portal</span>
                <span className="text-xs text-gray-500 block">by Supply Me</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <a href={getMainSiteUrl()} className="text-gray-600 hover:text-orange-600 text-sm">
                ← Back to Platform
              </a>
              {session?.user ? (
                <div className="flex items-center gap-3">
                  <span className="text-gray-600 text-sm">Hi, {session.user.name?.split(' ')[0]}</span>
                  <Link href="/auth/logout">
                    <Button variant="outline" size="sm">Sign Out</Button>
                  </Link>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/auth/login">
                    <Button variant="outline" size="sm">Sign In</Button>
                  </Link>
                  <Link href="/auth/seller-register">
                    <Button size="sm" className="bg-gradient-to-r from-orange-500 to-amber-500">
                      Get Started
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            List Your Factory on{' '}
            <span className="bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
              Supply Me
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Connect with importers worldwide. Showcase your manufacturing capabilities, receive direct inquiries, and grow your export business.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {session?.user ? (
              <Link href="/seller/become">
                <Button size="lg" className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 font-semibold text-lg px-8">
                  <Factory className="w-5 h-5 mr-2" />
                  Set Up Your Store
                </Button>
              </Link>
            ) : (
              <Link href="/auth/seller-register">
                <Button size="lg" className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 font-semibold text-lg px-8">
                  <Factory className="w-5 h-5 mr-2" />
                  Register Your Factory
                </Button>
              </Link>
            )}
            <Link href="#how-it-works">
              <Button size="lg" variant="outline" className="font-semibold text-lg px-8">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Why List on Supply Me?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="p-6 rounded-2xl bg-gray-50 hover:bg-orange-50 transition-colors">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            How It Works
          </h2>
          <div className="space-y-6">
            {steps.map((step, index) => (
              <div key={index} className="flex items-start gap-6 p-6 bg-white rounded-2xl shadow-sm">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-xl">{step.number}</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">{step.title}</h3>
                  <p className="text-gray-600">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <ChevronRight className="w-6 h-6 text-gray-300 hidden lg:block ml-auto" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-orange-500 to-amber-500">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Expand Your Export Business?
          </h2>
          <p className="text-orange-100 mb-8 text-lg">
            Join Supply Me today and connect with importers worldwide
          </p>
          <Link href="/auth/seller-register">
            <Button size="lg" className="bg-white text-orange-600 hover:bg-orange-50 font-semibold text-lg px-8">
              List Your Factory Now
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg flex items-center justify-center">
              <Factory className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white">Manufacturer Portal</span>
          </div>
          <p className="text-sm mb-4">Part of the Supply Me Platform</p>
          <div className="flex justify-center gap-6 text-sm">
            <a href={getMainSiteUrl()} className="hover:text-white">Platform</a>
            <Link href="/terms" className="hover:text-white">Terms</Link>
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/contact" className="hover:text-white">Contact</Link>
          </div>
          <p className="text-xs mt-8">© 2026 Supply Me. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
