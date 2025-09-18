import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NotificationService } from '@/lib/notification-service'
import { z } from 'zod'

const NotificationPreferencesSchema = z.object({
  mentions: z.object({
    email: z.boolean(),
    push: z.boolean(),
    realtime: z.boolean()
  }).optional(),
  replies: z.object({
    email: z.boolean(),
    push: z.boolean(),
    realtime: z.boolean()
  }).optional(),
  follows: z.object({
    email: z.boolean(),
    push: z.boolean(),
    realtime: z.boolean()
  }).optional(),
  likes: z.object({
    email: z.boolean(),
    push: z.boolean(),
    realtime: z.boolean()
  }).optional(),
  messages: z.object({
    email: z.boolean(),
    push: z.boolean(),
    realtime: z.boolean()
  }).optional(),
  system: z.object({
    email: z.boolean(),
    push: z.boolean(),
    realtime: z.boolean()
  }).optional(),
  emailDigest: z.enum(['instant', 'hourly', 'daily', 'weekly', 'never']).optional()
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    type SessionUserWithId = { id?: string }
    const su = session?.user as unknown as SessionUserWithId | undefined
    if (!su?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const preferences = await NotificationService.getUserNotificationPreferences(su.id)

    return NextResponse.json({ preferences })
  } catch (error) {
    console.error('Error fetching notification preferences:', error)
    return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 })
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

    const body = await request.json()
    const preferences = NotificationPreferencesSchema.parse(body)

    const updatedPreferences = await NotificationService.updateNotificationPreferences(
      su.id,
      preferences
    )

    return NextResponse.json({ preferences: updatedPreferences })
  } catch (error) {
    console.error('Error updating notification preferences:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid preferences format',
        details: error.issues 
      }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 })
  }
}