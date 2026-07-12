import { getAllArticles } from "@/lib/articles";

export function personSlug(name: string) {
  return name.replace(/^(?:mr|mrs|miss|madam)\.?\s+/i, "").toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function getPeopleIndex() {
  const articles = await getAllArticles();
  const map = new Map<string, { slug: string; name: string; articles: typeof articles }>();
  for (const article of articles) for (const name of article.people || []) {
    const slug = personSlug(name); const existing = map.get(slug);
    if (existing) {
      if (!existing.articles.some(item => item.slug === article.slug)) existing.articles.push(article);
    } else map.set(slug, { slug, name, articles: [article] });
  }
  return [...map.values()].sort((a, b) => b.articles.length - a.articles.length || a.name.localeCompare(b.name));
}

export async function getPerson(slug: string) {
  return (await getPeopleIndex()).find(person => person.slug === slug) || null;
}
