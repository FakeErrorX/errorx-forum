import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { userManagementService } from '@/lib/user-management';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Await the params Promise in Next.js 15
    const resolvedParams = await params;

    // Only user themselves or admins can update reputation
    if (resolvedParams.userId !== session.user.id) {
      // TODO: Check if user has admin permissions
    }

    const data = await request.json();
    const { points, reason, moderatorId } = data;

    if (!points || !reason) {
      return NextResponse.json(
        { error: 'Points and reason are required' },
        { status: 400 }
      );
    }

    const reputation = await userManagementService.updateReputation({
      userId: resolvedParams.userId,
      change: points,
      reason,
      awardedById: moderatorId || session.user.id,
    });

    return NextResponse.json(reputation);
  } catch (error) {
    console.error('Update reputation error:', error);
    return NextResponse.json(
      { error: 'Failed to update reputation' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Await the params Promise in Next.js 15
    const resolvedParams = await params;

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '20');

    const reputationHistory = await userManagementService.getReputationHistory(
      resolvedParams.userId,
      limit
    );

    return NextResponse.json(reputationHistory);
  } catch (error) {
    console.error('Get reputation history error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reputation history' },
      { status: 500 }
    );
  }
}