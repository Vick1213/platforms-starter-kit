// Tariff Database - Common HS Codes and Rates
// Data based on US Harmonized Tariff Schedule (HTS)

import { TariffRate, HSCode, TariffCalculation, Country, COUNTRIES, TRADE_AGREEMENTS } from './tariff-types';

// Sample tariff rates database (simplified for common products)
// In production, this would connect to USITC DataWeb API or WTO Tariff Database
export const TARIFF_DATABASE: TariffRate[] = [
  // Electronics - Chapter 84-85
  {
    hsCode: '8471.30',
    description: 'Portable automatic data processing machines (Laptops)',
    generalRate: 0,
    generalRateType: 'free',
    preferentialRates: [],
    notes: 'Information technology products are generally duty-free under ITA',
  },
  {
    hsCode: '8517.12',
    description: 'Smartphones and cellular phones',
    generalRate: 0,
    generalRateType: 'free',
    preferentialRates: [],
    notes: 'Duty-free under Information Technology Agreement',
  },
  {
    hsCode: '8528.72',
    description: 'Television receivers, color, with LCD/LED display',
    generalRate: 5,
    generalRateType: 'ad-valorem',
    preferentialRates: [
      { agreement: 'USMCA', countries: ['MX', 'CA'], rate: 0, rateType: 'free' },
      { agreement: 'KORUS', countries: ['KR'], rate: 0, rateType: 'free' },
    ],
  },
  {
    hsCode: '8443.32',
    description: 'Printers, printing machinery',
    generalRate: 0,
    generalRateType: 'free',
    preferentialRates: [],
  },
  
  // Textiles & Apparel - Chapter 61-62
  {
    hsCode: '6109.10',
    description: 'T-shirts, singlets, cotton, knitted',
    generalRate: 16.5,
    generalRateType: 'ad-valorem',
    preferentialRates: [
      { agreement: 'USMCA', countries: ['MX', 'CA'], rate: 0, rateType: 'free', conditions: 'Yarn forward rule' },
      { agreement: 'CAFTA-DR', countries: ['CR', 'DO', 'GT', 'HN', 'NI', 'SV'], rate: 0, rateType: 'free' },
    ],
  },
  {
    hsCode: '6110.20',
    description: 'Sweaters, pullovers, cotton',
    generalRate: 16.5,
    generalRateType: 'ad-valorem',
    preferentialRates: [
      { agreement: 'USMCA', countries: ['MX', 'CA'], rate: 0, rateType: 'free' },
    ],
  },
  {
    hsCode: '6203.42',
    description: 'Men\'s trousers, cotton, not knitted',
    generalRate: 16.6,
    generalRateType: 'ad-valorem',
    preferentialRates: [
      { agreement: 'USMCA', countries: ['MX', 'CA'], rate: 0, rateType: 'free' },
    ],
  },
  {
    hsCode: '6204.62',
    description: 'Women\'s trousers, cotton, not knitted',
    generalRate: 16.6,
    generalRateType: 'ad-valorem',
    preferentialRates: [
      { agreement: 'USMCA', countries: ['MX', 'CA'], rate: 0, rateType: 'free' },
    ],
  },
  {
    hsCode: '6402.91',
    description: 'Footwear, rubber/plastic upper, covering ankle',
    generalRate: 37.5,
    generalRateType: 'ad-valorem',
    preferentialRates: [
      { agreement: 'USMCA', countries: ['MX', 'CA'], rate: 0, rateType: 'free' },
    ],
  },
  {
    hsCode: '6403.91',
    description: 'Footwear, leather upper, covering ankle',
    generalRate: 8.5,
    generalRateType: 'ad-valorem',
    preferentialRates: [
      { agreement: 'USMCA', countries: ['MX', 'CA'], rate: 0, rateType: 'free' },
    ],
  },
  
  // Furniture - Chapter 94
  {
    hsCode: '9401.61',
    description: 'Seats with wooden frames, upholstered',
    generalRate: 0,
    generalRateType: 'free',
    preferentialRates: [],
  },
  {
    hsCode: '9403.50',
    description: 'Wooden furniture for bedrooms',
    generalRate: 0,
    generalRateType: 'free',
    preferentialRates: [],
    additionalDuties: [
      { type: 'anti-dumping', rate: 25, applicableCountries: ['CN'], description: 'AD duty on Chinese bedroom furniture' },
    ],
  },
  {
    hsCode: '9403.60',
    description: 'Wooden furniture, other',
    generalRate: 0,
    generalRateType: 'free',
    preferentialRates: [],
  },
  
  // Toys & Games - Chapter 95
  {
    hsCode: '9503.00',
    description: 'Toys, including tricycles, dolls, puzzles, etc.',
    generalRate: 0,
    generalRateType: 'free',
    preferentialRates: [],
  },
  {
    hsCode: '9504.50',
    description: 'Video game consoles and machines',
    generalRate: 0,
    generalRateType: 'free',
    preferentialRates: [],
  },
  
  // Auto Parts - Chapter 87
  {
    hsCode: '8708.29',
    description: 'Parts and accessories for motor vehicles, body parts',
    generalRate: 2.5,
    generalRateType: 'ad-valorem',
    preferentialRates: [
      { agreement: 'USMCA', countries: ['MX', 'CA'], rate: 0, rateType: 'free', conditions: 'Regional value content requirement' },
    ],
  },
  {
    hsCode: '8708.99',
    description: 'Parts and accessories for motor vehicles, other',
    generalRate: 2.5,
    generalRateType: 'ad-valorem',
    preferentialRates: [
      { agreement: 'USMCA', countries: ['MX', 'CA'], rate: 0, rateType: 'free' },
    ],
  },
  
  // Steel & Aluminum - Chapter 72-76
  {
    hsCode: '7208.51',
    description: 'Flat-rolled steel, hot-rolled, width ≥600mm',
    generalRate: 0,
    generalRateType: 'free',
    preferentialRates: [],
    additionalDuties: [
      { type: 'section-232', rate: 25, description: 'Section 232 steel tariff', applicableCountries: [] },
    ],
    notes: 'Subject to Section 232 duties; some countries excluded',
  },
  {
    hsCode: '7606.11',
    description: 'Aluminum plates, sheets, strips, not alloyed',
    generalRate: 3,
    generalRateType: 'ad-valorem',
    preferentialRates: [
      { agreement: 'USMCA', countries: ['MX', 'CA'], rate: 0, rateType: 'free' },
    ],
    additionalDuties: [
      { type: 'section-232', rate: 10, description: 'Section 232 aluminum tariff' },
    ],
  },
  
  // Food Products - Chapter 16-21
  {
    hsCode: '1806.32',
    description: 'Chocolate preparations, blocks, slabs or bars, not filled',
    generalRate: 5.6,
    generalRateType: 'ad-valorem',
    preferentialRates: [
      { agreement: 'USMCA', countries: ['MX', 'CA'], rate: 0, rateType: 'free' },
    ],
  },
  {
    hsCode: '2009.11',
    description: 'Orange juice, frozen',
    generalRate: 7.85,
    generalRateType: 'compound',
    specificRate: '$0.0419/liter',
    preferentialRates: [],
  },
  {
    hsCode: '2204.21',
    description: 'Wine, in containers ≤2 liters',
    generalRate: 6.3,
    generalRateType: 'compound',
    specificRate: '$0.055/liter',
    preferentialRates: [
      { agreement: 'AUSFTA', countries: ['AU'], rate: 0, rateType: 'free' },
    ],
  },
  
  // Machinery - Chapter 84
  {
    hsCode: '8414.51',
    description: 'Fans, table, floor, wall, ceiling',
    generalRate: 4.7,
    generalRateType: 'ad-valorem',
    preferentialRates: [
      { agreement: 'USMCA', countries: ['MX', 'CA'], rate: 0, rateType: 'free' },
    ],
  },
  {
    hsCode: '8418.10',
    description: 'Refrigerator-freezer combinations',
    generalRate: 0,
    generalRateType: 'free',
    preferentialRates: [],
  },
  {
    hsCode: '8450.11',
    description: 'Washing machines, fully automatic',
    generalRate: 1.4,
    generalRateType: 'ad-valorem',
    preferentialRates: [
      { agreement: 'KORUS', countries: ['KR'], rate: 0, rateType: 'free' },
    ],
  },
  
  // Plastics - Chapter 39
  {
    hsCode: '3926.90',
    description: 'Other articles of plastics',
    generalRate: 5.3,
    generalRateType: 'ad-valorem',
    preferentialRates: [
      { agreement: 'USMCA', countries: ['MX', 'CA'], rate: 0, rateType: 'free' },
    ],
  },
  
  // Medical Devices - Chapter 90
  {
    hsCode: '9018.90',
    description: 'Medical instruments and appliances',
    generalRate: 0,
    generalRateType: 'free',
    preferentialRates: [],
    notes: 'Most medical devices are duty-free',
  },
  
  // Cosmetics & Personal Care - Chapter 33
  {
    hsCode: '3304.99',
    description: 'Beauty or make-up preparations',
    generalRate: 0,
    generalRateType: 'free',
    preferentialRates: [],
  },
  {
    hsCode: '3305.10',
    description: 'Shampoos',
    generalRate: 0,
    generalRateType: 'free',
    preferentialRates: [],
  },
  
  // Jewelry - Chapter 71
  {
    hsCode: '7113.19',
    description: 'Jewelry, of precious metal (excluding silver)',
    generalRate: 6.5,
    generalRateType: 'ad-valorem',
    preferentialRates: [
      { agreement: 'USIFTA', countries: ['IL'], rate: 0, rateType: 'free' },
    ],
  },
  {
    hsCode: '7117.90',
    description: 'Imitation jewelry, other',
    generalRate: 11,
    generalRateType: 'ad-valorem',
    preferentialRates: [],
  },
  
  // Batteries - Chapter 85
  {
    hsCode: '8507.60',
    description: 'Lithium-ion batteries',
    generalRate: 3.4,
    generalRateType: 'ad-valorem',
    preferentialRates: [
      { agreement: 'KORUS', countries: ['KR'], rate: 0, rateType: 'free' },
    ],
  },
  
  // Solar Panels - Chapter 85
  {
    hsCode: '8541.40',
    description: 'Photovoltaic cells (solar cells)',
    generalRate: 0,
    generalRateType: 'free',
    preferentialRates: [],
    additionalDuties: [
      { type: 'safeguard', rate: 14.75, description: 'Safeguard tariff on solar cells/modules' },
    ],
  },
];

