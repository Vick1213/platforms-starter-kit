'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Calculator, 
  Search, 
  Globe, 
  DollarSign, 
  Package, 
  AlertTriangle,
  Info,
  ArrowRight,
  FileText,
  Building2,
  Truck,
  ChevronDown,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

interface TariffRate {
  hsCode: string;
  description: string;
  generalRate: number;
  generalRateType: string;
  specificRate?: string;
  preferentialRates: {
    agreement: string;
    countries: string[];
    rate: number;
    rateType: string;
    conditions?: string;
  }[];
  additionalDuties?: {
    type: string;
    rate: number;
    applicableCountries?: string[];
    description?: string;
  }[];
  notes?: string;
}

interface Country {
  code: string;
  name: string;
  region: string;
  tradeAgreements: string[];
}

interface TariffCalculation {
  hsCode: string;
  productDescription: string;
  originCountry: string;
  destinationCountry: string;
  productValue: number;
  dutyRate: number;
  dutyAmount: number;
  additionalDuties: { type: string; amount: number }[];
  totalDuty: number;
  estimatedLandedCost: number;
  appliedRate: {
    type: string;
    name: string;
    rate: number;
  };
  warnings?: string[];
  notes?: string[];
}

interface HSSection {
  section: string;
  chapters: [number, number];
  name: string;
}

interface HSChapter {
  code: string;
  description: string;
  chapter: number;
  section: string;
}

