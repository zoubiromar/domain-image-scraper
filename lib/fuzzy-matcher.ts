import Fuse from 'fuse.js';
import { Product } from './database';

export interface FuzzyCandidate {
  product: Product;
  score: number;
  name: string;
  index: number;
}

function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[len1][len2];
}

function tokenSetRatio(tokens1: string[], tokens2: string[]): number {
  if (!tokens1 || !tokens2) return 0;
  
  const set1 = new Set(tokens1);
  const set2 = new Set(tokens2);
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  if (union.size === 0) return 0;
  
  return intersection.size / union.size;
}

export function fuzzyScore(query: string, candidate: Product): number {
  const queryNorm = normalizeText(query);
  const candNorm = candidate.normalized_name;
  
  if (!queryNorm || !candNorm) return 0;
  
  // Exact match
  if (queryNorm === candNorm) return 100;
  
  // Levenshtein similarity (0-30 points)
  const levDist = levenshteinDistance(queryNorm, candNorm);
  const levSim = 1 - (levDist / Math.max(queryNorm.length, candNorm.length));
  const levScore = levSim * 30;
  
  // Token set ratio (0-70 points)
  const queryTokens = queryNorm.split(' ').filter(t => t.length > 1);
  const candTokens = JSON.parse(candidate.tokens || '[]');
  const tokenScore = tokenSetRatio(queryTokens, candTokens) * 70;
  
  return levScore + tokenScore;
}

export function fuzzyPrefilter(
  query: string,
  products: Product[],
  topN: number = 50
): FuzzyCandidate[] {
  const scored = products.map((product, index) => ({
    product,
    score: fuzzyScore(query, product),
    name: product.item_name,
    index
  }));
  
  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);
  
  // Return top N
  return scored.slice(0, topN);
}