// HS Code chapters for browsing
export const HS_CHAPTERS: HSCode[] = [
  { code: '01', description: 'Live animals', chapter: 1, section: 'I', level: 'chapter' },
  { code: '02', description: 'Meat and edible meat offal', chapter: 2, section: 'I', level: 'chapter' },
  { code: '03', description: 'Fish and crustaceans', chapter: 3, section: 'I', level: 'chapter' },
  { code: '04', description: 'Dairy produce; eggs; honey', chapter: 4, section: 'I', level: 'chapter' },
  { code: '05', description: 'Products of animal origin', chapter: 5, section: 'I', level: 'chapter' },
  { code: '06', description: 'Live trees and plants', chapter: 6, section: 'II', level: 'chapter' },
  { code: '07', description: 'Edible vegetables', chapter: 7, section: 'II', level: 'chapter' },
  { code: '08', description: 'Edible fruit and nuts', chapter: 8, section: 'II', level: 'chapter' },
  { code: '09', description: 'Coffee, tea, spices', chapter: 9, section: 'II', level: 'chapter' },
  { code: '10', description: 'Cereals', chapter: 10, section: 'II', level: 'chapter' },
  { code: '11', description: 'Milling products; malt; starch', chapter: 11, section: 'II', level: 'chapter' },
  { code: '12', description: 'Oil seeds; miscellaneous grains', chapter: 12, section: 'II', level: 'chapter' },
  { code: '13', description: 'Lac; gums; resins', chapter: 13, section: 'II', level: 'chapter' },
  { code: '14', description: 'Vegetable plaiting materials', chapter: 14, section: 'II', level: 'chapter' },
  { code: '15', description: 'Animal or vegetable fats and oils', chapter: 15, section: 'III', level: 'chapter' },
  { code: '16', description: 'Preparations of meat, fish', chapter: 16, section: 'IV', level: 'chapter' },
  { code: '17', description: 'Sugars and sugar confectionery', chapter: 17, section: 'IV', level: 'chapter' },
  { code: '18', description: 'Cocoa and cocoa preparations', chapter: 18, section: 'IV', level: 'chapter' },
  { code: '19', description: 'Preparations of cereals, flour', chapter: 19, section: 'IV', level: 'chapter' },
  { code: '20', description: 'Preparations of vegetables, fruit', chapter: 20, section: 'IV', level: 'chapter' },
  { code: '21', description: 'Miscellaneous edible preparations', chapter: 21, section: 'IV', level: 'chapter' },
  { code: '22', description: 'Beverages, spirits, vinegar', chapter: 22, section: 'IV', level: 'chapter' },
  { code: '23', description: 'Residues from food industries; animal feed', chapter: 23, section: 'IV', level: 'chapter' },
  { code: '24', description: 'Tobacco and tobacco substitutes', chapter: 24, section: 'IV', level: 'chapter' },
  { code: '25', description: 'Salt; sulfur; earths; stone; cement', chapter: 25, section: 'V', level: 'chapter' },
  { code: '26', description: 'Ores, slag and ash', chapter: 26, section: 'V', level: 'chapter' },
  { code: '27', description: 'Mineral fuels, oils', chapter: 27, section: 'V', level: 'chapter' },
  { code: '28', description: 'Inorganic chemicals', chapter: 28, section: 'VI', level: 'chapter' },
  { code: '29', description: 'Organic chemicals', chapter: 29, section: 'VI', level: 'chapter' },
  { code: '30', description: 'Pharmaceutical products', chapter: 30, section: 'VI', level: 'chapter' },
  { code: '31', description: 'Fertilizers', chapter: 31, section: 'VI', level: 'chapter' },
  { code: '32', description: 'Tanning/dyeing extracts; paints', chapter: 32, section: 'VI', level: 'chapter' },
  { code: '33', description: 'Essential oils; perfumery; cosmetics', chapter: 33, section: 'VI', level: 'chapter' },
  { code: '34', description: 'Soap; waxes; candles', chapter: 34, section: 'VI', level: 'chapter' },
  { code: '35', description: 'Albumin substances; glues', chapter: 35, section: 'VI', level: 'chapter' },
  { code: '36', description: 'Explosives; pyrotechnics; matches', chapter: 36, section: 'VI', level: 'chapter' },
  { code: '37', description: 'Photographic goods', chapter: 37, section: 'VI', level: 'chapter' },
  { code: '38', description: 'Miscellaneous chemical products', chapter: 38, section: 'VI', level: 'chapter' },
  { code: '39', description: 'Plastics and articles thereof', chapter: 39, section: 'VII', level: 'chapter' },
  { code: '40', description: 'Rubber and articles thereof', chapter: 40, section: 'VII', level: 'chapter' },
  { code: '41', description: 'Raw hides, skins, leather', chapter: 41, section: 'VIII', level: 'chapter' },
  { code: '42', description: 'Articles of leather; travel goods', chapter: 42, section: 'VIII', level: 'chapter' },
  { code: '43', description: 'Furskins and artificial fur', chapter: 43, section: 'VIII', level: 'chapter' },
  { code: '44', description: 'Wood and articles of wood', chapter: 44, section: 'IX', level: 'chapter' },
  { code: '45', description: 'Cork and articles of cork', chapter: 45, section: 'IX', level: 'chapter' },
  { code: '46', description: 'Manufactures of straw; basketware', chapter: 46, section: 'IX', level: 'chapter' },
  { code: '47', description: 'Pulp of wood; waste paper', chapter: 47, section: 'X', level: 'chapter' },
  { code: '48', description: 'Paper and paperboard', chapter: 48, section: 'X', level: 'chapter' },
  { code: '49', description: 'Printed books, newspapers, pictures', chapter: 49, section: 'X', level: 'chapter' },
  { code: '50', description: 'Silk', chapter: 50, section: 'XI', level: 'chapter' },
  { code: '51', description: 'Wool, animal hair', chapter: 51, section: 'XI', level: 'chapter' },
  { code: '52', description: 'Cotton', chapter: 52, section: 'XI', level: 'chapter' },
  { code: '53', description: 'Other vegetable textile fibers', chapter: 53, section: 'XI', level: 'chapter' },
  { code: '54', description: 'Man-made filaments', chapter: 54, section: 'XI', level: 'chapter' },
  { code: '55', description: 'Man-made staple fibers', chapter: 55, section: 'XI', level: 'chapter' },
  { code: '56', description: 'Wadding, felt; special yarns; twine', chapter: 56, section: 'XI', level: 'chapter' },
  { code: '57', description: 'Carpets and textile floor coverings', chapter: 57, section: 'XI', level: 'chapter' },
  { code: '58', description: 'Special woven fabrics; lace; tapestries', chapter: 58, section: 'XI', level: 'chapter' },
  { code: '59', description: 'Impregnated, coated textile fabrics', chapter: 59, section: 'XI', level: 'chapter' },
  { code: '60', description: 'Knitted or crocheted fabrics', chapter: 60, section: 'XI', level: 'chapter' },
  { code: '61', description: 'Apparel, knitted or crocheted', chapter: 61, section: 'XI', level: 'chapter' },
  { code: '62', description: 'Apparel, not knitted or crocheted', chapter: 62, section: 'XI', level: 'chapter' },
  { code: '63', description: 'Other made up textile articles', chapter: 63, section: 'XI', level: 'chapter' },
  { code: '64', description: 'Footwear, gaiters', chapter: 64, section: 'XII', level: 'chapter' },
  { code: '65', description: 'Headgear', chapter: 65, section: 'XII', level: 'chapter' },
  { code: '66', description: 'Umbrellas, walking sticks', chapter: 66, section: 'XII', level: 'chapter' },
  { code: '67', description: 'Prepared feathers; artificial flowers', chapter: 67, section: 'XII', level: 'chapter' },
  { code: '68', description: 'Articles of stone, cement, asbestos', chapter: 68, section: 'XIII', level: 'chapter' },
  { code: '69', description: 'Ceramic products', chapter: 69, section: 'XIII', level: 'chapter' },
  { code: '70', description: 'Glass and glassware', chapter: 70, section: 'XIII', level: 'chapter' },
  { code: '71', description: 'Pearls, precious stones, precious metals, jewelry', chapter: 71, section: 'XIV', level: 'chapter' },
  { code: '72', description: 'Iron and steel', chapter: 72, section: 'XV', level: 'chapter' },
  { code: '73', description: 'Articles of iron or steel', chapter: 73, section: 'XV', level: 'chapter' },
  { code: '74', description: 'Copper and articles thereof', chapter: 74, section: 'XV', level: 'chapter' },
  { code: '75', description: 'Nickel and articles thereof', chapter: 75, section: 'XV', level: 'chapter' },
  { code: '76', description: 'Aluminum and articles thereof', chapter: 76, section: 'XV', level: 'chapter' },
  { code: '78', description: 'Lead and articles thereof', chapter: 78, section: 'XV', level: 'chapter' },
  { code: '79', description: 'Zinc and articles thereof', chapter: 79, section: 'XV', level: 'chapter' },
  { code: '80', description: 'Tin and articles thereof', chapter: 80, section: 'XV', level: 'chapter' },
  { code: '81', description: 'Other base metals; cermets', chapter: 81, section: 'XV', level: 'chapter' },
  { code: '82', description: 'Tools, cutlery, of base metal', chapter: 82, section: 'XV', level: 'chapter' },
  { code: '83', description: 'Miscellaneous articles of base metal', chapter: 83, section: 'XV', level: 'chapter' },
  { code: '84', description: 'Machinery, mechanical appliances, computers', chapter: 84, section: 'XVI', level: 'chapter' },
  { code: '85', description: 'Electrical machinery and equipment', chapter: 85, section: 'XVI', level: 'chapter' },
  { code: '86', description: 'Railway locomotives, rolling stock', chapter: 86, section: 'XVII', level: 'chapter' },
  { code: '87', description: 'Vehicles other than railway', chapter: 87, section: 'XVII', level: 'chapter' },
  { code: '88', description: 'Aircraft, spacecraft', chapter: 88, section: 'XVII', level: 'chapter' },
  { code: '89', description: 'Ships, boats', chapter: 89, section: 'XVII', level: 'chapter' },
  { code: '90', description: 'Optical, photographic, medical instruments', chapter: 90, section: 'XVIII', level: 'chapter' },
  { code: '91', description: 'Clocks and watches', chapter: 91, section: 'XVIII', level: 'chapter' },
  { code: '92', description: 'Musical instruments', chapter: 92, section: 'XVIII', level: 'chapter' },
  { code: '93', description: 'Arms and ammunition', chapter: 93, section: 'XIX', level: 'chapter' },
  { code: '94', description: 'Furniture; bedding; lamps', chapter: 94, section: 'XX', level: 'chapter' },
  { code: '95', description: 'Toys, games, sports equipment', chapter: 95, section: 'XX', level: 'chapter' },
  { code: '96', description: 'Miscellaneous manufactured articles', chapter: 96, section: 'XX', level: 'chapter' },
  { code: '97', description: 'Works of art, collectors pieces, antiques', chapter: 97, section: 'XXI', level: 'chapter' },
];

