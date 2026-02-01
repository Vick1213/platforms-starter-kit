'use client';

import { useState } from 'react';
import { Star, ThumbsUp, ThumbsDown, Flag, CheckCircle, MessageSquare, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductReview, ProductReviewStats } from '@/lib/review-types';

interface ReviewListProps {
  reviews: ProductReview[];
  stats: ProductReviewStats;
  showSettings?: {
    showVerifiedBadge: boolean;
    showReviewDate: boolean;
    allowSellerResponse: boolean;
    enableHelpfulVoting: boolean;
  };
  currentUserId?: string;
  onVote?: (reviewId: string, helpful: boolean) => void;
  onReport?: (reviewId: string) => void;
  className?: string;
}

export function ReviewList({
  reviews,
  stats,
  showSettings = {
    showVerifiedBadge: true,
    showReviewDate: true,
    allowSellerResponse: true,
    enableHelpfulVoting: true,
  },
  currentUserId,
  onVote,
  onReport,
  className = '',
}: ReviewListProps) {
  const [expandedReviews, setExpandedReviews] = useState<Set<string>>(new Set());

  const toggleExpand = (reviewId: string) => {
    const newExpanded = new Set(expandedReviews);
    if (newExpanded.has(reviewId)) {
      newExpanded.delete(reviewId);
    } else {
      newExpanded.add(reviewId);
    }
    setExpandedReviews(newExpanded);
  };

  return (
    <div className={className}>
      {/* Stats Summary */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-6">
          {/* Average Rating */}
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-900">
              {stats.averageRating.toFixed(1)}
            </div>
            <div className="flex items-center justify-center gap-1 mt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-4 h-4 ${
                    star <= Math.round(stats.averageRating)
                      ? 'text-amber-500 fill-amber-500'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-1">{stats.totalReviews} reviews</p>
          </div>

          {/* Rating Distribution */}
          <div className="flex-1">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = stats.ratingDistribution[rating as 1 | 2 | 3 | 4 | 5];
              const percentage = stats.totalReviews > 0 
                ? (count / stats.totalReviews) * 100 
                : 0;
              
              return (
                <div key={rating} className="flex items-center gap-2 mb-1">
                  <span className="text-sm text-gray-600 w-12">{rating} star</span>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-500 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-500 w-8">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {stats.verifiedPurchaseCount > 0 && (
          <p className="mt-3 text-sm text-green-600 flex items-center gap-1">
            <CheckCircle className="w-4 h-4" />
            {stats.verifiedPurchaseCount} verified purchase{stats.verifiedPurchaseCount !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Reviews */}
      {reviews.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Star className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p className="font-medium">No reviews yet</p>
          <p className="text-sm">Be the first to review this product!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              showSettings={showSettings}
              isExpanded={expandedReviews.has(review.id)}
              onToggleExpand={() => toggleExpand(review.id)}
              onVote={onVote}
              onReport={onReport}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface ReviewCardProps {
  review: ProductReview;
  showSettings: {
    showVerifiedBadge: boolean;
    showReviewDate: boolean;
    allowSellerResponse: boolean;
    enableHelpfulVoting: boolean;
  };
  isExpanded: boolean;
  onToggleExpand: () => void;
  onVote?: (reviewId: string, helpful: boolean) => void;
  onReport?: (reviewId: string) => void;
  currentUserId?: string;
}

function ReviewCard({
  review,
  showSettings,
  isExpanded,
  onToggleExpand,
  onVote,
  onReport,
  currentUserId,
}: ReviewCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const contentTruncated = review.content.length > 300 && !isExpanded;
  const displayContent = contentTruncated 
    ? review.content.slice(0, 300) + '...' 
    : review.content;

  return (
    <div className="border-b pb-6">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        {review.reviewerAvatar ? (
          <img 
            src={review.reviewerAvatar}
            alt={review.reviewerName}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
            <span className="text-lg font-medium text-gray-600">
              {review.reviewerName.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-gray-900">{review.reviewerName}</span>
            {showSettings.showVerifiedBadge && review.verified && (
              <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                <CheckCircle className="w-3 h-3" />
                Verified Purchase
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            {/* Stars */}
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-4 h-4 ${
                    star <= review.rating
                      ? 'text-amber-500 fill-amber-500'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            {showSettings.showReviewDate && (
              <span className="text-sm text-gray-500">
                {formatDate(review.createdAt)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Title */}
      {review.title && (
        <h4 className="font-semibold text-gray-900 mb-2">{review.title}</h4>
      )}

      {/* Content */}
      <p className="text-gray-700 whitespace-pre-wrap">{displayContent}</p>
      {review.content.length > 300 && (
        <button
          onClick={onToggleExpand}
          className="text-orange-600 hover:text-orange-700 text-sm mt-1"
        >
          {isExpanded ? 'Show less' : 'Read more'}
        </button>
      )}

      {/* Pros & Cons */}
      {(review.pros?.length || review.cons?.length) && (
        <div className="mt-4 grid md:grid-cols-2 gap-4">
          {review.pros && review.pros.length > 0 && (
            <div>
              <h5 className="text-sm font-medium text-green-700 mb-1">Pros</h5>
              <ul className="space-y-1">
                {review.pros.map((pro, i) => (
                  <li key={i} className="text-sm text-gray-600 flex items-start gap-1">
                    <span className="text-green-500">+</span> {pro}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {review.cons && review.cons.length > 0 && (
            <div>
              <h5 className="text-sm font-medium text-red-700 mb-1">Cons</h5>
              <ul className="space-y-1">
                {review.cons.map((con, i) => (
                  <li key={i} className="text-sm text-gray-600 flex items-start gap-1">
                    <span className="text-red-500">-</span> {con}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Images */}
      {review.images && review.images.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {review.images.map((image) => (
            <img
              key={image.id}
              src={image.url}
              alt={image.caption || 'Review image'}
              className="w-20 h-20 rounded object-cover cursor-pointer hover:opacity-90"
            />
          ))}
        </div>
      )}

      {/* Seller Response */}
      {showSettings.allowSellerResponse && review.sellerResponse && (
        <div className="mt-4 ml-6 p-4 bg-orange-50 rounded-lg border-l-4 border-orange-500">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-4 h-4 text-orange-600" />
            <span className="text-sm font-medium text-orange-800">Seller Response</span>
            <span className="text-xs text-gray-500">
              {formatDate(review.sellerResponse.respondedAt)}
            </span>
          </div>
          <p className="text-sm text-gray-700">{review.sellerResponse.content}</p>
        </div>
      )}

      {/* Actions */}
      {showSettings.enableHelpfulVoting && (
        <div className="mt-4 flex items-center gap-4">
          <span className="text-sm text-gray-500">Was this review helpful?</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onVote?.(review.id, true)}
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-green-600"
            >
              <ThumbsUp className="w-4 h-4" />
              <span>Yes ({review.helpfulCount})</span>
            </button>
            <button
              onClick={() => onVote?.(review.id, false)}
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-red-600"
            >
              <ThumbsDown className="w-4 h-4" />
              <span>No ({review.notHelpfulCount})</span>
            </button>
          </div>
          <button
            onClick={() => onReport?.(review.id)}
            className="ml-auto text-sm text-gray-400 hover:text-red-600 flex items-center gap-1"
          >
            <Flag className="w-4 h-4" />
            Report
          </button>
        </div>
      )}
    </div>
  );
}
