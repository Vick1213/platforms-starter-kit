import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { 
  createConversation, 
  getConversationBetween,
  sendMessage 
} from '@/lib/chat-db';
import { notifications, publishChatMessage } from '@/lib/ably-server';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    const body = await request.json();
    const { sellerId, productId, productName, productImage, quantity, message, subject } = body;

    // Validate required fields
    if (!sellerId || !message) {
      return NextResponse.json(
        { error: 'Seller ID and message are required' },
        { status: 400 }
      );
    }

    // Get seller info with their company
    const seller = await prisma.seller.findUnique({
      where: { id: sellerId },
      include: { 
        user: true,
        company: true,
      },
    });

    if (!seller) {
      return NextResponse.json(
        { error: 'Seller not found' },
        { status: 404 }
      );
    }

    let inquiryId: string | null = null;

    // Try to create inquiry in database if seller has a company
    if (seller.company) {
      try {
        const inquiry = await prisma.inquiry.create({
          data: {
            companyId: seller.company.id,
            userId: session?.user?.id || null,
            buyerEmail: session?.user?.email || 'anonymous@guest.com',
            buyerName: session?.user?.name || 'Anonymous Guest',
            message,
            subject: subject || `Inquiry about ${productName || 'your products'}`,
            quantity: quantity || null,
            status: 'NEW',
          },
        });
        inquiryId = inquiry.id;

        // Link product if specified
        if (productId) {
          try {
            await prisma.inquiryProduct.create({
              data: {
                inquiryId: inquiry.id,
                productId,
                quantity: quantity || 1,
              },
            });
          } catch (e) {
            console.log('Could not link product to inquiry:', e);
          }
        }
      } catch (e) {
        console.log('Could not create inquiry in database:', e);
      }
    }

    // Create or get chat conversation (requires logged-in user)
    let conversationId: string | null = null;
    if (session?.user?.id) {
      try {
        // Check if conversation already exists
        let conversation = await getConversationBetween(seller.id, session.user.id);
        
        if (!conversation) {
          // Create new conversation
          conversation = await createConversation({
            sellerId: seller.id,
            sellerName: seller.businessName,
            sellerLogo: seller.logo || undefined,
            sellerSubdomain: seller.subdomain,
            buyerId: session.user.id,
            buyerName: session.user.name || 'Anonymous',
            buyerEmail: session.user.email || '',
            buyerAvatar: session.user.image || undefined,
            initialProduct: productId ? {
              productId,
              productName: productName || 'Product',
              productImage,
            } : undefined,
          });
        }

        conversationId = conversation.id;

        // Send the inquiry as a chat message
        const chatMessage = await sendMessage({
          conversationId: conversation.id,
          senderId: session.user.id,
          senderType: 'buyer',
          senderName: session.user.name || 'Anonymous',
          senderAvatar: session.user.image || undefined,
          type: productId ? 'product-inquiry' : 'text',
          content: message,
          productContext: productId ? {
            productId,
            productName: productName || 'Product',
            productImage,
            productPrice: undefined,
          } : undefined,
          quoteRequest: quantity ? {
            quantity,
          } : undefined,
        });

        // Publish real-time message
        await publishChatMessage({
          roomType: 'conversation',
          roomId: conversation.id,
          message,
          metadata: {
            type: productId ? 'product-inquiry' : 'text',
            senderType: 'user',
            senderName: session.user.name || 'Anonymous',
            productId,
            productName,
            productImage,
          },
        });

        // Notify seller of new message
        await notifications.newMessage(
          seller.id,
          undefined,
          session.user.name || 'Customer',
          message,
          conversation.id
        );

      } catch (e) {
        console.error('Error creating chat conversation:', e);
        // Don't fail the whole request if chat creation fails
      }
    }

    return NextResponse.json({
      success: true,
      inquiryId,
      conversationId,
      message: session?.user?.id 
        ? 'Inquiry sent! You can continue the conversation in your messages.'
        : 'Inquiry sent successfully! Sign in to track your conversation.',
    });
  } catch (error) {
    console.error('Error creating inquiry:', error);
    return NextResponse.json(
      { error: 'Failed to send inquiry' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const sellerId = searchParams.get('sellerId');

    // If sellerId is provided, get inquiries for that seller (seller viewing their inquiries)
    if (sellerId) {
      const seller = await prisma.seller.findFirst({
        where: { 
          id: sellerId,
          userId: session.user.id,
        },
        include: { company: true },
      });

      if (!seller || !seller.company) {
        return NextResponse.json(
          { error: 'Unauthorized or no company profile' },
          { status: 403 }
        );
      }

      const inquiries = await prisma.inquiry.findMany({
        where: { companyId: seller.company.id },
        include: {
          products: {
            include: {
              product: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return NextResponse.json(inquiries);
    }

    // Otherwise, get inquiries sent by the current user
    const inquiries = await prisma.inquiry.findMany({
      where: { userId: session.user.id },
      include: {
        company: {
          select: {
            name: true,
            logo: true,
            seller: {
              select: {
                businessName: true,
                logo: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(inquiries);
  } catch (error) {
    console.error('Error fetching inquiries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inquiries' },
      { status: 500 }
    );
  }
}
