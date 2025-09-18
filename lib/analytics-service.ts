import { PrismaClient } from '@prisma/client';

export interface AnalyticsEventData {
  eventType: string;
  userId?: string;
  sessionId?: string;
  entityType?: string;
  entityId?: string;
  properties?: Record<string, any>;
  userAgent?: string;
  ipAddress?: string;
  referrer?: string;
  pathname?: string;
}

export interface DashboardMetrics {
  overview: {
    totalUsers: number;
    activeUsers: number;
    totalPosts: number;
    totalComments: number;
    dailyGrowth: {
      users: number;
      posts: number;
      comments: number;
    };
  };
  engagement: {
    avgSessionTime: number;
    bounceRate: number;
    pageViews: number;
    engagementRate: number;
  };
  content: {
    topPosts: Array<{
      id: string;
      title: string;
      views: number;
      engagement: number;
    }>;
    topCategories: Array<{
      id: string;
      name: string;
      posts: number;
      engagement: number;
    }>;
  };
  traffic: {
    sources: Array<{
      source: string;
      visitors: number;
      percentage: number;
    }>;
    referrers: Array<{
      referrer: string;
      visitors: number;
    }>;
  };
  performance: {
    avgResponseTime: number;
    errorRate: number;
    uptime: number;
  };
}

export interface UserAnalytics {
  profileViews: number;
  postsCreated: number;
  commentsCreated: number;
  likesReceived: number;
  followersGained: number;
  engagementScore: number;
  topPosts: Array<{
    id: string;
    title: string;
    views: number;
    likes: number;
  }>;
  activityPattern: Array<{
    hour: number;
    activity: number;
  }>;
}

export interface ContentAnalytics {
  views: number;
  uniqueViews: number;
  likes: number;
  comments: number;
  shares: number;
  engagementRate: number;
  bounceRate: number;
  avgTimeSpent: number;
  viewsOverTime: Array<{
    date: string;
    views: number;
  }>;
  demographicsData: {
    topCountries: Array<{ country: string; views: number }>;
    deviceTypes: Array<{ device: string; views: number }>;
    referrers: Array<{ source: string; views: number }>;
  };
}

export class AnalyticsService {
  constructor(private prisma: PrismaClient) {}

  // Track analytics events
  async trackEvent(data: AnalyticsEventData): Promise<void> {
    try {
      await (this.prisma as any).analyticsEvent.create({
        data: {
          eventType: data.eventType,
          userId: data.userId,
          sessionId: data.sessionId,
          entityType: data.entityType,
          entityId: data.entityId,
          properties: data.properties ? JSON.stringify(data.properties) : null,
          userAgent: data.userAgent,
          ipAddress: data.ipAddress,
          referrer: data.referrer,
          pathname: data.pathname
        }
      });
    } catch (error) {
      console.error('Error tracking analytics event:', error);
    }
  }

  // Get dashboard metrics
  async getDashboardMetrics(dateFrom: Date, dateTo: Date): Promise<DashboardMetrics> {
    try {
      const [
        dailyMetrics,
        userStats,
        contentStats,
        trafficStats,
        performanceStats
      ] = await Promise.all([
        this.getDailyMetrics(dateFrom, dateTo),
        this.getUserStats(dateFrom, dateTo),
        this.getContentStats(dateFrom, dateTo),
        this.getTrafficStats(dateFrom, dateTo),
        this.getPerformanceStats(dateFrom, dateTo)
      ]);

      return {
        overview: {
          totalUsers: userStats.total,
          activeUsers: userStats.active,
          totalPosts: contentStats.totalPosts,
          totalComments: contentStats.totalComments,
          dailyGrowth: {
            users: userStats.growth,
            posts: contentStats.postsGrowth,
            comments: contentStats.commentsGrowth
          }
        },
        engagement: {
          avgSessionTime: dailyMetrics.avgSessionTime,
          bounceRate: dailyMetrics.bounceRate,
          pageViews: dailyMetrics.pageViews,
          engagementRate: dailyMetrics.engagementRate
        },
        content: {
          topPosts: contentStats.topPosts,
          topCategories: contentStats.topCategories
        },
        traffic: {
          sources: trafficStats.sources,
          referrers: trafficStats.referrers
        },
        performance: {
          avgResponseTime: performanceStats.avgResponseTime,
          errorRate: performanceStats.errorRate,
          uptime: performanceStats.uptime
        }
      };
    } catch (error) {
      console.error('Error getting dashboard metrics:', error);
      throw error;
    }
  }

