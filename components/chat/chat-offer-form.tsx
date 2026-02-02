'use client';

import { useState } from 'react';
import { 
  Plus, Minus, Trash2, Send, Loader2, 
  DollarSign, Calendar, Truck, FileText, Package
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface OfferItem {
  productId: string;
  productName: string;
  productImage?: string;
  quantity: number;
  offeredPrice: number;
  unit?: string;
  notes?: string;
}

interface ChatOfferFormProps {
  conversationId: string;
  initialProduct?: {
    productId: string;
    productName: string;
    productImage?: string;
  };
  buyerName?: string;
  onSuccess?: (offer: any) => void;
  onCancel?: () => void;
}

export function ChatOfferForm({
  conversationId,
  initialProduct,
  buyerName = 'Customer',
  onSuccess,
  onCancel,
}: ChatOfferFormProps) {
  const [items, setItems] = useState<OfferItem[]>(
    initialProduct ? [{
      productId: initialProduct.productId,
      productName: initialProduct.productName,
      productImage: initialProduct.productImage,
      quantity: 1,
      offeredPrice: 0,
    }] : [{
      productId: '',
      productName: '',
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

  const updateItem = (index: number, field: keyof OfferItem, value: any) => {
    setItems(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(prev => prev.filter((_, i) => i !== index));
    }
  };

  const addItem = () => {
    setItems(prev => [...prev, {
      productId: '',
      productName: '',
      quantity: 1,
      offeredPrice: 0,
    }]);
  };

  const subtotal = items.reduce((sum, item) => sum + (item.offeredPrice * item.quantity), 0);
  const total = subtotal + shippingCost + tax - discount;

  const handleSubmit = async () => {
    // Validate
    const validItems = items.filter(item => item.productName && item.offeredPrice > 0);
    if (validItems.length === 0) {
      setError('Please add at least one item with a valid price');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/chat/offer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          items: validItems,
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
        throw new Error(data.error || 'Failed to send offer');
      }

      const data = await res.json();
      onSuccess?.(data.offer);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send offer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Items */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-orange-500" />
            Products/Services
          </h3>
          <Button variant="outline" size="sm" onClick={addItem}>
            <Plus className="w-4 h-4 mr-1" />
            Add Item
          </Button>
        </div>
        
        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={index} className="border rounded-lg p-4 bg-gray-50">
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-5">
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Product Name *</label>
                  <Input
                    value={item.productName}
                    onChange={(e) => updateItem(index, 'productName', e.target.value)}
                    placeholder="Product or service name"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Quantity</label>
                  <div className="flex items-center">
                    <button
                      onClick={() => updateItem(index, 'quantity', Math.max(1, item.quantity - 1))}
                      className="p-2 hover:bg-gray-200 rounded-l border"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                      className="w-12 text-center border-y py-2 text-sm"
                      min="1"
                    />
                    <button
                      onClick={() => updateItem(index, 'quantity', item.quantity + 1)}
                      className="p-2 hover:bg-gray-200 rounded-r border"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <div className="col-span-3">
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Unit Price *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                    <Input
                      type="number"
                      value={item.offeredPrice || ''}
                      onChange={(e) => updateItem(index, 'offeredPrice', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="pl-7"
                      step="0.01"
                      min="0"
                    />
                  </div>
                </div>
                <div className="col-span-2 flex items-end justify-between">
                  <div className="text-right">
                    <span className="text-xs text-gray-500">Subtotal</span>
                    <p className="font-semibold text-orange-600">
                      ${(item.offeredPrice * item.quantity).toFixed(2)}
                    </p>
                  </div>
                  {items.length > 1 && (
                    <button
                      onClick={() => removeItem(index)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Costs & Totals */}
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-orange-500" />
            Pricing
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Shipping Cost</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                <Input
                  type="number"
                  value={shippingCost || ''}
                  onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="pl-7"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Tax</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                <Input
                  type="number"
                  value={tax || ''}
                  onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="pl-7"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Discount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                <Input
                  type="number"
                  value={discount || ''}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="pl-7"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-orange-500" />
            Terms
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Valid For (Days)</label>
              <Input
                type="number"
                value={validDays}
                onChange={(e) => setValidDays(parseInt(e.target.value) || 7)}
                min="1"
                max="90"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Delivery Time</label>
              <Input
                value={deliveryTime}
                onChange={(e) => setDeliveryTime(e.target.value)}
                placeholder="e.g., 5-7 business days"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Payment Terms</label>
              <Input
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                placeholder="e.g., 50% deposit, 50% on delivery"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="text-xs font-medium text-gray-600 mb-1 block flex items-center gap-1">
          <FileText className="w-4 h-4" />
          Additional Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any additional information for the customer..."
          rows={3}
          className="w-full px-3 py-2 border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>

      {/* Summary */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-4 border border-orange-200">
        <h3 className="font-semibold text-gray-900 mb-3">Offer Summary for {buyerName}</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal ({items.length} items)</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          {shippingCost > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">Shipping</span>
              <span>${shippingCost.toFixed(2)}</span>
            </div>
          )}
          {tax > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">Tax</span>
              <span>${tax.toFixed(2)}</span>
            </div>
          )}
          {discount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount</span>
              <span>-${discount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between pt-2 border-t border-orange-200 font-bold text-lg">
            <span>Total</span>
            <span className="text-orange-600">${total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        {onCancel && (
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
        )}
        <Button 
          onClick={handleSubmit}
          disabled={loading || items.every(i => !i.productName || i.offeredPrice <= 0)}
          className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Send className="w-4 h-4 mr-2" />
          )}
          Send Offer
        </Button>
      </div>
    </div>
  );
}
