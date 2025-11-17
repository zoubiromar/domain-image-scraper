// Utility to check if we're running on server side
export const isServer = typeof window === 'undefined';

// Safe database check that won't break builds
export function isDatabaseAvailable(): boolean {
  if (!isServer) return false;
  
  try {
    const fs = require('fs');
    const path = require('path');
    const dbPath = path.join(process.cwd(), 'public/database/products.db');
    return fs.existsSync(dbPath);
  } catch {
    return false;
  }
}


