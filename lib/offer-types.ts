// Offer Types - For seller quotes sent via inquiry chat

export type OfferStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED' | 'WITHDRAWN';

export interface OfferItem {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  productImage?: string;
  quantity: number;
  originalPrice?: number;
  offeredPrice: number;
  subtotal: number;
  unit?: string;
  notes?: string;
}

export interface Offer {
  id: string;
  offerNumber: string;
  inquiryId: string;
  sellerId: string;
  sellerName?: string;
  buyerEmail: string;
  buyerName: string;
  
  items: OfferItem[];
  
  subtotal: number;
  shippingCost?: number;
  tax?: number;
  discount?: number;
  total: number;
  
  validUntil: string;
  paymentTerms?: string;
  shippingTerms?: string;
  deliveryTime?: string;
  notes?: string;
  
  status: OfferStatus;
  
  acceptedAt?: string;
  declinedAt?: string;
  declineReason?: string;
  
  createdAt: string;
  updatedAt: string;
}

export interface CreateOfferInput {
  inquiryId: string;
  items: {
    productId: string;
    productName: string;
    productSlug: string;
    productImage?: string;
    quantity: number;
    originalPrice?: number;
    offeredPrice: number;
    unit?: string;
    notes?: string;
  }[];
  shippingCost?: number;
  tax?: number;
  discount?: number;
  validDays?: number; // Default 7 days
  paymentTerms?: string;
  shippingTerms?: string;
  deliveryTime?: string;
  notes?: string;
}

export interface AcceptOfferInput {
  offerId: string;
  shippingAddress: {
    fullName: string;
    email: string;
    phone: string;
    company?: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  customerNotes?: string;
}

// Generate offer number
export function generateOfferNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `QUO-${timestamp}-${random}`;
}

// Calculate offer totals
export function calculateOfferTotals(items: { offeredPrice: number; quantity: number }[], shippingCost = 0, tax = 0, discount = 0) {
  const subtotal = items.reduce((sum, item) => sum + item.offeredPrice * item.quantity, 0);
  const total = subtotal + shippingCost + tax - discount;
  return { subtotal, total };
}

// Check if offer is expired
export function isOfferExpired(validUntil: string): boolean {
  return new Date(validUntil) < new Date();
}

// Get offer status display info
export function getOfferStatusInfo(status: OfferStatus): { label: string; color: string; bgColor: string } {
  switch (status) {
    case 'PENDING':
      return { label: 'Pending', color: 'text-amber-600', bgColor: 'bg-amber-50' };
    case 'ACCEPTED':
      return { label: 'Accepted', color: 'text-green-600', bgColor: 'bg-green-50' };
    case 'DECLINED':
      return { label: 'Declined', color: 'text-red-600', bgColor: 'bg-red-50' };
    case 'EXPIRED':
      return { label: 'Expired', color: 'text-gray-600', bgColor: 'bg-gray-50' };
    case 'WITHDRAWN':
      return { label: 'Withdrawn', color: 'text-gray-600', bgColor: 'bg-gray-50' };
    default:
      return { label: status, color: 'text-gray-600', bgColor: 'bg-gray-50' };
  }
}
