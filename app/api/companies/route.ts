import { NextResponse } from 'next/server';
import { searchCompanies, getCompanyById, getCompanyByDomain } from '@/lib/product-db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Single company lookup by ID or domain
    const id = searchParams.get('id');
    const domain = searchParams.get('domain');
    
    if (id) {
      const company = await getCompanyById(id);
      if (!company) {
        return NextResponse.json({ error: 'Company not found' }, { status: 404 });
      }
      return NextResponse.json(company);
    }
    
    if (domain) {
      const company = await getCompanyByDomain(domain);
      if (!company) {
        return NextResponse.json({ error: 'Company not found' }, { status: 404 });
      }
      return NextResponse.json(company);
    }

    // Search companies
    const params = {
      query: searchParams.get('q') || undefined,
      businessType: searchParams.get('businessType') || undefined,
      country: searchParams.get('country') || undefined,
      city: searchParams.get('city') || undefined,
      linkedOnly: searchParams.get('linkedOnly') === 'true',
      page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
      limit: searchParams.get('limit') ? Math.min(Number(searchParams.get('limit')), 100) : 20,
    };

    const result = await searchCompanies(params);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Company search error:', error);
    return NextResponse.json(
      { error: 'Failed to search companies' },
      { status: 500 }
    );
  }
}
