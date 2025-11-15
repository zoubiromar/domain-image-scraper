'use client';

import { useState } from 'react';
import SimpleScraperForm from '@/components/SimpleScraperForm';
import SimpleResultsDisplay from '@/components/SimpleResultsDisplay';
import Link from 'next/link';

export default function DomainScraper() {
  const [results, setResults] = useState<any>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex flex-col">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="text-blue-600 hover:text-blue-700 mb-2 inline-block text-sm">
            ← Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <span className="text-2xl">🌐</span>
            Domain Web Scraper
          </h1>
          <p className="text-gray-600 mt-1">
            Find product images from specific e-commerce domains using Google Images
          </p>
        </div>
      </header>
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        <SimpleScraperForm onResults={setResults} />

        {results && (
          <div className="mt-8">
            <SimpleResultsDisplay results={results} />
          </div>
        )}
      </main>

      <footer className="mt-20 py-8 border-t border-gray-200 bg-white/50">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>
            © 2025 Image Scraper Suite - Built with Next.js & Vercel | 
            Made by{' '}
            <a 
              href="https://github.com/zoubiromar" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              Omar Zoubir
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}

