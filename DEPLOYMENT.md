# DevLens Deployment Guide

## Overview

DevLens is a full-stack Next.js 14 application with Supabase backend. This guide walks through deploying to Vercel with complete Supabase integration.

## Prerequisites

- GitHub account with access to [Kathitjoshi/devlens](https://github.com/Kathitjoshi/devlens)
- Supabase project already set up at: https://yywugnsfxswmoxdgoofd.supabase.co
- Vercel account

## Step 1: Push Code to GitHub

The application code needs to be pushed to your GitHub repository. Since the sandbox has authentication constraints, follow these steps locally:

```bash
# Clone your repository
git clone https://github.com/Kathitjoshi/devlens.git
cd devlens

# Copy the built application files from sandbox
# (Replace with actual files from /home/ubuntu/devlens)

# Commit and push
git add -A
git commit -m "Initial DevLens application - production ready"
git push origin main
```

## Step 2: Set Up Supabase Database

### 2.1 Create Database Tables

Go to your Supabase project SQL Editor and run:

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
```

### 2.2 Enable Row Level Security

```sql
-- Enable RLS on all tables
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

### 2.3 Configure Authentication

In Supabase Dashboard → Authentication → Providers:

1. **Email Provider**
   - Enable Email/Password authentication
   - Disable email confirmation (optional, for instant signup)
   - Set Auto Confirm User: OFF (if you want email verification)

2. **URL Configuration** (Authentication → URL Configuration)
   - Site URL: `https://devlens.vercel.app` (update with your domain)
   - Redirect URLs:
     - `https://devlens.vercel.app/auth/callback`
     - `http://localhost:3000/auth/callback` (for local development)

## Step 3: Deploy to Vercel

### 3.1 Connect Repository

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Select "Import Git Repository"
4. Choose `Kathitjoshi/devlens`
5. Click "Import"

### 3.2 Add Environment Variables

In Vercel project settings, add these environment variables:

| Variable | Value | Source |
|----------|-------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://yywugnsfxswmoxdgoofd.supabase.co` | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your anon key | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Your service role key | Supabase → Settings → API |
| `NEXT_PUBLIC_SITE_URL` | `https://your-vercel-domain.vercel.app` | Your Vercel domain |

### 3.3 Deploy

1. Click "Deploy"
2. Wait for build to complete (should take 2-3 minutes)
3. Your app will be live at the provided Vercel URL

## Step 4: Update Supabase Settings

After deployment, update Supabase with your Vercel domain:

1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Update Site URL to your Vercel domain: `https://your-domain.vercel.app`
3. Add Redirect URL: `https://your-domain.vercel.app/auth/callback`

## Step 5: Test the Application

1. Visit your Vercel deployment URL
2. Test sign up with email/password
3. Search for articles
4. Bookmark articles
5. Check dashboard
6. Verify theme switching works

## Troubleshooting

### Build Fails on Vercel

**Issue**: Build fails with TypeScript or ESLint errors

**Solution**:
- Check build logs in Vercel dashboard
- Ensure all environment variables are set
- Verify Node.js version is 18+

### Authentication Not Working

**Issue**: Sign up/sign in fails

**Solution**:
- Verify Supabase credentials are correct
- Check Supabase URL Configuration has correct redirect URLs
- Ensure email provider is enabled in Supabase

### Articles Not Loading

**Issue**: Search returns no results

**Solution**:
- DEV.to API might be rate-limited
- Hacker News Algolia API might be temporarily unavailable
- Check browser console for API errors

### Database Errors

**Issue**: Bookmarks not saving

**Solution**:
- Verify RLS policies are created correctly
- Check Supabase logs for permission errors
- Ensure user is authenticated before bookmarking

## Monitoring

### Vercel Analytics

Enable analytics in Vercel dashboard to monitor:
- Page performance
- User sessions
- Error rates

### Supabase Monitoring

Monitor in Supabase dashboard:
- Database query performance
- Authentication events
- API usage

## Maintenance

### Regular Tasks

- Monitor error logs
- Check API rate limits
- Update dependencies monthly
- Review security policies

### Scaling

If traffic increases:
- Supabase automatically scales
- Vercel automatically scales
- No manual configuration needed

## Support

For issues:
- Check application logs: Vercel dashboard
- Check database logs: Supabase dashboard
- Review GitHub issues
- Check Next.js documentation

## Success Criteria

✅ Application deployed to Vercel
✅ Supabase database configured
✅ Authentication working
✅ Articles loading from APIs
✅ Bookmarks saving to database
✅ Theme switching working
✅ CI/CD pipeline running

---

**Deployment Status**: Ready for production
**Last Updated**: March 8, 2026
