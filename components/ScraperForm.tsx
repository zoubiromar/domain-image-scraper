'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { FaSearch, FaPlus, FaTimes } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { ScrapingResult } from '@/lib/types';

interface FormData {
  items: string;
  domains: string;
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
  const [currentItem, setCurrentItem] = useState('');
  const [currentDomain, setCurrentDomain] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      maxImages: 10,
      topN: 3,
    },
  });

  const addItem = () => {
    if (currentItem.trim() && !itemTags.includes(currentItem.trim())) {
      setItemTags([...itemTags, currentItem.trim()]);
      setCurrentItem('');
    }
  };

  const addDomain = () => {
    if (currentDomain.trim() && !domainTags.includes(currentDomain.trim())) {
      setDomainTags([...domainTags, currentDomain.trim()]);
      setCurrentDomain('');
    }
  };

  const removeItem = (item: string) => {
    setItemTags(itemTags.filter(i => i !== item));
  };

  const removeDomain = (domain: string) => {
    setDomainTags(domainTags.filter(d => d !== domain));
  };

  const onSubmit = async (data: FormData) => {
    if (itemTags.length === 0) {
      toast.error('Please add at least one product name');
      return;
    }
    if (domainTags.length === 0) {
      toast.error('Please add at least one domain');
      return;
    }

    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_names: itemTags,
          domains: domainTags,
          extra_keyword: data.keyword,
          max_results_per_item: data.maxImages,
          top_n: data.topN,
        }),
      });

      if (!response.ok) throw new Error('Failed to start scraping');
      
      const result = await response.json();
      onScrapeStart(result.task_id);

      // Poll for results
      setTimeout(async () => {
        const resultsResponse = await fetch(`/api/results/${result.task_id}`);
        if (resultsResponse.ok) {
          const resultsData = await resultsResponse.json();
          onScrapeComplete(resultsData);
        }
      }, 2000);
    } catch (error) {
      toast.error('Failed to start scraping');
      console.error(error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Product Names */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Product Names
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={currentItem}
            onChange={(e) => setCurrentItem(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem())}
            placeholder="Enter product name..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="button"
            onClick={addItem}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FaPlus />
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {itemTags.map(item => (
            <span key={item} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
              {item}
              <button type="button" onClick={() => removeItem(item)} className="hover:text-red-600">
                <FaTimes />
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Domains */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Target Domains
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={currentDomain}
            onChange={(e) => setCurrentDomain(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addDomain())}
            placeholder="e.g., amazon.com"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="button"
            onClick={addDomain}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <FaPlus />
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {domainTags.map(domain => (
            <span key={domain} className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
              {domain}
              <button type="button" onClick={() => removeDomain(domain)} className="hover:text-red-600">
                <FaTimes />
              </button>
            </span>
          ))}
        </div>
      </div>

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
