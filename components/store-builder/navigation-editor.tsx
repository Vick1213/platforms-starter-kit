'use client';

import { useState } from 'react';
import { 
  GripVertical, 
  Eye, 
  EyeOff, 
  Trash2, 
  Plus,
  ChevronUp,
  ChevronDown,
  Link as LinkIcon,
  Edit2,
  Check,
  X,
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { NavigationItem } from '@/lib/store-customization-types';

interface NavigationEditorProps {
  navigation: NavigationItem[];
  onNavigationChange: (navigation: NavigationItem[]) => void;
}

const defaultLinks: { label: string; href: string }[] = [
  { label: 'Home', href: '/' },
  { label: 'All Products', href: '/products' },
  { label: 'Categories', href: '/categories' },
  { label: 'About Us', href: '/about' },
  { label: 'Contact', href: '/contact' },
  { label: 'FAQ', href: '/faq' },
];

export function NavigationEditor({ navigation, onNavigationChange }: NavigationEditorProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editHref, setEditHref] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newHref, setNewHref] = useState('');

  const startEdit = (item: NavigationItem) => {
    setEditingId(item.id);
    setEditLabel(item.label);
    setEditHref(item.href);
  };

  const saveEdit = () => {
    if (!editingId) return;
    
    const updated = navigation.map(item =>
      item.id === editingId
        ? { ...item, label: editLabel, href: editHref }
        : item
    );
    onNavigationChange(updated);
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const toggleVisibility = (id: string) => {
    const updated = navigation.map(item =>
      item.id === id ? { ...item, visible: !item.visible } : item
    );
    onNavigationChange(updated);
  };

  const removeItem = (id: string) => {
    onNavigationChange(navigation.filter(item => item.id !== id));
  };

  const addItem = () => {
    if (!newLabel.trim() || !newHref.trim()) return;

    const newItem: NavigationItem = {
      id: `nav-${Date.now()}`,
      label: newLabel.trim(),
      href: newHref.trim(),
      visible: true,
    };
    onNavigationChange([...navigation, newItem]);
    setNewLabel('');
    setNewHref('');
    setShowAddForm(false);
  };

  const addDefaultLink = (link: { label: string; href: string }) => {
    const exists = navigation.some(n => n.href === link.href);
    if (exists) return;

    const newItem: NavigationItem = {
      id: `nav-${Date.now()}`,
      label: link.label,
      href: link.href,
      visible: true,
    };
    onNavigationChange([...navigation, newItem]);
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === navigation.length - 1)
    ) {
      return;
    }

    const newNav = [...navigation];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [newNav[index], newNav[newIndex]] = [newNav[newIndex], newNav[index]];
    onNavigationChange(newNav);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label>Navigation Menu</Label>
          <p className="text-sm text-gray-500">Manage the links in your store's navigation bar</p>
        </div>
        <Button
          onClick={() => setShowAddForm(true)}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Link
        </Button>
      </div>

      {/* Navigation Items List */}
      <div className="space-y-2">
        {navigation.map((item, index) => (
          <div
            key={item.id}
            className={`flex items-center gap-3 p-3 border rounded-lg bg-white ${
              !item.visible ? 'opacity-60' : ''
            }`}
          >
            <div className="text-gray-400 cursor-grab">
              <GripVertical className="w-5 h-5" />
            </div>

            {editingId === item.id ? (
              // Edit Mode
              <div className="flex-1 flex items-center gap-2">
                <Input
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  placeholder="Label"
                  className="h-8"
                />
                <Input
                  value={editHref}
                  onChange={(e) => setEditHref(e.target.value)}
                  placeholder="/path"
                  className="h-8"
                />
                <button
                  onClick={saveEdit}
                  className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={cancelEdit}
                  className="p-1.5 text-gray-400 hover:bg-gray-100 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              // View Mode
              <>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{item.label}</div>
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    <LinkIcon className="w-3 h-3" />
                    {item.href}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => moveItem(index, 'up')}
                    disabled={index === 0}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => moveItem(index, 'down')}
                    disabled={index === navigation.length - 1}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => toggleVisibility(item.id)}
                    className={`p-1.5 rounded transition-colors ${
                      item.visible
                        ? 'text-green-600 hover:bg-green-50'
                        : 'text-gray-400 hover:bg-gray-100'
                    }`}
                  >
                    {item.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => startEdit(item)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {navigation.length === 0 && (
        <div className="text-center py-8 border-2 border-dashed rounded-lg">
          <p className="text-gray-500 mb-4">No navigation links</p>
          <Button onClick={() => setShowAddForm(true)} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Add your first link
          </Button>
        </div>
      )}

      {/* Quick Add Default Links */}
      <div className="pt-4 border-t">
        <Label className="mb-2 block text-sm text-gray-500">Quick add common links:</Label>
        <div className="flex flex-wrap gap-2">
          {defaultLinks.map((link) => {
            const exists = navigation.some(n => n.href === link.href);
            return (
              <button
                key={link.href}
                onClick={() => addDefaultLink(link)}
                disabled={exists}
                className={`px-3 py-1.5 text-sm border rounded-full transition-all ${
                  exists
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'hover:border-orange-500 hover:text-orange-600'
                }`}
              >
                {exists ? '✓ ' : '+ '}{link.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Add New Link Form */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Add Navigation Link</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Label</Label>
                <Input
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="Products"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Link (URL)</Label>
                <Input
                  value={newHref}
                  onChange={(e) => setNewHref(e.target.value)}
                  placeholder="/products"
                />
                <p className="text-xs text-gray-500">
                  Use relative paths (e.g., /products) or full URLs
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddForm(false);
                  setNewLabel('');
                  setNewHref('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={addItem}
                disabled={!newLabel.trim() || !newHref.trim()}
                className="bg-gradient-to-r from-orange-500 to-amber-500"
              >
                Add Link
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
