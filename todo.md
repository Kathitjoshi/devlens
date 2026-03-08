# DevLens Project TODO

## Core Infrastructure
- [x] Next.js 14 setup with TypeScript
- [x] Tailwind CSS configuration with theme variables
- [x] Supabase clients (browser and server)
- [x] Middleware for session refresh
- [x] Auth callback route
- [x] Theme provider with next-themes

## Authentication & Security
- [x] Sign up page with email/password
- [x] Sign in page with email/password
- [x] Input sanitization utilities
- [x] URL security utilities
- [x] Security headers in next.config.js

## Pages & Components
- [x] Landing page with hero section
- [x] Navigation bar with theme toggle
- [x] Search bar with autocomplete and recent searches
- [x] Search results page
- [x] Dashboard with Read Later and Finished tabs
- [x] Trending articles page
- [x] Topic-based browsing pages
- [x] Article card component (client-side)
- [x] Article card component (server-side)

## Features
- [x] Article search from DEV.to API
- [x] Article search from Hacker News Algolia API
- [x] Bookmark management (Read Later / Finished states)
- [x] Search history tracking
- [x] Dark/light theme switching
- [x] Responsive design for mobile and desktop
- [x] Keyboard shortcut (Cmd+K / Ctrl+K) for search focus

## SEO & Performance
- [x] Dynamic page metadata
- [x] robots.txt configuration
- [x] sitemap.xml generation
- [x] JSON-LD schema on landing page
- [x] Server-side rendering for trending and topic pages
- [x] ISR (Incremental Static Regeneration) with 1-hour revalidation

## Database & Types
- [x] TypeScript types for articles, bookmarks, profiles, search history
- [x] Constants for preset topics and bookmark states
- [x] API functions for article fetching

## CI/CD & Deployment
- [x] GitHub Actions CI workflow
- [x] ESLint configuration
- [x] Environment variables setup (.env.example, .env.local)
- [x] .gitignore configuration
- [x] README with setup instructions

## Testing & Validation
- [ ] Unit tests for utilities
- [ ] Integration tests for API routes
- [ ] E2E tests for user flows

## Optional Enhancements
- [ ] User profile page
- [ ] Article sharing functionality
- [ ] Email digest feature
- [ ] Advanced search filters
- [ ] Article recommendations
- [ ] Social features (likes, comments)
