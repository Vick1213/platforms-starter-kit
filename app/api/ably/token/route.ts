import { NextRequest, NextResponse } from 'next/server';
import * as Ably from 'ably';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// POST /api/ably/token - Generate Ably token for authenticated users
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user info
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { seller: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create client ID based on user type
    const clientId = user.seller 
      ? `seller:${user.seller.id}:${user.id}`
      : `user:${user.id}`;

    // Initialize Ably with API key
    const ably = new Ably.Rest({
      key: process.env.ABLY_API_KEY,
    });

    // Define capabilities based on user role
    const capabilities: Record<string, string[]> = {
      // All users can subscribe to their notification channel
      [`notifications:user:${user.id}`]: ['subscribe', 'history'],
    };

    // Sellers get additional capabilities
    if (user.seller) {
      // Seller notification channel
      capabilities[`notifications:seller:${user.seller.id}`] = ['subscribe', 'publish', 'history'];
      
      // Seller can participate in any inquiry to their company
      capabilities[`inquiry:*`] = ['subscribe', 'publish', 'history', 'presence'];
      
      // Seller can participate in conversations
      capabilities[`conversation:*`] = ['subscribe', 'publish', 'history', 'presence'];
    } else {
      // Regular users can participate in their own inquiries/conversations
      capabilities[`inquiry:*`] = ['subscribe', 'publish', 'history', 'presence'];
      capabilities[`conversation:*`] = ['subscribe', 'publish', 'history', 'presence'];
    }

    // Create token request
    const tokenRequest = await ably.auth.createTokenRequest({
      clientId,
      capability: JSON.stringify(capabilities),
      ttl: 3600 * 1000, // 1 hour
    });

    return NextResponse.json(tokenRequest);
  } catch (error) {
    console.error('Ably token error:', error);
    return NextResponse.json({ error: 'Failed to generate token' }, { status: 500 });
  }
}
