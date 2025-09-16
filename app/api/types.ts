// Extended types for API responses that include both internal and custom IDs
export interface PostWithRelations {
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
  author: {
    id: string; // Internal database ID (hidden from API)
    userId: number; // Custom sequential user ID (exposed in API)
    name: string | null;
    username: string | null;
    image: string | null;
  };
  category: {
    id: string; // Internal database ID (hidden from API)
    categoryId: number; // Custom sequential category ID (exposed in API)
    name: string;
    description: string | null;
    icon: string | null;
    color: string | null;
  };
}

export interface CategoryWithRelations {
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

export interface CommentWithRelations {
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
  author: {
    id: string; // Internal database ID (hidden from API)
    userId: number; // Custom sequential user ID (exposed in API)
    name: string | null;
    username: string | null;
    image: string | null;
  };
}

export interface UserWithRelations {
  id: string; // Internal database ID (hidden from API)
  userId: number; // Custom sequential user ID (exposed in API)
  name: string | null;
  username: string | null;
  email: string | null;
  image: string | null;
  bio: string | null;
  postCount: number;
  reputation: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
