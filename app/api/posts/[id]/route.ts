import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPostById, updatePost, deletePost, incrementPostViews } from "../../database";
import { PostWithRelations, CommentWithRelations } from "../../types";

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
      },
      comments: post.comments?.map((comment: CommentWithRelations) => ({
        commentId: comment.commentId,
        postId: (post as PostWithRelations).postId,
        authorId: comment.author.userId,
        authorUsername: comment.authorUsername,
        content: comment.content,
        parentId: comment.parentId ? comment.parentId : null,
        likes: comment.likes,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        author: {
          userId: comment.author.userId,
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
    const userId = (session.user as { id: string }).id;
    if (post.authorId !== userId) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const updatedPost = await updatePost(id, body);
    
    // Transform post to hide internal IDs and use custom IDs
    const cleanPost = {
      postId: (updatedPost as PostWithRelations).postId,
      title: updatedPost.title,
      content: updatedPost.content,
      categoryId: (updatedPost as PostWithRelations).category.categoryId,
      authorId: (updatedPost as PostWithRelations).author.userId,
      authorUsername: updatedPost.authorUsername,
      isPinned: updatedPost.isPinned,
      isLocked: updatedPost.isLocked,
      views: updatedPost.views,
      likes: updatedPost.likes,
      replies: updatedPost.replies,
      createdAt: updatedPost.createdAt,
      updatedAt: updatedPost.updatedAt,
      author: {
        userId: (updatedPost as PostWithRelations).author.userId,
        name: (updatedPost as PostWithRelations).author.name,
        username: (updatedPost as PostWithRelations).author.username,
        image: (updatedPost as PostWithRelations).author.image
      },
      category: {
        categoryId: (updatedPost as PostWithRelations).category.categoryId,
        name: (updatedPost as PostWithRelations).category.name,
        description: (updatedPost as PostWithRelations).category.description,
        icon: (updatedPost as PostWithRelations).category.icon,
        color: (updatedPost as PostWithRelations).category.color
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
    const userId = (session.user as { id: string }).id;
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
