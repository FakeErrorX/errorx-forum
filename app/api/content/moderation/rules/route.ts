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
    const { name, description, pattern, action, enabled, categoryIds, severity, metadata } = data;

    if (!name || !pattern || !action) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const rule = await contentManagementService.createModerationRule({
      name,
      description,
      pattern,
      action,
      enabled: enabled ?? true,
      categoryIds,
      severity,
      metadata,
    });

    return NextResponse.json(rule, { status: 201 });
  } catch (error) {
    console.error('Create moderation rule error:', error);
    return NextResponse.json(
      { error: 'Failed to create moderation rule' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // For now, return empty array since the models need to be fixed
    return NextResponse.json([]);
  } catch (error) {
    console.error('Get moderation rules error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch moderation rules' },
      { status: 500 }
    );
  }
}