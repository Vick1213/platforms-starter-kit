'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn, useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Loader2, Mail, Lock, Eye, EyeOff, User, ShoppingBag, Building2, Phone, Globe, 
  CheckCircle2, Store, TrendingUp, Shield 
} from 'lucide-react';
import { rootDomain } from '@/lib/utils';

export default function SellerRegisterPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // If user is already signed in, redirect to become seller page
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      router.push('/seller/become');
    }
  }, [status, session, router]);

  const [step, setStep] = useState<'account' | 'business'>('account');
  const [formData, setFormData] = useState({
    // Account details
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    // Business details
    businessName: '',
    businessEmail: '',
    businessPhone: '',
    subdomain: '',
    customDomain: '',
    description: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null);
  const [checkingSubdomain, setCheckingSubdomain] = useState(false);

  // Show loading while checking session
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    );
  }

  // If authenticated, show loading (will redirect)
  if (status === 'authenticated') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-orange-600 mx-auto mb-4" />
          <p className="text-gray-600">Redirecting to store setup...</p>
        </div>
      </div>
    );
  }

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

  const handleAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setStep('business');
  };

  const handleBusinessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/seller/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Registration failed');
        setIsLoading(false);
        return;
      }

      // Auto sign-in after registration
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.ok) {
        router.push('/seller');
        router.refresh();
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const benefits = [
    { icon: Store, title: 'Your Own Storefront', description: 'Get a custom subdomain or connect your existing domain' },
    { icon: TrendingUp, title: 'Reach Millions', description: 'Access our global customer base instantly' },
    { icon: Shield, title: 'Secure Payments', description: 'We handle payments securely, you focus on selling' },
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
          <Link href="/auth/login" className="text-sm text-gray-600 hover:text-orange-600">
            Already a seller? Sign in
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 items-start">
            {/* Benefits Section */}
            <div className="lg:sticky lg:top-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                List your factory on <span className="bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">Supply Me</span>
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                Join thousands of Asian manufacturers connecting with global importers.
              </p>

              <div className="space-y-6">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center flex-shrink-0">
                      <benefit.icon className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{benefit.title}</h3>
                      <p className="text-gray-600 text-sm">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white">
                <h3 className="font-semibold mb-2">Have an existing website?</h3>
                <p className="text-sm text-orange-100">
                  You can connect your custom domain and manage your inventory from our platform. 
                  Perfect for manufacturers with established brands.
                </p>
              </div>
            </div>

            {/* Registration Form */}
            <Card className="shadow-xl border-0 bg-white/90 backdrop-blur">
              <CardHeader className="space-y-1 pb-4">
                <div className="flex items-center gap-4 mb-4">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step === 'account' ? 'bg-orange-500 text-white' : 'bg-green-500 text-white'}`}>
                    {step === 'business' ? <CheckCircle2 className="w-5 h-5" /> : '1'}
                  </div>
                  <div className="flex-1 h-1 bg-gray-200 rounded">
                    <div className={`h-full bg-orange-500 rounded transition-all ${step === 'business' ? 'w-full' : 'w-0'}`} />
                  </div>
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step === 'business' ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                    2
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900">
                  {step === 'account' ? 'Create your account' : 'Business details'}
                </CardTitle>
                <CardDescription className="text-gray-600">
                  {step === 'account' 
                    ? 'Start with your personal information' 
                    : 'Tell us about your business'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Error Message */}
                {error && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                    {error}
                  </div>
                )}

                {step === 'account' ? (
                  /* Account Form */
                  <form onSubmit={handleAccountSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-gray-700">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="name"
                          name="name"
                          type="text"
                          placeholder="John Doe"
                          value={formData.name}
                          onChange={handleChange}
                          className="pl-10 h-12 border-gray-200"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-gray-700">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="name@example.com"
                          value={formData.email}
                          onChange={handleChange}
                          className="pl-10 h-12 border-gray-200"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-gray-700">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="password"
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={formData.password}
                          onChange={handleChange}
                          className="pl-10 pr-10 h-12 border-gray-200"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-gray-700">Confirm Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="confirmPassword"
                          name="confirmPassword"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          className="pl-10 h-12 border-gray-200"
                          required
                        />
                      </div>
                    </div>
                    <Button
                      type="submit"
                      className="w-full h-12 text-base font-semibold bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/25"
                    >
                      Continue to business details
                    </Button>
                  </form>
                ) : (
                  /* Business Form */
                  <form onSubmit={handleBusinessSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="businessName" className="text-gray-700">Business Name</Label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="businessName"
                          name="businessName"
                          type="text"
                          placeholder="Your Company Inc."
                          value={formData.businessName}
                          onChange={handleChange}
                          className="pl-10 h-12 border-gray-200"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="businessEmail" className="text-gray-700">Business Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="businessEmail"
                          name="businessEmail"
                          type="email"
                          placeholder="contact@yourcompany.com"
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
                      <Label htmlFor="subdomain" className="text-gray-700">Store Subdomain</Label>
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
                        Have an existing website? Connect it to manage inventory from here.
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1 h-12"
                        onClick={() => setStep('account')}
                      >
                        Back
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1 h-12 text-base font-semibold bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/25"
                        disabled={isLoading || subdomainAvailable === false}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          'Create seller account'
                        )}
                      </Button>
                    </div>
                  </form>
                )}

                {/* Sign In Link */}
                <p className="text-center text-sm text-gray-600 pt-4">
                  Already have an account?{' '}
                  <Link 
                    href="/auth/login" 
                    className="font-semibold text-orange-600 hover:text-orange-700"
                  >
                    Sign in
                  </Link>
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 px-6 border-t bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto text-center text-sm text-gray-500">
          © 2026 Supply Me. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