export default function TariffCalculatorPage() {
  const [activeTab, setActiveTab] = useState<'calculator' | 'search' | 'browse'>('calculator');
  
  // Calculator state
  const [hsCode, setHsCode] = useState('');
  const [originCountry, setOriginCountry] = useState('CN');
  const [destinationCountry, setDestinationCountry] = useState('US');
  const [productValue, setProductValue] = useState('');
  const [quantity, setQuantity] = useState('');
  const [calculation, setCalculation] = useState<TariffCalculation | null>(null);
  const [calculationError, setCalculationError] = useState('');
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<TariffRate[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Data state
  const [countries, setCountries] = useState<Country[]>([]);
  const [sections, setSections] = useState<HSSection[]>([]);
  const [chapters, setChapters] = useState<HSChapter[]>([]);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [selectedTariff, setSelectedTariff] = useState<TariffRate | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);

  // Load initial data
  useEffect(() => {
    loadCountries();
    loadSections();
    loadChapters();
  }, []);

  async function loadCountries() {
    try {
      const res = await fetch('/api/tariff?action=countries');
      const data = await res.json();
      setCountries(data.countries || []);
    } catch (error) {
      console.error('Failed to load countries:', error);
    }
  }

  async function loadSections() {
    try {
      const res = await fetch('/api/tariff?action=sections');
      const data = await res.json();
      setSections(data.sections || []);
    } catch (error) {
      console.error('Failed to load sections:', error);
    }
  }

  async function loadChapters() {
    try {
      const res = await fetch('/api/tariff?action=chapters');
      const data = await res.json();
      setChapters(data.chapters || []);
    } catch (error) {
      console.error('Failed to load chapters:', error);
    }
  }

  async function handleSearch() {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const res = await fetch(`/api/tariff?action=search&query=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setSearchResults(data.results || []);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  }

  async function handleCalculate() {
    if (!hsCode || !productValue) {
      setCalculationError('Please enter HS code and product value');
      return;
    }

    setIsLoading(true);
    setCalculationError('');
    setCalculation(null);

    try {
      const res = await fetch('/api/tariff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'calculate',
          hsCode,
          originCountry,
          destinationCountry,
          productValue,
          quantity: quantity || undefined,
        }),
      });

      const data = await res.json();
      
      if (data.error) {
        setCalculationError(data.error);
      } else {
        setCalculation(data.calculation);
      }
    } catch (error) {
      setCalculationError('Failed to calculate tariff');
    } finally {
      setIsLoading(false);
    }
  }

  function selectTariffForCalculation(tariff: TariffRate) {
    setHsCode(tariff.hsCode);
    setSelectedTariff(tariff);
    setActiveTab('calculator');
  }

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }

  function formatPercentage(rate: number): string {
    return `${rate.toFixed(2)}%`;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-white/10 rounded-lg">
              <Calculator className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Import Tariff Calculator</h1>
              <p className="text-blue-100 mt-1">
                Calculate import duties and tariffs based on HS codes
              </p>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex gap-2 mt-8">
            <button
              onClick={() => setActiveTab('calculator')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'calculator'
                  ? 'bg-white text-blue-600'
                  : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              <Calculator className="w-4 h-4 inline-block mr-2" />
              Calculator
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'search'
                  ? 'bg-white text-blue-600'
                  : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              <Search className="w-4 h-4 inline-block mr-2" />
              Search HS Codes
            </button>
            <button
              onClick={() => setActiveTab('browse')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'browse'
                  ? 'bg-white text-blue-600'
                  : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              <FileText className="w-4 h-4 inline-block mr-2" />
              Browse Categories
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Calculator Tab */}
        {activeTab === 'calculator' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Input Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Shipment Details
                </CardTitle>
                <CardDescription>
                  Enter product and shipment information to calculate duties
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* HS Code */}
                <div className="space-y-2">
                  <Label htmlFor="hsCode">HS Code</Label>
                  <div className="flex gap-2">
                    <Input
                      id="hsCode"
                      value={hsCode}
                      onChange={(e) => setHsCode(e.target.value)}
                      placeholder="e.g., 8471.30 or 6109.10"
                      className="font-mono"
                    />
                    <Button
                      variant="outline"
                      onClick={() => setActiveTab('search')}
                      title="Search for HS code"
                    >
                      <Search className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Harmonized System code that classifies your product
                  </p>
                </div>

                {/* Origin Country */}
                <div className="space-y-2">
                  <Label htmlFor="originCountry">Origin Country</Label>
                  <select
                    id="originCountry"
                    value={originCountry}
                    onChange={(e) => setOriginCountry(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    {countries.map(country => (
                      <option key={country.code} value={country.code}>
                        {country.name} ({country.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Destination Country */}
                <div className="space-y-2">
                  <Label htmlFor="destinationCountry">Destination Country</Label>
                  <select
                    id="destinationCountry"
                    value={destinationCountry}
                    onChange={(e) => setDestinationCountry(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="US">United States (US)</option>
                    {/* Can expand to more destination countries */}
                  </select>
                </div>

                {/* Product Value */}
                <div className="space-y-2">
                  <Label htmlFor="productValue">Product Value (USD)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="productValue"
                      type="number"
                      value={productValue}
                      onChange={(e) => setProductValue(e.target.value)}
                      placeholder="0.00"
                      className="pl-9"
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    CIF value (Cost + Insurance + Freight)
                  </p>
                </div>

                {/* Quantity */}
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity (optional)</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="Number of units"
                  />
                </div>

                {calculationError && (
                  <div className="p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    {calculationError}
                  </div>
                )}

                <Button
                  onClick={handleCalculate}
                  disabled={isLoading}
                  className="w-full"
                  size="lg"
                >
                  {isLoading ? (
                    'Calculating...'
                  ) : (
                    <>
                      <Calculator className="w-4 h-4 mr-2" />
                      Calculate Duties
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Results */}
            <div className="space-y-6">
              {calculation ? (
                <>
                  {/* Summary Card */}
                  <Card className="border-2 border-blue-200 bg-blue-50/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Calculation Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Product Value</span>
                          <span className="font-semibold">{formatCurrency(calculation.productValue)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Duty Rate ({calculation.appliedRate.name})</span>
                          <span className="font-semibold">{formatPercentage(calculation.dutyRate)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Base Duty Amount</span>
                          <span className="font-semibold">{formatCurrency(calculation.dutyAmount)}</span>
                        </div>
                        
                        {calculation.additionalDuties.length > 0 && (
                          <>
                            <div className="border-t pt-2">
                              <p className="text-sm font-medium text-orange-600 mb-2">Additional Duties:</p>
                              {calculation.additionalDuties.map((duty, i) => (
                                <div key={i} className="flex justify-between items-center text-sm">
                                  <span className="text-gray-600">{duty.type}</span>
                                  <span className="font-semibold text-orange-600">+{formatCurrency(duty.amount)}</span>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                        
                        <div className="border-t pt-3">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 font-medium">Total Duty</span>
                            <span className="font-bold text-lg">{formatCurrency(calculation.totalDuty)}</span>
                          </div>
                        </div>
                        
                        <div className="bg-green-100 p-3 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="text-green-800 font-medium">Estimated Landed Cost</span>
                            <span className="font-bold text-xl text-green-700">
                              {formatCurrency(calculation.estimatedLandedCost)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Details Card */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Classification Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">HS Code</p>
                          <p className="font-mono font-semibold">{calculation.hsCode}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Rate Type</p>
                          <p className="font-semibold">{calculation.appliedRate.type.toUpperCase()}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-gray-500">Product Description</p>
                          <p className="font-semibold">{calculation.productDescription}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Origin</p>
                          <p className="font-semibold">
                            {countries.find(c => c.code === calculation.originCountry)?.name || calculation.originCountry}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Destination</p>
                          <p className="font-semibold">
                            {countries.find(c => c.code === calculation.destinationCountry)?.name || calculation.destinationCountry}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Warnings & Notes */}
                  {(calculation.warnings?.length || calculation.notes?.length) && (
                    <Card>
                      <CardContent className="pt-4 space-y-3">
                        {calculation.warnings?.map((warning, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm text-orange-700 bg-orange-50 p-3 rounded-lg">
                            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            {warning}
                          </div>
                        ))}
                        {calculation.notes?.map((note, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm text-blue-700 bg-blue-50 p-3 rounded-lg">
                            <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            {note}
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </>
              ) : (
                <Card className="bg-gray-50">
                  <CardContent className="py-12 text-center text-gray-500">
                    <Calculator className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p className="font-medium">Enter details to calculate duties</p>
                    <p className="text-sm mt-1">
                      Results will appear here after calculation
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Info Card */}
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3 text-sm text-gray-600">
                    <Info className="w-5 h-5 text-blue-500 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">Important Note</p>
                      <p className="mt-1">
                        This calculator provides estimates based on standard duty rates. 
                        Actual duties may vary based on specific product characteristics, 
                        trade agreement eligibility, and current regulations. 
                        Consult a licensed customs broker for official determinations.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Search Tab */}
        {activeTab === 'search' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  Search HS Codes
                </CardTitle>
                <CardDescription>
                  Search by product description or HS code number
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="e.g., laptop, smartphone, t-shirt, 8471..."
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="flex-1"
                  />
                  <Button onClick={handleSearch} disabled={isSearching}>
                    {isSearching ? 'Searching...' : 'Search'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">
                  Found {searchResults.length} results
                </h3>
                {searchResults.map((tariff) => (
                  <Card key={tariff.hsCode} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-lg font-bold text-blue-600">
                              {tariff.hsCode}
                            </span>
                            {tariff.generalRateType === 'free' && (
                              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                                Duty Free
                              </span>
                            )}
                          </div>
                          <p className="text-gray-700">{tariff.description}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
                            <span>
                              MFN Rate: <strong>{formatPercentage(tariff.generalRate)}</strong>
                            </span>
                            {tariff.preferentialRates.length > 0 && (
                              <span className="text-green-600">
                                {tariff.preferentialRates.length} preferential rate(s) available
                              </span>
                            )}
                            {tariff.additionalDuties && tariff.additionalDuties.length > 0 && (
                              <span className="text-orange-600">
                                Additional duties may apply
                              </span>
                            )}
                          </div>
                          {tariff.notes && (
                            <p className="text-xs text-gray-500 mt-1">{tariff.notes}</p>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => selectTariffForCalculation(tariff)}
                        >
                          Use for Calculation
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {searchQuery && searchResults.length === 0 && !isSearching && (
              <Card className="bg-gray-50">
                <CardContent className="py-8 text-center text-gray-500">
                  <Search className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p>No results found for "{searchQuery}"</p>
                  <p className="text-sm mt-1">Try a different search term or browse categories</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Browse Tab */}
        {activeTab === 'browse' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Harmonized System Categories
                </CardTitle>
                <CardDescription>
                  Browse HS code sections and chapters to find your product classification
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Sections */}
            <div className="space-y-2">
              {sections.map((section) => (
                <Card key={section.section} className="overflow-hidden">
                  <button
                    onClick={() => setExpandedSection(
                      expandedSection === section.section ? null : section.section
                    )}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-10 h-10 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center font-bold">
                        {section.section}
                      </span>
                      <div className="text-left">
                        <p className="font-medium">{section.name}</p>
                        <p className="text-sm text-gray-500">
                          Chapters {section.chapters[0]} - {section.chapters[1]}
                        </p>
                      </div>
                    </div>
                    {expandedSection === section.section ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                  
                  {expandedSection === section.section && (
                    <div className="border-t bg-gray-50 px-4 py-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {chapters
                          .filter(ch => ch.section === section.section)
                          .map((chapter) => (
                            <button
                              key={chapter.code}
                              onClick={() => {
                                setSearchQuery(chapter.code);
                                handleSearch();
                                setActiveTab('search');
                              }}
                              className="flex items-center gap-2 p-2 rounded hover:bg-white transition-colors text-left"
                            >
                              <span className="font-mono text-sm bg-gray-200 px-2 py-0.5 rounded">
                                {chapter.code}
                              </span>
                              <span className="text-sm text-gray-700">{chapter.description}</span>
                            </button>
                          ))}
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>

            {/* External Resources */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Official Resources</CardTitle>
                <CardDescription>
                  For official tariff rates and classifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <a
                    href="https://hts.usitc.gov/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Building2 className="w-8 h-8 text-blue-600" />
                    <div>
                      <p className="font-medium">USITC HTS</p>
                      <p className="text-sm text-gray-500">Official US Harmonized Tariff Schedule</p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-400 ml-auto" />
                  </a>
                  <a
                    href="https://ttd.wto.org/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Globe className="w-8 h-8 text-green-600" />
                    <div>
                      <p className="font-medium">WTO Tariff Data</p>
                      <p className="text-sm text-gray-500">World Trade Organization database</p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-400 ml-auto" />
                  </a>
                  <a
                    href="https://dataweb.usitc.gov/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Truck className="w-8 h-8 text-purple-600" />
                    <div>
                      <p className="font-medium">USITC DataWeb</p>
                      <p className="text-sm text-gray-500">US trade and tariff data</p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-400 ml-auto" />
                  </a>
                  <a
                    href="https://www.cbp.gov/trade/rulings"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <FileText className="w-8 h-8 text-orange-600" />
                    <div>
                      <p className="font-medium">CBP Rulings</p>
                      <p className="text-sm text-gray-500">Customs rulings and classifications</p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-400 ml-auto" />
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
