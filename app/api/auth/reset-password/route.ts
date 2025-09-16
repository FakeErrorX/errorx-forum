import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { resetPasswordSchema } from "@/lib/validations";
import { validateRequestBody, handleValidationError } from "@/lib/api-validation";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    // Validate request body
    const body = await request.json();
    const { token, password } = validateRequestBody(resetPasswordSchema, body);

    // Token and password are already validated by Zod schema

    // Password strength is already validated by Zod schema

    // Look up the reset token in the database
    const resetRecord = await prisma.passwordReset.findUnique({
      where: { token },
      include: { user: true }
    });

    if (!resetRecord || resetRecord.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    const user = resetRecord.user;

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update user's password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });

    // Delete the used reset token
    await prisma.passwordReset.delete({
      where: { id: resetRecord.id }
    });

    // In production, you would also:
    // 1. Invalidate any existing user sessions
    // 2. Send a confirmation email

    return NextResponse.json(
      { message: "Password has been reset successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error resetting password:", error);
    if (error instanceof Error && error.message.includes('validation')) {
      return handleValidationError(error);
    }
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 }
    );
  }
}