// Search for tariff rates by HS code or description
export function searchTariffs(query: string): TariffRate[] {
  const normalizedQuery = query.toLowerCase().trim();
  const hsCodeQuery = normalizedQuery.replace(/[.\s]/g, '');
  
  return TARIFF_DATABASE.filter(rate => {
    const normalizedHsCode = rate.hsCode.replace(/\./g, '');
    const normalizedDescription = rate.description.toLowerCase();
    
    // Match by HS code (partial match from start)
    if (normalizedHsCode.startsWith(hsCodeQuery) || hsCodeQuery.startsWith(normalizedHsCode)) {
      return true;
    }
    
    // Match by description keywords
    const queryWords = normalizedQuery.split(/\s+/);
    return queryWords.every(word => normalizedDescription.includes(word));
  });
}

// Get tariff rate by exact HS code
export function getTariffByHsCode(hsCode: string): TariffRate | undefined {
  const normalizedCode = hsCode.replace(/[.\s]/g, '');
  return TARIFF_DATABASE.find(rate => 
    rate.hsCode.replace(/\./g, '') === normalizedCode
  );
}

// Calculate tariff for a specific shipment
export function calculateTariff(
  hsCode: string,
  originCountry: string,
  destinationCountry: string,
  productValue: number,
  quantity?: number,
  weight?: number
): TariffCalculation | null {
  const tariffRate = getTariffByHsCode(hsCode);
  
  if (!tariffRate) {
    return null;
  }
  
  const originCountryData = COUNTRIES.find(c => c.code === originCountry);
  const warnings: string[] = [];
  const notes: string[] = [];
  
  // Determine applicable rate
  let appliedRate: TariffCalculation['appliedRate'];
  let dutyRate = tariffRate.generalRate;
  
  // Check for preferential rates
  const preferentialRate = tariffRate.preferentialRates.find(pr =>
    pr.countries.includes(originCountry)
  );
  
  if (preferentialRate) {
    dutyRate = preferentialRate.rate;
    appliedRate = {
      type: 'preferential',
      name: preferentialRate.agreement,
      rate: preferentialRate.rate,
    };
    if (preferentialRate.conditions) {
      notes.push(`Preferential rate conditions: ${preferentialRate.conditions}`);
    }
  } else {
    appliedRate = {
      type: 'mfn',
      name: 'MFN (Most Favored Nation)',
      rate: tariffRate.generalRate,
    };
  }
  
  // Calculate base duty
  let dutyAmount = 0;
  if (tariffRate.generalRateType === 'ad-valorem' || tariffRate.generalRateType === 'compound') {
    dutyAmount = (productValue * dutyRate) / 100;
  }
  
  // Add specific rate if applicable
  if (tariffRate.specificRate && (tariffRate.generalRateType === 'specific' || tariffRate.generalRateType === 'compound')) {
    notes.push(`Additional specific rate: ${tariffRate.specificRate}`);
  }
  
  // Calculate additional duties
  const additionalDuties: { type: string; amount: number }[] = [];
  
  if (tariffRate.additionalDuties) {
    for (const duty of tariffRate.additionalDuties) {
      // Check if duty applies to origin country
      const applies = !duty.applicableCountries?.length || 
        duty.applicableCountries.includes(originCountry);
      
      if (applies) {
        const additionalAmount = (productValue * duty.rate) / 100;
        additionalDuties.push({
          type: duty.description || duty.type,
          amount: additionalAmount,
        });
        warnings.push(`${duty.type}: ${duty.description || ''} (${duty.rate}%)`);
      }
    }
  }
  
  const totalAdditionalDuties = additionalDuties.reduce((sum, d) => sum + d.amount, 0);
  const totalDuty = dutyAmount + totalAdditionalDuties;
  const estimatedLandedCost = productValue + totalDuty;
  
  // Add tariff notes
  if (tariffRate.notes) {
    notes.push(tariffRate.notes);
  }
  
  return {
    hsCode,
    productDescription: tariffRate.description,
    originCountry,
    destinationCountry,
    productValue,
    quantity,
    weight,
    dutyRate,
    dutyAmount,
    additionalDuties,
    totalDuty,
    estimatedLandedCost,
    appliedRate,
    warnings: warnings.length > 0 ? warnings : undefined,
    notes: notes.length > 0 ? notes : undefined,
  };
}

