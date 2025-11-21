import { DollarSign, Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface CostTrackerProps {
  totalProducts: number;
  matchedProducts: number;
  embeddingCalls: number;
  gptCalls: number;
  productType: 'alcohol' | 'cng';
}

export default function CostTracker({
  totalProducts,
  matchedProducts,
  embeddingCalls,
  gptCalls,
  productType,
}: CostTrackerProps) {
  const [copied, setCopied] = useState(false);
  
  // Cost calculations
  const EMBEDDING_COST_PER_1K_TOKENS = 0.00002; // text-embedding-3-small
  const GPT_COST_INPUT_PER_1K = 0.00015; // gpt-4o-mini input
  const GPT_COST_OUTPUT_PER_1K = 0.0006; // gpt-4o-mini output
  
  // Estimates
  const avgTokensPerEmbedding = 20; // Average product name length
  const avgInputTokensPerGPT = 200; // System prompt + candidates
  const avgOutputTokensPerGPT = 50; // JSON response
  
  const embeddingCost = (embeddingCalls * avgTokensPerEmbedding / 1000) * EMBEDDING_COST_PER_1K_TOKENS;
  const gptInputCost = (gptCalls * avgInputTokensPerGPT / 1000) * GPT_COST_INPUT_PER_1K;
  const gptOutputCost = (gptCalls * avgOutputTokensPerGPT / 1000) * GPT_COST_OUTPUT_PER_1K;
  const totalCost = embeddingCost + gptInputCost + gptOutputCost;
  
  const costPerProduct = totalProducts > 0 ? totalCost / totalProducts : 0;
  
  const reportText = `URPC ${productType.toUpperCase()} Image Scraper - API Consumption Report
=========================================
Date: ${new Date().toLocaleString()}

Products Processed: ${totalProducts}
Successfully Matched: ${matchedProducts}
Match Rate: ${totalProducts > 0 ? ((matchedProducts / totalProducts) * 100).toFixed(1) : 0}%

API Usage:
- Model: text-embedding-3-small (embeddings)
- Model: gpt-4o-mini (verification)
- Embedding API Calls: ${embeddingCalls}
- GPT API Calls: ${gptCalls}

Estimated Costs:
- Embeddings: $${embeddingCost.toFixed(5)}
- GPT Input: $${gptInputCost.toFixed(5)}
- GPT Output: $${gptOutputCost.toFixed(5)}
- Total Cost: $${totalCost.toFixed(5)}
- Cost per Product: $${costPerProduct.toFixed(6)}

Note: Costs are estimates based on average token usage.
Actual costs may vary. Check OpenAI dashboard for exact usage.`;

  const handleCopy = () => {
    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl shadow-lg p-6 border-2 border-purple-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-purple-900 flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          API Usage & Cost Report
        </h3>
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copied!' : 'Copy Report'}
        </button>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="bg-white rounded-lg p-3 border border-purple-200">
          <div className="text-xs text-gray-600 mb-1">Total Products</div>
          <div className="text-2xl font-bold text-purple-900">{totalProducts}</div>
        </div>
        <div className="bg-white rounded-lg p-3 border border-purple-200">
          <div className="text-xs text-gray-600 mb-1">Matched</div>
          <div className="text-2xl font-bold text-green-600">{matchedProducts}</div>
        </div>
        <div className="bg-white rounded-lg p-3 border border-purple-200">
          <div className="text-xs text-gray-600 mb-1">Embedding Calls</div>
          <div className="text-2xl font-bold text-blue-600">{embeddingCalls}</div>
        </div>
        <div className="bg-white rounded-lg p-3 border border-purple-200">
          <div className="text-xs text-gray-600 mb-1">GPT Calls</div>
          <div className="text-2xl font-bold text-indigo-600">{gptCalls}</div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg p-4 border border-purple-200">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="font-semibold text-gray-700 mb-2">Models Used:</div>
            <div className="space-y-1 text-gray-600">
              <div>• text-embedding-3-small</div>
              <div>• gpt-4o-mini</div>
            </div>
          </div>
          <div>
            <div className="font-semibold text-gray-700 mb-2">Estimated Costs:</div>
            <div className="space-y-1 text-gray-600">
              <div>Embeddings: ${embeddingCost.toFixed(5)}</div>
              <div>GPT Calls: ${(gptInputCost + gptOutputCost).toFixed(5)}</div>
              <div className="font-bold text-purple-900 pt-1 border-t border-purple-200">
                Total: ${totalCost.toFixed(5)}
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-3 pt-3 border-t border-purple-200">
          <div className="text-xs text-gray-500 flex items-center justify-between">
            <span>Cost per product: ${costPerProduct.toFixed(6)}</span>
            <span>Match rate: {totalProducts > 0 ? ((matchedProducts / totalProducts) * 100).toFixed(1) : 0}%</span>
          </div>
        </div>
      </div>
      
      <p className="text-xs text-gray-500 mt-3 text-center">
        💡 Costs are estimates. Check your OpenAI dashboard for exact usage.
      </p>
    </div>
  );
}



