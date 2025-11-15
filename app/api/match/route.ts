import { NextRequest, NextResponse } from 'next/server';
import { matchProducts, MatchRequest } from '@/lib/matcher';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { products, productType, apiKey } = body;
    
    if (!products || !Array.isArray(products)) {
      return NextResponse.json(
        { error: 'Products array is required' },
        { status: 400 }
      );
    }
    
    if (!productType || (productType !== 'alcohol' && productType !== 'cng')) {
      return NextResponse.json(
        { error: 'Product type must be "alcohol" or "cng"' },
        { status: 400 }
      );
    }
    
    if (!apiKey || typeof apiKey !== 'string') {
      return NextResponse.json(
        { error: 'OpenAI API key is required' },
        { status: 400 }
      );
    }
    
    // Limit batch size
    if (products.length > 200) {
      return NextResponse.json(
        { error: 'Maximum 200 products per batch' },
        { status: 400 }
      );
    }
    
    // Create match requests
    const requests: MatchRequest[] = products.map((name: string, index: number) => ({
      productName: name,
      productIndex: index,
    }));
    
    // Process matches
    const results = await matchProducts(requests, productType, apiKey);
    
    return NextResponse.json({
      success: true,
      results,
      stats: {
        total: results.length,
        matched: results.filter(r => r.matchedName).length,
        rejected: results.filter(r => !r.matchedName).length,
      },
    });
    
  } catch (error: any) {
    console.error('Match API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

