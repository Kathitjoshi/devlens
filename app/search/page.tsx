'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { ArticleCard } from '@/components/article-card';
import { fetchDevToArticles, fetchHNArticles } from '@/lib/api/articles';
import { Article } from '@/lib/types';
import { Loader } from 'lucide-react';

function SearchPageContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

        const [devtoArticles, hnArticles] = await Promise.all([
          fetchDevToArticles(query),
          fetchHNArticles(query),
        ]);

        // Combine and sort by score
        const combined = [...devtoArticles, ...hnArticles];
        const sorted = combined.sort((a, b) => (b.score || 0) - (a.score || 0));

        setArticles(sorted);
      } catch (err) {
        setError('Failed to fetch articles');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, [query]);

  return (
    <main className="container mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Results for &quot;<span className="text-accent">{query}</span>&quot;
        </h1>
        <p className="text-muted-foreground">
          {loading ? 'Searching...' : `Found ${articles.length} articles`}
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader className="w-6 h-6 animate-spin text-accent" />
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-destructive">
          {error}
        </div>
      )}

      {/* Articles Grid */}
      {!loading && articles.length > 0 && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && articles.length === 0 && !error && (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            No articles found for &quot;{query}&quot;
          </p>
          <p className="text-sm text-muted-foreground">
            Try searching for different keywords or browse trending articles
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
