<div align="center">

# 🚀 ErrorX Forum

> **A modern, full-featured forum application built with Next.js 16**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-7.0-2D3748?style=for-the-badge&logo=prisma)](https://prisma.io/)

*Featuring user authentication, post management, file uploads, and real-time interactions*

[🌐 Live Website](https://errorx.org) • [📖 Documentation](docs/README.md) • [🐛 Report Bug](https://github.com/FakeErrorX/errorx-forum/issues/new?template=bug_report.md) • [✨ Request Feature](https://github.com/FakeErrorX/errorx-forum/issues/new?template=feature_request.md)

</div>

---

## ✨ Features

<div align="center">

### 🔐 **Authentication & User Management**
**Secure authentication with multiple providers and comprehensive user profiles**

| Feature | Description |
|---------|-------------|
| 🔑 **NextAuth.js Integration** | Secure authentication with multiple providers |
| 🌐 **Google OAuth** | Social login support |
| 👤 **User Profiles** | Customizable user profiles with avatars |
| 🔒 **Password Management** | Forgot password and reset functionality |
| 🎯 **Username Generation** | Automatic username generation from names/emails |

### 📝 **Content Management**
**Rich content creation and management system**

| Feature | Description |
|---------|-------------|
| ✍️ **Post Creation** | Rich text posts with categories |
| 📂 **Category System** | Organized discussion categories |
| 💬 **Comment System** | Nested comments with replies |
| 🔍 **Search Functionality** | Full-text search across posts |
| 📄 **Pagination** | Efficient content loading |

### 🎨 **Modern UI/UX**
**Built with shadcn/ui and Radix UI for exceptional user experience**

| Feature | Description |
|---------|-------------|
| 📱 **Responsive Design** | Mobile-first responsive layout |
| 🌙 **Dark/Light Mode** | Theme switching with system preference detection |
| 🎭 **shadcn/ui Components** | Beautiful, accessible UI components |
| ♿ **Accessibility** | WCAG compliant components |
| ⚡ **Loading States** | Smooth loading animations |

### 📁 **File Management**
**Scalable file storage and management**

| Feature | Description |
|---------|-------------|
| ☁️ **Cloudflare R2 Storage** | Scalable file storage |
| 📤 **File Upload** | Drag & drop file uploads |
| 🖼️ **Image Optimization** | Automatic image optimization |
| 🌐 **CDN Integration** | Custom domain support for assets |

### 🔒 **Security & Validation**
**Enterprise-level security and validation**

| Feature | Description |
|---------|-------------|
| ✅ **Zod Validation** | Comprehensive input validation |
| 🛡️ **API Security** | CORS protection and origin validation |
| 🔐 **Environment Validation** | Secure environment variable handling |
| 🎯 **Type Safety** | Full TypeScript support |

### 📊 **SEO & Performance**
**Optimized for search engines and performance**

| Feature | Description |
|---------|-------------|
| 🔍 **SEO Optimization** | Meta tags, structured data, sitemaps |
| ⚡ **Performance** | Optimized images and code splitting |
| 📈 **Analytics Ready** | Google Analytics integration ready |
| 📱 **Social Sharing** | Open Graph and Twitter Card support |

</div>

---

## 🛠️ Tech Stack

<div align="center">

### **Frontend**
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-6-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=flat-square&logo=tailwind-css)
![shadcn/ui](https://img.shields.io/badge/shadcn/ui-0.8.0-000000?style=flat-square)
![Radix UI](https://img.shields.io/badge/Radix_UI-1.0-161618?style=flat-square)

### **Backend**
![Prisma](https://img.shields.io/badge/Prisma-7.0-2D3748?style=flat-square&logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-316192?style=flat-square&logo=postgresql)
![NextAuth.js](https://img.shields.io/badge/NextAuth.js-5.0-000000?style=flat-square)

### **Services**
![Cloudflare R2](https://img.shields.io/badge/Cloudflare_R2-Storage-FF6B6B?style=flat-square)
![Zod](https://img.shields.io/badge/Zod-4.0-3066BE?style=flat-square)
![Nodemailer](https://img.shields.io/badge/Nodemailer-6.0-FF6B6B?style=flat-square)

</div>

---

## 🚀 Quick Start

### **Prerequisites**

- **Node.js** 18+ 
- **PostgreSQL** database
- **Cloudflare R2** account (for file storage)
- **SMTP** email service (Gmail, SendGrid, etc.)
- **npm** package manager

### **1️⃣ Clone & Install**

```bash
# Clone the repository
git clone https://github.com/FakeErrorX/errorx-forum.git
cd errorx-forum

# Install dependencies
npm install
```

The project uses `package-lock.json`, so `npm install` is the supported install path.

### **2️⃣ Environment Setup**

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/errorx_forum"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Google OAuth (optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Site Configuration
SITE_URL="http://localhost:3000"
SITE_NAME="ErrorX Forum"
SITE_DESCRIPTION="A modern forum for developers and tech enthusiasts"

# Social Media URLs
TWITTER_HANDLE="@FakeErrorX"
TWITTER_SITE="@FakeErrorX"
TWITTER_URL="https://twitter.com/FakeErrorX"
GITHUB_URL="https://github.com/FakeErrorX"
TELEGRAM_URL="https://t.me/ErrorX_BD"
FACEBOOK_URL="https://facebook.com/ErrorX.GG"

# Cloudflare R2 Storage
S3_REGION="auto"
S3_ENDPOINT="https://your-account-id.r2.cloudflarestorage.com"
S3_ACCESS_KEY="your-access-key"
S3_SECRET_KEY="your-secret-key"
S3_BUCKET_NAME="your-bucket-name"
S3_BUCKET_URL="https://your-custom-domain.com"

# API Security
ALLOWED_ORIGINS="http://localhost:3000,https://yourdomain.com"

# Development Configuration
LOCALHOST_PORT="3000"

# Email Configuration (SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="ErrorX Community <noreply@yourdomain.com>"
```

### **3️⃣ Database Setup**

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push

# (Optional) Seed the database
npx prisma db seed
```

### **4️⃣ Start Development**

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

**🎉 Open [http://localhost:3000](http://localhost:3000) to view the application!**

---

## 📁 Project Structure

```
errorx-forum/
├── 📁 app/                    # Next.js App Router
│   ├── 📁 api/               # API routes
│   │   ├── 📁 auth/          # Authentication endpoints
│   │   ├── 📁 posts/         # Post management
│   │   ├── 📁 users/         # User management
│   │   └── 📁 files/         # File upload endpoints
│   ├── 📁 create-post/       # Post creation page
│   ├── 📁 profile/           # User profile pages
│   ├── 📁 settings/          # User settings
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
├── 📁 docs/                 # Documentation
│   ├── 📄 README.md         # Main documentation
│   ├── 📄 API.md            # API reference
│   └── 📄 DEPLOYMENT.md     # Deployment guide
├── 📁 .github/              # GitHub templates
│   ├── 📁 ISSUE_TEMPLATE/   # Issue templates
│   └── 📁 DISCUSSION_TEMPLATE/ # Discussion templates
└── 📁 public/               # Static assets
```

---

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | 🚀 Start development server |
| `npm run build` | 🏗️ Build for production |
| `npm run start` | 🎯 Start production server |
| `npm run lint` | 🔍 Run ESLint |
| `npx prisma studio` | 🗄️ Open Prisma Studio |
| `npx prisma db push` | 📤 Push schema changes |
| `npx prisma generate` | ⚙️ Generate Prisma client |

---

## 🔒 Security Features

<div align="center">

| 🛡️ **Security Feature** | 📝 **Description** |
|-------------------------|-------------------|
| **Input Validation** | All inputs validated with Zod |
| **CORS Protection** | API endpoints protected from external access |
| **Environment Validation** | Required environment variables validated |
| **Password Security** | Strong password requirements |
| **SQL Injection Protection** | Prisma ORM prevents SQL injection |
| **XSS Protection** | Input sanitization and validation |

</div>

---

## 📊 Performance Features

<div align="center">

| ⚡ **Performance Feature** | 📝 **Description** |
|---------------------------|-------------------|
| **Image Optimization** | Next.js automatic image optimization |
| **Code Splitting** | Automatic code splitting for better performance |
| **Static Generation** | Pre-rendered pages where possible |
| **CDN Integration** | Cloudflare R2 for fast asset delivery |
| **Caching** | Optimized caching strategies |

</div>

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### **Quick Start for Contributors**

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### **📚 Documentation**

- **[Main Documentation](docs/README.md)** - Complete project documentation
- **[API Reference](docs/API.md)** - Detailed API documentation
- **[Deployment Guide](docs/DEPLOYMENT.md)** - Production deployment instructions

### **🐛 Report Issues**

- **[Bug Report](https://github.com/FakeErrorX/errorx-forum/issues/new?template=bug_report.md)** - Report bugs and issues
- **[Feature Request](https://github.com/FakeErrorX/errorx-forum/issues/new?template=feature_request.md)** - Suggest new features
- **[Question](https://github.com/FakeErrorX/errorx-forum/issues/new?template=question.md)** - Ask questions

### **💬 Discussions**

- **[General Discussion](https://github.com/FakeErrorX/errorx-forum/discussions/new?category=general)** - General project discussions
- **[Ideas & Brainstorming](https://github.com/FakeErrorX/errorx-forum/discussions/new?category=ideas)** - Share ideas and brainstorm
- **[Q&A](https://github.com/FakeErrorX/errorx-forum/discussions/new?category=q-and-a)** - Ask questions and get answers

---

## 📝 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

<div align="center">

| 🛠️ **Tool** | 📝 **Description** |
|-------------|-------------------|
| [Next.js](https://nextjs.org/) | The React framework |
| [Prisma](https://prisma.io/) | Database toolkit |
| [shadcn/ui](https://ui.shadcn.com/) | Beautiful UI components |
| [Radix UI](https://radix-ui.com/) | Accessible UI primitives |
| [Tailwind CSS](https://tailwindcss.com/) | Utility-first CSS |
| [NextAuth.js](https://next-auth.js.org/) | Authentication for Next.js |
| [Zod](https://zod.dev/) | TypeScript-first schema validation |

</div>

---

## 📞 Support

<div align="center">

**Need help? We're here for you!**

[🐛 Report Bug](https://github.com/FakeErrorX/errorx-forum/issues) • [✨ Request Feature](https://github.com/FakeErrorX/errorx-forum/issues) • [💬 Discussions](https://github.com/FakeErrorX/errorx-forum/discussions)

</div>

---

<div align="center">

**Built with ❤️ by [ErrorX](https://github.com/FakeErrorX)**

[![GitHub](https://img.shields.io/badge/GitHub-FakeErrorX-181717?style=for-the-badge&logo=github)](https://github.com/FakeErrorX)
[![Twitter](https://img.shields.io/badge/Twitter-@FakeErrorX-1DA1F2?style=for-the-badge&logo=twitter)](https://twitter.com/FakeErrorX)

</div>