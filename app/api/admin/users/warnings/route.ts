import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { userManagementService, WarningType } from '@/lib/user-management';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Check if user has moderation permissions

    const data = await request.json();
    const { userId, type, reason, publicReason, expiresAt } = data;

    if (!userId || !type || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!Object.values(WarningType).includes(type)) {
      return NextResponse.json(
        { error: 'Invalid warning type' },
        { status: 400 }
      );
    }

    const warning = await userManagementService.issueWarning({
      userId,
      issuedById: session.user.id,
      type,
      title: publicReason || reason,
      reason,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    });

    return NextResponse.json(warning, { status: 201 });
  } catch (error) {
    console.error('Warn user error:', error);
    return NextResponse.json(
      { error: 'Failed to warn user' },
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

    // TODO: Check if user has permission to view warnings for this user
    if (userId !== session.user.id) {
      // Check admin permissions
    }

    const warnings = await userManagementService.getUserWarnings(userId);

    return NextResponse.json(warnings);
  } catch (error) {
    console.error('Get user warnings error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user warnings' },
      { status: 500 }
    );
  }
}