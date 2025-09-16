// Structured data components for SEO

interface StructuredDataProps {
  type?: 'organization' | 'website' | 'breadcrumb';
  breadcrumbs?: Array<{
    name: string;
    url: string;
  }>;
}

export function StructuredData({ type = 'organization', breadcrumbs }: StructuredDataProps) {
  // Validate required environment variables
  const requiredEnvVars = {
    SITE_URL: process.env.SITE_URL,
    SITE_NAME: process.env.SITE_NAME,
    SITE_DESCRIPTION: process.env.SITE_DESCRIPTION,
    TWITTER_URL: process.env.TWITTER_URL,
    GITHUB_URL: process.env.GITHUB_URL,
    TELEGRAM_URL: process.env.TELEGRAM_URL,
    FACEBOOK_URL: process.env.FACEBOOK_URL,
  };

  for (const [key, value] of Object.entries(requiredEnvVars)) {
    if (!value) {
      throw new Error(`Missing required environment variable for structured data: ${key}`);
    }
  }

  const baseUrl = process.env.SITE_URL!;
  const siteName = process.env.SITE_NAME!;
  const siteDescription = process.env.SITE_DESCRIPTION!;
  
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteName,
    url: baseUrl,
    logo: `${baseUrl}/logo-light.png`,
    description: siteDescription,
    sameAs: [
      process.env.TWITTER_URL!,
      process.env.GITHUB_URL!,
      process.env.TELEGRAM_URL!,
      process.env.FACEBOOK_URL!,
    ],
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
