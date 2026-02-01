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
import { Cart, PaymentMethod, calculateCartTotals } from '@/lib/cart-types';

interface Seller {
  id: string;
  name: string;
  subdomain: string;
}

type CheckoutStep = 'shipping' | 'payment' | 'review';

interface ShippingForm {
  fullName: string;
  email: string;
  phone: string;
  company: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const subdomain = params.subdomain as string;

  const [seller, setSeller] = useState<Seller | null>(null);
  const [customization, setCustomization] = useState<StoreCustomization>(defaultStoreCustomization);
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('shipping');
  
  const [shippingAddress, setShippingAddress] = useState<ShippingForm>({
    fullName: '', email: '', phone: '', company: '',
    addressLine1: '', addressLine2: '', city: '', state: '', postalCode: '', country: 'US',
  });
  const [sameAsBilling, setSameAsBilling] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('inquiry');
  const [customerNotes, setCustomerNotes] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const sellerRes = await fetch(`/api/seller/profile?subdomain=${subdomain}`);
        if (!sellerRes.ok) throw new Error('Store not found');
        setSeller(await sellerRes.json());

        const customRes = await fetch(`/api/seller/customization?subdomain=${subdomain}`);
        if (customRes.ok) setCustomization(mergeWithDefaults(await customRes.json()));

