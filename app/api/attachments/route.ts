import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { AttachmentService } from '@/lib/attachment-service'

// Upload attachments
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get form data
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    
    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      )
    }

    // Upload options from form data
    const maxFileSizeStr = formData.get('maxFileSize') as string
    const maxFileSize = maxFileSizeStr ? parseInt(maxFileSizeStr) : undefined
    
    const allowedMimeTypesStr = formData.get('allowedMimeTypes') as string
    const allowedMimeTypes = allowedMimeTypesStr ? JSON.parse(allowedMimeTypesStr) : undefined

    const options = {
      maxFileSize,
      allowedMimeTypes
    }

    // Upload all files
    const results = []
    const errors = []

    for (const file of files) {
      try {
        const uploadedAttachment = await AttachmentService.uploadAttachment(file, options)
        results.push(uploadedAttachment)
      } catch (error) {
        errors.push({
          filename: file.name,
          error: error instanceof Error ? error.message : 'Upload failed'
        })
      }
    }

    return NextResponse.json({
      success: true,
      uploaded: results,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    console.error('Error uploading attachments:', error)
    return NextResponse.json(
      { error: 'Failed to upload attachments' },
      { status: 500 }
    )
  }
}

// Get user's unattached files (for cleanup)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // This would need additional logic to filter by user
    // For now, just return empty array
    return NextResponse.json([])

  } catch (error) {
    console.error('Error fetching attachments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch attachments' },
      { status: 500 }
    )
  }
}