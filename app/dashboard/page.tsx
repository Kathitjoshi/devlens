'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { Bookmark } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
import { ArticleCard } from '@/components/article-card';
import { toast } from 'sonner';
import { Loader } from 'lucide-react';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'read_later' | 'finished'>('read_later');
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/signin');
        return;
      }

      setUser(user);
      await loadBookmarks(user.id);
      setLoading(false);
    };

    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadBookmarks = async (userId: string) => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    try {
      const { data, error } = await supabase
        .from('bookmarks')
        .select('*')
        .eq('user_id', userId)
        .order('saved_at', { ascending: false });

      if (error) throw error;
      setBookmarks(data || []);
    } catch (err) {
      toast.error('Failed to load bookmarks');
      console.error(err);
    }
  };

  const filteredBookmarks = bookmarks.filter((b) => b.status === activeTab);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <Loader className="w-6 h-6 animate-spin text-accent" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.email}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-border">
          <button
            onClick={() => setActiveTab('read_later')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'read_later'
                ? 'border-accent text-accent'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Read Later ({bookmarks.filter((b) => b.status === 'read_later').length})
          </button>
          <button
            onClick={() => setActiveTab('finished')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'finished'
                ? 'border-accent text-accent'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Finished ({bookmarks.filter((b) => b.status === 'finished').length})
          </button>
        </div>

        {/* Bookmarks List */}
        {filteredBookmarks.length > 0 ? (
          <div className="space-y-4">
            {filteredBookmarks.map((bookmark) => (
              <div
                key={bookmark.id}
                className="bg-card border border-border rounded-lg p-4 flex items-start justify-between hover:shadow-md transition-shadow"
              >
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">{bookmark.title}</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Source: {bookmark.source === 'devto' ? 'DEV.to' : 'Hacker News'}
                  </p>
                  {bookmark.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {bookmark.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 rounded-full text-xs bg-accent/10 text-accent"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <a
                  href={bookmark.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-4 px-4 py-2 rounded-lg bg-accent text-accent-foreground hover:opacity-90 transition-opacity text-sm font-medium whitespace-nowrap"
                >
                  Read
                </a>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              No {activeTab === 'read_later' ? 'read later' : 'finished'} articles yet
            </p>
            <p className="text-sm text-muted-foreground">
              Start bookmarking articles to see them here
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
