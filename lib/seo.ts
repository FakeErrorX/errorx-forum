import { DefaultSeoProps } from 'next-seo';
import { PUBLIC_ENV } from './public-env';

// Use client-safe public envs without throwing at module load
const SITE_URL = PUBLIC_ENV.SITE_URL;
const SITE_NAME = PUBLIC_ENV.SITE_NAME;
const SITE_DESCRIPTION = PUBLIC_ENV.SITE_DESCRIPTION;
const TWITTER_HANDLE = PUBLIC_ENV.TWITTER_HANDLE;
const TWITTER_SITE = PUBLIC_ENV.TWITTER_SITE;

export const defaultSEO: DefaultSeoProps = {
  titleTemplate: `%s | ${SITE_NAME}`,
  defaultTitle: SITE_NAME,
  description: SITE_DESCRIPTION,
  canonical: SITE_URL || undefined,
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_URL || undefined,
    siteName: SITE_NAME,
    title: `${SITE_NAME} - Community`,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: SITE_URL ? `${SITE_URL}/logo-light.png` : '/logo-light.png',
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} Logo`,
      },
    ],
  },
  twitter: {
    handle: TWITTER_HANDLE || undefined,
    site: TWITTER_SITE || undefined,
    cardType: 'summary_large_image',
  },
  additionalMetaTags: [
    {
      name: 'viewport',
      content: 'width=device-width, initial-scale=1',
    },
    {
      name: 'theme-color',
      content: '#000000',
    },
    {
      name: 'robots',
      content: 'index, follow',
    },
    {
      name: 'author',
      content: 'ErrorX Forum',
    },
    {
      name: 'keywords',
      content: 'forum, community, developers, programming, tech, resources, tips, tricks, earning methods, cracking, modding',
    },
  ],
  additionalLinkTags: [
    {
      rel: 'icon',
      href: '/favicon.ico',
    },
    {
      rel: 'apple-touch-icon',
      href: '/logo-light.png',
      sizes: '180x180',
    },
  ],
};

export const generatePageSEO = (title: string, description?: string, path?: string) => {
  const baseUrl = SITE_URL;
  const url = baseUrl && path ? `${baseUrl}${path}` : baseUrl || undefined;
  
  return {
    title,
    description: description || defaultSEO.description,
    canonical: url,
    openGraph: {
      title,
      description: description || defaultSEO.description,
      url,
      type: 'website',
      images: defaultSEO.openGraph?.images,
    },
    twitter: {
      ...defaultSEO.twitter,
      title,
      description: description || defaultSEO.description,
    },
  };
};

export const generatePostSEO = (title: string, description: string, author: string, publishedTime: string, path: string) => {
  const baseUrl = SITE_URL;
  const url = baseUrl ? `${baseUrl}${path}` : undefined;
  
  return {
    title,
    description,
    canonical: url,
    openGraph: {
      title,
      description,
      url,
      type: 'article',
      article: {
        publishedTime,
        authors: [author],
        tags: ['forum', 'community', 'tech'],
      },
      images: defaultSEO.openGraph?.images,
    },
    twitter: {
      ...defaultSEO.twitter,
      title,
      description,
    },
  };
};
