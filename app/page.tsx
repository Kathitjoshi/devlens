'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { SearchBar } from '@/components/search-bar';
import { PRESET_TOPICS } from '@/lib/constants';
import { Zap, BookMarked, TrendingUp } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function Home() {
  const router = useRouter();
  const [randomTopic, setRandomTopic] = useState('');

  useEffect(() => {
    // Set random topic for "Surprise Me" button
    const topic = PRESET_TOPICS[Math.floor(Math.random() * PRESET_TOPICS.length)];
    setRandomTopic(topic);
  }, []);

  const handleSurpriseMe = () => {
    const topic = PRESET_TOPICS[Math.floor(Math.random() * PRESET_TOPICS.length)];
    setRandomTopic(topic);
    router.push(`/search?q=${encodeURIComponent(topic)}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-20">
        {/* Hero Section */}
        <div className="max-w-3xl mx-auto text-center space-y-8">
          {/* Announcement Banner */}
          <div className="inline-block px-4 py-2 rounded-full bg-accent/10 border border-accent/20">
            <p className="text-sm text-accent font-medium">
              🔥 100% free. No ads. No paywalls.
            </p>
          </div>

          {/* Headline */}
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
              DevLens
            </h1>
            <p className="text-xl text-muted-foreground">
              Search 100,000+ technical articles. No fluff. Just signal.
            </p>
          </div>

          {/* Search Bar */}
          <div className="pt-8">
            <SearchBar />
          </div>

          {/* Surprise Me Button */}
          <div>
            <button
              onClick={handleSurpriseMe}
              className="px-6 py-3 rounded-lg bg-accent text-accent-foreground hover:opacity-90 transition-opacity font-medium"
            >
              Surprise Me 🎲
            </button>
          </div>

          {/* How It Works */}
          <div className="grid md:grid-cols-3 gap-8 pt-12">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mx-auto">
                <Zap className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-semibold">Search</h3>
              <p className="text-sm text-muted-foreground">
                Find articles from DEV.to and Hacker News instantly
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mx-auto">
                <BookMarked className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-semibold">Save</h3>
              <p className="text-sm text-muted-foreground">
                Bookmark articles for later reading
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mx-auto">
                <TrendingUp className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-semibold">Discover</h3>
              <p className="text-sm text-muted-foreground">
                Explore trending topics and curated content
              </p>
            </div>
          </div>

          {/* Example Queries */}
          <div className="pt-12 space-y-4">
            <p className="text-sm text-muted-foreground">Popular searches:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {PRESET_TOPICS.slice(0, 6).map((topic) => (
                <button
                  key={topic}
                  onClick={() => router.push(`/search?q=${encodeURIComponent(topic)}`)}
                  className="px-4 py-2 rounded-full bg-muted hover:bg-muted/80 transition-colors text-sm"
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-20 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>DevLens © 2024. Built for developers, by developers.</p>
        </div>
      </footer>
    </div>
  );
}
