import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { userManagementService } from '@/lib/user-management';

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
    const userId = resolvedParams.userId;
    const profile = await userManagementService.getUserProfile(userId);

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Check privacy settings
    if (!profile.isPublic && profile.userId !== session.user.id) {
      // TODO: Check if user has permission to view private profiles
      return NextResponse.json({ error: 'Profile is private' }, { status: 403 });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Get user profile error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    const userId = resolvedParams.userId;

    // Check if user can edit this profile
    if (userId !== session.user.id) {
      // TODO: Check if user has admin permissions
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updates = await request.json();
    const profile = await userManagementService.updateUserProfile(userId, updates);

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Update user profile error:', error);
    return NextResponse.json(
      { error: 'Failed to update user profile' },
      { status: 500 }
    );
  }
}