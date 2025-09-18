import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { userManagementService } from '@/lib/user-management';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Check if user has admin permissions

    const data = await request.json();
    const { userId, badgeId, reason } = data;

    if (!userId || !badgeId) {
      return NextResponse.json(
        { error: 'User ID and badge ID are required' },
        { status: 400 }
      );
    }

    const badge = await userManagementService.awardBadge({
      userId,
      badgeId,
      awardedById: session.user.id,
      reason,
    });

    return NextResponse.json(badge, { status: 201 });
  } catch (error) {
    console.error('Award badge error:', error);
    return NextResponse.json(
      { error: 'Failed to award badge' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // Await the params Promise in Next.js 15
    const resolvedParams = await params;
    const badges = await userManagementService.getUserBadges(resolvedParams.userId);
    return NextResponse.json(badges);
  } catch (error) {
    console.error('Get user badges error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user badges' },
      { status: 500 }
    );
  }
}