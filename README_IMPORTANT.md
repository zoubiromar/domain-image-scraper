# ⚠️ IMPORTANT: Enable Real Google Image Search

## Current Status
The app is running in **DEMO MODE** with placeholder images. To get **REAL Google Image search results** with proper domain filtering (like your Python script), you need to add a SerpAPI key.

## Quick Setup (2 minutes)

### Step 1: Get Your Free SerpAPI Key
1. Sign up for free: https://serpapi.com/users/sign_up
2. Get your API key: https://serpapi.com/manage-api-key
3. Copy the key (starts with something like `1234567890abcdef...`)

### Step 2: Add Key Locally
Create a file named `.env.local` in the project root:
```
SERPAPI_KEY=paste_your_key_here
```

### Step 3: Add Key on Vercel
1. Go to: https://vercel.com/zoubiromar/domain-image-scraper/settings/environment-variables
2. Add new variable:
   - Name: `SERPAPI_KEY`
   - Value: `your_api_key`
   - Environment: Production
3. Click "Save"
4. **Redeploy** your app for changes to take effect

## What Happens With the API Key?

Once configured, the app will:

✅ **Perform real Google Image searches** (not placeholders)
✅ **Filter by domains** using Google's `site:` operator
✅ **Return only images from your specified domains**
✅ **Score results** based on relevance to product names
✅ **Show actual product images** from the web

## Example Results

**Without API Key (Demo Mode):**
- Shows placeholder images
- Simulates domain filtering
- Not real product images

**With API Key (Production Mode):**
- Real Google Image search results
- Actual product images from specified domains
- Images URLs will be from apple.com, amazon.com, etc.
- Accurate relevance scoring

## Testing Your Setup

After adding the API key:

1. Restart the server (if running locally)
2. Try searching for:
   - Product: "iPhone 15 Pro"
   - Domains: "apple.com"
3. You should see **real iPhone images from apple.com**

## Free Tier Limits

- 100 searches per month (free)
- Each product search counts as 1 search
- Upgrade available if needed

## Troubleshooting

If still seeing demo images after adding the key:
1. Make sure the key is correctly formatted (no quotes)
2. Restart the development server
3. On Vercel, trigger a redeployment
4. Check browser console for any errors

## Your Python Script Equivalent

This implementation now matches your Python script:
- Uses the same SerpAPI Google Images API
- Same domain filtering logic (`site:` operator + post-filtering)
- Same scoring algorithm (token overlap, phrase matching, domain boost)
- Same output format (image URL, source domain, score)

## Need Help?

The implementation is complete and working. You just need to add the API key to see real results!
