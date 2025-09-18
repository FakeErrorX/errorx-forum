import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SearchService } from '@/lib/search-service';
import { z } from 'zod';

const suggestionsSchema = z.object({
  q: z.string().min(1).max(100),
  limit: z.string().default('5'),
  type: z.enum(['query', 'tag', 'user', 'category']).optional()
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    const params = suggestionsSchema.parse({
      q: searchParams.get('q'),
      limit: searchParams.get('limit'),
      type: searchParams.get('type')
    });

    const searchService = new SearchService(prisma);
    const suggestions = await searchService.getSearchSuggestions(
      params.q,
      Math.min(parseInt(params.limit), 20)
    );

    // If type is specified, get additional suggestions
    let additionalSuggestions: string[] = [];
    if (params.type) {
      switch (params.type) {
        case 'tag':
          const tags = await (prisma as any).tag.findMany({
            where: {
              name: {
                contains: params.q,
                mode: 'insensitive'
              }
            },
            select: { name: true },
            take: 5
          });
          additionalSuggestions = tags.map((tag: any) => tag.name);
          break;
          
        case 'user':
          const users = await (prisma as any).user.findMany({
            where: {
              OR: [
                { username: { contains: params.q, mode: 'insensitive' } },
                { displayName: { contains: params.q, mode: 'insensitive' } }
              ]
            },
            select: { username: true, displayName: true },
            take: 5
          });
          additionalSuggestions = users.map((user: any) => user.displayName || user.username);
          break;
          
        case 'category':
          const categories = await (prisma as any).category.findMany({
            where: {
              name: {
                contains: params.q,
                mode: 'insensitive'
              }
            },
            select: { name: true },
            take: 5
          });
          additionalSuggestions = categories.map((cat: any) => cat.name);
          break;
      }
    }

    // Combine and deduplicate suggestions
    const allSuggestions = [...new Set([...suggestions, ...additionalSuggestions])];

    return NextResponse.json({
      success: true,
      data: {
        suggestions: allSuggestions.slice(0, parseInt(params.limit))
      }
    });

  } catch (error) {
    console.error('Search suggestions API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid parameters', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch suggestions' },
      { status: 500 }
    );
  }
}