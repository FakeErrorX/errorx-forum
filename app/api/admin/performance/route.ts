import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { performance } from '@/lib/monitoring';
import { cacheInvalidation } from '@/lib/cache';
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
      cache: cacheInvalidation.getStats(),
    });

  } catch (error) {
    console.error('Metrics endpoint error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}

async function cacheHandler(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Check if user has admin permissions

    const data = await request.json();
    const { action, tags } = data;

    let result;
    switch (action) {
      case 'clear':
        cacheInvalidation.clearAll();
        result = { message: 'All cache cleared' };
        break;
      
      case 'invalidate':
        if (tags && Array.isArray(tags)) {
          const count = cacheInvalidation.invalidateByTags(tags);
          result = { message: `Invalidated ${count} cache entries`, tags };
        } else {
          return NextResponse.json(
            { error: 'Tags array required for invalidation' },
            { status: 400 }
          );
        }
        break;
      
      case 'stats':
        result = cacheInvalidation.getStats();
        break;
      
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: clear, invalidate, or stats' },
          { status: 400 }
        );
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Cache management error:', error);
    return NextResponse.json(
      { error: 'Cache operation failed' },
      { status: 500 }
    );
  }
}

export const GET = withSecurity(metricsHandler);
export const POST = withSecurity(cacheHandler);