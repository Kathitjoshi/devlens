# DevLens — Technical Article Search for Developers

A full-stack web application for searching and bookmarking technical articles from DEV.to and Hacker News. Built with Next.js 14, Supabase, and Tailwind CSS.

**Live Demo:** [https://devlens-rosy.vercel.app/](https://devlens-rosy.vercel.app/)

## Features

- 🔍 **Smart Search** - Search 100,000+ technical articles from DEV.to and Hacker News
- 🔐 **Authentication** - Email/password signup and signin with Supabase Auth
- 📌 **Bookmarking** - Save articles as "Read Later" (blue) or "Finished" (green)
- 📊 **Dashboard** - View and manage your bookmarked articles
- 🔥 **Trending** - Discover what developers are reading right now
- 🏷️ **Topics** - Browse articles by preset topics (React, TypeScript, Python, etc.)
- 🌓 **Dark Mode** - Full dark/light theme support with smooth transitions
- ⚡ **Performance** - Server-side rendering with ISR for optimal performance
- 🔒 **Security** - Row-level security policies, input sanitization, and safe external links
- 📱 **Responsive** - Mobile-first design with Tailwind CSS
- 🎯 **SEO** - Dynamic metadata, robots.txt, sitemap.xml, and JSON-LD schema

## Tech Stack

- **Framework:** Next.js 14+ with App Router
- **Language:** TypeScript
- **Database:** Supabase PostgreSQL with Row Level Security
- **Authentication:** Supabase Auth (Email/Password)
- **Styling:** Tailwind CSS 3
- **Components:** Radix UI + custom components
- **Data Fetching:** DEV.to API, Hacker News Algolia API
- **Deployment:** Vercel

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project

### Local Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Kathitjoshi/devlens.git
   cd devlens
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create `.env.local` with your Supabase credentials:
   ```bash
   cp .env.example .env.local
   ```

   Fill in the values:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   NEXT_PUBLIC_SITE_URL=https://devlens.vercel.app
   ```

4. **Set up Supabase database:**
   - Create a new Supabase project
   - Run the SQL migrations in the SQL Editor:

   ```sql
   -- Create profiles table
   CREATE TABLE public.profiles (
     id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
     email TEXT,
     display_name TEXT,
     avatar_url TEXT,
     topics TEXT[] DEFAULT '{}',
     created_at TIMESTAMPTZ DEFAULT NOW()
   );

   -- Create bookmarks table
   CREATE TABLE public.bookmarks (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
     title TEXT NOT NULL,
     url TEXT NOT NULL,
     source TEXT NOT NULL CHECK (source IN ('devto', 'hn')),
     tags TEXT[] DEFAULT '{}',
     status TEXT NOT NULL DEFAULT 'read_later'
       CHECK (status IN ('read_later', 'finished')),
     saved_at TIMESTAMPTZ DEFAULT NOW(),
     read_at TIMESTAMPTZ
   );

   -- Create search_history table
   CREATE TABLE public.search_history (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
     query TEXT NOT NULL,
     searched_at TIMESTAMPTZ DEFAULT NOW()
   );

   -- Create trigger for auto-profile creation
   CREATE OR REPLACE FUNCTION public.handle_new_user()
   RETURNS TRIGGER AS $$
   BEGIN
     INSERT INTO public.profiles (id, email, display_name)
     VALUES (
       new.id,
       new.email,
       new.raw_user_meta_data->>'full_name'
     );
     RETURN new;
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;

   CREATE TRIGGER on_auth_user_created
     AFTER INSERT ON auth.users
     FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

   -- Enable RLS
   ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
   ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
   ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;

   -- Create RLS policies for profiles
   CREATE POLICY "Users can view own profile"
     ON public.profiles FOR SELECT
     USING (auth.uid() = id);

   CREATE POLICY "Users can update own profile"
     ON public.profiles FOR UPDATE
     USING (auth.uid() = id);

   -- Create RLS policies for bookmarks
   CREATE POLICY "Users can manage own bookmarks"
     ON public.bookmarks FOR ALL
     USING (auth.uid() = user_id);

   -- Create RLS policies for search_history
   CREATE POLICY "Users can manage own search history"
     ON public.search_history FOR ALL
     USING (auth.uid() = user_id);
   ```

   - Enable Email auth in Supabase Auth settings
   - Disable email confirmation (optional, for instant signup)
   - Set Site URL and redirect URLs in Auth settings

5. **Run development server:**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SITE_URL` | Your site URL | https://devlens.vercel.app |

## Available Scripts

```bash
# Development
npm run dev

# Production build
npm run build

# Start production server
npm start

# Linting
npm run lint

# Type checking
npm run type-check
```

## Project Structure

```
devlens/
├── app/                      # Next.js app directory
│   ├── layout.tsx           # Root layout with theme provider
│   ├── page.tsx             # Landing page
│   ├── search/              # Search results page
│   ├── dashboard/           # User dashboard
│   ├── trending/            # Trending articles
│   ├── topic/[tag]/         # Topic-based browsing
│   ├── signin/              # Sign in page
│   ├── signup/              # Sign up page
│   ├── auth/callback/       # OAuth callback
│   ├── robots.ts            # SEO robots.txt
│   ├── sitemap.ts           # SEO sitemap
│   └── globals.css          # Global styles
├── components/              # Reusable React components
│   ├── navbar.tsx           # Top navigation
│   ├── search-bar.tsx       # Search input
│   ├── article-card.tsx     # Article card (client)
│   ├── article-card-server.tsx # Article card (server)
│   └── theme-provider.tsx   # Theme provider
├── lib/                     # Utility functions
│   ├── api/articles.ts      # Article fetching services
│   ├── supabase/            # Supabase clients
│   │   ├── client.ts        # Browser client
│   │   ├── server.ts        # Server client
│   │   └── auth.ts          # Auth utilities
│   ├── utils/               # Helper functions
│   │   ├── sanitize.ts      # Input sanitization
│   │   └── url.ts           # URL security
│   ├── constants.ts         # App constants
│   └── types.ts             # TypeScript types
├── middleware.ts            # Next.js middleware
├── next.config.js           # Next.js configuration
├── tailwind.config.js       # Tailwind CSS config
└── .github/workflows/       # CI/CD workflows
    └── ci.yml              # GitHub Actions CI
```

## Key Features Explained

### Authentication
- Email/password signup and signin
- Automatic profile creation on signup
- Session management via Supabase Auth
- Protected routes with middleware

### Bookmarking System
- **Read Later** (Blue #3B82F6) - Articles to read later
- **Finished** (Green #10B981) - Articles already read
- Optimistic UI updates for instant feedback
- Persistent storage in Supabase

### Article Search
- Real-time search across DEV.to and Hacker News
- Debounced autocomplete with preset topics
- Recent searches stored per user
- Keyboard shortcut (Cmd+K / Ctrl+K) to focus search

### Trending & Topics
- Server-side rendering with 1-hour ISR revalidation
- Preset topics for easy browsing
- Dynamic topic pages for all preset topics
- Sorted by relevance and engagement

### Security
- Row-level security on all database tables
- Input sanitization for search queries
- Safe external link opening (noopener, noreferrer)
- Security headers (X-Frame-Options, X-Content-Type-Options, etc.)

## Deployment

### Deploy to Vercel

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project" and import your GitHub repository
   - Add environment variables from `.env.local`
   - Click "Deploy"

3. **Update Supabase Auth Settings:**
   - Go to Supabase Dashboard → Authentication → URL Configuration
   - Set Site URL: `https://your-domain.vercel.app`
   - Add Redirect URL: `https://your-domain.vercel.app/auth/callback`

## CI/CD

GitHub Actions automatically runs on every push to `main`:
- Installs dependencies
- Builds the project

All checks must pass before merging to main.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the MIT License.

## Support

For issues and questions, please open an issue on GitHub.

---

**Built with ❤️ for developers**
