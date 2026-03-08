import Link from 'next/link';

export const dynamic = 'force-static';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4">404</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Page not found
        </p>
        <Link
          href="/"
          className="px-6 py-3 rounded-lg bg-accent text-accent-foreground hover:opacity-90 transition-opacity font-medium"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
