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

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Check permissions - user can view their own activities, admins can view all
    if (resolvedParams.userId !== session.user.id) {
      // TODO: Check if user has admin permissions
    }

    const activities = await userManagementService.getUserActivity(
      resolvedParams.userId,
      limit
    );

    return NextResponse.json(activities);
  } catch (error) {
    console.error('Get user activities error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user activities' },
      { status: 500 }
    );
  }
}