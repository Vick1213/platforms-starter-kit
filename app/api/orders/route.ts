import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createOrder, getOrder, getOrderByNumber, getSellerOrders, getCustomerOrders, clearCart } from '@/lib/cart-db';
import { getCart } from '@/lib/cart-db';
import { prisma } from '@/lib/prisma';
import { Order, OrderItem } from '@/lib/cart-types';

// Helper to get session ID
async function getSessionId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get('cart_session')?.value || null;
}

// POST /api/orders - Create new order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      subdomain,
      shippingAddress,
      billingAddress,
      sameAsBilling,
      paymentMethod,
      customerNotes,
    } = body;

    if (!subdomain || !shippingAddress) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Find seller by subdomain
    const seller = await prisma.seller.findUnique({
      where: { subdomain },
    });

    if (!seller) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Get cart
    const sessionId = await getSessionId();
    if (!sessionId) {
      return NextResponse.json({ error: 'No cart session' }, { status: 400 });
    }

    const cart = await getCart(seller.id, sessionId);
    if (!cart || cart.items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    // Calculate totals
    const subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const tax = subtotal * 0.0825; // 8.25% tax
    const shippingCost = 0; // TBD
    const total = subtotal + tax + shippingCost;

    // Create order items
    const orderItems: OrderItem[] = cart.items.map((item, index) => ({
      id: `item-${index + 1}`,
      productId: item.productId,
      productSlug: item.productSlug,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      image: item.image,
      subtotal: item.price * item.quantity,
    }));

    // Create order
    const order = await createOrder({
      sellerId: seller.id,
      sellerName: seller.businessName,
      sellerSubdomain: subdomain,
      customerEmail: shippingAddress.email,
      shippingAddress,
      billingAddress: sameAsBilling ? { ...shippingAddress, sameAsShipping: true } : billingAddress,
      items: orderItems,
      subtotal,
      tax,
      shippingCost,
      discount: 0,
      total,
      paymentMethod,
      paymentStatus: 'pending',
      status: 'pending',
      notes: customerNotes,
    });

    // Clear the cart after successful order
    await clearCart(seller.id, sessionId);

    return NextResponse.json(order);
  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}

// GET /api/orders - Get orders
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subdomain = searchParams.get('subdomain');
    const orderNumber = searchParams.get('orderNumber');
    const orderId = searchParams.get('orderId');
    const email = searchParams.get('email');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Get specific order by ID
    if (orderId) {
      const order = await getOrder(orderId);
      if (!order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }
      return NextResponse.json(order);
    }

    // Get order by order number
    if (orderNumber && subdomain) {
      const seller = await prisma.seller.findUnique({
        where: { subdomain },
      });

      if (!seller) {
        return NextResponse.json({ error: 'Store not found' }, { status: 404 });
      }

      const order = await getOrderByNumber(orderNumber, seller.id);
      if (!order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }
      return NextResponse.json(order);
    }

    // Get orders by customer email
    if (email) {
      const orders = await getCustomerOrders(email, limit);
      return NextResponse.json({ orders });
    }

    // Get seller orders
    if (subdomain) {
      const seller = await prisma.seller.findUnique({
        where: { subdomain },
      });

      if (!seller) {
        return NextResponse.json({ error: 'Store not found' }, { status: 404 });
      }

      const orders = await getSellerOrders(seller.id, limit);
      return NextResponse.json({ orders });
    }

    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  } catch (error) {
    console.error('Get orders error:', error);
    return NextResponse.json({ error: 'Failed to get orders' }, { status: 500 });
  }
}
