import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { generateInvoiceNumber } from '@/lib/invoice-types';

// GET /api/invoices - Get invoices
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const invoiceId = searchParams.get('id');
    const invoiceNumber = searchParams.get('invoiceNumber');
    const orderId = searchParams.get('orderId');
    const email = searchParams.get('email');

    // Get specific invoice
    if (invoiceId || invoiceNumber) {
      const invoice = await prisma.invoice.findFirst({
        where: invoiceId ? { id: invoiceId } : { invoiceNumber: invoiceNumber! },
        include: {
          order: { select: { orderNumber: true, status: true } },
          seller: { select: { businessName: true, businessEmail: true, logo: true } },
        },
      });

      if (!invoice) {
        return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
      }

      return NextResponse.json(invoice);
    }

    // Get invoices for an order
    if (orderId) {
      const invoices = await prisma.invoice.findMany({
        where: { orderId },
        orderBy: { createdAt: 'desc' },
      });
      return NextResponse.json(invoices);
    }

    // Get invoices by customer email
    if (email) {
      const invoices = await prisma.invoice.findMany({
        where: { customerEmail: email },
        include: {
          seller: { select: { businessName: true } },
          order: { select: { orderNumber: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      return NextResponse.json(invoices);
    }

    // Seller: Get their invoices
    const session = await auth();
    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { seller: true },
      });

      if (user?.seller) {
        const invoices = await prisma.invoice.findMany({
          where: { sellerId: user.seller.id },
          include: {
            order: { select: { orderNumber: true, status: true } },
          },
          orderBy: { createdAt: 'desc' },
        });
        return NextResponse.json(invoices);
      }
    }

    return NextResponse.json({ error: 'Missing query parameters' }, { status: 400 });
  } catch (error) {
    console.error('Get invoices error:', error);
    return NextResponse.json({ error: 'Failed to get invoices' }, { status: 500 });
  }
}

// POST /api/invoices - Create invoice for an order (seller)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { seller: true },
    });

    if (!user?.seller) {
      return NextResponse.json({ error: 'Not a seller' }, { status: 403 });
    }

    const body = await request.json();
    const { orderId, notes, dueDate, paymentTerms } = body;

    // Get order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order || order.sellerId !== user.seller.id) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Create invoice
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: generateInvoiceNumber(user.seller.id),
        orderId: order.id,
        sellerId: user.seller.id,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        customerAddress: order.shippingAddress as any,
        sellerName: user.seller.businessName,
        sellerEmail: user.seller.businessEmail,
        sellerPhone: user.seller.businessPhone,
        sellerAddress: user.seller.address ? { address: user.seller.address } : undefined,
        items: order.items.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          productSlug: item.productSlug,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal,
          unit: item.unit,
        })),
        subtotal: order.subtotal,
        shippingCost: order.shippingCost,
        tax: order.tax,
        discount: order.discount,
        total: order.total,
        paymentMethod: order.paymentMethod,
        paymentTerms,
        status: 'DRAFT',
        notes,
        dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Create invoice error:', error);
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
  }
}

// PATCH /api/invoices - Update invoice status
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { invoiceId, status, paidAmount, paidAt, notes } = body;

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { seller: { include: { user: true } } },
    });

    if (!invoice || invoice.seller.user.email !== session.user.email) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: status || undefined,
        paidAmount: paidAmount !== undefined ? paidAmount : undefined,
        paidAt: paidAt ? new Date(paidAt) : undefined,
        notes: notes !== undefined ? notes : undefined,
      },
    });

    return NextResponse.json(updatedInvoice);
  } catch (error) {
    console.error('Update invoice error:', error);
    return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 });
  }
}
