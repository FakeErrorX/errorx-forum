import { NextSeo, NextSeoProps } from 'next-seo';
import { generatePageSEO, generatePostSEO } from '@/lib/seo';

interface PageSEOProps {
  title: string;
  description?: string;
  path?: string;
  noindex?: boolean;
  nofollow?: boolean;
  canonical?: string;
  openGraph?: {
    title?: string;
    description?: string;
    images?: Array<{
      url: string;
      width?: number;
      height?: number;
      alt?: string;
    }>;
  };
  twitter?: {
    title?: string;
    description?: string;
    images?: Array<{
      url: string;
      alt?: string;
    }>;
  };
}

export function PageSEO({
  title,
  description,
  path,
  noindex = false,
  nofollow = false,
  canonical,
  openGraph,
  twitter,
}: PageSEOProps) {
  const seoConfig = generatePageSEO(title, description, path);

  const seoProps: NextSeoProps = {
    ...seoConfig,
    noindex,
    nofollow,
    canonical: canonical || seoConfig.canonical,
    openGraph: {
      ...seoConfig.openGraph,
      ...openGraph,
    },
    twitter: {
      ...seoConfig.twitter,
      ...twitter,
    },
  };

  return <NextSeo {...seoProps} />;
}

interface PostSEOProps {
  title: string;
  description: string;
  author: string;
  publishedTime: string;
  path: string;
  modifiedTime?: string;
  tags?: string[];
  noindex?: boolean;
  nofollow?: boolean;
}

export function PostSEO({
  title,
  description,
  author,
  publishedTime,
  path,
  modifiedTime,
  tags,
  noindex = false,
  nofollow = false,
}: PostSEOProps) {
  const seoConfig = generatePostSEO(title, description, author, publishedTime, path);

  const seoProps: NextSeoProps = {
    ...seoConfig,
    noindex,
    nofollow,
    openGraph: {
      ...seoConfig.openGraph,
      article: {
        ...seoConfig.openGraph?.article,
        modifiedTime,
        tags,
      },
    },
  };

  return <NextSeo {...seoProps} />;
}
