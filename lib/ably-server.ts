import Ably from 'ably';
import { roomNames, NotificationType, createNotification } from './ably';

// Server-side Ably client for publishing messages
let serverAblyClient: Ably.Rest | null = null;

function getServerAblyClient() {
  if (!serverAblyClient) {
    const apiKey = process.env.ABLY_API_KEY;
    if (!apiKey) {
      throw new Error('ABLY_API_KEY environment variable is not set');
    }
    serverAblyClient = new Ably.Rest(apiKey);
  }
  return serverAblyClient;
}

// Publish a notification to a user's notification channel
export async function publishNotification({
  type,
  title,
  message,
  link,
  data,
  userId,
  sellerId,
}: {
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  data?: Record<string, any>;
  userId?: string;
  sellerId?: string;
}) {
  try {
    const client = getServerAblyClient();
    
    // Determine the channel based on recipient
    const channelName = sellerId 
      ? roomNames.sellerNotifications(sellerId)
      : userId 
        ? roomNames.buyerNotifications(userId)
        : null;

    if (!channelName) {
      console.error('No recipient specified for notification');
      return;
    }

    const notification = createNotification(type, title, message, link, data);
    const channel = client.channels.get(channelName);
    
    await channel.publish('notification', notification);
    console.log(`Published notification to ${channelName}:`, type);
  } catch (error) {
    console.error('Failed to publish notification:', error);
    // Don't throw - notifications are non-critical
  }
}

// Publish a message to an inquiry/conversation chat
export async function publishChatMessage({
  roomType,
  roomId,
  message,
  metadata,
}: {
  roomType: 'inquiry' | 'conversation';
  roomId: string;
  message: string;
  metadata?: {
    type?: 'text' | 'system' | 'product-inquiry' | 'offer';
    senderType?: 'seller' | 'user' | 'system';
    senderName?: string;
    offerId?: string;
    offerNumber?: string;
    offerTotal?: number;
    offerStatus?: string;
    productId?: string;
    productName?: string;
    productImage?: string;
  };
}) {
  try {
    const client = getServerAblyClient();
    
    const channelName = roomType === 'inquiry' 
      ? roomNames.inquiry(roomId)
      : roomNames.conversation(roomId);

    const channel = client.channels.get(channelName);
    
    await channel.publish('chat.message', {
      text: message,
      metadata: {
        type: metadata?.type || 'text',
        ...metadata,
      },
      timestamp: new Date().toISOString(),
    });
    
    console.log(`Published chat message to ${channelName}`);
  } catch (error) {
    console.error('Failed to publish chat message:', error);
    // Don't throw - real-time is non-critical, messages are still saved to DB
  }
}

// Helper functions for common notification types
export const notifications = {
  // Notify user when they receive an offer
  offerReceived: async (userId: string | undefined, offerNumber: string, sellerName: string, total: number, offerId: string) => {
    if (!userId) return; // Anonymous users don't get notifications
    await publishNotification({
      type: 'offer_received',
      title: 'New Offer Received',
      message: `${sellerName} sent you an offer for $${total.toFixed(2)}`,
      link: `/offers/${offerId}`,
      data: { offerNumber, total },
      userId,
    });
  },

  // Notify seller when their offer is accepted
  offerAccepted: async (sellerId: string, offerNumber: string, buyerName: string, orderId: string) => {
    await publishNotification({
      type: 'offer_accepted',
      title: 'Offer Accepted!',
      message: `${buyerName} accepted your offer ${offerNumber}`,
      link: `/seller/orders/${orderId}`,
      data: { offerNumber },
      sellerId,
    });
  },

  // Notify seller when their offer is declined
  offerDeclined: async (sellerId: string, offerNumber: string, buyerName: string) => {
    await publishNotification({
      type: 'offer_declined',
      title: 'Offer Declined',
      message: `${buyerName} declined your offer ${offerNumber}`,
      link: `/seller/messages`,
      data: { offerNumber },
      sellerId,
    });
  },

  // Notify seller of new inquiry
  newInquiry: async (sellerId: string, inquiryNumber: string, buyerName: string, productName: string, inquiryId: string) => {
    await publishNotification({
      type: 'new_inquiry',
      title: 'New Inquiry',
      message: `${buyerName} inquired about ${productName}`,
      link: `/seller/messages/${inquiryId}`,
      data: { inquiryNumber, productName },
      sellerId,
    });
  },

  // Notify recipient of new chat message
  newMessage: async (recipientSellerId: string | undefined, recipientUserId: string | undefined, senderName: string, messagePreview: string, inquiryId: string) => {
    const link = recipientSellerId 
      ? `/seller/messages/${inquiryId}` 
      : `/inquiries/${inquiryId}`;
    
    await publishNotification({
      type: 'new_message',
      title: 'New Message',
      message: `${senderName}: ${messagePreview.slice(0, 50)}${messagePreview.length > 50 ? '...' : ''}`,
      link,
      data: { inquiryId },
      sellerId: recipientSellerId,
      userId: recipientUserId,
    });
  },

  // Notify seller of new order
  orderCreated: async (sellerId: string, orderNumber: string, customerName: string, total: number, orderId: string) => {
    await publishNotification({
      type: 'order_created',
      title: 'New Order!',
      message: `${customerName} placed an order for $${total.toFixed(2)}`,
      link: `/seller/orders/${orderId}`,
      data: { orderNumber, total },
      sellerId,
    });
  },

  // Notify customer invoice sent
  invoiceSent: async (userId: string | undefined, invoiceNumber: string, sellerName: string, total: number, invoiceId: string) => {
    if (!userId) return;
    await publishNotification({
      type: 'invoice_sent',
      title: 'Invoice Received',
      message: `${sellerName} sent you an invoice for $${total.toFixed(2)}`,
      link: `/invoices/${invoiceId}`,
      data: { invoiceNumber, total },
      userId,
    });
  },

  // Notify seller of payment
  paymentReceived: async (sellerId: string, orderNumber: string, amount: number, orderId: string) => {
    await publishNotification({
      type: 'payment_received',
      title: 'Payment Received',
      message: `Payment of $${amount.toFixed(2)} received for order ${orderNumber}`,
      link: `/seller/orders/${orderId}`,
      data: { orderNumber, amount },
      sellerId,
    });
  },
};

// Send offer message to chat
export async function sendOfferToChat(
  inquiryId: string,
  offerId: string,
  offerNumber: string,
  offerTotal: number,
  sellerName: string
) {
  await publishChatMessage({
    roomType: 'inquiry',
    roomId: inquiryId,
    message: `New offer: ${offerNumber}`,
    metadata: {
      type: 'offer',
      senderType: 'seller',
      senderName: sellerName,
      offerId,
      offerNumber,
      offerTotal,
      offerStatus: 'PENDING',
    },
  });
}
