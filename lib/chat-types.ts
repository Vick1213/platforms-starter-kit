// Chat & Messaging Types for Seller-Buyer Communication
// Similar to Alibaba's enquiry system

export type MessageType = 'text' | 'image' | 'product-inquiry' | 'quote-request' | 'order-related' | 'offer';

export type ConversationStatus = 'active' | 'archived' | 'spam';

export type MessageStatus = 'sent' | 'delivered' | 'read';

// Offer context for offer messages
export interface OfferContext {
  offerId: string;
  offerNumber: string;
  total: number;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED' | 'WITHDRAWN';
  validUntil?: string;
  itemCount: number;
}

// Individual message in a conversation
export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderType: 'buyer' | 'seller';
  senderName: string;
  senderAvatar?: string;
  type: MessageType;
  content: string;
  attachments?: MessageAttachment[];
  // Product context if message is about a specific product
  productContext?: {
    productId: string;
    productName: string;
    productImage?: string;
    productPrice?: number;
  };
  // Quote request details
  quoteRequest?: {
    quantity: number;
    targetPrice?: number;
    deliveryDate?: string;
    specifications?: string;
  };
  // Offer context if message is about an offer
  offerContext?: OfferContext;
  status: MessageStatus;
  createdAt: string;
  readAt?: string;
}

export interface MessageAttachment {
  id: string;
  type: 'image' | 'document' | 'video';
  url: string;
  name: string;
  size?: number;
}

// Conversation between buyer and seller
export interface Conversation {
  id: string;
  sellerId: string;
  sellerName: string;
  sellerLogo?: string;
  sellerSubdomain: string;
  inquiryId?: string;
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  buyerAvatar?: string;
  // Initial product that started the conversation (optional)
  initialProduct?: {
    productId: string;
    productName: string;
    productImage?: string;
  };
  status: ConversationStatus;
  lastMessage?: {
    content: string;
    senderId: string;
    senderType: 'buyer' | 'seller';
    createdAt: string;
  };
  unreadCountSeller: number;
  unreadCountBuyer: number;
  createdAt: string;
  updatedAt: string;
}

// Enquiry form data (initial contact)
export interface ProductEnquiry {
  productId: string;
  productName: string;
  sellerId: string;
  buyerId?: string; // Optional for guest enquiries
  buyerName: string;
  buyerEmail: string;
  buyerPhone?: string;
  buyerCompany?: string;
  message: string;
  quantity?: number;
  targetPrice?: number;
  deliveryRequirements?: string;
  createdAt: string;
}

// Quick reply templates for sellers
export interface QuickReply {
  id: string;
  sellerId: string;
  title: string;
  content: string;
  category: 'greeting' | 'pricing' | 'shipping' | 'product' | 'general';
}

// Default quick replies
export const defaultQuickReplies: Omit<QuickReply, 'id' | 'sellerId'>[] = [
  {
    title: 'Thank you for your enquiry',
    content: 'Thank you for your interest in our products! I\'d be happy to help you. Could you please provide more details about your requirements?',
    category: 'greeting',
  },
  {
    title: 'Bulk pricing available',
    content: 'Yes, we offer competitive bulk pricing for larger orders. The price per unit decreases with quantity. Please let me know your target quantity and I\'ll provide a detailed quote.',
    category: 'pricing',
  },
  {
    title: 'Shipping information',
    content: 'We ship worldwide. Delivery time depends on your location and order size. Standard shipping takes 5-7 business days domestically. I can provide an exact quote once I know your shipping address.',
    category: 'shipping',
  },
  {
    title: 'Product customization',
    content: 'Yes, we can customize this product according to your specifications. Please share your requirements including colors, sizes, packaging, and branding needs.',
    category: 'product',
  },
  {
    title: 'Request for quote',
    content: 'I\'d be happy to provide a formal quote. To prepare an accurate quotation, please confirm: 1) Quantity needed, 2) Delivery location, 3) Required delivery date, 4) Any special requirements.',
    category: 'general',
  },
];

// Chat notification preferences
export interface ChatNotificationSettings {
  emailOnNewMessage: boolean;
  emailDigestFrequency: 'instant' | 'hourly' | 'daily' | 'never';
  browserNotifications: boolean;
  soundEnabled: boolean;
}

export const defaultChatNotificationSettings: ChatNotificationSettings = {
  emailOnNewMessage: true,
  emailDigestFrequency: 'instant',
  browserNotifications: true,
  soundEnabled: true,
};
