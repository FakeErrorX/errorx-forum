import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { performance } from '@/lib/monitoring';
import { withSecurity } from '@/lib/security-middleware';

async function metricsHandler(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Check if user has admin permissions

    const url = new URL(request.url);
    const timeRange = parseInt(url.searchParams.get('timeRange') || '3600000'); // Default 1 hour
    const format = url.searchParams.get('format') || 'json';

    const stats = performance.getStats(timeRange);
    const health = performance.getHealth();

    if (format === 'prometheus') {
      const metrics = performance.exportMetrics();
      return new NextResponse(metrics.prometheus, {
        headers: {
          'Content-Type': 'text/plain; version=0.0.4',
        },
      });
    }

    return NextResponse.json({
      timeRange,
      timestamp: new Date().toISOString(),
      health: health.status,
      stats,
    });

  } catch (error) {
    console.error('Metrics endpoint error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}

export const GET = withSecurity(metricsHandler);
// Cache management removed - no POST handler