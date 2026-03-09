'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { ArticleCard } from '@/components/article-card';
import { fetchAllArticles } from '@/lib/api/articles';
import { Article } from '@/lib/types';
import { Loader, X } from 'lucide-react';

function SearchPageContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter states
  const [sourceFilter, setSourceFilter] = useState<'all' | 'devto' | 'hn'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [popularityFilter, setPopularityFilter] = useState<'all' | 'popular' | 'trending' | 'recent'>('all');

  useEffect(() => {
    const fetchArticles = async () => {
      if (!query.trim()) {
        setArticles([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');

        const articles = await fetchAllArticles(query);
        setArticles(articles);
      } catch (err) {
        setError('Failed to fetch articles');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, [query]);

  // Filter articles
  const filteredArticles = articles.filter((article) => {
    // Source filter
    if (sourceFilter !== 'all' && article.source !== sourceFilter) {
      return false;
    }

    // Date filter
    if (dateFilter !== 'all' && article.publishedAt) {
      const articleDate = new Date(article.publishedAt);
      const now = new Date();
      const daysDiff = (now.getTime() - articleDate.getTime()) / (1000 * 60 * 60 * 24);

      if (dateFilter === 'today' && daysDiff > 1) return false;
      if (dateFilter === 'week' && daysDiff > 7) return false;
      if (dateFilter === 'month' && daysDiff > 30) return false;
    }

    // Popularity filter based on likes/upvotes
    if (popularityFilter !== 'all') {
      const score = article.score || 0;
      if (popularityFilter === 'popular' && score < 200) return false;
      if (popularityFilter === 'trending' && (score < 50 || score >= 200)) return false;
      if (popularityFilter === 'recent' && score >= 50) return false;
    }

    return true;
  });

  // Smart sorting based on filters
  const sortedArticles = [...filteredArticles].sort((a, b) => {
    // For "Recent" filter, sort by publish date (newest first)
    if (popularityFilter === 'recent' && a.publishedAt && b.publishedAt) {
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    }
    // For "Popular" and "Trending", sort by score (highest first)
    if (popularityFilter === 'popular' || popularityFilter === 'trending') {
      return (b.score || 0) - (a.score || 0);
    }
    // Default: sort by score
    return (b.score || 0) - (a.score || 0);
  });

  const activeFilters = [
    sourceFilter !== 'all' && { key: 'source', label: `Source: ${sourceFilter.toUpperCase()}`, value: sourceFilter },
    dateFilter !== 'all' && { key: 'date', label: `Date: ${dateFilter}`, value: dateFilter },
    popularityFilter !== 'all' && { key: 'popularity', label: `Popularity: ${popularityFilter.charAt(0).toUpperCase() + popularityFilter.slice(1)}`, value: popularityFilter },
  ].filter(Boolean);

  return (
    <main className="container mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Results for &quot;<span className="text-accent">{query}</span>&quot;
        </h1>
        <p className="text-muted-foreground">
          {loading ? 'Searching...' : `Found ${sortedArticles.length} articles from ${articles.length} total`}
        </p>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-lg p-6 mb-8">
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          {/* Source Filter */}
          <div>
            <label className="block text-sm font-medium mb-2">Source</label>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value as any)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="all">All Sources</option>
              <option value="devto">DEV.to</option>
              <option value="hn">Hacker News</option>
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <label className="block text-sm font-medium mb-2">Date</label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>

          {/* Popularity Filter */}
          <div>
            <label className="block text-sm font-medium mb-2">Popularity</label>
            <select
              value={popularityFilter}
              onChange={(e) => setPopularityFilter(e.target.value as any)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="all">All Levels</option>
              <option value="popular">⭐ Popular (200+)</option>
              <option value="trending">🔥 Trending (50-199)</option>
              <option value="recent">✨ Recent (0-49)</option>
            </select>
          </div>
        </div>

        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {activeFilters.map((filter: any) => (
              <button
                key={filter.key}
                onClick={() => {
                  if (filter.key === 'source') setSourceFilter('all');
                  if (filter.key === 'date') setDateFilter('all');
                  if (filter.key === 'popularity') setPopularityFilter('all');
                }}
                className="flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent hover:bg-accent/20 transition-colors text-sm"
              >
                {filter.label}
                <X className="w-3 h-3" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader className="w-6 h-6 animate-spin text-accent" />
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-destructive mb-8">
          {error}
        </div>
      )}

      {/* Articles Grid */}
      {!loading && sortedArticles.length > 0 && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedArticles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && sortedArticles.length === 0 && !error && (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            No articles found for &quot;{query}&quot;
          </p>
          <p className="text-sm text-muted-foreground">
            Try adjusting your filters or searching for different keywords
          </p>
        </div>
      )}
    </main>
  );
}

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader className="w-6 h-6 animate-spin text-accent" /></div>}>
        <SearchPageContent />
      </Suspense>
    </div>
  );
}
