'use client';

import React, { useState, useRef, useEffect } from 'react';
import Papa from 'papaparse';
import Link from 'next/link';
import { FaUpload, FaPlay, FaDownload, FaSpinner, FaCheckCircle, FaCog, FaTimes } from 'react-icons/fa';
import { QA_MODELS, QAModel, DEFAULT_PROMPTS, NAME_QA_SYSTEM_PROMPT, IMAGE_QA_SYSTEM_PROMPT, ENGLISH_TEXT_QA_SYSTEM_PROMPT, ENGLISH_IMAGE_QA_SYSTEM_PROMPT } from '@/lib/qa-config';
import { QARule, getDefaultRules, buildPromptFromRules } from '@/lib/qa-rules';
import RuleEditor from '@/components/RuleEditor';

interface QAProgress {
  phase: string;
  current: number;
  total: number;
}

interface QACosts {
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCost: number;
  breakdown: Record<string, { inputTokens: number; outputTokens: number; cost: number }>;
}

export default function QAPage() {
  // CSV Data
  const [csvData, setCsvData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Configuration
  const [language, setLanguage] = useState<'french' | 'english'>('french');
  const [runNameQA, setRunNameQA] = useState(true);
  const [runImageQA, setRunImageQA] = useState(false);
  const [itemNameCol, setItemNameCol] = useState('');
  const [sizeCol, setSizeCol] = useState('');
  const [rawDataCol, setRawDataCol] = useState('');
  const [imageUrlCol, setImageUrlCol] = useState('');
  const [model, setModel] = useState<QAModel>('gpt-5');
  const [apiKey, setApiKey] = useState('');
  const [processAll, setProcessAll] = useState(true);
  const [rowCount, setRowCount] = useState(50);

  // Processing State
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState<QAProgress>({ phase: '', current: 0, total: 0 });
  
  // Results
  const [processedRows, setProcessedRows] = useState<any[]>([]);
  const [costs, setCosts] = useState<QACosts | null>(null);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [showDebug, setShowDebug] = useState(false);

  // Prompt Editing
  const [showSettings, setShowSettings] = useState(false);
  const [settingsLanguage, setSettingsLanguage] = useState<'french' | 'english'>('french');
  const [settingsQAType, setSettingsQAType] = useState<'text' | 'image'>('text');
  
  // Rule-based editing
  const [textRulesFrench, setTextRulesFrench] = useState<QARule[]>(() => getDefaultRules('french', 'text'));
  const [imageRulesFrench, setImageRulesFrench] = useState<QARule[]>(() => getDefaultRules('french', 'image'));
  const [textRulesEnglish, setTextRulesEnglish] = useState<QARule[]>(() => getDefaultRules('english', 'text'));
  const [imageRulesEnglish, setImageRulesEnglish] = useState<QARule[]>(() => getDefaultRules('english', 'image'));
  
  // Generated prompts from rules (for backward compatibility)
  const [customNameQARules, setCustomNameQARules] = useState('');
  const [customImageQARules, setCustomImageQARules] = useState('');

  // Progress Saving & Recovery
  const [savedSessions, setSavedSessions] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // ============================================================================
  // PROGRESS SAVING & RECOVERY
  // ============================================================================

  const saveProgress = (
    processedRows: any[],
    costs: QACosts,
    completed: boolean,
    error?: string
  ) => {
    try {
      const session = {
        timestamp: new Date().toISOString(),
        processedRows,
        costs,
        rowCount: processedRows.length,
        completed,
        error,
        config: {
          runNameQA,
          runImageQA,
          model,
          itemNameCol,
          sizeCol,
        },
      };

      // Save to localStorage
      const key = `qa_session_${Date.now()}`;
      localStorage.setItem(key, JSON.stringify(session));
      
      // Update session list
      const sessions = getAllSessions();
      setSavedSessions(sessions);
      
      console.log('[Progress] Session saved:', key);
    } catch (e) {
      console.error('[Progress] Failed to save session:', e);
    }
  };

  const getAllSessions = (): any[] => {
    try {
      const keys = Object.keys(localStorage).filter(k => k.startsWith('qa_session_'));
      return keys.map(key => {
        const data = localStorage.getItem(key);
        return data ? { ...JSON.parse(data), key } : null;
      }).filter(Boolean).sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    } catch (e) {
      return [];
    }
  };

  const loadSession = (session: any) => {
    setProcessedRows(session.processedRows);
    setCosts(session.costs);
    setShowHistory(false);
    alert(`Loaded session from ${new Date(session.timestamp).toLocaleString()}\n${session.rowCount} rows recovered`);
  };

  const deleteSession = (key: string) => {
    localStorage.removeItem(key);
    setSavedSessions(getAllSessions());
  };

  const clearAllSessions = () => {
    if (confirm('Clear all saved sessions? This cannot be undone.')) {
      const keys = Object.keys(localStorage).filter(k => k.startsWith('qa_session_'));
      keys.forEach(k => localStorage.removeItem(k));
      setSavedSessions([]);
    }
  };

  // Load sessions on mount
  useEffect(() => {
    setSavedSessions(getAllSessions());
  }, []);

  // Regenerate prompts when rules change
  useEffect(() => {
    const nameRules = language === 'english' ? textRulesEnglish : textRulesFrench;
    const imageRules = language === 'english' ? imageRulesEnglish : imageRulesFrench;
    
    setCustomNameQARules(buildPromptFromRules(nameRules));
    setCustomImageQARules(buildPromptFromRules(imageRules));
  }, [language, textRulesFrench, imageRulesFrench, textRulesEnglish, imageRulesEnglish]);

  // ============================================================================
  // DEBUG LOGGING
  // ============================================================================

  const addDebugLog = (message: string) => {
    setDebugLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
    console.log(message);
  };

  // ============================================================================
  // FILE UPLOAD
  // ============================================================================

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data.length === 0) {
          alert('CSV file is empty');
          return;
        }

        const firstRow = results.data[0] as Record<string, any>;
        const cols = Object.keys(firstRow);
        
        setCsvData(results.data);
        setColumns(cols);

        // Auto-select columns if they match expected names
        if (cols.includes('itemName')) setItemNameCol('itemName');
        if (cols.includes('l4_size')) setSizeCol('l4_size');
        if (cols.includes('Mx Provided Item Name')) setRawDataCol('Mx Provided Item Name');
        if (cols.includes('final image URLs')) setImageUrlCol('final image URLs');
      },
      error: (error: any) => {
        alert('Failed to parse CSV: ' + error.message);
      }
    });
  };

  // ============================================================================
  // START PROCESSING
  // ============================================================================

  const handleStartQA = async () => {
    // Validation
    if (!apiKey || apiKey.length < 10) {
      alert('Please enter a valid OpenAI API key');
      return;
    }

    if (!runNameQA && !runImageQA) {
      alert('Please select at least one QA type');
      return;
    }

    if (csvData.length === 0) {
      alert('Please upload a CSV file');
      return;
    }

    if (!itemNameCol || !sizeCol) {
      alert('Please map the Cleaned Item Name and Size columns');
      return;
    }

    if (runNameQA && !rawDataCol) {
      alert('Please map the Raw Item Name column for Name QA');
      return;
    }

    if (runImageQA && !imageUrlCol) {
      alert('Please map the Image URLs column for Image QA');
      return;
    }

    setProcessing(true);
    setProgress({ phase: 'Preparing...', current: 0, total: csvData.length });
    setProcessedRows([]);
    setCosts(null);
    setDebugLogs([]);

    // Declare outside try block so accessible in catch for error recovery
    let allProcessedRows: any[] = [];
    let allCosts: any[] = [];

    try {
      // Prepare rows
      let allRows = csvData.map((row: any) => ({
        ...row,
        itemName: row[itemNameCol],
        size: row[sizeCol],
        rawData: runNameQA ? row[rawDataCol] : undefined,
        imageUrl: runImageQA ? row[imageUrlCol] : undefined,
      }));

      // Determine rows to process
      if (!processAll && rowCount > 0) {
        allRows = allRows.slice(0, rowCount);
      }

      addDebugLog(`Starting processing for ${allRows.length} rows`);
      addDebugLog(`Name QA: ${runNameQA}, Image QA: ${runImageQA}, Model: ${model}`);

      // ========================================================================
      // CLIENT-SIDE BATCHING (to avoid payload too large and timeout)
      // ========================================================================
      // Image QA is slower (vision API), use smaller batches to avoid 5-min Vercel timeout
      // Each image takes ~25-30s, so 5 images = ~2.5min (safe under 5min limit)
      const CLIENT_BATCH_SIZE = runImageQA ? 5 : 50; // 5 for Image QA, 50 for Name QA
      const totalBatches = Math.ceil(allRows.length / CLIENT_BATCH_SIZE);

      addDebugLog(`Processing in ${totalBatches} batches of ${CLIENT_BATCH_SIZE} rows each`);
      addDebugLog(`Batch size: ${CLIENT_BATCH_SIZE} (${runImageQA ? 'Image QA enabled - smaller batches to avoid timeout' : 'Name QA only - larger batches'})`);

      for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        const batchStart = batchIndex * CLIENT_BATCH_SIZE;
        const batchEnd = Math.min(batchStart + CLIENT_BATCH_SIZE, allRows.length);
        const batchRows = allRows.slice(batchStart, batchEnd);

        addDebugLog(`📦 Batch ${batchIndex + 1}/${totalBatches}: Processing rows ${batchStart + 1}-${batchEnd}`);
        setProgress({
          phase: `Processing batch ${batchIndex + 1}/${totalBatches}...`,
          current: batchStart,
          total: allRows.length,
        });

        const response = await fetch('/api/qa-process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rows: batchRows,
            options: {
              runNameQA,
              runImageQA,
              model,
              apiKey,
              language,
              customNameQARules,
              customImageQARules,
            },
          }),
        });

        addDebugLog(`Batch ${batchIndex + 1} response: status ${response.status}`);

        // Read response as text first
        const responseText = await response.text();

        // Try to parse as JSON
        let data;
        try {
          data = JSON.parse(responseText);
          addDebugLog(`Batch ${batchIndex + 1} parsed successfully`);
        } catch (jsonError: any) {
          addDebugLog(`❌ Batch ${batchIndex + 1} FAILED TO PARSE JSON`);
          addDebugLog(`Response preview: ${responseText.substring(0, 200)}`);
          throw new Error(`Batch ${batchIndex + 1} failed: ${responseText.substring(0, 100)}`);
        }

        if (!response.ok || data.status === 'error') {
          addDebugLog(`❌ Batch ${batchIndex + 1} error: ${data.error}`);
          throw new Error(data.error || `Batch ${batchIndex + 1} failed`);
        }

        // Collect results
        allProcessedRows.push(...data.processedRows);
        if (data.costs) {
          allCosts.push(data.costs);
        }

        addDebugLog(`✅ Batch ${batchIndex + 1} complete: ${data.processedRows.length} rows processed`);

        // ========================================================================
        // SAVE PROGRESS AFTER EACH BATCH (Recovery safeguard)
        // ========================================================================
        const partialCosts = {
          totalInputTokens: allCosts.reduce((sum, c) => sum + c.totalInputTokens, 0),
          totalOutputTokens: allCosts.reduce((sum, c) => sum + c.totalOutputTokens, 0),
          totalCost: allCosts.reduce((sum, c) => sum + c.totalCost, 0),
          breakdown: {} as any,
        };

        allCosts.forEach(cost => {
          Object.entries(cost.breakdown).forEach(([model, data]: [string, any]) => {
            if (!partialCosts.breakdown[model]) {
              partialCosts.breakdown[model] = { inputTokens: 0, outputTokens: 0, cost: 0 };
            }
            partialCosts.breakdown[model].inputTokens += data.inputTokens;
            partialCosts.breakdown[model].outputTokens += data.outputTokens;
            partialCosts.breakdown[model].cost += data.cost;
          });
        });

        saveProgress(allProcessedRows, partialCosts, false);
        addDebugLog(`💾 Progress saved (${allProcessedRows.length}/${allRows.length} rows)`);
      }

      // ========================================================================
      // COMBINE ALL BATCH RESULTS
      // ========================================================================
      addDebugLog(`🎉 All batches complete! Total rows: ${allProcessedRows.length}`);

      // Combine costs from all batches
      const combinedCosts = {
        totalInputTokens: allCosts.reduce((sum, c) => sum + c.totalInputTokens, 0),
        totalOutputTokens: allCosts.reduce((sum, c) => sum + c.totalOutputTokens, 0),
        totalCost: allCosts.reduce((sum, c) => sum + c.totalCost, 0),
        breakdown: {} as any,
      };

      // Merge breakdowns
      allCosts.forEach(cost => {
        Object.entries(cost.breakdown).forEach(([model, data]: [string, any]) => {
          if (!combinedCosts.breakdown[model]) {
            combinedCosts.breakdown[model] = { inputTokens: 0, outputTokens: 0, cost: 0 };
          }
          combinedCosts.breakdown[model].inputTokens += data.inputTokens;
          combinedCosts.breakdown[model].outputTokens += data.outputTokens;
          combinedCosts.breakdown[model].cost += data.cost;
        });
      });

      addDebugLog(`💰 Total cost: $${combinedCosts.totalCost.toFixed(4)}`);

      setProcessedRows(allProcessedRows);
      setCosts(combinedCosts);
      setProgress({
        phase: 'Complete',
        current: allProcessedRows.length,
        total: allProcessedRows.length,
      });

      // Save final completed session
      saveProgress(allProcessedRows, combinedCosts, true);
      addDebugLog(`💾 Final session saved - ${allProcessedRows.length} rows complete`);

      setProcessing(false);
    } catch (error: any) {
      addDebugLog(`❌ ERROR: ${error.message}`);
      
      // ========================================================================
      // SAVE PARTIAL RESULTS ON ERROR (Critical recovery feature)
      // ========================================================================
      if (allProcessedRows.length > 0) {
        const partialCosts = {
          totalInputTokens: allCosts.reduce((sum, c) => sum + c.totalInputTokens, 0),
          totalOutputTokens: allCosts.reduce((sum, c) => sum + c.totalOutputTokens, 0),
          totalCost: allCosts.reduce((sum, c) => sum + c.totalCost, 0),
          breakdown: {} as any,
        };

        allCosts.forEach(cost => {
          Object.entries(cost.breakdown).forEach(([model, data]: [string, any]) => {
            if (!partialCosts.breakdown[model]) {
              partialCosts.breakdown[model] = { inputTokens: 0, outputTokens: 0, cost: 0 };
            }
            partialCosts.breakdown[model].inputTokens += data.inputTokens;
            partialCosts.breakdown[model].outputTokens += data.outputTokens;
            partialCosts.breakdown[model].cost += data.cost;
          });
        });

        saveProgress(allProcessedRows, partialCosts, false, error.message);
        addDebugLog(`💾 PARTIAL RESULTS SAVED: ${allProcessedRows.length} rows recovered before error`);
        
        // Show recovered results
        setProcessedRows(allProcessedRows);
        setCosts(partialCosts);
        
        alert(`Error occurred but ${allProcessedRows.length} rows were saved!\n\nError: ${error.message}\n\nPartial results are displayed below and saved in History.\nYou can download them or load from History later.`);
      } else {
        alert('Error: ' + (error.message || 'Processing failed') + '\n\nCheck the Debug Logs section below for details.');
      }

      setProcessing(false);
    }
  };

  // ============================================================================
  // DOWNLOAD RESULTS
  // ============================================================================

  const handleDownloadCSV = () => {
    if (processedRows.length === 0) {
      alert('No results to download');
      return;
    }

    const csvContent = Papa.unparse(processedRows);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `qa_results_${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex flex-col">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="text-blue-600 hover:text-blue-700 mb-2 inline-block text-sm">
            ← Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <span className="text-2xl">✨</span>
            QA Helper
          </h1>
          <p className="text-gray-600 mt-1">
            Automated quality assurance for product listings (Quebec market)
          </p>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        {/* Configuration Form */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Configuration</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setShowHistory(true)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg transition-colors relative"
                disabled={processing}
              >
                <FaCheckCircle />
                <span className="text-sm font-medium">History</span>
                {savedSessions.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {savedSessions.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                disabled={processing}
              >
                <FaCog />
                <span className="text-sm font-medium">Edit AI Prompts</span>
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {/* CSV Upload */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Upload CSV File
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={processing}
                className="w-full bg-blue-50 hover:bg-blue-100 border-2 border-dashed border-blue-300 rounded-lg py-4 px-6 flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaUpload className="text-blue-600" />
                <span className="text-blue-700 font-medium">
                  {csvData.length > 0 ? `${csvData.length} rows loaded` : 'Click to upload CSV'}
                </span>
              </button>
            </div>

            {csvData.length > 0 && (
              <>
                {/* Build Language Selection */}
                <div className="border-t pt-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Build Language
                  </label>
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={language === 'french'}
                        onChange={() => setLanguage('french')}
                        disabled={processing}
                        className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium">🇫🇷 French & English</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={language === 'english'}
                        onChange={() => setLanguage('english')}
                        disabled={processing}
                        className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium">🇺🇸 English Only</span>
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Select the language format of your product listings. This changes the QA rules and suggestion format.
                  </p>
                </div>

                {/* QA Type Selection */}
                <div className="border-t pt-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Select QA Processes
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={runNameQA}
                        onChange={(e) => setRunNameQA(e.target.checked)}
                        disabled={processing}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium">Name & Text QA</span>
                    </label>
                    <label className="flex items-center gap-2 text-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={runImageQA}
                        onChange={(e) => setRunImageQA(e.target.checked)}
                        disabled={processing}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium">Image QA (slower, higher cost)</span>
                    </label>
                  </div>
                </div>

                {/* Column Mapping */}
                {(runNameQA || runImageQA) && (
                  <div className="border-t pt-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Column Mapping
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Cleaned Item Name</label>
                        <select
                          value={itemNameCol}
                          onChange={(e) => setItemNameCol(e.target.value)}
                          disabled={processing}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">-- Select column --</option>
                          {columns.map(col => (
                            <option key={col} value={col}>{col}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Size</label>
                        <select
                          value={sizeCol}
                          onChange={(e) => setSizeCol(e.target.value)}
                          disabled={processing}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">-- Select column --</option>
                          {columns.map(col => (
                            <option key={col} value={col}>{col}</option>
                          ))}
                        </select>
                      </div>
                      {runNameQA && (
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Raw Item Name</label>
                          <select
                            value={rawDataCol}
                            onChange={(e) => setRawDataCol(e.target.value)}
                            disabled={processing}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">-- Select column --</option>
                            {columns.map(col => (
                              <option key={col} value={col}>{col}</option>
                            ))}
                          </select>
                        </div>
                      )}
                      {runImageQA && (
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Image URLs</label>
                          <select
                            value={imageUrlCol}
                            onChange={(e) => setImageUrlCol(e.target.value)}
                            disabled={processing}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">-- Select column --</option>
                            {columns.map(col => (
                              <option key={col} value={col}>{col}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Name QA Settings */}
                {runNameQA && (
                  <div className="border-t pt-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Name QA Settings
                    </label>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">GPT Model</label>
                      <select
                        value={model}
                        onChange={(e) => setModel(e.target.value as QAModel)}
                        disabled={processing}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {QA_MODELS.nameQA.map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* API Key */}
                <div className="border-t pt-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    OpenAI API Key
                  </label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-..."
                    disabled={processing}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Row Processing */}
                <div className="border-t pt-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Row Processing
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-gray-700 cursor-pointer">
                      <input
                        type="radio"
                        checked={processAll}
                        onChange={() => setProcessAll(true)}
                        disabled={processing}
                        className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm">Process all unscored rows</span>
                    </label>
                    <label className="flex items-center gap-2 text-gray-700 cursor-pointer">
                      <input
                        type="radio"
                        checked={!processAll}
                        onChange={() => setProcessAll(false)}
                        disabled={processing}
                        className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm">Process first</span>
                      <input
                        type="number"
                        min="1"
                        value={rowCount}
                        onChange={(e) => setRowCount(parseInt(e.target.value) || 1)}
                        disabled={processing || processAll}
                        className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm">rows</span>
                    </label>
                  </div>
                </div>

                {/* Start Button */}
                <button
                  onClick={handleStartQA}
                  disabled={processing}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold py-4 px-6 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg"
                >
                  {processing ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <FaPlay />
                      Start QA
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Debug Panel */}
        {debugLogs.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">Debug Logs</h3>
              <button
                onClick={() => setShowDebug(!showDebug)}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                {showDebug ? 'Hide' : 'Show'} Details
              </button>
            </div>
            {showDebug && (
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto max-h-96 text-xs font-mono">
                {debugLogs.map((log, idx) => (
                  <div key={idx}>{log}</div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Progress */}
        {processing && progress.total > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>{progress.phase}</span>
              <span>
                {progress.current}/{progress.total} ({Math.round((progress.current / progress.total) * 100)}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Cost Tracker */}
        {costs && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FaCheckCircle className="text-green-500" />
              API Usage & Cost
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-sm text-gray-600">Input Tokens</div>
                <div className="text-2xl font-bold text-blue-600">
                  {costs.totalInputTokens.toLocaleString()}
                </div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="text-sm text-gray-600">Output Tokens</div>
                <div className="text-2xl font-bold text-purple-600">
                  {costs.totalOutputTokens.toLocaleString()}
                </div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-sm text-gray-600">Total Cost</div>
                <div className="text-2xl font-bold text-green-600">
                  ${costs.totalCost.toFixed(4)}
                </div>
              </div>
            </div>

            {/* Breakdown */}
            <div className="text-xs text-gray-600">
              <div className="font-semibold mb-1">Breakdown by Model:</div>
              {Object.entries(costs.breakdown).map(([model, data]) => (
                <div key={model} className="flex justify-between">
                  <span>{model}:</span>
                  <span>
                    {data.inputTokens.toLocaleString()} in, {data.outputTokens.toLocaleString()} out
                    = ${data.cost.toFixed(4)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {processedRows.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800">
                Results ({processedRows.length} rows)
              </h3>
              <button
                onClick={handleDownloadCSV}
                className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2 transition-colors"
              >
                <FaDownload />
                Download CSV
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-300">
                    <th className="text-left py-2 px-2 font-semibold">Item Name</th>
                    <th className="text-left py-2 px-2 font-semibold">QA Score</th>
                    <th className="text-left py-2 px-2 font-semibold">Errors</th>
                    <th className="text-left py-2 px-2 font-semibold">Comments</th>
                    <th className="text-left py-2 px-2 font-semibold">Suggestion</th>
                  </tr>
                </thead>
                <tbody>
                  {processedRows.slice(0, 20).map((row, idx) => (
                    <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-2 px-2 max-w-xs truncate" title={row.itemName}>
                        {row.itemName}
                      </td>
                      <td className="py-2 px-2">
                        <span
                          className={`font-semibold ${
                            row['QA Score'] >= 9
                              ? 'text-green-600'
                              : row['QA Score'] >= 7
                              ? 'text-yellow-600'
                              : 'text-red-600'
                          }`}
                        >
                          {row['QA Score']}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-xs max-w-xs truncate" title={row['Error Type']}>
                        {row['Error Type']}
                      </td>
                      <td className="py-2 px-2 text-xs max-w-xs truncate" title={row['Comments']}>
                        {row['Comments']}
                      </td>
                      <td className="py-2 px-2 text-xs max-w-xs truncate" title={row['Suggested Correction']}>
                        {row['Suggested Correction']}
                      </td>
                    </tr>
                  ))}
                  {processedRows.length > 20 && (
                    <tr>
                      <td colSpan={5} className="py-4 px-2 text-center text-gray-500 text-sm">
                        ... and {processedRows.length - 20} more rows (download CSV to see all)
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gray-50">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <FaCog className="text-blue-600" />
                AI Prompt Settings
              </h2>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <FaTimes size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1">
              {/* Language and QA Type Selectors */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Build Language
                  </label>
                  <div className="flex gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={settingsLanguage === 'french'}
                        onChange={() => setSettingsLanguage('french')}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">French</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={settingsLanguage === 'english'}
                        onChange={() => setSettingsLanguage('english')}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">English</span>
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    QA Type
                  </label>
                  <div className="flex gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={settingsQAType === 'text'}
                        onChange={() => setSettingsQAType('text')}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Text QA</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={settingsQAType === 'image'}
                        onChange={() => setSettingsQAType('image')}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Image QA</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Rule Editor Component */}
              <RuleEditor
                rules={
                  settingsLanguage === 'french'
                    ? (settingsQAType === 'text' ? textRulesFrench : imageRulesFrench)
                    : (settingsQAType === 'text' ? textRulesEnglish : imageRulesEnglish)
                }
                systemPrompt={
                  settingsLanguage === 'french'
                    ? (settingsQAType === 'text' ? NAME_QA_SYSTEM_PROMPT : IMAGE_QA_SYSTEM_PROMPT)
                    : (settingsQAType === 'text' ? ENGLISH_TEXT_QA_SYSTEM_PROMPT : ENGLISH_IMAGE_QA_SYSTEM_PROMPT)
                }
                onRulesChange={(updatedRules) => {
                  if (settingsLanguage === 'french') {
                    if (settingsQAType === 'text') {
                      setTextRulesFrench(updatedRules);
                    } else {
                      setImageRulesFrench(updatedRules);
                    }
                  } else {
                    if (settingsQAType === 'text') {
                      setTextRulesEnglish(updatedRules);
                    } else {
                      setImageRulesEnglish(updatedRules);
                    }
                  }
                }}
                language={settingsLanguage}
                qaType={settingsQAType}
              />
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => {
                  // Reset all rules to defaults
                  setTextRulesFrench(getDefaultRules('french', 'text'));
                  setImageRulesFrench(getDefaultRules('french', 'image'));
                  setTextRulesEnglish(getDefaultRules('english', 'text'));
                  setImageRulesEnglish(getDefaultRules('english', 'image'));
                }}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
              >
                Reset All to Defaults
              </button>
              <button
                onClick={() => setShowSettings(false)}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Save & Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-purple-50">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <FaCheckCircle className="text-purple-600" />
                Session History
              </h2>
              <button
                onClick={() => setShowHistory(false)}
                className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <FaTimes size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1">
              {savedSessions.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-lg mb-2">No saved sessions</p>
                  <p className="text-sm">Process some rows and sessions will be saved automatically</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {savedSessions.map((session, idx) => (
                    <div
                      key={session.key}
                      className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="font-semibold text-gray-800">
                            {new Date(session.timestamp).toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {session.rowCount} rows • ${session.costs?.totalCost.toFixed(4)} • 
                            {session.completed ? ' ✅ Completed' : ' ⚠️ Partial'}
                            {session.error && ` • Error: ${session.error.substring(0, 50)}...`}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => loadSession(session)}
                            className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors"
                          >
                            Load
                          </button>
                          <button
                            onClick={() => deleteSession(session.key)}
                            className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 text-sm rounded-lg transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        Config: {session.config?.runNameQA && 'Name QA'} {session.config?.runImageQA && 'Image QA'} • Model: {session.config?.model}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            {savedSessions.length > 0 && (
              <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-between">
                <button
                  onClick={clearAllSessions}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                >
                  Clear All History
                </button>
                <button
                  onClick={() => setShowHistory(false)}
                  className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <footer className="mt-20 py-8 border-t border-gray-200 bg-white/50">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>
            Built with Next.js and Vercel.{' '}
            <a
              href="https://github.com/zoubiromar"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              Omar Zoubir
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}

