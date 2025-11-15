'use client';

import { useState, useEffect } from 'react';
import { Upload, FileSpreadsheet, Settings, Download, ArrowLeft } from 'lucide-react';
import Papa from 'papaparse';
import Link from 'next/link';
import ReviewCard from '@/components/ReviewCard';
import CostTracker from '@/components/CostTracker';

// Ensure this page is dynamically rendered
export const dynamic = 'force-dynamic';

interface MatchResult {
  productName: string;
  matchedName: string;
  matchedUrl: string;
  matchedUpc: string;
  matchedPhotoId: string;
  score: number;
  logs: string;
}

export default function URPCMatcher() {
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [selectedColumn, setSelectedColumn] = useState('');
  const [productType, setProductType] = useState<'alcohol' | 'cng'>('alcohol');
  const [reviewMode, setReviewMode] = useState<'interactive' | 'aionly'>('interactive');
  const [apiKey, setApiKey] = useState('');
  const [startRow, setStartRow] = useState(2);
  const [rowLimit, setRowLimit] = useState(50);
  const [processing, setProcessing] = useState(false);
  const [allResults, setAllResults] = useState<MatchResult[]>([]);
  const [reviewQueue, setReviewQueue] = useState<MatchResult[]>([]);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [reviewedResults, setReviewedResults] = useState<MatchResult[]>([]);
  const [autoAcceptedCount, setAutoAcceptedCount] = useState(0);
  const [progress, setProgress] = useState({ current: 0, total: 0, phase: '' });
  const [showReview, setShowReview] = useState(false);
  const [finalResults, setFinalResults] = useState<MatchResult[]>([]);
  const [apiStats, setApiStats] = useState({ embeddingCalls: 0, gptCalls: 0 });

  // Keyboard shortcuts for review
  useEffect(() => {
    if (!showReview || currentReviewIndex >= reviewQueue.length) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleKeep();
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        handleReject();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showReview, currentReviewIndex, reviewQueue]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;
    
    setFile(uploadedFile);
    
    Papa.parse(uploadedFile, {
      complete: (result) => {
        const data = result.data as any[];
        if (data.length > 0) {
          const headers = Object.keys(data[0]);
          setColumns(headers);
          setCsvData(data);
          
          if (headers.length > 0) {
            setSelectedColumn(headers[0]);
          }
        }
      },
      header: true,
      skipEmptyLines: true,
    });
  };

  const handleProcess = async () => {
    if (!selectedColumn || csvData.length === 0) {
      alert('Please select a column');
      return;
    }
    
    if (!apiKey) {
      alert('Please enter your OpenAI API key');
      return;
    }
    
    setProcessing(true);
    setProgress({ current: 0, total: rowLimit, phase: 'Initializing...' });
    setAllResults([]);
    setReviewQueue([]);
    setReviewedResults([]);
    setAutoAcceptedCount(0);
    setShowReview(false);
    setFinalResults([]);
    
    try {
      const products = csvData
        .slice(startRow - 1, startRow - 1 + rowLimit)
        .map(row => row[selectedColumn])
        .filter(name => name && name.trim());
      
      setProgress({ current: 0, total: products.length, phase: 'Processing products...' });
      
      // Process in smaller batches for progress updates
      const BATCH_SIZE = 10;
      const allBatchResults: MatchResult[] = [];
      
      for (let i = 0; i < products.length; i += BATCH_SIZE) {
        const batch = products.slice(i, i + BATCH_SIZE);
        setProgress({ 
          current: i, 
          total: products.length, 
          phase: `Processing batch ${Math.floor(i / BATCH_SIZE) + 1}...` 
        });
        
        const response = await fetch('/api/match', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            products: batch,
            productType,
            apiKey,
          }),
        });
        
        const data = await response.json();
        
        if (data.databaseMissing) {
          alert('⚠️ Database Not Available\n\nThe URPC database is not set up. Please use locally or contact admin.');
          setProcessing(false);
          return;
        }
        
        if (data.success) {
          allBatchResults.push(...data.results);
        } else {
          throw new Error(data.error || 'Processing failed');
        }
      }
      
      setProgress({ current: products.length, total: products.length, phase: 'Complete!' });
      setAllResults(allBatchResults);
      
      // Calculate API usage
      const matchedCount = allBatchResults.filter(r => r.matchedName).length;
      const estimatedEmbeddingCalls = products.length * 51; // Query + 50 candidates per product
      const estimatedGPTCalls = matchedCount; // One GPT call per matched product
      setApiStats({ 
        embeddingCalls: estimatedEmbeddingCalls, 
        gptCalls: estimatedGPTCalls 
      });
      
      // Handle based on review mode
      if (reviewMode === 'interactive') {
        // Separate results by score
        const highConfidence = allBatchResults.filter(r => r.matchedName && r.score >= 9);
        const needsReview = allBatchResults.filter(r => r.matchedName && r.score < 9 && r.score >= 5);
        const lowScore = allBatchResults.filter(r => !r.matchedName || r.score < 5);
        
        setAutoAcceptedCount(highConfidence.length);
        
        // Start with auto-accepted items
        const initialAccepted = highConfidence.map(r => ({ ...r, logs: r.logs + ' (Auto-accepted)' }));
        // Add low-score items as rejected
        const initialRejected = lowScore.map(r => ({ ...r, logs: r.logs || 'Rejected (score < 5)' }));
        
        setReviewedResults([...initialAccepted, ...initialRejected]);
        
        if (needsReview.length > 0) {
          // Show items that need review
          setReviewQueue(needsReview);
          setCurrentReviewIndex(0);
          setShowReview(true);
          setProcessing(false);
        } else {
          // No items to review - show all results
          setFinalResults([...initialAccepted, ...initialRejected]);
          setProcessing(false);
        }
      } else if (reviewMode === 'aionly') {
        // AI Only mode - auto-accept >= 9, reject < 9
        const approved = allBatchResults.filter(r => r.matchedName && r.score >= 9)
          .map(r => ({ ...r, logs: 'AI Approved (score >= 9)' }));
        const rejected = allBatchResults.filter(r => !r.matchedName || r.score < 9)
          .map(r => ({ ...r, logs: `Rejected by AI Only (score: ${r.score}/10)` }));
        
        // Show ALL results (approved + rejected)
        setFinalResults([...approved, ...rejected]);
        setProcessing(false);
      }
      
    } catch (error: any) {
      alert('Error: ' + (error.message || 'Processing failed'));
      setProcessing(false);
    }
  };

  const handleKeep = () => {
    const currentItem = reviewQueue[currentReviewIndex];
    const keptItem = { ...currentItem, logs: currentItem.logs + ' (Kept by user)' };
    const newReviewedResults = [...reviewedResults, keptItem];
    setReviewedResults(newReviewedResults);
    
    if (currentReviewIndex + 1 >= reviewQueue.length) {
      // Review complete - show ALL results
      setFinalResults(newReviewedResults);
      setShowReview(false);
    } else {
      setCurrentReviewIndex(currentReviewIndex + 1);
    }
  };

  const handleReject = () => {
    const currentItem = reviewQueue[currentReviewIndex];
    // Mark as rejected but still include in final results
    const rejectedItem = { 
      ...currentItem, 
      matchedName: '', // Clear match data
      matchedUrl: '',
      matchedUpc: '',
      matchedPhotoId: '',
      logs: `Rejected by user (original score: ${currentItem.score}/10)` 
    };
    const newReviewedResults = [...reviewedResults, rejectedItem];
    setReviewedResults(newReviewedResults);
    
    if (currentReviewIndex + 1 >= reviewQueue.length) {
      // Review complete - show ALL results (including rejected)
      setFinalResults(newReviewedResults);
      setShowReview(false);
    } else {
      setCurrentReviewIndex(currentReviewIndex + 1);
    }
  };

  const downloadCSV = () => {
    const csv = Papa.unparse(finalResults);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'urpc_matched_results.csv';
    a.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:text-blue-700 mb-4 inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-gray-800 flex items-center gap-3">
            <span className="text-3xl">🛒</span>
            URPC Image Scraper
          </h1>
          <p className="text-gray-600 mt-2">
            Match products against 244K+ Alcohol & CnG database with AI verification
          </p>
        </div>

        {/* Interactive Review Mode */}
        {showReview && reviewQueue.length > 0 && currentReviewIndex < reviewQueue.length && (
          <div className="mb-8">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800">
                <strong>Interactive Review Mode:</strong> Reviewing uncertain matches (score 5-8). 
                {autoAcceptedCount > 0 && ` ${autoAcceptedCount} high-confidence matches (score 9-10) were auto-accepted.`}
              </p>
            </div>
            <ReviewCard
              originalName={reviewQueue[currentReviewIndex].productName}
              matchedName={reviewQueue[currentReviewIndex].matchedName}
              matchedUrl={reviewQueue[currentReviewIndex].matchedUrl}
              score={reviewQueue[currentReviewIndex].score}
              upc={reviewQueue[currentReviewIndex].matchedUpc}
              photoId={reviewQueue[currentReviewIndex].matchedPhotoId}
              onKeep={handleKeep}
              onReject={handleReject}
              currentIndex={currentReviewIndex + 1}
              totalItems={reviewQueue.length}
            />
          </div>
        )}

        {/* Configuration Form (hidden during review) */}
        {!showReview && (
          <>
            {/* File Upload */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-200">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-600" />
                Upload CSV File
              </h2>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 mb-2">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">CSV files only</p>
                </label>
              </div>
              {file && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-900">
                    📄 {file.name}
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    {csvData.length} rows loaded
                  </p>
                </div>
              )}
            </div>
            
            {/* Configuration */}
            {columns.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-200">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-blue-600" />
                  Configuration
                </h2>
                
                <div className="space-y-6">
                  {/* Product Type */}
                  <fieldset className="border border-gray-200 rounded-lg p-4 bg-gray-50 shadow-sm">
                    <legend className="text-sm font-semibold text-gray-700 px-2">Product Type</legend>
                    <div className="flex gap-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          value="alcohol"
                          checked={productType === 'alcohol'}
                          onChange={(e) => setProductType(e.target.value as 'alcohol')}
                          className="w-4 h-4"
                        />
                        <span className="text-base font-medium flex items-center gap-1.5">
                          <span className="text-xl">🍺</span> Alcohol
                        </span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          value="cng"
                          checked={productType === 'cng'}
                          onChange={(e) => setProductType(e.target.value as 'cng')}
                          className="w-4 h-4"
                        />
                        <span className="text-base font-medium flex items-center gap-1.5">
                          <span className="text-xl">🍿</span> CnG
                        </span>
                      </label>
                    </div>
                  </fieldset>
                  
                  {/* Column Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Item Name Column
                    </label>
                    <select
                      value={selectedColumn}
                      onChange={(e) => setSelectedColumn(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {columns.map(col => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* OpenAI API Key */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      OpenAI API Key
                    </label>
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="sk-..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Required for AI-powered matching (~$0.00015 per product)
                    </p>
                  </div>
                  
                  {/* Row Settings */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Starting Row
                      </label>
                      <input
                        type="number"
                        value={startRow}
                        onChange={(e) => setStartRow(Number(e.target.value))}
                        min={1}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rows to Process
                      </label>
                      <input
                        type="number"
                        value={rowLimit}
                        onChange={(e) => setRowLimit(Number(e.target.value))}
                        min={1}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Recommended: 50-500 for optimal performance
                      </p>
                    </div>
                  </div>
                  
                  {/* Review Mode */}
                  <fieldset className="border border-gray-200 rounded-lg p-4 bg-gray-50 shadow-sm">
                    <legend className="text-sm font-semibold text-gray-700 px-2">Review Mode</legend>
                    <div className="space-y-3">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="radio"
                          value="interactive"
                          checked={reviewMode === 'interactive'}
                          onChange={(e) => setReviewMode(e.target.value as 'interactive')}
                          className="w-4 h-4 mt-1"
                        />
                        <div>
                          <div className="font-medium flex items-center gap-1.5">
                            <span className="text-base">👁️</span> Interactive Review Mode
                          </div>
                          <div className="text-xs text-gray-600 mt-0.5">
                            Review uncertain matches (score 5-8), auto-accept confident matches (9-10)
                          </div>
                        </div>
                      </label>
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="radio"
                          value="aionly"
                          checked={reviewMode === 'aionly'}
                          onChange={(e) => setReviewMode(e.target.value as 'aionly')}
                          className="w-4 h-4 mt-1"
                        />
                        <div>
                          <div className="font-medium flex items-center gap-1.5">
                            <span className="text-base">🤖</span> AI Review Only Mode
                          </div>
                          <div className="text-xs text-gray-600 mt-0.5">
                            Auto-reject uncertain matches (score &lt; 9), no user review needed
                          </div>
                        </div>
                      </label>
                    </div>
                  </fieldset>
                </div>
                
                {/* Process Button */}
                <button
                  onClick={handleProcess}
                  disabled={processing || !selectedColumn || !apiKey}
                  className="w-full mt-6 bg-blue-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-md"
                >
                  {processing ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin">⏳</span>
                      {progress.phase} ({progress.current}/{progress.total})
                    </span>
                  ) : (
                    'Start Matching'
                  )}
                </button>
              </div>
            )}
          </>
        )}
        
        {/* Progress Bar During Processing */}
        {processing && !showReview && (
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">{progress.phase}</span>
                <span className="text-gray-600">{progress.current}/{progress.total}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` }}
                />
              </div>
            </div>
            <p className="text-sm text-gray-600 text-center">
              Processing with AI verification... This may take a few moments.
            </p>
          </div>
        )}
        
        {/* Final Results */}
        {!showReview && !processing && finalResults.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                ✅ Results ({finalResults.length})
              </h2>
              <button
                onClick={downloadCSV}
                className="flex items-center gap-2 bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors shadow-md"
              >
                <Download className="w-4 h-4" />
                Download CSV
              </button>
            </div>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                <div className="text-3xl font-bold text-blue-600">{finalResults.length}</div>
                <div className="text-sm text-blue-700 mt-1">Total Matched</div>
              </div>
              {reviewMode === 'interactive' && autoAcceptedCount > 0 && (
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                  <div className="text-3xl font-bold text-green-600">{autoAcceptedCount}</div>
                  <div className="text-sm text-green-700 mt-1">Auto-Accepted (9-10)</div>
                </div>
              )}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                <div className="text-3xl font-bold text-purple-600">
                  {finalResults.filter(r => r.score >= 9).length}
                </div>
                <div className="text-sm text-purple-700 mt-1">High Confidence</div>
              </div>
            </div>
            
            {/* Results Table */}
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left p-3 font-semibold">Product</th>
                    <th className="text-left p-3 font-semibold">Matched Name</th>
                    <th className="text-left p-3 font-semibold">UPC</th>
                    <th className="text-left p-3 font-semibold">Photo ID</th>
                    <th className="text-left p-3 font-semibold">Score</th>
                    <th className="text-left p-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {finalResults.map((result, i) => (
                    <tr key={i} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="p-3 font-medium">{result.productName}</td>
                      <td className="p-3">{result.matchedName || <span className="text-gray-400 italic">No match</span>}</td>
                      <td className="p-3 font-mono text-xs">{result.matchedUpc || '-'}</td>
                      <td className="p-3 font-mono text-xs">{result.matchedPhotoId || '-'}</td>
                      <td className="p-3">
                        {result.score > 0 ? (
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            result.score >= 9 ? 'bg-green-100 text-green-800' :
                            result.score >= 7 ? 'bg-yellow-100 text-yellow-800' :
                            result.score >= 5 ? 'bg-orange-100 text-orange-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {result.score.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="p-3 text-xs text-gray-600">{result.logs}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Cost Tracker */}
            <div className="mt-6">
              <CostTracker
                totalProducts={finalResults.length}
                matchedProducts={finalResults.filter(r => r.matchedName).length}
                embeddingCalls={apiStats.embeddingCalls}
                gptCalls={apiStats.gptCalls}
                productType={productType}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