  // Get user analytics
  async getUserAnalytics(userId: string, dateFrom: Date, dateTo: Date): Promise<UserAnalytics> {
    try {
      const [engagement, posts, activity] = await Promise.all([
        (this.prisma as any).userEngagement.findMany({
          where: {
            userId,
            date: { gte: dateFrom, lte: dateTo }
          }
        }),
        (this.prisma as any).post.findMany({
          where: {
            authorId: userId,
            createdAt: { gte: dateFrom, lte: dateTo }
          },
          include: {
            _count: { select: { likes: true, comments: true } }
          },
          orderBy: { views: 'desc' },
          take: 10
        }),
        (this.prisma as any).analyticsEvent.groupBy({
          by: ['createdAt'],
          where: {
            userId,
            createdAt: { gte: dateFrom, lte: dateTo }
          },
          _count: true
        })
      ]);

      const totalEngagement = engagement.reduce((sum: number, e: any) => sum + e.postsCreated + e.commentsCreated + e.likesGiven, 0);
      const totalTime = engagement.reduce((sum: number, e: any) => sum + e.totalTime, 0);
      const avgEngagement = engagement.length > 0 ? totalEngagement / engagement.length : 0;

      // Calculate activity pattern by hour
      const activityPattern = Array.from({ length: 24 }, (_, hour) => ({
        hour,
        activity: activity.filter((a: any) => new Date(a.createdAt).getHours() === hour).length
      }));

      return {
        profileViews: await this.getProfileViews(userId, dateFrom, dateTo),
        postsCreated: engagement.reduce((sum: number, e: any) => sum + e.postsCreated, 0),
        commentsCreated: engagement.reduce((sum: number, e: any) => sum + e.commentsCreated, 0),
        likesReceived: engagement.reduce((sum: number, e: any) => sum + e.likesReceived, 0),
        followersGained: await this.getFollowersGained(userId, dateFrom, dateTo),
        engagementScore: avgEngagement,
        topPosts: posts.map((post: any) => ({
          id: post.id,
          title: post.title,
          views: post.views || 0,
          likes: post._count.likes
        })),
        activityPattern
      };
    } catch (error) {
      console.error('Error getting user analytics:', error);
      throw error;
    }
  }

  // Get content analytics
  async getContentAnalytics(
    contentType: string, 
    contentId: string, 
    dateFrom: Date, 
    dateTo: Date
  ): Promise<ContentAnalytics> {
    try {
      const metrics = await (this.prisma as any).contentMetrics.findMany({
        where: {
          contentType,
          contentId,
          date: { gte: dateFrom, lte: dateTo }
        },
        orderBy: { date: 'asc' }
      });

      const totalViews = metrics.reduce((sum: number, m: any) => sum + m.views, 0);
      const totalUniqueViews = metrics.reduce((sum: number, m: any) => sum + m.uniqueViews, 0);
      const totalLikes = metrics.reduce((sum: number, m: any) => sum + m.likes, 0);
      const totalComments = metrics.reduce((sum: number, m: any) => sum + m.comments, 0);
      const totalShares = metrics.reduce((sum: number, m: any) => sum + m.shares, 0);
      const avgEngagementRate = metrics.length > 0 
        ? metrics.reduce((sum: number, m: any) => sum + m.engagementRate, 0) / metrics.length 
        : 0;
      const avgBounceRate = metrics.length > 0 
        ? metrics.reduce((sum: number, m: any) => sum + m.bounceRate, 0) / metrics.length 
        : 0;
      const avgTimeSpent = metrics.length > 0 
        ? metrics.reduce((sum: number, m: any) => sum + m.avgTimeSpent, 0) / metrics.length 
        : 0;

      return {
        views: totalViews,
        uniqueViews: totalUniqueViews,
        likes: totalLikes,
        comments: totalComments,
        shares: totalShares,
        engagementRate: avgEngagementRate,
        bounceRate: avgBounceRate,
        avgTimeSpent: avgTimeSpent,
        viewsOverTime: metrics.map((m: any) => ({
          date: m.date.toISOString().split('T')[0],
          views: m.views
        })),
        demographicsData: await this.getContentDemographics(contentType, contentId, dateFrom, dateTo)
      };
    } catch (error) {
      console.error('Error getting content analytics:', error);
      throw error;
    }
  }

