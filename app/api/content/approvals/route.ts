import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { contentManagementService } from '@/lib/content-management';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { postId, notes } = data;

    if (!postId) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      );
    }

    const approval = await contentManagementService.submitForApproval(
      postId,
      session.user.id,
      notes
    );

    return NextResponse.json(approval, { status: 201 });
  } catch (error) {
    console.error('Submit for approval error:', error);
    return NextResponse.json(
      { error: 'Failed to submit for approval' },
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
    const categoryId = url.searchParams.get('categoryId');

    const approvals = await contentManagementService.getPendingApprovals(
      categoryId || undefined
    );

    return NextResponse.json(approvals);
  } catch (error) {
    console.error('Get pending approvals error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pending approvals' },
      { status: 500 }
    );
  }
}