'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { PRESET_TOPICS } from '@/lib/constants';
import { createClient } from '@/lib/supabase/client';

export function SearchBar() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const router = useRouter();
  const supabase = createClient();
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Load recent searches on mount
  useEffect(() => {
    const loadRecentSearches = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data } = await supabase
          .from('search_history')
          .select('query')
          .eq('user_id', user.id)
          .order('searched_at', { ascending: false })
          .limit(5);

        if (data) {
          setRecentSearches(data.map((item) => item.query));
        }
      } else {
        // Use localStorage for non-authenticated users
        const stored = localStorage.getItem('recentSearches');
        if (stored) {
          setRecentSearches(JSON.parse(stored).slice(0, 5));
        }
      }
    };

    loadRecentSearches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle keyboard shortcut (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        (document.querySelector('input[type="search"]') as HTMLInputElement)?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInputChange = (value: string) => {
    setQuery(value);

    if (value.length > 0) {
      // Filter preset topics
      const filtered = PRESET_TOPICS.filter((topic) =>
        topic.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(true);
    }
  };

  const handleSearch = async (searchQuery: string) => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    if (!searchQuery.trim()) return;

    // Save search to history
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await supabase.from('search_history').insert({
        user_id: user.id,
        query: searchQuery,
      });
    } else {
      // Save to localStorage for non-authenticated users
      const stored = localStorage.getItem('recentSearches') || '[]';
      const searches = JSON.parse(stored);
      searches.unshift(searchQuery);
      localStorage.setItem('recentSearches', JSON.stringify(searches.slice(0, 10)));
    }

    router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    setShowSuggestions(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  const displaySuggestions =
    query.length === 0 ? recentSearches : suggestions;

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center">
          <Search className="absolute left-4 w-5 h-5 text-muted-foreground pointer-events-none" />
          <input
            type="search"
            placeholder="Search React hooks, Rust ownership..."
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            className="w-full pl-12 pr-12 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setSuggestions([]);
              }}
              className="absolute right-4 text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </form>

      {/* Suggestions Dropdown */}
      {showSuggestions && displaySuggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg z-10"
        >
          {displaySuggestions.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => {
                setQuery(suggestion);
                handleSearch(suggestion);
              }}
              className="w-full text-left px-4 py-3 hover:bg-muted transition-colors first:rounded-t-lg last:rounded-b-lg text-sm flex items-center gap-2"
            >
              <Search className="w-4 h-4 text-muted-foreground" />
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* Keyboard hint */}
      <div className="absolute right-4 -bottom-8 text-xs text-muted-foreground pointer-events-none">
        Press <kbd className="px-2 py-1 bg-muted rounded text-xs">⌘K</kbd> to focus
      </div>
    </div>
  );
}
