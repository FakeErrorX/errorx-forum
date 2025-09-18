import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AnalyticsService } from '@/lib/analytics-service';
import { z } from 'zod';

const contentAnalyticsSchema = z.object({
  contentType: z.enum(['post', 'comment', 'category']),
  contentId: z.string(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  period: z.enum(['7d', '30d', '90d']).default('30d')
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    
    const params = contentAnalyticsSchema.parse({
      contentType: searchParams.get('contentType'),
      contentId: searchParams.get('contentId'),
      dateFrom: searchParams.get('dateFrom'),
      dateTo: searchParams.get('dateTo'),
      period: searchParams.get('period')
    });

    // Check if user has permission to view this content's analytics
    let hasPermission = false;

    if (params.contentType === 'post') {
      const post = await (prisma as any).post.findUnique({
        where: { id: params.contentId },
        select: { authorId: true }
      });
      
      if (post?.authorId === session.user.id) {
        hasPermission = true;
      }
    } else if (params.contentType === 'comment') {
      const comment = await (prisma as any).comment.findUnique({
        where: { id: params.contentId },
        select: { authorId: true }
      });
      
      if (comment?.authorId === session.user.id) {
        hasPermission = true;
      }
    }

    // Check if user is admin/moderator for broader access
    if (!hasPermission) {
      const user = await (prisma as any).user.findUnique({
        where: { id: session.user.id },
        include: { role: true }
      });

      if (user?.role?.name && ['admin', 'moderator'].includes(user.role.name)) {
        hasPermission = true;
      }
    }

    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Calculate date range
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
      }
    }

    const analyticsService = new AnalyticsService(prisma);
    const contentAnalytics = await analyticsService.getContentAnalytics(
      params.contentType,
      params.contentId,
      dateFrom,
      dateTo
    );

    return NextResponse.json({
      success: true,
      data: {
        ...contentAnalytics,
        period: {
          from: dateFrom.toISOString(),
          to: dateTo.toISOString(),
          label: params.period
        }
      }
    });

  } catch (error) {
    console.error('Content analytics API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid parameters', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch content analytics' },
      { status: 500 }
    );
  }
}