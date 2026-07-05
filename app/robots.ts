import type { MetadataRoute } from 'next';
import { APP_URL } from '@/lib/seo';

// Public crawl policy. Private/app-internal areas are disallowed; published
// tenant sites (/s and subdomains) stay crawlable.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard', '/studio', '/api/', '/builder-preview', '/d/', '/vitals'],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
    host: APP_URL,
  };
}
