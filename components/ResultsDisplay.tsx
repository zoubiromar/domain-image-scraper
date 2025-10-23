'use client';

import { ScrapingResult } from '@/lib/types';
import { FaExternalLinkAlt, FaStar } from 'react-icons/fa';
import Image from 'next/image';

interface Props {
  results: ScrapingResult;
}

export default function ResultsDisplay({ results }: Props) {
  if (!results.results) return null;

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">
        Scraping Results
      </h2>
      
      {Object.entries(results.results).map(([productName, images]) => (
        <div key={productName} className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-2xl font-semibold text-gray-800 mb-4 border-b pb-2">
            {productName}
          </h3>
          
          {images.length === 0 ? (
            <p className="text-gray-500 italic">No images found for this product.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {images.map((image, idx) => (
                <div key={idx} className="bg-gray-50 rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow">
                  <div className="relative h-48 bg-gray-200">
                    <Image
                      src={image.thumbnail || image.url}
                      alt={image.title}
                      fill
                      className="object-contain p-2"
                      unoptimized
                    />
                    {image.rank <= 3 && (
                      <div className="absolute top-2 left-2 bg-yellow-400 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                        <FaStar /> #{image.rank}
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4">
                    <h4 className="font-medium text-gray-800 mb-2 line-clamp-2">
                      {image.title || `Image ${idx + 1}`}
                    </h4>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Score:</span>
                        <span className="font-medium">{(image.score * 100).toFixed(0)}%</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-500">Source:</span>
                        <span className="text-blue-600">{image.source_domain}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-500">Confidence:</span>
                        <div className="flex items-center gap-1">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                              style={{ width: `${image.confidence * 100}%` }}
                            />
                          </div>
                          <span className="text-xs">{(image.confidence * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    </div>
                    
                    <a
                      href={image.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors text-sm"
                    >
                      View Full Image <FaExternalLinkAlt className="text-xs" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
