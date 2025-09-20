import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Return default settings structure if no settings exist
    const defaultSettings = {
      privacy: {
        showOnline: true,
        showEmail: false,
        showBirthday: false,
        showLocation: true,
        allowProfileViews: true,
        allowDirectMessages: true,
        allowMentions: true,
        searchableProfile: true,
        showActivity: true,
      },
      notifications: {
        email: {
          mentions: true,
          replies: true,
          follows: true,
          likes: false,
          messages: true,
          newsletters: false,
          digest: true,
          security: true,
        },
        push: {
          mentions: true,
          replies: true,
          follows: false,
          likes: false,
          messages: true,
          system: true,
        },
        frequency: {
          digestFrequency: 'weekly' as const,
          quietHours: {
            enabled: false,
            start: '22:00',
            end: '08:00',
          },
        },
      },
      content: {
        theme: 'system' as const,
        language: 'en',
        timezone: 'UTC',
        postsPerPage: 20,
        showImages: true,
        showAvatars: true,
        autoPlayVideos: false,
        compactMode: false,
      },
      security: {
        twoFactorEnabled: false,
        loginNotifications: true,
        sessionTimeout: 1440, // 24 hours
        trustedDevices: [],
      },
    };

    // TODO: Load actual settings from database when settings table is created
    // For now, return defaults merged with any preferences from user table
    const userPreferences = user.preferences as any;
    const settings = {
      ...defaultSettings,
      content: {
        ...defaultSettings.content,
        theme: userPreferences?.theme || 'system',
      },
      notifications: {
        ...defaultSettings.notifications,
        email: {
          ...defaultSettings.notifications.email,
          // Map existing preferences if available
        },
      },
    };

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching user settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { section, data } = body;

    if (!section || !data) {
      return NextResponse.json(
        { error: 'Section and data are required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // TODO: Implement proper settings storage when settings table is added to schema
    // For now, handle basic theme preference in user table
    if (section === 'content' && data.theme) {
      const currentPreferences = user.preferences as any || {};
      await prisma.user.update({
        where: { id: user.id },
        data: {
          preferences: {
            ...currentPreferences,
            theme: data.theme,
          },
        },
      });
    }

    // TODO: Store other settings in dedicated settings table
    // This would require adding a UserSettings model to the Prisma schema

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating user settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}