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
    const { title, content, categoryId, prefixId, scheduledFor, tags, metadata } = data;

    if (!title || !content || !categoryId || !scheduledFor) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const scheduledPost = await contentManagementService.schedulePost({
      title,
      content,
      authorId: session.user.id,
      categoryId,
      prefixId,
      scheduledFor: new Date(scheduledFor),
      tags,
      metadata,
    });

    return NextResponse.json(scheduledPost, { status: 201 });
  } catch (error) {
    console.error('Schedule post error:', error);
    return NextResponse.json(
      { error: 'Failed to schedule post' },
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
    const authorId = url.searchParams.get('authorId');
    const categoryId = url.searchParams.get('categoryId');
    const upcoming = url.searchParams.get('upcoming') === 'true';
    const published = url.searchParams.get('published');

    const filters = {
      authorId: authorId || undefined,
      categoryId: categoryId || undefined,
      upcoming: upcoming || undefined,
      published: published ? published === 'true' : undefined,
    };

    const scheduledPosts = await contentManagementService.getScheduledPosts(filters);

    return NextResponse.json(scheduledPosts);
  } catch (error) {
    console.error('Get scheduled posts error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scheduled posts' },
      { status: 500 }
    );
  }
}