import { prisma } from "@/lib/prisma"

// Types for forum data
export interface ForumPost {
  id: string; // Internal database ID (hidden from API)
  postId: number; // Custom sequential post ID (exposed in API)
  title: string;
  content: string;
  categoryId: string; // Internal database ID (hidden from API)
  authorId: string; // Internal database ID (hidden from API)
  authorUsername: string;
  isPinned: boolean;
  isLocked: boolean;
  views: number;
  likes: number;
  replies: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ForumCategory {
  id: string; // Internal database ID (hidden from API)
  categoryId: number; // Custom sequential category ID (exposed in API)
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  postCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ForumComment {
  id: string; // Internal database ID (hidden from API)
  commentId: number; // Custom sequential comment ID (exposed in API)
  postId: string; // Internal database ID (hidden from API)
  authorId: string; // Internal database ID (hidden from API)
  authorUsername: string;
  content: string;
  parentId: string | null; // Internal database ID (hidden from API)
  likes: number;
  createdAt: Date;
  updatedAt: Date;
}

// Database Service Functions

// POSTS
export const createPost = async (postData: Omit<ForumPost, 'id' | 'postId' | 'createdAt' | 'updatedAt'>) => {
  try {
    const post = await prisma.post.create({
      data: {
        title: postData.title,
        content: postData.content,
        categoryId: postData.categoryId,
        authorId: postData.authorId,
        authorUsername: postData.authorUsername,
        isPinned: postData.isPinned || false,
        isLocked: postData.isLocked || false,
        views: postData.views || 0,
        likes: postData.likes || 0,
        replies: postData.replies || 0,
      },
      include: {
        author: true,
        category: true,
      }
    });

    // Increment user's post count
    try {
      await prisma.user.update({
        where: { id: postData.authorId },
        data: { postCount: { increment: 1 } }
      });
    } catch (userError) {
      console.error('Warning: Failed to increment user post count:', userError);
    }

    return post;
  } catch (error) {
    console.error('Error creating post:', error);
    throw error;
  }
};

export const getPosts = async (limit: number = 25, offset: number = 0, categoryId?: string, authorId?: string) => {
  try {
    const where: Record<string, string> = {};
    if (categoryId) where.categoryId = categoryId;
    if (authorId) where.authorId = authorId;
    
    const posts = await prisma.post.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
      include: {
        author: true,
        category: true,
      }
    });
    
    return posts;
  } catch (error) {
    console.error('Error fetching posts:', error);
    throw error;
  }
};

export const getPostById = async (postId: string) => {
  try {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: true,
        category: true,
        comments: {
          include: {
            author: true,
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });
    return post;
  } catch (error) {
    console.error('Error fetching post:', error);
    throw error;
  }
};

export const updatePost = async (postId: string, updates: Partial<ForumPost>) => {
  try {
    const post = await prisma.post.update({
      where: { id: postId },
      data: updates,
      include: {
        author: true,
        category: true,
      }
    });
    return post;
  } catch (error) {
    console.error('Error updating post:', error);
    throw error;
  }
};

export const deletePost = async (postId: string) => {
  try {
    await prisma.post.delete({
      where: { id: postId }
    });
  } catch (error) {
    console.error('Error deleting post:', error);
    throw error;
  }
};

export const searchPosts = async (searchTerm: string, limit: number = 25) => {
  try {
    const posts = await prisma.post.findMany({
      where: {
        OR: [
          { title: { contains: searchTerm, mode: 'insensitive' } },
          { content: { contains: searchTerm, mode: 'insensitive' } }
        ]
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        author: true,
        category: true,
      }
    });
    return posts;
  } catch (error) {
    console.error('Error searching posts:', error);
    throw error;
  }
};

// CATEGORIES
export const getCategories = async () => {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });
    return categories;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

