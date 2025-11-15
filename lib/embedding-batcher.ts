import OpenAI from 'openai';

export interface EmbeddingRequest {
  productIndex: number;
  text: string;
  type: 'query' | 'candidate';
  candidateIndex?: number;
}

export interface EmbeddingResult {
  productIndex: number;
  type: 'query' | 'candidate';
  candidateIndex?: number;
  embedding: number[];
}

export async function batchGenerateEmbeddings(
  requests: EmbeddingRequest[],
  apiKey: string
): Promise<EmbeddingResult[]> {
  const client = new OpenAI({ apiKey });
  
  // OpenAI allows up to 2,048 inputs per call, but we'll use 100 for safety
  const BATCH_SIZE = 100;
  const allResults: EmbeddingResult[] = [];
  
  for (let i = 0; i < requests.length; i += BATCH_SIZE) {
    const batch = requests.slice(i, i + BATCH_SIZE);
    const texts = batch.map(r => r.text);
    
    try {
      const response = await client.embeddings.create({
        model: 'text-embedding-3-small',
        input: texts,
      });
      
      // Map embeddings back to requests
      batch.forEach((request, idx) => {
        allResults.push({
          productIndex: request.productIndex,
          type: request.type,
          candidateIndex: request.candidateIndex,
          embedding: response.data[idx].embedding,
        });
      });
      
    } catch (error) {
      console.error(`Batch embedding error for batch ${i / BATCH_SIZE}:`, error);
      throw error;
    }
  }
  
  return allResults;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  if (normA === 0 || normB === 0) return 0;
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

