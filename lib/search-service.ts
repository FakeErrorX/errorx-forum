import { PrismaClient } from '@prisma/client';
import { User, Post, Category, Tag } from '@prisma/client';

export interface SearchOptions {
  query: string;
  userId?: string;
  type?: 'general' | 'posts' | 'users' | 'categories' | 'tags';
  filters?: {
    category?: string;
    tags?: string[];
    dateFrom?: Date;
    dateTo?: Date;
    author?: string;
  };
  sort?: 'relevance' | 'date' | 'popularity' | 'rating';
  page?: number;
  limit?: number;
}

export interface SearchResult {
  type: 'post' | 'user' | 'category' | 'tag';
  id: string;
  title: string;
  content?: string;
  url: string;
  relevanceScore: number;
  metadata?: Record<string, any>;
}

export interface TrendingTopicData {
  topic: string;
  mentions: number;
  score: number;
  category?: string;
  timeframe: string;
}

export interface SearchAnalytics {
  totalSearches: number;
  popularQueries: Array<{
    query: string;
    count: number;
    avgResultCount: number;
  }>;
  searchTypes: Record<string, number>;
  noResultQueries: Array<{
    query: string;
    count: number;
  }>;
}

export class SearchService {
  constructor(private prisma: PrismaClient) {}

  // Enhanced search functionality
  async search(options: SearchOptions): Promise<{
    results: SearchResult[];
    totalCount: number;
    suggestions: string[];
    analytics: {
      searchTime: number;
      resultsFound: number;
    };
  }> {
    const startTime = Date.now();
    const {
      query,
      userId,
      type = 'general',
      filters = {},
      sort = 'relevance',
      page = 1,
      limit = 20
    } = options;

    // Log the search query for analytics
    await this.logSearchQuery(query, userId, type, filters);

    let results: SearchResult[] = [];
    let totalCount = 0;

    try {
      if (type === 'general' || type === 'posts') {
        const postResults = await this.searchPosts(query, filters, sort, page, limit);
        results.push(...postResults.results);
        totalCount += postResults.count;
      }

      if (type === 'general' || type === 'users') {
        const userResults = await this.searchUsers(query, page, limit);
        results.push(...userResults.results);
        totalCount += userResults.count;
      }

      if (type === 'general' || type === 'categories') {
        const categoryResults = await this.searchCategories(query, page, limit);
        results.push(...categoryResults.results);
        totalCount += categoryResults.count;
      }

      if (type === 'general' || type === 'tags') {
        const tagResults = await this.searchTags(query, page, limit);
        results.push(...tagResults.results);
        totalCount += tagResults.count;
      }

      // Sort results by relevance score
      results.sort((a, b) => b.relevanceScore - a.relevanceScore);

      // Get search suggestions
      const suggestions = await this.getSearchSuggestions(query, 5);

      const searchTime = Date.now() - startTime;

      return {
        results: results.slice(0, limit),
        totalCount,
        suggestions,
        analytics: {
          searchTime,
          resultsFound: results.length
        }
      };
    } catch (error) {
      console.error('Search error:', error);
      return {
        results: [],
        totalCount: 0,
        suggestions: [],
        analytics: {
          searchTime: Date.now() - startTime,
          resultsFound: 0
        }
      };
    }
  }

  // Search posts with advanced filtering
  private async searchPosts(
    query: string,
    filters: SearchOptions['filters'] = {},
    sort: string,
    page: number,
    limit: number
  ): Promise<{ results: SearchResult[]; count: number }> {
    const skip = (page - 1) * limit;
    
    const where: any = {
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { content: { contains: query, mode: 'insensitive' } }
      ]
    };

    // Apply filters
    if (filters.category) {
      where.categoryId = filters.category;
    }

