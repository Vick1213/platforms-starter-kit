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
  CheckCircle2, Store, TrendingUp, Shield, MapPin, Factory, Calendar,
  Users, DollarSign, FileText, Award, ChevronRight, ChevronLeft, Package
} from 'lucide-react';
import { rootDomain } from '@/lib/utils';

const BUSINESS_TYPES = [
  { value: 'MANUFACTURER', label: 'Manufacturer', description: 'We produce goods in our own factory' },
  { value: 'TRADING_COMPANY', label: 'Trading Company', description: 'We source and resell from multiple factories' },
  { value: 'WHOLESALER', label: 'Wholesaler', description: 'We buy in bulk and sell at wholesale prices' },
  { value: 'DISTRIBUTOR', label: 'Distributor', description: 'We distribute products in specific regions' },
  { value: 'AGENT', label: 'Agent / Broker', description: 'We connect buyers with manufacturers' },
  { value: 'RETAILER', label: 'Retailer', description: 'We sell directly to end consumers' },
  { value: 'BUYING_OFFICE', label: 'Buying Office', description: 'We represent overseas buyers locally' },
  { value: 'OTHER', label: 'Other', description: 'None of the above' },
];

const EMPLOYEE_RANGES = [
  '1-10', '11-50', '51-100', '101-500', '501-1000', '1000+',
];

const REVENUE_RANGES = [
  'Below $100K', '$100K – $500K', '$500K – $1M', '$1M – $5M',
  '$5M – $10M', '$10M – $50M', '$50M – $100M', 'Above $100M',
];

const COUNTRIES = [
  'China', 'India', 'Vietnam', 'Thailand', 'Indonesia', 'Bangladesh',
  'Malaysia', 'Philippines', 'South Korea', 'Japan', 'Taiwan',
  'Pakistan', 'Sri Lanka', 'Cambodia', 'Myanmar', 'Turkey',
  'United Arab Emirates', 'Saudi Arabia', 'Mexico', 'Brazil',
  'United States', 'United Kingdom', 'Germany', 'Other',
];

const CERTIFICATIONS = [
  'ISO 9001', 'ISO 14001', 'ISO 45001', 'CE', 'FDA', 'SGS',
  'BSCI', 'SEDEX', 'SA8000', 'GMP', 'HACCP', 'UL', 'RoHS',
  'REACH', 'OEKO-TEX', 'GOTS', 'BRC', 'IFS', 'None',
];

const MAIN_MARKETS = [
  'North America', 'South America', 'Western Europe', 'Eastern Europe',
  'Southeast Asia', 'East Asia', 'South Asia', 'Middle East',
  'Africa', 'Oceania', 'Central America',
];

type Step = 'account' | 'company' | 'location' | 'storefront';

