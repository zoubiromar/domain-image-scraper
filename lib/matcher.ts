import { getAllProducts, Product } from './database';
import { fuzzyPrefilter, FuzzyCandidate } from './fuzzy-matcher';
import { batchGenerateEmbeddings, cosineSimilarity, EmbeddingRequest, EmbeddingResult } from './embedding-batcher';
import { verifyWithGPT } from './gpt-verifier';

export interface MatchRequest {
  productName: string;
  productIndex: number;
}

export interface MatchResult {
  productName: string;
  matchedName: string;
  matchedUrl: string;
  matchedUpc: string;
  matchedPhotoId: string;
  score: number;
  logs: string;
}

interface HybridCandidate {
  name: string;
  score: number;
  product: Product;
}

export async function matchProducts(
  requests: MatchRequest[],
  productType: 'alcohol' | 'cng',
  apiKey: string,
  onProgress?: (current: number, total: number) => void
): Promise<MatchResult[]> {
  const results: MatchResult[] = [];
  const allProducts = getAllProducts(productType);
  
  // Handle empty database
  if (!allProducts || allProducts.length === 0) {
    console.error('Database is empty or not available');
    return requests.map(req => ({
      productName: req.productName,
      matchedName: '',
      matchedUrl: '',
      matchedUpc: '',
      matchedPhotoId: '',
      score: 0,
      logs: 'Database not available',
    }));
  }
  
  console.log(`Starting batch matching for ${requests.length} products against ${allProducts.length} database items`);
  
  // Stage 1: Fuzzy pre-filter for all products (parallel)
  console.log('Stage 1: Fuzzy pre-filtering...');
  const fuzzyResults: Map<number, FuzzyCandidate[]> = new Map();
  
  for (const request of requests) {
    const candidates = fuzzyPrefilter(request.productName, allProducts, 50);
    fuzzyResults.set(request.productIndex, candidates);
  }
  
  // Stage 2: Batch embedding generation
  console.log('Stage 2: Generating embeddings in batches...');
  
  // Collect all texts that need embeddings
  const embeddingRequests: EmbeddingRequest[] = [];
  
  requests.forEach((request) => {
    const candidates = fuzzyResults.get(request.productIndex) || [];
    
    // Add query embedding request
    embeddingRequests.push({
      productIndex: request.productIndex,
      text: request.productName,
      type: 'query',
    });
    
    // Add candidate embedding requests
    candidates.forEach((candidate, candIdx) => {
      embeddingRequests.push({
        productIndex: request.productIndex,
        text: candidate.name,
        type: 'candidate',
        candidateIndex: candIdx,
      });
    });
  });
  
  console.log(`   Generating ${embeddingRequests.length} embeddings in batches...`);
  const embeddingResults = await batchGenerateEmbeddings(embeddingRequests, apiKey);
  
  // Stage 3: Calculate hybrid scores
  console.log('Stage 3: Calculating hybrid scores...');
  const hybridCandidates: Map<number, HybridCandidate[]> = new Map();
  
  requests.forEach((request) => {
    const queryEmbedding = embeddingResults.find(
      e => e.productIndex === request.productIndex && e.type === 'query'
    );
    
    if (!queryEmbedding) return;
    
    const candidateEmbeddings = embeddingResults.filter(
      e => e.productIndex === request.productIndex && e.type === 'candidate'
    );
    
    const fuzzyCandidates = fuzzyResults.get(request.productIndex) || [];
    const hybrid: HybridCandidate[] = [];
    
    candidateEmbeddings.forEach((candEmb) => {
      if (candEmb.candidateIndex === undefined) return;
      
      const fuzzyCandidate = fuzzyCandidates[candEmb.candidateIndex];
      if (!fuzzyCandidate) return;
      
      const embeddingScore = cosineSimilarity(queryEmbedding.embedding, candEmb.embedding) * 10;
      const fuzzyScore = fuzzyCandidate.score / 10; // Convert 0-100 to 0-10
      
      // Combine: 70% embedding + 30% fuzzy
      const hybridScore = (embeddingScore * 0.7) + (fuzzyScore * 0.3);
      
      hybrid.push({
        name: fuzzyCandidate.name,
        score: hybridScore,
        product: fuzzyCandidate.product,
      });
    });
    
    // Sort by hybrid score
    hybrid.sort((a, b) => b.score - a.score);
    hybridCandidates.set(request.productIndex, hybrid.slice(0, 10));
  });
  
  // Stage 4: GPT verification and final results
  console.log('Stage 4: GPT verification...');
  
  for (let i = 0; i < requests.length; i++) {
    const request = requests[i];
    const candidates = hybridCandidates.get(request.productIndex) || [];
    
    // Filter candidates with score >= 5.0
    const goodCandidates = candidates.filter(c => c.score >= 5.0).slice(0, 3);
    
    if (goodCandidates.length === 0) {
      results.push({
        productName: request.productName,
        matchedName: '',
        matchedUrl: '',
        matchedUpc: '',
        matchedPhotoId: '',
        score: candidates[0]?.score || 0,
        logs: `Hybrid score too low (${candidates[0]?.score.toFixed(1) || 0}/10 - need >= 5.0)`,
      });
      continue;
    }
    
    // GPT verification
    const gptResult = await verifyWithGPT(
      request.productName,
      goodCandidates.map(c => ({ name: c.name, score: c.score })),
      productType,
      apiKey
    );
    
    if (!gptResult.matchedName || gptResult.score < 5) {
      results.push({
        productName: request.productName,
        matchedName: '',
        matchedUrl: '',
        matchedUpc: '',
        matchedPhotoId: '',
        score: gptResult.score,
        logs: `GPT rejected: Score ${gptResult.score}/10 too low`,
      });
      continue;
    }
    
    // Find matched product
    const matchedCandidate = goodCandidates.find(c => c.name === gptResult.matchedName);
    
    if (!matchedCandidate) {
      results.push({
        productName: request.productName,
        matchedName: '',
        matchedUrl: '',
        matchedUpc: '',
        matchedPhotoId: '',
        score: 0,
        logs: 'GPT match not found in candidates',
      });
      continue;
    }
    
    // Success!
    results.push({
      productName: request.productName,
      matchedName: matchedCandidate.product.item_name,
      matchedUrl: matchedCandidate.product.primary_photo_url,
      matchedUpc: matchedCandidate.product.upc,
      matchedPhotoId: matchedCandidate.product.primary_photo_id,
      score: gptResult.score,
      logs: `Match verified by AI (${gptResult.score}/10)`,
    });
    
    // Report progress
    if (onProgress) {
      onProgress(i + 1, requests.length);
    }
  }
  
  return results;
}

