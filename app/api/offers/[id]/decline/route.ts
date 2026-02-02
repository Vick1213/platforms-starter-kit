import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { notifications, publishChatMessage } from '@/lib/ably-server';

// POST /api/offers/[id]/decline - Decline an offer
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { reason } = body;

    // Get offer
    const offer = await prisma.offer.findUnique({
      where: { id },
    });

    if (!offer) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }

    if (offer.status !== 'PENDING') {
      return NextResponse.json({ error: `Offer is already ${offer.status.toLowerCase()}` }, { status: 400 });
    }

    // Update offer status
    await prisma.offer.update({
      where: { id },
      data: { 
        status: 'DECLINED',
        declinedAt: new Date(),
        declineReason: reason,
      },
    });

    // Add message to inquiry
    await prisma.inquiryMessage.create({
      data: {
        inquiryId: offer.inquiryId,
        message: `Offer ${offer.offerNumber} was declined.${reason ? ` Reason: ${reason}` : ''}`,
        senderType: 'buyer',
        senderName: offer.buyerName,
      },
    });

    // Send real-time notifications
    // Notify seller that offer was declined
    await notifications.offerDeclined(
      offer.sellerId,
      offer.offerNumber,
      offer.buyerName
    );

    // Send system message to chat
    await publishChatMessage({
      roomType: 'inquiry',
      roomId: offer.inquiryId,
      message: `Offer ${offer.offerNumber} was declined.${reason ? ` Reason: ${reason}` : ''}`,
      metadata: {
        type: 'system',
        senderType: 'system',
        senderName: 'System',
        offerId: offer.id,
        offerNumber: offer.offerNumber,
        offerStatus: 'DECLINED',
      },
    });

    return NextResponse.json({ 
      message: 'Offer declined',
      offerId: id,
    });
  } catch (error) {
    console.error('Decline offer error:', error);
    return NextResponse.json({ error: 'Failed to decline offer' }, { status: 500 });
  }
}