  // Update daily metrics (called by cron job)
  async updateDailyMetrics(date: Date): Promise<void> {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const [
        totalUsers,
        activeUsers,
        newUsers,
        totalPosts,
        newPosts,
        totalComments,
        newComments,
        pageViews,
        sessions
      ] = await Promise.all([
        (this.prisma as any).user.count(),
        (this.prisma as any).user.count({
          where: { lastActivity: { gte: startOfDay, lte: endOfDay } }
        }),
        (this.prisma as any).user.count({
          where: { createdAt: { gte: startOfDay, lte: endOfDay } }
        }),
        (this.prisma as any).post.count(),
        (this.prisma as any).post.count({
          where: { createdAt: { gte: startOfDay, lte: endOfDay } }
        }),
        (this.prisma as any).comment.count(),
        (this.prisma as any).comment.count({
          where: { createdAt: { gte: startOfDay, lte: endOfDay } }
        }),
        (this.prisma as any).analyticsEvent.count({
          where: {
            eventType: 'page_view',
            createdAt: { gte: startOfDay, lte: endOfDay }
          }
        }),
        (this.prisma as any).analyticsEvent.groupBy({
          by: ['sessionId'],
          where: {
            sessionId: { not: null },
            createdAt: { gte: startOfDay, lte: endOfDay }
          }
        })
      ]);

      const uniqueVisitors = sessions.length;
      const avgSessionTime = await this.calculateAvgSessionTime(startOfDay, endOfDay);
      const bounceRate = await this.calculateBounceRate(startOfDay, endOfDay);

      await (this.prisma as any).dailyMetrics.upsert({
        where: { date: startOfDay },
        update: {
          totalUsers,
          activeUsers,
          newUsers,
          totalPosts,
          newPosts,
          totalComments,
          newComments,
          pageViews,
          uniqueVisitors,
          avgSessionTime,
          bounceRate,
          userGrowthRate: newUsers > 0 ? (newUsers / Math.max(totalUsers - newUsers, 1)) * 100 : 0,
          engagementRate: activeUsers > 0 ? (activeUsers / totalUsers) * 100 : 0
        },
        create: {
          date: startOfDay,
          totalUsers,
          activeUsers,
          newUsers,
          totalPosts,
          newPosts,
          totalComments,
          newComments,
          pageViews,
          uniqueVisitors,
          avgSessionTime,
          bounceRate,
          userGrowthRate: newUsers > 0 ? (newUsers / Math.max(totalUsers - newUsers, 1)) * 100 : 0,
          engagementRate: activeUsers > 0 ? (activeUsers / totalUsers) * 100 : 0
        }
      });
    } catch (error) {
      console.error('Error updating daily metrics:', error);
    }
  }

  // Get real-time metrics
  async getRealTimeMetrics(): Promise<{
    activeUsers: number;
    onlineNow: number;
    recentPosts: number;
    recentComments: number;
  }> {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    const [activeUsers, onlineNow, recentPosts, recentComments] = await Promise.all([
      (this.prisma as any).user.count({
        where: { lastActivity: { gte: oneHourAgo } }
      }),
      (this.prisma as any).analyticsEvent.groupBy({
        by: ['userId'],
        where: {
          userId: { not: null },
          createdAt: { gte: fiveMinutesAgo }
        }
      }),
      (this.prisma as any).post.count({
        where: { createdAt: { gte: oneHourAgo } }
      }),
      (this.prisma as any).comment.count({
        where: { createdAt: { gte: oneHourAgo } }
      })
    ]);

    return {
      activeUsers,
      onlineNow: onlineNow.length,
      recentPosts,
      recentComments
    };
  }

  // Private helper methods
  private async getDailyMetrics(dateFrom: Date, dateTo: Date) {
    const metrics = await (this.prisma as any).dailyMetrics.findMany({
      where: { date: { gte: dateFrom, lte: dateTo } }
    });

    if (metrics.length === 0) {
      return {
        avgSessionTime: 0,
        bounceRate: 0,
        pageViews: 0,
        engagementRate: 0
      };
    }

    return {
      avgSessionTime: metrics.reduce((sum: number, m: any) => sum + m.avgSessionTime, 0) / metrics.length,
      bounceRate: metrics.reduce((sum: number, m: any) => sum + m.bounceRate, 0) / metrics.length,
      pageViews: metrics.reduce((sum: number, m: any) => sum + m.pageViews, 0),
      engagementRate: metrics.reduce((sum: number, m: any) => sum + m.engagementRate, 0) / metrics.length
    };
  }

  private async getUserStats(dateFrom: Date, dateTo: Date) {
    const [total, active, previousTotal] = await Promise.all([
      (this.prisma as any).user.count(),
      (this.prisma as any).user.count({
        where: { lastActivity: { gte: dateFrom, lte: dateTo } }
      }),
      (this.prisma as any).user.count({
        where: { createdAt: { lt: dateFrom } }
      })
    ]);

    return {
      total,
      active,
      growth: previousTotal > 0 ? ((total - previousTotal) / previousTotal) * 100 : 0
    };
  }

  private async getContentStats(dateFrom: Date, dateTo: Date) {
    const [totalPosts, totalComments, newPosts, newComments, topPosts, topCategories] = await Promise.all([
      (this.prisma as any).post.count(),
      (this.prisma as any).comment.count(),
      (this.prisma as any).post.count({
        where: { createdAt: { gte: dateFrom, lte: dateTo } }
      }),
      (this.prisma as any).comment.count({
        where: { createdAt: { gte: dateFrom, lte: dateTo } }
      }),
      (this.prisma as any).post.findMany({
        include: {
          _count: { select: { likes: true, comments: true } }
        },
        orderBy: { views: 'desc' },
        take: 5
      }),
      (this.prisma as any).category.findMany({
        include: {
          _count: { select: { posts: true } }
        },
        orderBy: { posts: { _count: 'desc' } },
        take: 5
      })
    ]);

    return {
      totalPosts,
      totalComments,
      postsGrowth: 0, // Calculate based on previous period
      commentsGrowth: 0, // Calculate based on previous period
      topPosts: topPosts.map((post: any) => ({
        id: post.id,
        title: post.title,
        views: post.views || 0,
        engagement: post._count.likes + post._count.comments
      })),
      topCategories: topCategories.map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        posts: cat._count.posts,
        engagement: 0 // Calculate engagement
      }))
    };
  }

  private async getTrafficStats(dateFrom: Date, dateTo: Date) {
    const sources = await (this.prisma as any).trafficSource.groupBy({
      by: ['source'],
      where: { date: { gte: dateFrom, lte: dateTo } },
      _sum: { visitors: true },
      orderBy: { _sum: { visitors: 'desc' } },
      take: 5
    });

    const totalVisitors = sources.reduce((sum: number, s: any) => sum + (s._sum.visitors || 0), 0);

    return {
      sources: sources.map((s: any) => ({
        source: s.source,
        visitors: s._sum.visitors || 0,
        percentage: totalVisitors > 0 ? ((s._sum.visitors || 0) / totalVisitors) * 100 : 0
      })),
      referrers: [] // Implement referrer tracking
    };
  }

  private async getPerformanceStats(dateFrom: Date, dateTo: Date) {
    const performance = await (this.prisma as any).performanceMetrics.findMany({
      where: { date: { gte: dateFrom, lte: dateTo } }
    });

    if (performance.length === 0) {
      return { avgResponseTime: 0, errorRate: 0, uptime: 100 };
    }

    return {
      avgResponseTime: performance.reduce((sum: number, p: any) => sum + p.avgResponseTime, 0) / performance.length,
      errorRate: performance.reduce((sum: number, p: any) => sum + p.errorRate, 0) / performance.length,
      uptime: performance.reduce((sum: number, p: any) => sum + p.uptime, 0) / performance.length
    };
  }

  private async getProfileViews(userId: string, dateFrom: Date, dateTo: Date): Promise<number> {
    return (this.prisma as any).analyticsEvent.count({
      where: {
        eventType: 'profile_view',
        entityId: userId,
        createdAt: { gte: dateFrom, lte: dateTo }
      }
    });
  }

  private async getFollowersGained(userId: string, dateFrom: Date, dateTo: Date): Promise<number> {
    return (this.prisma as any).follow.count({
      where: {
        followingId: userId,
        createdAt: { gte: dateFrom, lte: dateTo }
      }
    });
  }

  private async getContentDemographics(contentType: string, contentId: string, dateFrom: Date, dateTo: Date) {
    // Implement demographics tracking
    return {
      topCountries: [],
      deviceTypes: [],
      referrers: []
    };
  }

  private async calculateAvgSessionTime(startOfDay: Date, endOfDay: Date): Promise<number> {
    // Implement session time calculation
    return 0;
  }

  private async calculateBounceRate(startOfDay: Date, endOfDay: Date): Promise<number> {
    // Implement bounce rate calculation
    return 0;
  }
}