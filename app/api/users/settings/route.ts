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
      include: {
        settings: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Default settings structure
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

    // Merge with actual settings from database if they exist
    if (user.settings) {
      const privacySettings = (user.settings.privacySettings as any) || {};
      const contentSettings = (user.settings.contentSettings as any) || {};
      const moderationSettings = (user.settings.moderationSettings as any) || {};
      const customSettings = (user.settings.customSettings as any) || {};

      const settings = {
        privacy: {
          ...defaultSettings.privacy,
          ...privacySettings,
        },
        notifications: {
          ...defaultSettings.notifications,
          ...(customSettings.notifications || {}),
        },
        content: {
          ...defaultSettings.content,
          theme: user.settings.theme,
          language: user.settings.language,
          timezone: user.settings.timezone,
          ...contentSettings,
        },
        security: {
          ...defaultSettings.security,
          ...(customSettings.security || {}),
        },
      };

      return NextResponse.json(settings);
    } else {
      // Create default settings for user
      await prisma.userSettings.create({
        data: {
          userId: user.id,
          theme: 'system',
          language: 'en',
          timezone: 'UTC',
        },
      });

      return NextResponse.json(defaultSettings);
    }
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
      include: {
        settings: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create or update user settings
    const currentSettings = user.settings;
    const currentPrivacySettings = currentSettings ? (currentSettings.privacySettings as any) || {} : {};
    const currentContentSettings = currentSettings ? (currentSettings.contentSettings as any) || {} : {};
    const currentCustomSettings = currentSettings ? (currentSettings.customSettings as any) || {} : {};

    let updateData: any = {};

    switch (section) {
      case 'privacy':
        updateData.privacySettings = {
          ...currentPrivacySettings,
          ...data,
        };
        break;

      case 'content':
        updateData.theme = data.theme || (currentSettings?.theme) || 'system';
        updateData.language = data.language || (currentSettings?.language) || 'en';
        updateData.timezone = data.timezone || (currentSettings?.timezone) || 'UTC';
        updateData.contentSettings = {
          ...currentContentSettings,
          ...data,
        };
        break;

      case 'notifications':
        updateData.customSettings = {
          ...currentCustomSettings,
          notifications: data,
        };
        break;

      case 'security':
        updateData.customSettings = {
          ...currentCustomSettings,
          security: data,
        };
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid section' },
          { status: 400 }
        );
    }

    if (user.settings) {
      // Update existing settings
      await prisma.userSettings.update({
        where: { userId: user.id },
        data: updateData,
      });
    } else {
      // Create new settings
      await prisma.userSettings.create({
        data: {
          userId: user.id,
          theme: updateData.theme || 'system',
          language: updateData.language || 'en',
          timezone: updateData.timezone || 'UTC',
          privacySettings: updateData.privacySettings || {},
          contentSettings: updateData.contentSettings || {},
          customSettings: updateData.customSettings || {},
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating user settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}