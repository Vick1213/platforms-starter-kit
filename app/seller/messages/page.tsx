'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft, MessageCircle, Search, Inbox, Send, Archive, 
  MoreVertical, CheckCheck, Clock, Package, Loader2, Filter, DollarSign, X
} from 'lucide-react';
import { ChatWindow, ConversationList } from '@/components/chat';
import { Conversation, ChatMessage } from '@/lib/chat-types';
import { ChatOfferForm } from '@/components/chat/chat-offer-form';

export default function SellerMessagesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'archived'>('all');
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [sellerId, setSellerId] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }

    if (status === 'authenticated') {
      fetchConversations();
      fetchSellerInfo();
    }
  }, [status, router]);

  const fetchSellerInfo = async () => {
    try {
      const res = await fetch('/api/seller/profile');
      if (res.ok) {
        const data = await res.json();
        setSellerId(data.id);
      }
    } catch (error) {
      console.error('Error fetching seller info:', error);
    }
  };

  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/chat?role=seller');
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
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
  };

  const handleSendMessage = async (content: string) => {
    if (!selectedConversation) return;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send-message',
          conversationId: selectedConversation,
          content,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, data.message]);
        // Update conversation's last message
        setConversations(prev => prev.map(conv => 
          conv.id === selectedConversation 
            ? { ...conv, lastMessage: data.message, updatedAt: new Date().toISOString() }
            : conv
        ));
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const filteredConversations = conversations.filter(conv => {
    if (filter === 'archived' && conv.status !== 'archived') return false;
    if (filter === 'unread' && conv.unreadCountSeller === 0) return false;
    if (filter === 'all' && conv.status === 'archived') return false;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        conv.buyerName?.toLowerCase().includes(query) ||
        conv.initialProduct?.productName.toLowerCase().includes(query) ||
        conv.lastMessage?.content.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const selectedConv = conversations.find(c => c.id === selectedConversation);
  const unreadCount = conversations.reduce((sum, c) => sum + c.unreadCountSeller, 0);

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
              <Link href="/seller" className="p-2 hover:bg-gray-100 rounded-lg">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  Messages
                  {unreadCount > 0 && (
                    <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </h1>
                <p className="text-xs text-gray-500">Customer inquiries and conversations</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl border overflow-hidden h-[calc(100vh-180px)]">
          <div className="flex h-full">
            {/* Conversations List */}
            <div className="w-96 border-r flex flex-col">
              {/* Search & Filters */}
              <div className="p-4 border-b space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search conversations..."
                    className="pl-9"
                  />
                </div>
                <div className="flex gap-2">
                  {(['all', 'unread', 'archived'] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-full capitalize transition-colors ${
                        filter === f
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {f}
                      {f === 'unread' && unreadCount > 0 && (
                        <span className="ml-1">({unreadCount})</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Conversation List */}
              <div className="flex-1 overflow-y-auto">
                {filteredConversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4">
                    <Inbox className="w-12 h-12 mb-2 text-gray-300" />
                    <p className="font-medium">No conversations</p>
                    <p className="text-sm">
                      {filter === 'unread' 
                        ? 'No unread messages' 
                        : filter === 'archived'
                        ? 'No archived conversations'
                        : 'Messages from customers will appear here'}
                    </p>
                  </div>
                ) : (
                  <ConversationList
                    conversations={filteredConversations}
                    selectedId={selectedConversation || undefined}
                    onSelect={(conv) => handleSelectConversation(conv.id)}
                    userType="seller"
                  />
                )}
              </div>
            </div>

            {/* Chat Window */}
            <div className="flex-1 flex flex-col">
              {selectedConversation && selectedConv ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-lg font-medium text-gray-600">
                          {selectedConv.buyerName?.charAt(0).toUpperCase() || 'C'}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {selectedConv.buyerName || 'Customer'}
                        </h3>
                        {selectedConv.initialProduct && (
                          <p className="text-xs text-gray-500 flex items-center gap-1 min-w-0">
                            <Package className="w-3 h-3 shrink-0" />
                            <span className="truncate">{selectedConv.initialProduct.productName}</span>
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap md:justify-end">
                      <Button 
                        onClick={() => setShowOfferForm(true)}
                        className="bg-gradient-to-r from-orange-500 to-amber-500 text-white whitespace-nowrap shrink-0"
                        size="sm"
                      >
                        <DollarSign className="w-4 h-4 mr-1" />
                        Send Offer
                      </Button>
                      <Button variant="outline" size="sm" className="whitespace-nowrap">
                        <Archive className="w-4 h-4 sm:mr-1" />
                        <span className="hidden sm:inline">Archive</span>
                      </Button>
                      <Button variant="outline" size="icon" className="h-8 w-8">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Offer Form Modal */}
                  {showOfferForm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4">
                        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
                          <h2 className="text-xl font-bold">Create Offer for {selectedConv.buyerName}</h2>
                          <button 
                            onClick={() => setShowOfferForm(false)}
                            className="p-2 hover:bg-gray-100 rounded-full"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                        <div className="p-6">
                          <ChatOfferForm
                            conversationId={selectedConversation}
                            inquiryId={selectedConv.inquiryId}
                            initialProduct={selectedConv.initialProduct ? {
                              productId: selectedConv.initialProduct.productId,
                              productName: selectedConv.initialProduct.productName,
                              productImage: selectedConv.initialProduct.productImage,
                            } : undefined}
                            buyerName={selectedConv.buyerName}
                            onSuccess={(offer) => {
                              setShowOfferForm(false);
                              // Refresh messages to show the offer
                              fetchMessages(selectedConversation);
                            }}
                            onCancel={() => setShowOfferForm(false)}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Messages */}
                  {loadingMessages ? (
                    <div className="flex-1 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                    </div>
                  ) : (
                    <ChatWindow
                      conversation={selectedConv}
                      messages={messages}
                      onSendMessage={async (content) => handleSendMessage(content)}
                      currentUserId={session?.user?.id || ''}
                      userType="seller"
                      className="flex-1"
                    />
                  )}
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                  <MessageCircle className="w-16 h-16 mb-4 text-gray-300" />
                  <h3 className="font-semibold text-lg text-gray-900 mb-1">
                    Select a conversation
                  </h3>
                  <p className="text-sm">
                    Choose a conversation from the list to view messages
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
