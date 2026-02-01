/**
 * Chat & Messaging Database Operations
 * Handles conversations, messages, and enquiries between buyers and sellers
 */

import { redis } from './redis';
import { 
  ChatMessage, 
  Conversation, 
  ProductEnquiry,
  QuickReply,
  ChatNotificationSettings,
  defaultChatNotificationSettings,
  MessageStatus,
  ConversationStatus,
} from './chat-types';

// ============================================
// CACHE KEYS
// ============================================

const chatKeys = {
  // Conversations
  conversation: (id: string) => `chat:conversation:${id}`,
  sellerConversations: (sellerId: string) => `chat:seller:${sellerId}:conversations`,
  buyerConversations: (buyerId: string) => `chat:buyer:${buyerId}:conversations`,
  
  // Messages
  messages: (conversationId: string) => `chat:messages:${conversationId}`,
  
  // Enquiries
  enquiry: (id: string) => `chat:enquiry:${id}`,
  sellerEnquiries: (sellerId: string) => `chat:seller:${sellerId}:enquiries`,
  productEnquiries: (productId: string) => `chat:product:${productId}:enquiries`,
  
  // Quick replies
  quickReplies: (sellerId: string) => `chat:seller:${sellerId}:quickreplies`,
  
  // Settings
  chatSettings: (userId: string) => `chat:settings:${userId}`,
  
  // Unread counts
  unreadCount: (userId: string) => `chat:unread:${userId}`,
};

// ============================================
// CONVERSATION OPERATIONS
// ============================================

export async function createConversation(
  data: Omit<Conversation, 'id' | 'createdAt' | 'updatedAt' | 'unreadCountSeller' | 'unreadCountBuyer' | 'status'>
): Promise<Conversation> {
  const id = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date().toISOString();
  
  const conversation: Conversation = {
    ...data,
    id,
    status: 'active',
    unreadCountSeller: 0,
    unreadCountBuyer: 0,
    createdAt: now,
    updatedAt: now,
  };
  
  // Store conversation
  await redis.set(chatKeys.conversation(id), conversation);
  
  // Add to seller's conversation list
  await redis.lpush(chatKeys.sellerConversations(data.sellerId), id);
  
  // Add to buyer's conversation list
  await redis.lpush(chatKeys.buyerConversations(data.buyerId), id);
  
  return conversation;
}

export async function getConversation(id: string): Promise<Conversation | null> {
  return redis.get<Conversation>(chatKeys.conversation(id));
}

export async function getConversationBetween(
  sellerId: string, 
  buyerId: string
): Promise<Conversation | null> {
  // Get all conversations for buyer and find one with this seller
  const buyerConvIds = await redis.lrange(chatKeys.buyerConversations(buyerId), 0, -1);
  
  for (const convId of buyerConvIds) {
    const conv = await getConversation(convId);
    if (conv && conv.sellerId === sellerId && conv.status === 'active') {
      return conv;
    }
  }
  
  return null;
}