        const cartRes = await fetch(`/api/cart?subdomain=${subdomain}`);
        if (cartRes.ok) {
          const cartData = await cartRes.json();
          setCart(cartData);
          if (!cartData?.items?.length) {
            router.push(`/store/${subdomain}/cart`);
            return;
          }
        }
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
        setLoading(false);
      }
    }
    fetchData();
  }, [subdomain, router]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--store-primary', customization.colors.primary);
    root.style.setProperty('--store-background', customization.colors.background);
    root.style.setProperty('--store-text', customization.colors.text);
  }, [customization.colors]);

  const validateShipping = () => {
    return shippingAddress.fullName && shippingAddress.email && shippingAddress.phone &&
           shippingAddress.addressLine1 && shippingAddress.city && shippingAddress.state &&
           shippingAddress.postalCode && shippingAddress.country;
  };

  const handleSubmitOrder = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subdomain,
          shippingAddress,
          billingAddress: sameAsBilling ? shippingAddress : shippingAddress,
          paymentMethod,
          customerNotes,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to create order');
      const order = await res.json();
      router.push(`/store/${subdomain}/order-confirmation?order=${order.orderNumber}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create order');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 rounded-full" style={{ borderColor: 'var(--store-primary)', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  if (error && !cart) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Error</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  const totals = cart ? calculateCartTotals(cart.items) : { subtotal: 0, tax: 0, total: 0, shippingCost: 0, itemCount: 0 };
  const cartItems = cart?.items || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b py-4">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <Link href={`/store/${subdomain}`} className="flex items-center space-x-3">
            {customization.logo ? (
              <Image src={customization.logo} alt={seller?.name || 'Store'} width={40} height={40} className="object-contain" />
            ) : (
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold" style={{ backgroundColor: 'var(--store-primary)' }}>
                {seller?.name?.charAt(0) || 'S'}
              </div>
            )}
            <span className="font-bold text-xl">{seller?.name || 'Store'}</span>
          </Link>
          <Link href={`/store/${subdomain}/cart`} className="text-sm hover:underline" style={{ color: 'var(--store-primary)' }}>
            ← Return to Cart
          </Link>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="bg-white border-b py-4">
        <div className="max-w-3xl mx-auto px-4 flex items-center justify-center gap-8">
          {['shipping', 'payment', 'review'].map((step, i) => (
            <div key={step} className="flex items-center">
              <span
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm mr-2 ${
                  currentStep === step ? 'text-white' : 
                  ['shipping', 'payment', 'review'].indexOf(currentStep) > i ? 'bg-green-100 text-green-600' : 'bg-gray-200'
                }`}
                style={currentStep === step ? { backgroundColor: 'var(--store-primary)' } : {}}
              >
                {['shipping', 'payment', 'review'].indexOf(currentStep) > i ? '✓' : i + 1}
              </span>
              <span className={currentStep === step ? 'font-bold' : 'text-gray-400'}>
                {step.charAt(0).toUpperCase() + step.slice(1)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">{error}</div>}

            {/* Shipping Step */}
            {currentStep === 'shipping' && (
              <div className="bg-white rounded-lg border p-6">
                <h2 className="text-xl font-bold mb-6">Shipping Information</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">Full Name *</label>
                    <input type="text" value={shippingAddress.fullName} onChange={(e) => setShippingAddress(prev => ({ ...prev, fullName: e.target.value }))} className="w-full px-3 py-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Email *</label>
                    <input type="email" value={shippingAddress.email} onChange={(e) => setShippingAddress(prev => ({ ...prev, email: e.target.value }))} className="w-full px-3 py-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Phone *</label>
                    <input type="tel" value={shippingAddress.phone} onChange={(e) => setShippingAddress(prev => ({ ...prev, phone: e.target.value }))} className="w-full px-3 py-2 border rounded-lg" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">Company</label>
                    <input type="text" value={shippingAddress.company} onChange={(e) => setShippingAddress(prev => ({ ...prev, company: e.target.value }))} className="w-full px-3 py-2 border rounded-lg" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">Address *</label>
                    <input type="text" value={shippingAddress.addressLine1} onChange={(e) => setShippingAddress(prev => ({ ...prev, addressLine1: e.target.value }))} className="w-full px-3 py-2 border rounded-lg" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">Address Line 2</label>
                    <input type="text" value={shippingAddress.addressLine2} onChange={(e) => setShippingAddress(prev => ({ ...prev, addressLine2: e.target.value }))} className="w-full px-3 py-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">City *</label>
                    <input type="text" value={shippingAddress.city} onChange={(e) => setShippingAddress(prev => ({ ...prev, city: e.target.value }))} className="w-full px-3 py-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">State *</label>
                    <input type="text" value={shippingAddress.state} onChange={(e) => setShippingAddress(prev => ({ ...prev, state: e.target.value }))} className="w-full px-3 py-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Postal Code *</label>
                    <input type="text" value={shippingAddress.postalCode} onChange={(e) => setShippingAddress(prev => ({ ...prev, postalCode: e.target.value }))} className="w-full px-3 py-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Country *</label>
                    <select value={shippingAddress.country} onChange={(e) => setShippingAddress(prev => ({ ...prev, country: e.target.value }))} className="w-full px-3 py-2 border rounded-lg">
                      <option value="US">United States</option>
                      <option value="CA">Canada</option>
                      <option value="GB">United Kingdom</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => { if (validateShipping()) { setCurrentStep('payment'); setError(null); } else { setError('Please fill all required fields'); }}}
                    className="px-6 py-2 rounded-lg text-white font-medium"
                    style={{ backgroundColor: 'var(--store-primary)' }}
                  >
                    Continue to Payment
                  </button>
                </div>
              </div>
            )}

            {/* Payment Step */}
            {currentStep === 'payment' && (
              <div className="bg-white rounded-lg border p-6">
                <h2 className="text-xl font-bold mb-6">Payment Method</h2>
                <div className="space-y-4">
                  {[
                    { value: 'inquiry' as const, label: 'Request for Quote', desc: 'Seller will contact you with pricing.' },
                    { value: 'bank-transfer' as const, label: 'Bank Transfer', desc: 'Pay via wire transfer.' },
                    { value: 'paypal' as const, label: 'PayPal', desc: 'Pay securely with PayPal.' },
                    { value: 'credit-card' as const, label: 'Credit Card', desc: 'Pay with card.' },
                  ].map(opt => (
                    <label key={opt.value} className="flex items-start p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input type="radio" checked={paymentMethod === opt.value} onChange={() => setPaymentMethod(opt.value)} className="mt-0.5 mr-3" />
                      <div>
                        <p className="font-medium">{opt.label}</p>
                        <p className="text-sm text-gray-600">{opt.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
                <div className="mt-8">
                  <label className="flex items-center">
                    <input type="checkbox" checked={sameAsBilling} onChange={(e) => setSameAsBilling(e.target.checked)} className="mr-2" />
                    <span className="text-sm">Billing address same as shipping</span>
                  </label>
                </div>
                <div className="mt-6 flex justify-between">
                  <button onClick={() => setCurrentStep('shipping')} className="px-6 py-2 border rounded-lg">← Back</button>
                  <button onClick={() => setCurrentStep('review')} className="px-6 py-2 rounded-lg text-white font-medium" style={{ backgroundColor: 'var(--store-primary)' }}>Review Order</button>
                </div>
              </div>
            )}

            {/* Review Step */}
            {currentStep === 'review' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg border p-6">
                  <div className="flex justify-between mb-4">
                    <h3 className="font-bold">Shipping Address</h3>
                    <button onClick={() => setCurrentStep('shipping')} className="text-sm hover:underline" style={{ color: 'var(--store-primary)' }}>Edit</button>
                  </div>
                  <p>{shippingAddress.fullName}</p>
                  {shippingAddress.company && <p>{shippingAddress.company}</p>}
                  <p>{shippingAddress.addressLine1}</p>
                  {shippingAddress.addressLine2 && <p>{shippingAddress.addressLine2}</p>}
                  <p>{shippingAddress.city}, {shippingAddress.state} {shippingAddress.postalCode}</p>
                  <p className="mt-2 text-sm text-gray-600">{shippingAddress.email} • {shippingAddress.phone}</p>
                </div>
                <div className="bg-white rounded-lg border p-6">
                  <div className="flex justify-between mb-4">
                    <h3 className="font-bold">Payment</h3>
                    <button onClick={() => setCurrentStep('payment')} className="text-sm hover:underline" style={{ color: 'var(--store-primary)' }}>Edit</button>
                  </div>
                  <p className="capitalize">{paymentMethod.replace('-', ' ')}</p>
                </div>
                <div className="bg-white rounded-lg border p-6">
                  <h3 className="font-bold mb-4">Items</h3>
                  {cartItems.map(item => (
                    <div key={item.id} className="flex gap-4 py-2">
                      <div className="w-16 h-16 bg-gray-100 rounded">
                        {item.image && <Image src={item.image} alt={item.name} width={64} height={64} className="object-cover rounded" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-600">Qty: {item.quantity} × ${item.price.toFixed(2)}</p>
                      </div>
                      <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-white rounded-lg border p-6">
                  <h3 className="font-bold mb-4">Notes (Optional)</h3>
                  <textarea value={customerNotes} onChange={(e) => setCustomerNotes(e.target.value)} className="w-full px-3 py-2 border rounded-lg" rows={3} placeholder="Special instructions..." />
                </div>
                <div className="flex justify-between">
                  <button onClick={() => setCurrentStep('payment')} className="px-6 py-2 border rounded-lg">← Back</button>
                  <button onClick={handleSubmitOrder} disabled={submitting} className="px-8 py-3 rounded-lg text-white font-medium disabled:opacity-50" style={{ backgroundColor: 'var(--store-primary)' }}>
                    {submitting ? 'Placing Order...' : 'Place Order'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border p-6 sticky top-6">
              <h2 className="text-lg font-bold mb-4">Order Summary</h2>
              <div className="space-y-3 mb-4">
                {cartItems.map(item => (
                  <div key={item.id} className="flex gap-3">
                    <div className="w-12 h-12 bg-gray-100 rounded relative">
                      {item.image && <Image src={item.image} alt={item.name} fill className="object-cover rounded" />}
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-gray-600 text-white text-xs rounded-full flex items-center justify-center">{item.quantity}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-xs text-gray-600">${item.price.toFixed(2)}</p>
                    </div>
                    <p className="text-sm font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>
              <div className="border-t pt-4 space-y-2 text-sm">
                <div className="flex justify-between"><span>Subtotal</span><span>${totals.subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Shipping</span><span>{totals.shippingCost > 0 ? `$${totals.shippingCost.toFixed(2)}` : 'Free'}</span></div>
                <div className="flex justify-between"><span>Tax</span><span>${totals.tax.toFixed(2)}</span></div>
              </div>
              <div className="border-t mt-4 pt-4 flex justify-between text-lg font-bold">
                <span>Total</span>
                <span style={{ color: 'var(--store-primary)' }}>${totals.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
