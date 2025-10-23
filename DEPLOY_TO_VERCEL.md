# 🚀 Deploy to Vercel - Quick Guide

Your app is ready to go live! Follow these simple steps:

## One-Click Deploy (Easiest)

Click this button to deploy instantly:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/zoubiromar/domain-image-scraper)

## Manual Deploy (More Control)

### Step 1: Go to Vercel
Visit: [https://vercel.com](https://vercel.com)

### Step 2: Sign In
Click "Sign In" and choose "Continue with GitHub"

### Step 3: Import Project
1. Click "Add New..." → "Project"
2. You'll see your repositories
3. Find `domain-image-scraper`
4. Click "Import"

### Step 4: Configure (Auto-detected)
Vercel will automatically detect:
- Framework: Next.js
- Build Command: `npm run build`
- Output Directory: `.next`

Just click "Deploy"!

### Step 5: Wait for Magic ✨
- Deployment takes about 1-2 minutes
- You'll get a URL like: `domain-image-scraper-xyz.vercel.app`

## 🎉 That's It!

Your app will be live at:
- Preview: `https://domain-image-scraper-[random].vercel.app`
- Production: `https://domain-image-scraper.vercel.app` (if available)

## Custom Domain (Optional)

1. Go to your project settings in Vercel
2. Navigate to "Domains"
3. Add your custom domain
4. Update DNS settings as instructed

## Auto-Deploy Feature

Every time you push to GitHub, Vercel will automatically deploy!

```bash
git add .
git commit -m "Update feature"
git push
# Vercel deploys automatically!
```

## Environment Variables (Future)

When you add real scraping:
1. Go to Settings → Environment Variables
2. Add any API keys needed
3. Redeploy

---

## Quick Links

- **Your GitHub Repo**: https://github.com/zoubiromar/domain-image-scraper
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Vercel Docs**: https://vercel.com/docs

Happy Deploying! 🎊
