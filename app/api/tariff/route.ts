import { NextRequest, NextResponse } from 'next/server';
import { 
  searchTariffs, 
  getTariffByHsCode, 
  calculateTariff,
  getCountryTradeAgreements,
  HS_CHAPTERS,
  TARIFF_DATABASE,
} from '@/lib/tariff-db';
import { COUNTRIES, TRADE_AGREEMENTS, HS_SECTIONS } from '@/lib/tariff-types';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  try {
    switch (action) {
      case 'search': {
        const query = searchParams.get('query') || '';
        if (!query) {
          return NextResponse.json({ error: 'Query parameter required' }, { status: 400 });
        }
        const results = searchTariffs(query);
        return NextResponse.json({ results });
      }

      case 'lookup': {
        const hsCode = searchParams.get('hsCode');
        if (!hsCode) {
          return NextResponse.json({ error: 'HS code required' }, { status: 400 });
        }
        const rate = getTariffByHsCode(hsCode);
        if (!rate) {
          return NextResponse.json({ error: 'HS code not found' }, { status: 404 });
        }
        return NextResponse.json({ rate });
      }

      case 'countries': {
        return NextResponse.json({ countries: COUNTRIES });
      }

      case 'agreements': {
        const countryCode = searchParams.get('country');
        if (countryCode) {
          const agreements = getCountryTradeAgreements(countryCode);
          return NextResponse.json({ agreements });
        }
        return NextResponse.json({ agreements: TRADE_AGREEMENTS });
      }

      case 'chapters': {
        const section = searchParams.get('section');
        if (section) {
          const chapters = HS_CHAPTERS.filter(ch => ch.section === section);
          return NextResponse.json({ chapters });
        }
        return NextResponse.json({ chapters: HS_CHAPTERS });
      }

      case 'sections': {
        return NextResponse.json({ sections: HS_SECTIONS });
      }

      case 'browse': {
        // Return all tariff rates for browsing
        const chapter = searchParams.get('chapter');
        if (chapter) {
          const rates = TARIFF_DATABASE.filter(rate => 
            rate.hsCode.startsWith(chapter.padStart(2, '0'))
          );
          return NextResponse.json({ rates });
        }
        return NextResponse.json({ rates: TARIFF_DATABASE });
      }

      default:
        return NextResponse.json({
          message: 'Tariff Calculator API',
          endpoints: {
            search: '/api/tariff?action=search&query=<product>',
            lookup: '/api/tariff?action=lookup&hsCode=<code>',
            calculate: 'POST /api/tariff with calculation parameters',
            countries: '/api/tariff?action=countries',
            agreements: '/api/tariff?action=agreements&country=<code>',
            chapters: '/api/tariff?action=chapters&section=<section>',
            sections: '/api/tariff?action=sections',
            browse: '/api/tariff?action=browse&chapter=<chapter>',
          },
        });
    }
  } catch (error) {
    console.error('Tariff API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'calculate': {
        const { hsCode, originCountry, destinationCountry, productValue, quantity, weight } = body;

        if (!hsCode || !originCountry || !destinationCountry || !productValue) {
          return NextResponse.json({
            error: 'Missing required fields: hsCode, originCountry, destinationCountry, productValue',
          }, { status: 400 });
        }

        const calculation = calculateTariff(
          hsCode,
          originCountry,
          destinationCountry,
          parseFloat(productValue),
          quantity ? parseFloat(quantity) : undefined,
          weight ? parseFloat(weight) : undefined
        );

        if (!calculation) {
          return NextResponse.json({
            error: 'HS code not found in database',
            hsCode,
          }, { status: 404 });
        }

        return NextResponse.json({ calculation });
      }

      case 'bulk-calculate': {
        const { items, originCountry, destinationCountry } = body;

        if (!items || !Array.isArray(items)) {
          return NextResponse.json({
            error: 'Items array required',
          }, { status: 400 });
        }

        const calculations = items.map((item: { hsCode: string; productValue: number; quantity?: number }) => {
          return calculateTariff(
            item.hsCode,
            originCountry,
            destinationCountry,
            item.productValue,
            item.quantity
          );
        }).filter(Boolean);

        const totals = {
          totalProductValue: calculations.reduce((sum, c) => sum + (c?.productValue || 0), 0),
          totalDuty: calculations.reduce((sum, c) => sum + (c?.totalDuty || 0), 0),
          totalLandedCost: calculations.reduce((sum, c) => sum + (c?.estimatedLandedCost || 0), 0),
        };

        return NextResponse.json({ calculations, totals });
      }

      default:
        return NextResponse.json({
          error: 'Invalid action. Use "calculate" or "bulk-calculate"',
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Tariff calculation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
