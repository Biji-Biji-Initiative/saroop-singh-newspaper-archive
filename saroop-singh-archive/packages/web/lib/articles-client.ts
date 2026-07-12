import type { Article } from '../types';

export async function getAllArticles(): Promise<Article[]> {
  const response = await fetch('/api/articles');
  if (!response.ok) {
    throw new Error('Failed to fetch articles');
  }
  return await response.json();
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  try {
    const response = await fetch(`/api/articles/${slug}`);

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error('Failed to fetch article');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching article:', error);
    return null;
  }
}

export async function searchArticles(query: string): Promise<Article[]> {
  const allArticles = await getAllArticles();
  const searchTerm = query.toLowerCase();

  return allArticles.filter(article =>
    article.title.toLowerCase().includes(searchTerm) ||
    article.content.toLowerCase().includes(searchTerm) ||
    (article.publication && article.publication.toLowerCase().includes(searchTerm)) ||
    (article.tags && article.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
  );
}

export async function getArticlesByDateRange(startDate: string, endDate: string): Promise<Article[]> {
  const allArticles = await getAllArticles();
  const start = new Date(startDate);
  const end = new Date(endDate);

  return allArticles.filter(article => {
    if (!article.date) return false;
    const articleDate = new Date(article.date);
    return articleDate >= start && articleDate <= end;
  });
}

export async function getArticlesByTag(tag: string): Promise<Article[]> {
  const allArticles = await getAllArticles();
  return allArticles.filter(article =>
    article.tags && article.tags.includes(tag)
  );
}

export async function getArticlesByNewspaper(newspaper: string): Promise<Article[]> {
  const allArticles = await getAllArticles();
  return allArticles.filter(article =>
    article.publication && article.publication.toLowerCase() === newspaper.toLowerCase()
  );
}

export async function getFeaturedArticles(limit: number = 6): Promise<Article[]> {
  const allArticles = await getAllArticles();
  // Return articles that have image or are particularly interesting
  return allArticles
    .filter(article => article.image || (article.tags && article.tags.includes('featured')))
    .slice(0, limit);
}
