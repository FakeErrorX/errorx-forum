import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { MessagingService } from '@/lib/messaging-service'

// GET /api/messaging/search - Search messages
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const conversationId = searchParams.get('conversationId') || undefined

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: 'Query must be at least 2 characters long' },
        { status: 400 }
      )
    }

    const messages = await MessagingService.searchMessages(
      session.user.id,
      query.trim(),
      conversationId
    )

    return NextResponse.json({ 
      messages,
      query: query.trim(),
      conversationId 
    })
  } catch (error) {
    console.error('Error searching messages:', error)
    return NextResponse.json(
      { error: 'Failed to search messages' },
      { status: 500 }
    )
  }
}