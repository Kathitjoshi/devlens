'use client';

import { useEffect, useState } from 'react';
import { Navbar } from '@/components/navbar';
import { ArticleCard } from '@/components/article-card';
import { Article } from '@/lib/types';
import { Loader } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function TrendingPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const response = await fetch('https://api.hnpickup.com/posts');
        const data = await response.json();
        const formattedArticles = data.slice(0, 12).map((item: any) => ({
          id: item.id,
          title: item.title,
          url: item.url,
          source: 'hn',
          score: item.score,
          tags: [],
        }));
        setArticles(formattedArticles);
      } catch (error) {
        console.error('Failed to fetch trending:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrending();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Trending Articles</h1>
          <p className="text-muted-foreground">
            What developers are reading right now
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-6 h-6 animate-spin text-accent" />
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
        {!loading && articles.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              Unable to load trending articles
            </p>
            <p className="text-sm text-muted-foreground">
              Please try again later
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
