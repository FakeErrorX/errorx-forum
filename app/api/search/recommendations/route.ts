import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { SearchService } from '@/lib/search-service';
import { z } from 'zod';

const recommendationsSchema = z.object({
  type: z.enum(['post', 'user', 'category', 'tag']).optional(),
  limit: z.string().default('10')
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
    
    const params = recommendationsSchema.parse({
      type: searchParams.get('type'),
      limit: searchParams.get('limit')
    });

    const searchService = new SearchService(prisma);
    const recommendations = await searchService.getContentRecommendations(
      session.user.id,
      params.type,
      Math.min(parseInt(params.limit), 50)
    );

    // Fetch actual content based on recommendations
    const enrichedRecommendations = await Promise.all(
      recommendations.map(async (rec: any) => {
        let content = null;
        
        try {
          switch (rec.contentType) {
            case 'post':
              content = await (prisma as any).post.findUnique({
                where: { id: rec.contentId },
                include: {
                  author: { select: { username: true, avatar: true } },
                  category: { select: { name: true } },
                  _count: { select: { comments: true, likes: true } }
                }
              });
              break;
              
            case 'user':
              content = await (prisma as any).user.findUnique({
                where: { id: rec.contentId },
                select: {
                  id: true,
                  username: true,
                  displayName: true,
                  avatar: true,
                  bio: true,
                  _count: {
                    select: {
                      posts: true,
                      followers: true
                    }
                  }
                }
              });
              break;
              
            case 'category':
              content = await (prisma as any).category.findUnique({
                where: { id: rec.contentId },
                include: {
                  _count: { select: { posts: true } }
                }
              });
              break;
              
            case 'tag':
              content = await (prisma as any).tag.findUnique({
                where: { id: rec.contentId },
                include: {
                  _count: { select: { posts: true } }
                }
              });
              break;
          }
        } catch (error) {
          console.error(`Error fetching ${rec.contentType} ${rec.contentId}:`, error);
        }

        return {
          id: rec.id,
          contentType: rec.contentType,
          contentId: rec.contentId,
          score: rec.score,
          reason: rec.reason,
          metadata: rec.metadata,
          content,
          createdAt: rec.createdAt
        };
      })
    );

    // Filter out recommendations where content couldn't be found
    const validRecommendations = enrichedRecommendations.filter(rec => rec.content !== null);

    return NextResponse.json({
      success: true,
      data: {
        recommendations: validRecommendations
      }
    });

  } catch (error) {
    console.error('Content recommendations API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid parameters', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch recommendations' },
      { status: 500 }
    );
  }
}

// Create a content recommendation
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { contentType, contentId, score, reason, metadata } = body;

    if (!contentType || !contentId || !score || !reason) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const searchService = new SearchService(prisma);
    await searchService.createContentRecommendation(
      session.user.id,
      contentType,
      contentId,
      score,
      reason,
      metadata
    );

    return NextResponse.json({
      success: true,
      message: 'Recommendation created'
    });

  } catch (error) {
    console.error('Create recommendation API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create recommendation' },
      { status: 500 }
    );
  }
}

// Mark recommendation as viewed/interacted
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { recommendationId, isViewed, isInteracted } = body;

    if (!recommendationId) {
      return NextResponse.json(
        { success: false, error: 'Recommendation ID is required' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (typeof isViewed === 'boolean') updateData.isViewed = isViewed;
    if (typeof isInteracted === 'boolean') updateData.isInteracted = isInteracted;

    await (prisma as any).contentRecommendation.updateMany({
      where: {
        id: recommendationId,
        userId: session.user.id
      },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      message: 'Recommendation updated'
    });

  } catch (error) {
    console.error('Update recommendation API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update recommendation' },
      { status: 500 }
    );
  }
}