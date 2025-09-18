import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AnalyticsService } from '@/lib/analytics-service';
import { z } from 'zod';

const dashboardSchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  period: z.enum(['7d', '30d', '90d', '1y']).default('30d')
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user has admin permissions
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

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

    const searchParams = request.nextUrl.searchParams;
    
    const params = dashboardSchema.parse({
      dateFrom: searchParams.get('dateFrom'),
      dateTo: searchParams.get('dateTo'),
      period: searchParams.get('period')
    });

    // Calculate date range if not provided
    let dateFrom: Date, dateTo: Date;
    
    if (params.dateFrom && params.dateTo) {
      dateFrom = new Date(params.dateFrom);
      dateTo = new Date(params.dateTo);
    } else {
      dateTo = new Date();
      switch (params.period) {
        case '7d':
          dateFrom = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          dateFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          dateFrom = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
          break;
        case '1y':
          dateFrom = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          dateFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      }
    }

    const analyticsService = new AnalyticsService(prisma);
    const metrics = await analyticsService.getDashboardMetrics(dateFrom, dateTo);

    return NextResponse.json({
      success: true,
      data: {
        ...metrics,
        period: {
          from: dateFrom.toISOString(),
          to: dateTo.toISOString(),
          label: params.period
        }
      }
    });

  } catch (error) {
    console.error('Analytics dashboard API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid parameters', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics dashboard' },
      { status: 500 }
    );
  }
}