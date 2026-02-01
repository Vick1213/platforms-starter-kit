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
import { Cart, CartItem, calculateCartTotals } from '@/lib/cart-types';

interface Seller {
  id: string;
  name: string;
  subdomain: string;
}

export default function CartPage() {
  const params = useParams();
  const router = useRouter();
  const subdomain = params.subdomain as string;

  const [seller, setSeller] = useState<Seller | null>(null);
  const [customization, setCustomization] = useState<StoreCustomization>(defaultStoreCustomization);
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
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

        // Fetch cart
        const cartRes = await fetch(`/api/cart?subdomain=${subdomain}`);
        if (cartRes.ok) {
          const cartData = await cartRes.json();
          setCart(cartData);
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

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity < 1) return;
    setUpdating(itemId);
    
    try {
      const res = await fetch(`/api/cart`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subdomain,
          itemId,
          quantity,
        }),
      });
      
      if (res.ok) {
        const updatedCart = await res.json();
        setCart(updatedCart);
      }
    } catch (err) {
      console.error('Failed to update quantity:', err);
    } finally {
      setUpdating(null);
    }
  };

  const removeItem = async (itemId: string) => {
    setUpdating(itemId);
    
    try {
      const res = await fetch(`/api/cart?subdomain=${subdomain}&itemId=${itemId}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        const updatedCart = await res.json();
        setCart(updatedCart);
      }
    } catch (err) {
      console.error('Failed to remove item:', err);
    } finally {
      setUpdating(null);
    }
  };

  const clearAllItems = async () => {
    try {
      const res = await fetch(`/api/cart?subdomain=${subdomain}&clearAll=true`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        setCart({ items: [], sellerId: seller?.id || '', sellerSubdomain: subdomain, updatedAt: new Date().toISOString() });
      }
    } catch (err) {
      console.error('Failed to clear cart:', err);
    }
  };

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

  const totals = cart ? calculateCartTotals(cart.items) : { subtotal: 0, tax: 0, total: 0 };
  const cartItems = cart?.items || [];

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
                  alt={seller.name}
                  width={40}
                  height={40}
                  className="object-contain"
                />
              ) : (
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: 'var(--store-primary)' }}
                >
                  {seller.name.charAt(0)}
                </div>
              )}
              <span className="font-bold text-xl">{seller.name}</span>
            </Link>

            <nav className="hidden md:flex items-center space-x-6">
              {customization.navigation
                .filter(item => item.visible)
                .map(item => (
                  <Link
                    key={item.id}
                    href={item.id === 'home' ? `/store/${subdomain}` : `/store/${subdomain}${item.href}`}
                    className="text-sm font-medium transition-colors hover:opacity-80"
                  >
                    {item.label}
                  </Link>
                ))}
            </nav>
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
            <span className="text-gray-600">Shopping Cart</span>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

        {cartItems.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">Looks like you haven't added any items yet.</p>
            <Link
              href={`/store/${subdomain}/products`}
              className="inline-block px-8 py-3 rounded-lg text-white font-medium"
              style={{ backgroundColor: 'var(--store-primary)' }}
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="bg-white border rounded-lg overflow-hidden">
                <div className="p-4 border-b flex items-center justify-between">
                  <span className="font-medium">{cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}</span>
                  <button
                    onClick={clearAllItems}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Clear Cart
                  </button>
                </div>

                <div className="divide-y">
                  {cartItems.map(item => (
                    <div key={item.id} className={`p-4 flex gap-4 ${updating === item.id ? 'opacity-50' : ''}`}>
                      {/* Product Image */}
                      <div className="w-24 h-24 relative bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/store/${subdomain}/products/${item.productSlug || item.productId}`}
                          className="font-medium hover:underline"
                        >
                          {item.name}
                        </Link>
                        <p className="text-sm text-gray-600 mt-1">
                          ${item.price.toFixed(2)} each
                        </p>
                        {item.moq && item.moq > 1 && (
                          <p className="text-xs text-orange-600 mt-1">
                            Min. order: {item.moq} units
                          </p>
                        )}

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-4 mt-3">
                          <div className="flex items-center border rounded-lg">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              disabled={item.quantity <= 1 || updating === item.id}
                              className="px-3 py-1 hover:bg-gray-100 disabled:opacity-50"
                            >
                              -
                            </button>
                            <span className="px-4 py-1 border-x">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              disabled={updating === item.id}
                              className="px-3 py-1 hover:bg-gray-100 disabled:opacity-50"
                            >
                              +
                            </button>
                          </div>
                          <button
                            onClick={() => removeItem(item.id)}
                            disabled={updating === item.id}
                            className="text-sm text-red-600 hover:text-red-800"
                          >
                            Remove
                          </button>
                        </div>
                      </div>

                      {/* Item Total */}
                      <div className="text-right">
                        <p className="font-bold" style={{ color: 'var(--store-primary)' }}>
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Continue Shopping */}
              <Link
                href={`/store/${subdomain}/products`}
                className="inline-flex items-center gap-2 mt-6 text-sm hover:underline"
                style={{ color: 'var(--store-primary)' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Continue Shopping
              </Link>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white border rounded-lg p-6 sticky top-6">
                <h2 className="text-lg font-bold mb-4">Order Summary</h2>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span>${totals.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Estimated Tax</span>
                    <span>${totals.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span className="text-green-600">Calculated at checkout</span>
                  </div>
                </div>

                <div className="border-t my-4" />

                <div className="flex justify-between text-lg font-bold mb-6">
                  <span>Total</span>
                  <span style={{ color: 'var(--store-primary)' }}>${totals.total.toFixed(2)}</span>
                </div>

                <Link
                  href={`/store/${subdomain}/checkout`}
                  className="block w-full text-center py-3 rounded-lg text-white font-medium transition-transform hover:scale-[1.02]"
                  style={{ backgroundColor: 'var(--store-primary)' }}
                >
                  Proceed to Checkout
                </Link>

                {/* Payment Methods */}
                <div className="mt-6 pt-6 border-t">
                  <p className="text-xs text-gray-500 text-center mb-3">Accepted Payment Methods</p>
                  <div className="flex justify-center gap-3">
                    <div className="w-10 h-6 bg-gray-100 rounded flex items-center justify-center text-xs font-bold text-gray-600">
                      VISA
                    </div>
                    <div className="w-10 h-6 bg-gray-100 rounded flex items-center justify-center text-xs font-bold text-gray-600">
                      MC
                    </div>
                    <div className="w-10 h-6 bg-gray-100 rounded flex items-center justify-center text-xs font-bold text-blue-600">
                      PP
                    </div>
                    <div className="w-10 h-6 bg-gray-100 rounded flex items-center justify-center text-xs font-bold text-gray-600">
                      BANK
                    </div>
                  </div>
                </div>

                {/* Security Badge */}
                <div className="mt-4 text-center">
                  <div className="inline-flex items-center gap-1 text-xs text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Secure Checkout
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t mt-16 py-8" style={{ borderColor: 'var(--store-primary)' }}>
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-600">
          <p>&copy; {new Date().getFullYear()} {seller.name}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
