'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { ArticleCard } from '@/components/article-card';
import { Article } from '@/lib/types';
import { PRESET_TOPICS } from '@/lib/constants';
import { Loader, Heart, Plus } from 'lucide-react';
import { useAuth } from '@/_core/hooks/useAuth';
import { createClientSafe } from '@/lib/supabase/client';
import { toast } from 'sonner';

export const dynamic = 'force-dynamic';

export default function TopicPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const tag = params.tag as string;

  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  // Get topic info
  const topicInfo = PRESET_TOPICS.find((t) => t.slug === tag);

  useEffect(() => {
    const fetchTopicArticles = async () => {
      try {
        setLoading(true);
        setError('');

        // Fetch from DEV.to
        const response = await fetch(
          `https://dev.to/api/articles?tag=${tag}&per_page=20`
        );

        if (!response.ok) throw new Error('Failed to fetch articles');

        const data = await response.json();

        const formatted = (data || []).map((item: any) => ({
          id: `devto-${item.id}`,
          title: item.title,
          description: item.description || item.excerpt || '',
          url: item.url,
          source: 'devto',
          author: item.user?.name || 'Anonymous',
          avatar: item.user?.profile_image_90 || '',
          tags: item.tag_list || [],
          score: item.public_reactions_count || 0,
          published_at: item.published_at,
          reading_time_minutes: item.reading_time_minutes || 5,
        }));

        setArticles(formatted);
      } catch (err) {
        console.error('Failed to fetch topic articles:', err);
        setError('Failed to load articles for this topic');
      } finally {
        setLoading(false);
      }
    };

    fetchTopicArticles();
  }, [tag]);

  // Check if user is following this topic
  useEffect(() => {
    const checkFollowing = async () => {
      if (!user) return;

      const supabase = createClientSafe();
      if (!supabase) return;

      try {
        const { data } = await supabase
          .from('profiles')
          .select('followed_topics')
          .eq('id', user.id)
          .single();

        if (data?.followed_topics?.includes(tag)) {
          setIsFollowing(true);
        }
      } catch (err) {
        console.error('Error checking follow status:', err);
      }
    };

    checkFollowing();
  }, [user, tag]);

  const handleFollowToggle = async () => {
    if (!user) {
      router.push(`/signin?return=/topic/${tag}`);
      return;
    }

    const supabase = createClientSafe();
    if (!supabase) {
      toast.error('Supabase is not configured');
      return;
    }

    try {
      setFollowLoading(true);

      const { data } = await supabase
        .from('profiles')
        .select('followed_topics')
        .eq('id', user.id)
        .single();

      let updatedTopics = data?.followed_topics || [];

      if (isFollowing) {
        updatedTopics = updatedTopics.filter((t: string) => t !== tag);
      } else {
        updatedTopics = [...updatedTopics, tag];
      }

      const { error } = await supabase
        .from('profiles')
        .update({ followed_topics: updatedTopics })
        .eq('id', user.id);

      if (error) throw error;

      setIsFollowing(!isFollowing);
      toast.success(isFollowing ? 'Unfollowed topic' : 'Following topic');
    } catch (err) {
      console.error('Error toggling follow:', err);
      toast.error('Failed to update follow status');
    } finally {
      setFollowLoading(false);
    }
  };

  if (!topicInfo) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Topic not found</h1>
            <p className="text-muted-foreground mb-6">This topic doesn&apos;t exist</p>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 rounded-lg bg-accent text-white hover:bg-accent/90 transition-colors"
            >
              Go Home
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="mb-12">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">{topicInfo.name}</h1>
              <p className="text-muted-foreground text-lg">
                {articles.length} articles about {topicInfo.name}
              </p>
            </div>
            <button
              onClick={handleFollowToggle}
              disabled={followLoading}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                isFollowing
                  ? 'bg-accent text-white hover:bg-accent/90'
                  : 'border border-accent text-accent hover:bg-accent/10'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isFollowing ? (
                <>
                  <Heart className="w-4 h-4 fill-current" />
                  Following
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Follow
                </>
              )}
            </button>
          </div>
          <p className="text-muted-foreground">{topicInfo.description}</p>
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
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && articles.length === 0 && !error && (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              No articles found for {topicInfo.name}
            </p>
            <p className="text-sm text-muted-foreground">
              Check back later for new content
            </p>
          </div>
        )}

        {/* Related Topics */}
        {!loading && articles.length > 0 && (
          <div className="border-t border-border pt-12">
            <h2 className="text-2xl font-bold mb-6">Related Topics</h2>
            <div className="flex flex-wrap gap-3">
              {PRESET_TOPICS.filter((t) => t.slug !== tag)
                .slice(0, 8)
                .map((topic) => (
                  <button
                    key={topic.slug}
                    onClick={() => router.push(`/topic/${topic.slug}`)}
                    className="px-4 py-2 rounded-full border border-border hover:border-accent hover:text-accent transition-colors"
                  >
                    {topic.name}
                  </button>
                ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
