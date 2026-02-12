/**
 * Database Layer with PostgreSQL (source of truth) + Redis (cache)
 * 
 * Pattern: Cache-aside
 * - Reads: Check Redis cache first, fallback to PostgreSQL, then populate cache
 * - Writes: Write to PostgreSQL first, then invalidate/update Redis cache
 */

import { PrismaClient, UserRole as PrismaUserRole } from '@prisma/client';
import { redis } from './redis';
import { UserRole } from './auth-config';
import { hashSync, compareSync } from 'bcryptjs';

// ============================================
// PRISMA CLIENT (Singleton)
// ============================================

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// ============================================
// CACHE CONFIGURATION
// ============================================

const CACHE_TTL = {
  USER: 3600,           // 1 hour
  USER_AUTH: 1800,      // 30 minutes (auth lookups)
  SELLER: 3600,         // 1 hour
  SUBDOMAIN: 86400,     // 24 hours
  SEARCH: 300,          // 5 minutes
};

// Cache key builders
const cacheKeys = {
  user: (id: string) => `cache:user:${id}`,
  userByEmail: (email: string) => `cache:user:email:${email.toLowerCase()}`,
  userAuth: (email: string) => `cache:auth:${email.toLowerCase()}`,
  seller: (id: string) => `cache:seller:${id}`,
  sellerByUser: (userId: string) => `cache:seller:user:${userId}`,
  sellerBySubdomain: (subdomain: string) => `cache:subdomain:${subdomain.toLowerCase()}`,
  sellerByDomain: (domain: string) => `cache:domain:${domain.toLowerCase()}`,
  storeCustomization: (sellerId: string) => `store:custom:${sellerId}`,
};

// ============================================
// TYPE MAPPINGS
// ============================================

// Map Prisma UserRole enum to our UserRole enum
function mapPrismaRole(role: PrismaUserRole): UserRole {
  switch (role) {
    case 'ADMIN': return UserRole.ADMIN;
    case 'SELLER': return UserRole.SELLER;
    default: return UserRole.USER;
  }
}

function mapToUserRole(role: UserRole): PrismaUserRole {
  switch (role) {
    case UserRole.ADMIN: return 'ADMIN';
    case UserRole.SELLER: return 'SELLER';
    default: return 'USER';
  }
}

// Simplified user type for app use
export interface AppUser {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: UserRole;
  emailVerified: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AppSeller {
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
  status: string;
  rating: number;
  totalSales: number;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// USER OPERATIONS
// ============================================

export async function createUser(data: {
  email: string;
  name: string | null;
  password?: string;
  image?: string | null;
  role?: UserRole;
  provider?: 'CREDENTIALS' | 'GOOGLE' | 'APPLE';
}): Promise<AppUser> {
  // Write to PostgreSQL
  const user = await prisma.user.create({
    data: {
      email: data.email.toLowerCase(),
      name: data.name,
      image: data.image || null,
      role: mapToUserRole(data.role || UserRole.USER),
      // Create credentials if password provided
      credentials: data.password ? {
        create: {
          password: hashSync(data.password, 12),
        }
      } : undefined,
      // Create OAuth account if provider specified
      accounts: data.provider && data.provider !== 'CREDENTIALS' ? {
        create: {
          provider: data.provider,
        }
      } : undefined,
    },
  });

  const appUser: AppUser = {
    ...user,
    role: mapPrismaRole(user.role),
  };

  // Cache the user
  await redis.set(cacheKeys.user(user.id), appUser, { ex: CACHE_TTL.USER });
  await redis.set(cacheKeys.userByEmail(user.email), user.id, { ex: CACHE_TTL.USER });

  return appUser;
}

export async function getUserById(id: string): Promise<AppUser | null> {
  // Check cache first
  const cached = await redis.get<AppUser>(cacheKeys.user(id));
  if (cached) return cached;

  // Fetch from PostgreSQL
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return null;

  const appUser: AppUser = {
    ...user,
    role: mapPrismaRole(user.role),
  };

  // Populate cache
  await redis.set(cacheKeys.user(id), appUser, { ex: CACHE_TTL.USER });
  
  return appUser;
}

export async function getUserByEmail(email: string): Promise<AppUser | null> {
  const normalizedEmail = email.toLowerCase();
  
  // Check cache for user ID
  const cachedId = await redis.get<string>(cacheKeys.userByEmail(normalizedEmail));
  if (cachedId) {
    return getUserById(cachedId);
  }

  // Fetch from PostgreSQL
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user) return null;

  const appUser: AppUser = {
    ...user,
    role: mapPrismaRole(user.role),
  };

  // Populate cache
  await redis.set(cacheKeys.user(user.id), appUser, { ex: CACHE_TTL.USER });
  await redis.set(cacheKeys.userByEmail(normalizedEmail), user.id, { ex: CACHE_TTL.USER });
  
  return appUser;
}

export async function verifyUserPassword(email: string, password: string): Promise<AppUser | null> {
  const normalizedEmail = email.toLowerCase();
  
  // Fetch user with credentials from PostgreSQL (always fresh for auth)
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    include: { credentials: true },
  });
  
  if (!user || !user.credentials) return null;

  const isValid = compareSync(password, user.credentials.password);
  if (!isValid) return null;

  return {
    ...user,
    role: mapPrismaRole(user.role),
  };
}

