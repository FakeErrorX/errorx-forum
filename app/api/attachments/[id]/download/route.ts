import { NextRequest, NextResponse } from 'next/server'
import { AttachmentService } from '@/lib/attachment-service'
import { generatePresignedDownloadUrl } from '@/lib/s3'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const attachmentId = parseInt(id)
    if (isNaN(attachmentId)) {
      return NextResponse.json(
        { error: 'Invalid attachment ID' },
        { status: 400 }
      )
    }

    const attachment = await AttachmentService.getAttachment(attachmentId)
    if (!attachment) {
      return NextResponse.json(
        { error: 'Attachment not found' },
        { status: 404 }
      )
    }

    // Track download
    await AttachmentService.trackDownload(attachmentId)

    // Generate presigned download URL
    const downloadUrl = await generatePresignedDownloadUrl(
      attachment.filename,
      3600 // 1 hour expiry
    )

    if (!downloadUrl.success || !downloadUrl.url) {
      return NextResponse.json(
        { error: 'Failed to generate download URL' },
        { status: 500 }
      )
    }

    // Redirect to presigned URL
    return NextResponse.redirect(downloadUrl.url)

  } catch (error) {
    console.error('Error downloading attachment:', error)
    return NextResponse.json(
      { error: 'Failed to download attachment' },
      { status: 500 }
    )
  }
}