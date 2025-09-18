import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hasEnhancedPermission, ENHANCED_PERMISSIONS } from '@/lib/permissions'
import { z } from 'zod'

const CreateBBCodeSchema = z.object({
  tag: z.string().min(1).max(20).regex(/^[a-zA-Z0-9_-]+$/, 'Tag must contain only letters, numbers, underscores, and hyphens'),
  replacement: z.string().min(1),
  example: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  hasOption: z.boolean().default(false),
  parseContent: z.boolean().default(true)
})

const UpdateBBCodeSchema = CreateBBCodeSchema.partial().extend({
  id: z.string()
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    type SessionUserWithId = { id?: string }
    const su = session?.user as unknown as SessionUserWithId | undefined
    if (!su?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin permissions
    const hasAccess = await hasEnhancedPermission(su.id, ENHANCED_PERMISSIONS.ADMIN.MANAGE_BB_CODES)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const active = searchParams.get('active')
    const search = searchParams.get('search') || ''

    const where: any = {}

    if (active !== null && active !== '') {
      where.isActive = active === 'true'
    }

    if (search) {
      where.OR = [
        { tag: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    const bbcodes = await prisma.bBCode.findMany({
      where,
      orderBy: { tag: 'asc' }
    })

    return NextResponse.json({ bbcodes })
  } catch (error) {
    console.error('Error fetching BB codes:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
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

    // Check admin permissions
    const hasAccess = await hasEnhancedPermission(su.id, ENHANCED_PERMISSIONS.ADMIN.MANAGE_BB_CODES)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const data = CreateBBCodeSchema.parse(body)

    // Check if tag already exists
    const existingBBCode = await prisma.bBCode.findUnique({
      where: { tag: data.tag }
    })

    if (existingBBCode) {
      return NextResponse.json({ error: 'BB code tag already exists' }, { status: 400 })
    }

    // Validate replacement string contains $1 for content or $option for options
    if (data.hasOption && !data.replacement.includes('$option')) {
      return NextResponse.json({ 
        error: 'Replacement string must contain $option when hasOption is true' 
      }, { status: 400 })
    }

    if (data.parseContent && !data.replacement.includes('$1')) {
      return NextResponse.json({ 
        error: 'Replacement string must contain $1 when parseContent is true' 
      }, { status: 400 })
    }

    const bbcode = await prisma.bBCode.create({
      data
    })

    return NextResponse.json(bbcode, { status: 201 })
  } catch (error) {
    console.error('Error creating BB code:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    type SessionUserWithId = { id?: string }
    const su = session?.user as unknown as SessionUserWithId | undefined
    if (!su?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin permissions
    const hasAccess = await hasEnhancedPermission(su.id, ENHANCED_PERMISSIONS.ADMIN.MANAGE_BB_CODES)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const data = UpdateBBCodeSchema.parse(body)

    const { id, ...updateData } = data

    // Check if BB code exists
    const existingBBCode = await prisma.bBCode.findUnique({
      where: { id }
    })

    if (!existingBBCode) {
      return NextResponse.json({ error: 'BB code not found' }, { status: 404 })
    }

    // Check if new tag conflicts with existing BB code
    if (updateData.tag && updateData.tag !== existingBBCode.tag) {
      const tagConflict = await prisma.bBCode.findUnique({
        where: { tag: updateData.tag }
      })

      if (tagConflict) {
        return NextResponse.json({ error: 'BB code tag already exists' }, { status: 400 })
      }
    }

    // Validate replacement string if provided
    if (updateData.replacement && updateData.hasOption !== undefined && updateData.hasOption && !updateData.replacement.includes('$option')) {
      return NextResponse.json({ 
        error: 'Replacement string must contain $option when hasOption is true' 
      }, { status: 400 })
    }

    if (updateData.replacement && updateData.parseContent !== undefined && updateData.parseContent && !updateData.replacement.includes('$1')) {
      return NextResponse.json({ 
        error: 'Replacement string must contain $1 when parseContent is true' 
      }, { status: 400 })
    }

    const updatedBBCode = await prisma.bBCode.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json(updatedBBCode)
  } catch (error) {
    console.error('Error updating BB code:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    type SessionUserWithId = { id?: string }
    const su = session?.user as unknown as SessionUserWithId | undefined
    if (!su?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin permissions
    const hasAccess = await hasEnhancedPermission(su.id, ENHANCED_PERMISSIONS.ADMIN.MANAGE_BB_CODES)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'BB code ID is required' }, { status: 400 })
    }

    // Check if BB code exists
    const bbcode = await prisma.bBCode.findUnique({
      where: { id }
    })

    if (!bbcode) {
      return NextResponse.json({ error: 'BB code not found' }, { status: 404 })
    }

    await prisma.bBCode.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'BB code deleted successfully' })
  } catch (error) {
    console.error('Error deleting BB code:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}