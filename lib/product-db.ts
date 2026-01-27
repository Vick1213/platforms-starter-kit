import prisma from './prisma';
import type { Prisma } from '@prisma/client';

// ============================================
// PRODUCT SEARCH
// ============================================

export interface ProductSearchParams {
  query?: string;
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  companyId?: string;
  country?: string;
  city?: string;
  page?: number;
  limit?: number;
  sortBy?: 'price' | 'name' | 'scrapedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface ProductSearchResult {
  products: Awaited<ReturnType<typeof prisma.product.findMany>>;
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

export async function searchProducts(params: ProductSearchParams): Promise<ProductSearchResult> {
  const {
    query,
    category,
    brand,
    minPrice,
    maxPrice,
    inStock,
    companyId,
    country,
    city,
    page = 1,
    limit = 20,
    sortBy = 'scrapedAt',
    sortOrder = 'desc',
  } = params;

  const where: Prisma.ProductWhereInput = {};

  // Text search on name and description
  if (query) {
    where.OR = [
      { name: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } },
      { brand: { contains: query, mode: 'insensitive' } },
      { tags: { has: query.toLowerCase() } },
    ];
  }

  // Filters
  if (category) {
    where.category = { equals: category, mode: 'insensitive' };
  }
  if (brand) {
    where.brand = { equals: brand, mode: 'insensitive' };
  }
  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {};
    if (minPrice !== undefined) where.price.gte = minPrice;
    if (maxPrice !== undefined) where.price.lte = maxPrice;
  }
  if (inStock !== undefined) {
    where.inStock = inStock;
  }
  if (companyId) {
    where.companyId = companyId;
  }

  // Filter by company location
  if (country || city) {
    where.company = {
      ...(country && { country: { equals: country, mode: 'insensitive' } }),
      ...(city && { city: { equals: city, mode: 'insensitive' } }),
    };
  }

  const skip = (page - 1) * limit;

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        company: {
          select: {
            id: true,
            name: true,
            logo: true,
            domain: true,
            verified: true,
            sellerId: true,
            seller: {
              select: {
                id: true,
                subdomain: true,
                verified: true,
                rating: true,
              },
            },
          },
        },
        location: {
          select: {
            city: true,
            country: true,
          },
        },
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  // Log search query for analytics
  if (query) {
    await prisma.searchQuery.create({
      data: {
        query,
        resultsCount: total,
      },
    }).catch(() => {}); // Don't fail if logging fails
  }

  return {
    products,
    total,
    page,
    totalPages,
    hasMore: page < totalPages,
  };
}

// ============================================
// COMPANY SEARCH & LINKING
// ============================================

export interface CompanySearchParams {
  query?: string;
  industry?: string;
  country?: string;
  city?: string;
  linkedOnly?: boolean; // Only show companies linked to registered sellers
  page?: number;
  limit?: number;
}

