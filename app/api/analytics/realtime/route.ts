import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AnalyticsService } from '@/lib/analytics-service';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const analyticsService = new AnalyticsService(prisma);
    const realTimeMetrics = await analyticsService.getRealTimeMetrics();

    return NextResponse.json({
      success: true,
      data: realTimeMetrics
    });

  } catch (error) {
    console.error('Real-time analytics API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch real-time metrics' },
      { status: 500 }
    );
  }
}