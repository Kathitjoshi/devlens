'use client';

import { useEffect, useState } from 'react';
import { Article, Bookmark } from '@/lib/types';
import { Bookmark as BookmarkIcon, BookmarkCheck, ExternalLink } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { openExternalLink } from '@/lib/utils/url';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface ArticleCardProps {
  article: Article;
}

export function ArticleCard({ article }: ArticleCardProps) {
  const [bookmarkState, setBookmarkState] = useState<'unsaved' | 'read_later' | 'finished'>('unsaved');
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  // Check bookmark status on mount
  useEffect(() => {
    const checkBookmarkStatus = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data } = await supabase
        .from('bookmarks')
        .select('status')
        .eq('user_id', user.id)
        .eq('url', article.url)
        .single();

      if (data) {
        setBookmarkState(data.status as 'read_later' | 'finished');
      }
    };

    checkBookmarkStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [article.url]);

  const handleBookmark = async () => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast.error('Please sign in to bookmark articles');
      return;
    }

    try {
      setLoading(true);

      if (bookmarkState === 'unsaved') {
        // Create new bookmark
        await supabase.from('bookmarks').insert({
          user_id: user.id,
          title: article.title,
          url: article.url,
          source: article.source,
          status: 'read_later',
        });

        setBookmarkState('read_later');
        toast.success('Saved to Read Later 📌');
      } else if (bookmarkState === 'read_later') {
        // Update to finished
        await supabase
          .from('bookmarks')
          .update({ status: 'finished', read_at: new Date().toISOString() })
          .eq('user_id', user.id)
          .eq('url', article.url);

        setBookmarkState('finished');
        toast.success('Moved to Finished ✅');
      } else {
        // Move back to read_later
        await supabase
          .from('bookmarks')
          .update({ status: 'read_later', read_at: null })
          .eq('user_id', user.id)
          .eq('url', article.url);

        setBookmarkState('read_later');
        toast.success('Moved to Read Later 📌');
      }
    } catch (error) {
      toast.error('Failed to update bookmark');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getBookmarkButtonStyle = () => {
    switch (bookmarkState) {
      case 'read_later':
        return 'text-blue-500 hover:text-blue-600';
      case 'finished':
        return 'text-green-500 hover:text-green-600';
      default:
        return 'text-muted-foreground hover:text-foreground';
    }
  };

  return (
    <div className="group bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 flex flex-col">
      {/* Image */}
      {article.image && (
        <div className="relative h-40 overflow-hidden bg-muted">
          <img
            src={article.image}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
        </div>
      )}

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Source Badge */}
        <div className="mb-2">
          <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-accent/10 text-accent">
            {article.source === 'devto' ? 'DEV.to' : 'Hacker News'}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-base mb-2 line-clamp-3 hover:text-accent transition-colors">
          {article.title}
        </h3>

        {/* Description */}
        {article.description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-1">
            {article.description}
          </p>
        )}

        {/* Meta */}
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
          <div className="flex items-center gap-2">
            {article.author && <span>{article.author}</span>}
            {article.publishedAt && (
              <span>
                {formatDistanceToNow(new Date(article.publishedAt), {
                  addSuffix: true,
                })}
              </span>
            )}
          </div>
          {article.score && <span>{article.score} points</span>}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-4 border-t border-border">
          <button
            onClick={() => openExternalLink(article.url)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-accent text-accent-foreground hover:opacity-90 transition-opacity text-sm font-medium"
          >
            <ExternalLink className="w-4 h-4" />
            Read
          </button>

          <button
            onClick={handleBookmark}
            disabled={loading}
            className={`p-2 rounded-lg transition-colors ${getBookmarkButtonStyle()} disabled:opacity-50`}
            aria-label="Bookmark article"
          >
            {bookmarkState === 'finished' ? (
              <BookmarkCheck className="w-5 h-5" />
            ) : (
              <BookmarkIcon className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
