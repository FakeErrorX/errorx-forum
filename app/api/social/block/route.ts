import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { SocialFeaturesService } from '@/lib/social-features-service'
import { z } from 'zod'

// POST /api/social/block - Block a user
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const blockSchema = z.object({
      userId: z.string().min(1),
      reason: z.string().optional()
    })

    const body = await request.json()
    const { userId, reason } = blockSchema.parse(body)

    const block = await SocialFeaturesService.blockUser({
      blockerId: session.user.id,
      blockedId: userId,
      reason
    })

    return NextResponse.json(block, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error blocking user:', error)
    const message = error instanceof Error ? error.message : 'Failed to block user'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// DELETE /api/social/block - Unblock a user
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const result = await SocialFeaturesService.unblockUser(session.user.id, userId)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error unblocking user:', error)
    const message = error instanceof Error ? error.message : 'Failed to unblock user'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}