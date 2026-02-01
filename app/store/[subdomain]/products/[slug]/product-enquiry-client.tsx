'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { MessageCircle, Send, CheckCircle, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ProductEnquiryClientProps {
  productId: string;
  productName: string;
  productImage?: string;
  sellerId: string;
  sellerName: string;
  sellerSubdomain?: string;
}

export function ProductEnquiryClient({
  productId,
  productName,
  productImage,
  sellerId,
  sellerName,
  sellerSubdomain = '',
}: ProductEnquiryClientProps) {
  const { data: session } = useSession();
  const [showEnquiryForm, setShowEnquiryForm] = useState(false);
  const [enquirySent, setEnquirySent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Form fields
  const [name, setName] = useState(session?.user?.name || '');
  const [email, setEmail] = useState(session?.user?.email || '');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [message, setMessage] = useState('');
  const [quantity, setQuantity] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !email.trim() || !message.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/chat/enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          productName,
          productImage,
          sellerId,
          sellerSubdomain,
          buyerName: name,
          buyerEmail: email,
          buyerPhone: phone || undefined,
          buyerCompany: company || undefined,
          message,
          quantity: quantity ? parseInt(quantity) : undefined,
        }),
      });

      if (res.ok) {
        setEnquirySent(true);
        setShowEnquiryForm(false);
        // Reset form
        setMessage('');
        setQuantity('');
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send enquiry');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send enquiry');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (enquirySent) {
    return (
      <div className="p-6 bg-green-50 border border-green-200 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h4 className="font-semibold text-green-800">Enquiry Sent!</h4>
            <p className="text-sm text-green-600">
              {sellerName} will respond to your message shortly.
            </p>
          </div>
        </div>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => setEnquirySent(false)}
        >
          Send Another Enquiry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Quick Action Buttons */}
      <div className="flex gap-3">
        <Button 
          onClick={() => setShowEnquiryForm(!showEnquiryForm)}
          className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
          size="lg"
        >
          <MessageCircle className="w-5 h-5 mr-2" />
          Contact Seller
        </Button>
        <Button 
          variant="outline"
          size="lg"
          className="flex-1"
          onClick={() => setShowEnquiryForm(true)}
        >
          <Send className="w-5 h-5 mr-2" />
          Request Quote
        </Button>
      </div>

      {/* Enquiry Form */}
      {showEnquiryForm && (
        <div className="border rounded-xl p-6 mt-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">
              Send Enquiry to {sellerName}
            </h3>
            <button 
              onClick={() => setShowEnquiryForm(false)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Product Context */}
          {productImage && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg mb-4">
              <img src={productImage} alt={productName} className="w-12 h-12 rounded object-cover" />
              <div>
                <p className="font-medium text-sm">{productName}</p>
                <p className="text-xs text-gray-500">Product Enquiry</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Your Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@company.com"
                  required
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Phone (optional)</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 234 567 8900"
                />
              </div>
              <div>
                <Label htmlFor="company">Company (optional)</Label>
                <Input
                  id="company"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Your Company Ltd"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="quantity">Quantity (optional)</Label>
              <Input
                id="quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="e.g., 1000"
                min="1"
              />
            </div>

            <div>
              <Label htmlFor="message">Message *</Label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="I'm interested in this product. Please provide more details about pricing, lead time, and customization options..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                required
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowEnquiryForm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-orange-600 hover:bg-orange-700"
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
            </div>
          </form>
        </div>
      )}

      {/* Login prompt for logged out users */}
      {!session && !showEnquiryForm && (
        <p className="text-center text-sm text-gray-500">
          <a href="/auth/login" className="text-orange-600 hover:underline">Sign in</a> to save your conversations and track enquiries
        </p>
      )}
    </div>
  );
}
