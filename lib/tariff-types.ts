// Tariff Calculator Types
// Based on Harmonized System (HS) codes and international trade data

export interface HSCode {
  code: string; // HS code (2-10 digits)
  description: string;
  chapter: number; // 1-99
  section: string;
  level: 'chapter' | 'heading' | 'subheading' | 'tariff-line';
}

export interface TariffRate {
  hsCode: string;
  description: string;
  generalRate: number; // MFN (Most Favored Nation) rate as percentage
  generalRateType: 'ad-valorem' | 'specific' | 'compound' | 'free';
  specificRate?: string; // e.g., "$0.50/kg"
  unit?: string;
  preferentialRates: PreferentialRate[];
  additionalDuties?: AdditionalDuty[];
  notes?: string;
}

export interface PreferentialRate {
  agreement: string; // e.g., "USMCA", "CAFTA-DR"
  countries: string[];
  rate: number;
  rateType: 'ad-valorem' | 'specific' | 'compound' | 'free';
  specificRate?: string;
  conditions?: string;
}

export interface AdditionalDuty {
  type: 'anti-dumping' | 'countervailing' | 'safeguard' | 'section-301' | 'section-232' | 'other';
  rate: number;
  applicableCountries?: string[];
  description?: string;
  effectiveDate?: string;
  expirationDate?: string;
}

export interface Country {
  code: string; // ISO 3166-1 alpha-2
  name: string;
  region: string;
  tradeAgreements: string[];
  specialPrograms?: string[]; // GSP, AGOA, etc.
}

export interface TariffCalculation {
  hsCode: string;
  productDescription: string;
  originCountry: string;
  destinationCountry: string;
  productValue: number;
  quantity?: number;
  unit?: string;
  weight?: number;
  weightUnit?: 'kg' | 'lb';
  
  // Calculated values
  dutyRate: number;
  dutyAmount: number;
  additionalDuties: { type: string; amount: number }[];
  totalDuty: number;
  estimatedLandedCost: number;
  
  // Rate details
  appliedRate: {
    type: 'mfn' | 'preferential' | 'special-program';
    name: string;
    rate: number;
  };
  
  // Warnings and notes
  warnings?: string[];
  notes?: string[];
}

export interface TariffSearchResult {
  hsCode: string;
  description: string;
  matchScore: number;
  rates: TariffRate;
}

export interface TradeAgreement {
  code: string;
  name: string;
  fullName: string;
  countries: string[];
  effectiveDate: string;
  description: string;
}

// HS Code Sections (21 sections covering chapters 1-99)
export const HS_SECTIONS = [
  { section: 'I', chapters: [1, 5], name: 'Live Animals; Animal Products' },
  { section: 'II', chapters: [6, 14], name: 'Vegetable Products' },
  { section: 'III', chapters: [15, 15], name: 'Animal or Vegetable Fats and Oils' },
  { section: 'IV', chapters: [16, 24], name: 'Prepared Foodstuffs; Beverages, Spirits, Tobacco' },
  { section: 'V', chapters: [25, 27], name: 'Mineral Products' },
  { section: 'VI', chapters: [28, 38], name: 'Products of the Chemical Industries' },
  { section: 'VII', chapters: [39, 40], name: 'Plastics and Rubber' },
  { section: 'VIII', chapters: [41, 43], name: 'Hides, Skins, Leather, Furskins' },
  { section: 'IX', chapters: [44, 46], name: 'Wood and Articles of Wood' },
  { section: 'X', chapters: [47, 49], name: 'Pulp of Wood; Paper and Paperboard' },
  { section: 'XI', chapters: [50, 63], name: 'Textiles and Textile Articles' },
  { section: 'XII', chapters: [64, 67], name: 'Footwear, Headgear, Umbrellas' },
  { section: 'XIII', chapters: [68, 70], name: 'Articles of Stone, Plaster, Cement, Ceramics, Glass' },
  { section: 'XIV', chapters: [71, 71], name: 'Pearls, Precious Stones, Precious Metals, Jewelry' },
  { section: 'XV', chapters: [72, 83], name: 'Base Metals and Articles of Base Metal' },
  { section: 'XVI', chapters: [84, 85], name: 'Machinery and Mechanical Appliances; Electrical Equipment' },
  { section: 'XVII', chapters: [86, 89], name: 'Vehicles, Aircraft, Vessels' },
  { section: 'XVIII', chapters: [90, 92], name: 'Optical, Photographic, Medical Instruments; Clocks; Musical Instruments' },
  { section: 'XIX', chapters: [93, 93], name: 'Arms and Ammunition' },
  { section: 'XX', chapters: [94, 96], name: 'Miscellaneous Manufactured Articles' },
  { section: 'XXI', chapters: [97, 99], name: 'Works of Art, Collectors\' Pieces, Antiques; Special Provisions' },
];

