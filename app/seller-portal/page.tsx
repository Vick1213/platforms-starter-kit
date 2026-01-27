import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getSellerByUserId } from '@/lib/db';
import { UserRole } from '@/lib/auth-config';
import { getMainSiteUrl } from '@/lib/utils';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  Store, TrendingUp, Shield, Users, ChevronRight, 
  DollarSign, Package, BarChart3, Globe, CheckCircle2 
} from 'lucide-react';

export const metadata = {
  title: 'Seller Portal | SupplyMe',
  description: 'Register and manage your store on SupplyMe marketplace'
};

export default async function SellerPortalPage() {
  const session = await auth();

  // If user is logged in and is a seller, redirect to dashboard
  if (session?.user) {
    if (session.user.role === UserRole.SELLER) {
      const seller = await getSellerByUserId(session.user.id);
      if (seller) {
        redirect('/seller');
      }
    }
  }

  const features = [
    { icon: Globe, title: 'Your Own Subdomain', description: 'Get yourstore.supplyme.asia instantly' },
    { icon: DollarSign, title: 'Low Fees', description: 'Competitive commission rates' },
    { icon: Package, title: 'Easy Inventory', description: 'Simple product management' },
    { icon: BarChart3, title: 'Analytics', description: 'Track your performance' },
    { icon: Shield, title: 'Secure Payments', description: 'Safe and reliable transactions' },
    { icon: Users, title: 'Large Audience', description: 'Reach millions of customers' },
  ];

  const steps = [
    { number: '1', title: 'Create Account', description: 'Sign up with your email or Google account' },
    { number: '2', title: 'Set Up Store', description: 'Add your business details and choose a subdomain' },
    { number: '3', title: 'Get Approved', description: 'Our team reviews your application' },
    { number: '4', title: 'Start Selling', description: 'Add products and start making sales' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg flex items-center justify-center">
                <Store className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold text-gray-900">Seller Portal</span>
                <span className="text-xs text-gray-500 block">by SupplyMe</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <a href={getMainSiteUrl()} className="text-gray-600 hover:text-orange-600 text-sm">
                ← Back to Marketplace
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
            Start Selling on{' '}
            <span className="bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
              SupplyMe
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of successful sellers. Get your own branded store, reach millions of customers, and grow your business.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {session?.user ? (
              <Link href="/auth/seller-register">
                <Button size="lg" className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 font-semibold text-lg px-8">
                  <Store className="w-5 h-5 mr-2" />
                  Complete Registration
                </Button>
              </Link>
            ) : (
              <Link href="/auth/seller-register">
                <Button size="lg" className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 font-semibold text-lg px-8">
                  <Store className="w-5 h-5 mr-2" />
                  Create Seller Account
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
            Why Sell on SupplyMe?
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
            Ready to Start Selling?
          </h2>
          <p className="text-orange-100 mb-8 text-lg">
            Join our marketplace today and reach customers worldwide
          </p>
          <Link href="/auth/seller-register">
            <Button size="lg" className="bg-white text-orange-600 hover:bg-orange-50 font-semibold text-lg px-8">
              Create Your Store Now
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg flex items-center justify-center">
              <Store className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white">Seller Portal</span>
          </div>
          <p className="text-sm mb-4">Part of the SupplyMe Marketplace</p>
          <div className="flex justify-center gap-6 text-sm">
            <a href={getMainSiteUrl()} className="hover:text-white">Marketplace</a>
            <Link href="/terms" className="hover:text-white">Terms</Link>
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/contact" className="hover:text-white">Contact</Link>
          </div>
          <p className="text-xs mt-8">© 2026 SupplyMe. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
