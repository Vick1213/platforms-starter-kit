'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import * as Ably from 'ably';
import { ChatClient } from '@ably/chat';
import { AblyProvider } from 'ably/react';
import { ChatClientProvider } from '@ably/chat/react';
import { NotificationPayload } from '@/lib/ably';

// Notification context
interface NotificationContextType {
  notifications: NotificationPayload[];
  unreadCount: number;
  addNotification: (notification: NotificationPayload) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    // Return a safe default when not in provider
    return {
      notifications: [],
      unreadCount: 0,
      addNotification: () => {},
      markAsRead: () => {},
      markAllAsRead: () => {},
      clearNotifications: () => {},
    };
  }
  return context;
}

// Chat context for connection status
interface ChatContextType {
  isConnected: boolean;
  clientId: string | null;
  realtimeClient: Ably.Realtime | null;
  chatClient: ChatClient | null;
}

const ChatContext = createContext<ChatContextType>({
  isConnected: false,
  clientId: null,
  realtimeClient: null,
  chatClient: null,
});

export function useChatContext() {
  return useContext(ChatContext);
}

interface AblyChatProviderProps {
  children: ReactNode;
}

export function AblyChatProvider({ children }: AblyChatProviderProps) {
  const { data: session, status } = useSession();
  const [realtimeClient, setRealtimeClient] = useState<Ably.Realtime | null>(null);
  const [chatClient, setChatClient] = useState<ChatClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<NotificationPayload[]>([]);
  const [clientId, setClientId] = useState<string | null>(null);

  // Initialize Ably client when session is available
  useEffect(() => {
    // Only initialize if user is authenticated
    if (status !== 'authenticated' || !session?.user?.id) {
      // Close existing connection if session is lost
      if (realtimeClient) {
        realtimeClient.close();
        setRealtimeClient(null);
        setChatClient(null);
        setIsConnected(false);
        setClientId(null);
      }
      return;
    }

    // Create client ID - will be validated/updated by token endpoint
    const userId = session.user.id;
    const tempClientId = `user:${userId}`;
    setClientId(tempClientId);

    const client = new Ably.Realtime({
      authUrl: '/api/ably/token',
      authMethod: 'POST',
      clientId: tempClientId,
    });

    const chat = new ChatClient(client);

    // Track connection state
    client.connection.on('connected', () => {
      setIsConnected(true);
      // Update clientId from actual auth response
      const actualClientId = client.auth.clientId;
      if (actualClientId) {
        setClientId(actualClientId);
      }
      console.log('Ably connected with clientId:', actualClientId);
    });

    client.connection.on('disconnected', () => {
      setIsConnected(false);
      console.log('Ably disconnected');
    });

    client.connection.on('failed', (err) => {
      setIsConnected(false);
      console.error('Ably connection failed:', err);
    });

    setRealtimeClient(client);
    setChatClient(chat);

    return () => {
      client.close();
    };
  }, [status, session?.user?.id]);

  // Subscribe to notification channel
  useEffect(() => {
    if (!realtimeClient || !isConnected || !clientId) return;

    // Determine notification channel based on client type
    const channelName = clientId.startsWith('seller:')
      ? `notifications:seller:${clientId.split(':')[1]}`
      : `notifications:user:${clientId.split(':')[1]}`;

    const channel = realtimeClient.channels.get(channelName);

    channel.subscribe('notification', (message) => {
      const notification = message.data as NotificationPayload;
      setNotifications((prev) => [notification, ...prev].slice(0, 50)); // Keep last 50
      
      // Show browser notification if permitted
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico',
        });
      }
    });

    return () => {
      channel.unsubscribe();
    };
  }, [realtimeClient, isConnected, clientId]);

  // Notification handlers
  const addNotification = useCallback((notification: NotificationPayload) => {
    setNotifications((prev) => [notification, ...prev].slice(0, 50));
  }, []);

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const chatContextValue: ChatContextType = {
    isConnected,
    clientId,
    realtimeClient,
    chatClient,
  };

  const notificationContextValue: NotificationContextType = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  };

  // If not authenticated, just render children without Ably
  if (status !== 'authenticated' || !realtimeClient || !chatClient) {
    return (
      <ChatContext.Provider value={chatContextValue}>
        <NotificationContext.Provider value={notificationContextValue}>
          {children}
        </NotificationContext.Provider>
      </ChatContext.Provider>
    );
  }

  return (
    <ChatContext.Provider value={chatContextValue}>
      <NotificationContext.Provider value={notificationContextValue}>
        <AblyProvider client={realtimeClient}>
          <ChatClientProvider client={chatClient}>
            {children}
          </ChatClientProvider>
        </AblyProvider>
      </NotificationContext.Provider>
    </ChatContext.Provider>
  );
}

// Hook to request notification permission
export function useNotificationPermission() {
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if ('Notification' in window) {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    }
    return 'denied' as NotificationPermission;
  }, []);

  return { permission, requestPermission };
}
