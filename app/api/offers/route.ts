import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { generateOfferNumber, calculateOfferTotals } from '@/lib/offer-types';
import { notifications, sendOfferToChat } from '@/lib/ably-server';

// POST /api/offers - Create a new offer (seller only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get seller
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { seller: true },
    });

    if (!user?.seller || user.seller.status !== 'approved') {
      return NextResponse.json({ error: 'Not a seller' }, { status: 403 });
    }

    const body = await request.json();
    const {
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

    if (!inquiryId || !items?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify inquiry belongs to seller's company
    const inquiry = await prisma.inquiry.findUnique({
      where: { id: inquiryId },
      include: { company: { include: { seller: true } } },
    });

    if (!inquiry || inquiry.company.seller?.id !== user.seller.id) {
      return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 });
    }

    // Calculate totals
    const offerItems = items.map((item: any) => ({
      ...item,
      subtotal: item.offeredPrice * item.quantity,
    }));
    
    const { subtotal, total } = calculateOfferTotals(offerItems, shippingCost, tax, discount);
    
    // Calculate valid until date
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + validDays);

    // Create offer
    const offer = await prisma.offer.create({
      data: {
        offerNumber: generateOfferNumber(),
        inquiryId,
        sellerId: user.seller.id,
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
          create: offerItems.map((item: any) => ({
            productId: item.productId,
            productName: item.productName,
            productSlug: item.productSlug,
            productImage: item.productImage,
            quantity: item.quantity,
            originalPrice: item.originalPrice,
            offeredPrice: item.offeredPrice,
            subtotal: item.subtotal,
            unit: item.unit,
            notes: item.notes,
          })),
        },
      },
      include: { items: true },
    });

    // Update inquiry status
    await prisma.inquiry.update({
      where: { id: inquiryId },
      data: { status: 'QUOTED', quotedPrice: total },
    });

    // Add message to inquiry
    await prisma.inquiryMessage.create({
      data: {
        inquiryId,
        message: `New offer sent: ${offer.offerNumber} - Total: $${total.toFixed(2)}`,
        senderType: 'seller',
        senderName: user.seller.businessName,
      },
    });

    // Send real-time notifications
    // Send offer as chat message
    await sendOfferToChat(
      inquiryId,
      offer.id,
      offer.offerNumber,
      total,
      user.seller.businessName
    );
    
    // Notify buyer (if they're a registered user)
    const buyer = await prisma.user.findUnique({ where: { email: inquiry.buyerEmail } });
    if (buyer) {
      await notifications.offerReceived(buyer.id, offer.offerNumber, user.seller.businessName, total, offer.id);
    }

    return NextResponse.json(offer);
  } catch (error) {
    console.error('Create offer error:', error);
    return NextResponse.json({ error: 'Failed to create offer' }, { status: 500 });
  }
}

// GET /api/offers - Get offers
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const offerId = searchParams.get('id');
    const offerNumber = searchParams.get('offerNumber');
    const inquiryId = searchParams.get('inquiryId');
    const email = searchParams.get('email');

    // Get specific offer by ID or number
    if (offerId || offerNumber) {
      const offer = await prisma.offer.findFirst({
        where: offerId ? { id: offerId } : { offerNumber: offerNumber! },
        include: { 
          items: true,
          seller: { select: { businessName: true, businessEmail: true, businessPhone: true } },
          inquiry: { select: { inquiryNumber: true, subject: true } },
        },
      });

      if (!offer) {
        return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
      }

      return NextResponse.json(offer);
    }

    // Get offers for an inquiry
    if (inquiryId) {
      const offers = await prisma.offer.findMany({
        where: { inquiryId },
        include: { items: true },
        orderBy: { createdAt: 'desc' },
      });
      return NextResponse.json(offers);
    }

    // Get offers by buyer email
    if (email) {
      const offers = await prisma.offer.findMany({
        where: { buyerEmail: email },
        include: { 
          items: true,
          seller: { select: { businessName: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      return NextResponse.json(offers);
    }

    // Seller: Get their offers
    const session = await auth();
    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { seller: true },
      });

      if (user?.seller) {
        const offers = await prisma.offer.findMany({
          where: { sellerId: user.seller.id },
          include: { 
            items: true,
            inquiry: { select: { inquiryNumber: true, subject: true, buyerCompany: true } },
          },
          orderBy: { createdAt: 'desc' },
        });
        return NextResponse.json(offers);
      }
    }

    return NextResponse.json({ error: 'Missing query parameters' }, { status: 400 });
  } catch (error) {
    console.error('Get offers error:', error);
    return NextResponse.json({ error: 'Failed to get offers' }, { status: 500 });
  }
}
