import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logger, LogLevel } from '@/lib/logging';
import { dbOptimizer, monitorConnectionPool, analyzeQueryPerformance } from '@/lib/database-optimization';
import cache, { cacheInvalidation } from '@/lib/cache';
import monitor from '@/lib/monitoring';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin (check role.name instead of role directly)
    const userRole = (session.user as any).role?.name || (session.user as any).role;
    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const section = searchParams.get('section') || 'overview';

    switch (section) {
      case 'overview':
        return handleOverview();
      
      case 'logs':
        return handleLogs(searchParams);
      
      case 'security':
        return handleSecurity(searchParams);
      
      case 'performance':
        return handlePerformance();
      
      case 'database':
        return handleDatabase();
      
      case 'cache':
        return handleCache();
      
      default:
        return NextResponse.json({ error: 'Invalid section' }, { status: 400 });
    }
  } catch (error) {
    logger.error('Admin monitoring endpoint error', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function handleOverview() {
  try {
    const [
      logStats,
      performanceStats,
      databaseStats,
      cacheStats,
      connectionPool,
    ] = await Promise.all([
      logger.getStats(),
      monitor.getStats(),
      dbOptimizer.getDatabaseStats(),
      cache.getStats(),
      monitorConnectionPool(),
    ]);

    return NextResponse.json({
      logs: logStats,
      performance: performanceStats,
      database: databaseStats,
      cache: cacheStats,
      connectionPool,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    throw new Error(`Failed to get overview: ${error}`);
  }
}

async function handleLogs(searchParams: URLSearchParams) {
  const level = searchParams.get('level');
  const limit = parseInt(searchParams.get('limit') || '100');
  const offset = parseInt(searchParams.get('offset') || '0');
  const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
  const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined;

  const logLevel = level ? LogLevel[level.toUpperCase() as keyof typeof LogLevel] : undefined;

  const logs = logger.getLogs({
    level: logLevel,
    limit,
    offset,
    startDate,
    endDate,
  });

  return NextResponse.json(logs);
}

async function handleSecurity(searchParams: URLSearchParams) {
  const severity = searchParams.get('severity') as any;
  const type = searchParams.get('type') as any;
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  const securityEvents = logger.getSecurityEvents({
    severity,
    type,
    limit,
    offset,
  });

  return NextResponse.json(securityEvents);
}

async function handlePerformance() {
  try {
    const [
      performanceStats,
      healthStatus,
      slowQueries,
    ] = await Promise.all([
      monitor.getStats(),
      { status: 'active', timestamp: new Date().toISOString() }, // Simple health status
      analyzeQueryPerformance(),
    ]);

    return NextResponse.json({
      stats: performanceStats,
      health: healthStatus,
      slowQueries,
    });
  } catch (error) {
    throw new Error(`Failed to get performance data: ${error}`);
  }
}

async function handleDatabase() {
  try {
    const [
      databaseStats,
      databaseHealth,
      connectionPool,
      slowQueries,
    ] = await Promise.all([
      dbOptimizer.getDatabaseStats(),
      dbOptimizer.checkDatabaseHealth(),
      monitorConnectionPool(),
      analyzeQueryPerformance(),
    ]);

    return NextResponse.json({
      stats: databaseStats,
      health: databaseHealth,
      connectionPool,
      slowQueries,
    });
  } catch (error) {
    throw new Error(`Failed to get database data: ${error}`);
  }
}

async function handleCache() {
  const cacheStats = cache.getStats();
  
  return NextResponse.json({
    stats: cacheStats,
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    const userRole = (session?.user as any)?.role?.name || (session?.user as any)?.role;
    if (!session?.user || userRole !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, params = {} } = body;

    switch (action) {
      case 'clearCache':
        return handleClearCache(params);
      
      case 'invalidateCache':
        return handleInvalidateCache(params);
      
      case 'exportLogs':
        return handleExportLogs(params);
      
      case 'exportMetrics':
        return handleExportMetrics();
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    logger.error('Admin monitoring POST error', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function handleClearCache(params: any) {
  try {
    cache.clear();
    logger.info('Cache cleared by admin', { action: 'clearCache', params });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Cache cleared successfully' 
    });
  } catch (error) {
    throw new Error(`Failed to clear cache: ${error}`);
  }
}

async function handleInvalidateCache(params: { tags?: string[] }) {
  try {
    const { tags = [] } = params;
    
    if (tags.length > 0) {
      cacheInvalidation.invalidateByTags(tags);
      logger.info('Cache invalidated by admin', { action: 'invalidateCache', tags });
    } else {
      cacheInvalidation.clearAll();
      logger.info('All cache invalidated by admin', { action: 'invalidateCache' });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Cache invalidated: ${tags.length > 0 ? tags.join(', ') : 'all'}` 
    });
  } catch (error) {
    throw new Error(`Failed to invalidate cache: ${error}`);
  }
}

async function handleExportLogs(params: any) {
  const logs = logger.getLogs({
    limit: 10000, // Large export
    ...params,
  });

  return NextResponse.json({
    success: true,
    data: logs,
    exportedAt: new Date().toISOString(),
  });
}

async function handleExportMetrics() {
  const metrics = monitor.exportMetrics();
  
  return NextResponse.json({
    success: true,
    data: metrics,
    exportedAt: new Date().toISOString(),
  });
}