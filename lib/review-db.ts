/**
 * Review System Database Operations
 * Handles product reviews with purchase verification
 */

import { redis } from './redis';
import { 
  ProductReview, 
  ProductReviewStats, 
  ReviewSettings,
  ReviewRequest,
  ReviewReport,
  ReviewVote,
  defaultReviewSettings,
  calculateAverageRating,
} from './review-types';

// ============================================
// CACHE KEYS
// ============================================

const reviewKeys = {
  // Reviews
  review: (id: string) => `review:${id}`,
  productReviews: (productId: string) => `review:product:${productId}`,
  sellerReviews: (sellerId: string) => `review:seller:${sellerId}`,
  userReviews: (userId: string) => `review:user:${userId}`,
  
  // Stats
  productStats: (productId: string) => `review:stats:${productId}`,
  
  // Settings
  reviewSettings: (sellerId: string) => `review:settings:${sellerId}`,
  
  // Review requests
  reviewRequest: (id: string) => `review:request:${id}`,
  orderReviewRequest: (orderId: string) => `review:request:order:${orderId}`,
  
  // Reports
  reviewReport: (id: string) => `review:report:${id}`,
  reportedReviews: (sellerId: string) => `review:reported:${sellerId}`,
  
  // Votes
  reviewVotes: (reviewId: string) => `review:votes:${reviewId}`,
  userVotes: (userId: string) => `review:user:${userId}:votes`,
  
  // Purchase verification
  purchaseVerification: (userId: string, productId: string) => `review:purchase:${userId}:${productId}`,
};

// ============================================
// REVIEW SETTINGS OPERATIONS
// ============================================

export async function getReviewSettings(sellerId: string): Promise<ReviewSettings> {
  const settings = await redis.get<ReviewSettings>(reviewKeys.reviewSettings(sellerId));
  return settings || defaultReviewSettings;
}

export async function saveReviewSettings(
  sellerId: string, 
  settings: ReviewSettings
): Promise<void> {
  await redis.set(reviewKeys.reviewSettings(sellerId), settings);
}

// ============================================
// PURCHASE VERIFICATION
// ============================================

export async function recordPurchase(
  userId: string, 
  productId: string, 
  orderId: string,
  purchaseDate: string
): Promise<void> {
  await redis.set(reviewKeys.purchaseVerification(userId, productId), {
    orderId,
    purchaseDate,
    recordedAt: new Date().toISOString(),
  });
}

export async function hasUserPurchasedProduct(
  userId: string, 
  productId: string
): Promise<{ purchased: boolean; orderId?: string; purchaseDate?: string }> {
  const purchase = await redis.get<{ orderId: string; purchaseDate: string }>(
    reviewKeys.purchaseVerification(userId, productId)
  );
  
  if (purchase) {
    return { purchased: true, orderId: purchase.orderId, purchaseDate: purchase.purchaseDate };
  }
  
  return { purchased: false };
}

export async function hasUserReviewedProduct(
  userId: string, 
  productId: string
): Promise<boolean> {
  const reviewIds = await redis.lrange(reviewKeys.userReviews(userId), 0, -1);
  
  for (const reviewId of reviewIds) {
    const review = await getReview(reviewId);
    if (review && review.productId === productId) {
      return true;
    }
  }
  
  return false;
}

// ============================================
// REVIEW OPERATIONS
// ============================================

