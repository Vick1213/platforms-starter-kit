'use client';

import { useState } from 'react';
import { 
  Plus, 
  FileText, 
  Eye, 
  EyeOff, 
  Trash2, 
  Edit2,
  Globe,
  Save,
  X,
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CustomPage } from '@/lib/store-customization-types';

interface CustomPagesEditorProps {
  pages: CustomPage[];
  onPagesChange: (pages: CustomPage[]) => void;
}

const pageTemplates: { id: string; title: string; slug: string; icon: string; content: string }[] = [
  {
    id: 'about',
    title: 'About Us',
    slug: 'about',
    icon: '👋',
    content: `# About Us

Welcome to our company! We are dedicated to providing the best products and services.

## Our Story

Share your company's history and journey here.

## Our Mission

Describe your mission and what drives your business.

## Our Values

- Quality
- Customer Satisfaction
- Innovation
- Integrity`,
  },
  {
    id: 'faq',
    title: 'FAQ',
    slug: 'faq',
    icon: '❓',
    content: `# Frequently Asked Questions

## Ordering

### How do I place an order?
Browse our products, add items to your cart, and proceed to checkout.

### What payment methods do you accept?
We accept all major credit cards, PayPal, and bank transfers.

## Shipping

### How long does shipping take?
Standard shipping takes 5-7 business days. Express shipping is available.

### Do you ship internationally?
Yes, we ship to most countries worldwide.

## Returns

### What is your return policy?
We offer a 30-day return policy for unused items in original packaging.`,
  },
  {
    id: 'contact',
    title: 'Contact Us',
    slug: 'contact',
    icon: '📧',
    content: `# Contact Us

We'd love to hear from you! Get in touch with us using the information below.

## Email
support@yourstore.com

## Phone
+1 (555) 123-4567

## Address
123 Business Street
City, State 12345

## Business Hours
Monday - Friday: 9:00 AM - 5:00 PM
Saturday: 10:00 AM - 2:00 PM
Sunday: Closed`,
  },
  {
    id: 'terms',
    title: 'Terms & Conditions',
    slug: 'terms',
    icon: '📜',
    content: `# Terms and Conditions

Please read these terms and conditions carefully before using our services.

## 1. Agreement to Terms

By accessing our website, you agree to be bound by these terms.

## 2. Products and Services

All products are subject to availability. We reserve the right to modify or discontinue any product.

## 3. Pricing

Prices are subject to change without notice. All prices are in USD unless otherwise stated.

## 4. Privacy

Your privacy is important to us. Please review our Privacy Policy for details.`,
  },
  {
    id: 'privacy',
    title: 'Privacy Policy',
    slug: 'privacy',
    icon: '🔒',
    content: `# Privacy Policy

This privacy policy describes how we collect, use, and protect your information.

## Information We Collect

- Personal information (name, email, address)
- Order history
- Website usage data

## How We Use Your Information

- Process your orders
- Send order updates
- Improve our services
- Marketing communications (with your consent)

## Data Protection

We implement security measures to protect your personal information.`,
  },
];

