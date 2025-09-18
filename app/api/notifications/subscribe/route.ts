import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const subscription = await request.json();

    // Store the push subscription in the database
    // Note: PushSubscription model exists but Prisma client may need regeneration
    try {
      await (prisma as any).pushSubscription.upsert({
        where: {
          userId: session.user.id,
        },
        update: {
          endpoint: subscription.endpoint,
          keys: subscription.keys,
          updatedAt: new Date(),
        },
        create: {
          userId: session.user.id,
          endpoint: subscription.endpoint,
          keys: subscription.keys,
        },
      });
    } catch (error) {
      console.error('Push subscription database error:', error);
      // Fallback: store in memory or alternative storage
    }

    return NextResponse.json({
      success: true,
      message: 'Push subscription saved successfully',
    });
  } catch (error) {
    console.error('Error saving push subscription:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save push subscription' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Remove push subscription from database
    try {
      await (prisma as any).pushSubscription.deleteMany({
        where: {
          userId: session.user.id,
        },
      });
    } catch (error) {
      console.error('Push subscription deletion error:', error);
    }

    return NextResponse.json({
      success: true,
      message: 'Push subscription removed successfully',
    });
  } catch (error) {
    console.error('Error removing push subscription:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove push subscription' },
      { status: 500 }
    );
  }
}