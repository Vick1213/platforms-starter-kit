'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
  ColorPalette, 
  TypographySettings, 
  availableFonts,
  FontFamily,
  FontSize 
} from '@/lib/store-customization-types';

interface ColorEditorProps {
  colors: ColorPalette;
  onColorsChange: (colors: ColorPalette) => void;
}

interface TypographyEditorProps {
  typography: TypographySettings;
  onTypographyChange: (typography: TypographySettings) => void;
}

const colorLabels: Record<keyof ColorPalette, string> = {
  primary: 'Primary Color',
  secondary: 'Secondary Color',
  accent: 'Accent Color',
  background: 'Background',
  headerBackground: 'Header Background',
  footerBackground: 'Footer Background',
  text: 'Text Color',
  textMuted: 'Muted Text',
  border: 'Border Color',
};

const colorDescriptions: Record<keyof ColorPalette, string> = {
  primary: 'Main brand color for buttons and highlights',
  secondary: 'Secondary color for accents',
  accent: 'Used for gradients and hover states',
  background: 'Page background color',
  headerBackground: 'Header section background',
  footerBackground: 'Footer section background',
  text: 'Main text color',
  textMuted: 'Secondary text and descriptions',
  border: 'Border and divider color',
};

export function ColorEditor({ colors, onColorsChange }: ColorEditorProps) {
  const handleColorChange = (key: keyof ColorPalette, value: string) => {
    onColorsChange({ ...colors, [key]: value });
  };

  // Group colors logically
  const brandColors: (keyof ColorPalette)[] = ['primary', 'secondary', 'accent'];
  const layoutColors: (keyof ColorPalette)[] = ['background', 'headerBackground', 'footerBackground'];
  const textColors: (keyof ColorPalette)[] = ['text', 'textMuted', 'border'];

  return (
    <div className="space-y-6">
      {/* Brand Colors */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Brand Colors</h4>
        <div className="grid grid-cols-3 gap-4">
          {brandColors.map((key) => (
            <div key={key} className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={colors[key]}
                  onChange={(e) => handleColorChange(key, e.target.value)}
                  className="w-8 h-8 rounded border cursor-pointer"
                />
                <div>
                  <Label className="text-xs">{colorLabels[key]}</Label>
                </div>
              </div>
              <Input
                type="text"
                value={colors[key]}
                onChange={(e) => handleColorChange(key, e.target.value)}
                className="h-8 text-xs font-mono"
                placeholder="#000000"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Layout Colors */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Layout Colors</h4>
        <div className="grid grid-cols-3 gap-4">
          {layoutColors.map((key) => (
            <div key={key} className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={colors[key]}
                  onChange={(e) => handleColorChange(key, e.target.value)}
                  className="w-8 h-8 rounded border cursor-pointer"
                />
                <div>
                  <Label className="text-xs">{colorLabels[key]}</Label>
                </div>
              </div>
              <Input
                type="text"
                value={colors[key]}
                onChange={(e) => handleColorChange(key, e.target.value)}
                className="h-8 text-xs font-mono"
                placeholder="#000000"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Text Colors */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Text & Borders</h4>
        <div className="grid grid-cols-3 gap-4">
          {textColors.map((key) => (
            <div key={key} className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={colors[key]}
                  onChange={(e) => handleColorChange(key, e.target.value)}
                  className="w-8 h-8 rounded border cursor-pointer"
                />
                <div>
                  <Label className="text-xs">{colorLabels[key]}</Label>
                </div>
              </div>
              <Input
                type="text"
                value={colors[key]}
                onChange={(e) => handleColorChange(key, e.target.value)}
                className="h-8 text-xs font-mono"
                placeholder="#000000"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Color Preview */}
      <div className="mt-6 p-4 border rounded-lg bg-gray-50">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Color Preview</h4>
        <div className="flex gap-2 flex-wrap">
          {Object.entries(colors).map(([key, value]) => (
            <div 
              key={key}
              className="flex flex-col items-center"
              title={colorLabels[key as keyof ColorPalette]}
            >
              <div 
                className="w-10 h-10 rounded-lg shadow-sm border"
                style={{ backgroundColor: value }}
              />
              <span className="text-[10px] text-gray-500 mt-1">{key}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function TypographyEditor({ typography, onTypographyChange }: TypographyEditorProps) {
  const handleFontChange = (key: 'headingFont' | 'bodyFont', value: FontFamily) => {
    onTypographyChange({ ...typography, [key]: value });
  };

  const handleSizeChange = (value: FontSize) => {
    onTypographyChange({ ...typography, baseFontSize: value });
  };

  return (
    <div className="space-y-6">
      {/* Font Selection */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Heading Font</Label>
          <select
            value={typography.headingFont}
            onChange={(e) => handleFontChange('headingFont', e.target.value as FontFamily)}
            className="w-full px-3 py-2 border rounded-md text-sm"
          >
            <optgroup label="Sans-serif">
              {availableFonts
                .filter((f) => f.category === 'sans-serif')
                .map((font) => (
                  <option key={font.value} value={font.value}>
                    {font.label}
                  </option>
                ))}
            </optgroup>
            <optgroup label="Serif">
              {availableFonts
                .filter((f) => f.category === 'serif')
                .map((font) => (
                  <option key={font.value} value={font.value}>
                    {font.label}
                  </option>
                ))}
            </optgroup>
          </select>
        </div>

        <div className="space-y-2">
          <Label>Body Font</Label>
          <select
            value={typography.bodyFont}
            onChange={(e) => handleFontChange('bodyFont', e.target.value as FontFamily)}
            className="w-full px-3 py-2 border rounded-md text-sm"
          >
            <optgroup label="Sans-serif">
              {availableFonts
                .filter((f) => f.category === 'sans-serif')
                .map((font) => (
                  <option key={font.value} value={font.value}>
                    {font.label}
                  </option>
                ))}
            </optgroup>
            <optgroup label="Serif">
              {availableFonts
                .filter((f) => f.category === 'serif')
                .map((font) => (
                  <option key={font.value} value={font.value}>
                    {font.label}
                  </option>
                ))}
            </optgroup>
          </select>
        </div>
      </div>

      {/* Font Size */}
      <div className="space-y-2">
        <Label>Base Font Size</Label>
        <div className="grid grid-cols-3 gap-3">
          {(['small', 'medium', 'large'] as FontSize[]).map((size) => (
            <button
              key={size}
              onClick={() => handleSizeChange(size)}
              className={`p-3 border rounded-lg text-center capitalize transition-colors ${
                typography.baseFontSize === size
                  ? 'border-orange-500 bg-orange-50 text-orange-600'
                  : 'hover:border-gray-300'
              }`}
            >
              <span className={`block ${
                size === 'small' ? 'text-sm' : size === 'large' ? 'text-lg' : 'text-base'
              }`}>
                Aa
              </span>
              <span className="text-xs text-gray-500">{size}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Typography Preview */}
      <div className="mt-6 p-4 border rounded-lg bg-gray-50">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Preview</h4>
        <link 
          href={`https://fonts.googleapis.com/css2?family=${typography.headingFont.replace(/ /g, '+')}:wght@700&family=${typography.bodyFont.replace(/ /g, '+')}:wght@400;500&display=swap`}
          rel="stylesheet"
        />
        <div 
          className={`${
            typography.baseFontSize === 'small' ? 'text-sm' : 
            typography.baseFontSize === 'large' ? 'text-lg' : 
            'text-base'
          }`}
        >
          <h3 
            className="text-2xl font-bold text-gray-900 mb-2"
            style={{ fontFamily: `'${typography.headingFont}', sans-serif` }}
          >
            This is a Heading
          </h3>
          <p 
            className="text-gray-600"
            style={{ fontFamily: `'${typography.bodyFont}', sans-serif` }}
          >
            This is body text that demonstrates how your content will look with the selected fonts. 
            The quick brown fox jumps over the lazy dog.
          </p>
        </div>
      </div>
    </div>
  );
}
