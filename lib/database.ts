import path from 'path';
import fs from 'fs';

let db: any = null;
let dbInitialized = false;

export async function getDatabase(): Promise<any> {
  // Skip during build
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return null;
  }
  
  if (db && dbInitialized) return db;
  
  try {
    const localPath = path.join(process.cwd(), 'public/database/products.db');
    
    // Try local file first (for development)
    if (fs.existsSync(localPath)) {
      const Database = require('better-sqlite3');
      db = new Database(localPath, { readonly: true });
      dbInitialized = true;
      console.log('✅ Database loaded from local file');
      return db;
    }
    
    // If not local, try Vercel Blob
    const blobUrl = process.env.DATABASE_BLOB_URL;
    if (blobUrl) {
      console.log('📦 Downloading database from Vercel Blob...');
      
      // Fetch database from Blob
      const response = await fetch(blobUrl);
      
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        // Save to tmp directory (Vercel has writable /tmp)
        const tmpPath = '/tmp/products.db';
        fs.writeFileSync(tmpPath, buffer);
        
        // Open database
        const Database = require('better-sqlite3');
        db = new Database(tmpPath, { readonly: true });
        dbInitialized = true;
        
        console.log('✅ Database loaded from Vercel Blob');
        return db;
      }
    }
    
    console.warn('⚠️ Database not available - no local file and no Blob URL');
    return null;
    
  } catch (error) {
    console.error('❌ Database error:', error);
    return null;
  }
}

export interface Product {
  upc: string;
  item_name: string;
  primary_photo_url: string;
  primary_photo_id: string;
  normalized_name: string;
  tokens: string;
}

export async function fuzzySearch(
  query: string,
  productType: 'alcohol' | 'cng',
  limit: number = 50
): Promise<Product[]> {
  const db = await getDatabase();
  if (!db) return [];
  
  const table = productType === 'alcohol' ? 'alcohol_products' : 'cng_products';
  const normalized = query.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
  const words = normalized.split(' ').filter((w: string) => w.length > 1);
  
  if (words.length === 0) return [];
  
  try {
    const likeConditions = words.map(() => `normalized_name LIKE ?`).join(' OR ');
    const likeParams = words.map((w: string) => `%${w}%`);
    
    const results = db.prepare(`
      SELECT * FROM ${table}
      WHERE ${likeConditions}
      LIMIT ?
    `).all(...likeParams, limit) as Product[];
    
    return results;
  } catch (error) {
    console.error('Database query error:', error);
    return [];
  }
}

export async function getAllProducts(productType: 'alcohol' | 'cng'): Promise<Product[]> {
  const db = await getDatabase();
  if (!db) return [];
  
  try {
    const table = productType === 'alcohol' ? 'alcohol_products' : 'cng_products';
    return db.prepare(`SELECT * FROM ${table}`).all() as Product[];
  } catch (error) {
    console.error('Database query error:', error);
    return [];
  }
}

export async function getProductByUPC(upc: string, productType: 'alcohol' | 'cng'): Promise<Product | null> {
  const db = await getDatabase();
  if (!db) return null;
  
  try {
    const table = productType === 'alcohol' ? 'alcohol_products' : 'cng_products';
    return db.prepare(`SELECT * FROM ${table} WHERE upc = ?`).get(upc) as Product | null;
  } catch (error) {
    console.error('Database query error:', error);
    return null;
  }
}

export async function closeDatabase() {
  if (db) {
    db.close();
    db = null;
    dbInitialized = false;
  }
}
