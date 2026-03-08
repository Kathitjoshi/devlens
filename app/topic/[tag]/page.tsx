'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { ArticleCard } from '@/components/article-card';
import { fetchDevToArticles, fetchHNArticles } from '@/lib/api/articles';
import { Article } from '@/lib/types';
import { Loader } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function TopicPage() {
  const params = useParams();
  const tag = params.tag as string;
  const topic = tag.replace(/-/g, ' ');
  const capitalizedTopic = topic.charAt(0).toUpperCase() + topic.slice(1);

  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setLoading(true);
        const [devtoArticles, hnArticles] = await Promise.all([
          fetchDevToArticles(topic),
          fetchHNArticles(topic),
        ]);

        const combined = [...devtoArticles, ...hnArticles];
        const sorted = combined.sort((a, b) => (b.score || 0) - (a.score || 0));
        setArticles(sorted);
      } catch (error) {
        console.error('Failed to fetch articles:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, [topic]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{capitalizedTopic}</h1>
          <p className="text-muted-foreground">
            Best {capitalizedTopic.toLowerCase()} articles from the developer community
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
              No articles found for {capitalizedTopic.toLowerCase()}
            </p>
            <p className="text-sm text-muted-foreground">
              Try searching for different keywords
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