export async function updateUser(id: string, data: Partial<{
  name: string | null;
  image: string | null;
  role: UserRole;
  emailVerified: Date | null;
}>): Promise<AppUser | null> {
  const updateData: any = { ...data };
  if (data.role) {
    updateData.role = mapToUserRole(data.role);
  }

  const user = await prisma.user.update({
    where: { id },
    data: updateData,
  });

  const appUser: AppUser = {
    ...user,
    role: mapPrismaRole(user.role),
  };

  // Invalidate and update cache
  await redis.set(cacheKeys.user(id), appUser, { ex: CACHE_TTL.USER });
  
  return appUser;
}

export async function getUserByProvider(provider: string, email: string): Promise<AppUser | null> {
  const normalizedEmail = email.toLowerCase();
  
  // Map string provider to enum
  const providerEnum = provider.toUpperCase() as 'GOOGLE' | 'APPLE' | 'CREDENTIALS';
  
  const account = await prisma.userAccount.findFirst({
    where: {
      provider: providerEnum,
      user: { email: normalizedEmail },
    },
    include: { user: true },
  });

  if (!account) return null;

  return {
    ...account.user,
    role: mapPrismaRole(account.user.role),
  };
}

export async function linkProviderToUser(userId: string, provider: string, email: string): Promise<void> {
  const providerEnum = provider.toUpperCase() as 'GOOGLE' | 'APPLE' | 'CREDENTIALS';
  
  await prisma.userAccount.upsert({
    where: {
      provider_userId: {
        provider: providerEnum,
        userId,
      },
    },
    update: {},
    create: {
      userId,
      provider: providerEnum,
    },
  });
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
  // Company fields
  businessType?: string;
  yearEstablished?: number;
  employeeCount?: string;
  annualRevenue?: string;
  registrationNumber?: string;
  website?: string;
  country?: string;
  state?: string;
  city?: string;
  address?: string;
  postalCode?: string;
  factoryAddress?: string;
  factorySize?: string;
  nearestPort?: string;
  mainMarkets?: string[];
  certifications?: string[];
  mainProducts?: string;
}): Promise<AppSeller> {
  const seller = await prisma.seller.create({
    data: {
      userId: data.userId,
      businessName: data.businessName,
      businessEmail: data.businessEmail,
      businessPhone: data.businessPhone || null,
      description: data.description || null,
      subdomain: data.subdomain.toLowerCase(),
      customDomain: data.customDomain?.toLowerCase() || null,
    },
  });

  // Create linked Company profile
  const companySlug = data.subdomain.toLowerCase();
  try {
    await prisma.company.create({
      data: {
        name: data.businessName,
        slug: companySlug,
        description: data.description || null,
        shortDescription: data.mainProducts || null,
        businessType: (data.businessType as any) || 'MANUFACTURER',
        yearEstablished: data.yearEstablished || null,
        employeeCount: data.employeeCount || null,
        annualRevenue: data.annualRevenue || null,
        registrationNumber: data.registrationNumber || null,
        website: data.website || null,
        email: data.businessEmail,
        phone: data.businessPhone || null,
        address: data.address || null,
        city: data.city || null,
        state: data.state || null,
        country: data.country || null,
        postalCode: data.postalCode || null,
        factoryAddress: data.factoryAddress || null,
        factorySize: data.factorySize || null,
        nearestPort: data.nearestPort || null,
        mainMarkets: data.mainMarkets || [],
        sellerId: seller.id,
        memberSince: new Date(),
        certifications: data.certifications && data.certifications.length > 0 && data.certifications[0] !== 'None'
          ? {
              create: data.certifications.map(cert => ({
                name: cert,
                type: 'INDUSTRY',
              })),
            }
          : undefined,
      },
    });
  } catch (companyError) {
    console.error('Failed to create company profile:', companyError);
    // Seller was still created — company can be added later
  }

  // Update user role to SELLER
  await prisma.user.update({
    where: { id: data.userId },
    data: { role: 'SELLER' },
  });

  // Invalidate user cache (role changed)
  await redis.del(cacheKeys.user(data.userId));

  const appSeller: AppSeller = {
    ...seller,
    verified: seller.verified,
  };

  // Cache seller data
  await redis.set(cacheKeys.seller(seller.id), appSeller, { ex: CACHE_TTL.SELLER });
  await redis.set(cacheKeys.sellerByUser(data.userId), seller.id, { ex: CACHE_TTL.SELLER });
  await redis.set(cacheKeys.sellerBySubdomain(data.subdomain), seller.id, { ex: CACHE_TTL.SUBDOMAIN });
  
  if (data.customDomain) {
    await redis.set(cacheKeys.sellerByDomain(data.customDomain), seller.id, { ex: CACHE_TTL.SUBDOMAIN });
  }

  return appSeller;
}

