import { NextRequest, NextResponse } from 'next/server';
import { resultsStore } from '@/lib/results-store';

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
