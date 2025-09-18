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
    const { name, description, title, content, categoryId, prefixId, tags, isPublic } = data;

    if (!name || !title || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const template = await contentManagementService.createContentTemplate({
      name,
      description,
      title,
      content,
      categoryId,
      threadPrefixId: prefixId,
      tags,
      isPublic: isPublic ?? false,
      authorId: session.user.id,
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error('Create content template error:', error);
    return NextResponse.json(
      { error: 'Failed to create content template' },
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
    const isPublic = url.searchParams.get('isPublic');

    const filters = {
      authorId: authorId || undefined,
      categoryId: categoryId || undefined,
      isPublic: isPublic ? isPublic === 'true' : undefined,
    };

    const templates = await contentManagementService.getContentTemplates(filters);

    return NextResponse.json(templates);
  } catch (error) {
    console.error('Get content templates error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content templates' },
      { status: 500 }
    );
  }
}