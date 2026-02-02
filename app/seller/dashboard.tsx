'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ShoppingBag, Package, TrendingUp, DollarSign, Users, Settings, 
  LogOut, Store, Plus, BarChart3, ShoppingCart, Clock, CheckCircle2,
  AlertCircle, ExternalLink, Menu, X, MessageCircle
} from 'lucide-react';
import { buildSubdomainUrl, rootDomain, isVercelPreview } from '@/lib/utils';
import type { Seller } from '@/lib/types';
import type { UserRole } from '@/lib/auth-config';

type SellerDashboardProps = {
  seller: Seller;
  user: {
    id: string;
    email: string;
    name: string | null;
    image: string | null;
    role: UserRole;
  };
  productCount?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  products?: any[];
};

export function SellerDashboard({ seller, user, productCount = 0, products = [] }: SellerDashboardProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSignOutOptions, setShowSignOutOptions] = useState(false);

  const handleFullSignOut = async () => {
    // Redirect to dedicated logout page which handles cross-subdomain cookie clearing
    window.location.href = '/auth/logout';
  };

  const handleExitToMain = () => {
    window.location.href = process.env.NODE_ENV === 'production' 
      ? 'https://supplyme.asia' 
      : 'http://localhost:3000';
  };

  const stats = [
    { label: 'Total Sales', value: `$${seller.totalSales.toLocaleString()}`, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Products', value: productCount.toString(), icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Orders', value: '0', icon: ShoppingCart, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Customers', value: '0', icon: Users, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  const storeUrl = buildSubdomainUrl(seller.subdomain);
  // Display format for UI - use --- for Vercel preview, . for custom domains
  const displayDomain = isVercelPreview 
    ? `${seller.subdomain}---${rootDomain}` 
    : `${seller.subdomain}.${rootDomain}`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-gray-900">Seller Portal</span>
        </div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`
          fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r transform transition-transform duration-200
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="p-6 border-b hidden lg:block">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6 text-white" />
                </div>
                <div>
                  <span className="font-bold text-gray-900 block">Manufacturer Portal</span>
                  <span className="text-xs text-gray-500">Supply Me</span>
                </div>
              </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1">
              <Link 
                href="/seller" 
                className="flex items-center gap-3 px-3 py-2 rounded-lg bg-orange-50 text-orange-600 font-medium"
              >
                <BarChart3 className="w-5 h-5" />
                Dashboard
              </Link>
              <Link 
                href="/seller/products" 
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50"
              >
                <Package className="w-5 h-5" />
                Products
              </Link>
              <Link 
                href="/seller/orders" 
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50"
              >
                <ShoppingCart className="w-5 h-5" />
                Orders
              </Link>
              <Link 
                href="/seller/customers" 
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50"
              >
                <Users className="w-5 h-5" />
                Customers
              </Link>
              <Link 
                href="/seller/analytics" 
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50"
              >
                <TrendingUp className="w-5 h-5" />
                Analytics
              </Link>
              <Link 
                href="/seller/messages" 
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50"
              >
                <MessageCircle className="w-5 h-5" />
                Messages
              </Link>
              <Link 
                href="/seller/settings" 
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50"
              >
                <Settings className="w-5 h-5" />
                Settings
              </Link>
            </nav>

            {/* Store Link */}
            <div className="p-4 border-t">
              <a 
                href={storeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 text-gray-700 hover:bg-gray-100"
              >
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4" />
                  <span className="text-sm">View Store</span>
                </div>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            {/* User Section */}
            <div className="p-4 border-t">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-semibold">
                  {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{user.name || 'Seller'}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
              </div>
              
              {/* Sign Out Options */}
              <div className="space-y-1">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  onClick={handleExitToMain}
                >
                  <Store className="w-4 h-4 mr-2" />
                  Exit to Main Site
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={handleFullSignOut}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out Completely
                </Button>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
              Welcome back, {user.name?.split(' ')[0] || 'Seller'}!
            </h1>
            <p className="text-gray-600 mt-1">
              Here's what's happening with your store today.
            </p>
          </div>

          {/* Store Status */}
          {seller.status === 'pending' && (
            <Card className="mb-6 border-amber-200 bg-amber-50">
              <CardContent className="flex items-center gap-4 py-4">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-amber-800">Store Under Review</h3>
                  <p className="text-sm text-amber-700">
                    Your seller account is pending approval. You can still set up your products.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {seller.status === 'approved' && (
            <Card className="mb-6 border-green-200 bg-green-50">
              <CardContent className="flex items-center gap-4 py-4">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-green-800">Store Approved!</h3>
                  <p className="text-sm text-green-700">
                    Your store is live at{' '}
                    <a href={storeUrl} target="_blank" className="underline font-medium">
                      {displayDomain}
                    </a>
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {seller.status === 'suspended' && (
            <Card className="mb-6 border-red-200 bg-red-50">
              <CardContent className="flex items-center gap-4 py-4">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-red-800">Store Suspended</h3>
                  <p className="text-sm text-red-700">
                    Your store has been suspended. Please contact support for assistance.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, index) => (
              <Card key={index}>
                <CardContent className="p-4 lg:p-6">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center`}>
                      <stat.icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                      <p className="text-sm text-gray-500">{stat.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tasks to manage your store</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                <Link href="/seller/products/new">
                  <Button className="w-full h-auto py-4 flex flex-col items-center gap-2 bg-gradient-to-br from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600">
                    <Plus className="w-5 h-5" />
                    <span>Add Product</span>
                  </Button>
                </Link>
                <Link href="/seller/orders">
                  <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center gap-2">
                    <ShoppingCart className="w-5 h-5" />
                    <span>View Orders</span>
                  </Button>
                </Link>
                <Link href="/seller/settings">
                  <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center gap-2">
                    <Store className="w-5 h-5" />
                    <span>Customize Store</span>
                  </Button>
                </Link>
                <Link href="/seller/analytics">
                  <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    <span>View Analytics</span>
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Store Information</CardTitle>
                <CardDescription>Your store details at a glance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-600">Business Name</span>
                  <span className="font-medium">{seller.businessName}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-600">Store URL</span>
                  <a href={storeUrl} target="_blank" className="font-medium text-orange-600 hover:underline">
                    {displayDomain}
                  </a>
                </div>
                {seller.customDomain && (
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-gray-600">Custom Domain</span>
                    <span className="font-medium">{seller.customDomain}</span>
                  </div>
                )}
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-600">Status</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    seller.status === 'approved' ? 'bg-green-100 text-green-700' :
                    seller.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {seller.status.charAt(0).toUpperCase() + seller.status.slice(1)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Rating</span>
                  <span className="font-medium">{seller.rating > 0 ? `${seller.rating}/5` : 'No ratings yet'}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
