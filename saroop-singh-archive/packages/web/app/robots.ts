import type { MetadataRoute } from 'next';
import { absoluteSiteUrl } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/studio', '/premiere', '/memory-receipt/', '/api/studio/', '/api/contribute', '/api/memories', '/api/restore'] },
    sitemap: absoluteSiteUrl('/sitemap.xml'),
  };
}