    if (filters.author) {
      where.author = {
        username: { contains: filters.author, mode: 'insensitive' }
      };
    }

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = filters.dateFrom;
      if (filters.dateTo) where.createdAt.lte = filters.dateTo;
    }

    if (filters.tags && filters.tags.length > 0) {
      where.tags = {
        some: {
          tag: {
            name: { in: filters.tags }
          }
        }
      };
    }

    // Determine sort order
    let orderBy: any = {};
    switch (sort) {
      case 'date':
        orderBy = { createdAt: 'desc' };
        break;
      case 'popularity':
        orderBy = { views: 'desc' };
        break;
      case 'rating':
        orderBy = { likes: 'desc' };
        break;
      default:
        orderBy = { _relevance: { fields: ['title', 'content'], search: query, sort: 'desc' } };
    }

    const [posts, count] = await Promise.all([
      (this.prisma as any).post.findMany({
        where,
        include: {
          author: { select: { username: true, avatar: true } },
          category: { select: { name: true } },
          tags: { include: { tag: { select: { name: true } } } },
          _count: { select: { comments: true, likes: true } }
        },
        orderBy,
        skip,
        take: limit
      }),
      (this.prisma as any).post.count({ where })
    ]);

    const results: SearchResult[] = posts.map((post: any) => ({
      type: 'post' as const,
      id: post.id,
      title: post.title,
      content: post.content.substring(0, 200) + '...',
      url: `/posts/${post.id}`,
      relevanceScore: this.calculateRelevanceScore(query, post.title, post.content),
      metadata: {
        author: post.author.username,
        category: post.category?.name,
        tags: post.tags.map((pt: any) => pt.tag.name),
        comments: post._count.comments,
        likes: post._count.likes,
        createdAt: post.createdAt
      }
    }));

    return { results, count };
  }

  // Search users
  private async searchUsers(
    query: string,
    page: number,
    limit: number
  ): Promise<{ results: SearchResult[]; count: number }> {
    const skip = (page - 1) * limit;
    
    const where = {
      OR: [
        { username: { contains: query, mode: 'insensitive' } },
        { displayName: { contains: query, mode: 'insensitive' } },
        { bio: { contains: query, mode: 'insensitive' } }
      ]
    };

    const [users, count] = await Promise.all([
      (this.prisma as any).user.findMany({
        where,
        select: {
          id: true,
          username: true,
          displayName: true,
          avatar: true,
          bio: true,
          createdAt: true,
          _count: {
            select: {
              posts: true,
              followers: true
            }
          }
        },
        skip,
        take: limit
      }),
      (this.prisma as any).user.count({ where })
    ]);

    const results: SearchResult[] = users.map((user: any) => ({
      type: 'user' as const,
      id: user.id,
      title: user.displayName || user.username,
      content: user.bio || '',
      url: `/profile/${user.username}`,
      relevanceScore: this.calculateRelevanceScore(query, user.username, user.bio || ''),
      metadata: {
        username: user.username,
        avatar: user.avatar,
        posts: user._count.posts,
        followers: user._count.followers,
        joinedAt: user.createdAt
      }
    }));

    return { results, count };
  }

  // Search categories
  private async searchCategories(
    query: string,
    page: number,
    limit: number
  ): Promise<{ results: SearchResult[]; count: number }> {
    const skip = (page - 1) * limit;
    
    const where = {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } }
      ]
    };

    const [categories, count] = await Promise.all([
      (this.prisma as any).category.findMany({
        where,
        include: {
          _count: { select: { posts: true } }
        },
        skip,
        take: limit
      }),
      (this.prisma as any).category.count({ where })
    ]);

    const results: SearchResult[] = categories.map((category: any) => ({
      type: 'category' as const,
      id: category.id,
      title: category.name,
      content: category.description || '',
      url: `/categories/${category.slug || category.id}`,
      relevanceScore: this.calculateRelevanceScore(query, category.name, category.description || ''),
      metadata: {
        posts: category._count.posts,
        slug: category.slug
      }
    }));

    return { results, count };
  }

  // Search tags
  private async searchTags(
    query: string,
    page: number,
    limit: number
  ): Promise<{ results: SearchResult[]; count: number }> {
    const skip = (page - 1) * limit;
    
    const where = {
      name: { contains: query, mode: 'insensitive' }
    };

    const [tags, count] = await Promise.all([
      (this.prisma as any).tag.findMany({
        where,
        include: {
          _count: { select: { posts: true } }
        },
        skip,
        take: limit
      }),
      (this.prisma as any).tag.count({ where })
    ]);

    const results: SearchResult[] = tags.map((tag: any) => ({
      type: 'tag' as const,
      id: tag.id,
      title: tag.name,
      content: tag.description || '',
      url: `/tags/${tag.slug || tag.name}`,
      relevanceScore: this.calculateRelevanceScore(query, tag.name, ''),
      metadata: {
        posts: tag._count.posts,
        slug: tag.slug
      }
    }));

    return { results, count };
  }

  // Calculate relevance score
  private calculateRelevanceScore(query: string, title: string, content: string): number {
    const queryLower = query.toLowerCase();
    const titleLower = title.toLowerCase();
    const contentLower = content.toLowerCase();

    let score = 0;

    // Exact title match gets highest score
    if (titleLower === queryLower) score += 100;
    else if (titleLower.includes(queryLower)) score += 50;

    // Title word matches
    const queryWords = queryLower.split(' ');
    const titleWords = titleLower.split(' ');
    queryWords.forEach(word => {
      if (titleWords.includes(word)) score += 20;
    });

    // Content matches
    if (contentLower.includes(queryLower)) score += 10;
    
    // Individual word matches in content
    queryWords.forEach(word => {
      const matches = (contentLower.match(new RegExp(word, 'g')) || []).length;
      score += matches * 2;
    });

    return score;
  }

  // Get search suggestions
  async getSearchSuggestions(query: string, limit: number = 5): Promise<string[]> {
    const suggestions = await (this.prisma as any).searchSuggestion.findMany({
      where: {
        suggestion: {
          contains: query,
          mode: 'insensitive'
        }
      },
      orderBy: {
        searchCount: 'desc'
      },
      take: limit,
      select: {
        suggestion: true
      }
    });

    return suggestions.map((s: any) => s.suggestion);
  }

  // Log search query for analytics
  private async logSearchQuery(
    query: string,
    userId?: string,
    searchType: string = 'general',
    filters?: SearchOptions['filters']
  ): Promise<void> {
    try {
      await (this.prisma as any).searchQuery.create({
        data: {
          query,
          userId,
          searchType,
          filters: filters ? JSON.stringify(filters) : null
        }
      });

      // Update or create search suggestion
      await (this.prisma as any).searchSuggestion.upsert({
        where: { suggestion: query },
        update: {
          searchCount: { increment: 1 },
          lastUsed: new Date()
        },
        create: {
          suggestion: query,
          searchCount: 1,
          type: 'query'
        }
      });
    } catch (error) {
      console.error('Error logging search query:', error);
    }
  }

  // Get trending topics
  async getTrendingTopics(timeframe: string = '24h', limit: number = 10): Promise<TrendingTopicData[]> {
    const trending = await (this.prisma as any).trendingTopic.findMany({
      where: { timeframe },
      orderBy: { score: 'desc' },
      take: limit
    });

    return trending.map((topic: any) => ({
      topic: topic.topic,
      mentions: topic.mentions,
      score: topic.score,
      category: topic.category,
      timeframe: topic.timeframe
    }));
  }

  // Update trending topics
  async updateTrendingTopic(topic: string, category?: string): Promise<void> {
    const timeframes = ['1h', '24h', '7d', '30d'];
    
    for (const timeframe of timeframes) {
      try {
        await (this.prisma as any).trendingTopic.upsert({
          where: {
            topic_timeframe: {
              topic,
              timeframe
            }
          },
          update: {
            mentions: { increment: 1 },
            score: { increment: this.calculateTrendingScore(timeframe) },
            lastMentioned: new Date()
          },
          create: {
            topic,
            mentions: 1,
            score: this.calculateTrendingScore(timeframe),
            category,
            timeframe,
            lastMentioned: new Date()
          }
        });
      } catch (error) {
        console.error(`Error updating trending topic for ${timeframe}:`, error);
      }
    }
  }

  // Calculate trending score based on timeframe
  private calculateTrendingScore(timeframe: string): number {
    const scores = {
      '1h': 10,
      '24h': 5,
      '7d': 2,
      '30d': 1
    };
    return scores[timeframe as keyof typeof scores] || 1;
  }

  // Get search analytics
  async getSearchAnalytics(dateFrom?: Date, dateTo?: Date): Promise<SearchAnalytics> {
    const where: any = {};
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = dateFrom;
      if (dateTo) where.createdAt.lte = dateTo;
    }

    const [totalSearches, popularQueries, searchTypes, noResultQueries] = await Promise.all([
      (this.prisma as any).searchQuery.count({ where }),
      (this.prisma as any).searchQuery.groupBy({
        by: ['query'],
        where,
        _count: { query: true },
        _avg: { resultCount: true },
        orderBy: { _count: { query: 'desc' } },
        take: 10
      }),
      (this.prisma as any).searchQuery.groupBy({
        by: ['searchType'],
        where,
        _count: { searchType: true }
      }),
      (this.prisma as any).searchQuery.groupBy({
        by: ['query'],
        where: { ...where, resultCount: 0 },
        _count: { query: true },
        orderBy: { _count: { query: 'desc' } },
        take: 10
      })
    ]);

    return {
      totalSearches,
      popularQueries: popularQueries.map((pq: any) => ({
        query: pq.query,
        count: pq._count.query,
        avgResultCount: pq._avg.resultCount || 0
      })),
      searchTypes: searchTypes.reduce((acc: any, st: any) => {
        acc[st.searchType] = st._count.searchType;
        return acc;
      }, {}),
      noResultQueries: noResultQueries.map((nrq: any) => ({
        query: nrq.query,
        count: nrq._count.query
      }))
    };
  }

  // Index content for search
  async indexContent(
    contentType: 'post' | 'comment' | 'user' | 'category',
    contentId: string,
    title?: string,
    content?: string,
    keywords?: string[]
  ): Promise<void> {
    try {
      await (this.prisma as any).searchIndex.upsert({
        where: {
          contentType_contentId: {
            contentType,
            contentId
          }
        },
        update: {
          title: title || null,
          content: content || '',
          keywords: keywords || [],
          updatedAt: new Date()
        },
        create: {
          contentType,
          contentId,
          title: title || null,
          content: content || '',
          keywords: keywords || []
        }
      });
    } catch (error) {
      console.error('Error indexing content:', error);
    }
  }

  // Extract keywords from content
  extractKeywords(content: string, limit: number = 10): string[] {
    // Simple keyword extraction - can be enhanced with NLP libraries
    const words = content
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !this.isStopWord(word));

    // Count word frequency
    const wordCount: Record<string, number> = {};
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });

    // Return top keywords by frequency
    return Object.entries(wordCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([word]) => word);
  }

  // Check if word is a stop word
  private isStopWord(word: string): boolean {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
      'should', 'may', 'might', 'must', 'can', 'shall', 'this', 'that',
      'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they'
    ]);
    return stopWords.has(word);
  }

  // Get content recommendations
  async getContentRecommendations(
    userId: string,
    contentType?: 'post' | 'user' | 'category' | 'tag',
    limit: number = 10
  ): Promise<any[]> {
    const where: any = { userId };
    if (contentType) where.contentType = contentType;

    const recommendations = await (this.prisma as any).contentRecommendation.findMany({
      where,
      orderBy: { score: 'desc' },
      take: limit
    });

    return recommendations;
  }

  // Create content recommendation
  async createContentRecommendation(
    userId: string,
    contentType: 'post' | 'user' | 'category' | 'tag',
    contentId: string,
    score: number,
    reason: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      await (this.prisma as any).contentRecommendation.create({
        data: {
          userId,
          contentType,
          contentId,
          score,
          reason,
          metadata: metadata ? JSON.stringify(metadata) : null
        }
      });
    } catch (error) {
      console.error('Error creating content recommendation:', error);
    }
  }
}