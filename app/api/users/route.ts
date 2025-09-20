import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserProfile, getUserProfileByCustomId, updateUserProfile } from "../users";
import { prisma } from "@/lib/prisma";
import { updateUserSchema, paginationSchema } from "@/lib/validations";
import { validateRequestBody, validateQueryParams, handleValidationError } from "@/lib/api-validation";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // session.user.id is the internal CUID, not the custom userId
    const internalUserId = (session.user as { id: string }).id;
    console.log('GET /api/users - internalUserId:', internalUserId);
    
    const user = await getUserProfile(internalUserId);
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    console.log('GET /api/users - found user:', { userId: user.userId, name: user.name, email: user.email });

    // Calculate username change cooldown
    const rawUserAny = await prisma.user.findUnique({
      where: { id: internalUserId }
    });

    let canChangeUsername = true;
    let usernameChangeDaysLeft = 0;
    let nextUsernameChangeAt: string | null = null;
    const lastChangeAt = (rawUserAny as unknown as { lastUsernameChangeAt?: Date | null })?.lastUsernameChangeAt;
    if (lastChangeAt) {
      const now = new Date();
      const millisSince = now.getTime() - new Date(lastChangeAt).getTime();
      const daysSince = millisSince / (1000 * 60 * 60 * 24);
      if (daysSince < 30) {
        canChangeUsername = false;
        usernameChangeDaysLeft = Math.ceil(30 - daysSince);
        const nextAt = new Date(lastChangeAt);
        nextAt.setDate(nextAt.getDate() + 30);
        nextUsernameChangeAt = nextAt.toISOString();
      }
    }

    // User data already has internal ID removed and custom userId exposed
    return NextResponse.json({
      ...user,
      canChangeUsername,
      usernameChangeDaysLeft,
      nextUsernameChangeAt
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // session.user.id is the internal CUID, not the custom userId
    const internalUserId = (session.user as { id: string }).id;
    const body = await request.json();
    const { name, username, bio, image, preferences, location, website, birthday, timezone, socialLinks, interests, skills } = body;

    // Get the current user data
    const user = await getUserProfile(internalUserId);
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // If username is being changed, enforce 30-day cooldown
    if (typeof username === "string" && username !== user.username) {
      const now = new Date();
      const lastChangeUser = await prisma.user.findUnique({
        where: { id: internalUserId },
        select: { lastUsernameChangeAt: true }
      });

      const lastChangeAt = (lastChangeUser as unknown as { lastUsernameChangeAt?: Date | null })?.lastUsernameChangeAt;
      if (lastChangeAt instanceof Date) {
        const millisSince = now.getTime() - lastChangeAt.getTime();
        const daysSince = millisSince / (1000 * 60 * 60 * 24);
        if (daysSince < 30) {
          const daysLeft = Math.ceil(30 - daysSince);
          return NextResponse.json(
            { error: `You can change your username again in ${daysLeft} day(s).` },
            { status: 400 }
          );
        }
      }

      // Check if the new username is already taken
      const existingUser = await prisma.user.findUnique({
        where: { username: username }
      });
      
      if (existingUser && existingUser.id !== internalUserId) {
        return NextResponse.json(
          { error: "Username is already taken. Please choose a different one." },
          { status: 400 }
        );
      }
    }

    const isUsernameChanging = typeof username === "string" && username !== user.username;
    const updatedUser = await updateUserProfile(internalUserId, {
      name,
      username,
      bio,
      image,
      preferences,
      location,
      website,
      birthday,
      timezone,
      socialLinks,
      interests,
      skills,
      ...(isUsernameChanging
        ? ({ lastUsernameChangeAt: new Date() } as unknown as Record<string, unknown>)
        : {})
    });

    if (!updatedUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // User data already has internal ID removed and custom userId exposed
    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: "User registration is only available through Google OAuth. Please use the 'Sign in with Google' option." },
    { status: 403 }
  );
}
