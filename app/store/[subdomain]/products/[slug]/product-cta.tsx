'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, MessageCircle, Loader2, Check, Minus, Plus, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';

type PurchaseMode = 'DIRECT' | 'ENQUIRY_ONLY' | 'BOTH';

interface ProductCTAProps {
  subdomain: string;
  productId: string;
  productSlug: string;
  productName: string;
  productImage?: string;
  price: number;
  minOrderQuantity?: number;
  primaryColor?: string;
  purchaseMode?: PurchaseMode;
  sellerId: string;
  sellerName: string;
}

export function ProductCTA({
  subdomain,
  productId,
  productSlug,
  productName,
  productImage,
  price,
  minOrderQuantity = 1,
  primaryColor = '#f97316',
  purchaseMode = 'BOTH',
  sellerId,
  sellerName,
}: ProductCTAProps) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(minOrderQuantity);
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInquiryForm, setShowInquiryForm] = useState(false);
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [inquirySent, setInquirySent] = useState(false);

  const canAddToCart = purchaseMode === 'DIRECT' || purchaseMode === 'BOTH';
  const canInquire = purchaseMode === 'ENQUIRY_ONLY' || purchaseMode === 'BOTH';

  const handleAddToCart = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subdomain,
          productId,
          productSlug,
          name: productName,
          price,
          quantity,
          image: productImage,
          moq: minOrderQuantity,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to add to cart');
      }

      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add to cart');
    } finally {
      setLoading(false);
    }
  };

  const handleSendInquiry = async () => {
    if (!inquiryMessage.trim()) {
      setError('Please enter a message');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sellerId,
          productId,
          productName,
          productImage,
          quantity,
          message: inquiryMessage,
          subject: `Inquiry about ${productName}`,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send inquiry');
      }

      setInquirySent(true);
      setInquiryMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send inquiry');
    } finally {
      setLoading(false);
    }
  };

  const goToCart = () => {
    router.push('/cart');
  };

  // Enquiry-only mode
  if (purchaseMode === 'ENQUIRY_ONLY') {
    return (
      <div className="space-y-4">
        <div className="p-4 rounded-lg border-2 border-dashed" style={{ borderColor: primaryColor + '40' }}>
          <div className="flex items-center gap-2 mb-3">
            <MessageCircle className="w-5 h-5" style={{ color: primaryColor }} />
            <span className="font-semibold" style={{ color: primaryColor }}>
              Contact Seller for Pricing
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            This product requires a custom quote. Send an inquiry and the seller will provide a personalized offer.
          </p>
          
          {/* Quantity Selector */}
          <div className="flex items-center gap-4 mb-4">
            <span className="text-sm font-medium">Quantity:</span>
            <div className="flex items-center border rounded-lg">
              <button
                onClick={() => setQuantity(q => Math.max(minOrderQuantity, q - 1))}
                disabled={quantity <= minOrderQuantity}
                className="p-2 hover:bg-gray-100 disabled:opacity-50 rounded-l-lg"
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(minOrderQuantity, parseInt(e.target.value) || minOrderQuantity))}
                className="w-16 text-center border-x py-2 focus:outline-none"
                min={minOrderQuantity}
              />
              <button
                onClick={() => setQuantity(q => q + 1)}
                className="p-2 hover:bg-gray-100 rounded-r-lg"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {minOrderQuantity > 1 && (
              <span className="text-xs text-orange-600">
                MOQ: {minOrderQuantity}
              </span>
            )}
          </div>

          {inquirySent ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg">
                <Check className="w-5 h-5" />
                <span>Inquiry sent! The seller will respond soon.</span>
              </div>
              <a
                href="https://supplyme.asia/messages"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center py-2 px-4 rounded-lg border text-sm font-medium transition-colors hover:bg-gray-50"
                style={{ borderColor: primaryColor, color: primaryColor }}
              >
                View Messages →
              </a>
            </div>
          ) : (
            <>
              <textarea
                value={inquiryMessage}
                onChange={(e) => setInquiryMessage(e.target.value)}
                placeholder={`Hi, I'm interested in ${productName}. I would like to request a quote for ${quantity} units...`}
                className="w-full p-3 border rounded-lg resize-none h-24 text-sm"
                style={{ borderColor: '#e5e7eb' }}
              />
              <Button
                onClick={handleSendInquiry}
                disabled={loading}
                className="w-full mt-3 text-white"
                style={{ backgroundColor: primaryColor }}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Request Quote
              </Button>
            </>
          )}
        </div>
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }

  // Direct or Both modes
  return (
    <div className="space-y-4">
      {/* Quantity Selector */}
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium">Quantity:</span>
        <div className="flex items-center border rounded-lg">
          <button
            onClick={() => setQuantity(q => Math.max(minOrderQuantity, q - 1))}
            disabled={quantity <= minOrderQuantity}
            className="p-2 hover:bg-gray-100 disabled:opacity-50 rounded-l-lg"
          >
            <Minus className="w-4 h-4" />
          </button>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(Math.max(minOrderQuantity, parseInt(e.target.value) || minOrderQuantity))}
            className="w-16 text-center border-x py-2 focus:outline-none"
            min={minOrderQuantity}
          />
          <button
            onClick={() => setQuantity(q => q + 1)}
            className="p-2 hover:bg-gray-100 rounded-r-lg"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        {minOrderQuantity > 1 && (
          <span className="text-xs text-orange-600">
            MOQ: {minOrderQuantity}
          </span>
        )}
      </div>

      {/* Subtotal */}
      {price > 0 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Subtotal:</span>
          <span className="font-semibold">${(price * quantity).toFixed(2)}</span>
        </div>
      )}

      {/* Add to Cart / Buy Now */}
      {canAddToCart && (
        <div className="flex gap-3">
          <Button
            onClick={handleAddToCart}
            disabled={loading || added}
            variant="outline"
            className="flex-1"
            style={{ borderColor: primaryColor, color: primaryColor }}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : added ? (
              <Check className="w-4 h-4 mr-2" />
            ) : (
              <ShoppingCart className="w-4 h-4 mr-2" />
            )}
            {added ? 'Added!' : 'Add to Cart'}
          </Button>
          
          <Button
            onClick={() => {
              handleAddToCart().then(() => {
                router.push('/checkout');
              });
            }}
            disabled={loading}
            className="flex-1 text-white"
            style={{ backgroundColor: primaryColor }}
          >
            Buy Now
          </Button>
        </div>
      )}

      {/* View Cart Link */}
      {added && (
        <button
          onClick={goToCart}
          className="w-full text-center text-sm underline"
          style={{ color: primaryColor }}
        >
          View Cart →
        </button>
      )}

      {/* Inquiry Option for BOTH mode */}
      {purchaseMode === 'BOTH' && (
        <>
          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">
                or negotiate a custom price
              </span>
            </div>
          </div>

          {showInquiryForm ? (
            <div className="p-4 border rounded-lg" style={{ borderColor: '#e5e7eb' }}>
              {inquirySent ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg">
                    <Check className="w-5 h-5" />
                    <span>Inquiry sent! The seller will send you an offer.</span>
                  </div>
                  <a
                    href="https://supplyme.asia/messages"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-center py-2 px-4 rounded-lg border text-sm font-medium transition-colors hover:bg-gray-50"
                    style={{ borderColor: primaryColor, color: primaryColor }}
                  >
                    View Messages →
                  </a>
                </div>
              ) : (
                <>
                  <textarea
                    value={inquiryMessage}
                    onChange={(e) => setInquiryMessage(e.target.value)}
                    placeholder={`Hi, I'm interested in ${productName} for ${quantity} units. Can you offer a better price?`}
                    className="w-full p-3 border rounded-lg resize-none h-20 text-sm"
                  />
                  <div className="flex gap-2 mt-2">
                    <Button
                      onClick={() => setShowInquiryForm(false)}
                      variant="outline"
                      size="sm"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSendInquiry}
                      disabled={loading}
                      size="sm"
                      className="text-white"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Send Inquiry
                    </Button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Button
              onClick={() => setShowInquiryForm(true)}
              variant="outline"
              className="w-full"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Request Custom Quote
            </Button>
          )}
        </>
      )}

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
