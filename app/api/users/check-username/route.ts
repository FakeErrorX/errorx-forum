import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json();

    if (!username) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    if (username.length < 3) {
      return NextResponse.json(
        { available: false, message: "Username must be at least 3 characters long" },
        { status: 200 }
      );
    }

    // Check if username exists (case-insensitive)
    const existingUser = await prisma.user.findFirst({
      where: {
        username: {
          equals: username,
          mode: 'insensitive'
        }
      },
      select: { id: true }
    });

    if (existingUser) {
      return NextResponse.json(
        { available: false, message: "Username is already taken" },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { available: true, message: "Username is available" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error checking username availability:", error);
    return NextResponse.json(
      { error: "Failed to check username availability" },
      { status: 500 }
    );
  }
}
