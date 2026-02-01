// Cart and Checkout Types

export interface CartItem {
  id: string;
  productId: string;
  productSlug: string;
  name: string;
  price: number;
  quantity: number;
  unit?: string;
  moq?: number;
  image?: string;
  sellerId: string;
  sellerName: string;
  sellerSubdomain: string;
}

export interface Cart {
  items: CartItem[];
  sellerId: string;
  sellerSubdomain: string;
  updatedAt: string;
}

export interface ShippingAddress {
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
}

export interface BillingAddress extends ShippingAddress {
  sameAsShipping?: boolean;
}

export type PaymentMethod = 'credit-card' | 'bank-transfer' | 'paypal' | 'cash-on-delivery' | 'inquiry';

export interface PaymentInfo {
  method: PaymentMethod;
  cardLast4?: string;
  transactionId?: string;
}

export type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export interface OrderItem {
  id: string;
  productId: string;
  productSlug: string;
  name: string;
  price: number;
  quantity: number;
  unit?: string;
  image?: string;
  subtotal: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  sellerId: string;
  sellerName: string;
  sellerSubdomain: string;
  customerId?: string;
  customerEmail: string;
  
  items: OrderItem[];
  
  subtotal: number;
  shippingCost: number;
  tax: number;
  discount: number;
  total: number;
  
  shippingAddress: ShippingAddress;
  billingAddress: BillingAddress;
  
  paymentMethod: PaymentMethod;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  
  status: OrderStatus;
  
  notes?: string;
  sellerNotes?: string;
  
  createdAt: string;
  updatedAt: string;
  shippedAt?: string;
  deliveredAt?: string;
}

export interface CheckoutFormData {
  shippingAddress: ShippingAddress;
  billingAddress: BillingAddress;
  paymentMethod: PaymentMethod;
  notes?: string;
  acceptTerms: boolean;
}

// Cart calculations
export function calculateCartTotals(items: CartItem[]) {
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  
  // These can be customized per seller
  const shippingCost = subtotal > 100 ? 0 : 10;
  const taxRate = 0; // Sellers can configure this
  const tax = subtotal * taxRate;
  const total = subtotal + shippingCost + tax;
  
  return {
    subtotal,
    itemCount,
    shippingCost,
    tax,
    total,
  };
}

// Generate order number
export function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${timestamp}-${random}`;
}

// Validate cart item quantity
export function validateQuantity(quantity: number, moq?: number): boolean {
  if (quantity < 1) return false;
  if (moq && quantity < moq) return false;
  return true;
}
