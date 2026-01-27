import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getSellerByUserId } from '@/lib/db';

// Helper to get or create company for seller
async function getOrCreateCompanyForSeller(seller: { id: string; businessName: string; subdomain: string }) {
  // Check if seller already has a company linked
  let company = await prisma.company.findUnique({
    where: { sellerId: seller.id },
  });

  if (!company) {
    // Create a company for this seller
    company = await prisma.company.create({
      data: {
        sellerId: seller.id,
        name: seller.businessName,
        slug: seller.subdomain,
        businessType: 'MANUFACTURER',
      },
    });
  }

  return company;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const seller = await getSellerByUserId(session.user.id);
    
    if (!seller) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 });
    }

    // Get company for this seller
    const company = await prisma.company.findUnique({
      where: { sellerId: seller.id },
    });

    if (!company) {
      return NextResponse.json({ products: [] });
    }

    const products = await prisma.product.findMany({
      where: { companyId: company.id },
      include: {
        images: {
          orderBy: { position: 'asc' },
        },
        videos: true,
      },
      orderBy: { scrapedAt: 'desc' },
    });

    // Transform to simpler format for frontend
    const formattedProducts = products.map((p: typeof products[number]) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.minPrice || 0,
      compareAtPrice: p.maxPrice,
      sku: p.modelNumber,
      quantity: p.stockQuantity || 0,
      category: p.categoryId,
      status: p.status.toLowerCase(),
      images: p.images.map((img: typeof p.images[number]) => ({ url: img.url, position: img.position })),
      createdAt: p.scrapedAt.toISOString(),
    }));

    return NextResponse.json({ products: formattedProducts });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const seller = await getSellerByUserId(session.user.id);
    
    if (!seller) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 });
    }

    // Get or create company for seller
    const company = await getOrCreateCompanyForSeller(seller);

    const body = await request.json();
    const {
      name,
      description,
      price,
      compareAtPrice,
      sku,
      quantity,
      category,
      tags,
      moq,
      leadTime,
      images,
      video,
    } = body;

    if (!name || price === undefined) {
      return NextResponse.json(
        { error: 'Name and price are required' },
        { status: 400 }
      );
    }

    // Generate slug from name
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    
    // Check for existing slug and make unique
    const existingWithSlug = await prisma.product.findFirst({
      where: { 
        companyId: company.id,
        slug: { startsWith: baseSlug }
      }
    });
    const slug = existingWithSlug 
      ? `${baseSlug}-${Date.now().toString(36)}`
      : baseSlug;

    // Create product with images and video
    const product = await prisma.product.create({
      data: {
        companyId: company.id,
        name,
        slug,
        description,
        minPrice: price,
        maxPrice: compareAtPrice,
        modelNumber: sku,
        stockQuantity: quantity || 0,
        tags: tags || [],
        moq: moq || 1,
        leadTime: leadTime ? `${leadTime} days` : null,
        status: 'ACTIVE',
        inStock: quantity > 0,
        images: {
          create: images?.map((img: { url: string; publicId?: string; position: number }) => ({
            url: img.url,
            altText: name,
            position: img.position,
            isPrimary: img.position === 0,
          })) || [],
        },
        videos: video ? {
          create: {
            url: video.url,
            thumbnail: video.thumbnail,
            title: name,
          },
        } : undefined,
      },
      include: {
        images: true,
        videos: true,
      },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}
