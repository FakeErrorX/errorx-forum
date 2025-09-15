// Structured data components for SEO

interface StructuredDataProps {
  type?: 'organization' | 'website' | 'breadcrumb';
  breadcrumbs?: Array<{
    name: string;
    url: string;
  }>;
}

export function StructuredData({ type = 'organization', breadcrumbs }: StructuredDataProps) {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'ErrorX Forum',
    url: 'https://errorx.org',
    logo: 'https://errorx.org/logo-light.png',
    description: 'Share methods, resources, tips, tricks, earning methods, cracking, modding, and more. Join our community of developers and tech enthusiasts.',
    sameAs: [
      'https://twitter.com/FakeErrorX',
      'https://github.com/FakeErrorX',
      'https://t.me/ErrorX_BD',
      'https://facebook.com/ErrorX.GG',
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
    name: 'ErrorX Forum',
    url: 'https://errorx.org',
    description: 'Share methods, resources, tips, tricks, earning methods, cracking, modding, and more. Join our community of developers and tech enthusiasts.',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://errorx.org/search?q={search_term_string}',
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
