import { NextResponse } from 'next/server';
import { getMarketplaceStats, getPopularSearches, getCategories } from '@/lib/product-db';

export async function GET() {
  try {
    const [stats, popularSearches, categories] = await Promise.all([
      getMarketplaceStats(),
      getPopularSearches(),
      getCategories(),
    ]);

    return NextResponse.json({
      stats,
      popularSearches,
      categories,
    });
  } catch (error) {
    console.error('Marketplace stats error:', error);
    return NextResponse.json(
      { error: 'Failed to get marketplace stats' },
      { status: 500 }
    );
  }
}
