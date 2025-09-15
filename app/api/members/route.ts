import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // Get all users with their post count and basic info
    const members = await prisma.user.findMany({
      select: {
        userId: true,
        name: true,
        username: true,
        image: true,
        bio: true,
        createdAt: true,
        postCount: true,
        reputation: true,
        isActive: true,
        _count: {
          select: {
            posts: true
          }
        }
      },
      orderBy: {
        userId: 'asc' // Order by custom user ID (1, 2, 3, 4...)
      }
    });

    // Transform the data to include post count and calculate reputation
    const membersWithStats = members.map(member => ({
      userId: member.userId, // Custom sequential user ID (only public ID)
      name: member.name,
      username: member.username,
      image: member.image,
      bio: member.bio,
      createdAt: member.createdAt.toISOString(),
      postCount: member.postCount, // Use the actual postCount from database
      reputation: member.reputation, // Use the actual reputation from database
      isActive: member.isActive
    }));

    return NextResponse.json(membersWithStats);
  } catch (error) {
    console.error("Error fetching members:", error);
    return NextResponse.json(
      { error: "Failed to fetch members" },
      { status: 500 }
    );
  }
}
