'use client';

import { useState } from 'react';
import { Star, Plus, X, ImagePlus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ReviewFormProps {
  productId: string;
  productName: string;
  onSubmit: (review: {
    rating: number;
    title: string;
    content: string;
    pros: string[];
    cons: string[];
    images: { id: string; url: string; caption?: string }[];
  }) => Promise<void>;
  onCancel?: () => void;
  className?: string;
}

export function ReviewForm({
  productId,
  productName,
  onSubmit,
  onCancel,
  className = '',
}: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [pros, setPros] = useState<string[]>([]);
  const [cons, setCons] = useState<string[]>([]);
  const [newPro, setNewPro] = useState('');
  const [newCon, setNewCon] = useState('');
  const [images, setImages] = useState<{ id: string; url: string; caption?: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleAddPro = () => {
    if (newPro.trim() && pros.length < 5) {
      setPros([...pros, newPro.trim()]);
      setNewPro('');
    }
  };

  const handleAddCon = () => {
    if (newCon.trim() && cons.length < 5) {
      setCons([...cons, newCon.trim()]);
      setNewCon('');
    }
  };

  const handleRemovePro = (index: number) => {
    setPros(pros.filter((_, i) => i !== index));
  };

  const handleRemoveCon = (index: number) => {
    setCons(cons.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    if (!content.trim()) {
      setError('Please write your review');
      return;
    }

    if (content.trim().length < 20) {
      setError('Review must be at least 20 characters');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        rating,
        title: title.trim(),
        content: content.trim(),
        pros,
        cons,
        images,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRatingLabel = (r: number) => {
    const labels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
    return labels[r] || '';
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
      <div className="bg-orange-50 p-4 rounded-lg">
        <h3 className="font-semibold text-gray-900 mb-1">Write a Review</h3>
        <p className="text-sm text-gray-600">for {productName}</p>
      </div>

      {/* Rating */}
      <div>
        <Label className="block mb-2">Your Rating *</Label>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="focus:outline-none"
              >
                <Star
                  className={`w-8 h-8 transition-colors ${
                    star <= (hoverRating || rating)
                      ? 'text-amber-500 fill-amber-500'
                      : 'text-gray-300 hover:text-amber-300'
                  }`}
                />
              </button>
            ))}
          </div>
          {(hoverRating || rating) > 0 && (
            <span className="text-sm font-medium text-gray-600">
              {getRatingLabel(hoverRating || rating)}
            </span>
          )}
        </div>
      </div>

      {/* Title */}
      <div>
        <Label htmlFor="review-title">Review Title (optional)</Label>
        <Input
          id="review-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Summarize your experience"
          maxLength={100}
          className="mt-1"
        />
      </div>

      {/* Content */}
      <div>
        <Label htmlFor="review-content">Your Review *</Label>
        <textarea
          id="review-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Share your experience with this product. What did you like? What could be improved?"
          rows={5}
          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
          maxLength={2000}
        />
        <p className="text-xs text-gray-500 mt-1">
          {content.length}/2000 characters (minimum 20)
        </p>
      </div>

      {/* Pros */}
      <div>
        <Label>Pros (optional)</Label>
        <p className="text-xs text-gray-500 mb-2">What did you like about this product?</p>
        <div className="space-y-2">
          {pros.map((pro, index) => (
            <div key={index} className="flex items-center gap-2 bg-green-50 p-2 rounded">
              <span className="text-green-600 font-bold">+</span>
              <span className="flex-1 text-sm">{pro}</span>
              <button
                type="button"
                onClick={() => handleRemovePro(index)}
                className="text-gray-400 hover:text-red-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          {pros.length < 5 && (
            <div className="flex items-center gap-2">
              <Input
                value={newPro}
                onChange={(e) => setNewPro(e.target.value)}
                placeholder="Add a pro"
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddPro();
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddPro}
                disabled={!newPro.trim()}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Cons */}
      <div>
        <Label>Cons (optional)</Label>
        <p className="text-xs text-gray-500 mb-2">What could be improved?</p>
        <div className="space-y-2">
          {cons.map((con, index) => (
            <div key={index} className="flex items-center gap-2 bg-red-50 p-2 rounded">
              <span className="text-red-600 font-bold">-</span>
              <span className="flex-1 text-sm">{con}</span>
              <button
                type="button"
                onClick={() => handleRemoveCon(index)}
                className="text-gray-400 hover:text-red-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          {cons.length < 5 && (
            <div className="flex items-center gap-2">
              <Input
                value={newCon}
                onChange={(e) => setNewCon(e.target.value)}
                placeholder="Add a con"
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCon();
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddCon}
                disabled={!newCon.trim()}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Image Upload Placeholder */}
      <div>
        <Label>Add Photos (optional)</Label>
        <p className="text-xs text-gray-500 mb-2">Share photos of your purchase</p>
        <div className="flex flex-wrap gap-2">
          {images.map((image) => (
            <div key={image.id} className="relative group">
              <img
                src={image.url}
                alt="Review"
                className="w-20 h-20 rounded object-cover"
              />
              <button
                type="button"
                onClick={() => setImages(images.filter(i => i.id !== image.id))}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          {images.length < 5 && (
            <button
              type="button"
              className="w-20 h-20 border-2 border-dashed border-gray-300 rounded flex items-center justify-center text-gray-400 hover:border-orange-500 hover:text-orange-500 transition-colors"
            >
              <ImagePlus className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-4 border-t">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={isSubmitting || rating === 0}
          className="bg-orange-600 hover:bg-orange-700"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit Review'
          )}
        </Button>
      </div>
    </form>
  );
}
