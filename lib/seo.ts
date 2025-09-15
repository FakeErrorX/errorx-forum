import { DefaultSeoProps } from 'next-seo';

export const defaultSEO: DefaultSeoProps = {
  titleTemplate: '%s | ErrorX Forum',
  defaultTitle: 'ErrorX Forum',
  description: 'Share methods, resources, tips, tricks, earning methods, cracking, modding, and more. Join our community of developers and tech enthusiasts.',
  canonical: 'https://errorx.org',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://errorx.org',
    siteName: 'ErrorX Forum',
    title: 'ErrorX Forum - Community',
    description: 'Share methods, resources, tips, tricks, earning methods, cracking, modding, and more. Join our community of developers and tech enthusiasts.',
    images: [
      {
        url: 'https://errorx.org/logo-light.png',
        width: 1200,
        height: 630,
        alt: 'ErrorX Forum Logo',
      },
    ],
  },
  twitter: {
    handle: '@FakeErrorX',
    site: '@FakeErrorX',
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
  const url = path ? `https://errorx.org${path}` : 'https://errorx.org';
  
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
  const url = `https://errorx.org${path}`;
  
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
