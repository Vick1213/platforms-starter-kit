import { NextResponse } from 'next/server';
import { searchProducts, type ProductSearchParams } from '@/lib/product-db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    const params: ProductSearchParams = {
      query: searchParams.get('q') || undefined,
      category: searchParams.get('category') || undefined,
      brand: searchParams.get('brand') || undefined,
      minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
      maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
      inStock: searchParams.get('inStock') === 'true' ? true : undefined,
      companyId: searchParams.get('companyId') || undefined,
      country: searchParams.get('country') || undefined,
      city: searchParams.get('city') || undefined,
      page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
      limit: searchParams.get('limit') ? Math.min(Number(searchParams.get('limit')), 100) : 20,
      sortBy: (searchParams.get('sortBy') as 'minPrice' | 'name' | 'scrapedAt') || 'scrapedAt',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
    };

    const result = await searchProducts(params);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Product search error:', error);
    return NextResponse.json(
      { error: 'Failed to search products' },
      { status: 500 }
    );
  }
}