export async function createReview(
  data: Omit<ProductReview, 'id' | 'createdAt' | 'updatedAt' | 'helpfulCount' | 'notHelpfulCount' | 'status'>
): Promise<ProductReview> {
  const id = `rev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date().toISOString();
  
  // Get seller's review settings
  const settings = await getReviewSettings(data.sellerId);
  
  // Determine initial status
  let status: ProductReview['status'] = 'pending';
  if (settings.autoApprove && data.rating >= settings.autoApproveMinRating) {
    status = 'approved';
  }
  
  const review: ProductReview = {
    ...data,
    id,
    status,
    helpfulCount: 0,
    notHelpfulCount: 0,
    createdAt: now,
    updatedAt: now,
  };
  
  // Store review
  await redis.set(reviewKeys.review(id), review);
  
  // Add to product's review list
  await redis.lpush(reviewKeys.productReviews(data.productId), id);
  
  // Add to seller's review list
  await redis.lpush(reviewKeys.sellerReviews(data.sellerId), id);
  
  // Add to user's review list
  await redis.lpush(reviewKeys.userReviews(data.reviewerId), id);
  
  // Update product stats if review is approved
  if (status === 'approved') {
    await updateProductReviewStats(data.productId);
  }
  
  return review;
}

export async function getReview(id: string): Promise<ProductReview | null> {
  return redis.get<ProductReview>(reviewKeys.review(id));
}

export async function updateReview(
  id: string, 
  updates: Partial<ProductReview>
): Promise<ProductReview | null> {
  const review = await getReview(id);
  if (!review) return null;
  
  const updated: ProductReview = {
    ...review,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  await redis.set(reviewKeys.review(id), updated);
  
  // Update stats if status changed
  if (updates.status && updates.status !== review.status) {
    await updateProductReviewStats(review.productId);
  }
  
  return updated;
}

export async function deleteReview(id: string): Promise<boolean> {
  const review = await getReview(id);
  if (!review) return false;
  
  // Remove from all lists
  await redis.lrem(reviewKeys.productReviews(review.productId), 1, id);
  await redis.lrem(reviewKeys.sellerReviews(review.sellerId), 1, id);
  await redis.lrem(reviewKeys.userReviews(review.reviewerId), 1, id);
  
  // Delete review
  await redis.del(reviewKeys.review(id));
  
  // Update stats
  await updateProductReviewStats(review.productId);
  
  return true;
}

export async function getProductReviews(
  productId: string, 
  options?: {
    status?: ProductReview['status'];
    limit?: number;
    offset?: number;
    sortBy?: 'newest' | 'oldest' | 'highest' | 'lowest' | 'helpful';
  }
): Promise<ProductReview[]> {
  const reviewIds = await redis.lrange(reviewKeys.productReviews(productId), 0, -1);
  let reviews: ProductReview[] = [];
  
  for (const id of reviewIds) {
    const review = await getReview(id);
    if (review) {
      // Filter by status if specified
      if (options?.status && review.status !== options.status) continue;
      reviews.push(review);
    }
  }
  
  // Sort
  const sortBy = options?.sortBy || 'newest';
  switch (sortBy) {
    case 'newest':
      reviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      break;
    case 'oldest':
      reviews.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      break;
    case 'highest':
      reviews.sort((a, b) => b.rating - a.rating);
      break;
    case 'lowest':
      reviews.sort((a, b) => a.rating - b.rating);
      break;
    case 'helpful':
      reviews.sort((a, b) => b.helpfulCount - a.helpfulCount);
      break;
  }
  
  // Pagination
  const offset = options?.offset || 0;
  const limit = options?.limit || 10;
  return reviews.slice(offset, offset + limit);
}

export async function getSellerReviews(
  sellerId: string,
  options?: {
    status?: ProductReview['status'];
    limit?: number;
    offset?: number;
  }
): Promise<ProductReview[]> {
  const reviewIds = await redis.lrange(reviewKeys.sellerReviews(sellerId), 0, -1);
  let reviews: ProductReview[] = [];
  
  for (const id of reviewIds) {
    const review = await getReview(id);
    if (review) {
      if (options?.status && review.status !== options.status) continue;
      reviews.push(review);
    }
  }
  
  // Sort by newest first
  reviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  // Pagination
  const offset = options?.offset || 0;
  const limit = options?.limit || 20;
  return reviews.slice(offset, offset + limit);
}

// ============================================
// SELLER RESPONSE
// ============================================

export async function addSellerResponse(
  reviewId: string, 
  content: string
): Promise<ProductReview | null> {
  return updateReview(reviewId, {
    sellerResponse: {
      content,
      respondedAt: new Date().toISOString(),
    },
  });
}

// ============================================
// REVIEW VOTING
// ============================================

export async function voteReview(
  reviewId: string, 
  oderId: string, 
  helpful: boolean
): Promise<{ helpfulCount: number; notHelpfulCount: number } | null> {
  const review = await getReview(reviewId);
  if (!review) return null;
  
  // Check if user already voted
  const existingVotes = await redis.get<ReviewVote[]>(reviewKeys.reviewVotes(reviewId)) || [];
  const existingVote = existingVotes.find(v => v.oderId === oderId);
  
  if (existingVote) {
    // Update existing vote
    existingVote.helpful = helpful;
  } else {
    // Add new vote
    existingVotes.push({
      reviewId,
      oderId,
      helpful,
      createdAt: new Date().toISOString(),
    });
  }
  
  await redis.set(reviewKeys.reviewVotes(reviewId), existingVotes);
  
  // Recalculate counts
  const helpfulCount = existingVotes.filter(v => v.helpful).length;
  const notHelpfulCount = existingVotes.filter(v => !v.helpful).length;
  
  await updateReview(reviewId, { helpfulCount, notHelpfulCount });
  
  return { helpfulCount, notHelpfulCount };
}

// ============================================
// REVIEW STATS
// ============================================

export async function getProductReviewStats(productId: string): Promise<ProductReviewStats> {
  const cached = await redis.get<ProductReviewStats>(reviewKeys.productStats(productId));
  if (cached) return cached;
  
  // Calculate stats
  return updateProductReviewStats(productId);
}

export async function updateProductReviewStats(productId: string): Promise<ProductReviewStats> {
  const reviews = await getProductReviews(productId, { status: 'approved', limit: 1000 });
  
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let verifiedCount = 0;
  
  reviews.forEach(review => {
    distribution[review.rating as 1 | 2 | 3 | 4 | 5]++;
    if (review.verified) verifiedCount++;
  });
  
  const stats: ProductReviewStats = {
    productId,
    totalReviews: reviews.length,
    averageRating: calculateAverageRating(distribution),
    verifiedPurchaseCount: verifiedCount,
    ratingDistribution: distribution,
  };
  
  // Find most helpful reviews
  const positiveReviews = reviews.filter(r => r.rating >= 4).sort((a, b) => b.helpfulCount - a.helpfulCount);
  const negativeReviews = reviews.filter(r => r.rating <= 2).sort((a, b) => b.helpfulCount - a.helpfulCount);
  
  if (positiveReviews[0]?.helpfulCount > 0) {
    stats.mostHelpfulPositive = positiveReviews[0].id;
  }
  if (negativeReviews[0]?.helpfulCount > 0) {
    stats.mostHelpfulNegative = negativeReviews[0].id;
  }
  
  await redis.set(reviewKeys.productStats(productId), stats);
  
  return stats;
}

// ============================================
// REVIEW MODERATION
// ============================================

export async function approveReview(reviewId: string): Promise<ProductReview | null> {
  return updateReview(reviewId, { status: 'approved' });
}

export async function rejectReview(
  reviewId: string, 
  moderationNote?: string
): Promise<ProductReview | null> {
  return updateReview(reviewId, { status: 'rejected', moderationNote });
}

export async function flagReview(
  reviewId: string, 
  moderationNote?: string
): Promise<ProductReview | null> {
  return updateReview(reviewId, { status: 'flagged', moderationNote });
}

// ============================================
// REVIEW REPORTS
// ============================================

export async function reportReview(
  data: Omit<ReviewReport, 'id' | 'createdAt'>
): Promise<ReviewReport> {
  const id = `rpt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const report: ReviewReport = {
    ...data,
    id,
    createdAt: new Date().toISOString(),
  };
  
  await redis.set(reviewKeys.reviewReport(id), report);
  
  // Get the review to find seller
  const review = await getReview(data.reviewId);
  if (review) {
    await redis.lpush(reviewKeys.reportedReviews(review.sellerId), id);
  }
  
  return report;
}

