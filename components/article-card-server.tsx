import { Article } from '@/lib/types';
import { ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ArticleCardServerProps {
  article: Article;
}

export function ArticleCardServer({ article }: ArticleCardServerProps) {
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
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-accent text-accent-foreground hover:opacity-90 transition-opacity text-sm font-medium"
          >
            <ExternalLink className="w-4 h-4" />
            Read
          </a>
        </div>
      </div>
    </div>
  );
}
