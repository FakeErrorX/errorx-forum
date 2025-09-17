import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { z } from 'zod'

const featureSchema = z.object({
  postId: z.string(),
  featured: z.boolean(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    type SessionUserWithId = { id?: string }
    const su = session?.user as unknown as SessionUserWithId | undefined
    if (!su?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const permissionCheck = await hasPermission(su.id, PERMISSIONS.POSTS_FEATURE)
    if (!permissionCheck.hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = featureSchema.parse(body)

    const post = await prisma.post.update({
      where: { id: parsed.postId },
      data: {
        isFeatured: parsed.featured,
        featuredAt: parsed.featured ? new Date() : null,
        featuredById: parsed.featured ? su.id : null,
      },
    })

    return NextResponse.json({ success: true, isFeatured: post.isFeatured })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 })
    }
    console.error('Error featuring post:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


