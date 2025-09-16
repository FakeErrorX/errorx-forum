# 🚀 Deployment Guide

Complete guide for deploying ErrorX Forum to production.

## 📋 Prerequisites

Before deploying, ensure you have:

- **Domain name** and DNS access
- **PostgreSQL database** (managed or self-hosted)
- **Cloudflare R2** account for file storage
- **SMTP email service** (Gmail, SendGrid, etc.)
- **SSL certificate** (Let's Encrypt or commercial)
- **Server/VPS** or cloud platform account

---

## 🌐 Deployment Platforms

### **Vercel (Recommended)**

Vercel is the easiest way to deploy Next.js applications.

#### **1. Prepare Repository**

1. **Push code** to GitHub repository
2. **Set up environment variables** in Vercel dashboard
3. **Configure domain** in Vercel settings

#### **2. Environment Variables**

Set these in Vercel dashboard:

```env
# Database
DATABASE_URL="postgresql://username:password@host:port/database"

# NextAuth.js
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="your-secret-key"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Site Configuration
SITE_URL="https://yourdomain.com"
SITE_NAME="ErrorX Forum"
SITE_DESCRIPTION="Your forum description"

# Social Media URLs
TWITTER_HANDLE="@YourHandle"
TWITTER_SITE="@YourHandle"
TWITTER_URL="https://twitter.com/YourHandle"
GITHUB_URL="https://github.com/YourUsername"
TELEGRAM_URL="https://t.me/YourChannel"
FACEBOOK_URL="https://facebook.com/YourPage"

# Cloudflare R2
S3_REGION="auto"
S3_ENDPOINT="https://your-account-id.r2.cloudflarestorage.com"
S3_ACCESS_KEY="your-access-key"
S3_SECRET_KEY="your-secret-key"
S3_BUCKET_NAME="your-bucket-name"
S3_BUCKET_URL="https://your-custom-domain.com"

# API Security
ALLOWED_ORIGINS="https://yourdomain.com,https://www.yourdomain.com"

# Email Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="Your Forum <noreply@yourdomain.com>"
```

#### **3. Deploy**

1. **Connect** your GitHub repository to Vercel
2. **Import** the project
3. **Configure** environment variables
4. **Deploy** automatically

**🎉 Your forum will be live at `https://your-project.vercel.app`**

---

### **Railway**

Railway provides easy deployment with built-in PostgreSQL.

#### **1. Deploy to Railway**

1. **Connect** your GitHub repository
2. **Add PostgreSQL** service
3. **Set environment variables**
4. **Deploy** automatically

#### **2. Environment Variables**

Set these in Railway dashboard:

```env
# Database (auto-configured by Railway)
DATABASE_URL="postgresql://..."

# Other variables same as Vercel
NEXTAUTH_URL="https://your-project.railway.app"
# ... rest of the variables
```

---

### **DigitalOcean App Platform**

#### **1. Create App**

1. **Connect** your GitHub repository
2. **Select** Next.js as the framework
3. **Add PostgreSQL** database
4. **Configure** environment variables

#### **2. Environment Variables**

Same as Vercel, but update URLs:

```env
NEXTAUTH_URL="https://your-app.ondigitalocean.app"
SITE_URL="https://your-app.ondigitalocean.app"
```

---

### **AWS Amplify**

#### **1. Deploy to Amplify**

1. **Connect** your GitHub repository
2. **Configure** build settings
3. **Set environment variables**
4. **Deploy** automatically

#### **2. Build Settings**

Create `amplify.yml`:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm install
        - npx prisma generate
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
      - .next/cache/**/*
```

---

## 🗄️ Database Setup

### **PostgreSQL Configuration**

#### **1. Create Database**

```sql
CREATE DATABASE errorx_forum;
CREATE USER errorx_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE errorx_forum TO errorx_user;
```

#### **2. Run Migrations**

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# (Optional) Seed the database
npx prisma db seed
```

#### **3. Database Indexes**

Create these indexes for better performance:

```sql
-- Posts table indexes
CREATE INDEX idx_posts_category_id ON posts(category_id);
CREATE INDEX idx_posts_author_id ON posts(author_id);
CREATE INDEX idx_posts_created_at ON posts(created_at);
CREATE INDEX idx_posts_is_pinned ON posts(is_pinned);

-- Comments table indexes
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_author_id ON comments(author_id);
CREATE INDEX idx_comments_created_at ON comments(created_at);

-- Users table indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
```

---

## ☁️ File Storage Setup

### **Cloudflare R2 Configuration**

#### **1. Create R2 Bucket**

1. **Log in** to Cloudflare dashboard
2. **Go to** R2 Object Storage
3. **Create** a new bucket
4. **Configure** public access

#### **2. Set Up Custom Domain**

1. **Add** custom domain in R2 settings
2. **Configure** DNS records
3. **Update** environment variables

#### **3. CORS Configuration**

Set up CORS for your bucket:

```json
[
  {
    "AllowedOrigins": ["https://yourdomain.com"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]
```

---

## 📧 Email Configuration

### **Gmail SMTP**

#### **1. Enable 2FA**

1. **Enable** 2-factor authentication
2. **Generate** app password
3. **Use** app password in SMTP configuration

#### **2. Environment Variables**

```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="Your Forum <noreply@yourdomain.com>"
```

### **SendGrid**

#### **1. Create API Key**

1. **Sign up** for SendGrid
2. **Create** API key
3. **Verify** sender identity

#### **2. Environment Variables**

```env
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="apikey"
SMTP_PASS="your-sendgrid-api-key"
SMTP_FROM="Your Forum <noreply@yourdomain.com>"
```

---

## 🔒 Security Configuration

### **SSL Certificate**

#### **Let's Encrypt (Free)**

```bash
# Install certbot
sudo apt install certbot

# Generate certificate
sudo certbot certonly --standalone -d yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

#### **Commercial SSL**

- **Cloudflare** (free SSL with proxy)
- **DigiCert** (commercial)
- **Comodo** (commercial)

### **Security Headers**

Add these headers to your server configuration:

```nginx
# Nginx configuration
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'self';" always;
```

---

## 📊 Monitoring & Analytics

### **Application Monitoring**

#### **Vercel Analytics**

```bash
npm install @vercel/analytics
```

```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

#### **Sentry Error Tracking**

```bash
npm install @sentry/nextjs
```

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
});
```

### **Database Monitoring**

#### **PostgreSQL Monitoring**

```sql
-- Check database size
SELECT pg_size_pretty(pg_database_size('errorx_forum'));

