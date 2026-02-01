'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileUpload } from '@/components/ui/file-upload';
import { 
  ShoppingBag, ArrowLeft, Save, Store, Palette, Globe, 
  Shield, Image as ImageIcon, Layers, Menu, FileText,
  Check, AlertCircle, Loader2, ExternalLink, Copy, Trash2,
  Layout, Type, PanelTop, Eye, Star, MessageCircle
} from 'lucide-react';
import { buildSubdomainUrl, rootDomain, isVercelPreview } from '@/lib/utils';

// Store Builder Components
import { 
  LivePreview, 
  ThemeSelector, 
  SectionBuilder, 
  ColorEditor, 
  TypographyEditor,
  HeroEditor,
  NavigationEditor,
  CustomPagesEditor,
} from '@/components/store-builder';

// Review Settings
import { ReviewSettingsEditor } from '@/components/reviews';
import { ReviewSettings, defaultReviewSettings } from '@/lib/review-types';

// Types
import { 
  StoreCustomization, 
  defaultStoreCustomization,
  mergeWithDefaults,
  ThemeTemplate,
} from '@/lib/store-customization-types';

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

export default function SellerSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('theme');
  const [seller, setSeller] = useState<SellerData | null>(null);
  const [customization, setCustomization] = useState<StoreCustomization>(defaultStoreCustomization);
  const [reviewSettings, setReviewSettings] = useState<ReviewSettings>(defaultReviewSettings);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showPreview, setShowPreview] = useState(true);

  // Form states for profile
  const [businessName, setBusinessName] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [description, setDescription] = useState('');
  const [logo, setLogo] = useState('');
  const [favicon, setFavicon] = useState('');
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
      } else if (res.status === 404) {
        router.push('/seller-portal');
        return;
      }

      // Fetch customization
      const customRes = await fetch('/api/seller/customization');
      if (customRes.ok) {
        const customData = await customRes.json();
        if (customData.customization) {
          setCustomization(mergeWithDefaults(customData.customization));
        }
      }

      // Fetch review settings
      const reviewRes = await fetch('/api/reviews?action=settings');
      if (reviewRes.ok) {
        const reviewData = await reviewRes.json();
        if (reviewData.settings) {
          setReviewSettings(reviewData.settings);
        }
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

  const handleThemeChange = (theme: ThemeTemplate, updates: Partial<StoreCustomization>) => {
    setCustomization(prev => mergeWithDefaults({ ...prev, ...updates }));
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
    { id: 'theme', label: 'Theme', icon: Palette },
    { id: 'hero', label: 'Hero', icon: PanelTop },
    { id: 'sections', label: 'Sections', icon: Layers },
    { id: 'colors', label: 'Colors & Fonts', icon: Type },
    { id: 'navigation', label: 'Navigation', icon: Menu },
    { id: 'pages', label: 'Pages', icon: FileText },
    { id: 'reviews', label: 'Reviews', icon: Star },
    { id: 'profile', label: 'Profile', icon: Store },
    { id: 'social', label: 'Social & Contact', icon: Globe },
    { id: 'policies', label: 'Policies', icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-20">
        <div className="max-w-[1800px] mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/seller" className="p-2 hover:bg-gray-100 rounded-lg">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Store Builder</h1>
                <p className="text-xs text-gray-500">Customize your storefront</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors ${
                  showPreview ? 'bg-orange-50 text-orange-600 border-orange-200' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Eye className="w-4 h-4" />
                {showPreview ? 'Hide' : 'Show'} Preview
              </button>
              <a 
                href={storeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border rounded-lg hover:bg-gray-50"
              >
                <ExternalLink className="w-4 h-4" />
                View Live Store
              </a>
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
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Message */}
      {message && (
        <div className="max-w-[1800px] mx-auto px-4 pt-4">
          <div className={`p-4 rounded-lg flex items-center gap-3 ${
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
        </div>
      )}

      <div className={`max-w-[1800px] mx-auto px-4 py-6 grid gap-6 ${
        showPreview ? 'lg:grid-cols-2' : ''
      }`}>
        {/* Left Panel - Settings */}
        <div className="space-y-6">
          {/* Tab Navigation */}
          <div className="bg-white rounded-xl border p-1">
            <nav className="flex flex-wrap gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-orange-500 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <Card>
            <CardContent className="p-6">
              {/* Theme Tab */}
              {activeTab === 'theme' && (
                <ThemeSelector
                  currentTheme={customization.theme}
                  onThemeChange={handleThemeChange}
                />
              )}

              {/* Hero Tab */}
              {activeTab === 'hero' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Hero Section</h3>
                    <p className="text-sm text-gray-500">Customize the main banner at the top of your store</p>
                  </div>
                  <HeroEditor
                    hero={customization.hero}
                    onHeroChange={(hero) => setCustomization(prev => ({ ...prev, hero }))}
                  />
                </div>
              )}

              {/* Sections Tab */}
              {activeTab === 'sections' && (
                <SectionBuilder
                  sections={customization.sections}
                  onSectionsChange={(sections) => setCustomization(prev => ({ ...prev, sections }))}
                />
              )}

              {/* Colors & Fonts Tab */}
              {activeTab === 'colors' && (
                <div className="space-y-8">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-4">Colors</h3>
                    <ColorEditor
                      colors={customization.colors}
                      onColorsChange={(colors) => setCustomization(prev => ({ ...prev, colors }))}
                    />
                  </div>
                  <div className="pt-6 border-t">
                    <h3 className="font-semibold text-gray-900 mb-4">Typography</h3>
                    <TypographyEditor
                      typography={customization.typography}
                      onTypographyChange={(typography) => setCustomization(prev => ({ ...prev, typography }))}
                    />
                  </div>
                </div>
              )}

              {/* Navigation Tab */}
              {activeTab === 'navigation' && (
                <div className="space-y-6">
                  <NavigationEditor
                    navigation={customization.navigation}
                    onNavigationChange={(navigation) => setCustomization(prev => ({ ...prev, navigation }))}
                  />
                  
                  <div className="pt-6 border-t">
                    <h4 className="font-medium text-gray-900 mb-4">Header Settings</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Sticky Header</Label>
                          <p className="text-xs text-gray-500">Header stays visible when scrolling</p>
                        </div>
                        <button
                          onClick={() => setCustomization(prev => ({
                            ...prev,
                            header: { ...prev.header, sticky: !prev.header.sticky }
                          }))}
                          className={`w-12 h-6 rounded-full transition-colors ${
                            customization.header.sticky ? 'bg-orange-500' : 'bg-gray-200'
                          }`}
                        >
                          <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                            customization.header.sticky ? 'translate-x-6' : 'translate-x-0.5'
                          }`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Show Search</Label>
                          <p className="text-xs text-gray-500">Display search bar in header</p>
                        </div>
                        <button
                          onClick={() => setCustomization(prev => ({
                            ...prev,
                            header: { ...prev.header, showSearch: !prev.header.showSearch }
                          }))}
                          className={`w-12 h-6 rounded-full transition-colors ${
                            customization.header.showSearch ? 'bg-orange-500' : 'bg-gray-200'
                          }`}
                        >
                          <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                            customization.header.showSearch ? 'translate-x-6' : 'translate-x-0.5'
                          }`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Announcement Banner</Label>
                          <p className="text-xs text-gray-500">Show promotional banner</p>
                        </div>
                        <button
                          onClick={() => setCustomization(prev => ({
                            ...prev,
                            header: { 
                              ...prev.header, 
                              announcement: { 
                                ...prev.header.announcement, 
                                enabled: !prev.header.announcement.enabled 
                              }
                            }
                          }))}
                          className={`w-12 h-6 rounded-full transition-colors ${
                            customization.header.announcement.enabled ? 'bg-orange-500' : 'bg-gray-200'
                          }`}
                        >
                          <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                            customization.header.announcement.enabled ? 'translate-x-6' : 'translate-x-0.5'
                          }`} />
                        </button>
                      </div>

                      {customization.header.announcement.enabled && (
                        <div className="space-y-2 ml-4 pl-4 border-l-2 border-orange-200">
                          <Input
                            value={customization.header.announcement.text}
                            onChange={(e) => setCustomization(prev => ({
                              ...prev,
                              header: {
                                ...prev.header,
                                announcement: { ...prev.header.announcement, text: e.target.value }
                              }
                            }))}
                            placeholder="🎉 Free shipping on orders over $500!"
                          />
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label>Header Style</Label>
                        <div className="grid grid-cols-4 gap-2">
                          {(['minimal', 'standard', 'bold', 'centered'] as const).map((style) => (
                            <button
                              key={style}
                              onClick={() => setCustomization(prev => ({
                                ...prev,
                                header: { ...prev.header, style }
                              }))}
                              className={`p-3 border rounded-lg text-center capitalize transition-colors ${
                                customization.header.style === style
                                  ? 'border-orange-500 bg-orange-50 text-orange-600'
                                  : 'hover:border-gray-300'
                              }`}
                            >
                              <span className="text-xs font-medium">{style}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Pages Tab */}
              {activeTab === 'pages' && (
                <CustomPagesEditor
                  pages={customization.pages}
                  onPagesChange={(pages) => setCustomization(prev => ({ ...prev, pages }))}
                />
              )}

              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Business Profile</h3>
                    <p className="text-sm text-gray-500">Update your business information</p>
                  </div>
                  
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
                      placeholder="Tell customers about your business..."
                      className="w-full min-h-[120px] px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Store Logo</Label>
                      {logo ? (
                        <div className="space-y-2">
                          <div className="relative w-24 h-24 border rounded-lg overflow-hidden bg-gray-50 group">
                            <img src={logo} alt="Logo preview" className="w-full h-full object-contain" />
                            <button
                              type="button"
                              onClick={() => setLogo('')}
                              className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                            >
                              <Trash2 className="w-5 h-5 text-white" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <FileUpload
                          type="store-logo"
                          accept="image"
                          buttonText="Upload Logo"
                          showPreview={false}
                          onUpload={(result) => {
                            if (result.success && result.url) {
                              setLogo(result.url);
                            }
                          }}
                          onError={(error) => setMessage({ type: 'error', text: error })}
                        />
                      )}
                      <p className="text-xs text-gray-500">Recommended: 200x200px</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Store Banner</Label>
                      {banner ? (
                        <div className="space-y-2">
                          <div className="relative w-full h-32 border rounded-lg overflow-hidden bg-gray-50 group">
                            <img src={banner} alt="Banner preview" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => setBanner('')}
                              className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                            >
                              <Trash2 className="w-5 h-5 text-white" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <FileUpload
                          type="store-banner"
                          accept="image"
                          buttonText="Upload Banner"
                          showPreview={false}
                          onUpload={(result) => {
                            if (result.success && result.url) {
                              setBanner(result.url);
                            }
                          }}
                          onError={(error) => setMessage({ type: 'error', text: error })}
                        />
                      )}
                      <p className="text-xs text-gray-500">Recommended: 1200x400px</p>
                    </div>
                  </div>

                  {/* Favicon Upload */}
                  <div className="space-y-2">
                    <Label>Store Favicon</Label>
                    <p className="text-xs text-gray-500 mb-2">This icon appears in browser tabs when customers visit your store</p>
                    {customization.favicon ? (
                      <div className="space-y-2">
                        <div className="relative w-16 h-16 border rounded-lg overflow-hidden bg-gray-50 group">
                          <img src={customization.favicon} alt="Favicon preview" className="w-full h-full object-contain" />
                          <button
                            type="button"
                            onClick={() => setCustomization({ ...customization, favicon: '' })}
                            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                          >
                            <Trash2 className="w-4 h-4 text-white" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <FileUpload
                        type="favicon"
                        accept="image"
                        buttonText="Upload Favicon"
                        showPreview={false}
                        onUpload={(result) => {
                          if (result.success && result.url) {
                            setCustomization({ ...customization, favicon: result.url });
                          }
                        }}
                        onError={(error) => setMessage({ type: 'error', text: error })}
                      />
                    )}
                    <p className="text-xs text-gray-500">Recommended: 32x32px or 64x64px PNG/ICO</p>
                  </div>

                  {/* Store URL */}
                  <div className="pt-4 border-t">
                    <Label className="mb-2 block">Your Store URL</Label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-sm bg-gray-100 px-3 py-2 rounded truncate">
                        {displayDomain}
                      </code>
                      <button 
                        onClick={() => copyToClipboard(storeUrl)}
                        className="p-2 hover:bg-gray-100 rounded border"
                      >
                        <Copy className="w-4 h-4 text-gray-500" />
                      </button>
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
                </div>
              )}

              {/* Social & Contact Tab */}
              {activeTab === 'social' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Social Links & Contact</h3>
                    <p className="text-sm text-gray-500">Add your social media and contact information</p>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Social Media</h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Website</Label>
                        <Input
                          value={customization.socialLinks.website}
                          onChange={(e) => setCustomization(prev => ({
                            ...prev,
                            socialLinks: { ...prev.socialLinks, website: e.target.value }
                          }))}
                          placeholder="https://yourwebsite.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Facebook</Label>
                        <Input
                          value={customization.socialLinks.facebook}
                          onChange={(e) => setCustomization(prev => ({
                            ...prev,
                            socialLinks: { ...prev.socialLinks, facebook: e.target.value }
                          }))}
                          placeholder="https://facebook.com/yourpage"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Instagram</Label>
                        <Input
                          value={customization.socialLinks.instagram}
                          onChange={(e) => setCustomization(prev => ({
                            ...prev,
                            socialLinks: { ...prev.socialLinks, instagram: e.target.value }
                          }))}
                          placeholder="https://instagram.com/yourprofile"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>LinkedIn</Label>
                        <Input
                          value={customization.socialLinks.linkedin}
                          onChange={(e) => setCustomization(prev => ({
                            ...prev,
                            socialLinks: { ...prev.socialLinks, linkedin: e.target.value }
                          }))}
                          placeholder="https://linkedin.com/company/yours"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Twitter/X</Label>
                        <Input
                          value={customization.socialLinks.twitter}
                          onChange={(e) => setCustomization(prev => ({
                            ...prev,
                            socialLinks: { ...prev.socialLinks, twitter: e.target.value }
                          }))}
                          placeholder="https://twitter.com/yourhandle"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>WhatsApp</Label>
                        <Input
                          value={customization.socialLinks.whatsapp}
                          onChange={(e) => setCustomization(prev => ({
                            ...prev,
                            socialLinks: { ...prev.socialLinks, whatsapp: e.target.value }
                          }))}
                          placeholder="+1234567890"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <h4 className="font-medium text-gray-900">Contact Information</h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Contact Email</Label>
                        <Input
                          type="email"
                          value={customization.contactInfo.email}
                          onChange={(e) => setCustomization(prev => ({
                            ...prev,
                            contactInfo: { ...prev.contactInfo, email: e.target.value }
                          }))}
                          placeholder="sales@yourcompany.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Contact Phone</Label>
                        <Input
                          value={customization.contactInfo.phone}
                          onChange={(e) => setCustomization(prev => ({
                            ...prev,
                            contactInfo: { ...prev.contactInfo, phone: e.target.value }
                          }))}
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Business Address</Label>
                      <textarea
                        value={customization.contactInfo.address}
                        onChange={(e) => setCustomization(prev => ({
                          ...prev,
                          contactInfo: { ...prev.contactInfo, address: e.target.value }
                        }))}
                        placeholder="123 Business St, City, Country"
                        className="w-full min-h-[80px] px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Business Hours</Label>
                      <Input
                        value={customization.contactInfo.businessHours || ''}
                        onChange={(e) => setCustomization(prev => ({
                          ...prev,
                          contactInfo: { ...prev.contactInfo, businessHours: e.target.value }
                        }))}
                        placeholder="Mon-Fri: 9AM-5PM"
                      />
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <h4 className="font-medium text-gray-900">About Us</h4>
                    <textarea
                      value={customization.aboutUs}
                      onChange={(e) => setCustomization(prev => ({
                        ...prev,
                        aboutUs: e.target.value
                      }))}
                      placeholder="Tell your story..."
                      className="w-full min-h-[150px] px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
              )}

              {/* Reviews Tab */}
              {activeTab === 'reviews' && (
                <ReviewSettingsEditor
                  settings={reviewSettings}
                  onSave={async (settings) => {
                    try {
                      const res = await fetch('/api/reviews', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          action: 'save-settings',
                          settings,
                        }),
                      });
                      if (res.ok) {
                        setReviewSettings(settings);
                        setMessage({ type: 'success', text: 'Review settings saved!' });
                      } else {
                        throw new Error('Failed to save');
                      }
                    } catch (error) {
                      setMessage({ type: 'error', text: 'Failed to save review settings' });
                      throw error;
                    }
                  }}
                />
              )}

              {/* Policies Tab */}
              {activeTab === 'policies' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Store Policies</h3>
                    <p className="text-sm text-gray-500">Set up your shipping, return, and privacy policies</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Shipping Policy</Label>
                    <textarea
                      value={customization.policies.shipping}
                      onChange={(e) => setCustomization(prev => ({
                        ...prev,
                        policies: { ...prev.policies, shipping: e.target.value }
                      }))}
                      placeholder="Describe your shipping terms..."
                      className="w-full min-h-[150px] px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Return & Refund Policy</Label>
                    <textarea
                      value={customization.policies.returns}
                      onChange={(e) => setCustomization(prev => ({
                        ...prev,
                        policies: { ...prev.policies, returns: e.target.value }
                      }))}
                      placeholder="Describe your return conditions..."
                      className="w-full min-h-[150px] px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Privacy Policy</Label>
                    <textarea
                      value={customization.policies.privacy}
                      onChange={(e) => setCustomization(prev => ({
                        ...prev,
                        policies: { ...prev.policies, privacy: e.target.value }
                      }))}
                      placeholder="Describe how you handle customer data..."
                      className="w-full min-h-[150px] px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Terms & Conditions</Label>
                    <textarea
                      value={customization.policies.terms || ''}
                      onChange={(e) => setCustomization(prev => ({
                        ...prev,
                        policies: { ...prev.policies, terms: e.target.value }
                      }))}
                      placeholder="Your terms and conditions..."
                      className="w-full min-h-[150px] px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Live Preview */}
        {showPreview && (
          <div className="lg:sticky lg:top-20 h-fit">
            <LivePreview
              customization={customization}
              sellerName={businessName || seller.businessName}
              sellerLogo={logo || seller.logo || undefined}
              sellerBanner={banner || seller.banner || undefined}
              sellerDescription={description || seller.description || undefined}
              storeUrl={storeUrl}
            />
          </div>
        )}
      </div>
    </div>
  );
}
