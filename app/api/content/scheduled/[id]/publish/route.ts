import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { contentManagementService } from '@/lib/content-management';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Await the params Promise in Next.js 15
    const resolvedParams = await params;
    const scheduledPostId = resolvedParams.id;
    const post = await contentManagementService.publishScheduledPost(scheduledPostId);

    return NextResponse.json(post);
  } catch (error) {
    console.error('Publish scheduled post error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to publish post' },
      { status: 500 }
    );
  }
}