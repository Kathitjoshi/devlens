import { fetchTrendingArticles } from '@/lib/api/articles';
import { ArticleCardServer } from '@/components/article-card-server';

export const revalidate = 3600; // Revalidate every hour

export const metadata = {
  title: 'Trending Developer Articles — DevLens',
  description: 'What developers are reading right now.',
};

export default async function TrendingPage() {
  const articles = await fetchTrendingArticles();

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Trending Articles</h1>
          <p className="text-muted-foreground">
            What developers are reading right now
          </p>
        </div>

        {/* Articles Grid */}
        {articles.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <ArticleCardServer key={article.id} article={article} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Failed to load trending articles
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
