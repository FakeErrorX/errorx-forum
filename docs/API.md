# 📱 API Reference

Complete API documentation for ErrorX Forum.

## 🔗 Base URL

```
Production: https://yourdomain.com/api
Development: http://localhost:3000/api
```

## 🔐 Authentication

Most endpoints require authentication. Include the session cookie in your requests.

### **Authentication Methods**

- **Session Cookie** (recommended for web clients)
- **JWT Token** (for mobile/API clients)

---

## 👤 User Endpoints

### **POST /api/auth/signin**

Sign in with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "user": {
    "id": "user_id",
    "name": "User Name",
    "username": "username",
    "email": "user@example.com",
    "image": "https://example.com/avatar.jpg"
  }
}
```

**Error Responses:**
- `400` - Invalid credentials
- `500` - Server error

---

### **POST /api/auth/signup**

Create a new user account.

**Request Body:**
```json
{
  "name": "User Name",
  "username": "username",
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "user": {
    "id": "user_id",
    "name": "User Name",
    "username": "username",
    "email": "user@example.com"
  }
}
```

**Error Responses:**
- `400` - Validation error
- `409` - User already exists
- `500` - Server error

---

### **POST /api/auth/signout**

Sign out the current user.

**Response:**
```json
{
  "message": "Signed out successfully"
}
```

---

### **POST /api/auth/forgot-password**

Request a password reset email.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "message": "Password reset email sent"
}
```

---

### **POST /api/auth/reset-password**

Reset password with token.

**Request Body:**
```json
{
  "token": "reset_token",
  "password": "new_password123"
}
```

**Response:**
```json
{
  "message": "Password reset successfully"
}
```

---

## 📝 Post Endpoints

### **GET /api/posts**

Get all posts with pagination and filtering.

**Query Parameters:**
- `limit` (optional): Number of posts per page (default: 25, max: 100)
- `offset` (optional): Number of posts to skip (default: 0)
- `categoryId` (optional): Filter by category ID
- `authorId` (optional): Filter by author ID
- `search` (optional): Search term

**Example Request:**
```
GET /api/posts?limit=10&offset=0&categoryId=cat_123&search=javascript
```

**Response:**
```json
{
  "posts": [
    {
      "id": "post_id",
      "title": "Post Title",
      "content": "Post content...",
      "author": {
        "id": "user_id",
        "name": "Author Name",
        "username": "author_username",
        "image": "https://example.com/avatar.jpg"
      },
      "category": {
        "id": "category_id",
        "name": "Category Name",
        "description": "Category description"
      },
      "isPinned": false,
      "isLocked": false,
      "views": 42,
      "likes": 5,
      "replies": 3,
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "total": 100,
    "limit": 10,
    "offset": 0,
    "hasMore": true
  }
}
```

---

### **POST /api/posts**

Create a new post.

**Request Body:**
```json
{
  "title": "Post Title",
  "content": "Post content...",
  "categoryId": "category_id"
}
```

**Response:**
```json
{
  "id": "post_id",
  "title": "Post Title",
  "content": "Post content...",
  "author": {
    "id": "user_id",
    "name": "Author Name",
    "username": "author_username"
  },
  "category": {
    "id": "category_id",
    "name": "Category Name"
  },
  "isPinned": false,
  "isLocked": false,
  "views": 0,
  "likes": 0,
  "replies": 0,
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-01-01T00:00:00Z"
}
```

**Error Responses:**
- `400` - Validation error
- `401` - Unauthorized
- `404` - Category not found
- `500` - Server error

---

### **GET /api/posts/[id]**

Get a specific post by ID.

**Response:**
```json
{
  "id": "post_id",
  "title": "Post Title",
  "content": "Post content...",
  "author": {
    "id": "user_id",
    "name": "Author Name",
    "username": "author_username",
    "image": "https://example.com/avatar.jpg"
  },
  "category": {
    "id": "category_id",
    "name": "Category Name",
    "description": "Category description"
  },
  "comments": [
    {
      "id": "comment_id",
      "content": "Comment content...",
      "author": {
        "id": "user_id",
        "name": "Commenter Name",
        "username": "commenter_username"
      },
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ],
  "isPinned": false,
  "isLocked": false,
  "views": 42,
  "likes": 5,
  "replies": 3,
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-01-01T00:00:00Z"
}
```

---

### **PUT /api/posts/[id]**

Update a post (author only).

**Request Body:**
```json
{
  "title": "Updated Post Title",
  "content": "Updated post content..."
}
```

**Response:**
```json
{
  "id": "post_id",
  "title": "Updated Post Title",
  "content": "Updated post content...",
  "updatedAt": "2025-01-01T00:00:00Z"
}
```

---

### **DELETE /api/posts/[id]**

Delete a post (author or admin only).

**Response:**
```json
{
  "message": "Post deleted successfully"
}
```

---

## 💬 Comment Endpoints

### **GET /api/posts/[id]/comments**

Get comments for a specific post.

**Query Parameters:**
- `limit` (optional): Number of comments per page (default: 25)
- `offset` (optional): Number of comments to skip (default: 0)

**Response:**
```json
{
  "comments": [
    {
      "id": "comment_id",
      "content": "Comment content...",
      "author": {
        "id": "user_id",
        "name": "Commenter Name",
        "username": "commenter_username",
        "image": "https://example.com/avatar.jpg"
      },
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "total": 50,
    "limit": 25,
    "offset": 0,
    "hasMore": true
  }
}
```

---

### **POST /api/posts/[id]/comments**

Create a new comment on a post.

**Request Body:**
```json
{
  "content": "Comment content..."
}
```

