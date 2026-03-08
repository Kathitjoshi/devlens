'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { Bookmark } from '@/lib/types';
import { createClientSafe } from '@/lib/supabase/client';
import { ArticleCard } from '@/components/article-card';
import { toast } from 'sonner';
import { Loader, Trash2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'read_later' | 'finished'>('read_later');
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    const checkAuth = async () => {
      const supabase = createClientSafe();

      if (!supabase) {
        toast.error('Supabase is not configured');
        setLoading(false);
        return;
      }

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push('/signin');
          return;
        }

        setUser(user);
        await loadBookmarks(user.id, supabase);
      } catch (error) {
        console.error('Auth error:', error);
        router.push('/signin');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const loadBookmarks = async (userId: string, supabase: any) => {
    try {
      const { data, error } = await supabase
        .from('bookmarks')
        .select('*')
        .eq('user_id', userId)
        .order('saved_at', { ascending: false });

      if (error) {
        console.error('Error loading bookmarks:', error);
        return;
      }

      setBookmarks(data || []);
    } catch (error) {
      console.error('Failed to load bookmarks:', error);
      toast.error('Failed to load bookmarks');
    }
  };

  const handleRemoveBookmark = async (bookmarkId: string) => {
    const supabase = createClientSafe();

    if (!supabase) {
      toast.error('Supabase is not configured');
      return;
    }

    try {
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('id', bookmarkId);

      if (error) {
        toast.error('Failed to remove bookmark');
        return;
      }

      setBookmarks(bookmarks.filter((b) => b.id !== bookmarkId));
      toast.success('Bookmark removed');
    } catch (error) {
      console.error('Error removing bookmark:', error);
      toast.error('Failed to remove bookmark');
    }
  };

  const handleChangeStatus = async (bookmarkId: string, newStatus: 'read_later' | 'finished') => {
    const supabase = createClientSafe();

    if (!supabase) {
      toast.error('Supabase is not configured');
      return;
    }

    try {
      const { error } = await supabase
        .from('bookmarks')
        .update({ status: newStatus })
        .eq('id', bookmarkId);

      if (error) {
        toast.error('Failed to update bookmark');
        return;
      }

      setBookmarks(
        bookmarks.map((b) => (b.id === bookmarkId ? { ...b, status: newStatus } : b))
      );
      toast.success(`Moved to ${newStatus === 'read_later' ? 'Read Later' : 'Finished'}`);
    } catch (error) {
      console.error('Error updating bookmark:', error);
      toast.error('Failed to update bookmark');
    }
  };

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-12 flex items-center justify-center">
          <Loader className="w-6 h-6 animate-spin text-accent" />
        </main>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const filteredBookmarks = bookmarks.filter((b) => b.status === activeTab);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Bookmarks</h1>
          <p className="text-muted-foreground">Manage your saved articles</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-border">
          <button
            onClick={() => setActiveTab('read_later')}
            className={`pb-4 px-4 font-medium transition-colors ${
              activeTab === 'read_later'
                ? 'text-accent border-b-2 border-accent'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Read Later ({bookmarks.filter((b) => b.status === 'read_later').length})
          </button>
          <button
            onClick={() => setActiveTab('finished')}
            className={`pb-4 px-4 font-medium transition-colors ${
              activeTab === 'finished'
                ? 'text-accent border-b-2 border-accent'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Finished ({bookmarks.filter((b) => b.status === 'finished').length})
          </button>
        </div>

        {/* Bookmarks Grid */}
        {filteredBookmarks.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBookmarks.map((bookmark) => (
              <div key={bookmark.id} className="relative">
                <ArticleCard article={bookmark as any} />
                <div className="absolute top-4 right-4 flex gap-2">
                  <button
                    onClick={() =>
                      handleChangeStatus(
                        bookmark.id,
                        activeTab === 'read_later' ? 'finished' : 'read_later'
                      )
                    }
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      activeTab === 'read_later'
                        ? 'bg-green-500/20 text-green-600 hover:bg-green-500/30'
                        : 'bg-blue-500/20 text-blue-600 hover:bg-blue-500/30'
                    }`}
                  >
                    {activeTab === 'read_later' ? 'Mark Done' : 'Mark Later'}
                  </button>
                  <button
                    onClick={() => handleRemoveBookmark(bookmark.id)}
                    className="p-2 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No bookmarks yet</p>
            <p className="text-sm text-muted-foreground">
              {activeTab === 'read_later'
                ? 'Start bookmarking articles to read later'
                : 'Articles you finish will appear here'}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
