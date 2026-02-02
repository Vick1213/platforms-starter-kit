'use client';

import { useState } from 'react';
import Image from 'next/image';
import { 
  Plus, Minus, Trash2, Send, Loader2, 
  DollarSign, Calendar, Truck, FileText 
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OfferProduct {
  productId: string;
  productName: string;
  productSlug: string;
  productImage?: string;
  quantity: number;
  originalPrice?: number;
  offeredPrice: number;
  unit?: string;
  notes?: string;
}

interface OfferFormProps {
  inquiryId: string;
  initialProducts?: OfferProduct[];
  onSuccess?: (offer: any) => void;
  onCancel?: () => void;
  primaryColor?: string;
}

export function OfferForm({
  inquiryId,
  initialProducts = [],
  onSuccess,
  onCancel,
  primaryColor = '#f97316',
}: OfferFormProps) {
  const [products, setProducts] = useState<OfferProduct[]>(
    initialProducts.length > 0 ? initialProducts : [{
      productId: '',
      productName: '',
      productSlug: '',
      quantity: 1,
      offeredPrice: 0,
    }]
  );
  const [shippingCost, setShippingCost] = useState(0);
  const [tax, setTax] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [validDays, setValidDays] = useState(7);
  const [paymentTerms, setPaymentTerms] = useState('');
  const [shippingTerms, setShippingTerms] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateProduct = (index: number, field: keyof OfferProduct, value: any) => {
    setProducts(prev => prev.map((p, i) => 
      i === index ? { ...p, [field]: value } : p
    ));
  };

  const removeProduct = (index: number) => {
    if (products.length > 1) {
      setProducts(prev => prev.filter((_, i) => i !== index));
    }
  };

  const addProduct = () => {
    setProducts(prev => [...prev, {
      productId: '',
      productName: '',
      productSlug: '',
      quantity: 1,
      offeredPrice: 0,
    }]);
  };

  const subtotal = products.reduce((sum, p) => sum + (p.offeredPrice * p.quantity), 0);
  const total = subtotal + shippingCost + tax - discount;

  const handleSubmit = async () => {
    // Validate
    const validProducts = products.filter(p => p.productName && p.offeredPrice > 0);
    if (validProducts.length === 0) {
      setError('Please add at least one product with a valid price');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inquiryId,
          items: validProducts.map(p => ({
            productId: p.productId || `manual-${Date.now()}`,
            productName: p.productName,
            productSlug: p.productSlug || p.productName.toLowerCase().replace(/\s+/g, '-'),
            productImage: p.productImage,
            quantity: p.quantity,
            originalPrice: p.originalPrice,
            offeredPrice: p.offeredPrice,
            unit: p.unit,
            notes: p.notes,
          })),
          shippingCost,
          tax,
          discount,
          validDays,
          paymentTerms,
          shippingTerms,
          deliveryTime,
          notes,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create offer');
      }

      const offer = await res.json();
      if (onSuccess) onSuccess(offer);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create offer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 pb-4 border-b">
        <FileText className="w-5 h-5" style={{ color: primaryColor }} />
        <h3 className="font-semibold text-lg">Create Offer</h3>
      </div>

      {/* Products */}
      <div className="space-y-4">
        <h4 className="font-medium">Products</h4>
        {products.map((product, index) => (
          <div key={index} className="p-4 border rounded-lg space-y-3">
            <div className="flex items-start justify-between">
              <span className="text-sm text-gray-500">Item #{index + 1}</span>
              {products.length > 1 && (
                <button
                  onClick={() => removeProduct(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Product Name *</label>
                <input
                  type="text"
                  value={product.productName}
                  onChange={(e) => updateProduct(index, 'productName', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="e.g., Industrial Widget"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Quantity *</label>
                <input
                  type="number"
                  value={product.quantity}
                  onChange={(e) => updateProduct(index, 'quantity', parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  min="1"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Unit</label>
                <input
                  type="text"
                  value={product.unit || ''}
                  onChange={(e) => updateProduct(index, 'unit', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="pcs, kg, etc."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Original Price</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                  <input
                    type="number"
                    value={product.originalPrice || ''}
                    onChange={(e) => updateProduct(index, 'originalPrice', parseFloat(e.target.value) || undefined)}
                    className="w-full pl-7 pr-3 py-2 border rounded-lg text-sm"
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Offered Price *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                  <input
                    type="number"
                    value={product.offeredPrice || ''}
                    onChange={(e) => updateProduct(index, 'offeredPrice', parseFloat(e.target.value) || 0)}
                    className="w-full pl-7 pr-3 py-2 border rounded-lg text-sm"
                    placeholder="0.00"
                    step="0.01"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-sm text-gray-600">Line Total:</span>
              <span className="font-semibold" style={{ color: primaryColor }}>
                ${(product.offeredPrice * product.quantity).toFixed(2)}
              </span>
            </div>
          </div>
        ))}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addProduct}
          className="w-full"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Another Product
        </Button>
      </div>

      {/* Additional Costs */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Shipping Cost</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
            <input
              type="number"
              value={shippingCost || ''}
              onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)}
              className="w-full pl-7 pr-3 py-2 border rounded-lg text-sm"
              placeholder="0.00"
              step="0.01"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Tax</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
            <input
              type="number"
              value={tax || ''}
              onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
              className="w-full pl-7 pr-3 py-2 border rounded-lg text-sm"
              placeholder="0.00"
              step="0.01"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Discount</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
            <input
              type="number"
              value={discount || ''}
              onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
              className="w-full pl-7 pr-3 py-2 border rounded-lg text-sm"
              placeholder="0.00"
              step="0.01"
            />
          </div>
        </div>
      </div>

      {/* Totals */}
      <div className="p-4 bg-gray-50 rounded-lg space-y-2">
        <div className="flex justify-between text-sm">
          <span>Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        {shippingCost > 0 && (
          <div className="flex justify-between text-sm">
            <span>Shipping</span>
            <span>${shippingCost.toFixed(2)}</span>
          </div>
        )}
        {tax > 0 && (
          <div className="flex justify-between text-sm">
            <span>Tax</span>
            <span>${tax.toFixed(2)}</span>
          </div>
        )}
        {discount > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Discount</span>
            <span>-${discount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-lg pt-2 border-t">
          <span>Total</span>
          <span style={{ color: primaryColor }}>${total.toFixed(2)}</span>
        </div>
      </div>

      {/* Terms */}
      <div className="space-y-4">
        <h4 className="font-medium">Terms & Conditions</h4>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              <Calendar className="w-4 h-4 inline mr-1" />
              Valid For (days)
            </label>
            <input
              type="number"
              value={validDays}
              onChange={(e) => setValidDays(parseInt(e.target.value) || 7)}
              className="w-full px-3 py-2 border rounded-lg text-sm"
              min="1"
              max="90"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">
              <Truck className="w-4 h-4 inline mr-1" />
              Delivery Time
            </label>
            <input
              type="text"
              value={deliveryTime}
              onChange={(e) => setDeliveryTime(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm"
              placeholder="e.g., 2-3 weeks"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">
            <DollarSign className="w-4 h-4 inline mr-1" />
            Payment Terms
          </label>
          <input
            type="text"
            value={paymentTerms}
            onChange={(e) => setPaymentTerms(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm"
            placeholder="e.g., 30% deposit, 70% before shipping"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Shipping Terms</label>
          <input
            type="text"
            value={shippingTerms}
            onChange={(e) => setShippingTerms(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm"
            placeholder="e.g., FOB Shanghai"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Additional Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm resize-none h-20"
            placeholder="Any additional information..."
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1"
          >
            Cancel
          </Button>
        )}
        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="flex-1 text-white"
          style={{ backgroundColor: primaryColor }}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Send className="w-4 h-4 mr-2" />
          )}
          Send Offer
        </Button>
      </div>
    </div>
  );
}
