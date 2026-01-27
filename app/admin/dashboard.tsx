'use client';

import { useState, useTransition } from 'react';
import { useActionState } from 'react';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Trash2, Loader2, ShoppingBag, Users, Store, TrendingUp, 
  Settings, LogOut, CheckCircle2, XCircle, Clock, BarChart3,
  Package, DollarSign, Menu, X, ExternalLink, Shield
} from 'lucide-react';
import { deleteSubdomainAction } from '@/app/actions';
import { rootDomain, buildSubdomainUrl, isVercelPreview } from '@/lib/utils';
import type { Seller, User } from '@/lib/types';
import type { UserRole } from '@/lib/auth-config';

type Tenant = {
  subdomain: string;
  emoji: string;
  createdAt: number;
};

type AdminDashboardProps = {
  tenants: Tenant[];
  sellers: Seller[];
  users: User[];
  currentUser: {
    id: string;
    email: string;
    name: string | null;
    image: string | null;
    role: UserRole;
  };
};

type DeleteState = {
  error?: string;
  success?: string;
};

export function AdminDashboard({ tenants, sellers, users, currentUser }: AdminDashboardProps) {
  const router = useRouter();
  const [state, action, isPending] = useActionState<DeleteState, FormData>(
    deleteSubdomainAction,
    {}
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'sellers' | 'users' | 'subdomains'>('overview');

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.refresh();
    router.push('/');
  };
  const [loadingActions, setLoadingActions] = useState<Record<string, boolean>>({});
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Helper to show a notification
  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Helper to format subdomain display
  const formatSubdomain = (subdomain: string) => {
    return isVercelPreview ? `${subdomain}---${rootDomain}` : `${subdomain}.${rootDomain}`;
  };

  // Handle seller actions (approve, reject, suspend, delete)
  const handleSellerAction = async (sellerId: string, action: 'approve' | 'reject' | 'suspend' | 'unsuspend' | 'delete') => {
    setLoadingActions(prev => ({ ...prev, [`${sellerId}-${action}`]: true }));
    
    try {
      const method = action === 'delete' ? 'DELETE' : 'PATCH';
      const body = action === 'delete' ? undefined : JSON.stringify({ action });
      
      const response = await fetch(`/api/admin/sellers/${sellerId}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update seller');
      }

      showNotification('success', data.message);
      router.refresh(); // Refresh the page to get updated data
    } catch (error) {
      showNotification('error', error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoadingActions(prev => ({ ...prev, [`${sellerId}-${action}`]: false }));
    }
  };

  const stats = [
    { label: 'Total Users', value: users.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Active Sellers', value: sellers.filter(s => s.status === 'approved').length, icon: Store, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Pending Approvals', value: sellers.filter(s => s.status === 'pending').length, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Total Subdomains', value: tenants.length + sellers.length, icon: Package, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-rose-600 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-gray-900">Admin Portal</span>
        </div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`
          fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r transform transition-transform duration-200
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="p-6 border-b hidden lg:block">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-600 rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <span className="font-bold text-gray-900 block">Admin Portal</span>
                  <span className="text-xs text-gray-500">MarketPlace</span>
                </div>
              </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1">
              <button 
                onClick={() => setActiveTab('overview')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg ${
                  activeTab === 'overview' ? 'bg-red-50 text-red-600 font-medium' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <BarChart3 className="w-5 h-5" />
                Overview
              </button>
              <button 
                onClick={() => setActiveTab('sellers')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg ${
                  activeTab === 'sellers' ? 'bg-red-50 text-red-600 font-medium' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Store className="w-5 h-5" />
                Sellers
                {sellers.filter(s => s.status === 'pending').length > 0 && (
                  <span className="ml-auto bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full">
                    {sellers.filter(s => s.status === 'pending').length}
                  </span>
                )}
              </button>
              <button 
                onClick={() => setActiveTab('users')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg ${
                  activeTab === 'users' ? 'bg-red-50 text-red-600 font-medium' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Users className="w-5 h-5" />
                Users
              </button>
              <button 
                onClick={() => setActiveTab('subdomains')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg ${
                  activeTab === 'subdomains' ? 'bg-red-50 text-red-600 font-medium' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Package className="w-5 h-5" />
                Subdomains
              </button>
            </nav>

            {/* User Section */}
            <div className="p-4 border-t">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center text-white font-semibold">
                  {currentUser.name?.charAt(0) || currentUser.email.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{currentUser.name || 'Admin'}</p>
                  <p className="text-xs text-gray-500 truncate">{currentUser.email}</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                className="w-full justify-start text-gray-600 hover:text-red-600 hover:bg-red-50"
                onClick={handleSignOut}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign out
              </Button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
              {activeTab === 'overview' && 'Dashboard Overview'}
              {activeTab === 'sellers' && 'Seller Management'}
              {activeTab === 'users' && 'User Management'}
              {activeTab === 'subdomains' && 'Subdomain Management'}
            </h1>
            <p className="text-gray-600 mt-1">
              {activeTab === 'overview' && 'Platform statistics and quick actions'}
              {activeTab === 'sellers' && 'Manage and approve seller accounts'}
              {activeTab === 'users' && 'View and manage platform users'}
              {activeTab === 'subdomains' && 'Legacy subdomain management'}
            </p>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {stats.map((stat, index) => (
                  <Card key={index}>
                    <CardContent className="p-4 lg:p-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center`}>
                          <stat.icon className={`w-5 h-5 ${stat.color}`} />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                          <p className="text-sm text-gray-500">{stat.label}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Recent Activity */}
              <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Pending Seller Approvals</CardTitle>
                    <CardDescription>Sellers waiting for review</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {sellers.filter(s => s.status === 'pending').length === 0 ? (
                      <p className="text-gray-500 text-sm">No pending approvals</p>
                    ) : (
                      <div className="space-y-3">
                        {sellers.filter(s => s.status === 'pending').slice(0, 5).map(seller => (
                          <div key={seller.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium">{seller.businessName}</p>
                              <p className="text-sm text-gray-500">{formatSubdomain(seller.subdomain)}</p>
                            </div>
                            <Button 
                              size="sm" 
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleSellerAction(seller.id, 'approve')}
                              disabled={loadingActions[`${seller.id}-approve`]}
                            >
                              {loadingActions[`${seller.id}-approve`] ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                'Approve'
                              )}
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Sellers</CardTitle>
                    <CardDescription>Latest approved sellers</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {sellers.filter(s => s.status === 'approved').length === 0 ? (
                      <p className="text-gray-500 text-sm">No approved sellers yet</p>
                    ) : (
                      <div className="space-y-3">
                        {sellers.filter(s => s.status === 'approved').slice(0, 5).map(seller => (
                          <div key={seller.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium">{seller.businessName}</p>
                              <p className="text-sm text-gray-500">{formatSubdomain(seller.subdomain)}</p>
                            </div>
                            <a 
                              href={buildSubdomainUrl(seller.subdomain)}
                              target="_blank"
                              className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                            >
                              Visit <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {/* Sellers Tab */}
          {activeTab === 'sellers' && (
            <div className="space-y-4">
              {sellers.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <Store className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No sellers have registered yet.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {sellers.map(seller => (
                    <Card key={seller.id}>
                      <CardContent className="p-4">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center">
                              <Store className="w-6 h-6 text-orange-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{seller.businessName}</h3>
                              <p className="text-sm text-gray-500">{seller.businessEmail}</p>
                              <a 
                                href={buildSubdomainUrl(seller.subdomain)}
                                target="_blank"
                                className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                              >
                                {formatSubdomain(seller.subdomain)}
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              seller.status === 'approved' ? 'bg-green-100 text-green-700' :
                              seller.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                              seller.status === 'rejected' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {seller.status.charAt(0).toUpperCase() + seller.status.slice(1)}
                            </span>
                            
                            {/* Action buttons based on status */}
                            {seller.status === 'pending' && (
                              <>
                                <Button 
                                  size="sm" 
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => handleSellerAction(seller.id, 'approve')}
                                  disabled={loadingActions[`${seller.id}-approve`]}
                                >
                                  {loadingActions[`${seller.id}-approve`] ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <>
                                      <CheckCircle2 className="w-4 h-4 mr-1" />
                                      Approve
                                    </>
                                  )}
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="text-red-600 hover:bg-red-50"
                                  onClick={() => handleSellerAction(seller.id, 'reject')}
                                  disabled={loadingActions[`${seller.id}-reject`]}
                                >
                                  {loadingActions[`${seller.id}-reject`] ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <>
                                      <XCircle className="w-4 h-4 mr-1" />
                                      Reject
                                    </>
                                  )}
                                </Button>
                              </>
                            )}
                            
                            {seller.status === 'approved' && (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="text-amber-600 hover:bg-amber-50"
                                onClick={() => handleSellerAction(seller.id, 'suspend')}
                                disabled={loadingActions[`${seller.id}-suspend`]}
                              >
                                {loadingActions[`${seller.id}-suspend`] ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  'Suspend'
                                )}
                              </Button>
                            )}
                            
                            {seller.status === 'suspended' && (
                              <Button 
                                size="sm" 
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handleSellerAction(seller.id, 'unsuspend')}
                                disabled={loadingActions[`${seller.id}-unsuspend`]}
                              >
                                {loadingActions[`${seller.id}-unsuspend`] ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  'Unsuspend'
                                )}
                              </Button>
                            )}
                            
                            {seller.status === 'rejected' && (
                              <Button 
                                size="sm" 
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handleSellerAction(seller.id, 'approve')}
                                disabled={loadingActions[`${seller.id}-approve`]}
                              >
                                {loadingActions[`${seller.id}-approve`] ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  'Approve'
                                )}
                              </Button>
                            )}
                            
                            {/* Delete button for all statuses */}
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="text-red-600 hover:bg-red-50"
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete ${seller.businessName}? This cannot be undone.`)) {
                                  handleSellerAction(seller.id, 'delete');
                                }
                              }}
                              disabled={loadingActions[`${seller.id}-delete`]}
                            >
                              {loadingActions[`${seller.id}-delete`] ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                        
                        {/* Additional seller details */}
                        {seller.description && (
                          <p className="mt-3 text-sm text-gray-600 border-t pt-3">{seller.description}</p>
                        )}
                        <div className="mt-2 flex flex-wrap gap-4 text-xs text-gray-500">
                          <span>Created: {new Date(seller.createdAt).toLocaleDateString()}</span>
                          {seller.businessPhone && <span>Phone: {seller.businessPhone}</span>}
                          {seller.verified && <span className="text-green-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Verified</span>}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              {users.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No users registered yet.</p>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-0">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="text-left p-4 font-medium text-gray-600">User</th>
                          <th className="text-left p-4 font-medium text-gray-600">Email</th>
                          <th className="text-left p-4 font-medium text-gray-600">Role</th>
                          <th className="text-left p-4 font-medium text-gray-600">Joined</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map(user => (
                          <tr key={user.id} className="border-b last:border-0">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-600 font-medium text-sm">
                                  {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                                </div>
                                <span className="font-medium">{user.name || 'Unknown'}</span>
                              </div>
                            </td>
                            <td className="p-4 text-gray-600">{user.email}</td>
                            <td className="p-4">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                user.role === 'ADMIN' ? 'bg-red-100 text-red-700' :
                                user.role === 'SELLER' ? 'bg-orange-100 text-orange-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {user.role}
                              </span>
                            </td>
                            <td className="p-4 text-gray-600 text-sm">
                              {new Date(user.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Subdomains Tab (Legacy) */}
          {activeTab === 'subdomains' && (
            <div className="space-y-4">
              {tenants.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No legacy subdomains found.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {tenants.map((tenant) => (
                    <Card key={tenant.subdomain}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-xl">{tenant.subdomain}</CardTitle>
                          <form action={action}>
                            <input type="hidden" name="subdomain" value={tenant.subdomain} />
                            <Button
                              variant="ghost"
                              size="icon"
                              type="submit"
                              disabled={isPending}
                              className="text-gray-500 hover:text-red-600 hover:bg-red-50"
                            >
                              {isPending ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                              ) : (
                                <Trash2 className="h-5 w-5" />
                              )}
                            </Button>
                          </form>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div className="text-4xl">{tenant.emoji}</div>
                          <div className="text-sm text-gray-500">
                            {new Date(tenant.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="mt-4">
                          <a
                            href={buildSubdomainUrl(tenant.subdomain)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline text-sm flex items-center gap-1"
                          >
                            Visit subdomain <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Toast Notifications */}
      {(state.error || state.success || notification) && (
        <div className="fixed bottom-4 right-4 z-50 space-y-2">
          {state.error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-md">
              {state.error}
            </div>
          )}
          {state.success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded shadow-md">
              {state.success}
            </div>
          )}
          {notification && (
            <div className={`px-4 py-3 rounded shadow-md ${
              notification.type === 'success' 
                ? 'bg-green-100 border border-green-400 text-green-700' 
                : 'bg-red-100 border border-red-400 text-red-700'
            }`}>
              {notification.message}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
