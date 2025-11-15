import Database from 'better-sqlite3';
import path from 'path';

let db: Database.Database | null = null;

export function getDatabase() {
  if (!db) {
    const dbPath = path.join(process.cwd(), 'public/database/products.db');
    db = new Database(dbPath, { readonly: true });
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
  const table = productType === 'alcohol' ? 'alcohol_products' : 'cng_products';
  
  const normalized = query.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
  const words = normalized.split(' ').filter(w => w.length > 1);
  
  if (words.length === 0) return [];
  
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
}

export function getAllProducts(productType: 'alcohol' | 'cng'): Product[] {
  const db = getDatabase();
  const table = productType === 'alcohol' ? 'alcohol_products' : 'cng_products';
  return db.prepare(`SELECT * FROM ${table}`).all() as Product[];
}

export function getProductByUPC(upc: string, productType: 'alcohol' | 'cng'): Product | null {
  const db = getDatabase();
  const table = productType === 'alcohol' ? 'alcohol_products' : 'cng_products';
  return db.prepare(`SELECT * FROM ${table} WHERE upc = ?`).get(upc) as Product | null;
}

export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}

