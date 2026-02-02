'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ArrowLeft, Package, CheckCircle2, XCircle, Clock, 
  Loader2, MapPin, CreditCard, Shield, AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OfferItem {
  id: string;
  productName: string;
  productImage?: string;
  quantity: number;
  originalPrice?: number;
  offeredPrice: number;
  unit?: string;
  notes?: string;
}

interface Offer {
  id: string;
  offerNumber: string;
  sellerId: string;
  seller: {
    companyName: string;
    logo?: string;
    subdomain: string;
  };
  inquiryId: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED' | 'WITHDRAWN';
  items: OfferItem[];
  subtotal: number;
  shippingCost: number;
  tax: number;
  discount: number;
  total: number;
  validUntil?: string;
  paymentTerms?: string;
  shippingTerms?: string;
  deliveryTime?: string;
  notes?: string;
  createdAt: string;
}

interface ShippingAddress {
  name: string;
  company?: string;
  email: string;
  phone: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export default function AcceptOfferPage() {
  const params = useParams();
  const router = useRouter();
  const offerId = params.offerId as string;
  const subdomain = params.subdomain as string;

  const [offer, setOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [step, setStep] = useState<'review' | 'shipping' | 'confirm' | 'success'>('review');
  
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    name: '',
    company: '',
    email: '',
    phone: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
  });

