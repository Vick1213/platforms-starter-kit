/**
 * Ably Chat Client Configuration
 * Real-time messaging for buyer-seller communication
 */

import * as Ably from 'ably';
import { ChatClient, LogLevel } from '@ably/chat';

// Create Ably Realtime client
export function createAblyClient(clientId: string) {
  return new Ably.Realtime({
    authUrl: '/api/ably/token',
    authMethod: 'POST',
    clientId,
  });
}

// Create Chat client
export function createChatClient(realtimeClient: Ably.Realtime) {
  return new ChatClient(realtimeClient, {
    logLevel: process.env.NODE_ENV === 'development' ? LogLevel.Debug : LogLevel.Error,
  });
}

// Room naming conventions
export const roomNames = {
  // Inquiry chat room
  inquiry: (inquiryId: string) => `inquiry:${inquiryId}`,
  
  // Direct conversation between buyer and seller
  conversation: (conversationId: string) => `conversation:${conversationId}`,
  
  // Seller's notification channel
  sellerNotifications: (sellerId: string) => `notifications:seller:${sellerId}`,
  
  // Buyer's notification channel
  buyerNotifications: (userId: string) => `notifications:user:${userId}`,
};

// Message metadata types
export interface ChatMessageMetadata {
  type: 'text' | 'product-inquiry' | 'offer' | 'offer-accepted' | 'offer-declined' | 'system';
  // Product context
  productId?: string;
  productName?: string;
  productImage?: string;
  productPrice?: number;
  // Offer context
  offerId?: string;
  offerNumber?: string;
  offerTotal?: number;
  offerStatus?: string;
  offerItemCount?: number;
  offerValidUntil?: string;
  // Sender info
  senderType: 'buyer' | 'seller' | 'system';
  senderName: string;
  senderAvatar?: string;
}

// Notification types
export type NotificationType = 
  | 'new_inquiry'
  | 'new_message' 
  | 'offer_sent'
  | 'offer_received'
  | 'offer_accepted'
  | 'offer_declined'
  | 'order_created'
  | 'invoice_sent'
  | 'payment_received';

export interface NotificationPayload {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  data?: Record<string, any>;
  createdAt: string;
  read: boolean;
}

// Helper to create notification
export function createNotification(
  type: NotificationType,
  title: string,
  message: string,
  link?: string,
  data?: Record<string, any>
): NotificationPayload {
  return {
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    title,
    message,
    link,
    data,
    createdAt: new Date().toISOString(),
    read: false,
  };
}

// Notification titles and messages
export const notificationTemplates = {
  new_inquiry: (productName: string, buyerName: string) => ({
    title: 'New Inquiry',
    message: `${buyerName} sent an inquiry about "${productName}"`,
  }),
  new_message: (senderName: string) => ({
    title: 'New Message',
    message: `${senderName} sent you a message`,
  }),
  offer_sent: (offerNumber: string, buyerName: string) => ({
    title: 'Offer Sent',
    message: `Offer ${offerNumber} sent to ${buyerName}`,
  }),
  offer_received: (offerNumber: string, sellerName: string, total: number) => ({
    title: 'New Offer Received',
    message: `${sellerName} sent you an offer for $${total.toFixed(2)}`,
  }),
  offer_accepted: (offerNumber: string, buyerName: string) => ({
    title: 'Offer Accepted! 🎉',
    message: `${buyerName} accepted offer ${offerNumber}`,
  }),
  offer_declined: (offerNumber: string, buyerName: string) => ({
    title: 'Offer Declined',
    message: `${buyerName} declined offer ${offerNumber}`,
  }),
  order_created: (orderNumber: string, total: number) => ({
    title: 'New Order',
    message: `Order ${orderNumber} created - $${total.toFixed(2)}`,
  }),
  invoice_sent: (invoiceNumber: string, total: number) => ({
    title: 'Invoice Sent',
    message: `Invoice ${invoiceNumber} for $${total.toFixed(2)} sent`,
  }),
  payment_received: (invoiceNumber: string, amount: number) => ({
    title: 'Payment Received 💰',
    message: `Payment of $${amount.toFixed(2)} received for ${invoiceNumber}`,
  }),
};
