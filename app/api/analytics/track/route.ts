import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AnalyticsService } from '@/lib/analytics-service';
import { z } from 'zod';

const trackEventSchema = z.object({
  eventType: z.string().min(1),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  properties: z.record(z.string(), z.any()).optional(),
  pathname: z.string().optional()
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    
    const eventData = trackEventSchema.parse(body);
    
    // Get additional request context
    const userAgent = request.headers.get('user-agent') || undefined;
    const referer = request.headers.get('referer') || undefined;
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const ipAddress = forwardedFor?.split(',')[0] || realIP || 'unknown';

    // Generate session ID if not provided
    const sessionId = request.cookies.get('session-id')?.value || 
      `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const analyticsService = new AnalyticsService(prisma);
    
    await analyticsService.trackEvent({
      eventType: eventData.eventType,
      userId: session?.user?.id,
      sessionId,
      entityType: eventData.entityType,
      entityId: eventData.entityId,
      properties: eventData.properties,
      userAgent,
      ipAddress,
      referrer: referer,
      pathname: eventData.pathname
    });

    return NextResponse.json({
      success: true,
      message: 'Event tracked successfully'
    });

  } catch (error) {
    console.error('Track event API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid event data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to track event' },
      { status: 500 }
    );
  }
}