// ============================================
// REVIEW REQUESTS
// ============================================

export async function createReviewRequest(
  data: Omit<ReviewRequest, 'id' | 'sentAt'>
): Promise<ReviewRequest> {
  const id = `rreq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const request: ReviewRequest = {
    ...data,
    id,
    sentAt: new Date().toISOString(),
  };
  
  await redis.set(reviewKeys.reviewRequest(id), request);
  await redis.set(reviewKeys.orderReviewRequest(data.orderId), id);
  
  return request;
}

export async function getReviewRequestByOrder(orderId: string): Promise<ReviewRequest | null> {
  const requestId = await redis.get<string>(reviewKeys.orderReviewRequest(orderId));
  if (!requestId) return null;
  
  return redis.get<ReviewRequest>(reviewKeys.reviewRequest(requestId));
}

export async function markReviewRequestCompleted(
  orderId: string, 
  reviewId: string
): Promise<void> {
  const requestId = await redis.get<string>(reviewKeys.orderReviewRequest(orderId));
  if (!requestId) return;
  
  const request = await redis.get<ReviewRequest>(reviewKeys.reviewRequest(requestId));
  if (request) {
    await redis.set(reviewKeys.reviewRequest(requestId), {
      ...request,
      completedAt: new Date().toISOString(),
      reviewId,
    });
  }
}
