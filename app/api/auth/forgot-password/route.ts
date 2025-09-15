import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email or username is required" },
        { status: 400 }
      );
    }

    // Check if the input is an email or username
    const isEmail = email.includes('@')
    
    let user = null
    if (isEmail) {
      // Search by email
      user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, email: true, name: true }
      })
    } else {
      // Search by username (case-insensitive)
      user = await prisma.user.findFirst({
        where: {
          username: {
            equals: email,
            mode: 'insensitive'
          }
        },
        select: { id: true, email: true, name: true }
      })
    }

    if (!user) {
      // Don't reveal if user exists or not for security
      return NextResponse.json(
        { message: "If an account with that email or username exists, we've sent a password reset link." },
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

    // Generate reset link
    const resetLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    // Send password reset email
    const emailResult = await sendPasswordResetEmail(user.email, resetLink, user.name || undefined);

    if (!emailResult.success) {
      console.error('Failed to send password reset email:', emailResult.error);
      // Still return success to user for security (don't reveal if email failed)
    }

    return NextResponse.json(
      { 
        message: "If an account with that email or username exists, we've sent a password reset link.",
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