export async function getSellerById(id: string): Promise<AppSeller | null> {
  // Check cache
  const cached = await redis.get<AppSeller>(cacheKeys.seller(id));
  if (cached) return cached;

  // Fetch from PostgreSQL
  const seller = await prisma.seller.findUnique({ where: { id } });
  if (!seller) return null;

  const appSeller: AppSeller = { ...seller };

  // Populate cache
  await redis.set(cacheKeys.seller(id), appSeller, { ex: CACHE_TTL.SELLER });
  
  return appSeller;
}

export async function getSellerByUserId(userId: string): Promise<AppSeller | null> {
  // Check cache for seller ID
  const cachedId = await redis.get<string>(cacheKeys.sellerByUser(userId));
  if (cachedId) {
    return getSellerById(cachedId);
  }

  // Fetch from PostgreSQL
  const seller = await prisma.seller.findUnique({ where: { userId } });
  if (!seller) return null;

  const appSeller: AppSeller = { ...seller };

  // Populate cache
  await redis.set(cacheKeys.seller(seller.id), appSeller, { ex: CACHE_TTL.SELLER });
  await redis.set(cacheKeys.sellerByUser(userId), seller.id, { ex: CACHE_TTL.SELLER });
  
  return appSeller;
}

export async function getSellerBySubdomain(subdomain: string): Promise<AppSeller | null> {
  const normalizedSubdomain = subdomain.toLowerCase();
  
  // Check cache for seller ID
  const cachedId = await redis.get<string>(cacheKeys.sellerBySubdomain(normalizedSubdomain));
  if (cachedId) {
    return getSellerById(cachedId);
  }

  // Fetch from PostgreSQL
  const seller = await prisma.seller.findUnique({ where: { subdomain: normalizedSubdomain } });
  if (!seller) return null;

  const appSeller: AppSeller = { ...seller };

  // Populate cache
  await redis.set(cacheKeys.seller(seller.id), appSeller, { ex: CACHE_TTL.SELLER });
  await redis.set(cacheKeys.sellerBySubdomain(normalizedSubdomain), seller.id, { ex: CACHE_TTL.SUBDOMAIN });
  
  return appSeller;
}