// Major trade agreements
export const TRADE_AGREEMENTS: TradeAgreement[] = [
  {
    code: 'USMCA',
    name: 'USMCA',
    fullName: 'United States-Mexico-Canada Agreement',
    countries: ['US', 'MX', 'CA'],
    effectiveDate: '2020-07-01',
    description: 'Free trade agreement between US, Mexico, and Canada',
  },
  {
    code: 'CAFTA-DR',
    name: 'CAFTA-DR',
    fullName: 'Dominican Republic-Central America Free Trade Agreement',
    countries: ['US', 'CR', 'DO', 'GT', 'HN', 'NI', 'SV'],
    effectiveDate: '2006-03-01',
    description: 'Free trade agreement with Central America and Dominican Republic',
  },
  {
    code: 'KORUS',
    name: 'KORUS',
    fullName: 'United States-Korea Free Trade Agreement',
    countries: ['US', 'KR'],
    effectiveDate: '2012-03-15',
    description: 'Free trade agreement between US and South Korea',
  },
  {
    code: 'AUSFTA',
    name: 'AUSFTA',
    fullName: 'United States-Australia Free Trade Agreement',
    countries: ['US', 'AU'],
    effectiveDate: '2005-01-01',
    description: 'Free trade agreement between US and Australia',
  },
  {
    code: 'USJFTA',
    name: 'US-Japan',
    fullName: 'US-Japan Trade Agreement',
    countries: ['US', 'JP'],
    effectiveDate: '2020-01-01',
    description: 'Trade agreement between US and Japan',
  },
  {
    code: 'USIFTA',
    name: 'US-Israel',
    fullName: 'United States-Israel Free Trade Agreement',
    countries: ['US', 'IL'],
    effectiveDate: '1985-09-01',
    description: 'First US free trade agreement',
  },
  {
    code: 'GSP',
    name: 'GSP',
    fullName: 'Generalized System of Preferences',
    countries: [], // Many developing countries
    effectiveDate: '1976-01-01',
    description: 'Preferential tariff treatment for developing countries',
  },
  {
    code: 'AGOA',
    name: 'AGOA',
    fullName: 'African Growth and Opportunity Act',
    countries: [], // Sub-Saharan African countries
    effectiveDate: '2000-10-01',
    description: 'Duty-free access for eligible African countries',
  },
];

// Common countries for import/export
export const COUNTRIES: Country[] = [
  { code: 'US', name: 'United States', region: 'North America', tradeAgreements: ['USMCA'] },
  { code: 'CN', name: 'China', region: 'Asia', tradeAgreements: [] },
  { code: 'MX', name: 'Mexico', region: 'North America', tradeAgreements: ['USMCA'] },
  { code: 'CA', name: 'Canada', region: 'North America', tradeAgreements: ['USMCA'] },
  { code: 'JP', name: 'Japan', region: 'Asia', tradeAgreements: ['USJFTA'] },
  { code: 'DE', name: 'Germany', region: 'Europe', tradeAgreements: [] },
  { code: 'KR', name: 'South Korea', region: 'Asia', tradeAgreements: ['KORUS'] },
  { code: 'GB', name: 'United Kingdom', region: 'Europe', tradeAgreements: [] },
  { code: 'IN', name: 'India', region: 'Asia', tradeAgreements: [], specialPrograms: ['GSP'] },
  { code: 'VN', name: 'Vietnam', region: 'Asia', tradeAgreements: [] },
  { code: 'TW', name: 'Taiwan', region: 'Asia', tradeAgreements: [] },
  { code: 'FR', name: 'France', region: 'Europe', tradeAgreements: [] },
  { code: 'IT', name: 'Italy', region: 'Europe', tradeAgreements: [] },
  { code: 'TH', name: 'Thailand', region: 'Asia', tradeAgreements: [] },
  { code: 'MY', name: 'Malaysia', region: 'Asia', tradeAgreements: [] },
  { code: 'ID', name: 'Indonesia', region: 'Asia', tradeAgreements: [] },
  { code: 'BR', name: 'Brazil', region: 'South America', tradeAgreements: [] },
  { code: 'AU', name: 'Australia', region: 'Oceania', tradeAgreements: ['AUSFTA'] },
  { code: 'IL', name: 'Israel', region: 'Middle East', tradeAgreements: ['USIFTA'] },
  { code: 'SG', name: 'Singapore', region: 'Asia', tradeAgreements: ['USSFTA'] },
  { code: 'CR', name: 'Costa Rica', region: 'Central America', tradeAgreements: ['CAFTA-DR'] },
  { code: 'GT', name: 'Guatemala', region: 'Central America', tradeAgreements: ['CAFTA-DR'] },
  { code: 'PH', name: 'Philippines', region: 'Asia', tradeAgreements: [] },
  { code: 'PK', name: 'Pakistan', region: 'Asia', tradeAgreements: [] },
  { code: 'BD', name: 'Bangladesh', region: 'Asia', tradeAgreements: [] },
  { code: 'TR', name: 'Turkey', region: 'Europe/Asia', tradeAgreements: [] },
  { code: 'PL', name: 'Poland', region: 'Europe', tradeAgreements: [] },
  { code: 'NL', name: 'Netherlands', region: 'Europe', tradeAgreements: [] },
  { code: 'ES', name: 'Spain', region: 'Europe', tradeAgreements: [] },
  { code: 'BE', name: 'Belgium', region: 'Europe', tradeAgreements: [] },
];
