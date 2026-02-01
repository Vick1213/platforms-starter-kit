'use client';

import { useState } from 'react';
import { 
  Image as ImageIcon, 
  Play, 
  Layers, 
  Palette, 
  EyeOff,
  Plus,
  Trash2,
  GripVertical,
  Upload,
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FileUpload } from '@/components/ui/file-upload';
import { 
  HeroSettings, 
  HeroType, 
  HeroHeight,
  HeroSlide 
} from '@/lib/store-customization-types';

interface HeroEditorProps {
  hero: HeroSettings;
  onHeroChange: (hero: HeroSettings) => void;
}

const heroTypes: { id: HeroType; label: string; icon: React.ElementType; description: string }[] = [
  { id: 'gradient', label: 'Gradient', icon: Palette, description: 'Colorful gradient background' },
  { id: 'image', label: 'Image', icon: ImageIcon, description: 'Background image with overlay' },
  { id: 'video', label: 'Video', icon: Play, description: 'Background video (YouTube)' },
  { id: 'slideshow', label: 'Slideshow', icon: Layers, description: 'Multiple rotating slides' },
  { id: 'none', label: 'None', icon: EyeOff, description: 'No hero section' },
];

const heroHeights: { id: HeroHeight; label: string; px: string }[] = [
  { id: 'small', label: 'Small', px: '200px' },
  { id: 'medium', label: 'Medium', px: '350px' },
  { id: 'large', label: 'Large', px: '500px' },
  { id: 'full', label: 'Full Screen', px: '100vh' },
];

