import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { RealScraper } from '@/lib/scraper-v2';
import { getStorage } from '@/lib/storage';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { item_names, domains, extra_keyword, max_results_per_item = 5, top_n = 3 } = body;

    // Validate input
    if (!item_names || !Array.isArray(item_names) || item_names.length === 0) {
      return NextResponse.json(
        { error: 'item_names is required and must be a non-empty array' },
        { status: 400 }
      );
    }

    if (!domains || !Array.isArray(domains) || domains.length === 0) {
      return NextResponse.json(
        { error: 'domains is required and must be a non-empty array' },
        { status: 400 }
      );
    }

    // Generate task ID
    const taskId = uuidv4();

    // Create scraper instance
    const scraper = new RealScraper();
    
    // Get storage instance
    const storage = getStorage();
    
    // Start scraping with real images
    const results = await scraper.scrapeImages({
      itemNames: item_names,
      domains,
      extraKeyword: extra_keyword || '',
      maxResults: max_results_per_item,
      topN: top_n,
    });

    // Store results using persistent storage
    await storage.set(taskId, {
      status: 'completed',
      results,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      task_id: taskId,
      status: 'completed',
      message: 'Scraping completed successfully',
    });
  } catch (error) {
    console.error('Scraping error:', error);
    return NextResponse.json(
      { error: 'Failed to process scraping request' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Domain Image Scraper API',
    endpoints: {
      'POST /api/scrape': 'Start a new scraping task',
      'GET /api/results/[id]': 'Get results for a specific task',
    },
  });
}
