import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Trophy creation/update schema
const trophySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  criteria: z.string().min(1), // JSON string for criteria
  icon: z.string().optional(),
  points: z.number().int().min(0).default(0),
  category: z.string().optional(),
  rarity: z.enum(['common', 'uncommon', 'rare', 'epic', 'legendary']).default('common'),
  isActive: z.boolean().default(true)
})

// GET /api/admin/trophies - List all trophies
export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const category = searchParams.get('category')
    const rarity = searchParams.get('rarity')
    const isActive = searchParams.get('isActive')

    const offset = (page - 1) * limit

    const where: any = {}
    if (category) where.category = category
    if (rarity) where.rarity = rarity
    if (isActive !== null) where.isActive = isActive === 'true'

    const [trophies, total] = await Promise.all([
      prisma.trophy.findMany({
        where,
        orderBy: [
          { category: 'asc' },
          { rarity: 'asc' },
          { name: 'asc' }
        ],
        skip: offset,
        take: limit,
        include: {
          _count: {
            select: {
              userTrophies: true
            }
          }
        }
      }),
      prisma.trophy.count({ where })
    ])

    return NextResponse.json({
      trophies: trophies.map(trophy => ({
        id: trophy.id,
        trophyId: trophy.trophyId,
        name: trophy.name,
        description: trophy.description,
        criteria: trophy.criteria,
        icon: trophy.icon,
        points: trophy.points,
        category: trophy.category,
        rarity: trophy.rarity,
        isActive: trophy.isActive,
        userCount: trophy._count.userTrophies,
        createdAt: trophy.createdAt,
        updatedAt: trophy.updatedAt
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching trophies:', error)
    return NextResponse.json(
      { error: 'Failed to fetch trophies' },
      { status: 500 }
    )
  }
}

// POST /api/admin/trophies - Create new trophy
export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = trophySchema.parse(body)

    const trophy = await prisma.trophy.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        criteria: validatedData.criteria,
        icon: validatedData.icon,
        points: validatedData.points,
        category: validatedData.category,
        rarity: validatedData.rarity,
        isActive: validatedData.isActive
      }
    })

    return NextResponse.json({
      trophy: {
        id: trophy.id,
        trophyId: trophy.trophyId,
        name: trophy.name,
        description: trophy.description,
        criteria: trophy.criteria,
        icon: trophy.icon,
        points: trophy.points,
        category: trophy.category,
        rarity: trophy.rarity,
        isActive: trophy.isActive,
        createdAt: trophy.createdAt,
        updatedAt: trophy.updatedAt
      }
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error creating trophy:', error)
    return NextResponse.json(
      { error: 'Failed to create trophy' },
      { status: 500 }
    )
  }
}