  useEffect(() => {
    const fetchOffer = async () => {
      try {
        const res = await fetch(`/api/offers?id=${offerId}`);
        if (!res.ok) throw new Error('Offer not found');
        const data = await res.json();
        setOffer(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load offer');
      } finally {
        setLoading(false);
      }
    };

    fetchOffer();
  }, [offerId]);

  const handleAcceptOffer = async () => {
    if (!offer) return;

    // Validate shipping address
    const required: (keyof ShippingAddress)[] = ['name', 'email', 'phone', 'address1', 'city', 'state', 'postalCode', 'country'];
    const missing = required.filter(field => !shippingAddress[field]);
    if (missing.length > 0) {
      setError(`Please fill in: ${missing.join(', ')}`);
      return;
    }

    setAccepting(true);
    setError(null);

    try {
      const res = await fetch(`/api/offers/${offer.id}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shippingAddress }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to accept offer');
      }

      const { order, invoice } = await res.json();
      setStep('success');
      
      // Redirect to order confirmation after a short delay
      setTimeout(() => {
        router.push(`/store/${subdomain}/order-confirmation?orderId=${order.id}`);
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept offer');
    } finally {
      setAccepting(false);
    }
  };

  const isExpired = offer?.validUntil ? new Date(offer.validUntil) < new Date() : false;
  const canAccept = offer?.status === 'PENDING' && !isExpired;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (error && !offer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold mb-2">Offer Not Found</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link href={`/store/${subdomain}`}>
            <Button>Return to Store</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!offer) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <Link 
            href={`/store/${subdomain}`}
            className="inline-flex items-center text-sm text-gray-600 hover:text-orange-600 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Store
          </Link>
          <h1 className="text-2xl font-bold">
            {step === 'success' ? 'Order Confirmed!' : `Offer ${offer.offerNumber}`}
          </h1>
          <p className="text-gray-600">
            From {offer.seller.companyName}
          </p>
        </div>

        {/* Success State */}
        {step === 'success' && (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Offer Accepted!</h2>
            <p className="text-gray-600 mb-6">
              Your order has been created and the seller has been notified.
              You'll receive an invoice shortly.
            </p>
            <Loader2 className="w-6 h-6 animate-spin text-orange-500 mx-auto" />
            <p className="text-sm text-gray-500 mt-2">Redirecting to order confirmation...</p>
          </div>
        )}

        {/* Main Content */}
        {step !== 'success' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Offer Details / Shipping Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Status Banner */}
              {!canAccept && (
                <div className={`p-4 rounded-lg ${
                  offer.status === 'ACCEPTED' ? 'bg-green-50 border border-green-200' :
                  offer.status === 'DECLINED' ? 'bg-red-50 border border-red-200' :
                  isExpired ? 'bg-amber-50 border border-amber-200' :
                  'bg-gray-50 border border-gray-200'
                }`}>
                  <div className="flex items-center gap-2">
                    {offer.status === 'ACCEPTED' && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                    {offer.status === 'DECLINED' && <XCircle className="w-5 h-5 text-red-600" />}
                    {isExpired && <Clock className="w-5 h-5 text-amber-600" />}
                    <span className={`font-medium ${
                      offer.status === 'ACCEPTED' ? 'text-green-700' :
                      offer.status === 'DECLINED' ? 'text-red-700' :
                      isExpired ? 'text-amber-700' : 'text-gray-700'
                    }`}>
                      {offer.status === 'ACCEPTED' ? 'This offer has already been accepted' :
                       offer.status === 'DECLINED' ? 'This offer was declined' :
                       isExpired ? 'This offer has expired' :
                       `Offer status: ${offer.status}`}
                    </span>
                  </div>
                </div>
              )}

              {/* Review Step */}
              {step === 'review' && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-lg font-semibold mb-4">Offer Items</h2>
                  <div className="divide-y">
                    {offer.items.map((item) => (
                      <div key={item.id} className="py-4 flex gap-4">
                        {item.productImage ? (
                          <Image
                            src={item.productImage}
                            alt={item.productName}
                            width={80}
                            height={80}
                            className="rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Package className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="font-medium">{item.productName}</h3>
                          <p className="text-sm text-gray-500">
                            Qty: {item.quantity} {item.unit || 'pcs'}
                          </p>
                          {item.originalPrice && item.originalPrice > item.offeredPrice && (
                            <p className="text-sm text-gray-400 line-through">
                              ${item.originalPrice.toFixed(2)} each
                            </p>
                          )}
                          <p className="text-orange-600 font-medium">
                            ${item.offeredPrice.toFixed(2)} each
                          </p>
                          {item.notes && (
                            <p className="text-sm text-gray-500 mt-1">{item.notes}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            ${(item.offeredPrice * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Terms */}
                  {(offer.paymentTerms || offer.shippingTerms || offer.deliveryTime) && (
                    <div className="mt-6 pt-6 border-t">
                      <h3 className="font-medium mb-3">Terms & Conditions</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {offer.deliveryTime && (
                          <div>
                            <span className="text-gray-500">Delivery Time:</span>
                            <p className="font-medium">{offer.deliveryTime}</p>
                          </div>
                        )}
                        {offer.paymentTerms && (
                          <div>
                            <span className="text-gray-500">Payment Terms:</span>
                            <p className="font-medium">{offer.paymentTerms}</p>
                          </div>
                        )}
                        {offer.shippingTerms && (
                          <div>
                            <span className="text-gray-500">Shipping Terms:</span>
                            <p className="font-medium">{offer.shippingTerms}</p>
                          </div>
                        )}
                        {offer.validUntil && (
                          <div>
                            <span className="text-gray-500">Valid Until:</span>
                            <p className="font-medium">
                              {new Date(offer.validUntil).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {offer.notes && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                      {offer.notes}
                    </div>
                  )}
                </div>
              )}

              {/* Shipping Step */}
              {step === 'shipping' && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-orange-500" />
                    Shipping Address
                  </h2>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-sm font-medium mb-1">Full Name *</label>
                      <input
                        type="text"
                        value={shippingAddress.name}
                        onChange={(e) => setShippingAddress(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-lg"
                        required
                      />
                    </div>
                    
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-sm font-medium mb-1">Company</label>
                      <input
                        type="text"
                        value={shippingAddress.company || ''}
                        onChange={(e) => setShippingAddress(prev => ({ ...prev, company: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-sm font-medium mb-1">Email *</label>
                      <input
                        type="email"
                        value={shippingAddress.email}
                        onChange={(e) => setShippingAddress(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-lg"
                        required
                      />
                    </div>
                    
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-sm font-medium mb-1">Phone *</label>
                      <input
                        type="tel"
                        value={shippingAddress.phone}
                        onChange={(e) => setShippingAddress(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-lg"
                        required
                      />
                    </div>
                    
                    <div className="col-span-2">
                      <label className="block text-sm font-medium mb-1">Address Line 1 *</label>
                      <input
                        type="text"
                        value={shippingAddress.address1}
                        onChange={(e) => setShippingAddress(prev => ({ ...prev, address1: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-lg"
                        placeholder="Street address"
                        required
                      />
                    </div>
                    
                    <div className="col-span-2">
                      <label className="block text-sm font-medium mb-1">Address Line 2</label>
                      <input
                        type="text"
                        value={shippingAddress.address2 || ''}
                        onChange={(e) => setShippingAddress(prev => ({ ...prev, address2: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-lg"
                        placeholder="Apt, suite, unit, etc."
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">City *</label>
                      <input
                        type="text"
                        value={shippingAddress.city}
                        onChange={(e) => setShippingAddress(prev => ({ ...prev, city: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-lg"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">State/Province *</label>
                      <input
                        type="text"
                        value={shippingAddress.state}
                        onChange={(e) => setShippingAddress(prev => ({ ...prev, state: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-lg"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Postal Code *</label>
                      <input
                        type="text"
                        value={shippingAddress.postalCode}
                        onChange={(e) => setShippingAddress(prev => ({ ...prev, postalCode: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-lg"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Country *</label>
                      <input
                        type="text"
                        value={shippingAddress.country}
                        onChange={(e) => setShippingAddress(prev => ({ ...prev, country: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-lg"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Confirm Step */}
              {step === 'confirm' && (
                <div className="space-y-6">
                  {/* Order Summary */}
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
                    <div className="divide-y">
                      {offer.items.map((item) => (
                        <div key={item.id} className="py-3 flex justify-between">
                          <span className="text-gray-600">
                            {item.productName} × {item.quantity}
                          </span>
                          <span className="font-medium">
                            ${(item.offeredPrice * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Shipping Address Review */}
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-orange-500" />
                      Shipping To
                    </h2>
                    <div className="text-gray-600">
                      <p className="font-medium text-gray-900">{shippingAddress.name}</p>
                      {shippingAddress.company && <p>{shippingAddress.company}</p>}
                      <p>{shippingAddress.address1}</p>
                      {shippingAddress.address2 && <p>{shippingAddress.address2}</p>}
                      <p>{shippingAddress.city}, {shippingAddress.state} {shippingAddress.postalCode}</p>
                      <p>{shippingAddress.country}</p>
                      <p className="mt-2">{shippingAddress.email}</p>
                      <p>{shippingAddress.phone}</p>
                    </div>
                    <button
                      onClick={() => setStep('shipping')}
                      className="text-sm text-orange-600 hover:underline mt-3"
                    >
                      Edit Address
                    </button>
                  </div>

                  {/* Security Note */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                    <Shield className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-green-700">
                      <p className="font-medium">Secure Transaction</p>
                      <p>Your order details are protected. The seller will send you an invoice for payment.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  {error}
                </div>
              )}
            </div>

            {/* Right: Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm p-6 sticky top-4">
                <h2 className="text-lg font-semibold mb-4">Order Total</h2>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span>${offer.subtotal.toFixed(2)}</span>
                  </div>
                  
                  {offer.shippingCost > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shipping</span>
                      <span>${offer.shippingCost.toFixed(2)}</span>
                    </div>
                  )}
                  
                  {offer.tax > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tax</span>
                      <span>${offer.tax.toFixed(2)}</span>
                    </div>
                  )}
                  
                  {offer.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-${offer.discount.toFixed(2)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-lg font-bold pt-3 border-t">
                    <span>Total</span>
                    <span className="text-orange-600">${offer.total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Navigation Buttons */}
                {canAccept && (
                  <div className="mt-6 space-y-3">
                    {step === 'review' && (
                      <Button
                        onClick={() => setStep('shipping')}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                      >
                        Continue to Shipping
                      </Button>
                    )}
                    
                    {step === 'shipping' && (
                      <>
                        <Button
                          onClick={() => setStep('confirm')}
                          className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                        >
                          Review Order
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setStep('review')}
                          className="w-full"
                        >
                          Back to Items
                        </Button>
                      </>
                    )}
                    
                    {step === 'confirm' && (
                      <>
                        <Button
                          onClick={handleAcceptOffer}
                          disabled={accepting}
                          className="w-full bg-green-600 hover:bg-green-700 text-white"
                        >
                          {accepting ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Accept Offer & Place Order
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setStep('shipping')}
                          className="w-full"
                          disabled={accepting}
                        >
                          Back to Shipping
                        </Button>
                      </>
                    )}
                  </div>
                )}

                {/* Seller Info */}
                <div className="mt-6 pt-6 border-t">
                  <p className="text-sm text-gray-500 mb-2">Sold by</p>
                  <div className="flex items-center gap-3">
                    {offer.seller.logo ? (
                      <Image
                        src={offer.seller.logo}
                        alt={offer.seller.companyName}
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                        <Package className="w-5 h-5 text-orange-500" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-sm">{offer.seller.companyName}</p>
                      <Link 
                        href={`/store/${offer.seller.subdomain}`}
                        className="text-xs text-orange-600 hover:underline"
                      >
                        View Store
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
