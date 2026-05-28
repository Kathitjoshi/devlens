import { Article } from '@/lib/types';
import { sanitizeQuery } from '@/lib/utils/sanitize';

/**
 * Fetch articles from Medium via RSS (reliable tech content)
 */
export async function fetchMediumArticles(query: string): Promise<Article[]> {
  const sanitized = sanitizeQuery(query);
  if (!sanitized) return [];

  try {
    // Use Medium's search RSS feed
    const response = await fetch(
      `https://medium.com/feed/tag/${encodeURIComponent(sanitized.toLowerCase())}`,
      { next: { revalidate: 3600 } }
    );

    if (!response.ok) return [];

    const text = await response.text();
    
    // Simple XML parsing for RSS items
    const items = text.match(/<item>[\s\S]*?<\/item>/g) || [];
    
    return items.slice(0, 25).map((item: string): Article | null => {
      const titleMatch = item.match(/<title[^>]*>([^<]+)<\/title>/);
      const linkMatch = item.match(/<link[^>]*>([^<]+)<\/link>/);
      const descMatch = item.match(/<description[^>]*>([^<]+)<\/description>/);
      const authorMatch = item.match(/<creator[^>]*>([^<]+)<\/creator>/);
      const pubDateMatch = item.match(/<pubDate[^>]*>([^<]+)<\/pubDate>/);

      if (!titleMatch || !linkMatch) return null;

      return {
        id: `medium-${Math.random().toString(36).substr(2, 9)}`,
        title: titleMatch[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>'),
        url: linkMatch[1],
        source: 'devto' as const,
        author: authorMatch ? authorMatch[1] : 'Medium',
        description: descMatch ? descMatch[1].substring(0, 200) : '',
        publishedAt: pubDateMatch ? new Date(pubDateMatch[1]).toISOString() : new Date().toISOString(),
        score: 0,
      };
    }).filter((a): a is Article => a !== null);
  } catch (error) {
    console.error('Error fetching Medium articles:', error);
    return [];
  }
}

/**
 * Fetch articles from DEV Community RSS (reliable tech content)
 */
export async function fetchDevCommunityArticles(query: string): Promise<Article[]> {
  const sanitized = sanitizeQuery(query);
  if (!sanitized) return [];

  try {
    // Use DEV Community's RSS feed with tag
    const response = await fetch(
      `https://dev.to/api/articles?per_page=50&tag=${encodeURIComponent(sanitized.toLowerCase())}`,
      { next: { revalidate: 3600 } }
    );

    if (!response.ok) {
      // Fallback to general search
      const fallbackResponse = await fetch(
        `https://dev.to/api/articles?per_page=50&state=published&sort=-published_at`,
        { next: { revalidate: 3600 } }
      );
      
      if (!fallbackResponse.ok) return [];
      
      const articles = await fallbackResponse.json();
      return (articles || [])
        .filter((article: any) => 
          article.title.toLowerCase().includes(sanitized.toLowerCase()) ||
          article.description?.toLowerCase().includes(sanitized.toLowerCase())
        )
        .slice(0, 25)
        .map((article: any): Article => ({
          id: `devto-${article.id}`,
          title: article.title,
          url: article.url,
          source: 'devto' as const,
          author: article.user?.name || 'Dev.to User',
          description: article.description || article.body_markdown?.substring(0, 200) || '',
          publishedAt: article.published_at || new Date().toISOString(),
          score: article.positive_reactions_count || 0,
        }))
        .filter((a: Article) => a.title && a.url);
    }

    const articles = await response.json();
    return (articles || []).map((article: any): Article => ({
      id: `devto-${article.id}`,
      title: article.title,
      url: article.url,
      source: 'devto' as const,
      author: article.user?.name || 'Dev.to User',
      description: article.description || article.body_markdown?.substring(0, 200) || '',
      publishedAt: article.published_at || new Date().toISOString(),
      score: article.positive_reactions_count || 0,
    })).filter((a: Article) => a.title && a.url);
  } catch (error) {
    console.error('Error fetching Dev Community articles:', error);
    return [];
  }
}

/**
 * Fetch articles from GitHub (tech repos and discussions)
 */
export async function fetchGitHubArticles(query: string): Promise<Article[]> {
  const sanitized = sanitizeQuery(query);
  if (!sanitized) return [];

  try {
    const response = await fetch(
      `https://api.github.com/search/repositories?q=${encodeURIComponent(sanitized)}+language:javascript+stars:>100&sort=stars&per_page=50`,
      { 
        headers: { 'Accept': 'application/vnd.github.v3+json' },
        next: { revalidate: 3600 }
      }
    );

    if (!response.ok) return [];

    const data = await response.json();
    return (data.items || []).map((repo: any): Article => ({
      id: `github-${repo.id}`,
      title: `${repo.name}: ${repo.description || 'Popular Repository'}`,
      url: repo.html_url,
      source: 'hn' as const,
      author: repo.owner?.login || 'GitHub',
      description: repo.description || `⭐ ${repo.stargazers_count} stars`,
      publishedAt: repo.updated_at || new Date().toISOString(),
      score: repo.stargazers_count || 0,
    })).filter((a: Article) => a.title && a.url);
  } catch (error) {
    console.error('Error fetching GitHub articles:', error);
    return [];
  }
}

/**
 * Fetch articles from multiple sources with fallback
 */
export async function fetchAllArticles(query: string): Promise<Article[]> {
  try {
    const [devArticles, githubArticles, mediumArticles] = await Promise.all([
      fetchDevCommunityArticles(query),
      fetchGitHubArticles(query),
      fetchMediumArticles(query),
    ]);

    const combined = [...devArticles, ...githubArticles, ...mediumArticles];
    
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
 * Fetch trending articles
 */
export async function fetchTrendingArticles(timeframe: 'today' | 'week' | 'month' = 'today'): Promise<Article[]> {
  const queries = {
    today: 'trending',
    week: 'popular',
    month: 'best'
  };
  
  return fetchAllArticles(queries[timeframe]);
}

/**
 * Fetch articles by topic
 */
export async function fetchArticlesByTopic(topic: string): Promise<Article[]> {
  return fetchAllArticles(topic);
}
