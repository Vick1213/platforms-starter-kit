import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getSellerByUserId } from '@/lib/db';
import { prisma } from '@/lib/prisma';
import { calculateOfferTotals, generateOfferNumber } from '@/lib/offer-types';
import { 
  getConversation, 
  sendMessage 
} from '@/lib/chat-db';
import { notifications, publishChatMessage, sendOfferToChat } from '@/lib/ably-server';

// POST /api/chat/offer - Send an offer through chat
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get seller
    const seller = await getSellerByUserId(session.user.id);
    if (!seller || seller.status !== 'approved') {
      return NextResponse.json({ error: 'Not a seller' }, { status: 403 });
    }

    const body = await request.json();
    const {
      conversationId,
      inquiryId,
      items,
      shippingCost = 0,
      tax = 0,
      discount = 0,
      validDays = 7,
      paymentTerms,
      shippingTerms,
      deliveryTime,
      notes,
    } = body;

    if (!conversationId || !items?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify conversation exists and seller owns it
    const conversation = await getConversation(conversationId);
    if (!conversation || conversation.sellerId !== seller.id) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Normalize items to match OfferItem model requirements
    const offerItems = items
      .map((item: any, index: number) => {
        const productName = String(item.productName || '').trim();
        const quantity = Math.max(1, Number(item.quantity) || 1);
        const offeredPrice = Number(item.offeredPrice) || 0;
        const productSlug = (String(item.productSlug || '').trim() || productName.toLowerCase().replace(/\s+/g, '-')).replace(/[^a-z0-9-]/g, '');

        return {
          productId: String(item.productId || '').trim() || `manual-${Date.now()}-${index}`,
          productName,
          productSlug: productSlug || `item-${index + 1}`,
          productImage: item.productImage || undefined,
          quantity,
          originalPrice: item.originalPrice !== undefined && item.originalPrice !== null ? Number(item.originalPrice) : undefined,
          offeredPrice,
          subtotal: offeredPrice * quantity,
          unit: item.unit || undefined,
          notes: item.notes || undefined,
        };
      })
      .filter((item: any) => item.productName && item.offeredPrice > 0);

    if (offerItems.length === 0) {
      return NextResponse.json({ error: 'Please add at least one valid item' }, { status: 400 });
    }

    const { subtotal, total } = calculateOfferTotals(offerItems, shippingCost, tax, discount);

    // Calculate valid until date
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + validDays);

    // Resolve inquiry for this conversation
    let inquiry = null;
    const resolvedInquiryId = inquiryId || conversation.inquiryId;

    if (resolvedInquiryId) {
      inquiry = await prisma.inquiry.findUnique({
        where: { id: resolvedInquiryId },
        include: { company: { include: { seller: true } } },
      });
    } else {
      inquiry = await prisma.inquiry.findFirst({
        where: {
          company: { seller: { id: seller.id } },
          buyerEmail: conversation.buyerEmail,
          ...(conversation.initialProduct?.productId
            ? { products: { some: { productId: conversation.initialProduct.productId } } }
            : {}),
        },
        include: { company: { include: { seller: true } } },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (!inquiry || inquiry.company.seller?.id !== seller.id) {
      return NextResponse.json(
        { error: 'Inquiry not found for this conversation. Please provide a valid inquiryId.' },
        { status: 404 }
      );
    }

    // Create persistent offer in DB
    const offer = await prisma.offer.create({
      data: {
        offerNumber: generateOfferNumber(),
        inquiryId: inquiry.id,
        sellerId: seller.id,
        buyerEmail: inquiry.buyerEmail,
        buyerName: inquiry.buyerName,
        subtotal,
        shippingCost,
        tax,
        discount,
        total,
        validUntil,
        paymentTerms,
        shippingTerms,
        deliveryTime,
        notes,
        items: {
          create: offerItems,
        },
      },
      include: { items: true },
    });

    await prisma.inquiry.update({
      where: { id: inquiry.id },
      data: { status: 'QUOTED', quotedPrice: total },
    });

    await prisma.inquiryMessage.create({
      data: {
        inquiryId: inquiry.id,
        message: `New offer sent: ${offer.offerNumber} - Total: $${total.toFixed(2)}`,
        senderType: 'seller',
        senderName: seller.businessName,
      },
    });

    // Send offer as a chat message
    await sendMessage({
      conversationId,
      senderId: session.user.id,
      senderType: 'seller',
      senderName: seller.businessName,
      senderAvatar: seller.logo || undefined,
      type: 'offer',
      content: `New offer: ${offer.offerNumber} - Total: $${total.toFixed(2)} (Valid for ${validDays} days)`,
      offerContext: {
        offerId: offer.id,
        offerNumber: offer.offerNumber,
        total,
        status: 'PENDING',
        validUntil: validUntil.toISOString(),
        itemCount: offerItems.length,
      },
    });

    // Publish real-time message
    await publishChatMessage({
      roomType: 'conversation',
      roomId: conversationId,
      message: `New offer: ${offer.offerNumber}`,
      metadata: {
        type: 'offer',
        senderType: 'seller',
        senderName: seller.businessName,
        offerId: offer.id,
        offerNumber: offer.offerNumber,
        offerTotal: total,
        offerStatus: 'PENDING',
      },
    });

    // Publish into inquiry room used by offer lifecycle updates
    await sendOfferToChat(
      inquiry.id,
      offer.id,
      offer.offerNumber,
      total,
      seller.businessName
    );

    const buyer = await prisma.user.findUnique({ where: { email: inquiry.buyerEmail } });
    if (buyer) {
      await notifications.offerReceived(
        buyer.id,
        offer.offerNumber,
        seller.businessName,
        total,
        offer.id
      );
    }

    return NextResponse.json({
      success: true,
      offer,
      message: 'Offer sent successfully',
    });
  } catch (error) {
    console.error('Create chat offer error:', error);
    return NextResponse.json({ error: 'Failed to create offer' }, { status: 500 });
  }
}
