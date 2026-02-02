'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  Check, X, Clock, FileText, Package, 
  DollarSign, Truck, Calendar, Loader2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Offer, getOfferStatusInfo, isOfferExpired } from '@/lib/offer-types';

interface OfferCardProps {
  offer: Offer;
  viewerType: 'buyer' | 'seller';
  onAccept?: () => void;
  onDecline?: () => void;
  primaryColor?: string;
}

export function OfferCard({
  offer,
  viewerType,
  onAccept,
  onDecline,
  primaryColor = '#f97316',
}: OfferCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showDeclineReason, setShowDeclineReason] = useState(false);
  const [declineReason, setDeclineReason] = useState('');

  const statusInfo = getOfferStatusInfo(offer.status);
  const expired = isOfferExpired(offer.validUntil);
  const canRespond = viewerType === 'buyer' && offer.status === 'PENDING' && !expired;

  const handleAccept = async () => {
    if (onAccept) {
      onAccept();
    } else {
      // Navigate to accept offer page
      router.push(`/store/offer/${offer.id}/accept`);
    }
  };

  const handleDecline = async () => {
    if (!showDeclineReason) {
      setShowDeclineReason(true);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/offers/${offer.id}/decline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: declineReason }),
      });

      if (!res.ok) throw new Error('Failed to decline offer');
      
      if (onDecline) onDecline();
    } catch (error) {
      console.error('Decline error:', error);
    } finally {
      setLoading(false);
    }
  };

  const validUntilDate = new Date(offer.validUntil);
  const daysRemaining = Math.ceil((validUntilDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
      {/* Header */}
      <div 
        className="px-4 py-3 flex items-center justify-between"
        style={{ backgroundColor: primaryColor + '10' }}
      >
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5" style={{ color: primaryColor }} />
          <span className="font-semibold" style={{ color: primaryColor }}>
            Offer #{offer.offerNumber}
          </span>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color} ${statusInfo.bgColor}`}>
          {statusInfo.label}
        </span>
      </div>

      {/* Items */}
      <div className="p-4 space-y-3">
        {offer.items.map((item, index) => (
          <div key={index} className="flex items-center gap-3 pb-3 border-b last:border-0 last:pb-0">
            {item.productImage && (
              <div className="w-12 h-12 rounded bg-gray-100 overflow-hidden flex-shrink-0">
                <Image
                  src={item.productImage}
                  alt={item.productName}
                  width={48}
                  height={48}
                  className="object-cover w-full h-full"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{item.productName}</p>
              <p className="text-xs text-gray-500">
                {item.quantity} {item.unit || 'units'} × ${item.offeredPrice.toFixed(2)}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold" style={{ color: primaryColor }}>
                ${item.subtotal.toFixed(2)}
              </p>
              {item.originalPrice && item.originalPrice > item.offeredPrice && (
                <p className="text-xs text-gray-400 line-through">
                  ${(item.originalPrice * item.quantity).toFixed(2)}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="px-4 py-3 bg-gray-50 space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal</span>
          <span>${offer.subtotal.toFixed(2)}</span>
        </div>
        {offer.shippingCost !== undefined && offer.shippingCost > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Shipping</span>
            <span>${offer.shippingCost.toFixed(2)}</span>
          </div>
        )}
        {offer.tax !== undefined && offer.tax > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Tax</span>
            <span>${offer.tax.toFixed(2)}</span>
          </div>
        )}
        {offer.discount !== undefined && offer.discount > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Discount</span>
            <span>-${offer.discount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold pt-2 border-t">
          <span>Total</span>
          <span style={{ color: primaryColor }}>${offer.total.toFixed(2)}</span>
        </div>
      </div>

      {/* Terms */}
      <div className="px-4 py-3 border-t space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className="text-gray-600">
            Valid until: {validUntilDate.toLocaleDateString()}
            {offer.status === 'PENDING' && !expired && daysRemaining > 0 && (
              <span className="ml-1 text-amber-600">({daysRemaining} days left)</span>
            )}
            {expired && offer.status === 'PENDING' && (
              <span className="ml-1 text-red-600">(Expired)</span>
            )}
          </span>
        </div>
        {offer.deliveryTime && (
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">Delivery: {offer.deliveryTime}</span>
          </div>
        )}
        {offer.paymentTerms && (
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">Payment: {offer.paymentTerms}</span>
          </div>
        )}
        {offer.notes && (
          <p className="text-gray-600 italic pt-2">{offer.notes}</p>
        )}
      </div>

      {/* Actions */}
      {canRespond && (
        <div className="px-4 py-3 border-t bg-gray-50">
          {showDeclineReason ? (
            <div className="space-y-2">
              <textarea
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="Reason for declining (optional)"
                className="w-full p-2 border rounded text-sm resize-none h-16"
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeclineReason(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDecline}
                  disabled={loading}
                >
                  {loading && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                  Confirm Decline
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowDeclineReason(true)}
              >
                <X className="w-4 h-4 mr-1" />
                Decline
              </Button>
              <Button
                className="flex-1 text-white"
                style={{ backgroundColor: primaryColor }}
                onClick={handleAccept}
              >
                <Check className="w-4 h-4 mr-1" />
                Accept Offer
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Status messages */}
      {offer.status === 'ACCEPTED' && (
        <div className="px-4 py-3 border-t bg-green-50 text-green-700 text-sm flex items-center gap-2">
          <Check className="w-4 h-4" />
          Offer accepted on {new Date(offer.acceptedAt!).toLocaleDateString()}
        </div>
      )}
      {offer.status === 'DECLINED' && (
        <div className="px-4 py-3 border-t bg-red-50 text-red-700 text-sm">
          <div className="flex items-center gap-2">
            <X className="w-4 h-4" />
            Offer declined on {new Date(offer.declinedAt!).toLocaleDateString()}
          </div>
          {offer.declineReason && (
            <p className="mt-1 text-xs">Reason: {offer.declineReason}</p>
          )}
        </div>
      )}
      {expired && offer.status === 'PENDING' && (
        <div className="px-4 py-3 border-t bg-gray-50 text-gray-600 text-sm flex items-center gap-2">
          <Clock className="w-4 h-4" />
          This offer has expired
        </div>
      )}
    </div>
  );
}
