import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { SearchService } from '@/lib/search-service';
import { z } from 'zod';

const searchSchema = z.object({
  q: z.string().min(1).max(200),
  type: z.enum(['general', 'posts', 'users', 'categories', 'tags']).default('general'),
  category: z.string().optional(),
  tags: z.string().optional(),
  author: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  sort: z.enum(['relevance', 'date', 'popularity', 'rating']).default('relevance'),
  page: z.string().default('1'),
  limit: z.string().default('20')
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const searchParams = request.nextUrl.searchParams;
    
    // Validate search parameters
    const params = searchSchema.parse({
      q: searchParams.get('q'),
      type: searchParams.get('type'),
      category: searchParams.get('category'),
      tags: searchParams.get('tags'),
      author: searchParams.get('author'),
      dateFrom: searchParams.get('dateFrom'),
      dateTo: searchParams.get('dateTo'),
      sort: searchParams.get('sort'),
      page: searchParams.get('page'),
      limit: searchParams.get('limit')
    });

    const searchService = new SearchService(prisma);

    // Prepare search options
    const searchOptions = {
      query: params.q,
      userId: session?.user?.id,
      type: params.type,
      filters: {
        category: params.category,
        tags: params.tags ? params.tags.split(',') : undefined,
        author: params.author,
        dateFrom: params.dateFrom ? new Date(params.dateFrom) : undefined,
        dateTo: params.dateTo ? new Date(params.dateTo) : undefined
      },
      sort: params.sort,
      page: parseInt(params.page),
      limit: Math.min(parseInt(params.limit), 50) // Cap at 50 results
    };

    const results = await searchService.search(searchOptions);

    return NextResponse.json({
      success: true,
      data: results
    });

  } catch (error) {
    console.error('Search API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid search parameters', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Search failed' },
      { status: 500 }
    );
  }
}