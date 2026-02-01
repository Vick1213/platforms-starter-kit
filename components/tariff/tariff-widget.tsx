'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Calculator, 
  DollarSign, 
  Globe,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Info,
} from 'lucide-react';

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

interface TariffWidgetProps {
  defaultHsCode?: string;
  defaultOriginCountry?: string;
  productName?: string;
  productPrice?: number;
  accentColor?: string;
  compact?: boolean;
}

// Common countries for the widget
const COMMON_COUNTRIES = [
  { code: 'CN', name: 'China' },
  { code: 'US', name: 'United States' },
  { code: 'MX', name: 'Mexico' },
  { code: 'CA', name: 'Canada' },
  { code: 'JP', name: 'Japan' },
  { code: 'DE', name: 'Germany' },
  { code: 'KR', name: 'South Korea' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'IN', name: 'India' },
  { code: 'VN', name: 'Vietnam' },
  { code: 'TW', name: 'Taiwan' },
  { code: 'TH', name: 'Thailand' },
  { code: 'IT', name: 'Italy' },
  { code: 'FR', name: 'France' },
];

export function TariffWidget({
  defaultHsCode = '',
  defaultOriginCountry = 'CN',
  productName,
  productPrice,
  accentColor = '#3b82f6',
  compact = false,
}: TariffWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [hsCode, setHsCode] = useState(defaultHsCode);
  const [originCountry, setOriginCountry] = useState(defaultOriginCountry);
  const [destinationCountry, setDestinationCountry] = useState('US');
  const [productValue, setProductValue] = useState(productPrice?.toString() || '');
  const [calculation, setCalculation] = useState<TariffCalculation | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleCalculate() {
    if (!hsCode || !productValue) {
      setError('Please enter HS code and product value');
      return;
    }

    setIsLoading(true);
    setError('');

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
        }),
      });

      const data = await res.json();
      
      if (data.error) {
        setError(data.error);
        setCalculation(null);
      } else {
        setCalculation(data.calculation);
      }
    } catch {
      setError('Failed to calculate tariff');
    } finally {
      setIsLoading(false);
    }
  }

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }

  if (compact && !isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="w-full flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
        style={{ borderColor: accentColor }}
      >
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5" style={{ color: accentColor }} />
          <span className="font-medium">Calculate Import Duties</span>
        </div>
        <ChevronDown className="w-5 h-5 text-gray-400" />
      </button>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden" style={{ borderColor: accentColor }}>
      {/* Header */}
      <div 
        className="p-3 text-white flex items-center justify-between"
        style={{ backgroundColor: accentColor }}
      >
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5" />
          <span className="font-medium">Import Duty Calculator</span>
        </div>
        {compact && (
          <button onClick={() => setIsExpanded(false)}>
            <ChevronUp className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* Product Info */}
        {productName && (
          <div className="text-sm text-gray-600">
            Calculating duties for: <strong>{productName}</strong>
          </div>
        )}

        {/* Inputs */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">HS Code</Label>
            <Input
              value={hsCode}
              onChange={(e) => setHsCode(e.target.value)}
              placeholder="e.g., 8471.30"
              className="font-mono text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Product Value (USD)</Label>
            <div className="relative">
              <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="number"
                value={productValue}
                onChange={(e) => setProductValue(e.target.value)}
                placeholder="0.00"
                className="pl-7 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs flex items-center gap-1">
              <Globe className="w-3 h-3" />
              Origin Country
            </Label>
            <select
              value={originCountry}
              onChange={(e) => setOriginCountry(e.target.value)}
              className="w-full px-2 py-1.5 text-sm border rounded-md"
            >
              {COMMON_COUNTRIES.map(c => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs flex items-center gap-1">
              <Globe className="w-3 h-3" />
              Destination
            </Label>
            <select
              value={destinationCountry}
              onChange={(e) => setDestinationCountry(e.target.value)}
              className="w-full px-2 py-1.5 text-sm border rounded-md"
            >
              <option value="US">United States</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="p-2 bg-red-50 text-red-700 text-sm rounded flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            {error}
          </div>
        )}

        <Button
          onClick={handleCalculate}
          disabled={isLoading}
          className="w-full"
          style={{ backgroundColor: accentColor }}
        >
          {isLoading ? 'Calculating...' : 'Calculate Duties'}
        </Button>

        {/* Results */}
        {calculation && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg space-y-2">
            <div className="text-sm">
              <span className="text-gray-600">Product:</span>{' '}
              <span className="font-medium">{calculation.productDescription}</span>
            </div>
            <div className="text-sm">
              <span className="text-gray-600">Rate Applied:</span>{' '}
              <span className="font-medium">{calculation.appliedRate.name}</span>
              <span className="ml-1 text-gray-500">({calculation.dutyRate.toFixed(2)}%)</span>
            </div>
            
            <div className="border-t pt-2 mt-2 space-y-1">
              <div className="flex justify-between text-sm">
                <span>Product Value</span>
                <span>{formatCurrency(calculation.productValue)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Import Duty</span>
                <span>{formatCurrency(calculation.dutyAmount)}</span>
              </div>
              {calculation.additionalDuties.map((duty, i) => (
                <div key={i} className="flex justify-between text-sm text-orange-600">
                  <span>{duty.type}</span>
                  <span>+{formatCurrency(duty.amount)}</span>
                </div>
              ))}
              <div className="flex justify-between font-bold pt-1 border-t">
                <span>Est. Landed Cost</span>
                <span style={{ color: accentColor }}>
                  {formatCurrency(calculation.estimatedLandedCost)}
                </span>
              </div>
            </div>

            {calculation.warnings && calculation.warnings.length > 0 && (
              <div className="text-xs text-orange-600 flex items-start gap-1 mt-2">
                <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                {calculation.warnings[0]}
              </div>
            )}
          </div>
        )}

        {/* Disclaimer */}
        <div className="text-xs text-gray-500 flex items-start gap-1">
          <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
          Estimates only. Actual duties may vary. Consult a customs broker.
        </div>
      </div>
    </div>
  );
}

export default TariffWidget;
