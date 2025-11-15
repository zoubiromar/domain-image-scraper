'use client';

import Link from 'next/link';
import { Search, ShoppingCart, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-800">
            Image Scraper Suite
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            AI-Powered Product Matching & Image Search
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-16 max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-800 mb-4">
            Choose Your Tool
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Select the matching method that best fits your needs
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* URPC Matcher Card */}
          <Link href="/urpc" className="group">
            <div className="bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 p-8 border-2 border-gray-200 hover:border-blue-500 transform hover:-translate-y-1">
              <div className="mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <ShoppingCart className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  🛒 URPC Image Scraper
                </h3>
                <p className="text-gray-600">
                  Match products against 244K+ database
                </p>
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>104K Alcohol + 140K CnG products</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>AI-powered matching (98% accuracy)</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>Handles spelling variations</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>~1 second per product</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-blue-600 font-semibold group-hover:text-blue-700">
                <span>Start Matching</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          {/* Domain Scraper Card */}
          <Link href="/domain" className="group">
            <div className="bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 p-8 border-2 border-gray-200 hover:border-purple-500 transform hover:-translate-y-1">
              <div className="mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Search className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  🌐 Domain Web Scraper
                </h3>
                <p className="text-gray-600">
                  Search Google Images from specific domains
                </p>
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  <span>Target specific e-commerce sites</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  <span>Multi-factor scoring & ranking</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  <span>Quality filtering (score &gt;= 5.0)</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  <span>SerpAPI powered</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-purple-600 font-semibold group-hover:text-purple-700">
                <span>Start Scraping</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        </div>

        {/* Info Section */}
        <div className="text-center max-w-3xl mx-auto">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">
            Which Tool Should I Use?
          </h3>
          <div className="grid md:grid-cols-2 gap-6 text-left">
            <div className="bg-white/70 backdrop-blur-sm rounded-lg p-6">
              <h4 className="font-bold text-blue-600 mb-2">Use URPC Matcher When:</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>✓ Matching alcohol, beer, wine, spirits</li>
                <li>✓ Matching snacks, drinks, candy, groceries</li>
                <li>✓ Products are in DoorDash catalog</li>
                <li>✓ Need UPC codes and photo IDs</li>
                <li>✓ Want 98% accuracy with AI verification</li>
              </ul>
            </div>
            <div className="bg-white/70 backdrop-blur-sm rounded-lg p-6">
              <h4 className="font-bold text-purple-600 mb-2">Use Domain Scraper When:</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>✓ General products (not in URPC database)</li>
                <li>✓ Need images from specific websites</li>
                <li>✓ Metro.ca, GiantTiger, Amazon, etc.</li>
                <li>✓ E-commerce catalogs</li>
                <li>✓ Want visual product images</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
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
