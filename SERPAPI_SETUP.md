# 🔑 SerpAPI Setup Guide

## Why SerpAPI?

To perform **real Google Image searches** with domain filtering (just like the Python script), we need to use the Google Images API. SerpAPI provides this functionality with a free tier.

## Getting Your Free API Key

1. **Sign up for free** at: https://serpapi.com/users/sign_up
   - Use your email to create an account
   - Free tier includes **100 searches per month**

2. **Get your API key**:
   - After signing up, go to: https://serpapi.com/manage-api-key
   - Copy your API key

## Setting Up Locally

Create a file named `.env.local` in the project root with:

```
SERPAPI_KEY=your_api_key_here
```

## Setting Up on Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add a new variable:
   - **Name**: `SERPAPI_KEY`
   - **Value**: Your SerpAPI key
   - **Environment**: Production

## How It Works

With the API key configured, the app will:

1. **Search Google Images** for your product names
2. **Apply domain filtering** using Google's `site:` operator
3. **Post-filter results** to ensure images come from your specified domains
4. **Score and rank** images based on relevance (same algorithm as Python script)

## Without API Key (Demo Mode)

If no API key is provided, the app falls back to demo mode with placeholder images that simulate the domain filtering behavior.

## Features with SerpAPI

- ✅ **Real Google Image Search** - Actual product images from Google
- ✅ **Domain Filtering** - Only images from your specified domains
- ✅ **Relevance Scoring** - Smart ranking based on product name match
- ✅ **Source URLs** - Direct links to where images are hosted
- ✅ **Image Metadata** - Dimensions, titles, and source information

## Testing Your Setup

After adding your API key:

1. Enter a product name (e.g., "iPhone 15")
2. Add domains (e.g., "apple.com, amazon.com")
3. Click "Start Scraping"
4. You should see **real product images from those domains**

## Rate Limits

- **Free tier**: 100 searches/month
- **Delay between searches**: 800ms (built-in to avoid rate limiting)
- **Upgrade options**: Available if you need more searches

## Troubleshooting

If you see placeholder images instead of real results:
1. Check that your API key is correctly set
2. Verify you haven't exceeded the monthly limit
3. Check the browser console for any error messages

## Support

- SerpAPI Documentation: https://serpapi.com/images-results
- API Status: https://serpapi.com/status