export async function searchCompanies(params: CompanySearchParams) {
  const {
    query,
    industry,
    country,
    city,
    linkedOnly = false,
    page = 1,
    limit = 20,
  } = params;

  const where: Prisma.CompanyWhereInput = {};

  if (query) {
    where.OR = [
      { name: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } },
      { domain: { contains: query, mode: 'insensitive' } },
    ];
  }
  if (industry) {
    where.industry = { equals: industry, mode: 'insensitive' };
  }
  if (country) {
    where.country = { equals: country, mode: 'insensitive' };
  }
  if (city) {
    where.city = { equals: city, mode: 'insensitive' };
  }
  if (linkedOnly) {
    where.sellerId = { not: null };
  }

  const skip = (page - 1) * limit;

  const [companies, total] = await Promise.all([
    prisma.company.findMany({
      where,
      include: {
        seller: {
          select: {
            id: true,
            subdomain: true,
            verified: true,
            status: true,
            rating: true,
          },
        },
        _count: {
          select: {
            products: true,
            locations: true,
          },
        },
      },
      orderBy: { name: 'asc' },
      skip,
      take: limit,
    }),
    prisma.company.count({ where }),
  ]);

  return {
    companies,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

// Link a company to a registered seller by domain or name match
export async function linkCompanyToSeller(sellerId: string, domain?: string, businessName?: string) {
  if (!domain && !businessName) return null;

  // Try to find a matching company
  const company = await prisma.company.findFirst({
    where: {
      OR: [
        ...(domain ? [{ domain: { equals: domain, mode: 'insensitive' as const } }] : []),
        ...(businessName ? [{ name: { equals: businessName, mode: 'insensitive' as const } }] : []),
      ],
      sellerId: null, // Not already linked
    },
  });

  if (company) {
    // Link the company to the seller
    await prisma.company.update({
      where: { id: company.id },
      data: { sellerId },
    });
    return company;
  }

  return null;
}

// ============================================
// LOCATION SEARCH
// ============================================

export async function searchLocations(params: {
  companyId?: string;
  country?: string;
  city?: string;
  type?: string;
  page?: number;
  limit?: number;
}) {
  const { companyId, country, city, type, page = 1, limit = 20 } = params;

  const where: Prisma.LocationWhereInput = {};

  if (companyId) where.companyId = companyId;
  if (country) where.country = { equals: country, mode: 'insensitive' };
  if (city) where.city = { equals: city, mode: 'insensitive' };
  if (type) where.type = { equals: type, mode: 'insensitive' };

  const skip = (page - 1) * limit;

  const [locations, total] = await Promise.all([
    prisma.location.findMany({
      where,
      include: {
        company: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
        _count: {
          select: {
            products: true,
          },
        },
      },
      orderBy: { name: 'asc' },
      skip,
      take: limit,
    }),
    prisma.location.count({ where }),
  ]);

  return {
    locations,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

// ============================================
// CATEGORIES
// ============================================

export async function getCategories() {
  return prisma.category.findMany({
    where: { parentId: null },
    include: {
      children: {
        include: {
          children: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  });
}

export async function getCategoryBySlug(slug: string) {
  return prisma.category.findUnique({
    where: { slug },
    include: {
      parent: true,
      children: true,
    },
  });
}

// ============================================
// PRODUCT DETAILS
// ============================================

export async function getProductById(id: string) {
  return prisma.product.findUnique({
    where: { id },
    include: {
      company: {
        include: {
          seller: {
            select: {
              id: true,
              subdomain: true,
              businessName: true,
              verified: true,
              rating: true,
            },
          },
          locations: true,
        },
      },
      location: true,
    },
  });
}

// Get related products (same category or company)
export async function getRelatedProducts(productId: string, limit = 8) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { category: true, companyId: true },
  });

  if (!product) return [];

  return prisma.product.findMany({
    where: {
      id: { not: productId },
      OR: [
        { category: product.category },
        { companyId: product.companyId },
      ],
    },
    include: {
      company: {
        select: {
          name: true,
          logo: true,
        },
      },
    },
    take: limit,
  });
}

// ============================================
// COMPANY DETAILS
// ============================================

export async function getCompanyById(id: string) {
  return prisma.company.findUnique({
    where: { id },
    include: {
      seller: true,
      products: {
        take: 20,
        orderBy: { scrapedAt: 'desc' },
      },
      locations: true,
    },
  });
}

export async function getCompanyByDomain(domain: string) {
  return prisma.company.findUnique({
    where: { domain },
    include: {
      seller: true,
      _count: {
        select: {
          products: true,
          locations: true,
        },
      },
    },
  });
}

// ============================================
// STATS & AGGREGATIONS
// ============================================

export async function getMarketplaceStats() {
  const [
    totalProducts,
    totalCompanies,
    totalLocations,
    linkedSellers,
    categories,
    countries,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.company.count(),
    prisma.location.count(),
    prisma.company.count({ where: { sellerId: { not: null } } }),
    prisma.product.groupBy({
      by: ['category'],
      _count: true,
      where: { category: { not: null } },
      orderBy: { _count: { category: 'desc' } },
      take: 10,
    }),
    prisma.company.groupBy({
      by: ['country'],
      _count: true,
      where: { country: { not: null } },
      orderBy: { _count: { country: 'desc' } },
      take: 10,
    }),
  ]);

  return {
    totalProducts,
    totalCompanies,
    totalLocations,
    linkedSellers,
    topCategories: categories,
    topCountries: countries,
  };
}

// Get popular search terms
export async function getPopularSearches(limit = 10) {
  const searches = await prisma.searchQuery.groupBy({
    by: ['query'],
    _count: true,
    orderBy: { _count: { query: 'desc' } },
    take: limit,
  });

  return searches.map(s => ({
    query: s.query,
    count: s._count,
  }));
}
