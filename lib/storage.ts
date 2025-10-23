// Storage solution that works both locally and on Vercel
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

interface StoredResult {
  status: string;
  results: any;
  timestamp: string;
  expiresAt: number;
}

class FileSystemStore {
  private tempDir: string;
  private memoryCache: Map<string, StoredResult>;

  constructor() {
    // Use /tmp on Vercel, temp directory locally
    this.tempDir = process.env.VERCEL ? '/tmp' : path.join(os.tmpdir(), 'domain-scraper');
    this.memoryCache = new Map();
    this.ensureDirectory();
  }

  private async ensureDirectory() {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create temp directory:', error);
    }
  }

  private getFilePath(taskId: string): string {
    return path.join(this.tempDir, `task-${taskId}.json`);
  }

  async set(taskId: string, data: any): Promise<void> {
    const storedData: StoredResult = {
      ...data,
      expiresAt: Date.now() + 600000 // 10 minutes
    };

    // Store in memory cache first
    this.memoryCache.set(taskId, storedData);
    
    // Then persist to file
    try {
      const filePath = this.getFilePath(taskId);
      await fs.writeFile(filePath, JSON.stringify(storedData), 'utf8');
      console.log(`Stored result for task ${taskId} to file: ${filePath}`);
      
      // Schedule cleanup
      setTimeout(() => {
        this.delete(taskId);
      }, 600000);
    } catch (error) {
      console.error(`Failed to write file for task ${taskId}:`, error);
    }
  }

  async get(taskId: string): Promise<any | undefined> {
    // Check memory cache first
    if (this.memoryCache.has(taskId)) {
      const cached = this.memoryCache.get(taskId);
      if (cached && cached.expiresAt > Date.now()) {
        console.log(`Retrieved result for task ${taskId} from memory cache`);
        return cached;
      }
    }

    // Check file system
    try {
      const filePath = this.getFilePath(taskId);
      const fileContent = await fs.readFile(filePath, 'utf8');
      const data: StoredResult = JSON.parse(fileContent);
      
      // Check if expired
      if (data.expiresAt <= Date.now()) {
        console.log(`Task ${taskId} has expired`);
        await this.delete(taskId);
        return undefined;
      }
      
      // Update memory cache
      this.memoryCache.set(taskId, data);
      console.log(`Retrieved result for task ${taskId} from file`);
      return data;
    } catch (error) {
      console.log(`No result found for task ${taskId}`);
      return undefined;
    }
  }

  async delete(taskId: string): Promise<boolean> {
    // Remove from memory cache
    this.memoryCache.delete(taskId);
    
    // Remove file
    try {
      const filePath = this.getFilePath(taskId);
      await fs.unlink(filePath);
      console.log(`Deleted task ${taskId}`);
      return true;
    } catch (error) {
      return false;
    }
  }

  async has(taskId: string): Promise<boolean> {
    if (this.memoryCache.has(taskId)) {
      return true;
    }
    
    try {
      const filePath = this.getFilePath(taskId);
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async clear(): Promise<void> {
    this.memoryCache.clear();
    
    try {
      const files = await fs.readdir(this.tempDir);
      for (const file of files) {
        if (file.startsWith('task-')) {
          await fs.unlink(path.join(this.tempDir, file));
        }
      }
    } catch (error) {
      console.error('Failed to clear storage:', error);
    }
  }
}

// Create singleton instance
let storeInstance: FileSystemStore | null = null;

export function getStorage(): FileSystemStore {
  if (!storeInstance) {
    storeInstance = new FileSystemStore();
  }
  return storeInstance;
}
