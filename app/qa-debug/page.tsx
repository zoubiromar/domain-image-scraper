'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function QADebugPage() {
  const [itemName, setItemName] = useState('Citrons biologiques / Organic Lemons');
  const [size, setSize] = useState('1 ct');
  const [rawData, setRawData] = useState('Organic Lemons');
  const [imageUrl, setImageUrl] = useState('https://img.cdn4dd.com/cdn-cgi/image/fit=contain,width=1200,height=672,format=auto/https://doordash-static.s3.amazonaws.com/media/photosV2/facbd5dc-30ea-456e-9130-b61291153321-retina-large.jpg');
  const [testMode, setTestMode] = useState<'name' | 'image'>('name');
  const [model, setModel] = useState('gpt-4o-mini');
  const [apiKey, setApiKey] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleTest = async () => {
    if (!apiKey) {
      alert('Please enter an API key');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      if (testMode === 'name') {
        // Test Name QA
        const response = await fetch('/api/qa-debug', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            itemName,
            size,
            rawData,
            model,
            apiKey,
          }),
        });

        const data = await response.json();
        setResult(data);
      } else {
        // Test Image QA
        console.log('[Debug] Testing Image QA...');
        const testResponse = await fetch('/api/qa-process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rows: [{
              itemName,
              size,
              imageUrl,
            }],
            options: {
              runNameQA: false,
              runImageQA: true,
              model: 'gpt-4o',
              apiKey,
            },
          }),
        });

        const responseText = await testResponse.text();
        console.log('[Debug] Image QA Response:', responseText.substring(0, 500));

        let data;
        try {
          data = JSON.parse(responseText);
        } catch (e: any) {
          setResult({
            status: 'error',
            error: 'Response is not valid JSON',
            responsePreview: responseText.substring(0, 500),
          });
          return;
        }

        setResult(data);
      }
    } catch (error: any) {
      setResult({
        status: 'error',
        error: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/qa" className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
          ← Back to QA Helper
        </Link>

        <h1 className="text-3xl font-bold mb-8">QA Helper Debug Tool</h1>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Test Single QA Request</h2>

          <div className="space-y-4">
            {/* Test Mode Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">Test Mode</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={testMode === 'name'}
                    onChange={() => setTestMode('name')}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Name QA (Text)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={testMode === 'image'}
                    onChange={() => setTestMode('image')}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Image QA (Vision)</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Item Name</label>
              <input
                type="text"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Size</label>
              <input
                type="text"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            {testMode === 'name' && (
              <div>
                <label className="block text-sm font-medium mb-1">Raw Data</label>
                <input
                  type="text"
                  value={rawData}
                  onChange={(e) => setRawData(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            )}

            {testMode === 'image' && (
              <div>
                <label className="block text-sm font-medium mb-1">Image URL</label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-xs"
                  placeholder="https://..."
                />
              </div>
            )}

            {testMode === 'name' && (
              <div>
                <label className="block text-sm font-medium mb-1">Model</label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="gpt-4o-mini">gpt-4o-mini</option>
                  <option value="gpt-4o">gpt-4o</option>
                  <option value="gpt-5-mini">gpt-5-mini</option>
                  <option value="gpt-5">gpt-5</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">API Key</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <button
              onClick={handleTest}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 rounded-lg font-medium"
            >
              {loading ? 'Testing...' : `Test ${testMode === 'name' ? 'Name' : 'Image'} QA`}
            </button>
          </div>
        </div>

        {result && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">Result</h2>
            <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto text-xs">
              {JSON.stringify(result, null, 2)}
            </pre>

            {result.status === 'error' && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <h3 className="font-bold text-red-700 mb-2">Error Details</h3>
                <p className="text-sm text-red-600">{result.error}</p>
                {result.responsePreview && (
                  <div className="mt-2">
                    <p className="text-xs font-semibold text-red-700">Response Preview:</p>
                    <pre className="text-xs text-red-600 mt-1 overflow-auto">
                      {result.responsePreview}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {result.status === 'success' && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-bold text-green-700 mb-2">Success!</h3>
                <div className="text-sm space-y-1">
                  <p><strong>Score:</strong> {result.parsedResult?.score}</p>
                  <p><strong>Errors:</strong> {result.parsedResult?.errorTypes?.join(', ') || 'None'}</p>
                  <p><strong>Comments:</strong> {result.parsedResult?.comments}</p>
                  <p><strong>Suggestion:</strong> {result.parsedResult?.suggestion || 'None'}</p>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-bold text-yellow-800 mb-2">Instructions</h3>
          <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
            <li>Enter your OpenAI API key</li>
            <li>Fill in the test data (or use the defaults)</li>
            <li>Click &quot;Test QA Request&quot;</li>
            <li>Check the console (F12) for detailed logs</li>
            <li>Review the JSON response below</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

