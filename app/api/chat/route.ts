/**
 * Chat API Routes
 * Handles conversations and messages between buyers and sellers
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getSellerByUserId } from '@/lib/db';
import {
  createConversation,
  getConversation,
  getConversationBetween,
  getSellerConversations,
  getBuyerConversations,
  sendMessage,
  getMessages,
  markMessagesAsRead,
  getTotalUnreadCount,
} from '@/lib/chat-db';

// GET /api/chat - Get user's conversations
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role'); // 'seller' or 'buyer'
    const conversationId = searchParams.get('conversationId');

    // If conversationId is provided, get messages for that conversation
    if (conversationId) {
      const conversation = await getConversation(conversationId);
      if (!conversation) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
      }

      // Verify user is part of this conversation
      const isSeller = conversation.sellerId === session.user.id;
      const isBuyer = conversation.buyerId === session.user.id;
      
      // For sellers, also check if they own the seller account
      let isSellerOwner = false;
      if (!isSeller && !isBuyer) {
        const seller = await getSellerByUserId(session.user.id);
        if (seller && seller.id === conversation.sellerId) {
          isSellerOwner = true;
        }
      }

      if (!isSeller && !isBuyer && !isSellerOwner) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      const messages = await getMessages(conversationId, 100);
      
      // Mark messages as read
      const userType = (isSeller || isSellerOwner) ? 'seller' : 'buyer';
      await markMessagesAsRead(conversationId, session.user.id, userType);

      return NextResponse.json({ 
        conversation, 
        messages,
      });
    }

    // Get conversations based on role
    if (role === 'seller') {
      const seller = await getSellerByUserId(session.user.id);
      if (!seller) {
        return NextResponse.json({ error: 'Not a seller' }, { status: 403 });
      }

      const conversations = await getSellerConversations(seller.id);
      const unreadCount = await getTotalUnreadCount(seller.id, 'seller');

      return NextResponse.json({ conversations, unreadCount });
    } else {
      // Buyer conversations
      const conversations = await getBuyerConversations(session.user.id);
      const unreadCount = await getTotalUnreadCount(session.user.id, 'buyer');

      return NextResponse.json({ conversations, unreadCount });
    }
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/chat - Create conversation or send message
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'create-conversation') {
      const { sellerId, sellerName, sellerLogo, sellerSubdomain, productContext } = body;

      if (!sellerId || !sellerName || !sellerSubdomain) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }

      // Check if conversation already exists
      let conversation = await getConversationBetween(sellerId, session.user.id);
      
      if (!conversation) {
        conversation = await createConversation({
          sellerId,
          sellerName,
          sellerLogo,
          sellerSubdomain,
          buyerId: session.user.id,
          buyerName: session.user.name || 'Anonymous',
          buyerEmail: session.user.email || '',
          buyerAvatar: session.user.image || undefined,
          initialProduct: productContext,
        });
      }

      return NextResponse.json({ conversation });
    }

    if (action === 'send-message') {
      const { conversationId, content, type, productContext, quoteRequest, attachments } = body;

      if (!conversationId || !content) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }

      const conversation = await getConversation(conversationId);
      if (!conversation) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
      }

      // Determine sender type
      const seller = await getSellerByUserId(session.user.id);
      const isSeller = seller && seller.id === conversation.sellerId;
      
      const message = await sendMessage({
        conversationId,
        senderId: session.user.id,
        senderType: isSeller ? 'seller' : 'buyer',
        senderName: session.user.name || 'Anonymous',
        senderAvatar: session.user.image || undefined,
        type: type || 'text',
        content,
        productContext,
        quoteRequest,
        attachments,
      });

      return NextResponse.json({ message });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
