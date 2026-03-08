import type { MetadataRoute } from 'next';
import { PRESET_TOPICS } from '@/lib/constants';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://devlens.vercel.app';

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/trending`,
      changeFrequency: 'hourly',
      priority: 0.8,
    },
  ];

  const topicRoutes: MetadataRoute.Sitemap = PRESET_TOPICS.map((topic) => ({
    url: `${baseUrl}/topic/${topic.toLowerCase().replace(/\s+/g, '-')}`,
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...topicRoutes];
}
