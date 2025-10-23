'use client';

import { useState } from 'react';
import ScraperForm from '@/components/ScraperForm';
import ResultsDisplay from '@/components/ResultsDisplay';
import Header from '@/components/Header';
import { ScrapingResult } from '@/lib/types';
import toast, { Toaster } from 'react-hot-toast';

export default function Home() {
  const [results, setResults] = useState<ScrapingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);

  const handleScrapeComplete = (data: ScrapingResult) => {
    setResults(data);
    setLoading(false);
  };

  const handleScrapeStart = (id: string) => {
    setTaskId(id);
    setLoading(true);
    toast.success('Scraping started! Please wait...');
  };

  return (
    <>
      <Toaster position="top-right" />
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Domain Image Scraper
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Find product images from specific e-commerce domains. 
            Enter product names and domains to get targeted image results.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <ScraperForm 
            onScrapeStart={handleScrapeStart}
            onScrapeComplete={handleScrapeComplete}
            loading={loading}
          />
        </div>

        {loading && (
          <div className="text-center py-12">
            <div className="inline-flex items-center space-x-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="text-lg text-gray-600">
                Searching for images... This may take a few moments
              </span>
            </div>
          </div>
        )}

        {results && !loading && (
          <div className="mt-12">
            <ResultsDisplay results={results} />
          </div>
        )}
      </main>

      <footer className="mt-20 py-8 border-t border-gray-200">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>© 2024 Domain Image Scraper - Built with Next.js & Vercel</p>
        </div>
      </footer>
    </>
  );
}
