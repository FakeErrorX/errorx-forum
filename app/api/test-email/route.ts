import { NextRequest, NextResponse } from "next/server";
import { verifyEmailConnection, sendPasswordResetEmail } from "@/lib/email";

export async function GET(request: NextRequest) {
  try {
    // Test SMTP connection
    const isConnected = await verifyEmailConnection();
    
    if (!isConnected) {
      return NextResponse.json(
        { 
          success: false, 
          error: "SMTP connection failed. Please check your SMTP configuration." 
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        success: true, 
        message: "SMTP connection successful! Email service is ready." 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Email test error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, type = "reset" } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Test email sending
    const testResetLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=test-token-123`;
    
    const result = await sendPasswordResetEmail(email, testResetLink, "Test User");

    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: result.error || "Failed to send test email" 
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        success: true, 
        message: "Test email sent successfully!",
        messageId: result.messageId
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Test email error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}
