import { NextRequest, NextResponse } from 'next/server';
import { GoogleImageScraper } from '@/lib/google-image-scraper';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes max

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productNames, domains } = body;

    // Validate input
    if (!productNames || !Array.isArray(productNames) || productNames.length === 0) {
      return NextResponse.json(
        { error: 'productNames is required and must be a non-empty array' },
        { status: 400 }
      );
    }

    if (!domains || !Array.isArray(domains) || domains.length === 0) {
      return NextResponse.json(
        { error: 'domains is required and must be a non-empty array' },
        { status: 400 }
      );
    }

    // Get API key from environment
    const apiKey = process.env.SERPAPI_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'SERPAPI_KEY environment variable not set' },
        { status: 500 }
      );
    }

    // Create scraper instance
    const scraper = new GoogleImageScraper(apiKey);
    
    // Search for top 3 images for each product
    const results = await scraper.searchTop3ImagesForProducts(
      productNames,
      domains
    );

    // Calculate cost
    const totalSearches = productNames.length;
    const estimatedCost = GoogleImageScraper.calculateCost(totalSearches);

    return NextResponse.json({
      status: 'completed',
      results,
      totalSearches,
      estimatedCost,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('Scraping error:', error);
    return NextResponse.json(
      { 
        error: 'Scraping failed',
        details: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}