// Get all trade agreements for a country
export function getCountryTradeAgreements(countryCode: string): typeof TRADE_AGREEMENTS {
  return TRADE_AGREEMENTS.filter(agreement => 
    agreement.countries.includes(countryCode)
  );
}

// Get HS chapters by section
export function getChaptersBySection(section: string): HSCode[] {
  return HS_CHAPTERS.filter(chapter => chapter.section === section);
}

// Format HS code with dots (e.g., "84713000" -> "8471.30.00")
export function formatHsCode(code: string): string {
  const cleaned = code.replace(/[.\s]/g, '');
  if (cleaned.length <= 2) return cleaned;
  if (cleaned.length <= 4) return `${cleaned.slice(0, 2)}.${cleaned.slice(2)}`;
  if (cleaned.length <= 6) return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 4)}.${cleaned.slice(4)}`;
  return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 4)}.${cleaned.slice(4, 6)}.${cleaned.slice(6)}`;
}

// Get rate type label
export function getRateTypeLabel(type: TariffRate['generalRateType']): string {
  switch (type) {
    case 'ad-valorem': return 'Ad Valorem (% of value)';
    case 'specific': return 'Specific (per unit)';
    case 'compound': return 'Compound (% + per unit)';
    case 'free': return 'Duty Free';
  }
}
