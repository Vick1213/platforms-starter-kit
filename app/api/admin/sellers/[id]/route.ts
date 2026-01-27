import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { UserRole } from '@/lib/auth-config';
import { getSellerById, updateSeller } from '@/lib/db';

// PATCH - Update seller status (approve/reject/suspend)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    // Check if user is authenticated and is admin
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    if (!action || !['approve', 'reject', 'suspend', 'unsuspend'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Use: approve, reject, suspend, or unsuspend' },
        { status: 400 }
      );
    }

    // Get the seller
    const seller = await getSellerById(id);
    if (!seller) {
      return NextResponse.json(
        { error: 'Seller not found' },
        { status: 404 }
      );
    }

    // Determine new status
    let newStatus: 'pending' | 'approved' | 'rejected' | 'suspended';
    let verified = seller.verified;

    switch (action) {
      case 'approve':
        newStatus = 'approved';
        verified = true;
        break;
      case 'reject':
        newStatus = 'rejected';
        verified = false;
        break;
      case 'suspend':
        newStatus = 'suspended';
        break;
      case 'unsuspend':
        newStatus = 'approved';
        break;
      default:
        newStatus = seller.status;
    }

    // Update the seller
    const updatedSeller = await updateSeller(id, { 
      status: newStatus, 
      verified 
    });

    if (!updatedSeller) {
      return NextResponse.json(
        { error: 'Failed to update seller' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Seller ${action}d successfully`,
      seller: updatedSeller,
    });
  } catch (error) {
    console.error('Admin seller update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a seller (with optional cascade to user)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const seller = await getSellerById(id);
    if (!seller) {
      return NextResponse.json(
        { error: 'Seller not found' },
        { status: 404 }
      );
    }

    // Import redis to delete keys
    const { redis } = await import('@/lib/redis');
    
    // Delete all seller-related keys
    await Promise.all([
      redis.del(`seller:${id}`),
      redis.del(`seller:user:${seller.userId}`),
      redis.del(`seller:subdomain:${seller.subdomain}`),
      redis.del(`seller:settings:${id}`),
      seller.customDomain ? redis.del(`seller:domain:${seller.customDomain}`) : Promise.resolve(),
    ]);

    return NextResponse.json({
      success: true,
      message: 'Seller deleted successfully',
    });
  } catch (error) {
    console.error('Admin seller delete error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
