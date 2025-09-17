import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { z } from 'zod'

const createTagSchema = z.object({
  name: z.string().min(1).max(50),
})

const searchSchema = z.object({
  search: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    
    const tags = await prisma.tag.findMany({
      where: search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { slug: { contains: search, mode: 'insensitive' } }
        ]
      } : {},
      include: {
        posts: {
          select: {
            postId: true
          }
        }
      },
      orderBy: { name: 'asc' }
    })

    const tagsWithCount = tags.map(tag => ({
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
      postCount: tag.posts.length,
      createdAt: tag.createdAt
    }))

    return NextResponse.json({ tags: tagsWithCount })
  } catch (error) {
    console.error('Error fetching tags:', error)
    return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    type SessionUserWithId = { id?: string }
    const su = session?.user as unknown as SessionUserWithId | undefined
    if (!su?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const permissionCheck = await hasPermission(su.id, PERMISSIONS.POSTS_TAG)
    if (!permissionCheck.hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { name } = createTagSchema.parse(body)

    // Create slug from name
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

    // Check if tag already exists
    const existingTag = await prisma.tag.findFirst({
      where: {
        OR: [
          { name: { equals: name, mode: 'insensitive' } },
          { slug: slug }
        ]
      }
    })

    if (existingTag) {
      return NextResponse.json({ error: 'Tag already exists' }, { status: 409 })
    }

    const tag = await prisma.tag.create({
      data: {
        name,
        slug
      }
    })

    return NextResponse.json({ tag }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 })
    }
    console.error('Error creating tag:', error)
    return NextResponse.json({ error: 'Failed to create tag' }, { status: 500 })
  }
}
