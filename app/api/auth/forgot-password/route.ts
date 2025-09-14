import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true }
    });

    if (!user) {
      // Don't reveal if user exists or not for security
      return NextResponse.json(
        { message: "If an account with that email exists, we've sent a password reset link." },
        { status: 200 }
      );
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Clean up any existing reset tokens for this user
    await prisma.passwordReset.deleteMany({
      where: { userId: user.id }
    });

    // Store reset token in database
    await prisma.passwordReset.create({
      data: {
        token: resetToken,
        userId: user.id,
        expiresAt: resetTokenExpiry
      }
    });

    // In a real application, you would:
    // 1. Store the reset token in a separate table with expiry
    // 2. Send an email with the reset link
    // 3. Use a proper email service like SendGrid, Resend, etc.

    // For demo purposes, we'll just return the token
    // In production, this should be sent via email
    const resetLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    // TODO: Implement actual email sending
    console.log(`Password reset link for ${user.email}: ${resetLink}`);

    return NextResponse.json(
      { 
        message: "If an account with that email exists, we've sent a password reset link.",
        // Only include this in development
        ...(process.env.NODE_ENV === 'development' && { resetLink })
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing password reset request:", error);
    return NextResponse.json(
      { error: "Failed to process password reset request" },
      { status: 500 }
    );
  }
}
