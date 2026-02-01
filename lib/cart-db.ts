// Cart and Order Database Operations
import { redis } from './redis';
import { Cart, CartItem, Order, generateOrderNumber } from './cart-types';

// Keys
const cartKeys = {
  cart: (sellerId: string, sessionId: string) => `cart:${sellerId}:${sessionId}`,
  order: (orderId: string) => `order:${orderId}`,
  sellerOrders: (sellerId: string) => `seller:orders:${sellerId}`,
  customerOrders: (email: string) => `customer:orders:${email}`,
};

// ============================================
// CART OPERATIONS
// ============================================

export async function getCart(sellerId: string, sessionId: string): Promise<Cart | null> {
  return redis.get<Cart>(cartKeys.cart(sellerId, sessionId));
}

export async function saveCart(sellerId: string, sellerSubdomain: string, sessionId: string, items: CartItem[]): Promise<Cart> {
  const cart: Cart = {
    items,
    sellerId,
    sellerSubdomain,
    updatedAt: new Date().toISOString(),
  };
  
  // Cart expires in 7 days
  await redis.set(cartKeys.cart(sellerId, sessionId), cart, { ex: 60 * 60 * 24 * 7 });
  
  return cart;
}

export async function addToCart(
  sellerId: string,
  sellerSubdomain: string,
  sessionId: string,
  item: Omit<CartItem, 'id'>
): Promise<Cart> {
  const cart = await getCart(sellerId, sessionId);
  const items = cart?.items || [];
  
  // Check if item already exists
  const existingIndex = items.findIndex(i => i.productId === item.productId);
  
  if (existingIndex >= 0) {
    // Update quantity
    items[existingIndex].quantity += item.quantity;
  } else {
    // Add new item
    items.push({
      ...item,
      id: `${item.productId}-${Date.now()}`,
    });
  }
  
  return saveCart(sellerId, sellerSubdomain, sessionId, items);
}

export async function updateCartItemQuantity(
  sellerId: string,
  sessionId: string,
  itemId: string,
  quantity: number
): Promise<Cart | null> {
  const cart = await getCart(sellerId, sessionId);
  if (!cart) return null;
  
  const items = cart.items.map(item => {
    if (item.id === itemId) {
      return { ...item, quantity };
    }
    return item;
  }).filter(item => item.quantity > 0);
  
  return saveCart(sellerId, cart.sellerSubdomain, sessionId, items);
}

export async function removeFromCart(
  sellerId: string,
  sessionId: string,
  itemId: string
): Promise<Cart | null> {
  const cart = await getCart(sellerId, sessionId);
  if (!cart) return null;
  
  const items = cart.items.filter(item => item.id !== itemId);
  
  return saveCart(sellerId, cart.sellerSubdomain, sessionId, items);
}

export async function clearCart(sellerId: string, sessionId: string): Promise<void> {
  await redis.del(cartKeys.cart(sellerId, sessionId));
}

// ============================================
// ORDER OPERATIONS
// ============================================

export async function createOrder(orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>): Promise<Order> {
  const id = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const orderNumber = generateOrderNumber();
  
  const order: Order = {
    ...orderData,
    id,
    orderNumber,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  // Save order
  await redis.set(cartKeys.order(id), order);
  
  // Add to seller's order list
  await redis.lpush(cartKeys.sellerOrders(order.sellerId), id);
  
  // Add to customer's order list (by email)
  await redis.lpush(cartKeys.customerOrders(order.customerEmail), id);
  
  return order;
}

export async function getOrder(orderId: string): Promise<Order | null> {
  return redis.get<Order>(cartKeys.order(orderId));
}

export async function getOrderByNumber(orderNumber: string, sellerId: string): Promise<Order | null> {
  // Get all orders for seller and find by order number
  const orderIds = await redis.lrange(cartKeys.sellerOrders(sellerId), 0, -1) as string[];
  
  for (const id of orderIds) {
    const order = await getOrder(id);
    if (order?.orderNumber === orderNumber) {
      return order;
    }
  }
  
  return null;
}

export async function getSellerOrders(sellerId: string, limit = 50): Promise<Order[]> {
  const orderIds = await redis.lrange(cartKeys.sellerOrders(sellerId), 0, limit - 1) as string[];
  
  const orders: Order[] = [];
  for (const id of orderIds) {
    const order = await getOrder(id);
    if (order) orders.push(order);
  }
  
  return orders;
}

export async function getCustomerOrders(email: string, limit = 50): Promise<Order[]> {
  const orderIds = await redis.lrange(cartKeys.customerOrders(email), 0, limit - 1) as string[];
  
  const orders: Order[] = [];
  for (const id of orderIds) {
    const order = await getOrder(id);
    if (order) orders.push(order);
  }
  
  return orders;
}

export async function updateOrderStatus(
  orderId: string,
  status: Order['status'],
  additionalData?: Partial<Pick<Order, 'shippedAt' | 'deliveredAt' | 'sellerNotes'>>
): Promise<Order | null> {
  const order = await getOrder(orderId);
  if (!order) return null;
  
  const updated: Order = {
    ...order,
    status,
    updatedAt: new Date().toISOString(),
    ...additionalData,
  };
  
  await redis.set(cartKeys.order(orderId), updated);
  
  return updated;
}

export async function updatePaymentStatus(
  orderId: string,
  paymentStatus: Order['paymentStatus']
): Promise<Order | null> {
  const order = await getOrder(orderId);
  if (!order) return null;
  
  const updated: Order = {
    ...order,
    paymentStatus,
    updatedAt: new Date().toISOString(),
  };
  
  await redis.set(cartKeys.order(orderId), updated);
  
  return updated;
}
