import { PUBLIC_ENV } from '@/lib/public-env';
// Structured data components for SEO

interface StructuredDataProps {
  type?: 'organization' | 'website' | 'breadcrumb';
  breadcrumbs?: Array<{
    name: string;
    url: string;
  }>;
}

export function StructuredData({ type = 'organization', breadcrumbs }: StructuredDataProps) {
  const baseUrl = PUBLIC_ENV.SITE_URL;
  const siteName = PUBLIC_ENV.SITE_NAME;
  const siteDescription = PUBLIC_ENV.SITE_DESCRIPTION;
  
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteName,
    url: baseUrl,
    logo: `${baseUrl}/logo-light.png`,
    description: siteDescription,
    sameAs: [
      PUBLIC_ENV.TWITTER_URL,
      PUBLIC_ENV.GITHUB_URL,
      PUBLIC_ENV.TELEGRAM_URL,
      PUBLIC_ENV.FACEBOOK_URL,
    ].filter(Boolean),
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      availableLanguage: 'English',
    },
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteName,
    url: baseUrl,
    description: siteDescription,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs?.map((breadcrumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: breadcrumb.name,
      item: breadcrumb.url,
    })) || [],
  };

  const getSchema = () => {
    switch (type) {
      case 'organization':
        return organizationSchema;
      case 'website':
        return websiteSchema;
      case 'breadcrumb':
        return breadcrumbSchema;
      default:
        return organizationSchema;
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(getSchema()),
      }}
    />
  );
}

export function OrganizationSchema() {
  return <StructuredData type="organization" />;
}

export function WebsiteSchema() {
  return <StructuredData type="website" />;
}

export function BreadcrumbSchema({ breadcrumbs }: { breadcrumbs: Array<{ name: string; url: string }> }) {
  return <StructuredData type="breadcrumb" breadcrumbs={breadcrumbs} />;
}
