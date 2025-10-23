'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { FaSearch, FaPlus, FaTimes, FaUpload, FaFileAlt } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { ScrapingResult } from '@/lib/types';

interface FormData {
  bulkItems: string;
  bulkDomains: string;
  keyword: string;
  maxImages: number;
  topN: number;
}

interface Props {
  onScrapeStart: (taskId: string) => void;
  onScrapeComplete: (results: ScrapingResult) => void;
  loading: boolean;
}

export default function ScraperForm({ onScrapeStart, onScrapeComplete, loading }: Props) {
  const [itemTags, setItemTags] = useState<string[]>([]);
  const [domainTags, setDomainTags] = useState<string[]>([]);
  const [inputMode, setInputMode] = useState<'tags' | 'bulk'>('bulk');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      bulkItems: '',
      bulkDomains: '',
      maxImages: 10,
      topN: 3,
    },
  });

  const bulkItems = watch('bulkItems');
  const bulkDomains = watch('bulkDomains');

  // Parse bulk input (comma, semicolon, or newline separated)
  const parseBulkInput = (input: string): string[] => {
    if (!input.trim()) return [];
    
    // Split by newlines, commas, or semicolons
    const items = input
      .split(/[\n,;]+/)
      .map(item => item.trim())
      .filter(item => item.length > 0);
    
    // Remove duplicates
    return [...new Set(items)];
  };

  // Handle CSV file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv') && !file.name.endsWith('.txt')) {
      toast.error('Please upload a CSV or TXT file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      
      // Simple CSV parsing - assumes first column or "Product Names" column
      const lines = text.split('\n').filter(line => line.trim());
      
      // Check if first line is a header
      let startIndex = 0;
      if (lines[0] && (lines[0].toLowerCase().includes('product') || lines[0].toLowerCase().includes('name'))) {
        startIndex = 1;
      }
      
      const products = lines
        .slice(startIndex)
        .map(line => {
          // Handle CSV with quotes
          const match = line.match(/^"([^"]+)"|^([^,]+)/);
          return match ? (match[1] || match[2] || '').trim() : line.split(',')[0].trim();
        })
        .filter(item => item.length > 0);
      
      if (products.length > 0) {
        setValue('bulkItems', products.join('\n'));
        toast.success(`Loaded ${products.length} products from file`);
      } else {
        toast.error('No valid products found in file');
      }
    };
    
    reader.readAsText(file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onSubmit = async (data: FormData) => {
    // Parse items and domains from bulk input
    const items = inputMode === 'bulk' 
      ? parseBulkInput(data.bulkItems)
      : itemTags;
    
    const domains = inputMode === 'bulk'
      ? parseBulkInput(data.bulkDomains)
      : domainTags;

    if (items.length === 0) {
      toast.error('Please add at least one product name');
      return;
    }
    if (domains.length === 0) {
      toast.error('Please add at least one domain');
      return;
    }

    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_names: items,
          domains: domains,
          extra_keyword: data.keyword,
          max_results_per_item: data.maxImages,
          top_n: data.topN,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to start scraping');
      }
      
      const result = await response.json();
      onScrapeStart(result.task_id);

      // Poll for results with better timing
      let attempts = 0;
      const maxAttempts = 30;
      
      const pollResults = async () => {
        attempts++;
        
        try {
          const resultsResponse = await fetch(`/api/results/${result.task_id}`);
          if (resultsResponse.ok) {
            const resultsData = await resultsResponse.json();
            
            if (resultsData.status === 'completed') {
              onScrapeComplete(resultsData);
              toast.success('Scraping completed!');
            } else if (resultsData.status === 'not_found' && attempts < maxAttempts) {
              // Keep polling
              setTimeout(pollResults, 1000);
            } else {
              toast.error('Results not found or task expired');
            }
          } else if (attempts < maxAttempts) {
            setTimeout(pollResults, 1000);
          } else {
            toast.error('Timeout waiting for results');
          }
        } catch (error) {
          if (attempts < maxAttempts) {
            setTimeout(pollResults, 1000);
          } else {
            toast.error('Failed to get results');
          }
        }
      };
      
      // Start polling after initial delay
      setTimeout(pollResults, 2000);
    } catch (error: any) {
      toast.error(error.message || 'Failed to start scraping');
      console.error(error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Input Mode Toggle */}
      <div className="flex justify-center gap-4 mb-6">
        <button
          type="button"
          onClick={() => setInputMode('bulk')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            inputMode === 'bulk' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Bulk Input
        </button>
        <button
          type="button"
          onClick={() => setInputMode('tags')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            inputMode === 'tags' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Tag Mode (Legacy)
        </button>
      </div>

      {inputMode === 'bulk' ? (
        <>
          {/* Product Names - Bulk Input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Product Names
              </label>
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <FaUpload /> Upload CSV
                </button>
                <button
                  type="button"
                  onClick={() => setValue('bulkItems', 'iPhone 15 Pro\nSamsung Galaxy S24\nGoogle Pixel 8\nSony WH-1000XM5\nApple AirPods Pro')}
                  className="flex items-center gap-2 px-3 py-1 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <FaFileAlt /> Sample Data
                </button>
              </div>
            </div>
            <textarea
              {...register('bulkItems')}
              placeholder="Enter product names (one per line, or comma-separated):&#10;&#10;iPhone 15 Pro&#10;Samsung Galaxy S24&#10;MacBook Air M2&#10;&#10;Or: iPhone 15, Samsung S24, Pixel 8"
              rows={5}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            />
            {bulkItems && (
              <p className="text-sm text-gray-500 mt-1">
                {parseBulkInput(bulkItems).length} products detected
              </p>
            )}
          </div>

          {/* Domains - Bulk Input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Target Domains
              </label>
              <button
                type="button"
                onClick={() => setValue('bulkDomains', 'amazon.com\nbestbuy.com\nwalmart.com')}
                className="flex items-center gap-2 px-3 py-1 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <FaFileAlt /> Common Domains
              </button>
            </div>
            <textarea
              {...register('bulkDomains')}
              placeholder="Enter domains (one per line, or comma-separated):&#10;&#10;amazon.com&#10;bestbuy.com&#10;walmart.com&#10;&#10;Or: amazon.com, ebay.com, target.com"
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            />
            {bulkDomains && (
              <p className="text-sm text-gray-500 mt-1">
                {parseBulkInput(bulkDomains).length} domains detected
              </p>
            )}
          </div>
        </>
      ) : (
        <>
          {/* Original Tag Mode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Names (Tag Mode)
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Enter product name and press Enter..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const input = e.currentTarget;
                    if (input.value.trim() && !itemTags.includes(input.value.trim())) {
                      setItemTags([...itemTags, input.value.trim()]);
                      input.value = '';
                    }
                  }
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {itemTags.map(item => (
                <span key={item} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                  {item}
                  <button type="button" onClick={() => setItemTags(itemTags.filter(i => i !== item))} className="hover:text-red-600">
                    <FaTimes />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Domains (Tag Mode)
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="e.g., amazon.com"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const input = e.currentTarget;
                    if (input.value.trim() && !domainTags.includes(input.value.trim())) {
                      setDomainTags([...domainTags, input.value.trim()]);
                      input.value = '';
                    }
                  }
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {domainTags.map(domain => (
                <span key={domain} className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                  {domain}
                  <button type="button" onClick={() => setDomainTags(domainTags.filter(d => d !== domain))} className="hover:text-red-600">
                    <FaTimes />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Optional Keyword */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Extra Keyword (Optional)
        </label>
        <input
          type="text"
          {...register('keyword')}
          placeholder="Add context keyword..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Advanced Options */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Max Images per Item
          </label>
          <input
            type="number"
            {...register('maxImages', { min: 1, max: 50 })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Top Results to Show
          </label>
          <input
            type="number"
            {...register('topN', { min: 1, max: 10 })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            Scraping...
          </>
        ) : (
          <>
            <FaSearch />
            Start Scraping
          </>
        )}
      </button>
    </form>
  );
}