'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { PRESET_TOPICS } from '@/lib/constants';
import { createClientSafe } from '@/lib/supabase/client';

export function SearchBar() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const router = useRouter();
  const supabase = createClientSafe();
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Load recent searches on mount
  useEffect(() => {
    const loadRecentSearches = async () => {
      if (!supabase) return;

      try {
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
            setRecentSearches(data.map((item: any) => item.query));
          }
        }
      } catch (error) {
        console.error('Failed to load recent searches:', error);
      }
    };

    loadRecentSearches();
  }, [supabase]);

  // Handle input change for suggestions
  useEffect(() => {
    if (query.trim().length > 0) {
      const filtered = PRESET_TOPICS.filter((topic) =>
        topic.toLowerCase().includes(query.toLowerCase())
      );
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(true);
    }
  }, [query]);

  // Handle search submission
  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    // Save to search history if user is logged in
    if (supabase) {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          await supabase.from('search_history').insert({
            user_id: user.id,
            query: searchQuery,
            searched_at: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error('Failed to save search history:', error);
      }
    }

    setQuery('');
    setShowSuggestions(false);
    router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full max-w-2xl mx-auto" ref={suggestionsRef}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSearch(query);
            }
          }}
          onFocus={() => setShowSuggestions(true)}
          placeholder="Search articles... (React, TypeScript, Python, etc.)"
          className="w-full px-4 py-3 pl-12 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setSuggestions([]);
            }}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {/* Recent Searches */}
          {recentSearches.length > 0 && !query && (
            <>
              <div className="px-4 py-2 text-xs font-semibold text-muted-foreground border-b border-border">
                Recent Searches
              </div>
              {recentSearches.map((search) => (
                <button
                  key={search}
                  onClick={() => handleSearch(search)}
                  className="w-full text-left px-4 py-2 hover:bg-accent/10 text-foreground transition-colors"
                >
                  {search}
                </button>
              ))}
              <div className="border-t border-border" />
            </>
          )}

          {/* Suggestions */}
          {suggestions.length > 0 ? (
            <>
              <div className="px-4 py-2 text-xs font-semibold text-muted-foreground">
                Suggestions
              </div>
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSearch(suggestion)}
                  className="w-full text-left px-4 py-2 hover:bg-accent/10 text-foreground transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </>
          ) : query ? (
            <div className="px-4 py-3 text-sm text-muted-foreground text-center">
              No suggestions found
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
