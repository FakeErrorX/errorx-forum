import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { SearchService } from '@/lib/search-service';
import { z } from 'zod';

const trendingSchema = z.object({
  timeframe: z.enum(['1h', '24h', '7d', '30d']).default('24h'),
  limit: z.string().default('10'),
  category: z.string().optional()
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    const params = trendingSchema.parse({
      timeframe: searchParams.get('timeframe'),
      limit: searchParams.get('limit'),
      category: searchParams.get('category')
    });

    const searchService = new SearchService(prisma);
    const trending = await searchService.getTrendingTopics(
      params.timeframe,
      Math.min(parseInt(params.limit), 50)
    );

    // Filter by category if specified
    const filteredTrending = params.category
      ? trending.filter(topic => topic.category === params.category)
      : trending;

    return NextResponse.json({
      success: true,
      data: {
        timeframe: params.timeframe,
        trending: filteredTrending
      }
    });

  } catch (error) {
    console.error('Trending API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid parameters', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch trending topics' },
      { status: 500 }
    );
  }
}

// Update trending topic (for internal use)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { topic, category } = body;

    if (!topic || typeof topic !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Topic is required' },
        { status: 400 }
      );
    }

    const searchService = new SearchService(prisma);
    await searchService.updateTrendingTopic(topic, category);

    return NextResponse.json({
      success: true,
      message: 'Trending topic updated'
    });

  } catch (error) {
    console.error('Update trending API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update trending topic' },
      { status: 500 }
    );
  }
}