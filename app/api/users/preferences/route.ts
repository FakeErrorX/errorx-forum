import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id;

    const body = await request.json();
    const { theme, notifications, emailUpdates } = body;

    // Validate theme
    if (theme && !['light', 'dark', 'system'].includes(theme)) {
      return NextResponse.json(
        { error: "Invalid theme value" },
        { status: 400 }
      );
    }

    // Get current preferences
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { preferences: true }
    });

    const currentPreferences = (currentUser?.preferences as Record<string, unknown>) || {
      theme: 'system',
      notifications: true,
      emailUpdates: true
    };

    // Build update data
    const updateData: Record<string, unknown> = {
      preferences: {
        ...currentPreferences,
        ...(theme !== undefined && { theme }),
        ...(notifications !== undefined && { notifications }),
        ...(emailUpdates !== undefined && { emailUpdates })
      }
    };

    // Update user preferences
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        image: true,
        bio: true,
        postCount: true,
        reputation: true,
        isActive: true,
        preferences: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating preferences:", error);
    return NextResponse.json(
      { error: "Failed to update preferences" },
      { status: 500 }
    );
  }
}
