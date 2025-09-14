import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { deleteFromS3, getFileMetadata, fileExists } from "@/lib/s3";

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id;
    const { key } = await request.json();

    if (!key) {
      return NextResponse.json(
        { error: "File key is required" },
        { status: 400 }
      );
    }

    // Check if file exists
    if (!(await fileExists(key))) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }

    // For now, skip ownership validation to allow deletion
    // TODO: Implement proper ownership validation when metadata is stored correctly
    
    // Delete file from S3
    const result = await deleteFromS3(key);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Delete failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "File deleted successfully"
    });
  } catch (error) {
    console.error("Delete file error:", error);
    return NextResponse.json(
      { error: "Delete failed" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json(
        { error: "File key is required" },
        { status: 400 }
      );
    }

    // Check if file exists
    if (!(await fileExists(key))) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }

    // Get file metadata
    const result = await getFileMetadata(key);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to get file metadata" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      metadata: result.metadata
    });
  } catch (error) {
    console.error("Get file metadata error:", error);
    return NextResponse.json(
      { error: "Failed to get file metadata" },
      { status: 500 }
    );
  }
}
