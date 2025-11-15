'use client';

import { useState } from 'react';
import { Upload, FileSpreadsheet, Settings, Download } from 'lucide-react';
import Papa from 'papaparse';
import Link from 'next/link';

export default function URPCMatcher() {
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [selectedColumn, setSelectedColumn] = useState('');
  const [productType, setProductType] = useState<'alcohol' | 'cng'>('alcohol');
  const [reviewMode, setReviewMode] = useState<'interactive' | 'aionly'>('interactive');
  const [apiKey, setApiKey] = useState('');
  const [startRow, setStartRow] = useState(2);
  const [rowLimit, setRowLimit] = useState(10);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

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
          
          // Auto-select first column
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
    setProgress({ current: 0, total: rowLimit });
    
    try {
      // Extract product names from selected column
      const products = csvData
        .slice(startRow - 1, startRow - 1 + rowLimit)
        .map(row => row[selectedColumn])
        .filter(name => name && name.trim());
      
      // Call API
      const response = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          products,
          productType,
          apiKey,
        }),
      });
      
      const data = await response.json();
      
      if (data.databaseMissing) {
        alert('⚠️ Database Not Available\n\nThe URPC database is not set up on this deployment.\n\nPlease use the tool locally with "npm run dev" or contact the administrator to set up the database on Vercel.');
        setProcessing(false);
        return;
      }
      
      if (data.success) {
        let finalResults = data.results;
        
        // Filter for AI Only mode (only score >= 9)
        if (reviewMode === 'aionly') {
          finalResults = data.results.filter((r: any) => r.score >= 9);
        }
        
        setResults(finalResults);
        
        const matched = finalResults.filter((r: any) => r.matchedName).length;
        const rejected = reviewMode === 'aionly' 
          ? data.results.length - matched 
          : data.results.length - matched;
        
        alert(`Matching complete! Matched: ${matched}, Rejected: ${rejected}`);
      } else {
        alert('Error: ' + (data.error || 'Unknown error occurred'));
      }
    } catch (error: any) {
      alert('Error: ' + (error.message || 'Failed to connect to server'));
    } finally {
      setProcessing(false);
    }
  };

  const downloadCSV = () => {
    const csv = Papa.unparse(results);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'urpc_matched_results.csv';
    a.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header with Navigation */}
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-gray-800 flex items-center gap-3">
            <span className="text-3xl">🛒</span>
            URPC Image Scraper
          </h1>
          <p className="text-gray-600 mt-2">
            Match products against 244K+ Alcohol & CnG database with AI verification
          </p>
        </div>
        
        {/* File Upload Section */}
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
        
        {/* Configuration Section */}
        {columns.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-200">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-600" />
              Configuration
            </h2>
            
            <div className="space-y-6">
              {/* Product Type */}
              <fieldset className="border border-gray-200 rounded-lg p-4 bg-gray-50">
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
                    Rows to Process (Max: 200)
                  </label>
                  <input
                    type="number"
                    value={rowLimit}
                    onChange={(e) => setRowLimit(Math.min(Number(e.target.value), 200))}
                    min={1}
                    max={200}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              {/* Review Mode */}
              <fieldset className="border border-gray-200 rounded-lg p-4 bg-gray-50">
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
                        Review uncertain matches, recommended for smaller batches
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
                        Skip uncertain matches (score &lt; 9), recommended for larger batches
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
                  Processing... ({progress.current}/{progress.total})
                </span>
              ) : (
                'Start Matching'
              )}
            </button>
          </div>
        )}
        
        {/* Results Section */}
        {results.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                Results ({results.length})
              </h2>
              <button
                onClick={downloadCSV}
                className="flex items-center gap-2 bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download CSV
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left p-3 font-semibold">Product</th>
                    <th className="text-left p-3 font-semibold">Matched Name</th>
                    <th className="text-left p-3 font-semibold">UPC</th>
                    <th className="text-left p-3 font-semibold">Photo ID</th>
                    <th className="text-left p-3 font-semibold">Score</th>
                    <th className="text-left p-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result, i) => (
                    <tr key={i} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="p-3 font-medium">{result.productName}</td>
                      <td className="p-3">{result.matchedName || '-'}</td>
                      <td className="p-3 font-mono text-xs">{result.matchedUpc || '-'}</td>
                      <td className="p-3 font-mono text-xs">{result.matchedPhotoId || '-'}</td>
                      <td className="p-3">
                        {result.score ? (
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
            
            {/* Stats */}
            <div className="mt-6 grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{results.length}</div>
                <div className="text-xs text-gray-600">Total Processed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {results.filter(r => r.matchedName).length}
                </div>
                <div className="text-xs text-gray-600">Matched</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">
                  {results.filter(r => !r.matchedName).length}
                </div>
                <div className="text-xs text-gray-600">No Match</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

