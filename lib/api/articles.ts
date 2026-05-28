import { Article } from '@/lib/types';
import { sanitizeQuery } from '@/lib/utils/sanitize';

/**
 * Fetch articles from Dev.to API
 */
export async function fetchDevtoArticles(query: string): Promise<Article[]> {
  const sanitized = sanitizeQuery(query);
  if (!sanitized) return [];

  try {
    const response = await fetch(
      `https://dev.to/api/articles?per_page=50&tag=${encodeURIComponent(sanitized.toLowerCase())}`,
      { next: { revalidate: 3600 } }
    );

    if (!response.ok) return [];

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
    console.error('Error fetching Dev.to articles:', error);
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
      source: 'hn' as const, // Use 'hn' for GitHub to show as secondary source
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
 * Fetch articles from both sources
 */
export async function fetchAllArticles(query: string): Promise<Article[]> {
  try {
    const [devtoArticles, githubArticles] = await Promise.all([
      fetchDevtoArticles(query),
      fetchGitHubArticles(query),
    ]);

    const combined = [...devtoArticles, ...githubArticles];
    
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
