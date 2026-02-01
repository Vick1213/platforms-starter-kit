'use client';

import { useState } from 'react';
import { 
  GripVertical, 
  Eye, 
  EyeOff, 
  Settings, 
  Trash2, 
  Plus,
  ChevronDown,
  ChevronUp,
  ShoppingBag,
  Grid,
  MessageCircle,
  Info,
  Shield,
  Megaphone,
  Play,
  Images,
  HelpCircle,
  Mail,
  Send,
  Code,
} from 'lucide-react';
import { 
  HomepageSection, 
  SectionType, 
  sectionTypeConfig 
} from '@/lib/store-customization-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SectionBuilderProps {
  sections: HomepageSection[];
  onSectionsChange: (sections: HomepageSection[]) => void;
}

const sectionIcons: Record<SectionType, React.ElementType> = {
  'hero': Images,
  'featured-products': ShoppingBag,
  'categories': Grid,
  'testimonials': MessageCircle,
  'about-block': Info,
  'trust-badges': Shield,
  'cta-banner': Megaphone,
  'video-embed': Play,
  'image-gallery': Images,
  'faq': HelpCircle,
  'newsletter': Mail,
  'contact-form': Send,
  'custom-html': Code,
};

const availableSections: SectionType[] = [
  'featured-products',
  'trust-badges',
  'about-block',
  'testimonials',
  'newsletter',
  'faq',
  'categories',
  'cta-banner',
  'video-embed',
  'image-gallery',
  'contact-form',
];

