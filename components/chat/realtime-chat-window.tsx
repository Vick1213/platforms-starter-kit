'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { 
  Send, 
  MessageCircle, 
  DollarSign, 
  Check, 
  X, 
  Loader2,
  Circle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ChatRoomProvider,
  useMessages,
  useTyping,
  usePresence,
  usePresenceListener,
  useRoom,
} from '@ably/chat/react';
import { ChatMessageMetadata, roomNames } from '@/lib/ably';
import { Message, RoomStatus } from '@ably/chat';

interface RealtimeChatWindowProps {
  roomType: 'inquiry' | 'conversation';
  roomId: string;
  inquiryId?: string;
  sellerId: string;
  sellerName: string;
  sellerLogo?: string;
  buyerName: string;
  buyerAvatar?: string;
  currentUserType: 'seller' | 'buyer';
  currentUserName: string;
  currentUserAvatar?: string;
  primaryColor?: string;
  onSendOffer?: () => void;
}

// Inner chat component that uses the hooks
function ChatContent({
  currentUserType,
  currentUserName,
  currentUserAvatar,
  sellerName,
  sellerLogo,
  buyerName,
  buyerAvatar,
  primaryColor = '#f97316',
  onSendOffer,
  onAcceptOffer,
  onDeclineOffer,
}: {
  currentUserType: 'seller' | 'buyer';
  currentUserName: string;
  currentUserAvatar?: string;
  sellerName: string;
  sellerLogo?: string;
  buyerName: string;
  buyerAvatar?: string;
  primaryColor?: string;
  onSendOffer?: () => void;
  onAcceptOffer?: (offerId: string) => void;
  onDeclineOffer?: (offerId: string) => void;
}) {
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Room hook for status
  const { roomStatus, roomError } = useRoom();
  
  // Messages hook
  const { sendMessage, historyBeforeSubscribe } = useMessages({
    listener: (event) => {
      setMessages(prev => {
        // Check if message already exists (by serial)
        const exists = prev.some(m => m.serial === event.message.serial);
        if (exists) {
          // Update existing message
          return prev.map(m => m.serial === event.message.serial ? event.message : m);
        }
        // Add new message
        return [...prev, event.message];
      });
    },
  });
  
  // Typing indicator
  const { currentlyTyping, keystroke, stop: stopTyping } = useTyping();
  
  // Presence - enter with user data
  const { myPresenceState } = usePresence({
    initialData: { 
      name: currentUserName, 
      avatar: currentUserAvatar || null, 
      type: currentUserType 
    },
  });
  
  // Listen to other users' presence
  const { presenceData } = usePresenceListener();

  // Load message history on mount
  useEffect(() => {
    const loadHistory = async () => {
      if (historyBeforeSubscribe) {
        try {
          const history = await historyBeforeSubscribe({ limit: 50 });
          if (history?.items) {
            // historyBeforeSubscribe returns newest first, we want oldest first
            setMessages(history.items.reverse());
          }
        } catch (error) {
          console.error('Failed to load message history:', error);
        }
      }
      setIsLoading(false);
    };
    
    if (roomStatus === RoomStatus.Attached && isLoading) {
      loadHistory();
    }
  }, [historyBeforeSubscribe, roomStatus, isLoading]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle typing indicator
  const handleTyping = useCallback(() => {
    keystroke?.();
  }, [keystroke]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !sendMessage) return;
    
    try {
      stopTyping?.();
      await sendMessage({
        text: newMessage,
        metadata: {
          type: 'text',
          senderType: currentUserType,
          senderName: currentUserName,
        },
      });
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Check if other party is online
  const otherPartyOnline = presenceData.some(p => {
    const data = p.data as { type?: string } | undefined;
    return data?.type && data.type !== currentUserType;
  });

  // Get typing users (excluding self)
  const typingUsers = Array.from(currentlyTyping).filter(
    clientId => !clientId.includes(currentUserType)
  );

  // Connection status display
  const getStatusIndicator = () => {
    switch (roomStatus) {
      case RoomStatus.Attached:
        return (
          <div className="flex items-center gap-1.5 text-xs text-green-600">
            <Circle className="w-2 h-2 fill-current" />
            Connected
          </div>
        );
      case RoomStatus.Attaching:
        return (
          <div className="flex items-center gap-1.5 text-xs text-yellow-600">
            <Loader2 className="w-3 h-3 animate-spin" />
            Connecting...
          </div>
        );
      case RoomStatus.Detached:
      case RoomStatus.Detaching:
        return (
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Circle className="w-2 h-2" />
            Disconnected
          </div>
        );
      case RoomStatus.Failed:
        return (
          <div className="flex items-center gap-1.5 text-xs text-red-600">
            <X className="w-3 h-3" />
            Connection failed
          </div>
        );
      default:
        return null;
    }
  };

  if (roomError) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <div className="text-center text-red-500">
          <X className="w-8 h-8 mx-auto mb-2" />
          <p>Failed to connect to chat</p>
          <p className="text-sm text-gray-500">{roomError.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b flex items-center justify-between bg-gray-50">
        <div className="flex items-center gap-3">
          <div className="relative">
            {currentUserType === 'buyer' ? (
              sellerLogo ? (
                <Image
                  src={sellerLogo}
                  alt={sellerName}
                  width={40}
                  height={40}
                  className="rounded-full object-cover"
                />
              ) : (
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                  style={{ backgroundColor: primaryColor }}
                >
                  {sellerName.charAt(0).toUpperCase()}
                </div>
              )
            ) : (
              buyerAvatar ? (
                <Image
                  src={buyerAvatar}
                  alt={buyerName}
                  width={40}
                  height={40}
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold">
                  {buyerName.charAt(0).toUpperCase()}
                </div>
              )
            )}
            {/* Online indicator */}
            {otherPartyOnline && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
            )}
          </div>
          <div>
            <p className="font-medium text-gray-900">
              {currentUserType === 'buyer' ? sellerName : buyerName}
            </p>
            <div className="flex items-center gap-2">
              {otherPartyOnline ? (
                <span className="text-xs text-green-600">Online</span>
              ) : (
                <span className="text-xs text-gray-500">Offline</span>
              )}
              {getStatusIndicator()}
            </div>
          </div>
        </div>
        
        {/* Seller actions */}
        {currentUserType === 'seller' && onSendOffer && (
          <Button
            onClick={onSendOffer}
            size="sm"
            style={{ backgroundColor: primaryColor }}
            className="text-white"
          >
            <DollarSign className="w-4 h-4 mr-1" />
            Send Offer
          </Button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <MessageCircle className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              <p>No messages yet</p>
              <p className="text-sm">Start the conversation!</p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.serial}
              message={message}
              currentUserType={currentUserType}
              sellerName={sellerName}
              buyerName={buyerName}
              primaryColor={primaryColor}
              formatTime={formatTime}
              onAcceptOffer={onAcceptOffer}
              onDeclineOffer={onDeclineOffer}
            />
          ))
        )}
        
        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <div className="flex space-x-1">
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75" />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150" />
            </div>
            <span>{currentUserType === 'buyer' ? sellerName : buyerName} is typing...</span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t bg-white">
        <div className="flex items-center gap-2">
          <Input
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1"
            disabled={roomStatus !== RoomStatus.Attached}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || roomStatus !== RoomStatus.Attached}
            style={{ backgroundColor: primaryColor }}
            className="text-white"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// Message bubble component
