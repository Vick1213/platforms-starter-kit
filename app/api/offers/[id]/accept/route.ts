import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateOrderNumber } from '@/lib/cart-types';
import { generateInvoiceNumber } from '@/lib/invoice-types';
import { notifications, publishChatMessage } from '@/lib/ably-server';

// POST /api/offers/[id]/accept - Accept an offer and create order
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { shippingAddress, customerNotes } = body;

    if (!shippingAddress) {
      return NextResponse.json({ error: 'Shipping address required' }, { status: 400 });
    }

    // Get offer with items
    const offer = await prisma.offer.findUnique({
      where: { id },
      include: { 
        items: true,
        seller: true,
        inquiry: true,
      },
    });

    if (!offer) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }

    if (offer.status !== 'PENDING') {
      return NextResponse.json({ error: `Offer is ${offer.status.toLowerCase()}` }, { status: 400 });
    }

    // Check if expired
    if (new Date(offer.validUntil) < new Date()) {
      await prisma.offer.update({
        where: { id },
        data: { status: 'EXPIRED' },
      });
      return NextResponse.json({ error: 'Offer has expired' }, { status: 400 });
    }

    // Create order from offer
    const orderNumber = generateOrderNumber();
    
    const order = await prisma.order.create({
      data: {
        orderNumber,
        sellerId: offer.sellerId,
        customerEmail: offer.buyerEmail,
        customerName: offer.buyerName,
        customerPhone: shippingAddress.phone,
        subtotal: offer.subtotal,
        shippingCost: offer.shippingCost || 0,
        tax: offer.tax || 0,
        discount: offer.discount || 0,
        total: offer.total,
        shippingAddress,
        billingAddress: shippingAddress,
        paymentMethod: offer.paymentTerms || 'bank-transfer',
        paymentStatus: 'pending',
        status: 'PENDING',
        customerNotes,
        offerId: offer.id,
        items: {
          create: offer.items.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            productSlug: item.productSlug,
            productImage: item.productImage,
            quantity: item.quantity,
            unitPrice: item.offeredPrice,
            subtotal: item.subtotal,
            unit: item.unit,
            originalPrice: item.originalPrice,
            discountPercent: item.originalPrice 
              ? ((item.originalPrice - item.offeredPrice) / item.originalPrice) * 100 
              : null,
          })),
        },
      },
      include: { items: true },
    });

    // Update offer status
    await prisma.offer.update({
      where: { id },
      data: { 
        status: 'ACCEPTED',
        acceptedAt: new Date(),
      },
    });

    // Update inquiry status
    await prisma.inquiry.update({
      where: { id: offer.inquiryId },
      data: { status: 'WON' },
    });

    // Add message to inquiry
    await prisma.inquiryMessage.create({
      data: {
        inquiryId: offer.inquiryId,
        message: `Offer ${offer.offerNumber} accepted! Order ${orderNumber} created.`,
        senderType: 'system',
        senderName: 'System',
      },
    });

    // Create invoice
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: generateInvoiceNumber(offer.sellerId),
        orderId: order.id,
        sellerId: offer.sellerId,
        customerName: offer.buyerName,
        customerEmail: offer.buyerEmail,
        customerPhone: shippingAddress.phone,
        customerCompany: offer.inquiry?.buyerCompany,
        customerAddress: shippingAddress,
        sellerName: offer.seller.businessName,
        sellerEmail: offer.seller.businessEmail,
        sellerPhone: offer.seller.businessPhone,
        sellerAddress: offer.seller.address ? { address: offer.seller.address } : undefined,
        items: offer.items.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          productSlug: item.productSlug,
          quantity: item.quantity,
          unitPrice: item.offeredPrice,
          subtotal: item.subtotal,
          unit: item.unit,
        })),
        subtotal: offer.subtotal,
        shippingCost: offer.shippingCost || 0,
        tax: offer.tax || 0,
        discount: offer.discount || 0,
        total: offer.total,
        paymentMethod: offer.paymentTerms,
        paymentTerms: offer.paymentTerms,
        status: 'SENT',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      },
    });

    // Send real-time notifications
    // Notify seller that offer was accepted
    await notifications.offerAccepted(
      offer.sellerId,
      offer.offerNumber,
      offer.buyerName,
      order.id
    );

    // Notify seller of new order
    await notifications.orderCreated(
      offer.sellerId,
      order.orderNumber,
      offer.buyerName,
      order.total,
      order.id
    );

    // Send system message to chat
    await publishChatMessage({
      roomType: 'inquiry',
      roomId: offer.inquiryId,
      message: `Offer ${offer.offerNumber} accepted! Order ${order.orderNumber} created.`,
      metadata: {
        type: 'system',
        senderType: 'system',
        senderName: 'System',
        offerId: offer.id,
        offerNumber: offer.offerNumber,
        offerStatus: 'ACCEPTED',
      },
    });

    return NextResponse.json({ 
      order, 
      invoice,
      message: 'Offer accepted successfully',
    });
  } catch (error) {
    console.error('Accept offer error:', error);
    return NextResponse.json({ error: 'Failed to accept offer' }, { status: 500 });
  }
}
