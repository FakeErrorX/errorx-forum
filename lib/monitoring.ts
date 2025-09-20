import { NextRequest, NextResponse } from 'next/server';

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
  unit?: string;
}

interface RequestMetrics {
  requestId: string;
  method: string;
  url: string;
  userAgent?: string;
  userId?: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  statusCode?: number;
  responseSize?: number;
  errorMessage?: string;
  memoryUsage?: NodeJS.MemoryUsage;
  tags?: Record<string, string>;
}

interface DatabaseMetrics {
  queryType: string;
  table: string;
  duration: number;
  timestamp: number;
  success: boolean;
  error?: string;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private requestMetrics: Map<string, RequestMetrics> = new Map();
  private dbMetrics: DatabaseMetrics[] = [];
  private maxMetricsAge = 24 * 60 * 60 * 1000; // 24 hours
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up old metrics every hour
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60 * 60 * 1000);
  }

  private cleanup() {
    const cutoff = Date.now() - this.maxMetricsAge;
    
    this.metrics = this.metrics.filter(m => m.timestamp > cutoff);
    this.dbMetrics = this.dbMetrics.filter(m => m.timestamp > cutoff);
    
    // Clean up completed request metrics
    for (const [id, metric] of this.requestMetrics.entries()) {
      if (metric.endTime && metric.endTime < cutoff) {
        this.requestMetrics.delete(id);
      }
    }
  }

  // Generate unique request ID
  generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Start tracking a request
  startRequest(request: NextRequest, requestId?: string): string {
    const id = requestId || this.generateRequestId();
    const startTime = Date.now();

    const metric: RequestMetrics = {
      requestId: id,
      method: request.method,
      url: request.url,
      userAgent: request.headers.get('user-agent') || undefined,
      startTime,
      memoryUsage: process.memoryUsage(),
    };

    this.requestMetrics.set(id, metric);
    return id;
  }

  // End tracking a request
  endRequest(requestId: string, response: NextResponse, error?: Error): void {
    const metric = this.requestMetrics.get(requestId);
    if (!metric) return;

    const endTime = Date.now();
    metric.endTime = endTime;
    metric.duration = endTime - metric.startTime;
    metric.statusCode = response.status;
    metric.errorMessage = error?.message;

    // Estimate response size
    const contentLength = response.headers.get('content-length');
    if (contentLength) {
      metric.responseSize = parseInt(contentLength, 10);
    }

    // Record performance metrics
    this.recordMetric('request_duration', metric.duration, {
      method: metric.method,
      status: metric.statusCode?.toString() || 'unknown',
      endpoint: new URL(metric.url).pathname,
    });

    if (metric.responseSize) {
      this.recordMetric('response_size', metric.responseSize, {
        method: metric.method,
        endpoint: new URL(metric.url).pathname,
      });
    }
  }

  // Record a custom metric
  recordMetric(name: string, value: number, tags?: Record<string, string>, unit?: string): void {
    this.metrics.push({
      name,
      value,
      timestamp: Date.now(),
      tags,
      unit,
    });
  }

  // Record database operation metrics
  recordDatabaseMetric(
    queryType: string,
    table: string,
    duration: number,
    success: boolean,
    error?: string
  ): void {
    this.dbMetrics.push({
      queryType,
      table,
      duration,
      timestamp: Date.now(),
      success,
      error,
    });

    this.recordMetric('db_query_duration', duration, {
      query_type: queryType,
      table,
      success: success.toString(),
    });
  }

  // Get performance statistics
  getStats(timeRange?: number): {
    requests: {
      total: number;
      averageDuration: number;
      errorRate: number;
      statusCodes: Record<string, number>;
      slowestRequests: RequestMetrics[];
    };
    database: {
      queries: number;
      averageDuration: number;
      errorRate: number;
      slowestQueries: DatabaseMetrics[];
    };
    memory: {
      current: NodeJS.MemoryUsage;
      peak: number;
    };
    metrics: PerformanceMetric[];
  } {
    const cutoff = timeRange ? Date.now() - timeRange : 0;
    
    // Filter metrics by time range
    const recentRequests = Array.from(this.requestMetrics.values())
      .filter(r => r.endTime && r.endTime > cutoff);
    
    const recentDbMetrics = this.dbMetrics.filter(m => m.timestamp > cutoff);
    const recentMetrics = this.metrics.filter(m => m.timestamp > cutoff);

    // Request statistics
    const totalRequests = recentRequests.length;
    const completedRequests = recentRequests.filter(r => r.endTime);
    const averageRequestDuration = completedRequests.length > 0
      ? completedRequests.reduce((sum, r) => sum + (r.duration || 0), 0) / completedRequests.length
      : 0;
    
    const errors = completedRequests.filter(r => r.statusCode && r.statusCode >= 400);
    const errorRate = totalRequests > 0 ? errors.length / totalRequests : 0;

    const statusCodes: Record<string, number> = {};
    completedRequests.forEach(r => {
      if (r.statusCode) {
        const code = r.statusCode.toString();
        statusCodes[code] = (statusCodes[code] || 0) + 1;
      }
    });

    const slowestRequests = completedRequests
      .sort((a, b) => (b.duration || 0) - (a.duration || 0))
      .slice(0, 10);

    // Database statistics
    const totalQueries = recentDbMetrics.length;
    const averageDbDuration = totalQueries > 0
      ? recentDbMetrics.reduce((sum, m) => sum + m.duration, 0) / totalQueries
      : 0;
    
    const dbErrors = recentDbMetrics.filter(m => !m.success);
    const dbErrorRate = totalQueries > 0 ? dbErrors.length / totalQueries : 0;

    const slowestQueries = recentDbMetrics
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);

    // Memory statistics
    const currentMemory = process.memoryUsage();
    const memoryMetrics = recentMetrics.filter(m => m.name === 'memory_usage');
    const peakMemory = memoryMetrics.length > 0
      ? Math.max(...memoryMetrics.map(m => m.value))
      : currentMemory.heapUsed;

    return {
      requests: {
        total: totalRequests,
        averageDuration: averageRequestDuration,
        errorRate,
        statusCodes,
        slowestRequests,
      },
      database: {
        queries: totalQueries,
        averageDuration: averageDbDuration,
        errorRate: dbErrorRate,
        slowestQueries,
      },
      memory: {
        current: currentMemory,
        peak: peakMemory,
      },
      metrics: recentMetrics,
    };
  }

  // Get health status
  getHealthStatus(): {
    status: 'healthy' | 'warning' | 'critical';
    checks: Array<{
      name: string;
      status: 'pass' | 'warn' | 'fail';
      message: string;
      value?: number;
      threshold?: number;
    }>;
  } {
    const stats = this.getStats(5 * 60 * 1000); // Last 5 minutes
    const checks: Array<{
      name: string;
      status: 'pass' | 'warn' | 'fail';
      message: string;
      value?: number;
      threshold?: number;
    }> = [];

    // Check response time
    const avgResponseTime = stats.requests.averageDuration;
    checks.push({
      name: 'response_time',
      status: avgResponseTime < 1000 ? 'pass' : avgResponseTime < 3000 ? 'warn' : 'fail',
      message: `Average response time: ${avgResponseTime.toFixed(2)}ms`,
      value: avgResponseTime,
      threshold: 1000,
    });

    // Check error rate
    const errorRate = stats.requests.errorRate;
    checks.push({
      name: 'error_rate',
      status: errorRate < 0.01 ? 'pass' : errorRate < 0.05 ? 'warn' : 'fail',
      message: `Error rate: ${(errorRate * 100).toFixed(2)}%`,
      value: errorRate,
      threshold: 0.01,
    });

    // Check memory usage
    const memoryUsage = stats.memory.current.heapUsed / 1024 / 1024; // MB
    checks.push({
      name: 'memory_usage',
      status: memoryUsage < 500 ? 'pass' : memoryUsage < 1000 ? 'warn' : 'fail',
      message: `Memory usage: ${memoryUsage.toFixed(2)}MB`,
      value: memoryUsage,
      threshold: 500,
    });

    // Check database performance
    const dbAvgTime = stats.database.averageDuration;
    checks.push({
      name: 'database_performance',
      status: dbAvgTime < 100 ? 'pass' : dbAvgTime < 500 ? 'warn' : 'fail',
      message: `Database avg response: ${dbAvgTime.toFixed(2)}ms`,
      value: dbAvgTime,
      threshold: 100,
    });

    const failedChecks = checks.filter(c => c.status === 'fail').length;
    const warningChecks = checks.filter(c => c.status === 'warn').length;

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (failedChecks > 0) {
      status = 'critical';
    } else if (warningChecks > 0) {
      status = 'warning';
    }

    return { status, checks };
  }

  // Export metrics for external monitoring
  exportMetrics(): {
    prometheus: string;
    json: object;
  } {
    const stats = this.getStats();
    
    // Prometheus format
    const prometheus = [
      `# HELP http_requests_total Total number of HTTP requests`,
      `# TYPE http_requests_total counter`,
      `http_requests_total ${stats.requests.total}`,
      ``,
      `# HELP http_request_duration_seconds HTTP request duration in seconds`,
      `# TYPE http_request_duration_seconds histogram`,
      `http_request_duration_seconds_sum ${stats.requests.averageDuration / 1000}`,
      `http_request_duration_seconds_count ${stats.requests.total}`,
      ``,
      `# HELP http_request_error_rate HTTP request error rate`,
      `# TYPE http_request_error_rate gauge`,
      `http_request_error_rate ${stats.requests.errorRate}`,
      ``,
      `# HELP memory_usage_bytes Memory usage in bytes`,
      `# TYPE memory_usage_bytes gauge`,
      `memory_usage_bytes ${stats.memory.current.heapUsed}`,
    ].join('\n');

    return {
      prometheus,
      json: stats,
    };
  }

  destroy() {
    clearInterval(this.cleanupInterval);
    this.metrics = [];
    this.requestMetrics.clear();
    this.dbMetrics = [];
  }
}

