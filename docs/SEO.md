# SEO Configuration

This document outlines the SEO setup and configuration for the ErrorX Forum project.

## Installed Packages

- **next-seo**: Provides React components for SEO optimization
- **next-sitemap**: Automatically generates sitemap.xml and robots.txt
- **@next/bundle-analyzer**: Helps analyze bundle size for performance optimization

## Configuration Files

### 1. SEO Configuration (`lib/seo.ts`)
Contains centralized SEO settings including:
- Default metadata
- Open Graph configuration
- Twitter Card settings
- Helper functions for generating page-specific SEO

### 2. Sitemap Configuration (`next-sitemap.config.js`)
Configures automatic sitemap generation with:
- Site URL configuration
- Excluded pages (admin, API routes, auth pages)
- Custom priority and changefreq settings
- Robots.txt generation

### 3. Layout SEO (`app/layout.tsx`)
Root layout with comprehensive metadata including:
- Title templates
- Open Graph tags
- Twitter Card tags
- Robots directives
- Verification codes

## Usage

### Page-Level SEO
Use the `PageSEO` component for individual pages:

```tsx
import { PageSEO } from '@/components/seo/page-seo';

export default function MyPage() {
  return (
    <>
      <PageSEO
        title="Page Title"
        description="Page description"
        path="/my-page"
      />
      {/* Page content */}
    </>
  );
}
```

### Post-Level SEO
Use the `PostSEO` component for blog posts or forum posts:

```tsx
import { PostSEO } from '@/components/seo/page-seo';

export default function PostPage() {
  return (
    <>
      <PostSEO
        title="Post Title"
        description="Post description"
        author="Author Name"
        publishedTime="2024-01-01T00:00:00Z"
        path="/posts/my-post"
        tags={['tag1', 'tag2']}
      />
      {/* Post content */}
    </>
  );
}
```

### Structured Data
Use structured data components for rich snippets:

```tsx
import { OrganizationSchema, WebsiteSchema, BreadcrumbSchema } from '@/components/seo/structured-data';

export default function HomePage() {
  return (
    <>
      <OrganizationSchema />
      <WebsiteSchema />
      <BreadcrumbSchema 
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Category', url: '/category' }
        ]} 
      />
      {/* Page content */}
    </>
  );
}
```

## Build Process

The sitemap is automatically generated after each build:

```bash
npm run build
# This will run next-sitemap automatically via postbuild script
```

## Environment Variables

Set the following environment variable for production:

```env
SITE_URL=https://errorx.org
```

## Social Media Configuration

The following social media accounts are configured for SEO and structured data:

- **Twitter**: [@FakeErrorX](https://twitter.com/FakeErrorX)
- **GitHub**: [FakeErrorX](https://github.com/FakeErrorX)
- **Telegram**: [@ErrorX_BD](https://t.me/ErrorX_BD)
- **Facebook**: [ErrorX.GG](https://facebook.com/ErrorX.GG)

These handles are used in:
- Open Graph meta tags
- Twitter Card meta tags
- Structured data schemas
- Social media sharing

## SEO Checklist

- [x] Meta titles and descriptions
- [x] Open Graph tags
- [x] Twitter Card tags
- [x] Structured data (Organization, Website, Breadcrumbs)
- [x] Sitemap.xml generation
- [x] Robots.txt configuration
- [x] Canonical URLs
- [x] Mobile-friendly viewport
- [x] Performance optimization hints

## Monitoring

Consider adding these tools for SEO monitoring:
- Google Search Console
- Google Analytics 4
- PageSpeed Insights
- Lighthouse audits

## Notes

- Remember to replace `your-google-verification-code` in `app/layout.tsx` with your actual Google Search Console verification code
- Social media handles are configured as:
  - Twitter: @FakeErrorX
  - GitHub: FakeErrorX
  - Telegram: @ErrorX_BD
  - Facebook: ErrorX.GG
- Test your sitemap at `https://errorx.org/sitemap.xml` after deployment