export async function getSellerConversations(sellerId: string): Promise<Conversation[]> {
  const conversationIds = await redis.lrange(chatKeys.sellerConversations(sellerId), 0, -1);
  const conversations: Conversation[] = [];
  
  for (const id of conversationIds) {
    const conv = await getConversation(id);
    if (conv) {
      conversations.push(conv);
    }
  }
  
  // Sort by last message date
  return conversations.sort((a, b) => 
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export async function getBuyerConversations(buyerId: string): Promise<Conversation[]> {
  const conversationIds = await redis.lrange(chatKeys.buyerConversations(buyerId), 0, -1);
  const conversations: Conversation[] = [];
  
  for (const id of conversationIds) {
    const conv = await getConversation(id);
    if (conv) {
      conversations.push(conv);
    }
  }
  
  return conversations.sort((a, b) => 
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export async function updateConversation(
  id: string, 
  updates: Partial<Conversation>
): Promise<Conversation | null> {
  const conversation = await getConversation(id);
  if (!conversation) return null;
  
  const updated: Conversation = {
    ...conversation,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  await redis.set(chatKeys.conversation(id), updated);
  return updated;
}

export async function archiveConversation(id: string): Promise<boolean> {
  const updated = await updateConversation(id, { status: 'archived' });
  return updated !== null;
}

// ============================================
// MESSAGE OPERATIONS
// ============================================

export async function sendMessage(
  data: Omit<ChatMessage, 'id' | 'createdAt' | 'status'>
): Promise<ChatMessage> {
  const id = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date().toISOString();
  
  const message: ChatMessage = {
    ...data,
    id,
    status: 'sent',
    createdAt: now,
  };
  
  // Store message in conversation's message list
  await redis.rpush(chatKeys.messages(data.conversationId), JSON.stringify(message));
  
  // Update conversation's last message and unread counts
  const conversation = await getConversation(data.conversationId);
  if (conversation) {
    const updates: Partial<Conversation> = {
      lastMessage: {
        content: data.content,
        senderId: data.senderId,
        senderType: data.senderType,
        createdAt: now,
      },
    };
    
    // Increment unread count for the other party
    if (data.senderType === 'buyer') {
      updates.unreadCountSeller = conversation.unreadCountSeller + 1;
    } else {
      updates.unreadCountBuyer = conversation.unreadCountBuyer + 1;
    }
    
    await updateConversation(data.conversationId, updates);
  }
  
  return message;
}

export async function getMessages(
  conversationId: string, 
  limit: number = 50, 
  offset: number = 0
): Promise<ChatMessage[]> {
  const messagesJson = await redis.lrange(
    chatKeys.messages(conversationId), 
    -limit - offset, 
    offset > 0 ? -offset - 1 : -1
  );
  
  return messagesJson.map(msg => 
    typeof msg === 'string' ? JSON.parse(msg) : msg
  ).reverse();
}

export async function markMessagesAsRead(
  conversationId: string, 
  userId: string,
  userType: 'buyer' | 'seller'
): Promise<void> {
  const conversation = await getConversation(conversationId);
  if (!conversation) return;
  
  // Reset unread count for the reader
  const updates: Partial<Conversation> = userType === 'seller' 
    ? { unreadCountSeller: 0 }
    : { unreadCountBuyer: 0 };
  
  await updateConversation(conversationId, updates);
}

// ============================================
// ENQUIRY OPERATIONS
// ============================================

export async function createEnquiry(
  data: Omit<ProductEnquiry, 'createdAt'>
): Promise<ProductEnquiry> {
  const id = `enq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date().toISOString();
  
  const enquiry: ProductEnquiry & { id: string } = {
    ...data,
    id,
    createdAt: now,
  };
  
  // Store enquiry
  await redis.set(chatKeys.enquiry(id), enquiry);
  
  // Add to seller's enquiry list
  await redis.lpush(chatKeys.sellerEnquiries(data.sellerId), id);
  
  // Add to product's enquiry list
  await redis.lpush(chatKeys.productEnquiries(data.productId), id);
  
  return enquiry;
}

export async function getSellerEnquiries(sellerId: string): Promise<(ProductEnquiry & { id: string })[]> {
  const enquiryIds = await redis.lrange(chatKeys.sellerEnquiries(sellerId), 0, -1);
  const enquiries: (ProductEnquiry & { id: string })[] = [];
  
  for (const id of enquiryIds) {
    const enquiry = await redis.get<ProductEnquiry & { id: string }>(chatKeys.enquiry(id));
    if (enquiry) {
      enquiries.push(enquiry);
    }
  }
  
  return enquiries.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

// ============================================
// QUICK REPLIES OPERATIONS
// ============================================

export async function getQuickReplies(sellerId: string): Promise<QuickReply[]> {
  const replies = await redis.get<QuickReply[]>(chatKeys.quickReplies(sellerId));
  return replies || [];
}

export async function saveQuickReplies(sellerId: string, replies: QuickReply[]): Promise<void> {
  await redis.set(chatKeys.quickReplies(sellerId), replies);
}

export async function addQuickReply(
  sellerId: string, 
  data: Omit<QuickReply, 'id' | 'sellerId'>
): Promise<QuickReply> {
  const replies = await getQuickReplies(sellerId);
  
  const newReply: QuickReply = {
    ...data,
    id: `qr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    sellerId,
  };
  
  replies.push(newReply);
  await saveQuickReplies(sellerId, replies);
  
  return newReply;
}

export async function deleteQuickReply(sellerId: string, replyId: string): Promise<boolean> {
  const replies = await getQuickReplies(sellerId);
  const filtered = replies.filter(r => r.id !== replyId);
  
  if (filtered.length === replies.length) return false;
  
  await saveQuickReplies(sellerId, filtered);
  return true;
}

// ============================================
// CHAT SETTINGS OPERATIONS
// ============================================

export async function getChatSettings(userId: string): Promise<ChatNotificationSettings> {
  const settings = await redis.get<ChatNotificationSettings>(chatKeys.chatSettings(userId));
  return settings || defaultChatNotificationSettings;
}

export async function saveChatSettings(
  userId: string, 
  settings: ChatNotificationSettings
): Promise<void> {
  await redis.set(chatKeys.chatSettings(userId), settings);
}

// ============================================
// UNREAD COUNTS
// ============================================

export async function getTotalUnreadCount(
  userId: string, 
  userType: 'buyer' | 'seller'
): Promise<number> {
  const conversationIds = userType === 'seller'
    ? await redis.lrange(chatKeys.sellerConversations(userId), 0, -1)
    : await redis.lrange(chatKeys.buyerConversations(userId), 0, -1);
  
  let total = 0;
  for (const id of conversationIds) {
    const conv = await getConversation(id);
    if (conv) {
      total += userType === 'seller' ? conv.unreadCountSeller : conv.unreadCountBuyer;
    }
  }
  
  return total;
}