export const createCategory = async (categoryData: Omit<ForumCategory, 'id' | 'categoryId' | 'createdAt' | 'updatedAt'>) => {
  try {
    const category = await prisma.category.create({
      data: {
        name: categoryData.name,
        description: categoryData.description,
        icon: categoryData.icon,
        color: categoryData.color,
        postCount: categoryData.postCount || 0,
        isActive: categoryData.isActive !== false,
      }
    });
    return category;
  } catch (error) {
    console.error('Error creating category:', error);
    throw error;
  }
};

// COMMENTS
export const createComment = async (commentData: Omit<ForumComment, 'id' | 'commentId' | 'createdAt' | 'updatedAt'>) => {
  try {
    const comment = await prisma.comment.create({
      data: {
        postId: commentData.postId,
        authorId: commentData.authorId,
        authorUsername: commentData.authorUsername,
        content: commentData.content,
        parentId: commentData.parentId || null,
        likes: commentData.likes || 0,
      },
      include: {
        author: true,
      }
    });
    
    // Update post reply count
    await prisma.post.update({
      where: { id: commentData.postId },
      data: { replies: { increment: 1 } }
    });
    
    return comment;
  } catch (error) {
    console.error('Error creating comment:', error);
    throw error;
  }
};

export const getCommentsByPost = async (postId: string, limit: number = 50) => {
  try {
    const comments = await prisma.comment.findMany({
      where: { postId },
      take: limit,
      orderBy: { createdAt: 'asc' },
      include: {
        author: true,
      }
    });
    return comments;
  } catch (error) {
    console.error('Error fetching comments:', error);
    throw error;
  }
};

export const updateComment = async (commentId: string, updates: Partial<ForumComment>) => {
  try {
    const comment = await prisma.comment.update({
      where: { id: commentId },
      data: updates,
      include: {
        author: true,
      }
    });
    return comment;
  } catch (error) {
    console.error('Error updating comment:', error);
    throw error;
  }
};

export const deleteComment = async (commentId: string) => {
  try {
    await prisma.comment.delete({
      where: { id: commentId }
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    throw error;
  }
};

// UTILITY FUNCTIONS
export const incrementPostViews = async (postId: string) => {
  try {
    await prisma.post.update({
      where: { id: postId },
      data: { views: { increment: 1 } }
    });
  } catch (error) {
    console.error('Error incrementing post views:', error);
    throw error;
  }
};

export const likePost = async (postId: string, userId: string) => {
  try {
    // Check if user already liked this post
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId,
          postId
        }
      }
    });

    if (existingLike) {
      // Unlike the post
      await prisma.like.delete({
        where: { id: existingLike.id }
      });
      
      await prisma.post.update({
        where: { id: postId },
        data: { likes: { decrement: 1 } }
      });
    } else {
      // Like the post
      await prisma.like.create({
        data: {
          userId,
          postId
        }
      });
      
      await prisma.post.update({
        where: { id: postId },
        data: { likes: { increment: 1 } }
      });
    }
  } catch (error) {
    console.error('Error liking post:', error);
    throw error;
  }
};

export const likeComment = async (commentId: string, userId: string) => {
  try {
    // Check if user already liked this comment
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_commentId: {
          userId,
          commentId
        }
      }
    });

    if (existingLike) {
      // Unlike the comment
      await prisma.like.delete({
        where: { id: existingLike.id }
      });
      
      await prisma.comment.update({
        where: { id: commentId },
        data: { likes: { decrement: 1 } }
      });
    } else {
      // Like the comment
      await prisma.like.create({
        data: {
          userId,
          commentId
        }
      });
      
      await prisma.comment.update({
        where: { id: commentId },
        data: { likes: { increment: 1 } }
      });
    }
  } catch (error) {
    console.error('Error liking comment:', error);
    throw error;
  }
};

export const getCommentById = async (commentId: string) => {
  try {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        author: true,
      }
    });
    return comment;
  } catch (error) {
    console.error('Error fetching comment:', error);
    throw error;
  }
};
