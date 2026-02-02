'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  StoreCustomization, 
  defaultStoreCustomization, 
  mergeWithDefaults 
} from '@/lib/store-customization-types';
import { Order } from '@/lib/cart-types';

interface Seller {
  id: string;
  name: string;
  subdomain: string;
}

function OrderConfirmationContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const subdomain = params.subdomain as string;
  const orderNumber = searchParams.get('order');

  const [seller, setSeller] = useState<Seller | null>(null);
  const [customization, setCustomization] = useState<StoreCustomization>(defaultStoreCustomization);
  const [order, setOrder] = useState<Order | null>(null);
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

        // Fetch order
        if (orderNumber) {
          const orderRes = await fetch(`/api/orders?subdomain=${subdomain}&orderNumber=${orderNumber}`);
          if (orderRes.ok) {
            const orderData = await orderRes.json();
            setOrder(orderData);
          }
        }

        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
        setLoading(false);
      }
    }

    fetchData();
  }, [subdomain, orderNumber]);

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
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--store-text)' }}>Error</h1>
          <p className="text-gray-600">{error || 'Store not found'}</p>
        </div>
      </div>
    );
  }

  const paymentMethodLabels: Record<string, string> = {
    'inquiry': 'Request for Quote',
    'bank-transfer': 'Bank Transfer (T/T)',
    'paypal': 'PayPal',
    'credit-card': 'Credit Card',
    'cash-on-delivery': 'Cash on Delivery',
  };

  return (
    <div className="min-h-screen bg-gray-50" style={{ color: 'var(--store-text, #1a1a1a)' }}>
      {/* Header */}
      <header className="bg-white border-b" style={{ borderColor: 'var(--store-primary)' }}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3">
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
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-12">
        {/* Success Banner */}
        <div className="text-center mb-8">
          <div
            className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center text-white"
            style={{ backgroundColor: 'var(--store-primary)' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-2">Thank You for Your Order!</h1>
          {order && (
            <p className="text-gray-600">
              Order #{order.orderNumber} has been placed successfully.
            </p>
          )}
        </div>

        {order ? (
          <div className="space-y-6">
            {/* Order Status */}
            <div className="bg-white rounded-lg border p-6">
              <h2 className="font-bold mb-4">Order Status</h2>
              <div className="flex items-center gap-4">
                <span
                  className="px-3 py-1 rounded-full text-sm font-medium capitalize"
                  style={{
                    backgroundColor: order.status === 'pending' ? '#FEF3C7' : '#D1FAE5',
                    color: order.status === 'pending' ? '#92400E' : '#065F46',
                  }}
                >
                  {order.status}
                </span>
                <span className="text-sm text-gray-600">
                  {order.paymentMethod === 'inquiry' 
                    ? 'We will contact you with pricing details shortly.'
                    : `Payment: ${order.paymentStatus}`
                  }
                </span>
              </div>
            </div>

            {/* Order Details */}
            <div className="bg-white rounded-lg border p-6">
              <h2 className="font-bold mb-4">Order Details</h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Order Number</h3>
                  <p className="font-mono">{order.orderNumber}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Date</h3>
                  <p>{new Date(order.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Payment Method</h3>
                  <p>{paymentMethodLabels[order.paymentMethod] || order.paymentMethod}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Total</h3>
                  <p className="font-bold" style={{ color: 'var(--store-primary)' }}>${order.total.toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="bg-white rounded-lg border p-6">
              <h2 className="font-bold mb-4">Items Ordered</h2>
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                      {item.image && (
                        <Image
                          src={item.image}
                          alt={item.name}
                          width={64}
                          height={64}
                          className="object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-600">Qty: {item.quantity} × ${item.price.toFixed(2)}</p>
                    </div>
                    <p className="font-medium">${item.subtotal.toFixed(2)}</p>
                  </div>
                ))}
              </div>
              
              <div className="border-t mt-4 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span>${order.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax</span>
                  <span>${order.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span>{order.shippingCost > 0 ? `$${order.shippingCost.toFixed(2)}` : 'TBD'}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total</span>
                  <span style={{ color: 'var(--store-primary)' }}>${order.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-lg border p-6">
              <h2 className="font-bold mb-4">Shipping Address</h2>
              <p>{order.shippingAddress.fullName}</p>
              {order.shippingAddress.company && <p>{order.shippingAddress.company}</p>}
              <p>{order.shippingAddress.addressLine1}</p>
              {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
              <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
              <p>{order.shippingAddress.country}</p>
              <p className="mt-2 text-sm text-gray-600">
                {order.shippingAddress.email} • {order.shippingAddress.phone}
              </p>
            </div>

            {/* Customer Notes */}
            {order.notes && (
              <div className="bg-white rounded-lg border p-6">
                <h2 className="font-bold mb-2">Order Notes</h2>
                <p className="text-gray-600">{order.notes}</p>
              </div>
            )}

            {/* What's Next */}
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
              <h2 className="font-bold text-blue-900 mb-3">What Happens Next?</h2>
              {order.paymentMethod === 'inquiry' ? (
                <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
                  <li>Our team will review your order and prepare a detailed quote.</li>
                  <li>You'll receive an email at {order.customerEmail} with pricing and payment options.</li>
                  <li>Once payment is confirmed, we'll begin processing your order.</li>
                  <li>You'll receive shipping updates via email.</li>
                </ol>
              ) : (
                <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
                  <li>You'll receive an order confirmation email at {order.customerEmail}.</li>
                  <li>Complete payment using the selected payment method.</li>
                  <li>We'll process and ship your order within 2-3 business days.</li>
                  <li>You'll receive tracking information once shipped.</li>
                </ol>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/"
                className="flex-1 text-center py-3 rounded-lg font-medium border"
                style={{ borderColor: 'var(--store-primary)', color: 'var(--store-primary)' }}
              >
                Continue Shopping
              </Link>
              <button
                onClick={() => window.print()}
                className="flex-1 py-3 rounded-lg text-white font-medium"
                style={{ backgroundColor: 'var(--store-primary)' }}
              >
                Print Order
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-6">Order details not found. Please check your email for confirmation.</p>
            <Link
              href="/"
              className="inline-block px-8 py-3 rounded-lg text-white font-medium"
              style={{ backgroundColor: 'var(--store-primary)' }}
            >
              Continue Shopping
            </Link>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t mt-16 py-8" style={{ borderColor: 'var(--store-primary)' }}>
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-600">
          <p>&copy; {new Date().getFullYear()} {seller?.name || 'Store'}. All rights reserved.</p>
          <p className="mt-2">
            Questions about your order? <Link href="/contact" className="underline" style={{ color: 'var(--store-primary)' }}>Contact us</Link>
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 rounded-full border-t-transparent" />
      </div>
    }>
      <OrderConfirmationContent />
    </Suspense>
  );
}
