/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || 'https://errorx.org',
  generateRobotsTxt: true,
  generateIndexSitemap: false,
  exclude: ['/admin/*', '/api/*', '/settings', '/signin', '/signup', '/reset-password'],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/settings', '/signin', '/signup', '/reset-password'],
      },
    ],
    additionalSitemaps: [
      'https://errorx.org/sitemap.xml',
    ],
  },
  transform: async (config, path) => {
    // Custom transform for different page types
    const customConfig = {
      loc: path,
      changefreq: 'daily',
      priority: 0.7,
      lastmod: new Date().toISOString(),
    };

    // Homepage gets highest priority
    if (path === '/') {
      customConfig.priority = 1.0;
      customConfig.changefreq = 'daily';
    }

    // Profile pages get medium priority
    if (path.startsWith('/profile/')) {
      customConfig.priority = 0.8;
      customConfig.changefreq = 'weekly';
    }

    // Members page gets high priority
    if (path === '/members') {
      customConfig.priority = 0.9;
      customConfig.changefreq = 'daily';
    }

    return customConfig;
  },
};
