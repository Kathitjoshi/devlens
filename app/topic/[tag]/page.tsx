import { fetchDevToArticles, fetchHNArticles } from '@/lib/api/articles';
import { ArticleCardServer } from '@/components/article-card-server';
import { PRESET_TOPICS } from '@/lib/constants';

export const revalidate = 3600; // Revalidate every hour

export async function generateStaticParams() {
  return PRESET_TOPICS.map((topic) => ({
    tag: topic.toLowerCase().replace(/\s+/g, '-'),
  }));
}

export async function generateMetadata({ params }: { params: { tag: string } }) {
  const topic = params.tag.replace(/-/g, ' ');
  const capitalizedTopic = topic.charAt(0).toUpperCase() + topic.slice(1);

  return {
    title: `${capitalizedTopic} Articles — DevLens`,
    description: `Best ${capitalizedTopic} articles from the developer community.`,
  };
}

export default async function TopicPage({ params }: { params: { tag: string } }) {
  const topic = params.tag.replace(/-/g, ' ');
  const capitalizedTopic = topic.charAt(0).toUpperCase() + topic.slice(1);

  const [devtoArticles, hnArticles] = await Promise.all([
    fetchDevToArticles(topic),
    fetchHNArticles(topic),
  ]);

  const articles = [...devtoArticles, ...hnArticles]
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, 30);

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{capitalizedTopic} Articles</h1>
          <p className="text-muted-foreground">
            Best {capitalizedTopic} articles from the developer community
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
              No articles found for {capitalizedTopic}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
