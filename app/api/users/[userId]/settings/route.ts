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

    const resolvedParams = await params;

    if (resolvedParams.userId !== session.user.id) {
      // TODO: Check if user has admin permissions
    }

    const data = await request.json();

    const result = await userManagementService.updateUserSettings(
      resolvedParams.userId,
      data
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Update user settings error:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
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

    const resolvedParams = await params;

    if (resolvedParams.userId !== session.user.id) {
      // TODO: Check if user has admin permissions
    }

    const settings = await userManagementService.getUserSettings(resolvedParams.userId);

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Get user settings error:', error);
    return NextResponse.json(
      { error: 'Failed to get settings' },
      { status: 500 }
    );
  }
}
