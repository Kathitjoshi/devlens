'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { Moon, Sun, LogOut, Menu, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function Navbar() {
  const { theme, setTheme } = useTheme();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      subscription?.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSignOut = async () => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    try {
      await supabase.auth.signOut();
      toast.success('Signed out successfully');
      router.push('/');
    } catch (error) {
      toast.error('Failed to sign out');
    }
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="font-bold text-xl text-accent">
          DevLens
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="/trending" className="text-sm hover:text-accent transition-colors">
            Trending
          </Link>
          {user && (
            <Link href="/dashboard" className="text-sm hover:text-accent transition-colors">
              Dashboard
            </Link>
          )}
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>

          {/* Auth Section */}
          {!loading && (
            <>
              {user ? (
                <div className="hidden md:flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {user.email}
                  </span>
                  <button
                    onClick={handleSignOut}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                    aria-label="Sign out"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="hidden md:flex gap-2">
                  <Link
                    href="/signin"
                    className="text-sm px-4 py-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    className="text-sm px-4 py-2 rounded-lg bg-accent text-accent-foreground hover:opacity-90 transition-opacity"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 hover:bg-muted rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background p-4 space-y-4">
          <Link
            href="/trending"
            className="block text-sm hover:text-accent transition-colors"
            onClick={() => setMobileOpen(false)}
          >
            Trending
          </Link>
          {user && (
            <Link
              href="/dashboard"
              className="block text-sm hover:text-accent transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              Dashboard
            </Link>
          )}
          {!loading && (
            <>
              {user ? (
                <button
                  onClick={() => {
                    handleSignOut();
                    setMobileOpen(false);
                  }}
                  className="block w-full text-left text-sm hover:text-accent transition-colors"
                >
                  Sign Out
                </button>
              ) : (
                <div className="space-y-2">
                  <Link
                    href="/signin"
                    className="block text-sm px-4 py-2 rounded-lg hover:bg-muted transition-colors"
                    onClick={() => setMobileOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    className="block text-sm px-4 py-2 rounded-lg bg-accent text-accent-foreground hover:opacity-90 transition-opacity"
                    onClick={() => setMobileOpen(false)}
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </nav>
  );
}
