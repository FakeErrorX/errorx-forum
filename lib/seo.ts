import { DefaultSeoProps } from 'next-seo';

// Validate required environment variables
const requiredSeoEnvVars = {
  SITE_URL: process.env.SITE_URL,
  SITE_NAME: process.env.SITE_NAME,
  SITE_DESCRIPTION: process.env.SITE_DESCRIPTION,
  TWITTER_HANDLE: process.env.TWITTER_HANDLE,
  TWITTER_SITE: process.env.TWITTER_SITE,
};

for (const [key, value] of Object.entries(requiredSeoEnvVars)) {
  if (!value) {
    throw new Error(`Missing required environment variable for SEO: ${key}`);
  }
}

export const defaultSEO: DefaultSeoProps = {
  titleTemplate: `%s | ${process.env.SITE_NAME!}`,
  defaultTitle: process.env.SITE_NAME!,
  description: process.env.SITE_DESCRIPTION!,
  canonical: process.env.SITE_URL!,
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.SITE_URL!,
    siteName: process.env.SITE_NAME!,
    title: `${process.env.SITE_NAME!} - Community`,
    description: process.env.SITE_DESCRIPTION!,
    images: [
      {
        url: `${process.env.SITE_URL!}/logo-light.png`,
        width: 1200,
        height: 630,
        alt: `${process.env.SITE_NAME!} Logo`,
      },
    ],
  },
  twitter: {
    handle: process.env.TWITTER_HANDLE!,
    site: process.env.TWITTER_SITE!,
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
  const baseUrl = process.env.SITE_URL!;
  const url = path ? `${baseUrl}${path}` : baseUrl;
  
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
  const baseUrl = process.env.SITE_URL!;
  const url = `${baseUrl}${path}`;
  
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
