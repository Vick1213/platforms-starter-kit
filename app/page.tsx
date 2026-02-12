import Link from 'next/link';
import { auth } from '@/auth';
import { getAllSellers } from '@/lib/db';
import { rootDomain, buildSubdomainUrl, isVercelPreview, getSellerPortalUrl } from '@/lib/utils';
import { 
  ShoppingBag, Search, User, ShoppingCart, ChevronRight, 
  Store, TrendingUp, Shield, Truck, Star, ArrowRight,
  Factory, Globe, Ship, Package, Calculator, MapPin, MessageCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserNav } from '@/components/user-nav';

// Ensure this page is always dynamic (not cached)
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const session = await auth();
  const sellers = await getAllSellers();
  const approvedSellers = sellers.filter(s => s.status === 'approved');

  const categories = [
    { name: 'Electronics', slug: 'electronics', icon: Factory, color: 'from-blue-500 to-cyan-500' },
    { name: 'Textiles', slug: 'textiles', icon: Package, color: 'from-pink-500 to-rose-500' },
    { name: 'Machinery', slug: 'machinery', icon: Factory, color: 'from-green-500 to-emerald-500' },
    { name: 'Raw Materials', slug: 'raw-materials', icon: Package, color: 'from-purple-500 to-violet-500' },
    { name: 'Consumer Goods', slug: 'consumer-goods', icon: ShoppingBag, color: 'from-amber-500 to-orange-500' },
  ];

  const features = [
    { icon: Factory, title: 'Verified Manufacturers', description: 'Direct from Asian factories' },
    { icon: Calculator, title: 'Tariff Calculator', description: 'Check import duties instantly' },
    { icon: Ship, title: 'Shipping Quotes', description: 'Compare transport costs' },
    { icon: Globe, title: 'Supply Chain Tools', description: 'End-to-end management' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          {/* Top Bar */}
          <div className="flex items-center justify-between py-2 text-sm border-b">
            <div className="flex items-center gap-6 text-gray-600">
              <a href={getSellerPortalUrl()} className="hover:text-orange-600 flex items-center gap-1">
                <Store className="w-4 h-4" />
                List Your Factory
              </a>
              <span className="hidden md:inline">For Importers</span>
            </div>
            <div className="flex items-center gap-4">
              <UserNav user={session?.user ? {
                name: session.user.name,
                email: session.user.email,
                role: session.user.role
              } : null} />
            </div>
          </div>
          
          {/* Main Header */}
          <div className="flex items-center justify-between py-4 gap-8">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg flex items-center justify-center">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent hidden sm:block">
                Supply Me
              </span>
            </Link>

            {/* Search Bar */}
            <div className="flex-1 max-w-2xl">
              <div className="relative flex items-stretch">
                <input
                  type="text"
                  placeholder="Search manufacturers, products, or categories..."
                  className="w-full px-4 py-3 pl-12 border-2 border-gray-200 rounded-l-lg focus:outline-none focus:border-orange-500 text-sm"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Button className="rounded-l-none rounded-r-lg bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 px-6 h-auto">
                  Search
                </Button>
              </div>
            </div>

            {/* Right Icons */}
            <div className="flex items-center gap-4">
              {session && (
                <Link href="/messages" className="flex flex-col items-center text-gray-600 hover:text-orange-600 relative">
                  <MessageCircle className="w-6 h-6" />
                  <span className="text-xs mt-1 hidden md:block">Messages</span>
                </Link>
              )}
              <Link href={session ? '/account' : '/auth/login'} className="flex flex-col items-center text-gray-600 hover:text-orange-600">
                <User className="w-6 h-6" />
                <span className="text-xs mt-1 hidden md:block">Account</span>
              </Link>
              <Link href="/cart" className="flex flex-col items-center text-gray-600 hover:text-orange-600 relative">
                <ShoppingCart className="w-6 h-6" />
                <span className="text-xs mt-1 hidden md:block">Cart</span>
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center">
                  0
                </span>
              </Link>
            </div>
          </div>

          {/* Categories Nav */}
          <nav className="flex items-center gap-8 py-3 overflow-x-auto">
            {categories.map((cat) => (
              <Link 
                key={cat.slug} 
                href={`/category/${cat.slug}`}
                className="flex items-center gap-2 text-gray-600 hover:text-orange-600 whitespace-nowrap text-sm font-medium"
              >
                <cat.icon className="w-4 h-4" />
                {cat.name}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-400 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-24 relative">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
              Connect with Asian Manufacturers & Streamline Your Imports
            </h1>
            <p className="text-lg text-orange-100 mb-8">
              Discover verified manufacturers across Asia. Check tariffs, compare shipping rates, and manage your entire supply chain from one platform.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/auth/register">
                <Button size="lg" className="bg-white text-orange-600 hover:bg-orange-50 font-semibold shadow-lg">
                  Start Sourcing
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/auth/seller-register">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 font-semibold">
                  List Your Factory
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Bar */}
      <section className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">{feature.title}</h3>
                  <p className="text-xs text-gray-500">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Browse by Industry</h2>
          <Link href="/categories" className="text-orange-600 hover:underline text-sm font-medium flex items-center gap-1">
            View All <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {categories.map((cat) => (
            <Link 
              key={cat.slug}
              href={`/category/${cat.slug}`}
              className="group"
            >
              <div className={`bg-gradient-to-br ${cat.color} rounded-2xl p-6 text-center transition-transform group-hover:scale-105`}>
                <cat.icon className="w-10 h-10 text-white mx-auto mb-3" />
                <h3 className="font-semibold text-white">{cat.name}</h3>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Sellers */}
      <section className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Featured Manufacturers</h2>
              <p className="text-gray-600 mt-1">Verified factories and suppliers across Asia</p>
            </div>
            <Link href="/stores" className="text-orange-600 hover:underline text-sm font-medium flex items-center gap-1">
              View All Suppliers <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          
          {approvedSellers.length === 0 ? (
            <div className="bg-gray-50 rounded-2xl p-12 text-center">
              <Factory className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No manufacturers listed yet</h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                Be the first to list your factory on Supply Me. Reach importers worldwide looking for reliable suppliers.
              </p>
              <Link href="/auth/seller-register">
                <Button className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600">
                  List Your Factory
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {approvedSellers.slice(0, 8).map((seller) => (
                <Link 
                  key={seller.id}
                  href={buildSubdomainUrl(seller.subdomain)}
                  className="group"
                >
                  <div className="bg-gray-50 rounded-2xl p-6 transition-all group-hover:shadow-lg group-hover:bg-white border border-transparent group-hover:border-orange-100">
                    <div className="flex items-center gap-4 mb-4">
                      {seller.logo ? (
                        <img src={seller.logo} alt={seller.businessName} className="w-14 h-14 rounded-xl object-cover" />
                      ) : (
                        <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center">
                          <Store className="w-7 h-7 text-white" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate group-hover:text-orange-600">
                          {seller.businessName}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          {seller.verified && (
                            <span className="flex items-center gap-1 text-green-600">
                              <Shield className="w-3 h-3" />
                              Verified
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {seller.description && (
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                        {seller.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">
                        {isVercelPreview ? `${seller.subdomain}---${rootDomain}` : `${seller.subdomain}.${rootDomain}`}
                      </span>
                      <span className="text-orange-600 font-medium group-hover:underline">
                        Visit Store →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-gray-900 to-gray-800 py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to List Your Factory?
          </h2>
          <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
            Join thousands of manufacturers on Supply Me. Connect with importers worldwide, showcase your products, and grow your export business.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href={getSellerPortalUrl()}>
              <Button size="lg" className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 font-semibold">
                <Factory className="w-5 h-5 mr-2" />
                List Your Factory
              </Button>
            </a>
            <Link href="/how-it-works">
              <Button size="lg" variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg flex items-center justify-center">
                  <Globe className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-gray-900">Supply Me</span>
              </div>
              <p className="text-sm text-gray-500">
                Your B2B platform to connect with Asian manufacturers, check tariffs, and manage your supply chain.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">For Importers</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="/manufacturers" className="hover:text-orange-600">Find Manufacturers</Link></li>
                <li><Link href="/tariffs" className="hover:text-orange-600">Tariff Calculator</Link></li>
                <li><Link href="/shipping" className="hover:text-orange-600">Shipping Quotes</Link></li>
                <li><Link href="/supply-chain" className="hover:text-orange-600">Supply Chain Tools</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">For Manufacturers</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href={getSellerPortalUrl()} className="hover:text-orange-600">List Your Factory</a></li>
                <li><a href={`${getSellerPortalUrl()}/how-it-works`} className="hover:text-orange-600">How It Works</a></li>
                <li><a href={`${getSellerPortalUrl()}/pricing`} className="hover:text-orange-600">Pricing</a></li>
                <li><a href={`${getSellerPortalUrl()}/success-stories`} className="hover:text-orange-600">Success Stories</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="/help" className="hover:text-orange-600">Help Center</Link></li>
                <li><Link href="/contact" className="hover:text-orange-600">Contact Us</Link></li>
                <li><Link href="/privacy" className="hover:text-orange-600">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-orange-600">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-gray-500">
            © 2026 Supply Me. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
