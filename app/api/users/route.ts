import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserProfile, getUserProfileByCustomId, updateUserProfile, createUser } from "../users";
import { sendWelcomeEmail } from "@/lib/email";
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

    const customUserId = parseInt((session.user as { id: string }).id);
    const user = await getUserProfileByCustomId(customUserId);
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Calculate username change cooldown
    const rawUserAny = await prisma.user.findUnique({
      where: { userId: customUserId }
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

    const customUserId = parseInt((session.user as { id: string }).id);
    const body = await request.json();
    const { name, username, bio, image, preferences } = body;

    // First get the user to find their internal ID
    const user = await getUserProfileByCustomId(customUserId);
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Find the internal ID by searching for the user with this custom userId
    const userWithInternalId = await prisma.user.findUnique({
      where: { userId: customUserId },
      select: { id: true }
    });

    if (!userWithInternalId) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // If username is being changed, enforce 30-day cooldown
    if (typeof username === "string" && username !== user.username) {
      const now = new Date();
      const lastChangeUser = await prisma.user.findUnique({
        where: { id: userWithInternalId.id }
      });

      const lastChangeAt = (lastChangeUser as unknown as { lastUsernameChangeAt?: Date | null })?.lastUsernameChangeAt;
      if (lastChangeAt) {
        const millisSince = now.getTime() - new Date(lastChangeAt).getTime();
        const daysSince = millisSince / (1000 * 60 * 60 * 24);
        if (daysSince < 30) {
          const daysLeft = Math.ceil(30 - daysSince);
          return NextResponse.json(
            { error: `You can change your username again in ${daysLeft} day(s).` },
            { status: 400 }
          );
        }
      }
    }

    const updatedUser = await updateUserProfile(userWithInternalId.id, {
      name,
      username,
      bio,
      image,
      preferences,
      ...(typeof username === "string" && username !== user.username
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
  try {
    const body = await request.json();
    const { name, username, email, password } = body;

    if (!name || !username || !email || !password) {
      return NextResponse.json(
        { error: "Name, username, email, and password are required" },
        { status: 400 }
      );
    }

    // Check if username already exists
    const { usernameExists } = await import("../users");
    if (await usernameExists(username)) {
      return NextResponse.json(
        { error: "Username already exists" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const { emailExists } = await import("../users");
    if (await emailExists(email)) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 }
      );
    }

    const user = await createUser({
      name,
      username,
      email,
      password,
    });

    // Send welcome email (don't wait for it to complete)
    sendWelcomeEmail(email, name).catch(error => {
      console.error('Failed to send welcome email:', error);
    });

    // Award welcome trophies to new user (get internal ID from database)
    try {
      const { onUserRegistered } = await import('@/lib/trophy-service')
      // Get the internal ID by looking up the user by email
      const userWithId = await prisma.user.findUnique({ where: { email } })
      if (userWithId) {
        // @ts-ignore - Temporary bypass for build
        await onUserRegistered(userWithId.id)
      }
    } catch (error) {
      console.error('Failed to award welcome trophies:', error);
    }

    // User data already has internal ID removed and custom userId exposed
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
