/**
 * Product Enquiry API Route
 * Handles initial product enquiries from store visitors
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getSellerBySubdomain } from '@/lib/db';
import {
  createConversation,
  getConversationBetween,
  sendMessage,
  createEnquiry,
} from '@/lib/chat-db';

// POST /api/chat/enquiry - Create a product enquiry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      sellerId,
      sellerSubdomain,
      productId,
      productName,
      productImage,
      buyerName,
      buyerEmail,
      buyerPhone,
      buyerCompany,
      message,
      quantity,
      targetPrice,
      deliveryRequirements,
    } = body;

    if (!sellerId || !productId || !productName || !buyerName || !buyerEmail || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get seller details
    const seller = await getSellerBySubdomain(sellerSubdomain);
    if (!seller) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 });
    }

    // Check if user is logged in
    const session = await auth();
    const isLoggedIn = !!session?.user?.id;

    // Create the enquiry record
    const enquiry = await createEnquiry({
      sellerId,
      productId,
      productName,
      buyerId: session?.user?.id,
      buyerName,
      buyerEmail,
      buyerPhone,
      buyerCompany,
      message,
      quantity,
      targetPrice,
      deliveryRequirements,
    });

    let conversation = null;
    let sentMessage = null;

    // If user is logged in, create/get conversation and send message
    if (isLoggedIn && session?.user) {
      // Check for existing conversation
      conversation = await getConversationBetween(seller.id, session.user.id);

      if (!conversation) {
        conversation = await createConversation({
          sellerId: seller.id,
          sellerName: seller.businessName,
          sellerLogo: seller.logo || undefined,
          sellerSubdomain: seller.subdomain,
          buyerId: session.user.id,
          buyerName: session.user.name || buyerName,
          buyerEmail: session.user.email || buyerEmail,
          buyerAvatar: session.user.image || undefined,
          initialProduct: {
            productId,
            productName,
            productImage,
          },
        });
      }

      // Send the enquiry as a message
      sentMessage = await sendMessage({
        conversationId: conversation.id,
        senderId: session.user.id,
        senderType: 'buyer',
        senderName: session.user.name || buyerName,
        senderAvatar: session.user.image || undefined,
        type: 'product-inquiry',
        content: message,
        productContext: {
          productId,
          productName,
          productImage,
        },
        quoteRequest: quantity || targetPrice ? {
          quantity: quantity || 0,
          targetPrice,
          specifications: deliveryRequirements,
        } : undefined,
      });
    }

    return NextResponse.json({
      success: true,
      enquiry,
      conversation,
      message: sentMessage,
      isLoggedIn,
    });
  } catch (error) {
    console.error('Error creating enquiry:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
