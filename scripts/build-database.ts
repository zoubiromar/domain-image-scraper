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
  console.log('🔨 Building URPC Product Database...\n');
  
  const sourceDir = path.join(__dirname, '../../');
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
    
    CREATE TABLE cng_products (
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
  const alcoholXlsxPath = path.join(sourceDir, 'URPC Alcohol Photos w photoIDs.xlsx');
  
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
  console.log(`✅ Inserted ${db.prepare('SELECT COUNT(*) as count FROM alcohol_products').get().count} alcohol products\n`);
  
  // Load CnG data
  console.log('📦 Loading CnG data from XLSX...');
  const cngXlsxPath = path.join(sourceDir, 'URPC CnG (Alc_Snack_Drinks) Photos w photoIDs.xlsx');
  
  if (!fs.existsSync(cngXlsxPath)) {
    console.error('❌ CnG XLSX file not found:', cngXlsxPath);
    process.exit(1);
  }
  
  const cngWorkbook = XLSX.readFile(cngXlsxPath);
  const cngSheetName = cngWorkbook.SheetNames[0]; // First sheet
  const cngData = XLSX.utils.sheet_to_json(cngWorkbook.Sheets[cngSheetName], { raw: false });
  
  console.log(`   Found ${cngData.length} CnG products`);
  
  // Insert CnG data
  const cngInsert = db.prepare(`
    INSERT OR REPLACE INTO cng_products (upc, item_name, primary_photo_url, primary_photo_id, normalized_name, tokens)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  const cngTransaction = db.transaction((products: any[]) => {
    for (const product of products) {
      const itemName = String(product.item_name || '').trim();
      const photoUrl = String(product.primary_photo_url || '').trim();
      
      if (!itemName || !photoUrl) continue;
      
      const normalized = normalizeText(itemName);
      const tokens = JSON.stringify(tokenizeText(itemName));
      
      cngInsert.run(
        String(product.upc || ''),
        itemName,
        photoUrl,
        String(product.primary_photo_id || ''),
        normalized,
        tokens
      );
    }
  });
  
  cngTransaction(cngData);
  console.log(`✅ Inserted ${db.prepare('SELECT COUNT(*) as count FROM cng_products').get().count} CnG products\n`);
  
  // Create indexes for fast lookups
  console.log('📊 Creating indexes...');
  db.exec(`
    CREATE INDEX idx_alcohol_name ON alcohol_products(item_name);
    CREATE INDEX idx_alcohol_normalized ON alcohol_products(normalized_name);
    CREATE INDEX idx_cng_name ON cng_products(item_name);
    CREATE INDEX idx_cng_normalized ON cng_products(normalized_name);
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