export function HeroEditor({ hero, onHeroChange }: HeroEditorProps) {
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  const updateHero = (updates: Partial<HeroSettings>) => {
    onHeroChange({ ...hero, ...updates });
  };

  const updateContent = (updates: Partial<HeroSettings['content']>) => {
    onHeroChange({
      ...hero,
      content: { ...hero.content, ...updates },
    });
  };

  const addSlide = () => {
    const newSlide: HeroSlide = {
      id: `slide-${Date.now()}`,
      image: '',
      title: 'New Slide',
      subtitle: 'Slide description',
      cta: { text: 'Learn More', link: '/products' },
    };
    updateHero({ slides: [...(hero.slides || []), newSlide] });
    setActiveSlideIndex((hero.slides || []).length);
  };

  const updateSlide = (index: number, updates: Partial<HeroSlide>) => {
    const newSlides = [...(hero.slides || [])];
    newSlides[index] = { ...newSlides[index], ...updates };
    updateHero({ slides: newSlides });
  };

  const removeSlide = (index: number) => {
    const newSlides = (hero.slides || []).filter((_, i) => i !== index);
    updateHero({ slides: newSlides });
    if (activeSlideIndex >= newSlides.length) {
      setActiveSlideIndex(Math.max(0, newSlides.length - 1));
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Type Selection */}
      <div>
        <Label className="mb-3 block">Hero Style</Label>
        <div className="grid grid-cols-5 gap-2">
          {heroTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => updateHero({ type: type.id })}
              className={`p-3 border rounded-lg text-center transition-all ${
                hero.type === type.id
                  ? 'border-orange-500 bg-orange-50 text-orange-600'
                  : 'hover:border-gray-300'
              }`}
            >
              <type.icon className="w-5 h-5 mx-auto mb-1" />
              <span className="text-xs font-medium">{type.label}</span>
            </button>
          ))}
        </div>
      </div>

      {hero.type !== 'none' && (
        <>
          {/* Hero Height */}
          <div>
            <Label className="mb-3 block">Height</Label>
            <div className="grid grid-cols-4 gap-2">
              {heroHeights.map((h) => (
                <button
                  key={h.id}
                  onClick={() => updateHero({ height: h.id })}
                  className={`p-3 border rounded-lg text-center transition-all ${
                    hero.height === h.id
                      ? 'border-orange-500 bg-orange-50 text-orange-600'
                      : 'hover:border-gray-300'
                  }`}
                >
                  <span className="text-sm font-medium">{h.label}</span>
                  <span className="text-xs text-gray-500 block">{h.px}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Gradient Settings */}
          {hero.type === 'gradient' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Gradient Start</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={hero.gradientStart || '#f97316'}
                    onChange={(e) => updateHero({ gradientStart: e.target.value })}
                    className="w-10 h-10 rounded border cursor-pointer"
                  />
                  <Input
                    value={hero.gradientStart || '#f97316'}
                    onChange={(e) => updateHero({ gradientStart: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Gradient End</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={hero.gradientEnd || '#fbbf24'}
                    onChange={(e) => updateHero({ gradientEnd: e.target.value })}
                    className="w-10 h-10 rounded border cursor-pointer"
                  />
                  <Input
                    value={hero.gradientEnd || '#fbbf24'}
                    onChange={(e) => updateHero({ gradientEnd: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Image Settings */}
          {hero.type === 'image' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Background Image</Label>
                {hero.backgroundImage ? (
                  <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                    <img 
                      src={hero.backgroundImage} 
                      alt="Hero background" 
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => updateHero({ backgroundImage: '' })}
                      className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <FileUpload
                    type="store-banner"
                    accept="image"
                    buttonText="Upload Hero Image"
                    showPreview={false}
                    onUpload={(result) => {
                      if (result.success && result.url) {
                        updateHero({ backgroundImage: result.url });
                      }
                    }}
                    onError={(error) => console.error(error)}
                  />
                )}
              </div>
              <div className="space-y-2">
                <Label>Overlay Opacity: {Math.round((hero.overlayOpacity || 0.5) * 100)}%</Label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={hero.overlayOpacity || 0.5}
                  onChange={(e) => updateHero({ overlayOpacity: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>
            </div>
          )}

          {/* Video Settings */}
          {hero.type === 'video' && (
            <div className="space-y-2">
              <Label>Video URL (YouTube or Vimeo)</Label>
              <Input
                value={hero.backgroundVideo || ''}
                onChange={(e) => updateHero({ backgroundVideo: e.target.value })}
                placeholder="https://www.youtube.com/watch?v=..."
              />
              <p className="text-xs text-gray-500">Paste a YouTube or Vimeo video URL</p>
            </div>
          )}

          {/* Slideshow Settings */}
          {hero.type === 'slideshow' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Slides ({(hero.slides || []).length})</Label>
                <Button onClick={addSlide} variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  Add Slide
                </Button>
              </div>

              {(hero.slides || []).length > 0 && (
                <div className="space-y-4">
                  {/* Slide Thumbnails */}
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {(hero.slides || []).map((slide, index) => (
                      <button
                        key={slide.id}
                        onClick={() => setActiveSlideIndex(index)}
                        className={`relative flex-shrink-0 w-24 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                          activeSlideIndex === index
                            ? 'border-orange-500'
                            : 'border-transparent hover:border-gray-300'
                        }`}
                      >
                        {slide.image ? (
                          <img src={slide.image} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                            <ImageIcon className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                        <span className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1 rounded">
                          {index + 1}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Active Slide Editor */}
                  {hero.slides && hero.slides[activeSlideIndex] && (
                    <div className="border rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Slide {activeSlideIndex + 1}</span>
                        <button
                          onClick={() => removeSlide(activeSlideIndex)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Slide Image</Label>
                        {hero.slides[activeSlideIndex].image ? (
                          <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                            <img 
                              src={hero.slides[activeSlideIndex].image} 
                              alt="" 
                              className="w-full h-full object-cover"
                            />
                            <button
                              onClick={() => updateSlide(activeSlideIndex, { image: '' })}
                              className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded hover:bg-red-600"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <FileUpload
                            type="store-banner"
                            accept="image"
                            buttonText="Upload Slide Image"
                            showPreview={false}
                            onUpload={(result) => {
                              if (result.success && result.url) {
                                updateSlide(activeSlideIndex, { image: result.url });
                              }
                            }}
                            onError={(error) => console.error(error)}
                          />
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>Slide Title</Label>
                        <Input
                          value={hero.slides[activeSlideIndex].title}
                          onChange={(e) => updateSlide(activeSlideIndex, { title: e.target.value })}
                          placeholder="Slide title"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Slide Subtitle</Label>
                        <Input
                          value={hero.slides[activeSlideIndex].subtitle}
                          onChange={(e) => updateSlide(activeSlideIndex, { subtitle: e.target.value })}
                          placeholder="Slide subtitle"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Content Settings (for non-slideshow types) */}
          {hero.type !== 'slideshow' && (
            <>
              <div className="space-y-4 pt-4 border-t">
                <h4 className="font-medium text-gray-900">Hero Content</h4>
                
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={hero.content.title}
                    onChange={(e) => updateContent({ title: e.target.value })}
                    placeholder="Welcome to Our Store"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Subtitle</Label>
                  <textarea
                    value={hero.content.subtitle}
                    onChange={(e) => updateContent({ subtitle: e.target.value })}
                    placeholder="Discover amazing products at great prices"
                    className="w-full min-h-[80px] px-3 py-2 border rounded-md text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Button Text</Label>
                    <Input
                      value={hero.content.cta?.text || ''}
                      onChange={(e) => updateContent({ 
                        cta: { ...hero.content.cta, text: e.target.value, link: hero.content.cta?.link || '/products' }
                      })}
                      placeholder="Shop Now"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Button Link</Label>
                    <Input
                      value={hero.content.cta?.link || ''}
                      onChange={(e) => updateContent({ 
                        cta: { ...hero.content.cta, link: e.target.value, text: hero.content.cta?.text || 'Shop Now' }
                      })}
                      placeholder="/products"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Text Alignment</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['left', 'center', 'right'] as const).map((align) => (
                      <button
                        key={align}
                        onClick={() => updateHero({ textAlignment: align })}
                        className={`p-2 border rounded-lg text-sm capitalize transition-all ${
                          hero.textAlignment === align
                            ? 'border-orange-500 bg-orange-50 text-orange-600'
                            : 'hover:border-gray-300'
                        }`}
                      >
                        {align}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
