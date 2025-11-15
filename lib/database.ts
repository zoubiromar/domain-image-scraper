import path from 'path';
import fs from 'fs';

let db: any = null;

export function getDatabase(): any {
  // Skip database in build/static generation
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return null;
  }
  
  if (!db) {
    try {
      const dbPath = path.join(process.cwd(), 'public/database/products.db');
      
      // Check if database exists
      if (!fs.existsSync(dbPath)) {
        console.warn('Database not found at:', dbPath);
        return null;
      }
      
      // Dynamic import to avoid build issues
      try {
        const Database = require('better-sqlite3');
        db = new Database(dbPath, { readonly: true });
      } catch (requireError) {
        console.error('better-sqlite3 not available:', requireError);
        return null;
      }
    } catch (error) {
      console.error('Error opening database:', error);
      return null;
    }
  }
  return db;
}

export interface Product {
  upc: string;
  item_name: string;
  primary_photo_url: string;
  primary_photo_id: string;
  normalized_name: string;
  tokens: string;
}

export function fuzzySearch(
  query: string,
  productType: 'alcohol' | 'cng',
  limit: number = 50
): Product[] {
  const db = getDatabase();
  if (!db) return [];
  
  const table = productType === 'alcohol' ? 'alcohol_products' : 'cng_products';
  
  const normalized = query.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
  const words = normalized.split(' ').filter(w => w.length > 1);
  
  if (words.length === 0) return [];
  
  try {
    // Build LIKE query for fuzzy matching
    const likeConditions = words.map(() => `normalized_name LIKE ?`).join(' OR ');
    const likeParams = words.map(w => `%${w}%`);
    
    const query_sql = `
      SELECT * FROM ${table}
      WHERE ${likeConditions}
      LIMIT ?
    `;
    
    const results = db.prepare(query_sql).all(...likeParams, limit) as Product[];
    return results;
  } catch (error) {
    console.error('Database query error:', error);
    return [];
  }
}

export function getAllProducts(productType: 'alcohol' | 'cng'): Product[] {
  const db = getDatabase();
  if (!db) return [];
  
  try {
    const table = productType === 'alcohol' ? 'alcohol_products' : 'cng_products';
    return db.prepare(`SELECT * FROM ${table}`).all() as Product[];
  } catch (error) {
    console.error('Database query error:', error);
    return [];
  }
}

export function getProductByUPC(upc: string, productType: 'alcohol' | 'cng'): Product | null {
  const db = getDatabase();
  if (!db) return null;
  
  try {
    const table = productType === 'alcohol' ? 'alcohol_products' : 'cng_products';
    return db.prepare(`SELECT * FROM ${table} WHERE upc = ?`).get(upc) as Product | null;
  } catch (error) {
    console.error('Database query error:', error);
    return null;
  }
}

export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}

