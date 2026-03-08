import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/'],
      disallow: ['/dashboard', '/signin', '/signup'],
    },
    sitemap: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://devlens.vercel.app'}/sitemap.xml`,
  };
}
