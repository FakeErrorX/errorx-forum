import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AnalyticsService } from '@/lib/analytics-service';
import { z } from 'zod';

const userAnalyticsSchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  period: z.enum(['7d', '30d', '90d']).default('30d')
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const resolvedParams = await params;
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const targetUserId = resolvedParams.userId;
    
    // Users can only view their own analytics unless they're admin/moderator
    if (session.user.id !== targetUserId) {
      const user = await (prisma as any).user.findUnique({
        where: { id: session.user.id },
        include: { role: true }
      });

      if (!user?.role?.name || !['admin', 'moderator'].includes(user.role.name)) {
        return NextResponse.json(
          { success: false, error: 'Insufficient permissions' },
          { status: 403 }
        );
      }
    }

    const searchParams = request.nextUrl.searchParams;
    
    const queryParams = userAnalyticsSchema.parse({
      dateFrom: searchParams.get('dateFrom'),
      dateTo: searchParams.get('dateTo'),
      period: searchParams.get('period')
    });

    // Calculate date range
    let dateFrom: Date, dateTo: Date;
    
    if (queryParams.dateFrom && queryParams.dateTo) {
      dateFrom = new Date(queryParams.dateFrom);
      dateTo = new Date(queryParams.dateTo);
    } else {
      dateTo = new Date();
      switch (queryParams.period) {
        case '7d':
          dateFrom = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          dateFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          dateFrom = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
          break;
      }
    }

    const analyticsService = new AnalyticsService(prisma);
    const userAnalytics = await analyticsService.getUserAnalytics(targetUserId, dateFrom, dateTo);

    return NextResponse.json({
      success: true,
      data: {
        ...userAnalytics,
        period: {
          from: dateFrom.toISOString(),
          to: dateTo.toISOString(),
          label: queryParams.period
        }
      }
    });

  } catch (error) {
    console.error('User analytics API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid parameters', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch user analytics' },
      { status: 500 }
    );
  }
}