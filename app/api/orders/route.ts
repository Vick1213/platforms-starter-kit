import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createOrder, getOrder, getOrderByNumber, getSellerOrders, getCustomerOrders, clearCart } from '@/lib/cart-db';
import { getCart } from '@/lib/cart-db';
import { prisma } from '@/lib/prisma';
import { Order as CartOrder, OrderItem as CartOrderItem } from '@/lib/cart-types';

// Helper to get session ID
async function getSessionId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get('cart_session')?.value || null;
}

function toAddress(value: unknown): CartOrder['shippingAddress'] {
  const address = (value && typeof value === 'object') ? (value as Record<string, unknown>) : {};
  return {
    fullName: String(address.fullName ?? address.name ?? ''),
    email: String(address.email ?? ''),
    phone: String(address.phone ?? ''),
    company: address.company ? String(address.company) : undefined,
    addressLine1: String(address.addressLine1 ?? address.address1 ?? ''),
    addressLine2: address.addressLine2 || address.address2 ? String(address.addressLine2 ?? address.address2) : undefined,
    city: String(address.city ?? ''),
    state: String(address.state ?? ''),
    postalCode: String(address.postalCode ?? ''),
    country: String(address.country ?? ''),
  };
}

function normalizePrismaOrder(
  order: {
    id: string;
    orderNumber: string;
    sellerId: string;
    customerId: string | null;
    customerEmail: string;
    items: {
      id: string;
      productId: string;
      productSlug: string;
      productName: string;
      productImage: string | null;
      quantity: number;
      unitPrice: number;
      unit: string | null;
      subtotal: number;
    }[];
    subtotal: number;
    shippingCost: number;
    tax: number;
    discount: number;
    total: number;
    shippingAddress: unknown;
    billingAddress: unknown;
    paymentMethod: string;
    paymentStatus: string;
    status: string;
    customerNotes: string | null;
    sellerNotes: string | null;
    createdAt: Date;
    updatedAt: Date;
    shippedAt: Date | null;
    deliveredAt: Date | null;
    seller: {
      businessName: string;
      subdomain: string;
    };
  }
): CartOrder {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    sellerId: order.sellerId,
    sellerName: order.seller.businessName,
    sellerSubdomain: order.seller.subdomain,
    customerId: order.customerId || undefined,
    customerEmail: order.customerEmail,
    items: order.items.map((item): CartOrderItem => ({
      id: item.id,
      productId: item.productId,
      productSlug: item.productSlug,
      name: item.productName,
      price: item.unitPrice,
      quantity: item.quantity,
      unit: item.unit || undefined,
      image: item.productImage || undefined,
      subtotal: item.subtotal,
    })),
    subtotal: order.subtotal,
    shippingCost: order.shippingCost,
    tax: order.tax,
    discount: order.discount,
    total: order.total,
    shippingAddress: toAddress(order.shippingAddress),
    billingAddress: {
      ...toAddress(order.billingAddress || order.shippingAddress),
      sameAsShipping: !order.billingAddress,
    },
    paymentMethod: order.paymentMethod as CartOrder['paymentMethod'],
    paymentStatus: order.paymentStatus.toLowerCase() as CartOrder['paymentStatus'],
    status: order.status.toLowerCase() as CartOrder['status'],
    notes: order.customerNotes || undefined,
    sellerNotes: order.sellerNotes || undefined,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    shippedAt: order.shippedAt?.toISOString(),
    deliveredAt: order.deliveredAt?.toISOString(),
  };
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
    const orderItems: CartOrderItem[] = cart.items.map((item, index) => ({
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
      const redisOrder = await getOrder(orderId);
      if (redisOrder) {
        return NextResponse.json(redisOrder);
      }

      const prismaOrder = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          seller: { select: { businessName: true, subdomain: true } },
          items: true,
        },
      });

      if (!prismaOrder) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }

      return NextResponse.json(normalizePrismaOrder(prismaOrder));
    }

    // Get order by order number
    if (orderNumber && subdomain) {
      const seller = await prisma.seller.findUnique({
        where: { subdomain },
      });

      if (!seller) {
        return NextResponse.json({ error: 'Store not found' }, { status: 404 });
      }

      const redisOrder = await getOrderByNumber(orderNumber, seller.id);
      if (redisOrder) {
        return NextResponse.json(redisOrder);
      }

      const prismaOrder = await prisma.order.findFirst({
        where: {
          sellerId: seller.id,
          orderNumber,
        },
        include: {
          seller: { select: { businessName: true, subdomain: true } },
          items: true,
        },
      });

      if (!prismaOrder) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }

      return NextResponse.json(normalizePrismaOrder(prismaOrder));
    }

    // Get orders by customer email
    if (email) {
      const [redisOrders, prismaOrders] = await Promise.all([
        getCustomerOrders(email, limit),
        prisma.order.findMany({
          where: { customerEmail: email },
          include: {
            seller: { select: { businessName: true, subdomain: true } },
            items: true,
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
        }),
      ]);

      const mergedOrders = [
        ...redisOrders,
        ...prismaOrders.map(normalizePrismaOrder),
      ]
        .filter((order, index, list) => list.findIndex((o) => o.id === order.id) === index)
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
        .slice(0, limit);

      return NextResponse.json({ orders: mergedOrders });
    }

    // Get seller orders
    if (subdomain) {
      const seller = await prisma.seller.findUnique({
        where: { subdomain },
      });

      if (!seller) {
        return NextResponse.json({ error: 'Store not found' }, { status: 404 });
      }

      const [redisOrders, prismaOrders] = await Promise.all([
        getSellerOrders(seller.id, limit),
        prisma.order.findMany({
          where: { sellerId: seller.id },
          include: {
            seller: { select: { businessName: true, subdomain: true } },
            items: true,
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
        }),
      ]);

      const mergedOrders = [
        ...redisOrders,
        ...prismaOrders.map(normalizePrismaOrder),
      ]
        .filter((order, index, list) => list.findIndex((o) => o.id === order.id) === index)
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
        .slice(0, limit);

      return NextResponse.json({ orders: mergedOrders });
    }

    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  } catch (error) {
    console.error('Get orders error:', error);
    return NextResponse.json({ error: 'Failed to get orders' }, { status: 500 });
  }
}
