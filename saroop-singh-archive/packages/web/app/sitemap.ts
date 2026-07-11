import type { MetadataRoute } from 'next';
import { getAllArticles } from '@/lib/articles';
import { getLegacyCollections } from '@/lib/legacy-gallery';
import { getPeopleIndex } from '@/lib/people';
import { SITE_ORIGIN as origin } from '@/lib/site';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [articles, people] = await Promise.all([getAllArticles(), getPeopleIndex()]);
  const staticRoutes = ['', '/story', '/family-day', '/articles', '/timeline', '/people', '/gallery', '/mysteries', '/remember', '/contribute', '/methodology', '/about', '/privacy'];
  return [
    ...staticRoutes.map(path => ({ url: `${origin}${path}`, changeFrequency: path === '' ? 'weekly' as const : 'monthly' as const, priority: path === '' ? 1 : 0.7 })),
    ...articles.map(article => ({ url: `${origin}/articles/${article.slug}`, lastModified: article.date || undefined, changeFrequency: 'yearly' as const, priority: 0.6 })),
    ...people.filter(person => person.slug === 'saroop-singh' || person.articles.length >= 2).map(person => ({ url: `${origin}/people/${person.slug}`, changeFrequency: 'monthly' as const, priority: person.slug === 'saroop-singh' ? 0.9 : 0.5 })),
    ...getLegacyCollections().map(collection => ({ url: `${origin}/gallery/${collection.id}`, changeFrequency: 'monthly' as const, priority: 0.7 })),
  ];
}
