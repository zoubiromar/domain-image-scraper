'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Papa from 'papaparse';
import { ArrowLeft, Download, RefreshCw } from 'lucide-react';
import { getJob } from '@/lib/job-manager';

export default function DomainJobPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;

  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!jobId) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    const loadedJob = getJob('domain', jobId);
    
    if (!loadedJob) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setJob(loadedJob);
    setLoading(false);

    // Poll for updates if processing
    if (loadedJob.status === 'processing') {
      const interval = setInterval(() => {
        const updatedJob = getJob('domain', jobId);
        if (updatedJob) {
          setJob(updatedJob);
          if (updatedJob.status !== 'processing') {
            clearInterval(interval);
          }
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [jobId]);

  const handleDownloadCSV = () => {
    if (!job || !job.results) return;

    const csvRows = [['Product Name', 'Selected Image URL', 'Image Title', 'Source Domain', 'Score']];

    job.results.forEach((result: any) => {
      const selectedIdx = result.selectedImage;
      if (selectedIdx !== undefined && result.images[selectedIdx]) {
        const img = result.images[selectedIdx];
        csvRows.push([
          result.productName,
          img.url,
          img.title,
          img.source_domain,
          img.score.toFixed(2)
        ]);
      } else {
        csvRows.push([result.productName, '', '', '', '']);
      }
    });

    const csvContent = Papa.unparse(csvRows);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `domain_results_${jobId}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleResume = () => {
    router.push('/domain');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading job...</p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Job Not Found</h1>
          <p className="text-gray-600 mb-6">
            The job <code className="bg-gray-200 px-2 py-1 rounded">{jobId}</code> could not be found.
          </p>
          <Link
            href="/domain"
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Domain Scraper
          </Link>
        </div>
      </div>
    );
  }

  const isInProgress = job.status === 'processing';
  const isCompleted = job.status === 'completed';

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="max-w-6xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/domain" className="text-purple-600 hover:text-purple-700 mb-4 inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Domain Scraper
          </Link>
          <h1 className="text-4xl font-bold text-gray-800 flex items-center gap-3">
            <span className="text-3xl">🌐</span>
            Domain Scraper Job: {jobId}
          </h1>
          <p className="text-gray-600 mt-2">
            Created: {new Date(job.timestamp).toLocaleString()}
          </p>
        </div>

        {/* Status Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-800">Job Status</h2>
            <div className={`px-4 py-2 rounded-full font-semibold ${
              isCompleted ? 'bg-green-100 text-green-800' :
              isInProgress ? 'bg-blue-100 text-blue-800 animate-pulse' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {job.status.toUpperCase()}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600">Products Scraped</div>
              <div className="text-2xl font-bold text-gray-800">
                {job.results.length} / {job.progress.total}
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600">Last Updated</div>
              <div className="text-sm font-medium text-gray-800">
                {new Date(job.lastUpdated).toLocaleTimeString()}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          {isInProgress && (
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>{job.progress.phase}</span>
                <span>{Math.round((job.progress.current / job.progress.total) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-purple-600 h-3 rounded-full transition-all"
                  style={{ width: `${(job.progress.current / job.progress.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            {isInProgress && (
              <button
                onClick={handleResume}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Resume Scraping
              </button>
            )}
            {job.results.length > 0 && (
              <button
                onClick={handleDownloadCSV}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download CSV ({job.results.length} results)
              </button>
            )}
          </div>
        </div>

        {/* Results Preview */}
        {job.results.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Image Results ({job.results.length} products)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {job.results.slice(0, 10).map((result: any, idx: number) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-4">
                  <div className="font-semibold text-gray-800 mb-2">{result.productName}</div>
                  {result.images.length > 0 && result.selectedImage !== undefined ? (
                    <img
                      src={result.images[result.selectedImage].thumbnail}
                      alt={result.productName}
                      className="w-full h-32 object-contain bg-gray-50 rounded"
                    />
                  ) : (
                    <div className="w-full h-32 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-sm">
                      No image selected
                    </div>
                  )}
                </div>
              ))}
            </div>
            {job.results.length > 10 && (
              <p className="text-center text-gray-500 text-sm mt-4">
                ... and {job.results.length - 10} more (download CSV to see all)
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
