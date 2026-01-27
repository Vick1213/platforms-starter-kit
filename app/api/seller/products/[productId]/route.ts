import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getSellerByUserId } from '@/lib/db';
import { deleteFiles } from '@/lib/cloudinary';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { productId } = await params;
    const seller = await getSellerByUserId(session.user.id);
    
    if (!seller) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 });
    }

    const company = await prisma.company.findUnique({
      where: { sellerId: seller.id },
    });

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const product = await prisma.product.findFirst({
      where: { 
        id: productId,
        companyId: company.id 
      },
      include: {
        images: { orderBy: { position: 'asc' } },
        videos: true,
        specifications: true,
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { productId } = await params;
    const seller = await getSellerByUserId(session.user.id);
    
    if (!seller) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 });
    }

    const company = await prisma.company.findUnique({
      where: { sellerId: seller.id },
    });

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Verify product belongs to this seller's company
    const existingProduct = await prisma.product.findFirst({
      where: { 
        id: productId,
        companyId: company.id 
      },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      name,
      description,
      price,
      compareAtPrice,
      sku,
      quantity,
      tags,
      moq,
      leadTime,
      status,
    } = body;

    const product = await prisma.product.update({
      where: { id: productId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { minPrice: price }),
        ...(compareAtPrice !== undefined && { maxPrice: compareAtPrice }),
        ...(sku !== undefined && { modelNumber: sku }),
        ...(quantity !== undefined && { stockQuantity: quantity, inStock: quantity > 0 }),
        ...(tags && { tags }),
        ...(moq !== undefined && { moq }),
        ...(leadTime !== undefined && { leadTime: leadTime ? `${leadTime} days` : null }),
        ...(status && { status: status.toUpperCase() }),
      },
      include: {
        images: true,
        videos: true,
      },
    });

    return NextResponse.json({ product });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { productId } = await params;
    const seller = await getSellerByUserId(session.user.id);
    
    if (!seller) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 });
    }

    const company = await prisma.company.findUnique({
      where: { sellerId: seller.id },
    });

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Verify product belongs to this seller's company and get images/videos
    const product = await prisma.product.findFirst({
      where: { 
        id: productId,
        companyId: company.id 
      },
      include: {
        images: true,
        videos: true,
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Collect Cloudinary public IDs to delete
    const publicIds: string[] = [];
    
    // Extract public IDs from Cloudinary URLs
    product.images.forEach((img: { url: string }) => {
      const match = img.url.match(/\/v\d+\/(.+)\.\w+$/);
      if (match) publicIds.push(match[1]);
    });
    
    product.videos.forEach((vid: { url: string }) => {
      const match = vid.url.match(/\/v\d+\/(.+)\.\w+$/);
      if (match) publicIds.push(match[1]);
    });

    // Delete from Cloudinary (fire and forget)
    if (publicIds.length > 0) {
      deleteFiles(publicIds).catch(err => 
        console.error('Failed to delete Cloudinary files:', err)
      );
    }

    // Delete product (cascade will handle images/videos)
    await prisma.product.delete({
      where: { id: productId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}
