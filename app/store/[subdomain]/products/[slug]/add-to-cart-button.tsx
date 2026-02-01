'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Loader2, Check, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AddToCartButtonProps {
  subdomain: string;
  productId: string;
  productSlug: string;
  productName: string;
  productImage?: string;
  price: number;
  minOrderQuantity?: number;
  primaryColor?: string;
}

export function AddToCartButton({
  subdomain,
  productId,
  productSlug,
  productName,
  productImage,
  price,
  minOrderQuantity = 1,
  primaryColor = '#f97316',
}: AddToCartButtonProps) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(minOrderQuantity);
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          minOrderQuantity,
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

  const goToCart = () => {
    router.push(`/store/${subdomain}/cart`);
  };

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
            (Min: {minOrderQuantity})
          </span>
        )}
      </div>

      {/* Total */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
        <span className="text-sm">Total:</span>
        <span className="text-lg font-bold" style={{ color: primaryColor }}>
          ${(price * quantity).toFixed(2)}
        </span>
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-red-600 text-sm">{error}</p>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          onClick={handleAddToCart}
          disabled={loading}
          className="flex-1 text-white"
          style={{ backgroundColor: primaryColor }}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : added ? (
            <Check className="w-4 h-4 mr-2" />
          ) : (
            <ShoppingCart className="w-4 h-4 mr-2" />
          )}
          {loading ? 'Adding...' : added ? 'Added!' : 'Add to Cart'}
        </Button>
        
        <Button
          onClick={goToCart}
          variant="outline"
          className="flex-1"
          style={{ borderColor: primaryColor, color: primaryColor }}
        >
          View Cart
        </Button>
      </div>
    </div>
  );
}
