import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { SearchService } from '@/lib/search-service';
import { z } from 'zod';

const analyticsSchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional()
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

    // You might want to add role-based access control here
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
    
    const params = analyticsSchema.parse({
      dateFrom: searchParams.get('dateFrom'),
      dateTo: searchParams.get('dateTo')
    });

    const searchService = new SearchService(prisma);
    const analytics = await searchService.getSearchAnalytics(
      params.dateFrom ? new Date(params.dateFrom) : undefined,
      params.dateTo ? new Date(params.dateTo) : undefined
    );

    return NextResponse.json({
      success: true,
      data: analytics
    });

  } catch (error) {
    console.error('Search analytics API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid parameters', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}