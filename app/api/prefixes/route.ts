import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createSchema = z.object({ name: z.string().min(1).max(30), color: z.string().optional(), categoryId: z.string().optional() })
const updateSchema = z.object({ id: z.string(), name: z.string().min(1).max(30).optional(), color: z.string().optional(), categoryId: z.string().optional() })

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('categoryId') || undefined
    const prefixes = await prisma.threadPrefix.findMany({ where: { categoryId: categoryId || undefined }, orderBy: { name: 'asc' } })
    return NextResponse.json({ prefixes })
  } catch (error) {
    console.error('Error fetching prefixes:', error)
    return NextResponse.json({ error: 'Failed to fetch prefixes' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const su = session?.user as { id?: string } | undefined
    if (!su?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await request.json()
    const parsed = createSchema.parse(body)
    const prefix = await prisma.threadPrefix.create({ data: parsed })
    return NextResponse.json({ prefix }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 })
    }
    console.error('Error creating prefix:', error)
    return NextResponse.json({ error: 'Failed to create prefix' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const su = session?.user as { id?: string } | undefined
    if (!su?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await request.json()
    const parsed = updateSchema.parse(body)
    const { id, ...data } = parsed
    const prefix = await prisma.threadPrefix.update({ where: { id }, data })
    return NextResponse.json({ prefix })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 })
    }
    console.error('Error updating prefix:', error)
    return NextResponse.json({ error: 'Failed to update prefix' }, { status: 500 })
  }
}


