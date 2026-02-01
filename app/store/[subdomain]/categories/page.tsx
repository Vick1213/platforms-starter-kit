'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  StoreCustomization, 
  defaultStoreCustomization, 
  mergeWithDefaults 
} from '@/lib/store-customization-types';

interface Seller {
  id: string;
  name: string;
  subdomain: string;
  industry: string | null;
  companyName: string | null;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  minPrice: number | null;
  images: string[];
  category: string | null;
}

interface CategoryData {
  name: string;
  slug: string;
  productCount: number;
  image: string | null;
  products: Product[];
}

export default function CategoriesPage() {
  const params = useParams();
  const router = useRouter();
  const subdomain = params.subdomain as string;

  const [seller, setSeller] = useState<Seller | null>(null);
  const [customization, setCustomization] = useState<StoreCustomization>(defaultStoreCustomization);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch seller info
        const sellerRes = await fetch(`/api/seller/profile?subdomain=${subdomain}`);
        if (!sellerRes.ok) {
          throw new Error('Store not found');
        }
        const sellerData = await sellerRes.json();
        setSeller(sellerData);

        // Fetch customization
        const customRes = await fetch(`/api/seller/customization?subdomain=${subdomain}`);
        if (customRes.ok) {
          const customData = await customRes.json();
          setCustomization(mergeWithDefaults(customData));
        }

        // Fetch products to group by category
        const productsRes = await fetch(`/api/products/search?sellerId=${sellerData.id}`);
        if (productsRes.ok) {
          const productsData = await productsRes.json();
          
          // Group products by category
          const categoryMap = new Map<string, CategoryData>();
          
          for (const product of productsData.products || []) {
            const categoryName = product.category || 'Uncategorized';
            const categorySlug = categoryName.toLowerCase().replace(/\s+/g, '-');
            
            if (!categoryMap.has(categorySlug)) {
              categoryMap.set(categorySlug, {
                name: categoryName,
                slug: categorySlug,
                productCount: 0,
                image: null,
                products: [],
              });
            }
            
            const cat = categoryMap.get(categorySlug)!;
            cat.productCount++;
            cat.products.push(product);
            
            // Use first product image as category image
            if (!cat.image && product.images?.[0]) {
              cat.image = product.images[0];
            }
          }
          
          setCategories(Array.from(categoryMap.values()).sort((a, b) => b.productCount - a.productCount));
        }

        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load store');
        setLoading(false);
      }
    }

    fetchData();
  }, [subdomain]);

  // Apply customization as CSS variables
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--store-primary', customization.colors.primary);
    root.style.setProperty('--store-secondary', customization.colors.secondary);
    root.style.setProperty('--store-background', customization.colors.background);
    root.style.setProperty('--store-text', customization.colors.text);
    root.style.setProperty('--store-accent', customization.colors.accent);
  }, [customization.colors]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--store-background, #ffffff)' }}>
        <div className="animate-spin h-8 w-8 border-4 rounded-full" style={{ borderColor: 'var(--store-primary)', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  if (error || !seller) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--store-background, #ffffff)' }}>
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--store-text)' }}>Store Not Found</h1>
          <p className="text-gray-600">{error || 'This store does not exist.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--store-background, #ffffff)', color: 'var(--store-text, #1a1a1a)' }}>
      {/* Header */}
      <header className="border-b" style={{ borderColor: 'var(--store-primary)' }}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href={`/store/${subdomain}`} className="flex items-center space-x-3">
              {customization.logo ? (
                <Image
                  src={customization.logo}
                  alt={seller?.name || 'Store'}
                  width={40}
                  height={40}
                  className="object-contain"
                />
              ) : (
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: 'var(--store-primary)' }}
                >
                  {seller?.name?.charAt(0) || 'S'}
                </div>
              )}
              <span className="font-bold text-xl">{seller?.name || 'Store'}</span>
            </Link>

            <nav className="hidden md:flex items-center space-x-6">
              {customization.navigation
                .filter(item => item.visible)
                .map(item => (
                  <Link
                    key={item.id}
                    href={item.id === 'home' ? `/store/${subdomain}` : `/store/${subdomain}${item.href}`}
                    className={`text-sm font-medium transition-colors hover:opacity-80 ${item.id === 'categories' ? 'font-bold' : ''}`}
                    style={{ color: item.id === 'categories' ? 'var(--store-primary)' : 'inherit' }}
                  >
                    {item.label}
                  </Link>
                ))}
            </nav>

            <div className="flex items-center space-x-4">
              <Link
                href={`/store/${subdomain}/cart`}
                className="p-2 rounded-full transition-colors"
                style={{ backgroundColor: 'var(--store-primary)', color: 'white' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="bg-gray-50 py-3">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex items-center text-sm">
            <Link href={`/store/${subdomain}`} className="hover:underline" style={{ color: 'var(--store-primary)' }}>
              Home
            </Link>
            <span className="mx-2">/</span>
            <span className="text-gray-600">Categories</span>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">Shop by Category</h1>
        <p className="text-gray-600 mb-8">Browse our products organized by category</p>

        {categories.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <p className="text-gray-600">No categories available yet.</p>
            <Link
              href={`/store/${subdomain}/products`}
              className="inline-block mt-4 px-6 py-2 rounded-lg text-white"
              style={{ backgroundColor: 'var(--store-primary)' }}
            >
              Browse All Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map(category => (
              <Link
                key={category.slug}
                href={`/store/${subdomain}/products?category=${encodeURIComponent(category.name)}`}
                className="group relative overflow-hidden rounded-xl border border-gray-200 transition-all hover:shadow-lg hover:border-transparent"
                style={{ '--hover-border': 'var(--store-primary)' } as React.CSSProperties}
              >
                <div className="aspect-[4/3] relative bg-gray-100">
                  {category.image ? (
                    <Image
                      src={category.image}
                      alt={category.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </div>
                
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <h3 className="text-xl font-bold mb-1">{category.name}</h3>
                  <p className="text-sm opacity-90">{category.productCount} {category.productCount === 1 ? 'product' : 'products'}</p>
                </div>

                <div
                  className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ backgroundColor: 'var(--store-primary)' }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Featured Products Section */}
        {categories.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold mb-6">Popular Products</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {categories
                .flatMap(c => c.products)
                .slice(0, 8)
                .map(product => (
                  <Link
                    key={product.id}
                    href={`/store/${subdomain}/products/${product.slug}`}
                    className="group bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="aspect-square relative bg-gray-100">
                      {product.images?.[0] ? (
                        <Image
                          src={product.images[0]}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="font-medium text-sm truncate">{product.name}</h3>
                      <p className="font-bold mt-1" style={{ color: 'var(--store-primary)' }}>
                        {product.minPrice ? `$${product.minPrice.toFixed(2)}` : 'Contact for price'}
                      </p>
                    </div>
                  </Link>
                ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t mt-16 py-8" style={{ borderColor: 'var(--store-primary)' }}>
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-600">
          <p>&copy; {new Date().getFullYear()} {seller?.name || 'Store'}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
