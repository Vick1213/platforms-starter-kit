'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  ShoppingBag, ArrowLeft, Save, Store, Palette, Globe, 
  Bell, Shield, CreditCard, Truck, Image as ImageIcon,
  Check, AlertCircle, Loader2, ExternalLink, Copy
} from 'lucide-react';
import { buildSubdomainUrl, rootDomain, isVercelPreview } from '@/lib/utils';

interface SellerData {
  id: string;
  businessName: string;
  businessEmail: string;
  businessPhone: string | null;
  description: string | null;
  logo: string | null;
  banner: string | null;
  subdomain: string;
  customDomain: string | null;
  verified: boolean;
  status: string;
}

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
  primaryColor: '#f97316',
  accentColor: '#fbbf24',
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

export default function SellerSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [seller, setSeller] = useState<SellerData | null>(null);
  const [customization, setCustomization] = useState<StoreCustomization>(defaultCustomization);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states for profile
  const [businessName, setBusinessName] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [description, setDescription] = useState('');
  const [logo, setLogo] = useState('');
  const [banner, setBanner] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }

    if (status === 'authenticated') {
      fetchSellerData();
    }
  }, [status, router]);

  const fetchSellerData = async () => {
    try {
      const res = await fetch('/api/seller/profile');
      if (res.ok) {
        const data = await res.json();
        setSeller(data.seller);
        setBusinessName(data.seller.businessName);
        setBusinessEmail(data.seller.businessEmail);
        setBusinessPhone(data.seller.businessPhone || '');
        setDescription(data.seller.description || '');
        setLogo(data.seller.logo || '');
        setBanner(data.seller.banner || '');
        
        if (data.customization) {
          setCustomization({ ...defaultCustomization, ...data.customization });
        }
      } else if (res.status === 404) {
        router.push('/seller-portal');
      }
    } catch (error) {
      console.error('Error fetching seller data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/seller/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName,
          businessEmail,
          businessPhone,
          description,
          logo,
          banner,
        }),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        fetchSellerData();
      } else {
        const error = await res.json();
        setMessage({ type: 'error', text: error.error || 'Failed to update profile' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while saving' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCustomization = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/seller/customization', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customization),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Store customization saved!' });
      } else {
        const error = await res.json();
        setMessage({ type: 'error', text: error.error || 'Failed to save customization' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while saving' });
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setMessage({ type: 'success', text: 'Copied to clipboard!' });
    setTimeout(() => setMessage(null), 2000);
  };

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    );
  }

  if (!seller) {
    return null;
  }

  const storeUrl = buildSubdomainUrl(seller.subdomain);
  const displayDomain = isVercelPreview 
    ? `${seller.subdomain}---${rootDomain}` 
    : `${seller.subdomain}.${rootDomain}`;

  const tabs = [
    { id: 'profile', label: 'Profile', icon: Store },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'social', label: 'Social & Contact', icon: Globe },
    { id: 'policies', label: 'Policies', icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/seller" className="p-2 hover:bg-gray-100 rounded-lg">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Store Settings</h1>
                <p className="text-sm text-gray-500">Customize your storefront</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <a 
                href={storeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border rounded-lg hover:bg-gray-50"
              >
                <ExternalLink className="w-4 h-4" />
                Preview Store
              </a>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.type === 'success' ? (
              <Check className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            {message.text}
          </div>
        )}

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-orange-50 text-orange-600 font-medium'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  {tab.label}
                </button>
              ))}
            </nav>

            {/* Store URL Card */}
            <Card className="mt-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Your Store URL</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-gray-100 px-2 py-1.5 rounded truncate">
                    {displayDomain}
                  </code>
                  <button 
                    onClick={() => copyToClipboard(storeUrl)}
                    className="p-1.5 hover:bg-gray-100 rounded"
                  >
                    <Copy className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <Card>
                <CardHeader>
                  <CardTitle>Business Profile</CardTitle>
                  <CardDescription>
                    Update your business information that appears on your store
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="businessName">Business Name *</Label>
                      <Input
                        id="businessName"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        placeholder="Your Company Name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="businessEmail">Business Email *</Label>
                      <Input
                        id="businessEmail"
                        type="email"
                        value={businessEmail}
                        onChange={(e) => setBusinessEmail(e.target.value)}
                        placeholder="contact@yourcompany.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="businessPhone">Business Phone</Label>
                    <Input
                      id="businessPhone"
                      value={businessPhone}
                      onChange={(e) => setBusinessPhone(e.target.value)}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Business Description</Label>
                    <textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Tell customers about your business, what you manufacture, your expertise..."
                      className="w-full min-h-[120px] px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="logo">Logo URL</Label>
                      <Input
                        id="logo"
                        value={logo}
                        onChange={(e) => setLogo(e.target.value)}
                        placeholder="https://example.com/logo.png"
                      />
                      {logo && (
                        <div className="mt-2 w-20 h-20 border rounded-lg overflow-hidden bg-gray-50">
                          <img src={logo} alt="Logo preview" className="w-full h-full object-contain" />
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="banner">Banner Image URL</Label>
                      <Input
                        id="banner"
                        value={banner}
                        onChange={(e) => setBanner(e.target.value)}
                        placeholder="https://example.com/banner.jpg"
                      />
                      {banner && (
                        <div className="mt-2 w-full h-24 border rounded-lg overflow-hidden bg-gray-50">
                          <img src={banner} alt="Banner preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <Button 
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Profile
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
              <Card>
                <CardHeader>
                  <CardTitle>Store Appearance</CardTitle>
                  <CardDescription>
                    Customize the look and feel of your storefront
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="primaryColor">Primary Color</Label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          id="primaryColor"
                          value={customization.primaryColor}
                          onChange={(e) => setCustomization({
                            ...customization,
                            primaryColor: e.target.value
                          })}
                          className="w-12 h-10 rounded border cursor-pointer"
                        />
                        <Input
                          value={customization.primaryColor}
                          onChange={(e) => setCustomization({
                            ...customization,
                            primaryColor: e.target.value
                          })}
                          placeholder="#f97316"
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="accentColor">Accent Color</Label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          id="accentColor"
                          value={customization.accentColor}
                          onChange={(e) => setCustomization({
                            ...customization,
                            accentColor: e.target.value
                          })}
                          className="w-12 h-10 rounded border cursor-pointer"
                        />
                        <Input
                          value={customization.accentColor}
                          onChange={(e) => setCustomization({
                            ...customization,
                            accentColor: e.target.value
                          })}
                          placeholder="#fbbf24"
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Header Style</Label>
                    <div className="grid grid-cols-3 gap-3">
                      {(['minimal', 'standard', 'bold'] as const).map((style) => (
                        <button
                          key={style}
                          onClick={() => setCustomization({ ...customization, headerStyle: style })}
                          className={`p-4 border rounded-lg text-center capitalize transition-colors ${
                            customization.headerStyle === style
                              ? 'border-orange-500 bg-orange-50 text-orange-600'
                              : 'hover:border-gray-300'
                          }`}
                        >
                          {style}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Announcement Banner</Label>
                        <p className="text-sm text-gray-500">Show a banner at the top of your store</p>
                      </div>
                      <button
                        onClick={() => setCustomization({ 
                          ...customization, 
                          showBanner: !customization.showBanner 
                        })}
                        className={`w-12 h-6 rounded-full transition-colors ${
                          customization.showBanner ? 'bg-orange-500' : 'bg-gray-200'
                        }`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                          customization.showBanner ? 'translate-x-6' : 'translate-x-0.5'
                        }`} />
                      </button>
                    </div>
                    {customization.showBanner && (
                      <Input
                        value={customization.bannerText}
                        onChange={(e) => setCustomization({
                          ...customization,
                          bannerText: e.target.value
                        })}
                        placeholder="🎉 Free shipping on orders over $500!"
                      />
                    )}
                  </div>

                  <div className="pt-4 border-t">
                    <Button 
                      onClick={handleSaveCustomization}
                      disabled={saving}
                      className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Appearance
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Social & Contact Tab */}
            {activeTab === 'social' && (
              <Card>
                <CardHeader>
                  <CardTitle>Social Links & Contact</CardTitle>
                  <CardDescription>
                    Add your social media profiles and contact information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900">Social Media Links</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="website">Website</Label>
                        <Input
                          id="website"
                          value={customization.socialLinks.website}
                          onChange={(e) => setCustomization({
                            ...customization,
                            socialLinks: { ...customization.socialLinks, website: e.target.value }
                          })}
                          placeholder="https://yourwebsite.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="facebook">Facebook</Label>
                        <Input
                          id="facebook"
                          value={customization.socialLinks.facebook}
                          onChange={(e) => setCustomization({
                            ...customization,
                            socialLinks: { ...customization.socialLinks, facebook: e.target.value }
                          })}
                          placeholder="https://facebook.com/yourpage"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="instagram">Instagram</Label>
                        <Input
                          id="instagram"
                          value={customization.socialLinks.instagram}
                          onChange={(e) => setCustomization({
                            ...customization,
                            socialLinks: { ...customization.socialLinks, instagram: e.target.value }
                          })}
                          placeholder="https://instagram.com/yourprofile"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="linkedin">LinkedIn</Label>
                        <Input
                          id="linkedin"
                          value={customization.socialLinks.linkedin}
                          onChange={(e) => setCustomization({
                            ...customization,
                            socialLinks: { ...customization.socialLinks, linkedin: e.target.value }
                          })}
                          placeholder="https://linkedin.com/company/yourcompany"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="whatsapp">WhatsApp</Label>
                        <Input
                          id="whatsapp"
                          value={customization.socialLinks.whatsapp}
                          onChange={(e) => setCustomization({
                            ...customization,
                            socialLinks: { ...customization.socialLinks, whatsapp: e.target.value }
                          })}
                          placeholder="+1234567890"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="font-medium text-gray-900">Contact Information</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="contactEmail">Contact Email</Label>
                        <Input
                          id="contactEmail"
                          type="email"
                          value={customization.contactInfo.email}
                          onChange={(e) => setCustomization({
                            ...customization,
                            contactInfo: { ...customization.contactInfo, email: e.target.value }
                          })}
                          placeholder="sales@yourcompany.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contactPhone">Contact Phone</Label>
                        <Input
                          id="contactPhone"
                          value={customization.contactInfo.phone}
                          onChange={(e) => setCustomization({
                            ...customization,
                            contactInfo: { ...customization.contactInfo, phone: e.target.value }
                          })}
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contactAddress">Business Address</Label>
                      <textarea
                        id="contactAddress"
                        value={customization.contactInfo.address}
                        onChange={(e) => setCustomization({
                          ...customization,
                          contactInfo: { ...customization.contactInfo, address: e.target.value }
                        })}
                        placeholder="123 Manufacturing District, Industrial City, Country"
                        className="w-full min-h-[80px] px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="font-medium text-gray-900">About Us</h3>
                    <textarea
                      value={customization.aboutUs}
                      onChange={(e) => setCustomization({
                        ...customization,
                        aboutUs: e.target.value
                      })}
                      placeholder="Tell your story - your company history, manufacturing capabilities, certifications, and what makes you unique..."
                      className="w-full min-h-[150px] px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div className="pt-4 border-t">
                    <Button 
                      onClick={handleSaveCustomization}
                      disabled={saving}
                      className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Contact Info
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Policies Tab */}
            {activeTab === 'policies' && (
              <Card>
                <CardHeader>
                  <CardTitle>Store Policies</CardTitle>
                  <CardDescription>
                    Set up your shipping, return, and privacy policies
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="shippingPolicy">Shipping Policy</Label>
                    <textarea
                      id="shippingPolicy"
                      value={customization.policies.shipping}
                      onChange={(e) => setCustomization({
                        ...customization,
                        policies: { ...customization.policies, shipping: e.target.value }
                      })}
                      placeholder="Describe your shipping terms, lead times, FOB/CIF options, minimum order quantities..."
                      className="w-full min-h-[150px] px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="returnPolicy">Return & Refund Policy</Label>
                    <textarea
                      id="returnPolicy"
                      value={customization.policies.returns}
                      onChange={(e) => setCustomization({
                        ...customization,
                        policies: { ...customization.policies, returns: e.target.value }
                      })}
                      placeholder="Describe your return conditions, quality guarantees, dispute resolution process..."
                      className="w-full min-h-[150px] px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="privacyPolicy">Privacy Policy</Label>
                    <textarea
                      id="privacyPolicy"
                      value={customization.policies.privacy}
                      onChange={(e) => setCustomization({
                        ...customization,
                        policies: { ...customization.policies, privacy: e.target.value }
                      })}
                      placeholder="Describe how you handle customer data, confidential information..."
                      className="w-full min-h-[150px] px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div className="pt-4 border-t">
                    <Button 
                      onClick={handleSaveCustomization}
                      disabled={saving}
                      className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Policies
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
