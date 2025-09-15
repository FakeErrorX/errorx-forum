import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPostById, updatePost, deletePost, incrementPostViews } from "../../database";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const post = await getPostById(id);
    
    if (!post) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }

    // Increment view count
    await incrementPostViews(id);

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
      },
      comments: post.comments?.map(comment => ({
        commentId: (comment as any).commentId,
        postId: (post as any).postId,
        authorId: (comment.author as any).userId,
        authorUsername: comment.authorUsername,
        content: comment.content,
        parentId: comment.parentId ? (comment as any).parentId : null,
        likes: comment.likes,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        author: {
          userId: (comment.author as any).userId,
          name: comment.author.name,
          username: comment.author.username,
          image: comment.author.image
        }
      })) || []
    };
    
    return NextResponse.json(cleanPost);
  } catch (error) {
    console.error("Error fetching post:", error);
    return NextResponse.json(
      { error: "Failed to fetch post" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const post = await getPostById(id);

    if (!post) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }

    // Check if user is the author
    const userId = (session.user as any).id;
    if (post.authorId !== userId) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const updatedPost = await updatePost(id, body);
    
    // Transform post to hide internal IDs and use custom IDs
    const cleanPost = {
      postId: (updatedPost as any).postId,
      title: updatedPost.title,
      content: updatedPost.content,
      categoryId: (updatedPost.category as any).categoryId,
      authorId: (updatedPost.author as any).userId,
      authorUsername: updatedPost.authorUsername,
      isPinned: updatedPost.isPinned,
      isLocked: updatedPost.isLocked,
      views: updatedPost.views,
      likes: updatedPost.likes,
      replies: updatedPost.replies,
      createdAt: updatedPost.createdAt,
      updatedAt: updatedPost.updatedAt,
      author: {
        userId: (updatedPost.author as any).userId,
        name: updatedPost.author.name,
        username: updatedPost.author.username,
        image: updatedPost.author.image
      },
      category: {
        categoryId: (updatedPost.category as any).categoryId,
        name: updatedPost.category.name,
        description: updatedPost.category.description,
        icon: updatedPost.category.icon,
        color: updatedPost.category.color
      }
    };
    
    return NextResponse.json(cleanPost);
  } catch (error) {
    console.error("Error updating post:", error);
    return NextResponse.json(
      { error: "Failed to update post" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const post = await getPostById(id);

    if (!post) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }

    // Check if user is the author
    const userId = (session.user as any).id;
    if (post.authorId !== userId) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    await deletePost(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting post:", error);
    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 }
    );
  }
}
