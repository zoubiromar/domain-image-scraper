# 🚀 GitHub Setup Instructions

Your Domain Image Scraper application is ready for deployment! Follow these steps to push it to GitHub and deploy on Vercel.

## Step 1: Create GitHub Repository

### Option A: Using GitHub CLI (if installed)
```bash
gh repo create domain-image-scraper --public --source=. --remote=origin --push
```

### Option B: Manual Setup

1. **Go to GitHub** and log in to your account
   - Visit: https://github.com/new

2. **Create a new repository** with these settings:
   - Repository name: `domain-image-scraper`
   - Description: "Smart image scraper that finds product images from specific e-commerce domains"
   - Visibility: Public (or Private if you prefer)
   - Do NOT initialize with README, .gitignore, or license (we already have them)

3. **After creating the repository**, you'll see a page with setup instructions.

## Step 2: Connect and Push Your Code

Run these commands in your terminal (replace YOUR_USERNAME with your GitHub username):

```bash
# Add GitHub as remote origin
git remote add origin https://github.com/YOUR_USERNAME/domain-image-scraper.git

# Push to GitHub
git branch -M main
git push -u origin main
```

If you're using SSH instead of HTTPS:
```bash
git remote add origin git@github.com:YOUR_USERNAME/domain-image-scraper.git
git branch -M main
git push -u origin main
```

## Step 3: Deploy to Vercel

### Option A: Automatic Deployment (Recommended)

1. **Go to Vercel**: https://vercel.com
2. **Sign in** with your GitHub account
3. **Click "Add New Project"**
4. **Import** your `domain-image-scraper` repository
5. **Configure Project** (Vercel will auto-detect Next.js)
   - Framework Preset: Next.js
   - Build Command: `npm run build` (auto-detected)
   - Output Directory: `.next` (auto-detected)
6. **Click "Deploy"**

### Option B: Using Vercel CLI

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Deploy
vercel

# Follow the prompts to link your GitHub repository
```

## Step 4: Configure Custom Domain (Optional)

1. In your Vercel dashboard, go to your project settings
2. Navigate to "Domains"
3. Add your custom domain

## 🎉 Your Application URLs

After deployment, you'll have:
- **Production URL**: `https://domain-image-scraper.vercel.app`
- **GitHub Repository**: `https://github.com/YOUR_USERNAME/domain-image-scraper`

## 📝 Environment Variables (Future Enhancement)

When you add real scraping functionality, you may need to add environment variables in Vercel:

1. Go to your project settings in Vercel
2. Navigate to "Environment Variables"
3. Add any required variables

## 🔄 Continuous Deployment

Every push to the `main` branch will automatically trigger a new deployment on Vercel!

## Need Help?

- **Vercel Documentation**: https://vercel.com/docs
- **Next.js Deployment**: https://nextjs.org/docs/deployment

---

## Quick Commands Reference

```bash
# Check git status
git status

# View remote repositories
git remote -v

# Push new changes
git add .
git commit -m "Your commit message"
git push

# Pull latest changes
git pull origin main
```
