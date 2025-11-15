import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';

// Test endpoint to diagnose database connection
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    environment: process.env.VERCEL_ENV || 'local',
    blobUrl: process.env.DATABASE_BLOB_URL ? 'Set (hidden)' : 'NOT SET',
    blobUrlValue: process.env.DATABASE_BLOB_URL?.substring(0, 50) + '...',
  };
  
  try {
    console.log('🔍 Testing database connection...');
    console.log('Environment:', diagnostics.environment);
    console.log('Blob URL set:', diagnostics.blobUrl);
    console.log('Blob URL value:', diagnostics.blobUrlValue);
    
    const db = await getDatabase();
    
    if (!db) {
      diagnostics.status = 'FAILED';
      diagnostics.error = 'getDatabase() returned null';
      
      // Try to fetch Blob URL directly
      if (process.env.DATABASE_BLOB_URL) {
        try {
          console.log('Testing direct fetch to Blob URL...');
          const response = await fetch(process.env.DATABASE_BLOB_URL);
          diagnostics.fetchTest = {
            status: response.status,
            ok: response.ok,
            contentType: response.headers.get('content-type'),
            contentLength: response.headers.get('content-length'),
          };
          console.log('Fetch test result:', diagnostics.fetchTest);
        } catch (fetchError: any) {
          diagnostics.fetchError = fetchError.message;
          console.error('Fetch error:', fetchError);
        }
      }
      
      return NextResponse.json(diagnostics, { status: 503 });
    }
    
    // Database loaded successfully - test queries
    console.log('✅ Database loaded, testing queries...');
    
    try {
      const alcoholCount = db.prepare('SELECT COUNT(*) as count FROM alcohol_products').get() as { count: number };
      const cngCount = db.prepare('SELECT COUNT(*) as count FROM cng_products').get() as { count: number };
      
      diagnostics.status = 'SUCCESS';
      diagnostics.alcoholProducts = alcoholCount.count;
      diagnostics.cngProducts = cngCount.count;
      diagnostics.totalProducts = alcoholCount.count + cngCount.count;
      
      // Test a simple query
      const sampleProduct = db.prepare('SELECT * FROM alcohol_products LIMIT 1').get();
      diagnostics.sampleProductFound = !!sampleProduct;
      
      console.log('✅ Database working!', diagnostics);
      
      return NextResponse.json(diagnostics, { status: 200 });
      
    } catch (queryError: any) {
      diagnostics.status = 'QUERY_ERROR';
      diagnostics.queryError = queryError.message;
      console.error('Query error:', queryError);
      return NextResponse.json(diagnostics, { status: 500 });
    }
    
  } catch (error: any) {
    diagnostics.status = 'ERROR';
    diagnostics.error = error.message;
    diagnostics.stack = error.stack;
    console.error('Test error:', error);
    return NextResponse.json(diagnostics, { status: 500 });
  }
}

