'use client';

import { FaDownload, FaExternalLinkAlt, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import Image from 'next/image';
import { generateCSV, downloadCSV } from '@/lib/csv-export';

interface Props {
  results: any;
}

export default function SimpleResultsDisplay({ results }: Props) {
  if (!results?.results) return null;

  const handleDownloadCSV = () => {
    const csv = generateCSV(results.results);
    downloadCSV(csv, `scraping_results_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const totalProducts = Object.keys(results.results).length;
  const foundImages = Object.values(results.results).filter(img => img !== null).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800">
          Scraping Results
        </h2>
        <button
          onClick={handleDownloadCSV}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <FaDownload /> Download CSV
        </button>
      </div>
      
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
        <p className="text-sm text-blue-700">
          Found images for <strong>{foundImages}</strong> out of <strong>{totalProducts}</strong> products
        </p>
      </div>

      <div className="space-y-4">
        {Object.entries(results.results).map(([productName, image]: [string, any]) => (
          <div key={productName} className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-start gap-6">
              {image ? (
                <>
                  {/* Image thumbnail */}
                  <div className="flex-shrink-0">
                    <div className="relative w-32 h-32 bg-gray-100 rounded-lg overflow-hidden">
                      <Image
                        src={image.thumbnail || image.url}
                        alt={productName}
                        fill
                        className="object-contain p-2"
                        unoptimized
                      />
                    </div>
                  </div>
                  
                  {/* Product details */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <FaCheckCircle className="text-green-500" />
                      <h3 className="text-xl font-semibold text-gray-800">{productName}</h3>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">Domain:</span>
                        <span className="font-medium text-blue-600">
                          {image.matched_domain || image.source_domain}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">Score:</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full"
                              style={{ width: `${(image.score || 0) * 100}%` }}
                            />
                          </div>
                          <span className="font-medium">{((image.score || 0) * 100).toFixed(1)}%</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-3 mt-3">
                        <a
                          href={image.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-xs"
                        >
                          View Image <FaExternalLinkAlt className="text-xs" />
                        </a>
                        {image.source_url && (
                          <a
                            href={image.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-600 hover:text-gray-800 flex items-center gap-1 text-xs"
                          >
                            Source Page <FaExternalLinkAlt className="text-xs" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-3 w-full">
                  <FaTimesCircle className="text-red-500 text-xl" />
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800">{productName}</h3>
                    <p className="text-gray-500 text-sm mt-1">No matching image found</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