export default function SellerRegisterPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      router.push('/seller/become');
    }
  }, [status, session, router]);

  const [step, setStep] = useState<Step>('account');
  const [formData, setFormData] = useState({
    // Step 1 – Account
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    // Step 2 – Company info
    businessName: '',
    businessEmail: '',
    businessPhone: '',
    businessType: 'MANUFACTURER',
    yearEstablished: '',
    employeeCount: '',
    annualRevenue: '',
    registrationNumber: '',
    description: '',
    website: '',
    // Step 3 – Location & Trade
    country: '',
    state: '',
    city: '',
    address: '',
    postalCode: '',
    factoryAddress: '',
    factorySize: '',
    nearestPort: '',
    mainMarkets: [] as string[],
    certifications: [] as string[],
    // Step 4 – Storefront
    subdomain: '',
    customDomain: '',
    mainProducts: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null);
  const [checkingSubdomain, setCheckingSubdomain] = useState(false);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    );
  }

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);

    if (name === 'subdomain' && value.length >= 3) {
      checkSubdomainAvailability(value);
    }
  };

  const toggleArrayField = (field: 'mainMarkets' | 'certifications', value: string) => {
    setFormData(prev => {
      const arr = prev[field];
      return {
        ...prev,
        [field]: arr.includes(value)
          ? arr.filter(v => v !== value)
          : [...arr, value],
      };
    });
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

  // --- Step validation ---
  const validateAccount = (): boolean => {
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('All fields are required');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }
    return true;
  };

  const validateCompany = (): boolean => {
    if (!formData.businessName || !formData.businessEmail || !formData.businessType) {
      setError('Business name, email, and type are required');
      return false;
    }
    return true;
  };

  const validateLocation = (): boolean => {
    if (!formData.country || !formData.city) {
      setError('Country and city are required');
      return false;
    }
    return true;
  };

  const steps: { key: Step; label: string; icon: React.ElementType }[] = [
    { key: 'account', label: 'Account', icon: User },
    { key: 'company', label: 'Company', icon: Building2 },
    { key: 'location', label: 'Location & Trade', icon: MapPin },
    { key: 'storefront', label: 'Storefront', icon: Store },
  ];

  const currentIndex = steps.findIndex(s => s.key === step);

  const goNext = () => {
    setError(null);
    if (step === 'account' && !validateAccount()) return;
    if (step === 'company' && !validateCompany()) return;
    if (step === 'location' && !validateLocation()) return;
    const next = steps[currentIndex + 1];
    if (next) setStep(next.key);
  };

  const goBack = () => {
    const prev = steps[currentIndex - 1];
    if (prev) {
      setError(null);
      setStep(prev.key);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subdomain) {
      setError('Store subdomain is required');
      return;
    }
    if (subdomainAvailable === false) {
      setError('Please choose an available subdomain');
      return;
    }

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

      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.ok) {
        router.push('/seller');
        router.refresh();
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const benefits = [
    { icon: Store, title: 'Your Own Storefront', description: 'Get a custom subdomain or connect your existing domain' },
    { icon: TrendingUp, title: 'Reach Global Importers', description: 'Be discovered by buyers across North America, Europe, and more' },
    { icon: Shield, title: 'Verified Badge', description: 'Build trust with a verified manufacturer profile' },
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

      {/* Main */}
      <main className="flex-1 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-5 gap-8 items-start">
            {/* Left – Benefits */}
            <div className="lg:col-span-2 lg:sticky lg:top-8 space-y-6">
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
                List your factory on{' '}
                <span className="bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">Supply Me</span>
              </h1>
              <p className="text-gray-600">
                Join verified manufacturers connecting with importers worldwide. Complete your profile to start receiving inquiries.
              </p>

              <div className="space-y-5 hidden lg:block">
                {benefits.map((b, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center flex-shrink-0">
                      <b.icon className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{b.title}</h3>
                      <p className="text-gray-600 text-sm">{b.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden lg:block p-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white">
                <h3 className="font-semibold mb-1">Why we ask for this info</h3>
                <p className="text-sm text-orange-100">
                  Complete profiles receive 5x more inquiries. Buyers trust verified manufacturers with detailed company information, certifications, and factory details.
                </p>
              </div>
            </div>

            {/* Right – Form */}
            <div className="lg:col-span-3">
              <Card className="shadow-xl border-0 bg-white/90 backdrop-blur">
                <CardHeader className="pb-4">
                  {/* Step indicators */}
                  <div className="flex items-center gap-1 mb-6">
                    {steps.map((s, i) => {
                      const done = i < currentIndex;
                      const active = i === currentIndex;
                      return (
                        <div key={s.key} className="flex items-center flex-1">
                          <button
                            type="button"
                            onClick={() => {
                              if (done) { setError(null); setStep(s.key); }
                            }}
                            className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
                              done ? 'text-green-600 cursor-pointer' : active ? 'text-orange-600' : 'text-gray-400'
                            }`}
                          >
                            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                              done ? 'bg-green-500 text-white' : active ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-500'
                            }`}>
                              {done ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                            </span>
                            <span className="hidden sm:inline">{s.label}</span>
                          </button>
                          {i < steps.length - 1 && (
                            <div className={`flex-1 h-0.5 mx-2 rounded ${i < currentIndex ? 'bg-green-400' : 'bg-gray-200'}`} />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <CardTitle className="text-xl font-bold text-gray-900">
                    {step === 'account' && 'Create your account'}
                    {step === 'company' && 'Company information'}
                    {step === 'location' && 'Location & trade capacity'}
                    {step === 'storefront' && 'Set up your storefront'}
                  </CardTitle>
                  <CardDescription className="text-gray-500">
                    {step === 'account' && 'Your personal login credentials — we will never share these.'}
                    {step === 'company' && 'Tell buyers about your company so they can verify your legitimacy.'}
                    {step === 'location' && 'Your location, factory details, and trade capacity.'}
                    {step === 'storefront' && 'Choose your store URL and describe your main products.'}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {error && (
                    <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                      {error}
                    </div>
                  )}

                  {/* ================== STEP 1: ACCOUNT ================== */}
                  {step === 'account' && (
                    <form onSubmit={(e) => { e.preventDefault(); goNext(); }} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name *</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input id="name" name="name" placeholder="John Doe" value={formData.name} onChange={handleChange} className="pl-10 h-12" required />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input id="email" name="email" type="email" placeholder="you@company.com" value={formData.email} onChange={handleChange} className="pl-10 h-12" required />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="password">Password *</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input id="password" name="password" type={showPassword ? 'text' : 'password'} placeholder="Min 8 characters" value={formData.password} onChange={handleChange} className="pl-10 pr-10 h-12" required />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="confirmPassword">Confirm Password *</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input id="confirmPassword" name="confirmPassword" type={showPassword ? 'text' : 'password'} placeholder="Re-enter password" value={formData.confirmPassword} onChange={handleChange} className="pl-10 h-12" required />
                          </div>
                        </div>
                      </div>
                      <Button type="submit" className="w-full h-12 text-base font-semibold bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/25">
                        Continue <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </form>
                  )}

                  {/* ================== STEP 2: COMPANY ================== */}
                  {step === 'company' && (
                    <form onSubmit={(e) => { e.preventDefault(); goNext(); }} className="space-y-5">
                      {/* Business name & email */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="businessName">Business / Company Name *</Label>
                          <div className="relative">
                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input id="businessName" name="businessName" placeholder="ABC Manufacturing Co." value={formData.businessName} onChange={handleChange} className="pl-10 h-12" required />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="businessEmail">Business Email *</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input id="businessEmail" name="businessEmail" type="email" placeholder="contact@abc-mfg.com" value={formData.businessEmail} onChange={handleChange} className="pl-10 h-12" required />
                          </div>
                        </div>
                      </div>

                      {/* Phone & Website */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="businessPhone">Business Phone</Label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input id="businessPhone" name="businessPhone" type="tel" placeholder="+86 138 0000 0000" value={formData.businessPhone} onChange={handleChange} className="pl-10 h-12" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="website">Company Website</Label>
                          <div className="relative">
                            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input id="website" name="website" placeholder="https://abc-mfg.com" value={formData.website} onChange={handleChange} className="pl-10 h-12" />
                          </div>
                        </div>
                      </div>

                      {/* Business Type */}
                      <div className="space-y-2">
                        <Label>Business Type *</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {BUSINESS_TYPES.map(bt => (
                            <button
                              key={bt.value}
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, businessType: bt.value }))}
                              className={`text-left p-3 rounded-lg border text-sm transition-all ${
                                formData.businessType === bt.value
                                  ? 'border-orange-500 bg-orange-50 ring-1 ring-orange-500'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <span className="font-medium text-gray-900">{bt.label}</span>
                              <p className="text-xs text-gray-500 mt-0.5">{bt.description}</p>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Year, Employees, Revenue */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="yearEstablished">Year Established</Label>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input id="yearEstablished" name="yearEstablished" type="number" min="1900" max={new Date().getFullYear()} placeholder="e.g. 2005" value={formData.yearEstablished} onChange={handleChange} className="pl-10 h-12" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="employeeCount">Employees</Label>
                          <div className="relative">
                            <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                            <select id="employeeCount" name="employeeCount" value={formData.employeeCount} onChange={handleChange} className="w-full h-12 pl-10 pr-4 rounded-md border border-gray-200 bg-white text-sm text-gray-900 appearance-none">
                              <option value="">Select range</option>
                              {EMPLOYEE_RANGES.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="annualRevenue">Annual Revenue (USD)</Label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                            <select id="annualRevenue" name="annualRevenue" value={formData.annualRevenue} onChange={handleChange} className="w-full h-12 pl-10 pr-4 rounded-md border border-gray-200 bg-white text-sm text-gray-900 appearance-none">
                              <option value="">Select range</option>
                              {REVENUE_RANGES.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Business registration number */}
                      <div className="space-y-2">
                        <Label htmlFor="registrationNumber">Business Registration / Tax ID</Label>
                        <div className="relative">
                          <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input id="registrationNumber" name="registrationNumber" placeholder="e.g. 91310000MA1FL8XH41" value={formData.registrationNumber} onChange={handleChange} className="pl-10 h-12" />
                        </div>
                        <p className="text-xs text-gray-500">Optional — helps with verification. We'll never display this publicly.</p>
                      </div>

                      {/* Description */}
                      <div className="space-y-2">
                        <Label htmlFor="description">Company Description</Label>
                        <textarea
                          id="description"
                          name="description"
                          rows={3}
                          placeholder="Brief overview — what you make, your specialties, export experience…"
                          value={formData.description}
                          onChange={handleChange}
                          className="w-full rounded-md border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                      </div>

                      {/* Nav buttons */}
                      <div className="flex gap-3 pt-2">
                        <Button type="button" variant="outline" className="flex-1 h-12" onClick={goBack}>
                          <ChevronLeft className="w-4 h-4 mr-1" /> Back
                        </Button>
                        <Button type="submit" className="flex-1 h-12 font-semibold bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white">
                          Continue <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    </form>
                  )}

                  {/* ================== STEP 3: LOCATION & TRADE ================== */}
                  {step === 'location' && (
                    <form onSubmit={(e) => { e.preventDefault(); goNext(); }} className="space-y-5">
                      {/* Country, State, City */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="country">Country *</Label>
                          <select id="country" name="country" value={formData.country} onChange={handleChange} required className="w-full h-12 px-4 rounded-md border border-gray-200 bg-white text-sm text-gray-900 appearance-none">
                            <option value="">Select country</option>
                            {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="state">State / Province</Label>
                          <Input id="state" name="state" placeholder="e.g. Guangdong" value={formData.state} onChange={handleChange} className="h-12" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="city">City *</Label>
                          <Input id="city" name="city" placeholder="e.g. Shenzhen" value={formData.city} onChange={handleChange} className="h-12" required />
                        </div>
                      </div>

                      {/* Address & Postal code */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="sm:col-span-2 space-y-2">
                          <Label htmlFor="address">Street Address</Label>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input id="address" name="address" placeholder="123 Industrial Ave, Building B" value={formData.address} onChange={handleChange} className="pl-10 h-12" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="postalCode">Postal / ZIP Code</Label>
                          <Input id="postalCode" name="postalCode" placeholder="518000" value={formData.postalCode} onChange={handleChange} className="h-12" />
                        </div>
                      </div>

                      {/* Factory details */}
                      <div className="border-t pt-4 mt-2">
                        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <Factory className="w-4 h-4 text-orange-600" />
                          Factory Details <span className="text-xs font-normal text-gray-400">(if applicable)</span>
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="sm:col-span-2 space-y-2">
                            <Label htmlFor="factoryAddress">Factory Address</Label>
                            <Input id="factoryAddress" name="factoryAddress" placeholder="Same as above, or separate factory location" value={formData.factoryAddress} onChange={handleChange} className="h-12" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="factorySize">Factory Size</Label>
                            <Input id="factorySize" name="factorySize" placeholder="e.g. 5,000 sqm" value={formData.factorySize} onChange={handleChange} className="h-12" />
                          </div>
                        </div>
                      </div>

                      {/* Nearest port */}
                      <div className="space-y-2">
                        <Label htmlFor="nearestPort">Nearest Shipping Port</Label>
                        <Input id="nearestPort" name="nearestPort" placeholder="e.g. Shenzhen / Yantian" value={formData.nearestPort} onChange={handleChange} className="h-12" />
                      </div>

                      {/* Main export markets */}
                      <div className="space-y-2">
                        <Label>Main Export Markets</Label>
                        <div className="flex flex-wrap gap-2">
                          {MAIN_MARKETS.map(m => (
                            <button
                              key={m}
                              type="button"
                              onClick={() => toggleArrayField('mainMarkets', m)}
                              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                                formData.mainMarkets.includes(m)
                                  ? 'bg-orange-100 border-orange-400 text-orange-700'
                                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
                              }`}
                            >
                              {m}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Certifications */}
                      <div className="space-y-2">
                        <Label className="flex items-center gap-1">
                          <Award className="w-4 h-4 text-orange-600" />
                          Certifications
                        </Label>
                        <div className="flex flex-wrap gap-2">
                          {CERTIFICATIONS.map(c => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => toggleArrayField('certifications', c === 'None' ? 'None' : c)}
                              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                                formData.certifications.includes(c)
                                  ? 'bg-orange-100 border-orange-400 text-orange-700'
                                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
                              }`}
                            >
                              {c}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-3 pt-2">
                        <Button type="button" variant="outline" className="flex-1 h-12" onClick={goBack}>
                          <ChevronLeft className="w-4 h-4 mr-1" /> Back
                        </Button>
                        <Button type="submit" className="flex-1 h-12 font-semibold bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white">
                          Continue <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    </form>
                  )}

                  {/* ================== STEP 4: STOREFRONT ================== */}
                  {step === 'storefront' && (
                    <form onSubmit={handleSubmit} className="space-y-5">
                      {/* Subdomain */}
                      <div className="space-y-2">
                        <Label htmlFor="subdomain">Store URL *</Label>
                        <div className="flex items-center">
                          <div className="relative flex-1">
                            <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input id="subdomain" name="subdomain" placeholder="your-store" value={formData.subdomain} onChange={handleChange} className="pl-10 h-12 rounded-r-none" required />
                          </div>
                          <span className="bg-gray-100 px-3 border border-l-0 border-gray-200 rounded-r-md text-gray-500 h-12 flex items-center text-sm whitespace-nowrap">
                            .{rootDomain}
                          </span>
                        </div>
                        {checkingSubdomain && <p className="text-sm text-gray-500">Checking availability...</p>}
                        {!checkingSubdomain && subdomainAvailable === true && (
                          <p className="text-sm text-green-600 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Available!</p>
                        )}
                        {!checkingSubdomain && subdomainAvailable === false && (
                          <p className="text-sm text-red-600">This subdomain is already taken</p>
                        )}
                      </div>

                      {/* Custom domain */}
                      <div className="space-y-2">
                        <Label htmlFor="customDomain">Custom Domain <span className="text-gray-400 font-normal">(optional)</span></Label>
                        <div className="relative">
                          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input id="customDomain" name="customDomain" placeholder="www.yourcompany.com" value={formData.customDomain} onChange={handleChange} className="pl-10 h-12" />
                        </div>
                        <p className="text-xs text-gray-500">You can configure DNS later from your seller dashboard.</p>
                      </div>

                      {/* Main products */}
                      <div className="space-y-2">
                        <Label htmlFor="mainProducts">Main Products / Keywords</Label>
                        <div className="relative">
                          <Package className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                          <textarea
                            id="mainProducts"
                            name="mainProducts"
                            rows={3}
                            placeholder="e.g. Stainless steel fasteners, CNC machined parts, custom bolts…"
                            value={formData.mainProducts}
                            onChange={handleChange}
                            className="w-full rounded-md border border-gray-200 pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          />
                        </div>
                        <p className="text-xs text-gray-500">These appear on your store profile and help buyers find you.</p>
                      </div>

                      {/* Summary */}
                      <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                        <h4 className="font-semibold text-gray-900">Registration summary</h4>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-gray-600">
                          <span>Company</span><span className="font-medium text-gray-900 truncate">{formData.businessName || '—'}</span>
                          <span>Type</span><span className="font-medium text-gray-900">{BUSINESS_TYPES.find(b => b.value === formData.businessType)?.label || '—'}</span>
                          <span>Location</span><span className="font-medium text-gray-900 truncate">{[formData.city, formData.country].filter(Boolean).join(', ') || '—'}</span>
                          <span>Store URL</span><span className="font-medium text-orange-600 truncate">{formData.subdomain ? `${formData.subdomain}.${rootDomain}` : '—'}</span>
                        </div>
                      </div>

                      {/* Terms */}
                      <p className="text-xs text-gray-500">
                        By registering, you agree to our{' '}
                        <Link href="/terms" className="text-orange-600 hover:underline">Terms of Service</Link> and{' '}
                        <Link href="/privacy" className="text-orange-600 hover:underline">Privacy Policy</Link>.
                        Your information will be reviewed before your store goes live.
                      </p>

                      <div className="flex gap-3 pt-2">
                        <Button type="button" variant="outline" className="flex-1 h-12" onClick={goBack}>
                          <ChevronLeft className="w-4 h-4 mr-1" /> Back
                        </Button>
                        <Button
                          type="submit"
                          disabled={isLoading || subdomainAvailable === false}
                          className="flex-1 h-12 text-base font-semibold bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/25"
                        >
                          {isLoading ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating…</>
                          ) : (
                            'Create Seller Account'
                          )}
                        </Button>
                      </div>
                    </form>
                  )}

                  <p className="text-center text-sm text-gray-600 pt-4">
                    Already have an account?{' '}
                    <Link href="/auth/login" className="font-semibold text-orange-600 hover:text-orange-700">Sign in</Link>
                  </p>
                </CardContent>
              </Card>
            </div>
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
