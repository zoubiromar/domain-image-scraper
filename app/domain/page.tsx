'use client';

import { useState, useRef, useEffect } from 'react';
import Papa from 'papaparse';
import Link from 'next/link';
import { FaUpload, FaPlay, FaTimes, FaCheck, FaDownload, FaSpinner, FaHistory, FaStopCircle } from 'react-icons/fa';
import SessionHistory from '@/components/SessionHistory';

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
}

export default function DomainScraper() {
  const [csvData, setCsvData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [selectedColumn, setSelectedColumn] = useState<string>('');
  const [startRow, setStartRow] = useState<number>(1);
  const [rowLimit, setRowLimit] = useState<number>(10);
  const [domains, setDomains] = useState<string[]>([]);
  const [currentDomain, setCurrentDomain] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, phase: '' });
  const [results, setResults] = useState<SerpApiResult[]>([]);
  const [cost, setCost] = useState<CostTracker>({ serpApiCalls: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showOnlyWithImages, setShowOnlyWithImages] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // History and Cancel
  const [savedSessions, setSavedSessions] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [cancelRequested, setCancelRequested] = useState(false);

  // Session management
  const saveSession = (results: SerpApiResult[], cost: CostTracker, completed: boolean, error?: string) => {
    try {
      const session = {
        timestamp: new Date().toISOString(),
        results,
        cost,
        rowCount: results.length,
        completed,
        error,
        config: { domains, itemsPerPage },
      };
      const key = `domain_session_${Date.now()}`;
      localStorage.setItem(key, JSON.stringify(session));
      loadSessions();
    } catch (e) {
      console.error('[Domain] Failed to save session:', e);
    }
  };

  const loadSessions = () => {
    try {
      const keys = Object.keys(localStorage).filter(k => k.startsWith('domain_session_'));
      const sessions = keys.map(key => {
        const data = localStorage.getItem(key);
        return data ? { ...JSON.parse(data), key } : null;
      }).filter(Boolean).sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      setSavedSessions(sessions);
    } catch (e) {
      console.error('[Domain] Failed to load sessions:', e);
    }
  };

  const loadSessionData = (session: any) => {
    setResults(session.results);
    setCost(session.cost);
    setShowHistory(false);
    alert(`Loaded ${session.rowCount} results from ${new Date(session.timestamp).toLocaleString()}`);
  };

  const deleteSession = (key: string) => {
    localStorage.removeItem(key);
    loadSessions();
  };

  const clearAllSessions = () => {
    if (confirm('Clear all Domain Scraper sessions? This cannot be undone.')) {
      const keys = Object.keys(localStorage).filter(k => k.startsWith('domain_session_'));
      keys.forEach(k => localStorage.removeItem(k));
      loadSessions();
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

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
        
        const firstRow = results.data[0] as Record<string, any>;
        const cols = Object.keys(firstRow);
        setCsvData(results.data);
        setColumns(cols);
        setSelectedColumn(cols[0] || '');
      },
      error: (error: any) => {
        alert('Failed to parse CSV: ' + error.message);
      }
    });
  };

  const normalizeDomain = (domain: string): string => {
    // Remove protocol (http://, https://)
    let normalized = domain.replace(/^https?:\/\//, '');
    
    // Remove www.
    normalized = normalized.replace(/^www\./, '');
    
    // Remove trailing slashes and paths
    normalized = normalized.split('/')[0];
    
    // Remove port numbers
    normalized = normalized.split(':')[0];
    
    // Convert to lowercase and trim
    return normalized.toLowerCase().trim();
  };

  const handleAddDomain = () => {
    if (currentDomain.trim()) {
      const normalized = normalizeDomain(currentDomain);
      if (normalized && !domains.includes(normalized)) {
        setDomains([...domains, normalized]);
        setCurrentDomain('');
      }
    }
  };

  const handleRemoveDomain = (index: number) => {
    setDomains(domains.filter((_, i) => i !== index));
  };

  const handleDomainKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddDomain();
    }
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

    if (domains.length === 0) {
      alert('Please add at least one domain');
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
    setCancelRequested(false);
    setProgress({ current: 0, total: productNames.length, phase: 'Scraping images...' });
    setResults([]);

    const allResults: SerpApiResult[] = [];

    try {
      // Process in batches for cancellation support and progress saving
      const BATCH_SIZE = 10;
      const totalBatches = Math.ceil(productNames.length / BATCH_SIZE);

      for (let batchIdx = 0; batchIdx < totalBatches; batchIdx++) {
        // Check for cancel request
        if (cancelRequested) {
          console.log('[Domain] Cancel requested');
          saveSession(allResults, { serpApiCalls: allResults.length }, false, 'Cancelled by user');
          alert(`Scraping cancelled. ${allResults.length} items were processed and saved to History.`);
          setResults(allResults);
          setProcessing(false);
          return;
        }

        const batchStart = batchIdx * BATCH_SIZE;
        const batchEnd = Math.min(batchStart + BATCH_SIZE, productNames.length);
        const batchNames = productNames.slice(batchStart, batchEnd);

        setProgress({
          current: batchStart,
          total: productNames.length,
          phase: `Scraping batch ${batchIdx + 1}/${totalBatches}...`
        });

        const response = await fetch('/api/scrape-batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productNames: batchNames,
            domains: domains
          })
        });

        if (!response.ok) {
          throw new Error('Failed to scrape batch');
        }

        const data = await response.json();

        // Transform batch results
        const batchResults: SerpApiResult[] = batchNames.map(name => {
          const images = data.results[name] || [];
          return {
            productName: name,
            images,
            selectedImage: images.length > 0 ? 0 : undefined
          };
        });

        allResults.push(...batchResults);

        // Save progress after each batch
        saveSession(allResults, { serpApiCalls: allResults.length }, false);
      }

      setResults(allResults);
      setCost({ serpApiCalls: allResults.length });
      setProgress({ current: productNames.length, total: productNames.length, phase: 'Complete' });
      
      // Save final completed session
      saveSession(allResults, { serpApiCalls: allResults.length }, true);
      
      setProcessing(false);
      setCurrentPage(1);

    } catch (error: any) {
      // Save partial results on error
      if (allResults.length > 0) {
        saveSession(allResults, { serpApiCalls: allResults.length }, false, error.message);
        setResults(allResults);
        alert(`Error occurred but ${allResults.length} items were saved!\n\nError: ${error.message}\n\nPartial results are shown below and saved in History.`);
      } else {
        alert('Error: ' + (error.message || 'Scraping failed'));
      }
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
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                <span className="text-2xl">🌐</span>
                Domain Web Scraper
              </h1>
              <p className="text-gray-600 mt-1">
                Find top 3 product images from specific domains using Google Images (SerpAPI, threshold: 0.3)
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowHistory(true)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg transition-colors relative"
                disabled={processing}
              >
                <FaHistory />
                <span className="text-sm font-medium">History</span>
                {savedSessions.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {savedSessions.length}
                  </span>
                )}
              </button>
              {processing && (
                <button
                  onClick={() => setCancelRequested(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
                >
                  <FaStopCircle />
                  <span className="text-sm font-medium">Cancel</span>
                </button>
              )}
            </div>
          </div>
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
                Target Domains
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={currentDomain}
                  onChange={(e) => setCurrentDomain(e.target.value)}
                  onKeyPress={handleDomainKeyPress}
                  placeholder="Enter domain (e.g., metro.ca, www.amazon.com, https://walmart.com)"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={processing}
                />
                <button
                  onClick={handleAddDomain}
                  disabled={processing || !currentDomain.trim()}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center transition-colors"
                >
                  <span className="text-2xl">+</span>
                </button>
              </div>
              
              {domains.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="text-sm text-gray-600 mb-2 font-medium">Added Domains ({domains.length}):</div>
                  <div className="flex flex-wrap gap-2">
                    {domains.map((domain, index) => (
                      <div
                        key={index}
                        className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center gap-2 text-sm"
                      >
                        <span>{domain}</span>
                        <button
                          onClick={() => handleRemoveDomain(index)}
                          className="text-blue-600 hover:text-blue-800 font-bold"
                          disabled={processing}
                        >
                          <FaTimes />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <p className="text-xs text-gray-500 mt-2">
                💡 You can enter domains with or without www. or https:// - they will be normalized automatically
              </p>
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

        {/* API Usage Tracker */}
        {cost.serpApiCalls > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h3 className="text-lg font-bold text-gray-800 mb-4">API Usage</h3>
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-sm text-gray-600 mb-1">SerpAPI Calls</div>
              <div className="text-3xl font-bold text-blue-600">{cost.serpApiCalls}</div>
            </div>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (() => {
          // Filter results based on checkbox
          const filteredResults = showOnlyWithImages 
            ? results.filter(r => r.images.length > 0)
            : results;
          
          // Pagination calculations
          const totalPages = Math.ceil(filteredResults.length / itemsPerPage);
          const startIndex = (currentPage - 1) * itemsPerPage;
          const endIndex = startIndex + itemsPerPage;
          const paginatedResults = filteredResults.slice(startIndex, endIndex);
          
          const handlePreviousPage = () => {
            setCurrentPage(prev => Math.max(1, prev - 1));
          };
          
          const handleNextPage = () => {
            setCurrentPage(prev => Math.min(totalPages, prev + 1));
          };
          
          // Reset to page 1 if current page exceeds total pages
          if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(1);
          }
          
          return (
            <div className="bg-white rounded-xl shadow-lg p-8">
              {/* Header with controls */}
              <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <h3 className="text-2xl font-bold text-gray-800">
                  Review & Select Images ({filteredResults.length} products)
                </h3>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleDownloadResults}
                    className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <FaDownload />
                    Download CSV
                  </button>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={5}>5 per page</option>
                    <option value={10}>10 per page</option>
                    <option value={20}>20 per page</option>
                    <option value={50}>50 per page</option>
                  </select>
                </div>
              </div>

              {/* Filter checkbox */}
              <div className="mb-6">
                <label className="flex items-center gap-2 text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showOnlyWithImages}
                    onChange={(e) => {
                      setShowOnlyWithImages(e.target.checked);
                      setCurrentPage(1);
                    }}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium">Show only items with suggested images</span>
                </label>
              </div>

              {/* Pagination controls - Top */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mb-6 pb-4 border-b border-gray-200">
                  <button
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 text-gray-700 font-medium rounded-lg transition-colors"
                  >
                    Previous
                  </button>
                  <span className="text-gray-700 font-semibold">
                    Page {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 text-gray-700 font-medium rounded-lg transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}

              <div className="space-y-6">
                {paginatedResults.map((result, productIdx) => {
                  // Get original index for selection handlers
                  const originalIdx = results.findIndex(r => r.productName === result.productName);
                  return (
                    <div key={productIdx} className="border border-gray-200 rounded-lg p-6">
                      <h4 className="font-bold text-lg text-gray-800 mb-4">{result.productName}</h4>
                      
                      {result.images.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          No images found (all results below threshold 0.3)
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {result.images.map((img, imgIdx) => (
                            <div
                              key={imgIdx}
                              onClick={() => handleImageSelect(originalIdx, imgIdx)}
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
                  );
                })}
              </div>

              {/* Pagination controls - Bottom */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-6 pt-4 border-t border-gray-200">
                  <button
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 text-gray-700 font-medium rounded-lg transition-colors"
                  >
                    Previous
                  </button>
                  <span className="text-gray-700 font-semibold">
                    Page {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 text-gray-700 font-medium rounded-lg transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          );
        })()}

        {/* History Modal */}
        {showHistory && (
          <SessionHistory
            sessions={savedSessions}
            onLoad={loadSessionData}
            onDelete={deleteSession}
            onClearAll={clearAllSessions}
            onClose={() => setShowHistory(false)}
            toolName="Domain Scraper"
          />
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
