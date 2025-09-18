import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { userManagementService } from '@/lib/user-management';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Check if user has admin permissions

    const data = await request.json();
    const { name, description, icon, category, criteria, color, rarity } = data;

    if (!name || !description) {
      return NextResponse.json(
        { error: 'Name and description are required' },
        { status: 400 }
      );
    }

    const badge = await userManagementService.createBadge({
      name,
      displayName: name,
      description,
      icon,
      category,
      requirements: criteria || {},
      color,
      rarity,
    });

    return NextResponse.json(badge, { status: 201 });
  } catch (error) {
    console.error('Create badge error:', error);
    return NextResponse.json(
      { error: 'Failed to create badge' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const badges = await userManagementService.getAllBadges();
    return NextResponse.json(badges);
  } catch (error) {
    console.error('Get badges error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch badges' },
      { status: 500 }
    );
  }
}