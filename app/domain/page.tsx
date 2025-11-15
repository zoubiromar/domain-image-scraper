'use client';

import { useState, useRef } from 'react';
import Papa from 'papaparse';
import Link from 'next/link';
import { FaUpload, FaPlay, FaTimes, FaCheck, FaDownload, FaSpinner } from 'react-icons/fa';

interface SerpApiResult {
  productName: string;
  images: Array<{
    rank: number;
    url: string;
    thumbnail: string;
    title: string;
    source_domain: string;
    source_url: string;
    score: number;
    matched_domain: string;
  }>;
  selectedImage?: number; // Index of selected image (0-2) or undefined
}

interface CostTracker {
  serpApiCalls: number;
  serpApiCost: number;
}

export default function DomainScraper() {
  const [csvData, setCsvData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [selectedColumn, setSelectedColumn] = useState<string>('');
  const [startRow, setStartRow] = useState<number>(1);
  const [rowLimit, setRowLimit] = useState<number>(10);
  const [domains, setDomains] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, phase: '' });
  const [results, setResults] = useState<SerpApiResult[]>([]);
  const [cost, setCost] = useState<CostTracker>({ serpApiCalls: 0, serpApiCost: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data.length === 0) {
          alert('CSV file is empty');
          return;
        }
        
        const cols = Object.keys(results.data[0]);
        setCsvData(results.data);
        setColumns(cols);
        setSelectedColumn(cols[0] || '');
      },
      error: (error: any) => {
        alert('Failed to parse CSV: ' + error.message);
      }
    });
  };

  const parseDomains = (text: string): string[] => {
    return text
      .split(/[\n,;]+/)
      .map(d => d.trim().toLowerCase())
      .filter(d => d.length > 0);
  };

  const handleStartScraping = async () => {
    if (!selectedColumn) {
      alert('Please select a column');
      return;
    }

    if (csvData.length === 0) {
      alert('Please upload a CSV file');
      return;
    }

    const doms = parseDomains(domains);
    if (doms.length === 0) {
      alert('Please enter at least one domain');
      return;
    }

    // Extract product names from selected column
    const productNames = csvData
      .slice(startRow - 1, startRow - 1 + rowLimit)
      .map(row => row[selectedColumn])
      .filter(name => name && typeof name === 'string' && name.trim().length > 0);

    if (productNames.length === 0) {
      alert('No product names found in the selected range');
      return;
    }

    setProcessing(true);
    setProgress({ current: 0, total: productNames.length, phase: 'Scraping images...' });
    setResults([]);

    try {
      // Call API with streaming response
      const response = await fetch('/api/scrape-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productNames,
          domains: doms
        })
      });

      if (!response.ok) {
        throw new Error('Failed to start scraping');
      }

      const data = await response.json();
      
      // Transform results into review format
      const reviewResults: SerpApiResult[] = productNames.map(name => {
        const images = data.results[name] || [];
        return {
          productName: name,
          images,
          selectedImage: images.length > 0 ? 0 : undefined // Auto-select first image if available
        };
      });

      setResults(reviewResults);
      setCost({
        serpApiCalls: data.totalSearches,
        serpApiCost: data.estimatedCost
      });
      setProgress({ current: productNames.length, total: productNames.length, phase: 'Complete' });
      setProcessing(false);

    } catch (error: any) {
      alert('Error: ' + (error.message || 'Scraping failed'));
      setProcessing(false);
    }
  };

  const handleImageSelect = (productIndex: number, imageIndex: number) => {
    const newResults = [...results];
    newResults[productIndex].selectedImage = imageIndex;
    setResults(newResults);
  };

  const handleDownloadResults = () => {
    const csvRows = [
      ['Product Name', 'Selected Image URL', 'Image Title', 'Source Domain', 'Source URL', 'Score']
    ];

    results.forEach(result => {
      const selectedIdx = result.selectedImage;
      if (selectedIdx !== undefined && result.images[selectedIdx]) {
        const img = result.images[selectedIdx];
        csvRows.push([
          result.productName,
          img.url,
          img.title,
          img.source_domain,
          img.source_url,
          img.score.toFixed(2)
        ]);
      } else {
        csvRows.push([result.productName, '', '', '', '', '']);
      }
    });

    const csvContent = Papa.unparse(csvRows);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `serpapi_results_${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
            Find top 3 product images from specific domains using Google Images (SerpAPI)
          </p>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        {/* Configuration Form */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Configuration</h2>

          <div className="space-y-6">
            {/* CSV Upload */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Upload CSV File
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-blue-50 hover:bg-blue-100 border-2 border-dashed border-blue-300 rounded-lg py-4 px-6 flex items-center justify-center gap-2 transition-colors"
                disabled={processing}
              >
                <FaUpload className="text-blue-600" />
                <span className="text-blue-700 font-medium">
                  {csvData.length > 0 ? `${csvData.length} rows loaded` : 'Click to upload CSV'}
                </span>
              </button>
            </div>

            {csvData.length > 0 && (
              <>
                {/* Column Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Select Product Name Column
                  </label>
                  <select
                    value={selectedColumn}
                    onChange={(e) => setSelectedColumn(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={processing}
                  >
                    {columns.map(col => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                </div>

                {/* Row Range */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Start Row
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={csvData.length}
                      value={startRow}
                      onChange={(e) => setStartRow(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={processing}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Rows to Process
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={csvData.length}
                      value={rowLimit}
                      onChange={(e) => setRowLimit(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={processing}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Domains */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Target Domains (one per line or comma-separated)
              </label>
              <textarea
                value={domains}
                onChange={(e) => setDomains(e.target.value)}
                placeholder="Example:&#10;amazon.com&#10;walmart.com&#10;target.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
                rows={4}
                disabled={processing}
              />
            </div>

            {/* Start Button */}
            <button
              onClick={handleStartScraping}
              disabled={processing || csvData.length === 0 || !selectedColumn}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold py-4 px-6 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg"
            >
              {processing ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Scraping... {progress.current}/{progress.total}
                </>
              ) : (
                <>
                  <FaPlay />
                  Start Scraping
                </>
              )}
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        {processing && progress.total > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>{progress.phase}</span>
              <span>{progress.current}/{progress.total} ({Math.round((progress.current / progress.total) * 100)}%)</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Cost Tracker */}
        {cost.serpApiCalls > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h3 className="text-lg font-bold text-gray-800 mb-4">API Usage & Cost</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-sm text-gray-600">SerpAPI Calls</div>
                <div className="text-2xl font-bold text-blue-600">{cost.serpApiCalls}</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-sm text-gray-600">Estimated Cost</div>
                <div className="text-2xl font-bold text-green-600">${cost.serpApiCost.toFixed(4)}</div>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800">
                Review & Select Images ({results.length} products)
              </h3>
              <button
                onClick={handleDownloadResults}
                className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2 transition-colors"
              >
                <FaDownload />
                Download CSV
              </button>
            </div>

            <div className="space-y-6">
              {results.map((result, productIdx) => (
                <div key={productIdx} className="border border-gray-200 rounded-lg p-6">
                  <h4 className="font-bold text-lg text-gray-800 mb-4">{result.productName}</h4>
                  
                  {result.images.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No images found (all results below threshold 5.0)
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {result.images.map((img, imgIdx) => (
                        <div
                          key={imgIdx}
                          onClick={() => handleImageSelect(productIdx, imgIdx)}
                          className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                            result.selectedImage === imgIdx
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-200 hover:border-blue-300'
                          }`}
                        >
                          {result.selectedImage === imgIdx && (
                            <div className="flex justify-end mb-2">
                              <div className="bg-green-500 text-white rounded-full p-1">
                                <FaCheck size={12} />
                              </div>
                            </div>
                          )}
                          <img
                            src={img.thumbnail}
                            alt={img.title}
                            className="w-full h-48 object-contain mb-3 bg-gray-50 rounded"
                          />
                          <div className="text-sm">
                            <div className="font-medium text-gray-700 truncate" title={img.title}>
                              {img.title}
                            </div>
                            <div className="text-gray-500 mt-1">
                              Score: <span className="font-semibold">{img.score.toFixed(2)}</span>
                            </div>
                            <div className="text-gray-500 truncate" title={img.source_domain}>
                              {img.source_domain}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
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
