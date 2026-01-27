import { UserRole } from './auth-config';

// User types - Now using Date instead of number for timestamps (matches PostgreSQL)
export interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: UserRole;
  emailVerified: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserCredentials extends User {
  password: string;
}

// Seller/Store types - Now using Date and string for status
export interface Seller {
  id: string;
  userId: string;
  businessName: string;
  businessEmail: string;
  businessPhone: string | null;
  description: string | null;
  logo: string | null;
  banner: string | null;
  subdomain: string;
  customDomain: string | null;
  verified: boolean;
  status: string; // 'pending' | 'approved' | 'rejected' | 'suspended'
  rating: number;
  totalSales: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SellerSettings {
  sellerId: string;
  currency: string;
  shippingZones: string[];
  returnPolicy: string | null;
  paymentMethods: string[];
  autoApproveOrders: boolean;
}

// Product types
export interface Product {
  id: string;
  sellerId: string;
  name: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  currency: string;
  images: string[];
  category: string;
  subcategory: string | null;
  inventory: number;
  sku: string | null;
  status: 'draft' | 'active' | 'archived';
  featured: boolean;
  createdAt: number;
  updatedAt: number;
}

// Category types
export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  parentId: string | null;
  order: number;
}

// Order types
export interface Order {
  id: string;
  buyerId: string;
  sellerId: string;
  items: OrderItem[];
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  total: number;
  shippingAddress: Address;
  createdAt: number;
  updatedAt: number;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string | null;
}

export interface Address {
  name: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string | null;
}

// Session extension for NextAuth
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string | null;
      image: string | null;
      role: UserRole;
    };
  }

  interface User {
    id?: string;
    role?: UserRole;
  }

  interface JWT {
    id: string;
    role: UserRole;
  }
}
