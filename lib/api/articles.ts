import { Article } from '@/lib/types';
import { sanitizeQuery } from '@/lib/utils/sanitize';

/**
 * Fetch articles from Hashnode API (more reliable than DEV.to)
 * Hashnode has better search and filtering capabilities
 */
export async function fetchHashnodeArticles(query: string, page: number = 0): Promise<Article[]> {
  const sanitized = sanitizeQuery(query);
  if (!sanitized) return [];

  try {
    const response = await fetch(
      `https://hashnode.com/api/v1/articles?query=${encodeURIComponent(sanitized)}&limit=20&page=${page}`,
      { 
        headers: { 'Content-Type': 'application/json' }
      }
    );

    if (!response.ok) return [];

    const data = await response.json();
    const articles = data.articles || data || [];

    return articles.map((article: any): Article => ({
      id: `hashnode-${article.id || article.slug}`,
      title: article.title,
      url: article.url || article.canonicalUrl || `https://hashnode.com/@${article.author?.username}/${article.slug}`,
      source: 'hashnode' as const,
      author: article.author?.name,
      description: article.subtitle || article.brief || '',
      image: article.coverImage?.url,
      publishedAt: article.publishedAt || article.dateAdded,
      score: article.reactionCount || article.likes || 0,
    })).filter((a: Article) => a.title && a.url);
  } catch (error) {
    console.error('Error fetching Hashnode articles:', error);
    return [];
  }
}

/**
 * Fetch articles from DEV.to using improved search
 * Falls back to generic popular articles if search fails
 */
export async function fetchDevToArticles(query: string, page: number = 1): Promise<Article[]> {
  const sanitized = sanitizeQuery(query);
  if (!sanitized) return [];

  try {
    // Try search API first
    const response = await fetch(
      `https://dev.to/api/articles/search?query=${encodeURIComponent(sanitized)}&per_page=20&page=${page}`,
      { 
        headers: { 'Accept': 'application/vnd.forem.api-v1+json' }
      }
    );

    if (!response.ok) return [];

    const data = await response.json();

    // Filter to only include articles that actually mention the query in title or description
    const filtered = (data || []).filter((article: any) => {
      const titleMatch = article.title?.toLowerCase().includes(sanitized.toLowerCase());
      const descMatch = article.description?.toLowerCase().includes(sanitized.toLowerCase());
      return titleMatch || descMatch;
    });

    return filtered.map((article: any) => ({
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
      { 
        next: { revalidate: 3600 }, // 1 hour cache
      }
    );

    if (!response.ok) return [];

    const data = await response.json();

    // Map HN results to Article format
    return (data.hits || []).map((item: any) => {
      let publishedAt = '';
      if (item.created_at_i) {
        try {
          // created_at_i is Unix timestamp in seconds
          const timestamp = item.created_at_i;
          if (!isNaN(timestamp) && timestamp > 0 && timestamp < Date.now() / 1000) {
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
 * Prioritizes Hashnode, then DEV.to, then HN
 */
export async function fetchAllArticles(query: string): Promise<Article[]> {
  try {
    // Fetch from all sources in parallel
    const [hashnodePage1, hashnodePage2, devtoPage1, hnPage1, hnPage2] = await Promise.all([
      fetchHashnodeArticles(query, 0),
      fetchHashnodeArticles(query, 1),
      fetchDevToArticles(query, 1),
      fetchHNArticles(query, 0),
      fetchHNArticles(query, 1),
    ]);

    // Combine all results: Hashnode first, then DEV.to, then HN
    const combined = [...hashnodePage1, ...hashnodePage2, ...devtoPage1, ...hnPage1, ...hnPage2];
    
    // Remove duplicates by URL
    const seen = new Set<string>();
    const unique = combined.filter((article) => {
      if (seen.has(article.url)) return false;
      seen.add(article.url);
      return true;
    });

    // Separate by source
    const hashnodeArticles = unique.filter(a => a.source === 'hashnode');
    const devtoArticles = unique.filter(a => a.source === 'devto');
    const hnArticles = unique.filter(a => a.source === 'hn');
    
    // Sort each source by score (highest first)
    const sortedHashnode = hashnodeArticles.sort((a, b) => (b.score || 0) - (a.score || 0));
    const sortedDevto = devtoArticles.sort((a, b) => (b.score || 0) - (a.score || 0));
    const sortedHn = hnArticles.sort((a, b) => (b.score || 0) - (a.score || 0));
    
    // Return in priority order: Hashnode, DEV.to, then HN
    return [...sortedHashnode, ...sortedDevto, ...sortedHn];
  } catch (error) {
    console.error('Error fetching articles:', error);
    return [];
  }
}

/**
 * Fetch trending articles from all sources
 */
export async function fetchTrendingArticles(timeframe: 'today' | 'week' | 'month' = 'today'): Promise<Article[]> {
  try {
    const queries = {
      today: 'trending',
      week: 'popular',
      month: 'best',
    };

    const [hashnodeArticles, devtoArticles, hnArticles] = await Promise.all([
      fetchHashnodeArticles(queries[timeframe], 0),
      fetchDevToArticles(queries[timeframe], 1),
      fetchHNArticles(queries[timeframe], 0),
    ]);

    // Combine: Hashnode first, then DEV.to, then HN
    const combined = [...hashnodeArticles, ...devtoArticles, ...hnArticles];
    
    // Remove duplicates
    const seen = new Set<string>();
    const unique = combined.filter((article) => {
      if (seen.has(article.url)) return false;
      seen.add(article.url);
      return true;
    });

    // Sort by source and score
    const sortedHashnode = unique.filter(a => a.source === 'hashnode').sort((a, b) => (b.score || 0) - (a.score || 0));
    const sortedDevto = unique.filter(a => a.source === 'devto').sort((a, b) => (b.score || 0) - (a.score || 0));
    const sortedHn = unique.filter(a => a.source === 'hn').sort((a, b) => (b.score || 0) - (a.score || 0));
    
    return [...sortedHashnode, ...sortedDevto, ...sortedHn].slice(0, 100);
  } catch (error) {
    console.error('Error fetching trending articles:', error);
    return [];
  }
}

/**
 * Fetch articles by topic/tag from all sources
 */
export async function fetchArticlesByTopic(topic: string): Promise<Article[]> {
  try {
    return await fetchAllArticles(topic);
  } catch (error) {
    console.error('Error fetching topic articles:', error);
    return [];
  }
}
