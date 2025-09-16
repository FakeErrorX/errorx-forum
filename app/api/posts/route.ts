import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPosts, createPost } from "../database";
import { createSecureResponse, createSecureErrorResponse } from "@/lib/api-security";
import { createPostSchema, paginationSchema, searchSchema } from "@/lib/validations";
import { validateRequestBody, validateQueryParams, handleValidationError } from "@/lib/api-validation";
import { PostWithRelations } from "../types";
import { z } from "zod";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Validate query parameters
    const queryParams = validateQueryParams(paginationSchema.extend({
      categoryId: z.string().optional(),
      authorId: z.string().optional(),
      search: z.string().optional(),
    }), searchParams);
    
    const { limit, offset, categoryId, authorId, search } = queryParams;

    let posts;
    if (search) {
      const { searchPosts } = await import("../database");
      posts = await searchPosts(search, limit);
    } else {
      posts = await getPosts(limit, offset, categoryId, authorId);
    }
    
    // Transform posts to hide internal IDs and use custom IDs
    const cleanPosts = posts.map((post: PostWithRelations) => ({
      postId: post.postId,
      title: post.title,
      content: post.content,
      categoryId: post.category.categoryId,
      authorId: post.author.userId,
      authorUsername: post.authorUsername,
      isPinned: post.isPinned,
      isLocked: post.isLocked,
      views: post.views,
      likes: post.likes,
      replies: post.replies,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      author: {
        userId: post.author.userId,
        name: post.author.name,
        username: post.author.username,
        image: post.author.image
      },
      category: {
        categoryId: post.category.categoryId,
        name: post.category.name,
        description: post.category.description,
        icon: post.category.icon,
        color: post.category.color
      }
    }));
    
    return createSecureResponse(cleanPosts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    if (error instanceof Error && error.message.includes('validation')) {
      return handleValidationError(error);
    }
    return createSecureErrorResponse("Failed to fetch posts", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Validate request body
    const body = await request.json();
    const validatedData = validateRequestBody(createPostSchema, body);
    const { title, content, categoryId } = validatedData;

    // Get user's username
    const { getUserProfile } = await import("../users");
    const userId = (session.user as { id: string }).id;
    const user = await getUserProfile(userId);
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Find the internal category ID from the custom categoryId
    const { prisma } = await import("@/lib/prisma");
    const category = await prisma.category.findFirst({
      where: { categoryId: parseInt(categoryId) }
    });

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    const post = await createPost({
      title,
      content,
      categoryId: category.id, // Use internal database ID
      authorId: userId,
      authorUsername: user.username || user.name || "Anonymous",
      isPinned: false,
      isLocked: false,
      views: 0,
      likes: 0,
      replies: 0,
    });

    // Transform post to hide internal IDs and use custom IDs
    const cleanPost = {
      postId: (post as PostWithRelations).postId,
      title: post.title,
      content: post.content,
      categoryId: (post as PostWithRelations).category.categoryId,
      authorId: (post as PostWithRelations).author.userId,
      authorUsername: post.authorUsername,
      isPinned: post.isPinned,
      isLocked: post.isLocked,
      views: post.views,
      likes: post.likes,
      replies: post.replies,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      author: {
        userId: (post as PostWithRelations).author.userId,
        name: (post as PostWithRelations).author.name,
        username: (post as PostWithRelations).author.username,
        image: (post as PostWithRelations).author.image
      },
      category: {
        categoryId: (post as PostWithRelations).category.categoryId,
        name: (post as PostWithRelations).category.name,
        description: (post as PostWithRelations).category.description,
        icon: (post as PostWithRelations).category.icon,
        color: (post as PostWithRelations).category.color
      }
    };
    
    return createSecureResponse(cleanPost, 201);
  } catch (error) {
    console.error("Error creating post:", error);
    if (error instanceof Error && error.message.includes('validation')) {
      return handleValidationError(error);
    }
    return createSecureErrorResponse("Failed to create post", 500);
  }
}
