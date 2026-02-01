// Review System Types with Purchase Verification
// Only verified purchasers can leave reviews

export type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'flagged';

export type ReviewSortOption = 'newest' | 'oldest' | 'highest' | 'lowest' | 'helpful';

// Individual product review
export interface ProductReview {
  id: string;
  productId: string;
  productName: string;
  sellerId: string;
  // Reviewer info
  reviewerId: string;
  reviewerName: string;
  reviewerAvatar?: string;
  // Purchase verification
  verified: boolean;
  orderId?: string;
  purchaseDate?: string;
  // Review content
  rating: number; // 1-5 stars
  title: string;
  content: string;
  // Media
  images?: ReviewImage[];
  // Pros/Cons (optional)
  pros?: string[];
  cons?: string[];
  // Product variants purchased
  variantInfo?: string;
  // Interaction
  helpfulCount: number;
  notHelpfulCount: number;
  // Seller response
  sellerResponse?: {
    content: string;
    respondedAt: string;
  };
  // Status & moderation
  status: ReviewStatus;
  moderationNote?: string;
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface ReviewImage {
  id: string;
  url: string;
  caption?: string;
}

// Review helpful vote tracking
export interface ReviewVote {
  reviewId: string;
  oderId: string;
  helpful: boolean;
  createdAt: string;
}

// Aggregated review statistics for a product
export interface ProductReviewStats {
  productId: string;
  totalReviews: number;
  averageRating: number;
  verifiedPurchaseCount: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  // Helpful stats
  mostHelpfulPositive?: string; // reviewId
  mostHelpfulNegative?: string; // reviewId
}

// Seller's review settings
export interface ReviewSettings {
  // Enable/disable reviews
  enabled: boolean;
  // Require purchase verification
  requirePurchaseVerification: boolean;
  // Auto-approve reviews
  autoApprove: boolean;
  // Minimum rating to auto-approve (if autoApprove is true)
  autoApproveMinRating: number;
  // Allow anonymous reviews (show "Verified Buyer" instead of name)
  allowAnonymous: boolean;
  // Require review title
  requireTitle: boolean;
  // Minimum content length
  minContentLength: number;
  // Maximum content length
  maxContentLength: number;
  // Allow images in reviews
  allowImages: boolean;
  // Max images per review
  maxImagesPerReview: number;
  // Allow pros/cons
  allowProsAndCons: boolean;
  // Enable helpful voting
  enableHelpfulVoting: boolean;
  // Allow seller responses
  allowSellerResponse: boolean;
  // Show review date
  showReviewDate: boolean;
  // Show purchase date
  showPurchaseDate: boolean;
  // Days after purchase to request review
  reviewRequestDelay: number;
  // Send review request email
  sendReviewRequestEmail: boolean;
  // Review request email template
  reviewRequestEmailSubject: string;
  reviewRequestEmailBody: string;
  // Display settings
  displayOrder: ReviewSortOption;
  reviewsPerPage: number;
  showRatingDistribution: boolean;
  showVerifiedBadge: boolean;
  // Minimum rating to display (0 = show all)
  minimumRatingForDisplay: number;
  // Notification settings
  notifyOnNewReview: boolean;
  notifyOnLowRating: boolean;
}

export const defaultReviewSettings: ReviewSettings = {
  enabled: true,
  requirePurchaseVerification: true,
  autoApprove: false,
  autoApproveMinRating: 3,
  allowAnonymous: true,
  requireTitle: false,
  minContentLength: 10,
  maxContentLength: 2000,
  allowImages: true,
  maxImagesPerReview: 5,
  allowProsAndCons: true,
  enableHelpfulVoting: true,
  allowSellerResponse: true,
  showReviewDate: true,
  showPurchaseDate: false,
  reviewRequestDelay: 7, // days
  sendReviewRequestEmail: true,
  reviewRequestEmailSubject: 'How was your purchase? Leave a review!',
  reviewRequestEmailBody: 'Hi {customerName},\n\nThank you for your recent purchase of {productName}. We hope you\'re enjoying it!\n\nWe\'d love to hear your feedback. Your review helps other customers make informed decisions.\n\n{reviewLink}\n\nThank you for your support!\n\n{storeName}',
  displayOrder: 'newest',
  reviewsPerPage: 10,
  showRatingDistribution: true,
  showVerifiedBadge: true,
  minimumRatingForDisplay: 0,
  notifyOnNewReview: true,
  notifyOnLowRating: true,
};

// Review request tracking
export interface ReviewRequest {
  id: string;
  orderId: string;
  productId: string;
  customerId: string;
  customerEmail: string;
  sellerId: string;
  sentAt: string;
  reminderSentAt?: string;
  completedAt?: string;
  reviewId?: string;
}

// Report a review
export interface ReviewReport {
  id: string;
  reviewId: string;
  reporterId: string;
  reason: 'spam' | 'inappropriate' | 'fake' | 'offensive' | 'other';
  description?: string;
  createdAt: string;
  resolvedAt?: string;
  resolution?: 'dismissed' | 'removed' | 'edited';
}

// Helper function to check if user can review a product
export function canUserReview(
  settings: ReviewSettings,
  userId: string | null,
  hasPurchased: boolean
): { canReview: boolean; reason?: string } {
  if (!settings.enabled) {
    return { canReview: false, reason: 'Reviews are disabled for this store' };
  }
  
  if (!userId) {
    return { canReview: false, reason: 'Please sign in to leave a review' };
  }
  
  if (settings.requirePurchaseVerification && !hasPurchased) {
    return { canReview: false, reason: 'Only verified purchasers can leave reviews' };
  }
  
  return { canReview: true };
}

// Calculate average rating from distribution
export function calculateAverageRating(distribution: ProductReviewStats['ratingDistribution']): number {
  const total = distribution[1] + distribution[2] + distribution[3] + distribution[4] + distribution[5];
  if (total === 0) return 0;
  
  const sum = (1 * distribution[1]) + (2 * distribution[2]) + (3 * distribution[3]) + 
              (4 * distribution[4]) + (5 * distribution[5]);
  return Number((sum / total).toFixed(1));
}
