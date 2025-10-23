// Shared results store for API routes
// In production, use a database like Vercel KV or Redis

interface StoredResult {
  status: string;
  results: any;
  timestamp: string;
}

class ResultsStore {
  private static instance: ResultsStore;
  private store: Map<string, StoredResult>;

  private constructor() {
    this.store = new Map();
  }

  static getInstance(): ResultsStore {
    if (!ResultsStore.instance) {
      ResultsStore.instance = new ResultsStore();
    }
    return ResultsStore.instance;
  }

  set(taskId: string, data: StoredResult): void {
    this.store.set(taskId, data);
    console.log(`Stored result for task ${taskId}`, data);
    
    // Clean old results after 10 minutes
    setTimeout(() => {
      this.delete(taskId);
    }, 600000);
  }

  get(taskId: string): StoredResult | undefined {
    const result = this.store.get(taskId);
    console.log(`Retrieved result for task ${taskId}:`, result ? 'found' : 'not found');
    return result;
  }

  delete(taskId: string): boolean {
    return this.store.delete(taskId);
  }

  has(taskId: string): boolean {
    return this.store.has(taskId);
  }

  clear(): void {
    this.store.clear();
  }
}

export const resultsStore = ResultsStore.getInstance();
