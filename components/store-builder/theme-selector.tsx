'use client';

import { Check, Palette } from 'lucide-react';
import { 
  ThemeTemplate, 
  StoreCustomization, 
  themePresets,
  defaultStoreCustomization 
} from '@/lib/store-customization-types';

interface ThemeSelectorProps {
  currentTheme: ThemeTemplate;
  onThemeChange: (theme: ThemeTemplate, customization: Partial<StoreCustomization>) => void;
}

const themes: { id: ThemeTemplate; name: string; description: string; preview: { primary: string; secondary: string; accent: string } }[] = [
  {
    id: 'modern',
    name: 'Modern',
    description: 'Clean and contemporary with vibrant orange accents',
    preview: { primary: '#f97316', secondary: '#1f2937', accent: '#fbbf24' },
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Simple and elegant with black and white palette',
    preview: { primary: '#000000', secondary: '#374151', accent: '#6b7280' },
  },
  {
    id: 'bold',
    name: 'Bold',
    description: 'Strong presence with dark header and red accents',
    preview: { primary: '#dc2626', secondary: '#111827', accent: '#fbbf24' },
  },
  {
    id: 'elegant',
    name: 'Elegant',
    description: 'Sophisticated with purple tones and serif fonts',
    preview: { primary: '#7c3aed', secondary: '#1f2937', accent: '#a78bfa' },
  },
  {
    id: 'traditional',
    name: 'Traditional',
    description: 'Professional B2B look with blue corporate colors',
    preview: { primary: '#1e40af', secondary: '#1f2937', accent: '#3b82f6' },
  },
  {
    id: 'custom',
    name: 'Custom',
    description: 'Start from scratch with your own colors',
    preview: { primary: '#f97316', secondary: '#1f2937', accent: '#fbbf24' },
  },
];

export function ThemeSelector({ currentTheme, onThemeChange }: ThemeSelectorProps) {
  const handleThemeSelect = (themeId: ThemeTemplate) => {
    const preset = themePresets[themeId];
    onThemeChange(themeId, { 
      theme: themeId,
      ...preset,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Palette className="w-5 h-5 text-orange-600" />
        <h3 className="font-semibold text-gray-900">Choose a Theme</h3>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {themes.map((theme) => (
          <button
            key={theme.id}
            onClick={() => handleThemeSelect(theme.id)}
            className={`relative p-4 rounded-xl border-2 text-left transition-all hover:shadow-md ${
              currentTheme === theme.id
                ? 'border-orange-500 bg-orange-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {/* Color Preview */}
            <div className="flex gap-1 mb-3">
              <div 
                className="w-8 h-8 rounded-lg shadow-sm"
                style={{ backgroundColor: theme.preview.primary }}
              />
              <div 
                className="w-8 h-8 rounded-lg shadow-sm"
                style={{ backgroundColor: theme.preview.secondary }}
              />
              <div 
                className="w-8 h-8 rounded-lg shadow-sm"
                style={{ backgroundColor: theme.preview.accent }}
              />
            </div>
            
            {/* Theme Info */}
            <h4 className="font-medium text-gray-900">{theme.name}</h4>
            <p className="text-xs text-gray-500 mt-1">{theme.description}</p>
            
            {/* Selected Indicator */}
            {currentTheme === theme.id && (
              <div className="absolute top-2 right-2 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
