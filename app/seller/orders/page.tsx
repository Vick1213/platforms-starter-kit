'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Package, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
}

interface Order {
  id: string;
  orderNumber: string;
  customerEmail: string;
  status: string;
  paymentStatus: string;
  total: number;
  items: OrderItem[];
  createdAt: string;
}

type StatusFilter = 'all' | 'active' | 'completed';

const activeStatuses = new Set(['pending', 'confirmed', 'processing', 'shipped']);
const completedStatuses = new Set(['delivered', 'cancelled', 'refunded']);

function getBadgeClass(status: string) {
  if (status === 'delivered') return 'bg-green-100 text-green-700';
  if (status === 'cancelled' || status === 'refunded') return 'bg-red-100 text-red-700';
  if (status === 'shipped') return 'bg-blue-100 text-blue-700';
  if (status === 'processing' || status === 'confirmed') return 'bg-purple-100 text-purple-700';
  return 'bg-amber-100 text-amber-700';
}

export default function SellerOrdersPage() {
  const { status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<StatusFilter>('all');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }

    if (status === 'authenticated') {
      fetchOrders();
    }
  }, [status, router]);

  const fetchOrders = async () => {
    try {
      const sellerRes = await fetch('/api/seller/profile');
      if (!sellerRes.ok) {
        throw new Error('Failed to load seller profile');
      }

      const sellerData = await sellerRes.json();
      const subdomain = sellerData?.seller?.subdomain;
      if (!subdomain) {
        throw new Error('Seller subdomain not found');
      }

      const ordersRes = await fetch(`/api/orders?subdomain=${subdomain}&limit=100`);
      if (!ordersRes.ok) {
        throw new Error('Failed to load orders');
      }

      const ordersData = await ordersRes.json();
      setOrders(ordersData.orders || []);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = useMemo(() => {
    if (filter === 'all') return orders;
    if (filter === 'active') return orders.filter((order) => activeStatuses.has(order.status));
    return orders.filter((order) => completedStatuses.has(order.status));
  }, [orders, filter]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/seller" className="p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Orders</h1>
              <p className="text-sm text-gray-500">{orders.length} total orders</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            {(['all', 'active', 'completed'] as const).map((f) => (
              <Button
                key={f}
                variant={filter === f ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(f)}
                className={filter === f ? 'bg-orange-500 hover:bg-orange-600 capitalize' : 'capitalize'}
              >
                {f}
              </Button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="sm:hidden mb-4 flex items-center gap-2">
          {(['all', 'active', 'completed'] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f)}
              className={filter === f ? 'bg-orange-500 hover:bg-orange-600 capitalize' : 'capitalize'}
            >
              {f}
            </Button>
          ))}
        </div>

        {filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="py-14 text-center">
              <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-gray-900 mb-2">No orders yet</h2>
              <p className="text-gray-500">Orders from checkout and accepted offers will appear here.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <Card key={order.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{order.orderNumber}</p>
                      <p className="text-sm text-gray-500">{order.customerEmail}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(order.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${getBadgeClass(order.status)}`}>
                        {order.status}
                      </span>
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 capitalize">
                        payment: {order.paymentStatus}
                      </span>
                      <span className="font-semibold text-gray-900">${order.total.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                      <Package className="w-4 h-4" />
                      {order.items.length} item{order.items.length === 1 ? '' : 's'}
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                      {order.items.slice(0, 3).map((item) => (
                        <span key={item.id}>
                          {item.name} x{item.quantity}
                        </span>
                      ))}
                      {order.items.length > 3 && (
                        <span className="text-gray-500">+{order.items.length - 3} more</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