-- Check active connections
SELECT count(*) FROM pg_stat_activity WHERE datname = 'errorx_forum';

-- Check slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

---

## 🔧 Performance Optimization

### **Next.js Optimization**

#### **1. Enable Compression**

```typescript
// next.config.ts
const nextConfig = {
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
};
```

#### **2. Image Optimization**

```typescript
// next.config.ts
const nextConfig = {
  images: {
    domains: ['cdn.errorx.org'],
    formats: ['image/webp', 'image/avif'],
  },
};
```

#### **3. Bundle Analysis**

```bash
npm install --save-dev @next/bundle-analyzer
```

```typescript
// next.config.ts
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer(nextConfig);
```

### **Database Optimization**

#### **1. Connection Pooling**

```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: ['query'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

#### **2. Query Optimization**

```typescript
// Optimized post query
const posts = await prisma.post.findMany({
  select: {
    id: true,
    title: true,
    content: true,
    createdAt: true,
    author: {
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
      },
    },
    category: {
      select: {
        id: true,
        name: true,
      },
    },
    _count: {
      select: {
        comments: true,
      },
    },
  },
  orderBy: {
    createdAt: 'desc',
  },
  take: 25,
  skip: 0,
});
```

---

## 🚀 Production Checklist

### **Pre-Deployment**

- [ ] **Environment variables** configured
- [ ] **Database** set up and migrated
- [ ] **File storage** configured
- [ ] **Email service** configured
- [ ] **SSL certificate** installed
- [ ] **Domain** configured
- [ ] **Monitoring** set up
- [ ] **Backup strategy** implemented

### **Post-Deployment**

- [ ] **Test** all functionality
- [ ] **Verify** email sending
- [ ] **Check** file uploads
- [ ] **Monitor** performance
- [ ] **Set up** alerts
- [ ] **Document** deployment process

---

## 🔄 Backup Strategy

### **Database Backups**

#### **Automated Backups**

```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL > backup_$DATE.sql
aws s3 cp backup_$DATE.sql s3://your-backup-bucket/
```

#### **Cron Job**

```bash
# Add to crontab
0 2 * * * /path/to/backup.sh
```

### **File Backups**

R2 automatically provides redundancy, but consider:

- **Cross-region replication**
- **Versioning** enabled
- **Lifecycle policies** for old files

---

## 🆘 Troubleshooting

### **Common Issues**

#### **Database Connection Issues**

```bash
# Check database connectivity
npx prisma db push

# Check connection string
echo $DATABASE_URL
```

#### **File Upload Issues**

```bash
# Check R2 configuration
curl -X GET "https://your-account-id.r2.cloudflarestorage.com/your-bucket"
```

#### **Email Issues**

```bash
# Test SMTP connection
node -e "
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});
transporter.verify(console.log);
"
```

### **Performance Issues**

#### **Slow Queries**

```sql
-- Enable query logging
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_min_duration_statement = 1000;
SELECT pg_reload_conf();
```

#### **Memory Issues**

```bash
# Check memory usage
free -h
ps aux --sort=-%mem | head
```

---

## 📞 Support

Need help with deployment?

- **GitHub Issues** - [Report deployment issues](https://github.com/FakeErrorX/errorx-forum/issues)
- **GitHub Discussions** - [Ask deployment questions](https://github.com/FakeErrorX/errorx-forum/discussions)
- **Email** - [Contact support](mailto:support@errorx.org)

---

<div align="center">

**Deployment Guide for ErrorX Forum**

[![GitHub](https://img.shields.io/badge/GitHub-FakeErrorX-181717?style=for-the-badge&logo=github)](https://github.com/FakeErrorX)
[![Twitter](https://img.shields.io/badge/Twitter-@FakeErrorX-1DA1F2?style=for-the-badge&logo=twitter)](https://twitter.com/FakeErrorX)

</div>
