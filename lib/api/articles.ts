import { Article } from '@/lib/types';
import { sanitizeQuery } from '@/lib/utils/sanitize';

/**
 * Fetch articles from Medium RSS feed
 * Medium RSS uses CDATA sections, so we need special parsing
 */
export async function fetchMediumArticles(query: string): Promise<Article[]> {
  const sanitized = sanitizeQuery(query);
  if (!sanitized) return [];

  try {
    const response = await fetch(
      `https://medium.com/feed/tag/${encodeURIComponent(sanitized)}`,
      { 
        next: { revalidate: 3600 } // 1 hour cache
      }
    );

    if (!response.ok) return [];

    const data = await response.text();

    // Parse RSS XML to extract articles
    const articles: Article[] = [];
    
    // Regex to extract item elements
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let itemMatch;
    
    while ((itemMatch = itemRegex.exec(data)) && articles.length < 50) {
      const itemContent = itemMatch[1];
      
      // Extract title (inside CDATA)
      const titleMatch = itemContent.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/);
      const title = titleMatch ? titleMatch[1].trim() : null;
      
      // Extract link from description (Medium puts link in description HTML)
      let url = null;
      const linkMatch = itemContent.match(/<link>([\s\S]*?)<\/link>/);
      if (linkMatch) {
        url = linkMatch[1].trim();
      } else {
        // Try to extract from description
        const descLinkMatch = itemContent.match(/href="(https:\/\/[^"]+medium\.com[^"]+)"/);
        if (descLinkMatch) {
          url = descLinkMatch[1].split('?source=')[0]; // Remove source parameter
        }
      }
      
      // Extract description (inside CDATA)
      const descMatch = itemContent.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/);
      let description = '';
      if (descMatch) {
        // Extract text from HTML
        const htmlContent = descMatch[1];
        const textMatch = htmlContent.match(/<p class="medium-feed-snippet">([^<]+)<\/p>/);
        description = textMatch ? textMatch[1].trim() : '';
      }
      
      // Extract pub date
      const dateMatch = itemContent.match(/<pubDate>([^<]+)<\/pubDate>/);
      const publishedAt = dateMatch ? new Date(dateMatch[1]).toISOString() : new Date().toISOString();
      
      // Extract author (creator tag)
      const authorMatch = itemContent.match(/<creator><!\[CDATA\[([\s\S]*?)\]\]><\/creator>/);
      const author = authorMatch ? authorMatch[1].trim() : 'Medium';
      
      if (title && url) {
        articles.push({
          id: `medium-${url.split('/').pop()?.split('?')[0] || Math.random()}`,
          title: title.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>'),
          url,
          source: 'medium' as const,
          author,
          description: description.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>'),
          publishedAt,
          score: 0, // Medium RSS doesn't provide engagement metrics
        });
      }
    }
    
    return articles;
  } catch (error) {
    console.error('Error fetching Medium articles:', error);
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
 * Medium articles first (higher priority), HN articles at the end
 */
export async function fetchAllArticles(query: string): Promise<Article[]> {
  try {
    // Fetch from both sources in parallel with multiple pages
    const [mediumArticles, hnPage1, hnPage2] = await Promise.all([
      fetchMediumArticles(query),
      fetchHNArticles(query, 0),
      fetchHNArticles(query, 1),
    ]);

    // Combine all results: Medium first, then HN
    const combined = [...mediumArticles, ...hnPage1, ...hnPage2];
    
    // Remove duplicates by URL
    const seen = new Set<string>();
    const unique = combined.filter((article) => {
      if (seen.has(article.url)) return false;
      seen.add(article.url);
      return true;
    });

    // Separate by source
    const mediumOnly = unique.filter(a => a.source === 'medium');
    const hnArticles = unique.filter(a => a.source === 'hn');
    
    // Sort each source by score (highest first)
    const sortedMedium = mediumOnly.sort((a, b) => (b.score || 0) - (a.score || 0));
    const sortedHn = hnArticles.sort((a, b) => (b.score || 0) - (a.score || 0));
    
    // Return Medium first, then HN
    return [...sortedMedium, ...sortedHn];
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

    const [mediumArticles, hnArticles] = await Promise.all([
      fetchMediumArticles(queries[timeframe]),
      fetchHNArticles(queries[timeframe], 0),
    ]);

    // Combine: Medium first, then HN
    const combined = [...mediumArticles, ...hnArticles];
    
    // Remove duplicates
    const seen = new Set<string>();
    const unique = combined.filter((article) => {
      if (seen.has(article.url)) return false;
      seen.add(article.url);
      return true;
    });

    // Sort by source and score
    const sortedMedium = unique.filter(a => a.source === 'medium').sort((a, b) => (b.score || 0) - (a.score || 0));
    const sortedHn = unique.filter(a => a.source === 'hn').sort((a, b) => (b.score || 0) - (a.score || 0));
    
    return [...sortedMedium, ...sortedHn].slice(0, 100);
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
