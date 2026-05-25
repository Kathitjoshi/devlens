import { Article } from '@/lib/types';
import { sanitizeQuery } from '@/lib/utils/sanitize';

/**
 * Fetch articles from DEV.to API with pagination
 */
export async function fetchDevToArticles(query: string, page: number = 1): Promise<Article[]> {
  const sanitized = sanitizeQuery(query);
  if (!sanitized) return [];

  try {
    // DEV.to API supports per_page up to 1000
    const response = await fetch(
      `https://dev.to/api/articles/search?query=${encodeURIComponent(sanitized)}&per_page=100&page=${page}`,
      { 
        next: { revalidate: 86400 }, // 24 hours
        headers: { 'Accept': 'application/vnd.forem.api-v1+json' }
      }
    );

    if (!response.ok) return [];

    const data = await response.json();

    return (data || []).map((article: any) => ({
      id: `devto-${article.id}`,
      title: article.title,
      url: article.url,
      source: 'devto' as const,
      author: article.user?.name,
      description: article.description || article.body_markdown?.substring(0, 200),
      image: article.cover_image,
      publishedAt: article.published_at,
      score: article.positive_reactions_count || 0,
    }));
  } catch (error) {
    console.error('Error fetching DEV.to articles:', error);
    return [];
  }
}

/**
 * Fetch articles from Hacker News via Algolia API
 */
export async function fetchHNArticles(query: string, page: number = 0): Promise<Article[]> {
  const sanitized = sanitizeQuery(query);
  if (!sanitized) return [];

  try {
    // Calculate 1 year ago for fresher results
    const oneYearAgo = Math.floor((Date.now() - 365 * 24 * 60 * 60 * 1000) / 1000);
    
    // HN Algolia API supports hitsPerPage up to 1000
    const response = await fetch(
      `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(sanitized)}&hitsPerPage=100&page=${page}&numericFilters=created_at_i>${oneYearAgo}`,
      { 
        next: { revalidate: 86400 }, // 24 hours
      }
    );

    if (!response.ok) return [];

    const data = await response.json();

    return (data.hits || []).map((item: any) => {
      let publishedAt = '';
      if (item.created_at) {
        try {
          const timestamp = typeof item.created_at === 'string' ? parseInt(item.created_at, 10) : item.created_at;
          if (!isNaN(timestamp)) {
            publishedAt = new Date(timestamp * 1000).toISOString();
          }
        } catch (e) {
          // If date parsing fails, use empty string
        }
      }
      return {
        id: `hn-${item.objectID}`,
        title: item.title || item.story_title || 'Untitled',
        url: item.url || `https://news.ycombinator.com/item?id=${item.objectID}`,
        source: 'hn' as const,
        author: item.author,
        description: item.story_text || item.comment_text || '',
        publishedAt,
        score: item.points || 0,
      };
    });
  } catch (error) {
    console.error('Error fetching HN articles:', error);
    return [];
  }
}

/**
 * Fetch articles from both sources with pagination
 */
export async function fetchAllArticles(query: string): Promise<Article[]> {
  try {
    // Fetch from both sources in parallel with multiple pages
    const [devtoPage1, devtoPage2, hnPage1, hnPage2] = await Promise.all([
      fetchDevToArticles(query, 1),
      fetchDevToArticles(query, 2),
      fetchHNArticles(query, 0),
      fetchHNArticles(query, 1),
    ]);

    // Combine all results (up to 400 articles)
    const combined = [...devtoPage1, ...devtoPage2, ...hnPage1, ...hnPage2];
    
    // Remove duplicates by URL
    const seen = new Set<string>();
    const unique = combined.filter((article) => {
      if (seen.has(article.url)) return false;
      seen.add(article.url);
      return true;
    });

    // Sort by score
    return unique.sort((a, b) => (b.score || 0) - (a.score || 0));
  } catch (error) {
    console.error('Error fetching articles:', error);
    return [];
  }
}

/**
 * Fetch trending articles from both sources
 */
export async function fetchTrendingArticles(timeframe: 'today' | 'week' | 'month' = 'today'): Promise<Article[]> {
  try {
    const queries = {
      today: 'trending',
      week: 'popular',
      month: 'best',
    };

    const [devtoArticles, hnArticles] = await Promise.all([
      fetchDevToArticles(queries[timeframe], 1),
      fetchHNArticles(queries[timeframe], 0),
    ]);

    // Combine and sort by score
    const combined = [...devtoArticles, ...hnArticles];
    
    // Remove duplicates
    const seen = new Set<string>();
    const unique = combined.filter((article) => {
      if (seen.has(article.url)) return false;
      seen.add(article.url);
      return true;
    });

    return unique.sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 100);
  } catch (error) {
    console.error('Error fetching trending articles:', error);
    return [];
  }
}

/**
 * Fetch articles by topic/tag from both sources
 */
export async function fetchArticlesByTopic(topic: string): Promise<Article[]> {
  try {
    // Use the same search as fetchAllArticles but for topic pages
    // This ensures consistency and proper filtering
    const articles = await fetchAllArticles(topic);
    
    // Sort by date (newest first) for topic pages
    return articles.sort((a, b) => {
      if (a.publishedAt && b.publishedAt) {
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      }
      return (b.score || 0) - (a.score || 0);
    });
  } catch (error) {
    console.error('Error fetching topic articles:', error);
    return [];
  }
}
