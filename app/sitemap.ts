import type { MetadataRoute } from 'next';
import { APP_URL, subdomainUrl } from '@/lib/seo';
import { listPublishedSites } from '@/lib/sites';

export const dynamic = 'force-dynamic';

// Sitemap = public marketing routes + every published tenant site (by its
// canonical subdomain URL).
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${APP_URL}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${APP_URL}/login`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${APP_URL}/register`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${APP_URL}/themes`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${APP_URL}/presets`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
  ];

  let sites: MetadataRoute.Sitemap = [];
  try {
    sites = listPublishedSites().map((s) => ({
      url: subdomainUrl(s.slug),
      lastModified: s.publishedAt ?? s.updatedAt ?? now,
      changeFrequency: 'weekly',
      priority: 0.7,
    }));
  } catch {
    /* DB unavailable (e.g. during build) → marketing routes only */
  }

  return [...staticRoutes, ...sites];
}
