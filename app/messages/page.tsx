'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft, MessageCircle, Search, Send, 
  Loader2, Package, Store, Clock, CheckCheck, 
  ChevronRight, DollarSign, FileText
} from 'lucide-react';
import { Conversation, ChatMessage } from '@/lib/chat-types';

function BuyerMessagesContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(
    searchParams.get('conversation')
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=/messages');
      return;
    }

    if (status === 'authenticated') {
      fetchConversations();
    }
  }, [status, router]);

  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/chat?role=buyer');
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
        
        // Auto-select first conversation if none selected
        if (!selectedConversation && data.conversations?.length > 0) {
          handleSelectConversation(data.conversations[0].id);
        } else if (selectedConversation) {
          fetchMessages(selectedConversation);
        }
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/chat?conversationId=${conversationId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversation(conversationId);
    fetchMessages(conversationId);
    // Update URL without navigation
    window.history.replaceState(null, '', `/messages?conversation=${conversationId}`);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConversation || !newMessage.trim()) return;

    setSending(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send-message',
          conversationId: selectedConversation,
          content: newMessage.trim(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, data.message]);
        setNewMessage('');
        // Update conversation's last message
        setConversations(prev => prev.map(conv => 
          conv.id === selectedConversation 
            ? { ...conv, lastMessage: data.message, updatedAt: new Date().toISOString() }
            : conv
        ));
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const filteredConversations = conversations.filter(conv => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        conv.sellerName?.toLowerCase().includes(query) ||
        conv.initialProduct?.productName.toLowerCase().includes(query) ||
        conv.lastMessage?.content.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const selectedConv = conversations.find(c => c.id === selectedConversation);
  const unreadCount = conversations.reduce((sum, c) => sum + (c.unreadCountBuyer || 0), 0);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const renderMessage = (msg: ChatMessage) => {
    const isOwn = msg.senderId === session?.user?.id;
    
    // Render offer message
    if (msg.type === 'offer' && msg.offerContext) {
      const offer = msg.offerContext;
      return (
        <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`} key={msg.id}>
          <div className={`max-w-md rounded-lg overflow-hidden border ${
            isOwn ? 'bg-orange-50 border-orange-200' : 'bg-blue-50 border-blue-200'
          }`}>
            <div className={`px-4 py-2 ${isOwn ? 'bg-orange-100' : 'bg-blue-100'}`}>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                <span className="font-semibold">Price Offer</span>
              </div>
            </div>
            <div className="p-4 space-y-3">
              {/* Offer Summary */}
              <div className="text-sm text-gray-600">
                {offer.itemCount} item{offer.itemCount > 1 ? 's' : ''}
              </div>
              
              {/* Total */}
              <div className="border-t pt-2 flex justify-between font-bold">
                <span>Total</span>
                <span className="text-lg">${offer.total.toFixed(2)}</span>
              </div>

              {/* Valid Until */}
              {offer.validUntil && (
                <p className="text-xs text-gray-500">
                  Valid until: {new Date(offer.validUntil).toLocaleDateString()}
                </p>
              )}

              {/* View Offer Button */}
              {offer.offerId && selectedConv?.sellerSubdomain && (
                <a 
                  href={`https://${selectedConv.sellerSubdomain}.supplyme.asia/offer/${offer.offerId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  View Full Offer
                </a>
              )}
            </div>
            <div className="px-4 py-1 text-xs text-gray-500 text-right">
              {formatTime(msg.createdAt)}
            </div>
          </div>
        </div>
      );
    }

    // Render inquiry message
    if (msg.type === 'product-inquiry' && msg.productContext) {
      return (
        <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`} key={msg.id}>
          <div className={`max-w-sm rounded-lg overflow-hidden ${
            isOwn ? 'bg-orange-500 text-white' : 'bg-white border'
          }`}>
            {/* Product Preview */}
            <div className={`p-3 flex gap-3 ${isOwn ? 'bg-orange-600' : 'bg-gray-50'}`}>
              {msg.productContext.productImage && (
                <Image
                  src={msg.productContext.productImage}
                  alt={msg.productContext.productName}
                  width={48}
                  height={48}
                  className="rounded object-cover"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className={`font-medium text-sm truncate ${isOwn ? 'text-white' : 'text-gray-900'}`}>
                  {msg.productContext.productName}
                </p>
                {msg.quoteRequest?.quantity && (
                  <p className={`text-xs ${isOwn ? 'text-orange-200' : 'text-gray-500'}`}>
                    Qty: {msg.quoteRequest.quantity}
                  </p>
                )}
              </div>
            </div>
            {/* Message */}
            <div className="p-3">
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            </div>
            <div className={`px-3 pb-2 text-xs ${isOwn ? 'text-orange-200' : 'text-gray-400'}`}>
              {formatTime(msg.createdAt)}
            </div>
          </div>
        </div>
      );
    }

    // Regular text message
    return (
      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`} key={msg.id}>
        <div className={`max-w-xs md:max-w-md rounded-lg px-4 py-2 ${
          isOwn 
            ? 'bg-orange-500 text-white' 
            : 'bg-white border text-gray-900'
        }`}>
          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
          <div className={`flex items-center justify-end gap-1 mt-1 text-xs ${
            isOwn ? 'text-orange-200' : 'text-gray-400'
          }`}>
            <span>{formatTime(msg.createdAt)}</span>
            {isOwn && msg.readAt && <CheckCheck className="w-3 h-3" />}
          </div>
        </div>
      </div>
    );
  };

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="p-2 hover:bg-gray-100 rounded-lg">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  My Messages
                  {unreadCount > 0 && (
                    <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </h1>
                <p className="text-xs text-gray-500">Conversations with sellers</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {conversations.length === 0 ? (
          <div className="bg-white rounded-xl border p-12 text-center">
            <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No messages yet</h2>
            <p className="text-gray-600 mb-6">
              When you send inquiries about products, your conversations will appear here.
            </p>
            <Link href="/">
              <Button className="bg-orange-500 hover:bg-orange-600">
                Browse Stores
              </Button>
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl border overflow-hidden h-[calc(100vh-180px)]">
            <div className="flex h-full">
              {/* Conversations List */}
              <div className="w-80 lg:w-96 border-r flex flex-col">
                {/* Search */}
                <div className="p-4 border-b">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search conversations..."
                      className="pl-9"
                    />
                  </div>
                </div>

                {/* Conversation List */}
                <div className="flex-1 overflow-y-auto">
                  {filteredConversations.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No conversations found</p>
                    </div>
                  ) : (
                    filteredConversations.map(conv => (
                      <button
                        key={conv.id}
                        onClick={() => handleSelectConversation(conv.id)}
                        className={`w-full p-4 text-left hover:bg-gray-50 border-b transition-colors ${
                          selectedConversation === conv.id ? 'bg-orange-50' : ''
                        }`}
                      >
                        <div className="flex gap-3">
                          {/* Seller Avatar */}
                          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {conv.sellerLogo ? (
                              <Image
                                src={conv.sellerLogo}
                                alt={conv.sellerName || 'Seller'}
                                width={48}
                                height={48}
                                className="object-cover"
                              />
                            ) : (
                              <Store className="w-6 h-6 text-gray-400" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-gray-900 truncate">
                                {conv.sellerName || 'Seller'}
                              </span>
                              {conv.lastMessage && (
                                <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                                  {formatTime(conv.lastMessage.createdAt)}
                                </span>
                              )}
                            </div>

                            {/* Product Context */}
                            {conv.initialProduct && (
                              <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                                <Package className="w-3 h-3" />
                                <span className="truncate">{conv.initialProduct.productName}</span>
                              </div>
                            )}

                            {/* Last Message */}
                            <div className="flex items-center gap-2">
                              <p className="text-sm text-gray-600 truncate flex-1">
                                {conv.lastMessage?.content || 'No messages yet'}
                              </p>
                              {(conv.unreadCountBuyer || 0) > 0 && (
                                <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full flex-shrink-0">
                                  {conv.unreadCountBuyer}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Chat Area */}
              <div className="flex-1 flex flex-col">
                {selectedConv ? (
                  <>
                    {/* Chat Header */}
                    <div className="p-4 border-b bg-white">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                            {selectedConv.sellerLogo ? (
                              <Image
                                src={selectedConv.sellerLogo}
                                alt={selectedConv.sellerName || 'Seller'}
                                width={40}
                                height={40}
                                className="object-cover"
                              />
                            ) : (
                              <Store className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {selectedConv.sellerName || 'Seller'}
                            </h3>
                            {selectedConv.sellerSubdomain && (
                              <a 
                                href={`https://${selectedConv.sellerSubdomain}.supplyme.asia`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-orange-600 hover:underline flex items-center gap-1"
                              >
                                Visit Store <ChevronRight className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Product Context Badge */}
                        {selectedConv.initialProduct && (
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg text-sm">
                            <Package className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-700">{selectedConv.initialProduct.productName}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                      {loadingMessages ? (
                        <div className="flex items-center justify-center h-full">
                          <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                        </div>
                      ) : messages.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-gray-500">
                          <div className="text-center">
                            <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p>No messages yet</p>
                            <p className="text-sm">Send a message to start the conversation</p>
                          </div>
                        </div>
                      ) : (
                        <div>
                          {messages.map(renderMessage)}
                        </div>
                      )}
                    </div>

                    {/* Message Input */}
                    <div className="p-4 border-t bg-white">
                      <form onSubmit={handleSendMessage} className="flex gap-2">
                        <Input
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type a message..."
                          className="flex-1"
                          disabled={sending}
                        />
                        <Button 
                          type="submit" 
                          disabled={!newMessage.trim() || sending}
                          className="bg-orange-500 hover:bg-orange-600"
                        >
                          {sending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                        </Button>
                      </form>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center bg-gray-50">
                    <div className="text-center text-gray-500">
                      <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">Select a conversation</p>
                      <p className="text-sm">Choose from your existing conversations to continue chatting</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BuyerMessagesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    }>
      <BuyerMessagesContent />
    </Suspense>
  );
}
