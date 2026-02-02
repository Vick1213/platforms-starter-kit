import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getSellerByUserId } from '@/lib/db';
import { 
  getConversation, 
  sendMessage 
} from '@/lib/chat-db';
import { notifications, publishChatMessage } from '@/lib/ably-server';

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

    // Calculate totals
    const offerItems = items.map((item: any) => ({
      ...item,
      subtotal: item.offeredPrice * item.quantity,
    }));
    
    const subtotal = offerItems.reduce((sum: number, item: any) => sum + item.subtotal, 0);
    const total = subtotal + shippingCost + tax - discount;
    
    // Generate offer number
    const offerNumber = `OFF-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    
    // Calculate valid until date
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + validDays);

    // Create offer object (stored in chat message)
    const offer = {
      id: `offer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      offerNumber,
      sellerId: seller.id,
      sellerName: seller.businessName,
      buyerId: conversation.buyerId,
      buyerName: conversation.buyerName,
      buyerEmail: conversation.buyerEmail,
      items: offerItems,
      subtotal,
      shippingCost,
      tax,
      discount,
      total,
      validUntil: validUntil.toISOString(),
      validDays,
      paymentTerms,
      shippingTerms,
      deliveryTime,
      notes,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    // Send offer as a chat message
    const message = await sendMessage({
      conversationId,
      senderId: session.user.id,
      senderType: 'seller',
      senderName: seller.businessName,
      senderAvatar: seller.logo || undefined,
      type: 'offer',
      content: `New offer: ${offerNumber} - Total: $${total.toFixed(2)} (Valid for ${validDays} days)`,
      offerContext: {
        offerId: offer.id,
        offerNumber,
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
      message: `New offer: ${offerNumber}`,
      metadata: {
        type: 'offer',
        senderType: 'seller',
        senderName: seller.businessName,
        offerId: offer.id,
        offerNumber,
        offerTotal: total,
        offerStatus: 'PENDING',
      },
    });

    // Notify buyer
    await notifications.offerReceived(
      conversation.buyerId,
      offerNumber,
      seller.businessName,
      total,
      offer.id
    );

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
