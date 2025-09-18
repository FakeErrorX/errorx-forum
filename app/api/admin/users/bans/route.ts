import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { userManagementService, BanType } from '@/lib/user-management';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Check if user has moderation permissions

    const data = await request.json();
    const { userId, type, reason, publicReason, duration, ipAddress } = data;

    if (!userId || !type || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!Object.values(BanType).includes(type)) {
      return NextResponse.json(
        { error: 'Invalid ban type' },
        { status: 400 }
      );
    }

    const ban = await userManagementService.banUser({
      userId,
      bannedById: session.user.id,
      type,
      reason,
      publicReason,
      duration,
      ipAddress,
    });

    return NextResponse.json(ban, { status: 201 });
  } catch (error) {
    console.error('Ban user error:', error);
    return NextResponse.json(
      { error: 'Failed to ban user' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // TODO: Check if user has permission to view bans for this user
    if (userId !== session.user.id) {
      // Check admin permissions
    }

    const bans = await userManagementService.getUserBans(userId);

    return NextResponse.json(bans);
  } catch (error) {
    console.error('Get user bans error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user bans' },
      { status: 500 }
    );
  }
}