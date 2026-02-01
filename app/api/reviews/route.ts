/**
 * Reviews API Routes
 * Handles product reviews with purchase verification
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getSellerByUserId } from '@/lib/db';
import { getProductById } from '@/lib/product-db';
import {
  getReviewSettings,
  saveReviewSettings,
  createReview,
  getReview,
  updateReview,
  deleteReview,
  getProductReviews,
  getSellerReviews,
  getProductReviewStats,
  hasUserPurchasedProduct,
  hasUserReviewedProduct,
  voteReview,
  addSellerResponse,
  approveReview,
  rejectReview,
} from '@/lib/review-db';
import { canUserReview } from '@/lib/review-types';

// GET /api/reviews - Get reviews for a product or seller's all reviews
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const sellerId = searchParams.get('sellerId');
    const action = searchParams.get('action');
    const status = searchParams.get('status') as 'pending' | 'approved' | 'rejected' | 'flagged' | null;
    const sortBy = searchParams.get('sortBy') as 'newest' | 'oldest' | 'highest' | 'lowest' | 'helpful' | null;
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get review settings
    if (action === 'settings' && sellerId) {
      const session = await auth();
      const seller = session?.user?.id ? await getSellerByUserId(session.user.id) : null;
      
      // Only seller can see their full settings
      if (seller && seller.id === sellerId) {
        const settings = await getReviewSettings(sellerId);
        return NextResponse.json({ settings });
      }
      
      // Public users only see if reviews are enabled
      const settings = await getReviewSettings(sellerId);
      return NextResponse.json({ 
        settings: { 
          enabled: settings.enabled,
          requirePurchaseVerification: settings.requirePurchaseVerification,
          showVerifiedBadge: settings.showVerifiedBadge,
        } 
      });
    }

    // Check if user can review a product
    if (action === 'can-review' && productId) {
      const session = await auth();
      const product = await getProductById(productId);
      
      if (!product) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      }

      // Get sellerId from product's company's seller
      const sellerId = product.company?.seller?.id;
      if (!sellerId) {
        return NextResponse.json({ error: 'Seller not found' }, { status: 404 });
      }

      const settings = await getReviewSettings(sellerId);
      const hasPurchased = session?.user?.id 
        ? (await hasUserPurchasedProduct(session.user.id, productId)).purchased 
        : false;
      const hasReviewed = session?.user?.id 
        ? await hasUserReviewedProduct(session.user.id, productId)
        : false;

      const result = canUserReview(settings, session?.user?.id || null, hasPurchased);

      return NextResponse.json({
        ...result,
        hasPurchased,
        hasReviewed,
        settings: {
          allowImages: settings.allowImages,
          maxImagesPerReview: settings.maxImagesPerReview,
          allowProsAndCons: settings.allowProsAndCons,
          requireTitle: settings.requireTitle,
          minContentLength: settings.minContentLength,
          maxContentLength: settings.maxContentLength,
        },
      });
    }

    // Get stats for a product
    if (action === 'stats' && productId) {
      const stats = await getProductReviewStats(productId);
      return NextResponse.json({ stats });
    }

    // Get reviews for a product
    if (productId) {
      const reviews = await getProductReviews(productId, {
        status: status || 'approved',
        limit,
        offset,
        sortBy: sortBy || 'newest',
      });

      const stats = await getProductReviewStats(productId);

      return NextResponse.json({ reviews, stats });
    }

    // Get all reviews for a seller (seller dashboard)
    if (sellerId) {
      const session = await auth();
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const seller = await getSellerByUserId(session.user.id);
      if (!seller || seller.id !== sellerId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      const reviews = await getSellerReviews(sellerId, {
        status: status || undefined,
        limit,
        offset,
      });

      return NextResponse.json({ reviews });
    }

    return NextResponse.json({ error: 'Missing productId or sellerId' }, { status: 400 });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/reviews - Create a review or perform an action
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    // Save review settings (seller only)
    if (action === 'save-settings') {
      const { sellerId, settings } = body;
      
      const seller = await getSellerByUserId(session.user.id);
      if (!seller || seller.id !== sellerId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      await saveReviewSettings(sellerId, settings);
      return NextResponse.json({ success: true });
    }

    // Create a review
    if (action === 'create') {
      const { productId, productName, sellerId, rating, title, content, images, pros, cons, variantInfo } = body;

      if (!productId || !sellerId || !rating || !content) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }

      // Check if user can review
      const settings = await getReviewSettings(sellerId);
      const purchaseInfo = await hasUserPurchasedProduct(session.user.id, productId);
      const result = canUserReview(settings, session.user.id, purchaseInfo.purchased);

      if (!result.canReview) {
        return NextResponse.json({ error: result.reason }, { status: 403 });
      }

      // Check if already reviewed
      const alreadyReviewed = await hasUserReviewedProduct(session.user.id, productId);
      if (alreadyReviewed) {
        return NextResponse.json({ error: 'You have already reviewed this product' }, { status: 400 });
      }

      // Validate content length
      if (content.length < settings.minContentLength) {
        return NextResponse.json({ 
          error: `Review must be at least ${settings.minContentLength} characters` 
        }, { status: 400 });
      }

      if (content.length > settings.maxContentLength) {
        return NextResponse.json({ 
          error: `Review cannot exceed ${settings.maxContentLength} characters` 
        }, { status: 400 });
      }

      const review = await createReview({
        productId,
        productName,
        sellerId,
        reviewerId: session.user.id,
        reviewerName: session.user.name || 'Anonymous',
        reviewerAvatar: session.user.image || undefined,
        verified: purchaseInfo.purchased,
        orderId: purchaseInfo.orderId,
        purchaseDate: purchaseInfo.purchaseDate,
        rating,
        title: title || '',
        content,
        images: settings.allowImages ? images : undefined,
        pros: settings.allowProsAndCons ? pros : undefined,
        cons: settings.allowProsAndCons ? cons : undefined,
        variantInfo,
      });

      return NextResponse.json({ review });
    }

    // Vote on a review
    if (action === 'vote') {
      const { reviewId, helpful } = body;

      if (!reviewId || helpful === undefined) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }

      const result = await voteReview(reviewId, session.user.id, helpful);
      if (!result) {
        return NextResponse.json({ error: 'Review not found' }, { status: 404 });
      }

      return NextResponse.json({ success: true, ...result });
    }

    // Add seller response
    if (action === 'respond') {
      const { reviewId, content } = body;

      if (!reviewId || !content) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }

      const review = await getReview(reviewId);
      if (!review) {
        return NextResponse.json({ error: 'Review not found' }, { status: 404 });
      }

      // Verify seller owns this product
      const seller = await getSellerByUserId(session.user.id);
      if (!seller || seller.id !== review.sellerId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      const settings = await getReviewSettings(seller.id);
      if (!settings.allowSellerResponse) {
        return NextResponse.json({ error: 'Seller responses are disabled' }, { status: 403 });
      }

      const updated = await addSellerResponse(reviewId, content);
      return NextResponse.json({ review: updated });
    }

    // Approve review (seller only)
    if (action === 'approve') {
      const { reviewId } = body;

      const review = await getReview(reviewId);
      if (!review) {
        return NextResponse.json({ error: 'Review not found' }, { status: 404 });
      }

      const seller = await getSellerByUserId(session.user.id);
      if (!seller || seller.id !== review.sellerId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      const updated = await approveReview(reviewId);
      return NextResponse.json({ review: updated });
    }

    // Reject review (seller only)
    if (action === 'reject') {
      const { reviewId, reason } = body;

      const review = await getReview(reviewId);
      if (!review) {
        return NextResponse.json({ error: 'Review not found' }, { status: 404 });
      }

      const seller = await getSellerByUserId(session.user.id);
      if (!seller || seller.id !== review.sellerId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      const updated = await rejectReview(reviewId, reason);
      return NextResponse.json({ review: updated });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error in reviews API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/reviews - Delete a review
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const reviewId = searchParams.get('reviewId');

    if (!reviewId) {
      return NextResponse.json({ error: 'Missing reviewId' }, { status: 400 });
    }

    const review = await getReview(reviewId);
    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    // Only reviewer or seller can delete
    const seller = await getSellerByUserId(session.user.id);
    const isReviewer = review.reviewerId === session.user.id;
    const isSeller = seller && seller.id === review.sellerId;

    if (!isReviewer && !isSeller) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await deleteReview(reviewId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting review:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
