'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Star, Lock, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ReviewList, ReviewForm } from '@/components/reviews';
import { ProductReview, ProductReviewStats, ReviewSettings, defaultReviewSettings } from '@/lib/review-types';

interface ProductReviewsClientProps {
  productId: string;
  productName: string;
  sellerId: string;
}

export function ProductReviewsClient({
  productId,
  productName,
  sellerId,
}: ProductReviewsClientProps) {
  const { data: session } = useSession();
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [stats, setStats] = useState<ProductReviewStats>({
    productId,
    averageRating: 0,
    totalReviews: 0,
    verifiedPurchaseCount: 0,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  });
  const [settings, setSettings] = useState<ReviewSettings>(defaultReviewSettings);
  const [canReview, setCanReview] = useState<{ allowed: boolean; reason: string }>({ 
    allowed: false, 
    reason: 'Loading...' 
  });
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
    fetchSettings();
    if (session?.user) {
      checkCanReview();
    }
  }, [productId, session]);

  const fetchReviews = async () => {
    try {
      const res = await fetch(`/api/reviews?productId=${productId}`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
        
        // Also fetch stats
        const statsRes = await fetch(`/api/reviews?action=stats&productId=${productId}`);
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData.stats);
        }
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch(`/api/reviews?action=settings&sellerId=${sellerId}`);
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings || defaultReviewSettings);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const checkCanReview = async () => {
    try {
      const res = await fetch(`/api/reviews?action=can-review&productId=${productId}`);
      if (res.ok) {
        const data = await res.json();
        setCanReview(data);
      }
    } catch (error) {
      console.error('Error checking review eligibility:', error);
    }
  };

  const handleSubmitReview = async (review: {
    rating: number;
    title: string;
    content: string;
    pros: string[];
    cons: string[];
    images: { id: string; url: string; caption?: string }[];
  }) => {
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          productId,
          sellerId,
          ...review,
        }),
      });

      if (res.ok) {
        setShowReviewForm(false);
        fetchReviews(); // Refresh reviews
      } else {
        const error = await res.json();
        throw new Error(error.error || 'Failed to submit review');
      }
    } catch (error) {
      throw error;
    }
  };

  const handleVote = async (reviewId: string, helpful: boolean) => {
    if (!session?.user) {
      alert('Please sign in to vote on reviews');
      return;
    }

    try {
      await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'vote',
          reviewId,
          helpful,
        }),
      });
      fetchReviews(); // Refresh to show updated counts
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  const handleReport = async (reviewId: string) => {
    if (!session?.user) {
      alert('Please sign in to report reviews');
      return;
    }

    const reason = prompt('Please describe why you are reporting this review:');
    if (!reason) return;

    try {
      await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'report',
          reviewId,
          reason,
        }),
      });
      alert('Thank you for your report. We will review it shortly.');
    } catch (error) {
      console.error('Error reporting:', error);
    }
  };

  if (loading) {
    return (
      <div className="mt-12 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48 mb-6" />
        <div className="h-32 bg-gray-100 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="mt-12 border-t pt-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Customer Reviews</h2>
        {session?.user && canReview.allowed && !showReviewForm && (
          <Button 
            onClick={() => setShowReviewForm(true)}
            className="bg-orange-600 hover:bg-orange-700"
          >
            <Star className="w-4 h-4 mr-2" />
            Write a Review
          </Button>
        )}
      </div>

      {/* Review Form or Eligibility Message */}
      {showReviewForm ? (
        <div className="mb-8 p-6 border rounded-xl">
          <ReviewForm
            productId={productId}
            productName={productName}
            onSubmit={handleSubmitReview}
            onCancel={() => setShowReviewForm(false)}
          />
        </div>
      ) : session?.user && !canReview.allowed && (
        <div className="mb-8 p-6 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-start gap-3">
            {settings.requirePurchaseVerification ? (
              <>
                <ShoppingBag className="w-6 h-6 text-amber-600 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-amber-800">Purchase Required</h4>
                  <p className="text-sm text-amber-700">
                    {canReview.reason || 'Only verified purchasers can leave reviews for this product.'}
                  </p>
                </div>
              </>
            ) : (
              <>
                <Lock className="w-6 h-6 text-amber-600 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-amber-800">Review Not Available</h4>
                  <p className="text-sm text-amber-700">{canReview.reason}</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Not logged in message */}
      {!session?.user && (
        <div className="mb-8 p-6 bg-gray-50 border rounded-xl">
          <div className="flex items-start gap-3">
            <Lock className="w-6 h-6 text-gray-500 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-gray-800">Sign in to Review</h4>
              <p className="text-sm text-gray-600">
                <a href="/auth/login" className="text-orange-600 hover:underline">Sign in</a> to leave a review for this product.
                {settings.requirePurchaseVerification && ' Only verified purchasers can submit reviews.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Reviews List */}
      <ReviewList
        reviews={reviews}
        stats={stats}
        showSettings={{
          showVerifiedBadge: settings.showVerifiedBadge,
          showReviewDate: settings.showReviewDate,
          allowSellerResponse: settings.allowSellerResponse,
          enableHelpfulVoting: settings.enableHelpfulVoting,
        }}
        currentUserId={session?.user?.id}
        onVote={handleVote}
        onReport={handleReport}
      />
    </div>
  );
}
