import { Article } from '@/lib/types';
import { sanitizeQuery } from '@/lib/utils/sanitize';

/**
 * Fetch articles from Dev.to API using tag parameter
 * Dev.to API returns relevant articles when using tag parameter
 */
export async function fetchDevtoArticles(query: string): Promise<Article[]> {
  const sanitized = sanitizeQuery(query);
  if (!sanitized) return [];

  try {
    const response = await fetch(
      `https://dev.to/api/articles?tag=${encodeURIComponent(sanitized)}&per_page=50`,
      { cache: 'no-store' }
    );

    if (!response.ok) return [];

    const data = await response.json();

    // Map Dev.to API response to Article format
    return (data || []).map((item: any): Article => {
      return {
        id: `devto-${item.id}`,
        title: item.title || 'Untitled',
        url: item.url,
        source: 'devto' as const,
        author: item.user?.name || 'Dev.to User',
        description: item.description || item.body_markdown?.substring(0, 200) || '',
        publishedAt: item.published_at || item.created_at,
        score: item.positive_reactions_count || 0,
      };
    }).filter((a: Article) => a.title && a.url);
  } catch (error) {
    console.error('Error fetching Dev.to articles:', error);
    return [];
  }
}

/**
 * Fetch articles from Hacker News via Algolia API with 1-year date range
 */
export async function fetchHNArticles(query: string, page: number = 0): Promise<Article[]> {
  const sanitized = sanitizeQuery(query);
  if (!sanitized) return [];

  try {
    // Calculate 1 year ago for fresher results
    const oneYearAgo = Math.floor((Date.now() - 365 * 24 * 60 * 60 * 1000) / 1000);
    
    // HN Algolia API - search for query with date range filter
    const response = await fetch(
      `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(sanitized)}&hitsPerPage=100&page=${page}&numericFilters=created_at_i>${oneYearAgo}`,
      { cache: 'no-store' }
    );

    if (!response.ok) return [];

    const data = await response.json();

    // Map HN results to Article format
    return (data.hits || []).map((item: any): Article | null => {
      let publishedAt = '';
      if (item.created_at_i) {
        try {
          // created_at_i is Unix timestamp in seconds
          const timestamp = item.created_at_i;
          const now = Math.floor(Date.now() / 1000);
          
          // Validate timestamp is reasonable (between 1 year ago and now)
          if (!isNaN(timestamp) && timestamp > oneYearAgo && timestamp < now) {
            publishedAt = new Date(timestamp * 1000).toISOString();
          }
        } catch (e) {
          return null;
        }
      }
      
      // Only return if we have a valid date
      if (!publishedAt) return null;
      
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
    }).filter((a: Article | null): a is Article => a !== null);
  } catch (error) {
    console.error('Error fetching HN articles:', error);
    return [];
  }
}

/**
 * Fetch articles from both sources with pagination
 * Dev.to articles first (higher priority), HN articles at the end
 */
export async function fetchAllArticles(query: string): Promise<Article[]> {
  try {
    // Fetch from both sources in parallel with multiple pages
    const [devtoArticles, hnPage1, hnPage2] = await Promise.all([
      fetchDevtoArticles(query),
      fetchHNArticles(query, 0),
      fetchHNArticles(query, 1),
    ]);

    // Combine all results: Dev.to first, then HN
    const combined = [...devtoArticles, ...hnPage1, ...hnPage2];
    
    // Remove duplicates by URL
    const seen = new Set<string>();
    const unique = combined.filter((article) => {
      if (seen.has(article.url)) return false;
      seen.add(article.url);
      return true;
    });

    // Separate by source
    const devtoOnly = unique.filter(a => a.source === 'devto');
    const hnArticles = unique.filter(a => a.source === 'hn');
    
    // Sort each source by score (highest first)
    const sortedDevto = devtoOnly.sort((a, b) => (b.score || 0) - (a.score || 0));
    const sortedHn = hnArticles.sort((a, b) => (b.score || 0) - (a.score || 0));
    
    // Return Dev.to first, then HN
    return [...sortedDevto, ...sortedHn];
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
      fetchDevtoArticles(queries[timeframe]),
      fetchHNArticles(queries[timeframe], 0),
    ]);

    // Combine: Dev.to first, then HN
    const combined = [...devtoArticles, ...hnArticles];
    
    // Remove duplicates
    const seen = new Set<string>();
    const unique = combined.filter((article) => {
      if (seen.has(article.url)) return false;
      seen.add(article.url);
      return true;
    });

    // Sort by source and score
    const sortedDevto = unique.filter(a => a.source === 'devto').sort((a, b) => (b.score || 0) - (a.score || 0));
    const sortedHn = unique.filter(a => a.source === 'hn').sort((a, b) => (b.score || 0) - (a.score || 0));
    
    return [...sortedDevto, ...sortedHn].slice(0, 100);
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
    return await fetchAllArticles(topic);
  } catch (error) {
    console.error('Error fetching topic articles:', error);
    return [];
  }
}
// Force redeploy
