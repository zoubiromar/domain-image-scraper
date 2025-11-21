'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Papa from 'papaparse';
import { ArrowLeft, Download, RefreshCw } from 'lucide-react';
import { getJob } from '@/lib/job-manager';

export default function URPCJobPage() {
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

    // Load job from Blob/localStorage
    const loadJob = async () => {
      const loadedJob = await getJob('urpc', jobId);
      
      if (!loadedJob) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setJob(loadedJob);
      setLoading(false);

      // If job is in progress, poll for updates
      if (loadedJob.status === 'processing') {
        const interval = setInterval(async () => {
          const updatedJob = await getJob('urpc', jobId);
          if (updatedJob) {
            setJob(updatedJob);
            
            // Stop polling if job is no longer processing
            if (updatedJob.status !== 'processing') {
              clearInterval(interval);
            }
          }
        }, 1000); // Check every second

        return () => clearInterval(interval);
      }
    };

    loadJob();
  }, [jobId]);

  const handleDownloadCSV = () => {
    if (!job || !job.results) return;

    const csv = Papa.unparse(job.results);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `urpc_results_${jobId}.csv`;
    a.click();
  };

  const handleResume = () => {
    // Navigate back to main URPC page which will detect the in-progress job
    router.push('/urpc');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading job...</p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Job Not Found</h1>
          <p className="text-gray-600 mb-6">
            The job <code className="bg-gray-200 px-2 py-1 rounded">{jobId}</code> could not be found.
          </p>
          <Link
            href="/urpc"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to URPC Matcher
          </Link>
        </div>
      </div>
    );
  }

  const isInProgress = job.status === 'processing';
  const isCompleted = job.status === 'completed';
  const isCancelled = job.status === 'cancelled';
  const isError = job.status === 'error';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="max-w-6xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/urpc" className="text-blue-600 hover:text-blue-700 mb-4 inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to URPC Matcher
          </Link>
          <h1 className="text-4xl font-bold text-gray-800 flex items-center gap-3">
            <span className="text-3xl">🛒</span>
            URPC Job: {jobId}
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
              isCancelled ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {job.status.toUpperCase()}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600">Products</div>
              <div className="text-2xl font-bold text-gray-800">
                {job.results.length} / {job.progress.total}
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600">Product Type</div>
              <div className="text-lg font-bold text-gray-800">{job.config.productType}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600">Review Mode</div>
              <div className="text-lg font-bold text-gray-800">{job.config.reviewMode}</div>
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
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${(job.progress.current / job.progress.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Error Message */}
          {isError && job.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="font-semibold text-red-800 mb-1">Error:</div>
              <div className="text-sm text-red-700">{job.error}</div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            {isInProgress && (
              <button
                onClick={handleResume}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Resume Processing
              </button>
            )}
            {(isCompleted || isCancelled || isError) && job.results.length > 0 && (
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
              Results ({job.results.length} items)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="text-left p-3 font-semibold">Product</th>
                    <th className="text-left p-3 font-semibold">Matched Name</th>
                    <th className="text-left p-3 font-semibold">UPC</th>
                    <th className="text-left p-3 font-semibold">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {job.results.slice(0, 20).map((result: any, idx: number) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-3">{result.productName}</td>
                      <td className="p-3">{result.matchedName || '-'}</td>
                      <td className="p-3 font-mono text-xs">{result.matchedUpc || '-'}</td>
                      <td className="p-3">
                        {result.score > 0 && (
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            result.score >= 9 ? 'bg-green-100 text-green-800' :
                            result.score >= 7 ? 'bg-yellow-100 text-yellow-800' :
                            result.score >= 5 ? 'bg-orange-100 text-orange-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {result.score.toFixed(1)}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {job.results.length > 20 && (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-gray-500 text-sm">
                        ... and {job.results.length - 20} more results (download CSV to see all)
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
