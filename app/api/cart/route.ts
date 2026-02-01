import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { 
  getCart, 
  addToCart, 
  updateCartItemQuantity, 
  removeFromCart, 
  clearCart 
} from '@/lib/cart-db';
import { prisma } from '@/lib/prisma';

// Helper to get or create session ID
async function getSessionId(): Promise<string> {
  const cookieStore = await cookies();
  let sessionId = cookieStore.get('cart_session')?.value;
  
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }
  
  return sessionId;
}

// GET /api/cart - Get cart for a store
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subdomain = searchParams.get('subdomain');
    
    if (!subdomain) {
      return NextResponse.json({ error: 'Subdomain required' }, { status: 400 });
    }
    
    // Find seller by subdomain
    const seller = await prisma.seller.findUnique({
      where: { subdomain },
    });
    
    if (!seller) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }
    
    const sessionId = await getSessionId();
    const cart = await getCart(seller.id, sessionId);
    
    const response = NextResponse.json(cart || { items: [], sellerId: seller.id, sellerSubdomain: subdomain, updatedAt: new Date().toISOString() });
    
    // Set session cookie
    response.cookies.set('cart_session', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    
    return response;
  } catch (error) {
    console.error('Get cart error:', error);
    return NextResponse.json({ error: 'Failed to get cart' }, { status: 500 });
  }
}

// POST /api/cart - Add item to cart
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subdomain, productId, productSlug, name, price, quantity = 1, image, moq } = body;
    
    if (!subdomain || !productId || !name || price === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Find seller by subdomain
    const seller = await prisma.seller.findUnique({
      where: { subdomain },
    });
    
    if (!seller) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }
    
    const sessionId = await getSessionId();
    
    const cart = await addToCart(seller.id, subdomain, sessionId, {
      productId,
      productSlug,
      name,
      price,
      quantity,
      image,
      moq,
      sellerId: seller.id,
      sellerName: seller.businessName,
      sellerSubdomain: subdomain,
    });
    
    const response = NextResponse.json(cart);
    
    // Ensure session cookie is set
    response.cookies.set('cart_session', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });
    
    return response;
  } catch (error) {
    console.error('Add to cart error:', error);
    return NextResponse.json({ error: 'Failed to add to cart' }, { status: 500 });
  }
}

// PATCH /api/cart - Update item quantity
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { subdomain, itemId, quantity } = body;
    
    if (!subdomain || !itemId || quantity === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Find seller by subdomain
    const seller = await prisma.seller.findUnique({
      where: { subdomain },
    });
    
    if (!seller) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }
    
    const sessionId = await getSessionId();
    const cart = await updateCartItemQuantity(seller.id, sessionId, itemId, quantity);
    
    if (!cart) {
      return NextResponse.json({ error: 'Cart not found' }, { status: 404 });
    }
    
    return NextResponse.json(cart);
  } catch (error) {
    console.error('Update cart error:', error);
    return NextResponse.json({ error: 'Failed to update cart' }, { status: 500 });
  }
}

// DELETE /api/cart - Remove item or clear cart
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subdomain = searchParams.get('subdomain');
    const itemId = searchParams.get('itemId');
    const clearAll = searchParams.get('clearAll');
    
    if (!subdomain) {
      return NextResponse.json({ error: 'Subdomain required' }, { status: 400 });
    }
    
    // Find seller by subdomain
    const seller = await prisma.seller.findUnique({
      where: { subdomain },
    });
    
    if (!seller) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }
    
    const sessionId = await getSessionId();
    
    if (clearAll === 'true') {
      await clearCart(seller.id, sessionId);
      return NextResponse.json({ items: [], sellerId: seller.id, sellerSubdomain: subdomain, updatedAt: new Date().toISOString() });
    }
    
    if (!itemId) {
      return NextResponse.json({ error: 'Item ID required' }, { status: 400 });
    }
    
    const cart = await removeFromCart(seller.id, sessionId, itemId);
    
    if (!cart) {
      return NextResponse.json({ error: 'Cart not found' }, { status: 404 });
    }
    
    return NextResponse.json(cart);
  } catch (error) {
    console.error('Delete from cart error:', error);
    return NextResponse.json({ error: 'Failed to remove from cart' }, { status: 500 });
  }
}
