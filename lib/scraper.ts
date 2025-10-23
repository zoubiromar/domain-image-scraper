// Mock Scraper for demonstration
// Replace this with real scraping logic when Playwright issues are resolved

export interface ScrapeOptions {
  itemNames: string[];
  domains: string[];
  extraKeyword?: string;
  maxResults?: number;
  topN?: number;
}

export interface ImageResult {
  rank: number;
  url: string;
  thumbnail: string;
  title: string;
  source_domain: string;
  score: number;
  confidence: number;
}

export class MockScraper {
  async scrapeImages(options: ScrapeOptions) {
    const { itemNames, domains, topN = 3 } = options;
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const results: Record<string, ImageResult[]> = {};
    
    for (const itemName of itemNames) {
      const images: ImageResult[] = [];
      
      for (let i = 0; i < Math.min(topN, 3); i++) {
        images.push({
          rank: i + 1,
          url: `https://via.placeholder.com/400x300/3b82f6/ffffff?text=${encodeURIComponent(itemName)}+${i + 1}`,
          thumbnail: `https://via.placeholder.com/150x150/3b82f6/ffffff?text=${encodeURIComponent(itemName)}`,
          title: `${itemName} - Product Image ${i + 1}`,
          source_domain: domains[0] || 'example.com',
          score: 0.95 - (i * 0.1),
          confidence: 0.90 - (i * 0.1),
        });
      }
      
      results[itemName] = images;
    }
    
    return results;
  }
}

// Real Scraper placeholder (for future implementation)
export class GoogleImagesScraper {
  // This will be implemented when Playwright issues are resolved
  // For now, it falls back to MockScraper
  async scrapeImages(options: ScrapeOptions) {
    const mockScraper = new MockScraper();
    return mockScraper.scrapeImages(options);
  }
}
