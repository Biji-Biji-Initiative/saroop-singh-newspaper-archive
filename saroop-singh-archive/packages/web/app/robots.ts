import type { MetadataRoute } from 'next';
import { absoluteSiteUrl } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/studio', '/premiere', '/memory-receipt/', '/contribution-receipt/', '/api/studio/', '/api/contribute', '/api/contributions', '/api/memories', '/api/restore'] },
    sitemap: absoluteSiteUrl('/sitemap.xml'),
  };
}
