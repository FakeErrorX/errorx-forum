import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPosts, createPost } from "../database";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "25");
    const offset = parseInt(searchParams.get("offset") || "0");
    const categoryId = searchParams.get("categoryId") || undefined;
    const authorId = searchParams.get("authorId") || undefined;
    const search = searchParams.get("search");

    let posts;
    if (search) {
      const { searchPosts } = await import("../database");
      posts = await searchPosts(search, limit);
    } else {
      posts = await getPosts(limit, offset, categoryId, authorId);
    }
    
    // Transform posts to hide internal IDs and use custom IDs
    const cleanPosts = posts.map(post => ({
      postId: (post as any).postId,
      title: post.title,
      content: post.content,
      categoryId: (post.category as any).categoryId,
      authorId: (post.author as any).userId,
      authorUsername: post.authorUsername,
      isPinned: post.isPinned,
      isLocked: post.isLocked,
      views: post.views,
      likes: post.likes,
      replies: post.replies,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      author: {
        userId: (post.author as any).userId,
        name: post.author.name,
        username: post.author.username,
        image: post.author.image
      },
      category: {
        categoryId: (post.category as any).categoryId,
        name: post.category.name,
        description: post.category.description,
        icon: post.category.icon,
        color: post.category.color
      }
    }));
    
    return NextResponse.json(cleanPosts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
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

    const body = await request.json();
    const { title, content, categoryId } = body;

    if (!title || !content || !categoryId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get user's username
    const { getUserProfile } = await import("../users");
    const userId = (session.user as any).id;
    const user = await getUserProfile(userId);
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const post = await createPost({
      title,
      content,
      categoryId,
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
      postId: (post as any).postId,
      title: post.title,
      content: post.content,
      categoryId: (post.category as any).categoryId,
      authorId: (post.author as any).userId,
      authorUsername: post.authorUsername,
      isPinned: post.isPinned,
      isLocked: post.isLocked,
      views: post.views,
      likes: post.likes,
      replies: post.replies,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      author: {
        userId: (post.author as any).userId,
        name: post.author.name,
        username: post.author.username,
        image: post.author.image
      },
      category: {
        categoryId: (post.category as any).categoryId,
        name: post.category.name,
        description: post.category.description,
        icon: post.category.icon,
        color: post.category.color
      }
    };
    
    return NextResponse.json(cleanPost, { status: 201 });
  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    );
  }
}
