import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { linkCompanyToSeller } from '@/lib/product-db';

// Secret key for scraper API authentication
const SCRAPER_API_KEY = process.env.SCRAPER_API_KEY || 'scraper-secret-key-2026';

function validateApiKey(request: Request): boolean {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return false;
  const key = authHeader.replace('Bearer ', '');
  return key === SCRAPER_API_KEY;
}

// POST /api/scraper/companies - Bulk insert companies
export async function POST(request: Request) {
  if (!validateApiKey(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { companies } = body;

    if (!Array.isArray(companies)) {
      return NextResponse.json(
        { error: 'companies must be an array' },
        { status: 400 }
      );
    }

    const results = {
      created: 0,
      updated: 0,
      linked: 0,
      errors: [] as string[],
    };

    for (const company of companies) {
      try {
        // Upsert company by domain or create new
        const existingCompany = company.domain
          ? await prisma.company.findUnique({ where: { domain: company.domain } })
          : null;

        if (existingCompany) {
          // Update existing company
          await prisma.company.update({
            where: { id: existingCompany.id },
            data: {
              name: company.name || existingCompany.name,
              description: company.description,
              logo: company.logo,
              website: company.website,
              industry: company.industry,
              country: company.country,
              city: company.city,
              address: company.address,
              phone: company.phone,
              email: company.email,
              source: company.source,
              updatedAt: new Date(),
            },
          });
          results.updated++;
        } else {
          // Create new company
          const newCompany = await prisma.company.create({
            data: {
              name: company.name,
              domain: company.domain,
              description: company.description,
              logo: company.logo,
              website: company.website,
              industry: company.industry,
              country: company.country,
              city: company.city,
              address: company.address,
              phone: company.phone,
              email: company.email,
              source: company.source,
            },
          });
          results.created++;

          // Try to link with existing seller
          if (company.domain) {
            const seller = await prisma.seller.findFirst({
              where: {
                OR: [
                  { domain: company.domain },
                  { businessName: { equals: company.name, mode: 'insensitive' } },
                ],
              },
            });

            if (seller) {
              await prisma.company.update({
                where: { id: newCompany.id },
                data: { sellerId: seller.id },
              });
              results.linked++;
            }
          }
        }
      } catch (error) {
        results.errors.push(`Failed to process company: ${company.name}`);
      }
    }

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error('Scraper companies error:', error);
    return NextResponse.json(
      { error: 'Failed to process companies' },
      { status: 500 }
    );
  }
}
