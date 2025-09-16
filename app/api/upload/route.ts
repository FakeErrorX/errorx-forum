import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { uploadToS3, generateFileKey, validateFileType, validateFileSize, ALLOWED_FILE_TYPES } from "@/lib/s3";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = (session.user as { id: string }).id;
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || 'uploads';
    const allowedTypes = formData.get('allowedTypes') as string || 'images';

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    const fileTypes = ALLOWED_FILE_TYPES[allowedTypes as keyof typeof ALLOWED_FILE_TYPES] || ALLOWED_FILE_TYPES.images;
    if (!validateFileType(file.name, fileTypes)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed types: ${fileTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSizeMB = 10;
    if (!validateFileSize(file.size, maxSizeMB)) {
      return NextResponse.json(
        { error: `File too large. Maximum size: ${maxSizeMB}MB` },
        { status: 400 }
      );
    }

    // Generate unique file key
    const fileKey = generateFileKey(file.name, userId, folder);
    
    // Convert file to buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    
    // Upload to S3
    const result = await uploadToS3(
      fileBuffer,
      fileKey,
      file.type,
      {
        originalName: file.name,
        uploadedBy: userId,
        uploadedAt: new Date().toISOString(),
      }
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Upload failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      file: {
        key: fileKey,
        url: result.url,
        name: file.name,
        size: file.size,
        type: file.type,
      }
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Upload failed" },
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

    // Generate presigned URL for file access
    const { generatePresignedDownloadUrl } = await import("@/lib/s3");
    const result = await generatePresignedDownloadUrl(key);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to generate download URL" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      url: result.url
    });
  } catch (error) {
    console.error("Download URL error:", error);
    return NextResponse.json(
      { error: "Failed to generate download URL" },
      { status: 500 }
    );
  }
}
