import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from 'sonner';
import './globals.css';

export const metadata: Metadata = {
  title: 'DevLens — Technical Article Search for Developers',
  description:
    'Search 100,000+ technical articles from DEV.to and Hacker News. Find the best dev content without the noise.',
  openGraph: {
    title: 'DevLens — Technical Article Search for Developers',
    description:
      'Search 100,000+ technical articles from DEV.to and Hacker News. Find the best dev content without the noise.',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://devlens.vercel.app',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DevLens — Technical Article Search for Developers',
    description:
      'Search 100,000+ technical articles from DEV.to and Hacker News. Find the best dev content without the noise.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'DevLens',
              url: process.env.NEXT_PUBLIC_SITE_URL || 'https://devlens.vercel.app',
              description: 'Technical article search engine for developers',
              potentialAction: {
                '@type': 'SearchAction',
                target: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://devlens.vercel.app'}/search?q={search_term}`,
                'query-input': 'required name=search_term',
              },
            }),
          }}
        />
      </head>
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