export async function getSellerByCustomDomain(domain: string): Promise<AppSeller | null> {
  const normalizedDomain = domain.toLowerCase();
  
  // Check cache
  const cachedId = await redis.get<string>(cacheKeys.sellerByDomain(normalizedDomain));
  if (cachedId) {
    return getSellerById(cachedId);
  }

  // Fetch from PostgreSQL
  const seller = await prisma.seller.findFirst({ 
    where: { customDomain: normalizedDomain } 
  });
  if (!seller) return null;

  const appSeller: AppSeller = { ...seller };

  // Populate cache
  await redis.set(cacheKeys.seller(seller.id), appSeller, { ex: CACHE_TTL.SELLER });
  await redis.set(cacheKeys.sellerByDomain(normalizedDomain), seller.id, { ex: CACHE_TTL.SUBDOMAIN });
  
  return appSeller;
}

export async function updateSeller(id: string, data: Partial<AppSeller>): Promise<AppSeller | null> {
  // Remove fields that shouldn't be updated directly
  const { id: _, odId, createdAt, updatedAt, ...updateData } = data as any;

  const seller = await prisma.seller.update({
    where: { id },
    data: updateData,
  });

  const appSeller: AppSeller = { ...seller };

  // Invalidate and update all related caches
  await redis.set(cacheKeys.seller(id), appSeller, { ex: CACHE_TTL.SELLER });
  
  // Also update/invalidate user lookup cache
  if (seller.userId) {
    await redis.set(cacheKeys.sellerByUser(seller.userId), id, { ex: CACHE_TTL.SELLER });
  }
  
  // Invalidate subdomain cache to force refresh with new data
  if (seller.subdomain) {
    await redis.del(cacheKeys.sellerBySubdomain(seller.subdomain));
  }
  
  // Invalidate custom domain cache if exists
  if (seller.customDomain) {
    await redis.del(cacheKeys.sellerByDomain(seller.customDomain));
  }
  
  return appSeller;
}

export async function getAllSellers(): Promise<AppSeller[]> {
  const sellers = await prisma.seller.findMany({
    orderBy: { createdAt: 'desc' },
  });
  
  return sellers.map((seller) => ({ ...seller }));
}

export async function getPendingSellers(): Promise<AppSeller[]> {
  const sellers = await prisma.seller.findMany({
    where: { status: 'pending' },
    orderBy: { createdAt: 'desc' },
  });
  
  return sellers.map((seller) => ({ ...seller }));
}

export async function approveSeller(id: string): Promise<AppSeller | null> {
  return updateSeller(id, { status: 'approved', verified: true });
}

// ============================================
// STORE CUSTOMIZATION (Redis-only - high read, low write)
// ============================================

export interface StoreCustomization {
  primaryColor: string;
  accentColor: string;
  headerStyle: 'minimal' | 'standard' | 'bold';
  showBanner: boolean;
  bannerText: string;
  logo: string;
  favicon: string;
  colorPlacement: 'header' | 'footer' | 'background' | 'buttons';
  bio: string;
  socialLinks: {
    website: string;
    facebook: string;
    instagram: string;
    linkedin: string;
    whatsapp: string;
  };
  contactInfo: {
    email: string;
    phone: string;
    address: string;
  };
  aboutUs: string;
  contacts: {
    telegram?: string;
    twitter?: string;
    tiktok?: string;
    [key: string]: string | undefined;
  };
  policies: {
    shipping: string;
    returns: string;
    privacy: string;
  };
}

