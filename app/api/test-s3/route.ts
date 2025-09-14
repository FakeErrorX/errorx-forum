import { NextRequest, NextResponse } from "next/server";
import { testS3Connection } from "@/lib/s3";

export async function GET(request: NextRequest) {
  try {
    const result = await testS3Connection();
    
    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: result.error || "S3 connection failed" 
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        success: true, 
        message: "S3 connection successful! Storage service is ready.",
        bucket: process.env.S3_BUCKET_NAME,
        region: process.env.S3_REGION,
        endpoint: process.env.S3_ENDPOINT
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("S3 test error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}
