import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { userManagementService } from '@/lib/user-management';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ banId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Check if user has moderation permissions

    const data = await request.json();
    const { reason, notes } = data;

    if (!reason) {
      return NextResponse.json(
        { error: 'Reason is required' },
        { status: 400 }
      );
    }

    // Await the params Promise in Next.js 15
    const resolvedParams = await params;
    
    // First get the ban to find the user ID
    const bans = await userManagementService.getUserBans('all');
    const ban = bans.find((b: any) => b.id === resolvedParams.banId);
    
    if (!ban) {
      return NextResponse.json(
        { error: 'Ban not found' },
        { status: 404 }
      );
    }

    const result = await userManagementService.unbanUser(ban.userId, session.user.id);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Lift ban error:', error);
    return NextResponse.json(
      { error: 'Failed to lift ban' },
      { status: 500 }
    );
  }
}