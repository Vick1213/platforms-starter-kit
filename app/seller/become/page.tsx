'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Loader2, ShoppingBag, Building2, Phone, Globe, 
  CheckCircle2, Store, TrendingUp, Shield, Factory, Mail
} from 'lucide-react';
import { rootDomain } from '@/lib/utils';

export default function BecomeSellerPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [formData, setFormData] = useState({
    businessName: '',
    businessEmail: '',
    businessPhone: '',
    subdomain: '',
    customDomain: '',
    description: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null);
  const [checkingSubdomain, setCheckingSubdomain] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/seller-register');
    }
  }, [status, router]);

  // Pre-fill email from session
  useEffect(() => {
    if (session?.user?.email && !formData.businessEmail) {
      setFormData(prev => ({ ...prev, businessEmail: session.user?.email || '' }));
    }
  }, [session]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError(null);

    // Check subdomain availability
    if (name === 'subdomain' && value.length >= 3) {
      checkSubdomainAvailability(value);
    }
  };

  const checkSubdomainAvailability = async (subdomain: string) => {
    setCheckingSubdomain(true);
    try {
      const response = await fetch(`/api/seller/check-subdomain?subdomain=${subdomain}`);
      const data = await response.json();
      setSubdomainAvailable(data.available);
    } catch {
      setSubdomainAvailable(null);
    } finally {
      setCheckingSubdomain(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/seller/become', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to create seller profile');
        setIsLoading(false);
        return;
      }

      // Redirect to seller dashboard
      router.push('/seller');
      router.refresh();
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    );
  }

  const benefits = [
    { icon: Factory, title: 'Your Own Factory Store', description: 'Get a custom subdomain for your manufacturing business' },
    { icon: TrendingUp, title: 'Reach Global Importers', description: 'Connect with buyers worldwide looking for suppliers' },
    { icon: Shield, title: 'Verified Manufacturer', description: 'Build trust with verification badges' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex flex-col">
      {/* Header */}
      <header className="w-full py-4 px-6 border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
              Supply Me
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              Signed in as {session?.user?.name || session?.user?.email}
            </span>
          </div>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-4xl grid lg:grid-cols-2 gap-8 items-start">
          {/* Benefits Section */}
          <div className="space-y-6 lg:sticky lg:top-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Set Up Your Store
              </h1>
              <p className="text-gray-600">
                You're one step away from listing your products on Supply Me
              </p>
            </div>

            <div className="space-y-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-4 p-4 bg-white rounded-xl shadow-sm">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center flex-shrink-0">
                    <benefit.icon className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{benefit.title}</h3>
                    <p className="text-sm text-gray-500">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form Section */}
          <Card className="shadow-xl border-0 bg-white/90 backdrop-blur">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-2xl font-bold text-gray-900">
                Business Details
              </CardTitle>
              <CardDescription className="text-gray-600">
                Tell us about your manufacturing business
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="businessName" className="text-gray-700">Business Name *</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="businessName"
                      name="businessName"
                      type="text"
                      placeholder="Acme Manufacturing Co."
                      value={formData.businessName}
                      onChange={handleChange}
                      className="pl-10 h-12 border-gray-200"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessEmail" className="text-gray-700">Business Email *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="businessEmail"
                      name="businessEmail"
                      type="email"
                      placeholder="sales@company.com"
                      value={formData.businessEmail}
                      onChange={handleChange}
                      className="pl-10 h-12 border-gray-200"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessPhone" className="text-gray-700">Business Phone (Optional)</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="businessPhone"
                      name="businessPhone"
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                      value={formData.businessPhone}
                      onChange={handleChange}
                      className="pl-10 h-12 border-gray-200"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subdomain" className="text-gray-700">Store Subdomain *</Label>
                  <div className="flex items-center">
                    <div className="relative flex-1">
                      <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="subdomain"
                        name="subdomain"
                        type="text"
                        placeholder="your-store"
                        value={formData.subdomain}
                        onChange={handleChange}
                        className="pl-10 h-12 border-gray-200 rounded-r-none"
                        required
                      />
                    </div>
                    <span className="bg-gray-100 px-3 border border-l-0 border-gray-200 rounded-r-md text-gray-500 h-12 flex items-center text-sm">
                      .{rootDomain}
                    </span>
                  </div>
                  {checkingSubdomain && (
                    <p className="text-sm text-gray-500">Checking availability...</p>
                  )}
                  {!checkingSubdomain && subdomainAvailable === true && (
                    <p className="text-sm text-green-600 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Available!
                    </p>
                  )}
                  {!checkingSubdomain && subdomainAvailable === false && (
                    <p className="text-sm text-red-600">This subdomain is already taken</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customDomain" className="text-gray-700">Custom Domain (Optional)</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="customDomain"
                      name="customDomain"
                      type="text"
                      placeholder="www.yourcompany.com"
                      value={formData.customDomain}
                      onChange={handleChange}
                      className="pl-10 h-12 border-gray-200"
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Connect your existing domain to your store
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-gray-700">Business Description</Label>
                  <textarea
                    id="description"
                    name="description"
                    placeholder="Tell importers about your manufacturing capabilities, products, and expertise..."
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full min-h-[100px] px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-base font-semibold bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/25"
                  disabled={isLoading || subdomainAvailable === false || !formData.subdomain}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Store...
                    </>
                  ) : (
                    'Create My Store'
                  )}
                </Button>

                <p className="text-center text-sm text-gray-500">
                  Your store will be pending approval before going live
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
