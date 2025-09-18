import { prisma } from '@/lib/prisma';
import monitor from '@/lib/monitoring';

// Database query optimization utilities
class DatabaseOptimizer {
  private static instance: DatabaseOptimizer;
  private slowQueryThreshold = 1000; // 1 second

  static getInstance(): DatabaseOptimizer {
    if (!DatabaseOptimizer.instance) {
      DatabaseOptimizer.instance = new DatabaseOptimizer();
    }
    return DatabaseOptimizer.instance;
  }

  // Log slow queries
  private logSlowQuery(query: string, duration: number, params?: any) {
    console.warn(`Slow query detected (${duration}ms):`, {
      query,
      duration,
      params,
      threshold: this.slowQueryThreshold,
    });
  }

  // Execute query with performance monitoring
  async executeWithMonitoring<T>(
    queryFn: () => Promise<T>,
    queryName: string,
    params?: any
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = await queryFn();
      const duration = Date.now() - startTime;
      
      // Record metrics
      monitor.recordDatabaseMetric('query', queryName, duration, true);
      
      // Log slow queries
      if (duration > this.slowQueryThreshold) {
        this.logSlowQuery(queryName, duration, params);
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      monitor.recordDatabaseMetric('query', queryName, duration, false, error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  // Database health check
  async checkDatabaseHealth() {
    try {
      const start = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      const responseTime = Date.now() - start;

      // Check connection pool
      const connections = await prisma.$queryRaw`
        SELECT count(*) as connection_count 
        FROM pg_stat_activity 
        WHERE datname = current_database()
      ` as any[];

      return {
        status: 'healthy',
        responseTime,
        connections: Number(connections[0]?.connection_count || 0),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Get database statistics
  async getDatabaseStats() {
    try {
      const [
        userCount,
        postCount,
        commentCount,
        recentActivity,
      ] = await Promise.all([
        this.executeWithMonitoring(() => prisma.user.count(), 'count_users'),
        this.executeWithMonitoring(() => prisma.post.count(), 'count_posts'),
        this.executeWithMonitoring(() => prisma.comment.count(), 'count_comments'),
        this.executeWithMonitoring(() => prisma.post.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
            },
          },
        }), 'count_recent_posts'),
      ]);

      return {
        users: userCount,
        posts: postCount,
        comments: commentCount,
        recentPosts: recentActivity,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(`Failed to get database stats: ${error}`);
    }
  }

  // Optimize user lookup
  async findUserOptimized(identifier: string) {
    return this.executeWithMonitoring(
      () => prisma.user.findFirst({
        where: {
          OR: [
            { email: identifier },
            { username: identifier },
          ],
        },
        select: {
          id: true,
          username: true,
          email: true,
          name: true,
          image: true,
          role: true,
          isActive: true,
          emailVerified: true,
          createdAt: true,
        },
      }),
      'find_user_optimized',
      { identifier }
    );
  }

  // Optimize post queries
  async findPostsOptimized(options: {
    page?: number;
    limit?: number;
    categoryId?: string;
    userId?: string;
    search?: string;
  }) {
    const { page = 1, limit = 20, categoryId, userId, search } = options;
    const skip = (page - 1) * limit;

    return this.executeWithMonitoring(
      () => prisma.post.findMany({
        where: {
          AND: [
            categoryId ? { categoryId } : {},
            userId ? { authorId: userId } : {},
            search ? {
              OR: [
                { title: { contains: search, mode: 'insensitive' } },
                { content: { contains: search, mode: 'insensitive' } },
              ],
            } : {},
          ],
        },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              name: true,
              image: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      'find_posts_optimized',
      options
    );
  }
}

export const dbOptimizer = DatabaseOptimizer.getInstance();

// Database connection pool monitoring
export async function monitorConnectionPool() {
  try {
    const stats = await prisma.$queryRaw`
      SELECT 
        count(*) FILTER (WHERE state = 'active') as active_connections,
        count(*) FILTER (WHERE state = 'idle') as idle_connections,
        count(*) as total_connections,
        max(now() - state_change) as max_connection_age
      FROM pg_stat_activity 
      WHERE datname = current_database()
    ` as any[];

    return stats[0] || {};
  } catch (error) {
    console.error('Failed to monitor connection pool:', error);
    return null;
  }
}

// Query performance analysis
export async function analyzeQueryPerformance() {
  try {
    const slowQueries = await prisma.$queryRaw`
      SELECT 
        query,
        calls,
        total_time,
        mean_time,
        min_time,
        max_time
      FROM pg_stat_statements 
      WHERE mean_time > 100
      ORDER BY mean_time DESC 
      LIMIT 10
    ` as any[];

    return slowQueries;
  } catch (error) {
    console.error('Failed to analyze query performance:', error);
    return [];
  }
}