// Global monitor instance
const monitor = new PerformanceMonitor();

// Middleware for request monitoring
export function createMonitoringMiddleware() {
  return async (
    request: NextRequest,
    handler: (request: NextRequest) => Promise<NextResponse>
  ): Promise<NextResponse> => {
    const requestId = monitor.generateRequestId();
    monitor.startRequest(request, requestId);

    try {
      const response = await handler(request);
      monitor.endRequest(requestId, response);
      
      // Add request ID to response headers for tracing
      response.headers.set('X-Request-ID', requestId);
      
      return response;
    } catch (error) {
      const errorResponse = NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
      
      monitor.endRequest(requestId, errorResponse, error as Error);
      errorResponse.headers.set('X-Request-ID', requestId);
      
      throw error;
    }
  };
}

// Database query monitoring wrapper
export function monitorDatabaseQuery<T>(
  queryType: string,
  table: string,
  query: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();
  
  return query()
    .then(result => {
      const duration = Date.now() - startTime;
      monitor.recordDatabaseMetric(queryType, table, duration, true);
      return result;
    })
    .catch(error => {
      const duration = Date.now() - startTime;
      monitor.recordDatabaseMetric(queryType, table, duration, false, error.message);
      throw error;
    });
}

// Performance utilities
export const performance = {
  // Record custom metrics
  recordMetric: (name: string, value: number, tags?: Record<string, string>) => {
    monitor.recordMetric(name, value, tags);
  },

  // Get current statistics
  getStats: (timeRange?: number) => {
    return monitor.getStats(timeRange);
  },

  // Get health status
  getHealth: () => {
    return monitor.getHealthStatus();
  },

  // Export metrics
  exportMetrics: () => {
    return monitor.exportMetrics();
  },

  // Record memory usage
  recordMemoryUsage: () => {
    const usage = process.memoryUsage();
    monitor.recordMetric('memory_usage', usage.heapUsed, { type: 'heap_used' });
    monitor.recordMetric('memory_usage', usage.heapTotal, { type: 'heap_total' });
    monitor.recordMetric('memory_usage', usage.rss, { type: 'rss' });
  },
};

// Start periodic memory monitoring
setInterval(() => {
  performance.recordMemoryUsage();
}, 30 * 1000); // Every 30 seconds

export default monitor;