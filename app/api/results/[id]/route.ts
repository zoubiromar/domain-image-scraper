import { NextRequest, NextResponse } from 'next/server';

// This should match the store in the scrape route
// In production, use a proper database or Redis
const resultsStore = new Map<string, any>();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const taskId = params.id;

  // Check if results exist
  const result = resultsStore.get(taskId);

  if (!result) {
    return NextResponse.json(
      { 
        status: 'not_found',
        error: 'Task not found or results expired' 
      },
      { status: 404 }
    );
  }

  return NextResponse.json(result);
}
