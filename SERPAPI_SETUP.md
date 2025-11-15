# SerpAPI Setup Guide

## Overview
The Domain Web Scraper now uses SerpAPI for Google Image searches, returning the top 3 images per product (with score ≥ 5.0).

## Features
✅ CSV Upload with column selection  
✅ Row range selection (Start Row + Rows to Process)  
✅ Top 3 images per product (threshold: 5.0)  
✅ Interactive image selection  
✅ Cost tracking (SerpAPI: $5 per 1000 searches)  
✅ Environment variable support for API key  

## Setting Up SERPAPI_KEY in Vercel

### Step 1: Get Your SerpAPI Key
1. Go to [SerpAPI](https://serpapi.com/)
2. Sign up or log in
3. Copy your API key from the dashboard

### Step 2: Add to Vercel Environment Variables
1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add a new variable:
   - **Name**: `SERPAPI_KEY`
   - **Value**: Your SerpAPI key (e.g., `abc123def456...`)
   - **Environments**: Select all (Production, Preview, Development)
4. Click **Save**

### Step 3: Redeploy
1. Go to **Deployments**
2. Click the three dots on the latest deployment
3. Click **Redeploy**
4. Wait for the deployment to complete

## Pricing
- **SerpAPI**: $5.00 per 1,000 searches
- The app shows real-time cost tracking in the UI

## Usage Example
1. Upload a CSV with product names
2. Select the column containing product names
3. Set start row and number of rows to process
4. Enter target domains (e.g., `amazon.com, walmart.com`)
5. Click **Start Scraping**
6. Review the top 3 images for each product
7. Select your preferred image for each product
8. Download the results as CSV

## Notes
- The scraper adds an 800ms delay between searches to avoid rate limiting
- Results are filtered to show only images with score ≥ 5.0
- You can process up to hundreds of products in one batch
- The timeout has been extended to 5 minutes for large batches
