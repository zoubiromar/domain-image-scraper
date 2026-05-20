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
            AI-Powered Product Matching and Image Search
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
            Pick the workflow that fits your data
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {/* Catalog Matcher Card */}
          <Link href="/matcher" className="group">
            <div className="bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 p-8 border-2 border-gray-200 hover:border-blue-500 transform hover:-translate-y-1">
              <div className="mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <ShoppingCart className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  Catalog Matcher
                </h3>
                <p className="text-gray-600">
                  Match noisy product names to your catalog
                </p>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>Embeddings + GPT verification</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>Handles spelling variations</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>Batch processing with progress</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>Returns image URL, UPC, photo ID</span>
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
                  Domain Image Scraper
                </h3>
                <p className="text-gray-600">
                  Pull product images from a target retailer
                </p>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  <span>Google Images restricted to a domain</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  <span>Multi-factor scoring and ranking</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  <span>Quality filtering (score &gt;= 5.0)</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  <span>SerpAPI backend</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-purple-600 font-semibold group-hover:text-purple-700">
                <span>Start Scraping</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          {/* QA Helper Card */}
          <Link href="/qa" className="group">
            <div className="bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 p-8 border-2 border-gray-200 hover:border-green-500 transform hover:-translate-y-1">
              <div className="mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <span className="text-2xl font-bold text-white">QA</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  Listing QA
                </h3>
                <p className="text-gray-600">
                  Automated QA for product names and images
                </p>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>Name and text QA (bilingual support)</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>Image verification (GPT-4o vision)</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>Batch processing (30 items/batch)</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>Cost tracking and CSV export</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-green-600 font-semibold group-hover:text-green-700">
                <span>Start QA</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        </div>

        {/* Info Section */}
        <div className="text-center max-w-3xl mx-auto">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">
            Which tool fits?
          </h3>
          <div className="grid md:grid-cols-3 gap-6 text-left">
            <div className="bg-white/70 backdrop-blur-sm rounded-lg p-6">
              <h4 className="font-bold text-blue-600 mb-2">Catalog Matcher:</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>You have a noisy list of product names</li>
                <li>You want to map them to a known catalog</li>
                <li>You need UPC, photo ID, and image URL back</li>
                <li>You want AI verification on uncertain matches</li>
              </ul>
            </div>
            <div className="bg-white/70 backdrop-blur-sm rounded-lg p-6">
              <h4 className="font-bold text-purple-600 mb-2">Domain Scraper:</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>You need images from a specific retailer site</li>
                <li>You have product names but no catalog match yet</li>
                <li>You want ranked candidate images per product</li>
              </ul>
            </div>
            <div className="bg-white/70 backdrop-blur-sm rounded-lg p-6">
              <h4 className="font-bold text-green-600 mb-2">Listing QA:</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>You want to validate naming and formatting</li>
                <li>You need image-text consistency checks</li>
                <li>You want bilingual (FR/EN) name validation</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-20 py-8 border-t border-gray-200 bg-white/50">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>
            Built with Next.js and Vercel.{' '}
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