export function SectionBuilder({ sections, onSectionsChange }: SectionBuilderProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newSections = [...sections];
    const [draggedSection] = newSections.splice(draggedIndex, 1);
    newSections.splice(index, 0, draggedSection);
    
    // Update order values
    newSections.forEach((section, i) => {
      section.order = i;
    });

    onSectionsChange(newSections);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const toggleSectionVisibility = (sectionId: string) => {
    const newSections = sections.map(section =>
      section.id === sectionId
        ? { ...section, enabled: !section.enabled }
        : section
    );
    onSectionsChange(newSections);
  };

  const updateSectionTitle = (sectionId: string, title: string) => {
    const newSections = sections.map(section =>
      section.id === sectionId
        ? { ...section, title }
        : section
    );
    onSectionsChange(newSections);
  };

  const updateSectionSettings = (sectionId: string, settings: Record<string, unknown>) => {
    const newSections = sections.map(section =>
      section.id === sectionId
        ? { ...section, settings: { ...section.settings, ...settings } }
        : section
    );
    onSectionsChange(newSections);
  };

  const removeSection = (sectionId: string) => {
    const newSections = sections.filter(section => section.id !== sectionId);
    newSections.forEach((section, i) => {
      section.order = i;
    });
    onSectionsChange(newSections);
  };

  const addSection = (type: SectionType) => {
    const config = sectionTypeConfig[type];
    const newSection: HomepageSection = {
      id: `${type}-${Date.now()}`,
      type,
      enabled: true,
      order: sections.length,
      title: config.label,
      settings: {},
    };
    onSectionsChange([...sections, newSection]);
    setShowAddModal(false);
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === sections.length - 1)
    ) {
      return;
    }

    const newSections = [...sections];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [newSections[index], newSections[newIndex]] = [newSections[newIndex], newSections[index]];
    
    newSections.forEach((section, i) => {
      section.order = i;
    });

    onSectionsChange(newSections);
  };

  const sortedSections = [...sections].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">Homepage Sections</h3>
          <p className="text-sm text-gray-500">Drag to reorder, toggle visibility, customize each section</p>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Section
        </Button>
      </div>

      {/* Section List */}
      <div className="space-y-2">
        {sortedSections.map((section, index) => {
          const Icon = sectionIcons[section.type] || Info;
          const config = sectionTypeConfig[section.type];
          const isExpanded = expandedSection === section.id;

          return (
            <div
              key={section.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`border rounded-lg bg-white transition-all ${
                draggedIndex === index ? 'opacity-50 scale-[0.98]' : ''
              } ${!section.enabled ? 'opacity-60' : ''}`}
            >
              {/* Section Header */}
              <div className="flex items-center gap-3 p-3">
                <div className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600">
                  <GripVertical className="w-5 h-5" />
                </div>

                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  section.enabled ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-400'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className={`font-medium truncate ${section.enabled ? 'text-gray-900' : 'text-gray-500'}`}>
                    {section.title || config.label}
                  </h4>
                  <p className="text-xs text-gray-500">{config.description}</p>
                </div>

                <div className="flex items-center gap-1">
                  {/* Move Buttons */}
                  <button
                    onClick={() => moveSection(index, 'up')}
                    disabled={index === 0}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30"
                    title="Move up"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => moveSection(index, 'down')}
                    disabled={index === sortedSections.length - 1}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30"
                    title="Move down"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  {/* Visibility Toggle */}
                  <button
                    onClick={() => toggleSectionVisibility(section.id)}
                    className={`p-1.5 rounded transition-colors ${
                      section.enabled
                        ? 'text-green-600 hover:bg-green-50'
                        : 'text-gray-400 hover:bg-gray-100'
                    }`}
                    title={section.enabled ? 'Hide section' : 'Show section'}
                  >
                    {section.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>

                  {/* Settings Toggle */}
                  <button
                    onClick={() => setExpandedSection(isExpanded ? null : section.id)}
                    className={`p-1.5 rounded transition-colors ${
                      isExpanded ? 'bg-orange-100 text-orange-600' : 'text-gray-400 hover:bg-gray-100'
                    }`}
                    title="Settings"
                  >
                    <Settings className="w-4 h-4" />
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={() => removeSection(section.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                    title="Remove section"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Expanded Settings */}
              {isExpanded && (
                <div className="border-t px-4 py-4 bg-gray-50 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor={`${section.id}-title`}>Section Title</Label>
                    <Input
                      id={`${section.id}-title`}
                      value={section.title || ''}
                      onChange={(e) => updateSectionTitle(section.id, e.target.value)}
                      placeholder={config.label}
                    />
                  </div>

                  {/* Section-specific settings */}
                  {section.type === 'featured-products' && (
                    <div className="space-y-2">
                      <Label>Number of products</Label>
                      <select
                        value={(section.settings.count as number) || 8}
                        onChange={(e) => updateSectionSettings(section.id, { count: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border rounded-md text-sm"
                      >
                        <option value="4">4 products</option>
                        <option value="8">8 products</option>
                        <option value="12">12 products</option>
                        <option value="16">16 products</option>
                      </select>
                    </div>
                  )}

                  {section.type === 'cta-banner' && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Banner Text</Label>
                        <Input
                          value={(section.settings.text as string) || ''}
                          onChange={(e) => updateSectionSettings(section.id, { text: e.target.value })}
                          placeholder="Get 20% off your first order!"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Button Text</Label>
                          <Input
                            value={(section.settings.buttonText as string) || ''}
                            onChange={(e) => updateSectionSettings(section.id, { buttonText: e.target.value })}
                            placeholder="Shop Now"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Button Link</Label>
                          <Input
                            value={(section.settings.buttonLink as string) || ''}
                            onChange={(e) => updateSectionSettings(section.id, { buttonLink: e.target.value })}
                            placeholder="/products"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {section.type === 'video-embed' && (
                    <div className="space-y-2">
                      <Label>Video URL (YouTube or Vimeo)</Label>
                      <Input
                        value={(section.settings.videoUrl as string) || ''}
                        onChange={(e) => updateSectionSettings(section.id, { videoUrl: e.target.value })}
                        placeholder="https://youtube.com/watch?v=..."
                      />
                    </div>
                  )}

                  {section.type === 'custom-html' && (
                    <div className="space-y-2">
                      <Label>Custom HTML</Label>
                      <textarea
                        value={(section.settings.html as string) || ''}
                        onChange={(e) => updateSectionSettings(section.id, { html: e.target.value })}
                        placeholder="<div>Your custom HTML here...</div>"
                        className="w-full min-h-[120px] px-3 py-2 border rounded-md text-sm font-mono"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {sections.length === 0 && (
        <div className="text-center py-8 border-2 border-dashed rounded-lg">
          <p className="text-gray-500 mb-4">No sections added yet</p>
          <Button onClick={() => setShowAddModal(true)} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Add your first section
          </Button>
        </div>
      )}

      {/* Add Section Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Add Section</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              <div className="grid grid-cols-2 gap-3">
                {availableSections.map((type) => {
                  const config = sectionTypeConfig[type];
                  const Icon = sectionIcons[type];
                  const alreadyAdded = sections.some(s => s.type === type);

                  return (
                    <button
                      key={type}
                      onClick={() => addSection(type)}
                      disabled={alreadyAdded}
                      className={`p-4 border rounded-lg text-left transition-all ${
                        alreadyAdded
                          ? 'opacity-50 cursor-not-allowed bg-gray-50'
                          : 'hover:border-orange-500 hover:bg-orange-50'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-gray-600" />
                        </div>
                        <span className="font-medium text-gray-900">{config.label}</span>
                      </div>
                      <p className="text-xs text-gray-500">{config.description}</p>
                      {alreadyAdded && (
                        <p className="text-xs text-orange-600 mt-2">Already added</p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
