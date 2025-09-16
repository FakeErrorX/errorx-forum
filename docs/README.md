# 📚 ErrorX Forum Documentation

Welcome to the ErrorX Forum documentation! This comprehensive guide will help you understand, set up, and contribute to the project.

## 📋 Table of Contents

- [🚀 Getting Started](#-getting-started)
- [🏗️ Architecture](#️-architecture)
- [🔧 Development](#-development)
- [📱 API Reference](#-api-reference)
- [🎨 UI Components](#-ui-components)
- [🗄️ Database](#️-database)
- [🔒 Security](#-security)
- [🚀 Deployment](#-deployment)
- [🤝 Contributing](#-contributing)
- [❓ FAQ](#-faq)

---

## 🚀 Getting Started

### **Prerequisites**

Before you begin, ensure you have the following installed:

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **PostgreSQL** 15+ ([Download](https://www.postgresql.org/download/))
- **Git** ([Download](https://git-scm.com/downloads))
- **VS Code** (recommended) or your preferred editor

### **Quick Setup**

1. **Clone the repository**
   ```bash
   git clone https://github.com/FakeErrorX/errorx-forum.git
   cd errorx-forum
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

**🎉 Open [http://localhost:3000](http://localhost:3000) to view the application!**

---

## 🏗️ Architecture

### **Project Structure**

```
errorx-forum/
├── 📁 app/                    # Next.js App Router
│   ├── 📁 api/               # API routes
│   ├── 📁 create-post/       # Post creation page
│   ├── 📁 profile/           # User profile pages
│   └── 📁 signin/            # Authentication pages
├── 📁 components/            # React components
│   ├── 📁 ui/               # shadcn/ui components
│   ├── 📁 layout/           # Layout components
│   └── 📁 seo/              # SEO components
├── 📁 lib/                  # Utility libraries
│   ├── 📄 auth.ts           # Authentication configuration
│   ├── 📄 prisma.ts         # Database client
│   ├── 📄 validations.ts    # Zod validation schemas
│   └── 📄 s3.ts             # File storage utilities
├── 📁 hooks/                # Custom React hooks
├── 📁 prisma/               # Database schema
└── 📁 public/               # Static assets
```

### **Tech Stack**

- **Frontend**: Next.js 15, React 18, TypeScript 5
- **Styling**: Tailwind CSS, shadcn/ui, Radix UI
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: NextAuth.js
- **File Storage**: Cloudflare R2
- **Validation**: Zod
- **Email**: Nodemailer

---

## 🔧 Development

### **Available Scripts**

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npx prisma studio` | Open Prisma Studio |
| `npx prisma db push` | Push schema changes |
| `npx prisma generate` | Generate Prisma client |

### **Code Style Guide**

- **Use TypeScript** for all new code
- **Follow existing patterns** in the codebase
- **Write clean, readable code**
- **Add comments** for complex logic
- **Use meaningful variable names**

### **File Naming Conventions**

| Type | Convention | Example |
|------|------------|---------|
| **Files** | kebab-case | `user-profile.tsx` |
| **Components** | PascalCase | `UserProfile` |
| **Functions** | camelCase | `getUserProfile` |
| **Variables** | camelCase | `userProfile` |
| **Constants** | UPPER_SNAKE_CASE | `API_BASE_URL` |

---

## 📱 API Reference

### **Authentication Endpoints**

#### `POST /api/auth/signin`
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
    "email": "user@example.com"
  }
}
```

#### `POST /api/auth/signup`
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

### **Post Endpoints**

#### `GET /api/posts`
Get all posts with pagination.

**Query Parameters:**
- `limit` (optional): Number of posts per page (default: 25)
- `offset` (optional): Number of posts to skip (default: 0)
- `categoryId` (optional): Filter by category ID
- `authorId` (optional): Filter by author ID
- `search` (optional): Search term

#### `POST /api/posts`
Create a new post.

**Request Body:**
```json
{
  "title": "Post Title",
  "content": "Post content...",
  "categoryId": "category_id"
}
```

### **File Upload Endpoints**

#### `POST /api/files/upload`
Upload a file to Cloudflare R2.

**Request Body:**
```json
{
  "file": "file_data",
  "userId": "user_id",
  "folder": "uploads"
}
```

---

## 🎨 UI Components

### **shadcn/ui Components**

We use [shadcn/ui](https://ui.shadcn.com/) for our UI components. All components are located in `components/ui/`.

#### **Available Components**

- **Button** - Various button styles and sizes
- **Input** - Form input fields
- **Textarea** - Multi-line text input
- **Card** - Content containers
- **Dialog** - Modal dialogs
- **Dropdown** - Dropdown menus
- **Toast** - Notification messages
- **Badge** - Status indicators
- **Avatar** - User profile images

#### **Usage Example**

```tsx
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ExampleComponent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Example Card</CardTitle>
      </CardHeader>
      <CardContent>
        <Button>Click me</Button>
      </CardContent>
    </Card>
  );
}
```

---

## 🗄️ Database

### **Schema Overview**

Our database uses PostgreSQL with Prisma ORM. The main entities are:

- **User** - User accounts and profiles
- **Post** - Forum posts
- **Comment** - Post comments
- **Category** - Post categories
- **File** - Uploaded files

### **Key Relationships**

- Users can have many Posts
- Posts can have many Comments
- Posts belong to one Category
- Users can upload many Files

### **Database Operations**

```typescript
// Create a new post
const post = await prisma.post.create({
  data: {
    title: "New Post",
    content: "Post content...",
    authorId: "user_id",
    categoryId: "category_id"
  }
});

// Get posts with author and category
const posts = await prisma.post.findMany({
  include: {
    author: true,
    category: true,
    comments: true
  }
});
```

---

## 🔒 Security

### **Authentication**

- **NextAuth.js** for session management
- **JWT tokens** for secure authentication
- **Password hashing** with bcrypt
- **OAuth providers** (Google) support

### **API Security**

- **CORS protection** - Only allowed origins can access API
- **Input validation** - All inputs validated with Zod
- **Rate limiting** - Prevent abuse
- **SQL injection protection** - Prisma ORM prevents SQL injection

### **Environment Variables**

All sensitive configuration is stored in environment variables:

```env
# Database
DATABASE_URL="postgresql://..."

# Authentication
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="https://yourdomain.com"

# File Storage
S3_ACCESS_KEY="your-access-key"
S3_SECRET_KEY="your-secret-key"
```

---

## 🚀 Deployment

### **Environment Setup**

1. **Set up PostgreSQL database**
2. **Configure Cloudflare R2** for file storage
3. **Set up SMTP** for email functionality
4. **Configure environment variables**

### **Production Checklist**

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] File storage configured
- [ ] Email service configured
- [ ] SSL certificate installed
- [ ] Domain configured
- [ ] Monitoring set up

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](../CONTRIBUTING.md) for details.

### **Quick Start for Contributors**

1. **Fork** the repository
2. **Create** a feature branch
3. **Make** your changes
4. **Test** your changes
5. **Submit** a pull request

---

## ❓ FAQ

### **General Questions**

**Q: How do I reset my password?**
A: Use the "Forgot Password" link on the sign-in page.

**Q: Can I upload images?**
A: Yes, you can upload images and other files through the file upload system.

**Q: How do I create a new category?**
A: Categories are managed by administrators through the admin panel.

### **Technical Questions**

**Q: What database does this use?**
A: We use PostgreSQL with Prisma ORM.

**Q: Can I use a different file storage service?**
A: Yes, you can configure any S3-compatible storage service.

**Q: How do I add new OAuth providers?**
A: Configure them in the NextAuth.js configuration in `lib/auth.ts`.

---

## 📞 Support

Need help? We're here for you!

- **GitHub Issues** - [Report bugs](https://github.com/FakeErrorX/errorx-forum/issues)
- **GitHub Discussions** - [Ask questions](https://github.com/FakeErrorX/errorx-forum/discussions)
- **Email** - [Contact us](mailto:info@errorx.me)

---

<div align="center">

**Built with ❤️ by [ErrorX](https://github.com/FakeErrorX)**

[![GitHub](https://img.shields.io/badge/GitHub-FakeErrorX-181717?style=for-the-badge&logo=github)](https://github.com/FakeErrorX)
[![Twitter](https://img.shields.io/badge/Twitter-@FakeErrorX-1DA1F2?style=for-the-badge&logo=twitter)](https://twitter.com/FakeErrorX)

</div>
