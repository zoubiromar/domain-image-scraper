import * as XLSX from 'xlsx';
import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';

// Helper functions for text normalization (matching Google Apps Script logic)
function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenizeText(text: string): string[] {
  const normalized = normalizeText(text);
  if (!normalized) return [];
  
  const words = normalized.split(' ');
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'of', 'at', 'by', 'for', 'with', 'from', 'to', 'in', 'on']);
  
  return words.filter(w => !stopWords.has(w) && w.length > 1);
}

async function buildDatabase() {
  console.log('🔨 Building Product Catalog Database...\n');
  
  const sourceDir = path.join(__dirname, '../data/');
  const dbPath = path.join(__dirname, '../public/database/products.db');
  
  // Ensure database directory exists
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  
  // Remove old database if exists
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
    console.log('🗑️  Removed old database');
  }
  
  // Create new database
  const db = new Database(dbPath);
  console.log('✅ Created new SQLite database\n');
  
  // Create tables
  console.log('📋 Creating tables...');
  
  db.exec(`
    CREATE TABLE alcohol_products (
      upc TEXT PRIMARY KEY,
      item_name TEXT NOT NULL,
      primary_photo_url TEXT,
      primary_photo_id TEXT,
      normalized_name TEXT,
      tokens TEXT
    );
    
    CREATE TABLE grocery_products (
      upc TEXT PRIMARY KEY,
      item_name TEXT NOT NULL,
      primary_photo_url TEXT,
      primary_photo_id TEXT,
      normalized_name TEXT,
      tokens TEXT
    );
  `);
  
  console.log('✅ Tables created\n');
  
  // Load Alcohol data
  console.log('📦 Loading Alcohol data from XLSX...');
  const alcoholXlsxPath = path.join(sourceDir, 'alcohol_catalog.xlsx');
  
  if (!fs.existsSync(alcoholXlsxPath)) {
    console.error('❌ Alcohol XLSX file not found:', alcoholXlsxPath);
    process.exit(1);
  }
  
  const alcoholWorkbook = XLSX.readFile(alcoholXlsxPath);
  const alcoholSheetName = alcoholWorkbook.SheetNames[0]; // First sheet
  const alcoholData = XLSX.utils.sheet_to_json(alcoholWorkbook.Sheets[alcoholSheetName], { raw: false });
  
  console.log(`   Found ${alcoholData.length} alcohol products`);
  
  // Insert alcohol data
  const alcoholInsert = db.prepare(`
    INSERT OR REPLACE INTO alcohol_products (upc, item_name, primary_photo_url, primary_photo_id, normalized_name, tokens)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  const alcoholTransaction = db.transaction((products: any[]) => {
    for (const product of products) {
      const itemName = String(product.item_name || '').trim();
      const photoUrl = String(product.primary_photo_url || '').trim();
      
      if (!itemName || !photoUrl) continue; // Skip invalid rows
      
      const normalized = normalizeText(itemName);
      const tokens = JSON.stringify(tokenizeText(itemName));
      
      alcoholInsert.run(
        String(product.upc || ''),
        itemName,
        photoUrl,
        String(product.primary_photo_id || ''),
        normalized,
        tokens
      );
    }
  });
  
  alcoholTransaction(alcoholData);
  const alcoholCount = db.prepare('SELECT COUNT(*) as count FROM alcohol_products').get() as { count: number };
  console.log(`✅ Inserted ${alcoholCount.count} alcohol products\n`);
  
  // Load Grocery data
  console.log('📦 Loading Grocery data from XLSX...');
  const groceryXlsxPath = path.join(sourceDir, 'grocery_catalog.xlsx');
  
  if (!fs.existsSync(groceryXlsxPath)) {
    console.error('❌ Grocery XLSX file not found:', groceryXlsxPath);
    process.exit(1);
  }
  
  const groceryWorkbook = XLSX.readFile(groceryXlsxPath);
  const grocerySheetName = groceryWorkbook.SheetNames[0]; // First sheet
  const groceryData = XLSX.utils.sheet_to_json(groceryWorkbook.Sheets[grocerySheetName], { raw: false });
  
  console.log(`   Found ${groceryData.length} Grocery products`);
  
  // Insert Grocery data
  const groceryInsert = db.prepare(`
    INSERT OR REPLACE INTO grocery_products (upc, item_name, primary_photo_url, primary_photo_id, normalized_name, tokens)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  const groceryTransaction = db.transaction((products: any[]) => {
    for (const product of products) {
      const itemName = String(product.item_name || '').trim();
      const photoUrl = String(product.primary_photo_url || '').trim();
      
      if (!itemName || !photoUrl) continue;
      
      const normalized = normalizeText(itemName);
      const tokens = JSON.stringify(tokenizeText(itemName));
      
      groceryInsert.run(
        String(product.upc || ''),
        itemName,
        photoUrl,
        String(product.primary_photo_id || ''),
        normalized,
        tokens
      );
    }
  });
  
  groceryTransaction(groceryData);
  const groceryCount = db.prepare('SELECT COUNT(*) as count FROM grocery_products').get() as { count: number };
  console.log(`✅ Inserted ${groceryCount.count} Grocery products\n`);
  
  // Create indexes for fast lookups
  console.log('📊 Creating indexes...');
  db.exec(`
    CREATE INDEX idx_alcohol_name ON alcohol_products(item_name);
    CREATE INDEX idx_alcohol_normalized ON alcohol_products(normalized_name);
    CREATE INDEX idx_grocery_name ON grocery_products(item_name);
    CREATE INDEX idx_grocery_normalized ON grocery_products(normalized_name);
  `);
  console.log('✅ Indexes created\n');
  
  // Close database
  db.close();
  
  // Show database size
  const stats = fs.statSync(dbPath);
  const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
  
  console.log('🎉 Database build complete!');
  console.log(`   Location: ${dbPath}`);
  console.log(`   Size: ${sizeMB} MB\n`);
  
  console.log('✅ Ready to use in web app!');
}

buildDatabase().catch(console.error);

