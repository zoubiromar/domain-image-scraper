# URPC Image Scraper - Vercel Deployment Guide

## Important: Database Files Setup

The URPC database files are too large for GitHub (136 MB). You have two options:

### Option 1: Skip Database Build (Recommended for Testing)

Since Vercel has build time limits, you can:

1. **Comment out the database build** in `package.json`:
```json
"build": "next build",  // Remove "npm run build-db &&"
```

2. **Upload pre-built database** to Vercel Storage or use external storage
3. **Or** run the app without URPC features initially

### Option 2: Build Database on Vercel (If Build Succeeds)

1. **Upload XLSX files** to your Vercel project:
   - Go to Vercel Dashboard → Your Project → Storage
   - Create a Blob storage
   - Upload both XLSX files to `/data/` directory

2. **Keep build script** in package.json:
```json
"build": "npm run build-db && next build"
```

3. Vercel will build the database during deployment

### Option 3: Use External Database (Production)

For production, consider:
- Upload database to Vercel Blob Storage
- Or use Supabase/PlanetScale for database
- Or rebuild database periodically via API route

## Current Setup

**What's Committed**:
- ✅ All code and logic
- ✅ Build scripts
- ✅ UI components
- ❌ Database file (excluded - too large)
- ❌ Source XLSX files (excluded - too large)

**What Vercel Needs**:
- XLSX files in `/data/` directory (if building database)
- Or pre-built database in `/public/database/`

## Quick Deploy

### Without Database Build:

1. Edit `package.json`:
```json
"build": "next build"
```

2. Push to GitHub:
```bash
git add .
git commit -m "Update for Vercel deployment"
git push origin main
```

3. Vercel will auto-deploy
4. URPC features will show "Database not found" error

### With Database Build:

1. Keep `package.json` as-is
2. Add XLSX files to Vercel (see Option 2 above)
3. Deploy
4. Database builds during first deploy (may timeout)

## Recommended Approach

**For initial deployment**: Skip database build, test Domain Scraper features first

**Later**: Add database via Blob storage or external solution

The app has two independent tools:
- **Domain Scraper**: Works without database ✅
- **URPC Matcher**: Requires database

You can deploy now with just Domain Scraper working!


