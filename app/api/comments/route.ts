import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createComment, getCommentsByPost } from "../database";
import { CommentWithRelations } from "../types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get("postId");
    const limit = parseInt(searchParams.get("limit") || "50");

    if (!postId) {
      return NextResponse.json(
        { error: "Post ID is required" },
        { status: 400 }
      );
    }

    const comments = await getCommentsByPost(postId, limit);
    
    // Transform comments to hide internal IDs and use custom IDs
    const cleanComments = comments.map((comment: CommentWithRelations) => ({
      commentId: comment.commentId,
      postId: comment.postId,
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
    }));
    
    return NextResponse.json(cleanComments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
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
    const { postId, content, parentId } = body;

    if (!postId || !content) {
      return NextResponse.json(
        { error: "Post ID and content are required" },
        { status: 400 }
      );
    }

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

    const comment = await createComment({
      postId,
      authorId: userId,
      authorUsername: user.username || user.name || "Anonymous",
      content,
      parentId: parentId || null,
      likes: 0,
    });

    // Transform comment to hide internal IDs and use custom IDs
    const cleanComment = {
      commentId: (comment as CommentWithRelations).commentId,
      postId: (comment as CommentWithRelations).postId,
      authorId: (comment as CommentWithRelations).author.userId,
      authorUsername: comment.authorUsername,
      content: comment.content,
      parentId: comment.parentId ? (comment as CommentWithRelations).parentId : null,
      likes: comment.likes,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      author: {
        userId: (comment as CommentWithRelations).author.userId,
        name: (comment as CommentWithRelations).author.name,
        username: (comment as CommentWithRelations).author.username,
        image: (comment as CommentWithRelations).author.image
      }
    };
    
    return NextResponse.json(cleanComment, { status: 201 });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}
