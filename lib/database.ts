import path from 'path';
import fs from 'fs';

let db: any = null;
let dbInitialized = false;

export async function getDatabase(): Promise<any> {
  // Skip during build
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    console.log('[DB] Skipping database during build phase');
    return null;
  }
  
  if (db && dbInitialized) {
    console.log('[DB] Using cached database');
    return db;
  }
  
  console.log('[DB] Initializing database...');
  console.log('[DB] Environment:', process.env.VERCEL_ENV || 'local');
  
  try {
    const localPath = path.join(process.cwd(), 'public/database/products.db');
    console.log('[DB] Checking local path:', localPath);
    
    // Try local file first (for development)
    if (fs.existsSync(localPath)) {
      console.log('[DB] Local database file found');
      try {
        const Database = require('better-sqlite3');
        db = new Database(localPath, { readonly: true });
        dbInitialized = true;
        console.log('✅ [DB] Database loaded from local file');
        return db;
      } catch (sqliteError) {
        console.error('[DB] Error loading local database:', sqliteError);
      }
    } else {
      console.log('[DB] Local database file not found');
    }
    
    // If not local, try Vercel Blob
    const blobUrl = process.env.DATABASE_BLOB_URL;
    console.log('[DB] DATABASE_BLOB_URL environment variable:', blobUrl ? 'Set' : 'NOT SET');
    console.log('[DB] Blob URL:', blobUrl);
    
    if (blobUrl) {
      console.log('[DB] Attempting to fetch from Blob...');
      
      try {
        const response = await fetch(blobUrl);
        console.log('[DB] Fetch response status:', response.status);
        console.log('[DB] Fetch response OK:', response.ok);
        
        if (response.ok) {
          console.log('[DB] Downloading database...');
          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          console.log('[DB] Downloaded', buffer.length, 'bytes');
          
          // Save to tmp directory (Vercel has writable /tmp)
          const tmpPath = '/tmp/products.db';
          fs.writeFileSync(tmpPath, buffer);
          console.log('[DB] Saved to:', tmpPath);
          
          // Open database
          try {
            const Database = require('better-sqlite3');
            db = new Database(tmpPath, { readonly: true });
            dbInitialized = true;
            
            // Test query
            const test = db.prepare('SELECT COUNT(*) as count FROM alcohol_products').get();
            console.log('✅ [DB] Database loaded from Vercel Blob, alcohol products:', test);
            
            return db;
          } catch (sqliteError) {
            console.error('[DB] Error opening SQLite database:', sqliteError);
            return null;
          }
        } else {
          console.error('[DB] Fetch failed with status:', response.status);
        }
      } catch (fetchError) {
        console.error('[DB] Fetch error:', fetchError);
      }
    } else {
      console.warn('[DB] No Blob URL configured');
    }
    
    console.warn('⚠️ [DB] Database not available - no local file and no successful Blob fetch');
    return null;
    
  } catch (error) {
    console.error('❌ [DB] Unexpected error:', error);
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
