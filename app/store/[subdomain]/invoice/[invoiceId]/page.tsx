'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ArrowLeft, Download, Printer, Package, CheckCircle2, 
  Clock, AlertTriangle, Loader2, Building, Mail, Phone
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

interface InvoiceAddress {
  name: string;
  company?: string;
  email: string;
  phone?: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED' | 'REFUNDED';
  sellerId: string;
  seller: {
    companyName: string;
    logo?: string;
    subdomain: string;
    contactEmail?: string;
    contactPhone?: string;
    address?: string;
  };
  orderId?: string;
  buyerEmail: string;
  buyerName: string;
  billingAddress?: InvoiceAddress;
  shippingAddress?: InvoiceAddress;
  items: InvoiceItem[];
  subtotal: number;
  shippingCost: number;
  tax: number;
  discount: number;
  total: number;
  notes?: string;
  terms?: string;
  issuedAt: string;
  dueDate?: string;
  paidAt?: string;
  createdAt: string;
}

export default function InvoicePage() {
  const params = useParams();
  const invoiceId = params.invoiceId as string;
  const subdomain = params.subdomain as string;
  const printRef = useRef<HTMLDivElement>(null);

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const res = await fetch(`/api/invoices?id=${invoiceId}`);
        if (!res.ok) throw new Error('Invoice not found');
        const data = await res.json();
        setInvoice(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load invoice');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [invoiceId]);

  const handlePrint = () => {
    window.print();
  };

  const getStatusInfo = (status: Invoice['status']) => {
    switch (status) {
      case 'PAID':
        return { color: 'text-green-600 bg-green-50 border-green-200', icon: CheckCircle2, label: 'Paid' };
      case 'SENT':
        return { color: 'text-blue-600 bg-blue-50 border-blue-200', icon: Mail, label: 'Sent' };
      case 'OVERDUE':
        return { color: 'text-red-600 bg-red-50 border-red-200', icon: AlertTriangle, label: 'Overdue' };
      case 'DRAFT':
        return { color: 'text-gray-600 bg-gray-50 border-gray-200', icon: Clock, label: 'Draft' };
      case 'CANCELLED':
        return { color: 'text-gray-600 bg-gray-50 border-gray-200', icon: AlertTriangle, label: 'Cancelled' };
      case 'REFUNDED':
        return { color: 'text-purple-600 bg-purple-50 border-purple-200', icon: CheckCircle2, label: 'Refunded' };
      default:
        return { color: 'text-gray-600 bg-gray-50 border-gray-200', icon: Clock, label: status };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold mb-2">Invoice Not Found</h1>
          <p className="text-gray-600 mb-4">{error || 'Invoice could not be found'}</p>
          <Link href={`/store/${subdomain}`}>
            <Button>Return to Store</Button>
          </Link>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(invoice.status);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header - Hidden in print */}
        <div className="mb-6 print:hidden">
          <Link 
            href={`/store/${subdomain}`}
            className="inline-flex items-center text-sm text-gray-600 hover:text-orange-600 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Store
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Invoice {invoice.invoiceNumber}</h1>
              <p className="text-gray-600">From {invoice.seller.companyName}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
            </div>
          </div>
        </div>

        {/* Invoice Document */}
        <div ref={printRef} className="bg-white rounded-xl shadow-sm p-8 print:shadow-none print:p-0">
          {/* Invoice Header */}
          <div className="flex justify-between items-start mb-8 pb-6 border-b">
            <div>
              {invoice.seller.logo ? (
                <Image
                  src={invoice.seller.logo}
                  alt={invoice.seller.companyName}
                  width={120}
                  height={60}
                  className="object-contain mb-3"
                />
              ) : (
                <div className="flex items-center gap-2 mb-3">
                  <Building className="w-8 h-8 text-orange-500" />
                  <span className="text-xl font-bold">{invoice.seller.companyName}</span>
                </div>
              )}
              {invoice.seller.address && (
                <p className="text-sm text-gray-600 whitespace-pre-line">{invoice.seller.address}</p>
              )}
              {invoice.seller.contactEmail && (
                <p className="text-sm text-gray-600">{invoice.seller.contactEmail}</p>
              )}
              {invoice.seller.contactPhone && (
                <p className="text-sm text-gray-600">{invoice.seller.contactPhone}</p>
              )}
            </div>
            <div className="text-right">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">INVOICE</h2>
              <p className="text-lg font-mono">{invoice.invoiceNumber}</p>
              <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border mt-2 ${statusInfo.color}`}>
                <StatusIcon className="w-4 h-4" />
                <span className="font-medium">{statusInfo.label}</span>
              </div>
            </div>
          </div>

          {/* Dates & Bill To */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Bill To</h3>
              <p className="font-semibold">{invoice.buyerName}</p>
              <p className="text-gray-600">{invoice.buyerEmail}</p>
              {invoice.billingAddress && (
                <div className="mt-2 text-gray-600 text-sm">
                  {invoice.billingAddress.company && <p>{invoice.billingAddress.company}</p>}
                  <p>{invoice.billingAddress.address1}</p>
                  {invoice.billingAddress.address2 && <p>{invoice.billingAddress.address2}</p>}
                  <p>
                    {invoice.billingAddress.city}, {invoice.billingAddress.state} {invoice.billingAddress.postalCode}
                  </p>
                  <p>{invoice.billingAddress.country}</p>
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="inline-block text-left">
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <span className="text-gray-500">Invoice Date:</span>
                  <span className="font-medium">{new Date(invoice.issuedAt).toLocaleDateString()}</span>
                  
                  {invoice.dueDate && (
                    <>
                      <span className="text-gray-500">Due Date:</span>
                      <span className="font-medium">{new Date(invoice.dueDate).toLocaleDateString()}</span>
                    </>
                  )}
                  
                  {invoice.paidAt && (
                    <>
                      <span className="text-gray-500">Paid On:</span>
                      <span className="font-medium text-green-600">{new Date(invoice.paidAt).toLocaleDateString()}</span>
                    </>
                  )}
                  
                  {invoice.orderId && (
                    <>
                      <span className="text-gray-500">Order ID:</span>
                      <span className="font-medium font-mono text-xs">{invoice.orderId.slice(0, 8)}...</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Ship To (if different) */}
          {invoice.shippingAddress && (
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Ship To</h3>
              <div className="text-gray-600 text-sm">
                <p className="font-medium text-gray-800">{invoice.shippingAddress.name}</p>
                {invoice.shippingAddress.company && <p>{invoice.shippingAddress.company}</p>}
                <p>{invoice.shippingAddress.address1}</p>
                {invoice.shippingAddress.address2 && <p>{invoice.shippingAddress.address2}</p>}
                <p>
                  {invoice.shippingAddress.city}, {invoice.shippingAddress.state} {invoice.shippingAddress.postalCode}
                </p>
                <p>{invoice.shippingAddress.country}</p>
              </div>
            </div>
          )}

          {/* Items Table */}
          <div className="mb-8">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-2 text-sm font-semibold text-gray-600">Description</th>
                  <th className="text-center py-3 px-2 text-sm font-semibold text-gray-600">Qty</th>
                  <th className="text-right py-3 px-2 text-sm font-semibold text-gray-600">Unit Price</th>
                  <th className="text-right py-3 px-2 text-sm font-semibold text-gray-600">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100">
                    <td className="py-4 px-2">{item.description}</td>
                    <td className="py-4 px-2 text-center">{item.quantity}</td>
                    <td className="py-4 px-2 text-right">${item.unitPrice.toFixed(2)}</td>
                    <td className="py-4 px-2 text-right font-medium">${item.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-8">
            <div className="w-64">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>${invoice.subtotal.toFixed(2)}</span>
                </div>
                {invoice.shippingCost > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span>${invoice.shippingCost.toFixed(2)}</span>
                  </div>
                )}
                {invoice.tax > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax</span>
                    <span>${invoice.tax.toFixed(2)}</span>
                  </div>
                )}
                {invoice.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-${invoice.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-2 border-t-2 border-gray-200">
                  <span>Total</span>
                  <span>${invoice.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Amount Due Banner */}
          {invoice.status !== 'PAID' && invoice.status !== 'CANCELLED' && invoice.status !== 'REFUNDED' && (
            <div className={`p-4 rounded-lg mb-8 ${
              invoice.status === 'OVERDUE' ? 'bg-red-50 border border-red-200' : 'bg-orange-50 border border-orange-200'
            }`}>
              <div className="flex justify-between items-center">
                <span className={`font-semibold ${invoice.status === 'OVERDUE' ? 'text-red-700' : 'text-orange-700'}`}>
                  {invoice.status === 'OVERDUE' ? 'Payment Overdue' : 'Amount Due'}
                </span>
                <span className={`text-2xl font-bold ${invoice.status === 'OVERDUE' ? 'text-red-700' : 'text-orange-700'}`}>
                  ${invoice.total.toFixed(2)}
                </span>
              </div>
              {invoice.dueDate && (
                <p className={`text-sm mt-1 ${invoice.status === 'OVERDUE' ? 'text-red-600' : 'text-orange-600'}`}>
                  {invoice.status === 'OVERDUE' 
                    ? `Was due on ${new Date(invoice.dueDate).toLocaleDateString()}`
                    : `Due by ${new Date(invoice.dueDate).toLocaleDateString()}`
                  }
                </p>
              )}
            </div>
          )}

          {/* Notes & Terms */}
          {(invoice.notes || invoice.terms) && (
            <div className="border-t pt-6 space-y-4 text-sm">
              {invoice.notes && (
                <div>
                  <h3 className="font-semibold text-gray-700 mb-1">Notes</h3>
                  <p className="text-gray-600 whitespace-pre-line">{invoice.notes}</p>
                </div>
              )}
              {invoice.terms && (
                <div>
                  <h3 className="font-semibold text-gray-700 mb-1">Terms & Conditions</h3>
                  <p className="text-gray-600 whitespace-pre-line">{invoice.terms}</p>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 pt-6 border-t text-center text-sm text-gray-500">
            <p>Thank you for your business!</p>
            <p className="mt-1">
              Questions? Contact us at {invoice.seller.contactEmail || `support@${invoice.seller.subdomain}.com`}
            </p>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:hidden {
            display: none !important;
          }
          #__next > div > div > div:last-child,
          #__next > div > div > div:last-child * {
            visibility: visible;
          }
          #__next > div > div > div:last-child {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