export function CustomPagesEditor({ pages, onPagesChange }: CustomPagesEditorProps) {
  const [editingPage, setEditingPage] = useState<CustomPage | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);

  const addPage = (template?: typeof pageTemplates[0]) => {
    const newPage: CustomPage = {
      id: `page-${Date.now()}`,
      slug: template?.slug || 'new-page',
      title: template?.title || 'New Page',
      content: template?.content || '# New Page\n\nStart writing your content here...',
      seoTitle: template?.title || '',
      seoDescription: '',
      published: true,
    };
    onPagesChange([...pages, newPage]);
    setEditingPage(newPage);
    setShowTemplates(false);
  };

  const updatePage = (updates: Partial<CustomPage>) => {
    if (!editingPage) return;
    const updated = { ...editingPage, ...updates };
    setEditingPage(updated);
  };

  const savePage = () => {
    if (!editingPage) return;
    const updatedPages = pages.map(p => 
      p.id === editingPage.id ? editingPage : p
    );
    
    // If it's a new page, add it
    if (!pages.find(p => p.id === editingPage.id)) {
      updatedPages.push(editingPage);
    }
    
    onPagesChange(updatedPages);
    setEditingPage(null);
  };

  const deletePage = (id: string) => {
    onPagesChange(pages.filter(p => p.id !== id));
    if (editingPage?.id === id) {
      setEditingPage(null);
    }
  };

  const togglePublished = (id: string) => {
    const updatedPages = pages.map(p =>
      p.id === id ? { ...p, published: !p.published } : p
    );
    onPagesChange(updatedPages);
  };

  if (editingPage) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">
            {pages.find(p => p.id === editingPage.id) ? 'Edit Page' : 'Create Page'}
          </h3>
          <button
            onClick={() => setEditingPage(null)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Page Title</Label>
            <Input
              value={editingPage.title}
              onChange={(e) => updatePage({ title: e.target.value })}
              placeholder="About Us"
            />
          </div>
          <div className="space-y-2">
            <Label>URL Slug</Label>
            <div className="flex items-center">
              <span className="text-sm text-gray-500 mr-1">/</span>
              <Input
                value={editingPage.slug}
                onChange={(e) => updatePage({ 
                  slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')
                })}
                placeholder="about-us"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Page Content (Markdown supported)</Label>
          <textarea
            value={editingPage.content}
            onChange={(e) => updatePage({ content: e.target.value })}
            className="w-full min-h-[300px] px-3 py-2 border rounded-md text-sm font-mono"
            placeholder="# Page Title&#10;&#10;Your content here..."
          />
        </div>

        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">SEO Settings</h4>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>SEO Title</Label>
              <Input
                value={editingPage.seoTitle || ''}
                onChange={(e) => updatePage({ seoTitle: e.target.value })}
                placeholder={editingPage.title}
              />
            </div>
            <div className="space-y-2">
              <Label>SEO Description</Label>
              <Input
                value={editingPage.seoDescription || ''}
                onChange={(e) => updatePage({ seoDescription: e.target.value })}
                placeholder="Page description for search engines..."
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={editingPage.published}
              onChange={(e) => updatePage({ published: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
            />
            <span className="text-sm text-gray-700">Published</span>
          </label>
          
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setEditingPage(null)}>
              Cancel
            </Button>
            <Button
              onClick={savePage}
              className="bg-gradient-to-r from-orange-500 to-amber-500"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Page
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label>Custom Pages</Label>
          <p className="text-sm text-gray-500">Create additional pages for your store</p>
        </div>
        <Button
          onClick={() => setShowTemplates(true)}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Page
        </Button>
      </div>

      {/* Pages List */}
      {pages.length > 0 ? (
        <div className="space-y-2">
          {pages.map((page) => (
            <div
              key={page.id}
              className={`flex items-center gap-3 p-3 border rounded-lg bg-white ${
                !page.published ? 'opacity-60' : ''
              }`}
            >
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-gray-500" />
              </div>

              <div className="flex-1">
                <div className="font-medium text-gray-900">{page.title}</div>
                <div className="text-xs text-gray-500 flex items-center gap-2">
                  <Globe className="w-3 h-3" />
                  /{page.slug}
                  {!page.published && (
                    <span className="text-orange-600">(Draft)</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => togglePublished(page.id)}
                  className={`p-1.5 rounded transition-colors ${
                    page.published
                      ? 'text-green-600 hover:bg-green-50'
                      : 'text-gray-400 hover:bg-gray-100'
                  }`}
                  title={page.published ? 'Unpublish' : 'Publish'}
                >
                  {page.published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setEditingPage(page)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                  title="Edit"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deletePage(page.id)}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 border-2 border-dashed rounded-lg">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No custom pages yet</p>
          <Button onClick={() => setShowTemplates(true)} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Create your first page
          </Button>
        </div>
      )}

      {/* Template Selection Modal */}
      {showTemplates && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Add New Page</h3>
              <button
                onClick={() => setShowTemplates(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              <p className="text-sm text-gray-500 mb-4">
                Start with a template or create a blank page
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                <button
                  onClick={() => addPage()}
                  className="p-4 border-2 border-dashed rounded-lg text-center hover:border-orange-500 hover:bg-orange-50 transition-all"
                >
                  <Plus className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <span className="font-medium text-gray-900">Blank Page</span>
                  <p className="text-xs text-gray-500 mt-1">Start from scratch</p>
                </button>
                
                {pageTemplates.map((template) => {
                  const exists = pages.some(p => p.slug === template.slug);
                  return (
                    <button
                      key={template.id}
                      onClick={() => !exists && addPage(template)}
                      disabled={exists}
                      className={`p-4 border rounded-lg text-center transition-all ${
                        exists
                          ? 'opacity-50 cursor-not-allowed bg-gray-50'
                          : 'hover:border-orange-500 hover:bg-orange-50'
                      }`}
                    >
                      <span className="text-2xl mb-2 block">{template.icon}</span>
                      <span className="font-medium text-gray-900">{template.title}</span>
                      <p className="text-xs text-gray-500 mt-1">/{template.slug}</p>
                      {exists && (
                        <p className="text-xs text-orange-600 mt-1">Already exists</p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