export async function getStoreCustomization(sellerId: string): Promise<StoreCustomization | null> {
  return redis.get<StoreCustomization>(cacheKeys.storeCustomization(sellerId));
}

export async function setStoreCustomization(sellerId: string, data: StoreCustomization): Promise<void> {
  await redis.set(cacheKeys.storeCustomization(sellerId), data);
}

// ============================================
// ADMIN OPERATIONS
// ============================================

export async function getAllUsers(): Promise<AppUser[]> {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
  });
  
  return users.map((user) => ({
    ...user,
    role: mapPrismaRole(user.role),
  }));
}

export async function setUserRole(userId: string, role: UserRole): Promise<AppUser | null> {
  return updateUser(userId, { role });
}

// ============================================
// SUBDOMAIN OPERATIONS
// ============================================

export async function isSubdomainAvailable(subdomain: string): Promise<boolean> {
  const sanitized = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '');
  
  // Check if it's a reserved subdomain
  const { isReservedSubdomain } = await import('./auth-config');
  if (isReservedSubdomain(sanitized)) return false;

  // Check if already taken by a seller (check DB directly for accuracy)
  const existingSeller = await prisma.seller.findUnique({
    where: { subdomain: sanitized },
    select: { id: true },
  });
  
  return !existingSeller;
}

// ============================================
// CACHE MANAGEMENT
// ============================================

export async function invalidateUserCache(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user) {
    await redis.del(cacheKeys.user(userId));
    await redis.del(cacheKeys.userByEmail(user.email));
  }
}

export async function invalidateSellerCache(sellerId: string): Promise<void> {
  const seller = await prisma.seller.findUnique({ where: { id: sellerId } });
  if (seller) {
    await redis.del(cacheKeys.seller(sellerId));
    await redis.del(cacheKeys.sellerByUser(seller.userId));
    await redis.del(cacheKeys.sellerBySubdomain(seller.subdomain));
    if (seller.customDomain) {
      await redis.del(cacheKeys.sellerByDomain(seller.customDomain));
    }
  }
}

// ============================================
// PRODUCT FUNCTIONS
// ============================================

