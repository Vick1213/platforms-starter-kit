// Invoice Types

export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED' | 'REFUNDED';

export interface InvoiceItem {
  productId: string;
  productName: string;
  productSlug?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  unit?: string;
}

export interface InvoiceAddress {
  name: string;
  company?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
  email?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  orderId: string;
  orderNumber?: string;
  sellerId: string;
  
  // Customer info (snapshot at invoice creation)
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerCompany?: string;
  customerAddress: InvoiceAddress;
  
  // Seller info (snapshot at invoice creation)
  sellerName: string;
  sellerEmail: string;
  sellerPhone?: string;
  sellerAddress?: InvoiceAddress;
  
  // Items (snapshot)
  items: InvoiceItem[];
  
  // Totals
  subtotal: number;
  shippingCost: number;
  tax: number;
  discount: number;
  total: number;
  
  // Payment info
  paymentMethod?: string;
  paymentTerms?: string;
  dueDate?: string;
  paidAmount: number;
  paidAt?: string;
  
  // Status
  status: InvoiceStatus;
  
  // Notes
  notes?: string;
  
  // PDF storage
  pdfUrl?: string;
  
  createdAt: string;
  updatedAt: string;
}

// Generate invoice number
export function generateInvoiceNumber(sellerId: string): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `INV-${year}${month}-${random}`;
}

// Get invoice status display info
export function getInvoiceStatusInfo(status: InvoiceStatus): { label: string; color: string; bgColor: string } {
  switch (status) {
    case 'DRAFT':
      return { label: 'Draft', color: 'text-gray-600', bgColor: 'bg-gray-50' };
    case 'SENT':
      return { label: 'Sent', color: 'text-blue-600', bgColor: 'bg-blue-50' };
    case 'PAID':
      return { label: 'Paid', color: 'text-green-600', bgColor: 'bg-green-50' };
    case 'OVERDUE':
      return { label: 'Overdue', color: 'text-red-600', bgColor: 'bg-red-50' };
    case 'CANCELLED':
      return { label: 'Cancelled', color: 'text-gray-600', bgColor: 'bg-gray-50' };
    case 'REFUNDED':
      return { label: 'Refunded', color: 'text-purple-600', bgColor: 'bg-purple-50' };
    default:
      return { label: status, color: 'text-gray-600', bgColor: 'bg-gray-50' };
  }
}

// Calculate due status
export function isDueDatePassed(dueDate?: string): boolean {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
}

// Format currency
export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}
