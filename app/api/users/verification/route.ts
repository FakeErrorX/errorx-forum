import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { userManagementService, VerificationType } from '@/lib/user-management';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { type, documentUrl, notes } = data;

    if (!type || !Object.values(VerificationType).includes(type)) {
      return NextResponse.json(
        { error: 'Valid verification type is required' },
        { status: 400 }
      );
    }

    const verification = await userManagementService.requestVerification(
      session.user.id,
      type,
      documentUrl,
      notes
    );

    return NextResponse.json(verification, { status: 201 });
  } catch (error) {
    console.error('Request verification error:', error);
    return NextResponse.json(
      { error: 'Failed to request verification' },
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
    const userId = url.searchParams.get('userId') || session.user.id;

    // Check if user can view verifications for this user
    if (userId !== session.user.id) {
      // TODO: Check if user has admin permissions
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const verifications = await userManagementService.getUserVerifications(userId);

    return NextResponse.json(verifications);
  } catch (error) {
    console.error('Get verifications error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch verifications' },
      { status: 500 }
    );
  }
}