function MessageBubble({
  message,
  currentUserType,
  sellerName,
  buyerName,
  primaryColor,
  formatTime,
  onAcceptOffer,
  onDeclineOffer,
}: {
  message: Message;
  currentUserType: 'seller' | 'buyer';
  sellerName: string;
  buyerName: string;
  primaryColor: string;
  formatTime: (timestamp: number) => string;
  onAcceptOffer?: (offerId: string) => void;
  onDeclineOffer?: (offerId: string) => void;
}) {
  const metadata = message.metadata as unknown as ChatMessageMetadata | undefined;
  const messageType = metadata?.type || 'text';
  const senderType = metadata?.senderType || 'user';
  const isOwnMessage = senderType === currentUserType;

  // System messages
  if (messageType === 'system') {
    return (
      <div className="text-center">
        <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          {message.text}
        </span>
      </div>
    );
  }

  // Offer message
  if (messageType === 'offer' && metadata?.offerId) {
    const offerStatus = metadata.offerStatus || 'PENDING';
    
    return (
      <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
        <div className="max-w-[85%]">
          <div 
            className="rounded-xl p-4 border-2"
            style={{ 
              borderColor: primaryColor,
              backgroundColor: isOwnMessage ? `${primaryColor}15` : 'white'
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5" style={{ color: primaryColor }} />
              <span className="font-semibold">
                {isOwnMessage ? 'Offer Sent' : 'Offer Received'}
              </span>
            </div>
            
            <div className="space-y-1 text-sm">
              <p className="text-gray-600">Offer #{metadata.offerNumber}</p>
              <p className="text-xl font-bold" style={{ color: primaryColor }}>
                ${metadata.offerTotal?.toFixed(2)}
              </p>
            </div>

            {/* Offer status badge */}
            <div className="mt-3">
              {offerStatus === 'PENDING' ? (
                <>
                  {!isOwnMessage && onAcceptOffer && onDeclineOffer && (
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        onClick={() => onAcceptOffer(metadata.offerId!)}
                        style={{ backgroundColor: primaryColor }}
                        className="text-white flex-1"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onDeclineOffer(metadata.offerId!)}
                        className="flex-1"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Decline
                      </Button>
                    </div>
                  )}
                  {isOwnMessage && (
                    <span className="inline-flex items-center text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full">
                      Awaiting response
                    </span>
                  )}
                </>
              ) : offerStatus === 'ACCEPTED' ? (
                <span className="inline-flex items-center text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                  <Check className="w-3 h-3 mr-1" />
                  Accepted
                </span>
              ) : offerStatus === 'DECLINED' ? (
                <span className="inline-flex items-center text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full">
                  <X className="w-3 h-3 mr-1" />
                  Declined
                </span>
              ) : null}
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-1 px-1">
            {formatTime(message.timestamp.getTime())}
          </p>
        </div>
      </div>
    );
  }

  // Product inquiry message
  if (messageType === 'product-inquiry' && metadata?.productName) {
    return (
      <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
        <div className="max-w-[85%]">
          <div 
            className="rounded-xl p-3"
            style={{ 
              backgroundColor: isOwnMessage ? primaryColor : '#f3f4f6',
              color: isOwnMessage ? 'white' : 'inherit'
            }}
          >
            {/* Product card */}
            <div 
              className="rounded-lg p-2 mb-2 flex items-center gap-2"
              style={{ backgroundColor: isOwnMessage ? 'rgba(255,255,255,0.2)' : 'white' }}
            >
              {metadata.productImage && (
                <Image
                  src={metadata.productImage}
                  alt={metadata.productName}
                  width={40}
                  height={40}
                  className="rounded object-cover"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${isOwnMessage ? 'text-white' : 'text-gray-900'}`}>
                  {metadata.productName}
                </p>
                <p className={`text-xs ${isOwnMessage ? 'text-white/80' : 'text-gray-500'}`}>
                  Product Inquiry
                </p>
              </div>
            </div>
            
            <p className="text-sm">{message.text}</p>
          </div>
          <p className="text-xs text-gray-400 mt-1 px-1">
            {formatTime(message.timestamp.getTime())}
          </p>
        </div>
      </div>
    );
  }

  // Regular text message
  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <div className="max-w-[75%]">
        <div 
          className="rounded-xl px-4 py-2"
          style={{ 
            backgroundColor: isOwnMessage ? primaryColor : '#f3f4f6',
            color: isOwnMessage ? 'white' : 'inherit'
          }}
        >
          <p className="text-sm">{message.text}</p>
        </div>
        <p className="text-xs text-gray-400 mt-1 px-1">
          {formatTime(message.timestamp.getTime())}
        </p>
      </div>
    </div>
  );
}

// Main exported component with provider wrapper
export function RealtimeChatWindow(props: RealtimeChatWindowProps) {
  const {
    roomType,
    roomId,
    currentUserType,
    currentUserName,
    currentUserAvatar,
    sellerName,
    sellerLogo,
    buyerName,
    buyerAvatar,
    primaryColor = '#f97316',
    onSendOffer,
  } = props;

  // Get room name based on type
  const roomName = roomType === 'inquiry' 
    ? roomNames.inquiry(roomId)
    : roomNames.conversation(roomId);

  const handleAcceptOffer = async (offerId: string) => {
    // Navigate to accept offer page
    window.location.href = `/offers/${offerId}/accept`;
  };

  const handleDeclineOffer = async (offerId: string) => {
    if (!confirm('Are you sure you want to decline this offer?')) return;
    
    try {
      const res = await fetch(`/api/offers/${offerId}/decline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Declined by buyer' }),
      });
      
      if (!res.ok) throw new Error('Failed to decline offer');
      // Offer status will update via real-time message
    } catch (error) {
      console.error('Failed to decline offer:', error);
      alert('Failed to decline offer');
    }
  };

  return (
    <ChatRoomProvider
      name={roomName}
      options={{
        typing: { heartbeatThrottleMs: 5000 },
        presence: { enableEvents: true },
      }}
    >
      <ChatContent
        currentUserType={currentUserType}
        currentUserName={currentUserName}
        currentUserAvatar={currentUserAvatar}
        sellerName={sellerName}
        sellerLogo={sellerLogo}
        buyerName={buyerName}
        buyerAvatar={buyerAvatar}
        primaryColor={primaryColor}
        onSendOffer={onSendOffer}
        onAcceptOffer={handleAcceptOffer}
        onDeclineOffer={handleDeclineOffer}
      />
    </ChatRoomProvider>
  );
}
