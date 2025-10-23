'use client';

import { useState, useRef } from 'react';
import { FaSearch, FaUpload, FaSpinner, FaFlask } from 'react-icons/fa';

interface Props {
  onResults: (results: any) => void;
}

export default function SimpleScraperForm({ onResults }: Props) {
  const [loading, setLoading] = useState(false);
  const [itemNames, setItemNames] = useState('');
  const [domains, setDomains] = useState('');
  const [taskId, setTaskId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseItems = (text: string): string[] => {
    const items = text
      .split(/[\n,;]+/)
      .map(item => item.trim())
      .filter(item => item.length > 0);
    
    return [...new Set(items)];
  };

  const parseDomains = (text: string): string[] => {
    const doms = text
      .split(/[\n,;]+/)
      .map(d => d.trim().toLowerCase())
      .filter(d => d.length > 0);
    
    return [...new Set(doms)];
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      
      // Look for "Product Name" column or just use all non-empty lines
      let products: string[] = [];
      
      if (lines[0]?.toLowerCase().includes('product')) {
        // Skip header and get products
        products = lines.slice(1)
          .map(line => line.split(',')[0]?.trim())
          .filter(p => p);
      } else {
        // Just get all non-empty lines
        products = lines
          .map(line => line.trim())
          .filter(line => line.length > 0);
      }
      
      setItemNames(products.join('\n'));
    };
    reader.readAsText(file);
  };

  const loadSampleData = () => {
    setItemNames('iPhone 15 Pro\nSamsung Galaxy S24\nMacBook Pro M3\nAirPods Pro\niPad Air');
    setDomains('apple.com\namazon.com\nbestbuy.com');
  };

  const handleSubmit = async () => {
    const items = parseItems(itemNames);
    const doms = parseDomains(domains);

    if (items.length === 0) {
      alert('Please enter at least one product name');
      return;
    }

    if (doms.length === 0) {
      alert('Please enter at least one domain');
      return;
    }

    setLoading(true);
    onResults(null);

    try {
      // Start scraping
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_names: items,
          domains: doms
        })
      });

      if (!response.ok) {
        throw new Error('Failed to start scraping');
      }

      const data = await response.json();
      setTaskId(data.task_id);

      // Poll for results
      let attempts = 0;
      const maxAttempts = 30; // 30 seconds timeout
      
      const pollInterval = setInterval(async () => {
        attempts++;
        
        try {
          const resultsResponse = await fetch(`/api/results/${data.task_id}`);
          const results = await resultsResponse.json();
          
          if (results.status === 'completed') {
            clearInterval(pollInterval);
            onResults(results);
            setLoading(false);
          } else if (results.status === 'not_found' || attempts >= maxAttempts) {
            clearInterval(pollInterval);
            setLoading(false);
            alert('Scraping timed out or failed. Please try again.');
          }
        } catch (error) {
          console.error('Error polling results:', error);
          if (attempts >= maxAttempts) {
            clearInterval(pollInterval);
            setLoading(false);
            alert('Failed to get results. Please try again.');
          }
        }
      }, 1000);

    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
      alert('Failed to start scraping. Please try again.');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
        Domain-Scoped Image Scraper
      </h1>
      
      <div className="space-y-6">
        {/* Product Names Input */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Product Names
            </label>
            <button
              onClick={loadSampleData}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <FaFlask className="text-xs" /> Load Sample Data
            </button>
          </div>
          <textarea
            value={itemNames}
            onChange={(e) => setItemNames(e.target.value)}
            placeholder="Enter product names, one per line or separated by commas&#10;Example:&#10;iPhone 15 Pro&#10;Samsung Galaxy S24&#10;MacBook Pro"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
            rows={5}
            disabled={loading}
          />
          <div className="mt-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1"
              disabled={loading}
            >
              <FaUpload className="text-xs" /> Upload CSV/TXT file
            </button>
          </div>
        </div>

        {/* Domains Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Target Domains
          </label>
          <textarea
            value={domains}
            onChange={(e) => setDomains(e.target.value)}
            placeholder="Enter domains to search, one per line or separated by commas&#10;Example:&#10;apple.com&#10;amazon.com&#10;bestbuy.com"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
            rows={4}
            disabled={loading}
          />
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors"
        >
          {loading ? (
            <>
              <FaSpinner className="animate-spin" />
              Searching for best images...
            </>
          ) : (
            <>
              <FaSearch />
              Find Best Images
            </>
          )}
        </button>

        {loading && taskId && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
            <p className="text-sm text-blue-700">
              Task ID: <code className="bg-white px-2 py-1 rounded">{taskId}</code>
              <br />
              Searching Google Images with domain filtering...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
