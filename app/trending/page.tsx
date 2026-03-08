'use client';

import { useEffect, useState } from 'react';
import { Navbar } from '@/components/navbar';
import { ArticleCard } from '@/components/article-card';
import { Article } from '@/lib/types';
import { Loader, Flame, Calendar, Trophy } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function TrendingPage() {
  const [activeTab, setActiveTab] = useState<'today' | 'week' | 'month'>('today');
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        setLoading(true);
        setError('');

        let devtoUrl = 'https://dev.to/api/articles?per_page=20';
        let hnUrl = 'https://hn.algolia.com/api/v1/search?tags=front_page';

        if (activeTab === 'week') {
          devtoUrl = 'https://dev.to/api/articles?top=7&per_page=20';
        } else if (activeTab === 'month') {
          devtoUrl = 'https://dev.to/api/articles?top=30&per_page=20';
        } else {
          devtoUrl = 'https://dev.to/api/articles?top=1&per_page=20';
        }

        const [devtoRes, hnRes] = await Promise.all([
          fetch(devtoUrl),
          fetch(hnUrl),
        ]);

        const devtoData = await devtoRes.json();
        const hnData = await hnRes.json();

        // Format DEV.to articles
        const formattedDevto = (devtoData || []).map((item: any) => ({
          id: `devto-${item.id}`,
          title: item.title,
          description: item.description || item.excerpt || '',
          url: item.url,
          source: 'devto',
          author: item.user?.name || 'Anonymous',
          image: item.user?.profile_image_90 || '',
          score: item.public_reactions_count || 0,
          publishedAt: item.published_at,
        }));

        // Format Hacker News articles
        const formattedHN = (hnData.hits || []).slice(0, 20).map((item: any) => ({
          id: `hn-${item.objectID}`,
          title: item.title || item.story_title || '',
          description: '',
          url: item.url || `https://news.ycombinator.com/item?id=${item.objectID}`,
          source: 'hn',
          author: item.author || 'Anonymous',
          score: item.points || 0,
          publishedAt: new Date(item.created_at).toISOString(),
        }));

        // Combine and sort by score
        const combined = [...formattedDevto, ...formattedHN];
        const sorted = combined.sort((a, b) => (b.score || 0) - (a.score || 0));

        setArticles(sorted);
      } catch (err) {
        console.error('Failed to fetch trending:', err);
        setError('Failed to load trending articles');
      } finally {
        setLoading(false);
      }
    };

    fetchTrending();
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Trending Articles</h1>
          <p className="text-muted-foreground">
            What developers are reading right now
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-border">
          <button
            onClick={() => setActiveTab('today')}
            className={`pb-4 px-4 font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'today'
                ? 'text-accent border-b-2 border-accent'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Flame className="w-4 h-4" />
            Today
          </button>
          <button
            onClick={() => setActiveTab('week')}
            className={`pb-4 px-4 font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'week'
                ? 'text-accent border-b-2 border-accent'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Calendar className="w-4 h-4" />
            This Week
          </button>
          <button
            onClick={() => setActiveTab('month')}
            className={`pb-4 px-4 font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'month'
                ? 'text-accent border-b-2 border-accent'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Trophy className="w-4 h-4" />
            This Month
          </button>
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
              No trending articles found
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
