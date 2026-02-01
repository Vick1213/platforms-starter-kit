'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  MessageCircle, X, Send, Loader2, Package, 
  User, Mail, Phone, Building, ChevronDown
} from 'lucide-react';

interface EnquiryFormProps {
  product: {
    id: string;
    name: string;
    image?: string;
    price?: number;
    sellerId: string;
    sellerSubdomain: string;
  };
  seller: {
    id: string;
    name: string;
    logo?: string;
  };
  user?: {
    id: string;
    name: string;
    email: string;
    image?: string;
  } | null;
  onSubmit?: (data: EnquiryData) => void;
  onClose?: () => void;
  className?: string;
}

interface EnquiryData {
  productId: string;
  productName: string;
  productImage?: string;
  sellerId: string;
  sellerSubdomain: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone?: string;
  buyerCompany?: string;
  message: string;
  quantity?: number;
  targetPrice?: number;
  deliveryRequirements?: string;
}

export function EnquiryForm({
  product,
  seller,
  user,
  onSubmit,
  onClose,
  className = '',
}: EnquiryFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Form fields
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [message, setMessage] = useState('');
  const [quantity, setQuantity] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !email.trim() || !message.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const enquiryData: EnquiryData = {
        productId: product.id,
        productName: product.name,
        productImage: product.image,
        sellerId: seller.id,
        sellerSubdomain: product.sellerSubdomain,
        buyerName: name.trim(),
        buyerEmail: email.trim(),
        buyerPhone: phone.trim() || undefined,
        buyerCompany: company.trim() || undefined,
        message: message.trim(),
        quantity: quantity ? parseInt(quantity) : undefined,
        targetPrice: targetPrice ? parseFloat(targetPrice) : undefined,
        deliveryRequirements: deliveryNotes.trim() || undefined,
      };

      const response = await fetch('/api/chat/enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(enquiryData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send enquiry');
      }

      setIsSuccess(true);
      onSubmit?.(enquiryData);

      // Reset form after 3 seconds
      setTimeout(() => {
        onClose?.();
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className={`bg-white rounded-lg shadow-xl p-6 ${className}`}>
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Enquiry Sent!</h3>
          <p className="text-gray-600 mb-4">
            Your message has been sent to {seller.name}. They will respond shortly.
          </p>
          {user && (
            <p className="text-sm text-gray-500">
              You can view your conversation in your messages.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          <h3 className="font-semibold">Contact Seller</h3>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded transition-colors">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Product Info */}
      <div className="px-4 py-3 bg-gray-50 border-b flex items-center gap-3">
        {product.image ? (
          <img 
            src={product.image} 
            alt={product.name}
            className="w-14 h-14 rounded object-cover"
          />
        ) : (
          <div className="w-14 h-14 rounded bg-gray-200 flex items-center justify-center">
            <Package className="w-7 h-7 text-gray-400" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 truncate">{product.name}</p>
          <p className="text-sm text-gray-500">To: {seller.name}</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Contact Info */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="name" className="text-sm">
              Your Name <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="pl-9"
                required
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="email" className="text-sm">
              Email <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="pl-9"
                required
              />
            </div>
          </div>
        </div>

        {/* Message */}
        <div className="space-y-1">
          <Label htmlFor="message" className="text-sm">
            Message <span className="text-red-500">*</span>
          </Label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Hi, I'm interested in this product. Could you provide more details about..."
            className="w-full px-3 py-2 border rounded-lg text-sm min-h-[100px] resize-none focus:outline-none focus:ring-2 focus:ring-orange-500"
            required
          />
        </div>

        {/* Additional Details Toggle */}
        <button
          type="button"
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center gap-2 text-sm text-orange-600 hover:text-orange-700"
        >
          <ChevronDown className={`w-4 h-4 transition-transform ${showDetails ? 'rotate-180' : ''}`} />
          {showDetails ? 'Hide' : 'Add'} quote details (optional)
        </button>

        {/* Additional Details */}
        {showDetails && (
          <div className="space-y-3 pt-2 border-t">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="phone" className="text-sm">Phone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="company" className="text-sm">Company</Label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="company"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Company name"
                    className="pl-9"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="quantity" className="text-sm">Quantity Needed</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="e.g., 100"
                  min="1"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="targetPrice" className="text-sm">Target Price (USD)</Label>
                <Input
                  id="targetPrice"
                  type="number"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  placeholder="e.g., 10.00"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="delivery" className="text-sm">Delivery Requirements</Label>
              <Input
                id="delivery"
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                placeholder="e.g., Need by March 15th, FOB shipping"
              />
            </div>
          </div>
        )}

        {/* Submit */}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Send Enquiry
            </>
          )}
        </Button>

        <p className="text-xs text-center text-gray-500">
          The seller will receive your message and respond via email or chat.
        </p>
      </form>
    </div>
  );
}
