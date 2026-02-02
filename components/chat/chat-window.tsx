'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  X, Send, Paperclip, Image as ImageIcon, ChevronDown,
  Loader2, MessageCircle, Package, Store, ExternalLink,
  FileText, DollarSign
} from 'lucide-react';
import { ChatMessage, Conversation } from '@/lib/chat-types';
import { OfferCard } from '@/components/offer-card';

interface ChatWindowProps {
  conversation: Conversation;
  messages: ChatMessage[];
  currentUserId: string;
  userType: 'buyer' | 'seller';
  onSendMessage: (content: string, type?: string) => Promise<void>;
  onClose?: () => void;
  isLoading?: boolean;
  className?: string;
  onOfferAction?: (offerId: string, action: 'accept' | 'decline') => Promise<void>;
}

export function ChatWindow({
  conversation,
  messages,
  currentUserId,
  userType,
  onSendMessage,
  onClose,
  isLoading = false,
  className = '',
  onOfferAction,
}: ChatWindowProps) {
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      await onSendMessage(newMessage.trim());
      setNewMessage('');
      inputRef.current?.focus();
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const otherParty = userType === 'buyer' 
    ? { name: conversation.sellerName, avatar: conversation.sellerLogo }
    : { name: conversation.buyerName, avatar: conversation.buyerAvatar };

  return (
    <div className={`flex flex-col h-full bg-white rounded-lg shadow-xl border ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-t-lg">
        <div className="flex items-center gap-3">
          {otherParty.avatar ? (
            <img 
              src={otherParty.avatar} 
              alt={otherParty.name}
              className="w-10 h-10 rounded-full object-cover border-2 border-white/30"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              {userType === 'buyer' ? (
                <Store className="w-5 h-5" />
              ) : (
                <MessageCircle className="w-5 h-5" />
              )}
            </div>
          )}
          <div>
            <h3 className="font-semibold">{otherParty.name}</h3>
            <p className="text-xs text-white/80">
              {userType === 'buyer' ? 'Seller' : 'Customer'}
            </p>
          </div>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Product Context (if exists) */}
      {conversation.initialProduct && (
        <div className="px-4 py-2 bg-orange-50 border-b flex items-center gap-3">
          {conversation.initialProduct.productImage ? (
            <img 
              src={conversation.initialProduct.productImage}
              alt={conversation.initialProduct.productName}
              className="w-12 h-12 rounded object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded bg-gray-100 flex items-center justify-center">
              <Package className="w-6 h-6 text-gray-400" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {conversation.initialProduct.productName}
            </p>
            <p className="text-xs text-gray-500">Enquiry about this product</p>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No messages yet</p>
              <p className="text-sm">Start the conversation!</p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble 
              key={message.id} 
              message={message}
              isOwn={message.senderId === currentUserId}
              userType={userType}
              onOfferAction={onOfferAction}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t bg-gray-50">
        <div className="flex items-center gap-2">
          <Input
            ref={inputRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            disabled={isSending}
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={!newMessage.trim() || isSending}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  userType: 'buyer' | 'seller';
  onOfferAction?: (offerId: string, action: 'accept' | 'decline') => Promise<void>;
}

function MessageBubble({ message, isOwn, userType, onOfferAction }: MessageBubbleProps) {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Handle offer message type
  if (message.type === 'offer' && message.offerContext) {
    return (
      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
        <div className={`max-w-[90%] ${isOwn ? 'order-2' : 'order-1'}`}>
          {/* Offer indicator */}
          <div className={`flex items-center gap-2 mb-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
            <DollarSign className="w-4 h-4 text-green-600" />
            <span className="text-xs font-medium text-green-600">
              {isOwn ? 'Offer Sent' : 'Offer Received'}
            </span>
          </div>
          
          {/* Offer card preview */}
          <div className={`p-4 rounded-lg border-2 ${
            message.offerContext.status === 'PENDING' ? 'border-blue-300 bg-blue-50' :
            message.offerContext.status === 'ACCEPTED' ? 'border-green-300 bg-green-50' :
            message.offerContext.status === 'DECLINED' ? 'border-red-300 bg-red-50' :
            'border-gray-300 bg-gray-50'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-sm">
                {message.offerContext.offerNumber}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                message.offerContext.status === 'PENDING' ? 'bg-blue-100 text-blue-700' :
                message.offerContext.status === 'ACCEPTED' ? 'bg-green-100 text-green-700' :
                message.offerContext.status === 'DECLINED' ? 'bg-red-100 text-red-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {message.offerContext.status}
              </span>
            </div>
            
            <p className="text-sm text-gray-600 mb-2">
              {message.offerContext.itemCount} item{message.offerContext.itemCount > 1 ? 's' : ''}
            </p>
            
            <p className="text-lg font-bold text-green-600">
              ${message.offerContext.total.toFixed(2)}
            </p>
            
            {message.offerContext.validUntil && message.offerContext.status === 'PENDING' && (
              <p className="text-xs text-gray-500 mt-2">
                Valid until: {new Date(message.offerContext.validUntil).toLocaleDateString()}
              </p>
            )}
            
            {/* Action buttons for buyer when offer is pending */}
            {userType === 'buyer' && message.offerContext.status === 'PENDING' && onOfferAction && (
              <div className="flex gap-2 mt-3 pt-3 border-t">
                <Button
                  size="sm"
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => onOfferAction(message.offerContext!.offerId, 'accept')}
                >
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-red-600 border-red-300 hover:bg-red-50"
                  onClick={() => onOfferAction(message.offerContext!.offerId, 'decline')}
                >
                  Decline
                </Button>
              </div>
            )}
          </div>
          
          {/* Optional message */}
          {message.content && (
            <div
              className={`mt-2 px-4 py-2 rounded-2xl ${
                isOwn
                  ? 'bg-orange-500 text-white rounded-br-md'
                  : 'bg-gray-100 text-gray-900 rounded-bl-md'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
          )}

          {/* Timestamp */}
          <p className={`text-xs mt-1 ${isOwn ? 'text-right' : 'text-left'} text-gray-400`}>
            {formatTime(message.createdAt)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] ${isOwn ? 'order-2' : 'order-1'}`}>
        {/* Product inquiry card */}
        {message.type === 'product-inquiry' && message.productContext && (
          <div className={`mb-2 p-3 rounded-lg border ${isOwn ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200'}`}>
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-4 h-4 text-orange-500" />
              <span className="text-xs font-medium text-orange-600">Product Inquiry</span>
            </div>
            <div className="flex items-center gap-3">
              {message.productContext.productImage ? (
                <img 
                  src={message.productContext.productImage}
                  alt={message.productContext.productName}
                  className="w-16 h-16 rounded object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded bg-gray-200 flex items-center justify-center">
                  <Package className="w-8 h-8 text-gray-400" />
                </div>
              )}
              <div>
                <p className="font-medium text-sm">{message.productContext.productName}</p>
                {message.productContext.productPrice && (
                  <p className="text-sm text-orange-600 font-semibold">
                    ${message.productContext.productPrice.toFixed(2)}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Quote request card */}
        {message.quoteRequest && (
          <div className={`mb-2 p-3 rounded-lg border ${isOwn ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
            <p className="text-xs font-medium text-blue-600 mb-2">Quote Request</p>
            <div className="text-sm space-y-1">
              {message.quoteRequest.quantity > 0 && (
                <p><span className="text-gray-500">Quantity:</span> {message.quoteRequest.quantity} units</p>
              )}
              {message.quoteRequest.targetPrice && (
                <p><span className="text-gray-500">Target Price:</span> ${message.quoteRequest.targetPrice}</p>
              )}
              {message.quoteRequest.deliveryDate && (
                <p><span className="text-gray-500">Delivery:</span> {message.quoteRequest.deliveryDate}</p>
              )}
              {message.quoteRequest.specifications && (
                <p><span className="text-gray-500">Notes:</span> {message.quoteRequest.specifications}</p>
              )}
            </div>
          </div>
        )}

        {/* Message bubble */}
        <div
          className={`px-4 py-2 rounded-2xl ${
            isOwn
              ? 'bg-orange-500 text-white rounded-br-md'
              : 'bg-gray-100 text-gray-900 rounded-bl-md'
          }`}
        >
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>

        {/* Timestamp */}
        <p className={`text-xs mt-1 ${isOwn ? 'text-right' : 'text-left'} text-gray-400`}>
          {formatTime(message.createdAt)}
        </p>
      </div>
    </div>
  );
}
