'use client';

import { formatDistanceToNow } from 'date-fns';
import { MessageCircle, Store, Package, Check, CheckCheck } from 'lucide-react';
import { Conversation } from '@/lib/chat-types';

interface ConversationListProps {
  conversations: Conversation[];
  selectedId?: string;
  userType: 'buyer' | 'seller';
  onSelect: (conversation: Conversation) => void;
  className?: string;
}

export function ConversationList({
  conversations,
  selectedId,
  userType,
  onSelect,
  className = '',
}: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div className={`flex items-center justify-center h-64 text-gray-500 ${className}`}>
        <div className="text-center">
          <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p className="font-medium">No conversations yet</p>
          <p className="text-sm">
            {userType === 'seller' 
              ? "Enquiries from customers will appear here"
              : "Start a conversation by contacting a seller"
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`divide-y ${className}`}>
      {conversations.map((conversation) => (
        <ConversationItem
          key={conversation.id}
          conversation={conversation}
          isSelected={conversation.id === selectedId}
          userType={userType}
          onClick={() => onSelect(conversation)}
        />
      ))}
    </div>
  );
}

interface ConversationItemProps {
  conversation: Conversation;
  isSelected: boolean;
  userType: 'buyer' | 'seller';
  onClick: () => void;
}

function ConversationItem({
  conversation,
  isSelected,
  userType,
  onClick,
}: ConversationItemProps) {
  const otherParty = userType === 'buyer'
    ? { name: conversation.sellerName, avatar: conversation.sellerLogo }
    : { name: conversation.buyerName, avatar: conversation.buyerAvatar };

  const unreadCount = userType === 'seller' 
    ? conversation.unreadCountSeller 
    : conversation.unreadCountBuyer;

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return '';
    }
  };

  return (
    <button
      onClick={onClick}
      className={`w-full px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors text-left ${
        isSelected ? 'bg-orange-50 border-l-4 border-orange-500' : ''
      }`}
    >
      {/* Avatar */}
      {otherParty.avatar ? (
        <img 
          src={otherParty.avatar} 
          alt={otherParty.name}
          className="w-12 h-12 rounded-full object-cover flex-shrink-0"
        />
      ) : (
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
          {userType === 'buyer' ? (
            <Store className="w-6 h-6 text-gray-400" />
          ) : (
            <MessageCircle className="w-6 h-6 text-gray-400" />
          )}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h4 className="font-medium text-gray-900 truncate">{otherParty.name}</h4>
          {conversation.lastMessage && (
            <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
              {formatTime(conversation.lastMessage.createdAt)}
            </span>
          )}
        </div>

        {/* Product context */}
        {conversation.initialProduct && (
          <div className="flex items-center gap-1 mb-1">
            <Package className="w-3 h-3 text-orange-500" />
            <span className="text-xs text-orange-600 truncate">
              {conversation.initialProduct.productName}
            </span>
          </div>
        )}

        {/* Last message */}
        <div className="flex items-center gap-2">
          {conversation.lastMessage ? (
            <>
              <p className="text-sm text-gray-500 truncate flex-1">
                {conversation.lastMessage.senderType === (userType === 'seller' ? 'seller' : 'buyer') && (
                  <span className="text-gray-400 mr-1">You:</span>
                )}
                {conversation.lastMessage.content}
              </p>
              {unreadCount > 0 && (
                <span className="flex-shrink-0 w-5 h-5 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </>
          ) : (
            <p className="text-sm text-gray-400 italic">No messages yet</p>
          )}
        </div>
      </div>
    </button>
  );
}
