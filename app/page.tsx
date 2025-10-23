'use client';

import { useState } from 'react';
import SimpleScraperForm from '@/components/SimpleScraperForm';
import SimpleResultsDisplay from '@/components/SimpleResultsDisplay';
import Header from '@/components/Header';

export default function Home() {
  const [results, setResults] = useState<any>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        <div className="text-center mb-8">
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Find the best product image from specific domains using Google Image Search.
            Returns only the highest-scoring image for each product.
          </p>
        </div>

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
            © 2025 Domain Image Scraper - Built with Next.js & Vercel | 
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