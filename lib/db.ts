import { redis } from './redis';
import { UserRole } from './auth-config';
import type { User, UserCredentials, Seller, SellerSettings, Product, Category, Order } from './types';
import { hashSync, compareSync } from 'bcryptjs';

// ============================================
// USER OPERATIONS
// ============================================

export async function createUser(data: {
  email: string;
  name: string | null;
  password?: string;
  image?: string | null;
  role?: UserRole;
  provider?: string;
}): Promise<User> {
  const id = `user_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const now = Date.now();

  const user: User = {
    id,
    email: data.email.toLowerCase(),
    name: data.name,
    image: data.image || null,
    role: data.role || UserRole.USER,
    emailVerified: null,
    createdAt: now,
    updatedAt: now,
  };

  // Store user
  await redis.set(`user:${id}`, user);
  await redis.set(`user:email:${data.email.toLowerCase()}`, id);

  // If password provided, store credentials
  if (data.password) {
    const hashedPassword = hashSync(data.password, 12);
    const credentials: UserCredentials = {
      ...user,
      password: hashedPassword,
    };
    await redis.set(`user:credentials:${id}`, credentials);
  }

  // Track OAuth provider if applicable
  if (data.provider) {
    await redis.set(`user:provider:${data.provider}:${data.email.toLowerCase()}`, id);
  }

  return user;
}

export async function getUserById(id: string): Promise<User | null> {
  return redis.get<User>(`user:${id}`);
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const userId = await redis.get<string>(`user:email:${email.toLowerCase()}`);
  if (!userId) return null;
  return getUserById(userId);
}

export async function getUserCredentials(userId: string): Promise<UserCredentials | null> {
  return redis.get<UserCredentials>(`user:credentials:${userId}`);
}

export async function verifyUserPassword(email: string, password: string): Promise<User | null> {
  const user = await getUserByEmail(email);
  if (!user) return null;

  const credentials = await getUserCredentials(user.id);
  if (!credentials) return null;

  const isValid = compareSync(password, credentials.password);
  return isValid ? user : null;
}

export async function updateUser(id: string, data: Partial<User>): Promise<User | null> {
  const user = await getUserById(id);
  if (!user) return null;

  const updated: User = {
    ...user,
    ...data,
    updatedAt: Date.now(),
  };

  await redis.set(`user:${id}`, updated);
  return updated;
}

export async function getUserByProvider(provider: string, email: string): Promise<User | null> {
  const userId = await redis.get<string>(`user:provider:${provider}:${email.toLowerCase()}`);
  if (!userId) return null;
  return getUserById(userId);
}

export async function linkProviderToUser(userId: string, provider: string, email: string): Promise<void> {
  await redis.set(`user:provider:${provider}:${email.toLowerCase()}`, userId);
}

// ============================================
// SELLER OPERATIONS
// ============================================

export async function createSeller(data: {
  userId: string;
  businessName: string;
  businessEmail: string;
  businessPhone?: string;
  description?: string;
  subdomain: string;
  customDomain?: string;
}): Promise<Seller> {
  const id = `seller_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const now = Date.now();

  const seller: Seller = {
    id,
    userId: data.userId,
    businessName: data.businessName,
    businessEmail: data.businessEmail,
    businessPhone: data.businessPhone || null,
    description: data.description || null,
    logo: null,
    banner: null,
    subdomain: data.subdomain.toLowerCase(),
    customDomain: data.customDomain || null,
    verified: false,
    status: 'pending',
    rating: 0,
    totalSales: 0,
    createdAt: now,
    updatedAt: now,
  };

  // Store seller
  await redis.set(`seller:${id}`, seller);
  await redis.set(`seller:user:${data.userId}`, id);
  await redis.set(`seller:subdomain:${data.subdomain.toLowerCase()}`, id);
  
  if (data.customDomain) {
    await redis.set(`seller:domain:${data.customDomain.toLowerCase()}`, id);
  }

  // Update user role
  await updateUser(data.userId, { role: UserRole.SELLER });

  // Create default settings
  const settings: SellerSettings = {
    sellerId: id,
    currency: 'USD',
    shippingZones: [],
    returnPolicy: null,
    paymentMethods: ['card'],
    autoApproveOrders: false,
  };
  await redis.set(`seller:settings:${id}`, settings);

  return seller;
}

export async function getSellerById(id: string): Promise<Seller | null> {
  return redis.get<Seller>(`seller:${id}`);
}

export async function getSellerByUserId(userId: string): Promise<Seller | null> {
  const sellerId = await redis.get<string>(`seller:user:${userId}`);
  if (!sellerId) return null;
  return getSellerById(sellerId);
}

export async function getSellerBySubdomain(subdomain: string): Promise<Seller | null> {
  const sellerId = await redis.get<string>(`seller:subdomain:${subdomain.toLowerCase()}`);
  if (!sellerId) return null;
  return getSellerById(sellerId);
}

export async function getSellerByCustomDomain(domain: string): Promise<Seller | null> {
  const sellerId = await redis.get<string>(`seller:domain:${domain.toLowerCase()}`);
  if (!sellerId) return null;
  return getSellerById(sellerId);
}

export async function updateSeller(id: string, data: Partial<Seller>): Promise<Seller | null> {
  const seller = await getSellerById(id);
  if (!seller) return null;

  const updated: Seller = {
    ...seller,
    ...data,
    updatedAt: Date.now(),
  };

  await redis.set(`seller:${id}`, updated);
  return updated;
}

export async function getAllSellers(): Promise<Seller[]> {
  const keys = await redis.keys('seller:seller_*');
  if (!keys.length) return [];

  const sellers = await redis.mget<Seller>(...keys);
  return sellers.filter((s): s is Seller => s !== null);
}

export async function getPendingSellers(): Promise<Seller[]> {
  const sellers = await getAllSellers();
  return sellers.filter(s => s.status === 'pending');
}

export async function approveSeller(id: string): Promise<Seller | null> {
  return updateSeller(id, { status: 'approved', verified: true });
}

// ============================================
// ADMIN OPERATIONS
// ============================================

export async function getAllUsers(): Promise<User[]> {
  const keys = await redis.keys('user:user_*');
  if (!keys.length) return [];

  const users = await redis.mget<User>(...keys);
  return users.filter((u): u is User => u !== null);
}

export async function setUserRole(userId: string, role: UserRole): Promise<User | null> {
  return updateUser(userId, { role });
}

// ============================================
// SUBDOMAIN OPERATIONS (Updated for sellers)
// ============================================

export async function isSubdomainAvailable(subdomain: string): Promise<boolean> {
  const sanitized = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '');
  
  // Check if it's a reserved subdomain
  const { isReservedSubdomain } = await import('./auth-config');
  if (isReservedSubdomain(sanitized)) return false;

  // Check if already taken by a seller
  const existingSeller = await redis.get(`seller:subdomain:${sanitized}`);
  if (existingSeller) return false;

  // Check legacy subdomain system
  const existingSubdomain = await redis.get(`subdomain:${sanitized}`);
  if (existingSubdomain) return false;

  return true;
}
