import { Article } from '@/lib/types';
import { sanitizeQuery } from '@/lib/utils/sanitize';

/**
 * Fetch articles from DEV.to API
 */
export async function fetchDevToArticles(query: string): Promise<Article[]> {
  const sanitized = sanitizeQuery(query);
  if (!sanitized) return [];

  try {
    const response = await fetch(
      `https://dev.to/api/articles?query=${encodeURIComponent(sanitized)}&per_page=20`,
      { next: { revalidate: 3600 } }
    );

    if (!response.ok) return [];

    const data = await response.json();

    return (data || []).map((article: any) => ({
      id: `devto-${article.id}`,
      title: article.title,
      url: article.url,
      source: 'devto' as const,
      author: article.user?.name,
      description: article.description,
      image: article.cover_image,
      publishedAt: article.published_at,
      score: article.positive_reactions_count,
    }));
  } catch (error) {
    console.error('Error fetching DEV.to articles:', error);
    return [];
  }
}

/**
 * Fetch articles from Hacker News via Algolia API
 */
export async function fetchHNArticles(query: string): Promise<Article[]> {
  const sanitized = sanitizeQuery(query);
  if (!sanitized) return [];

  try {
    const response = await fetch(
      `http://hn.algolia.com/api/v1/search?query=${encodeURIComponent(sanitized)}&hitsPerPage=20`,
      { next: { revalidate: 3600 } }
    );

    if (!response.ok) return [];

    const data = await response.json();

    return (data.hits || []).map((item: any) => ({
      id: `hn-${item.objectID}`,
      title: item.title || item.story_title,
      url: item.url || `https://news.ycombinator.com/item?id=${item.objectID}`,
      source: 'hn' as const,
      author: item.author,
      description: item.story_text,
      publishedAt: item.created_at,
      score: item.points,
    }));
  } catch (error) {
    console.error('Error fetching HN articles:', error);
    return [];
  }
}

/**
 * Fetch trending articles from both sources
 */
export async function fetchTrendingArticles(): Promise<Article[]> {
  try {
    const [devtoArticles, hnArticles] = await Promise.all([
      fetchDevToArticles('trending'),
      fetchHNArticles('popular'),
    ]);

    // Combine and sort by score
    const combined = [...devtoArticles, ...hnArticles];
    return combined.sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 30);
  } catch (error) {
    console.error('Error fetching trending articles:', error);
    return [];
  }
}