export async function getProductsBySellerId(sellerId: string) {
  try {
    // First find the company for this seller
    const company = await prisma.company.findUnique({
      where: { sellerId },
    });

    if (!company) {
      return [];
    }

    // Then get all products for this company
    const products = await prisma.product.findMany({
      where: { companyId: company.id },
      include: {
        company: {
          select: {
            name: true,
            slug: true,
          }
        },
        images: {
          orderBy: { position: 'asc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return products;
  } catch (error) {
    console.error('Error fetching products by seller:', error);
    return [];
  }
}

export async function getProductCountBySellerId(sellerId: string): Promise<number> {
  try {
    // First find the company for this seller
    const company = await prisma.company.findUnique({
      where: { sellerId },
    });

    if (!company) {
      return 0;
    }

    // Count products for this company
    const count = await prisma.product.count({
      where: { companyId: company.id },
    });

    return count;
  } catch (error) {
    console.error('Error counting products by seller:', error);
    return 0;
  }
}

export async function getActiveProductsBySellerId(sellerId: string) {
  try {
    // First find the company for this seller
    const company = await prisma.company.findUnique({
      where: { sellerId },
    });

    if (!company) {
      return [];
    }

    // Get only active/published products
    const products = await prisma.product.findMany({
      where: { 
        companyId: company.id,
        status: 'ACTIVE',
      },
      include: {
        company: {
          select: {
            name: true,
            slug: true,
          }
        },
        images: {
          orderBy: { position: 'asc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return products;
  } catch (error) {
    console.error('Error fetching active products by seller:', error);
    return [];
  }
}

// ============================================
// SEARCH CACHING
// ============================================

export async function cacheSearchResults(query: string, results: any[], type: 'products' | 'companies'): Promise<void> {
  const key = `cache:search:${type}:${Buffer.from(query).toString('base64')}`;
  await redis.set(key, results, { ex: CACHE_TTL.SEARCH });
}

export async function getCachedSearchResults(query: string, type: 'products' | 'companies'): Promise<any[] | null> {
  const key = `cache:search:${type}:${Buffer.from(query).toString('base64')}`;
  return redis.get<any[]>(key);
}

// ============================================
// CATEGORY FUNCTIONS
// ============================================

export async function getAllCategories() {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { position: 'asc' },
      include: {
        _count: {
          select: { products: true },
        },
        children: {
          where: { isActive: true },
          orderBy: { position: 'asc' },
        },
      },
    });
    return categories;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

export async function getCategoryBySlug(slug: string) {
  try {
    const category = await prisma.category.findUnique({
      where: { slug },
      include: {
        children: {
          where: { isActive: true },
          orderBy: { position: 'asc' },
          include: {
            _count: { select: { products: true } },
          },
        },
        parent: true,
        _count: { select: { products: true } },
      },
    });
    return category;
  } catch (error) {
    console.error('Error fetching category by slug:', error);
    return null;
  }
}

export async function getProductsByCategory(categorySlug: string, options?: {
  page?: number;
  limit?: number;
  sortBy?: 'newest' | 'price-low' | 'price-high' | 'popular';
}) {
  const page = options?.page ?? 1;
  const limit = options?.limit ?? 20;
  const skip = (page - 1) * limit;

  try {
    const category = await prisma.category.findUnique({
      where: { slug: categorySlug },
      select: { id: true },
    });

    if (!category) return { products: [], total: 0 };

    // Build sort order
    let orderBy: Record<string, string> = { createdAt: 'desc' };
    switch (options?.sortBy) {
      case 'price-low': orderBy = { minPrice: 'asc' }; break;
      case 'price-high': orderBy = { minPrice: 'desc' }; break;
      case 'popular': orderBy = { viewCount: 'desc' }; break;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: {
          categoryId: category.id,
          status: 'ACTIVE',
        },
        include: {
          company: {
            select: {
              name: true,
              slug: true,
              country: true,
              verificationStatus: true,
              seller: {
                select: {
                  subdomain: true,
                },
              },
            },
          },
          images: {
            orderBy: { position: 'asc' },
            take: 1,
          },
          category: {
            select: { name: true, slug: true },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.product.count({
        where: {
          categoryId: category.id,
          status: 'ACTIVE',
        },
      }),
    ]);

    return { products, total };
  } catch (error) {
    console.error('Error fetching products by category:', error);
    return { products: [], total: 0 };
  }
}

export async function getCompaniesByCategory(categorySlug: string) {
  try {
    const category = await prisma.category.findUnique({
      where: { slug: categorySlug },
      select: { id: true },
    });

    if (!category) return [];

    const companies = await prisma.company.findMany({
      where: {
        isActive: true,
        products: {
          some: {
            categoryId: category.id,
            status: 'ACTIVE',
          },
        },
      },
      include: {
        _count: {
          select: { products: true },
        },
        seller: {
          select: { subdomain: true },
        },
      },
      orderBy: { overallRating: 'desc' },
      take: 50,
    });

    return companies;
  } catch (error) {
    console.error('Error fetching companies by category:', error);
    return [];
  }
}

export async function getTopLevelCategories() {
  try {
    const categories = await prisma.category.findMany({
      where: {
        isActive: true,
        parentId: null,
      },
      orderBy: { position: 'asc' },
      include: {
        _count: { select: { products: true } },
        children: {
          where: { isActive: true },
          orderBy: { position: 'asc' },
          select: { id: true, name: true, slug: true, productCount: true },
        },
      },
    });
    return categories;
  } catch (error) {
    console.error('Error fetching top-level categories:', error);
    return [];
  }
}