**Response:**
```json
{
  "id": "comment_id",
  "content": "Comment content...",
  "author": {
    "id": "user_id",
    "name": "Commenter Name",
    "username": "commenter_username"
  },
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-01-01T00:00:00Z"
}
```

---

## 📂 Category Endpoints

### **GET /api/categories**

Get all categories.

**Response:**
```json
{
  "categories": [
    {
      "id": "category_id",
      "name": "Category Name",
      "description": "Category description",
      "postCount": 42,
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ]
}
```

---

## 👤 User Profile Endpoints

### **GET /api/users/[id]**

Get user profile by ID.

**Response:**
```json
{
  "id": "user_id",
  "name": "User Name",
  "username": "username",
  "email": "user@example.com",
  "image": "https://example.com/avatar.jpg",
  "bio": "User bio...",
  "location": "City, Country",
  "website": "https://example.com",
  "joinedAt": "2025-01-01T00:00:00Z",
  "postCount": 15,
  "commentCount": 42
}
```

---

### **PUT /api/users/[id]**

Update user profile (owner only).

**Request Body:**
```json
{
  "name": "Updated Name",
  "bio": "Updated bio...",
  "location": "New City, Country",
  "website": "https://newsite.com"
}
```

**Response:**
```json
{
  "id": "user_id",
  "name": "Updated Name",
  "bio": "Updated bio...",
  "location": "New City, Country",
  "website": "https://newsite.com",
  "updatedAt": "2025-01-01T00:00:00Z"
}
```

---

## 📁 File Upload Endpoints

### **POST /api/files/upload**

Upload a file to Cloudflare R2.

**Request Body:**
```json
{
  "file": "file_data",
  "userId": "user_id",
  "folder": "uploads"
}
```

**Response:**
```json
{
  "id": "file_id",
  "filename": "example.jpg",
  "url": "https://cdn.yourdomain.com/uploads/example.jpg",
  "size": 1024000,
  "mimeType": "image/jpeg",
  "uploadedAt": "2025-01-01T00:00:00Z"
}
```

---

## 🔍 Search Endpoints

### **GET /api/search**

Search across posts and users.

**Query Parameters:**
- `q` (required): Search query
- `type` (optional): Search type (`posts`, `users`, `all`)
- `limit` (optional): Number of results (default: 25)

**Example Request:**
```
GET /api/search?q=javascript&type=posts&limit=10
```

**Response:**
```json
{
  "results": [
    {
      "type": "post",
      "id": "post_id",
      "title": "JavaScript Tutorial",
      "content": "Learn JavaScript...",
      "author": {
        "name": "Author Name",
        "username": "author_username"
      },
      "score": 0.95
    }
  ],
  "query": "javascript",
  "total": 25,
  "limit": 10
}
```

---

## 📊 Error Responses

All endpoints may return the following error responses:

### **400 Bad Request**
```json
{
  "error": "Validation error",
  "details": "Field 'email' is required"
}
```

### **401 Unauthorized**
```json
{
  "error": "Authentication required"
}
```

### **403 Forbidden**
```json
{
  "error": "Access denied"
}
```

### **404 Not Found**
```json
{
  "error": "Resource not found"
}
```

### **500 Internal Server Error**
```json
{
  "error": "Internal server error"
}
```

---

## 🔒 Rate Limiting

API endpoints are rate limited to prevent abuse:

- **Authentication endpoints**: 5 requests per minute
- **Post creation**: 10 requests per minute
- **Comment creation**: 20 requests per minute
- **File uploads**: 5 requests per minute
- **Other endpoints**: 100 requests per minute

---

## 📝 Request/Response Examples

### **cURL Examples**

#### **Sign In**
```bash
curl -X POST https://yourdomain.com/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

#### **Create Post**
```bash
curl -X POST https://yourdomain.com/api/posts \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=your_session_token" \
  -d '{"title":"New Post","content":"Post content...","categoryId":"cat_123"}'
```

#### **Get Posts**
```bash
curl -X GET "https://yourdomain.com/api/posts?limit=10&offset=0" \
  -H "Cookie: next-auth.session-token=your_session_token"
```

---

## 🔧 SDK Examples

### **JavaScript/TypeScript**

```typescript
// API client class
class ErrorXForumAPI {
  private baseURL: string;
  private sessionToken: string;

  constructor(baseURL: string, sessionToken?: string) {
    this.baseURL = baseURL;
    this.sessionToken = sessionToken || '';
  }

  async signIn(email: string, password: string) {
    const response = await fetch(`${this.baseURL}/auth/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    return response.json();
  }

  async getPosts(limit = 25, offset = 0) {
    const response = await fetch(
      `${this.baseURL}/posts?limit=${limit}&offset=${offset}`,
      {
        headers: {
          'Cookie': `next-auth.session-token=${this.sessionToken}`,
        },
      }
    );
    return response.json();
  }

  async createPost(title: string, content: string, categoryId: string) {
    const response = await fetch(`${this.baseURL}/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `next-auth.session-token=${this.sessionToken}`,
      },
      body: JSON.stringify({ title, content, categoryId }),
    });
    return response.json();
  }
}

// Usage
const api = new ErrorXForumAPI('https://yourdomain.com/api', 'your_session_token');
const posts = await api.getPosts(10, 0);
```

---

<div align="center">

**API Documentation for ErrorX Forum**

[![GitHub](https://img.shields.io/badge/GitHub-FakeErrorX-181717?style=for-the-badge&logo=github)](https://github.com/FakeErrorX)
[![Twitter](https://img.shields.io/badge/Twitter-@FakeErrorX-1DA1F2?style=for-the-badge&logo=twitter)](https://twitter.com/FakeErrorX)

</div>
