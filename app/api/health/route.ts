import { NextRequest, NextResponse } from 'next/server';
import { performance } from '@/lib/monitoring';
import { cacheInvalidation } from '@/lib/cache';
import { withMonitoring } from '@/lib/security-middleware';

async function handler(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const format = url.searchParams.get('format') || 'json';

    // Get health status
    const health = performance.getHealth();
    const stats = performance.getStats(60 * 60 * 1000); // Last hour
    
    const healthResponse = {
      status: health.status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      checks: health.checks,
      stats: {
        requests: {
          total: stats.requests.total,
          averageResponseTime: Math.round(stats.requests.averageDuration),
          errorRate: Math.round(stats.requests.errorRate * 10000) / 100, // Percentage with 2 decimals
        },
        memory: {
          used: Math.round(stats.memory.current.heapUsed / 1024 / 1024), // MB
          total: Math.round(stats.memory.current.heapTotal / 1024 / 1024), // MB
          rss: Math.round(stats.memory.current.rss / 1024 / 1024), // MB
        },
        cache: {
          hitRate: Math.round(stats.cache.hitRate * 10000) / 100, // Percentage
        },
        database: {
          averageResponseTime: Math.round(stats.database.averageDuration),
          errorRate: Math.round(stats.database.errorRate * 10000) / 100,
        },
      },
    };

    // Return appropriate format
    if (format === 'prometheus') {
      const metrics = performance.exportMetrics();
      return new NextResponse(metrics.prometheus, {
        headers: {
          'Content-Type': 'text/plain; version=0.0.4',
          'Cache-Control': 'no-cache',
        },
      });
    }

    // Determine HTTP status based on health
    const statusCode = health.status === 'healthy' ? 200 : 
                      health.status === 'warning' ? 200 : 503;

    return NextResponse.json(healthResponse, {
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });

  } catch (error) {
    console.error('Health check error:', error);
    
    return NextResponse.json({
      status: 'critical',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, {
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  }
}

export const GET = withMonitoring(handler);