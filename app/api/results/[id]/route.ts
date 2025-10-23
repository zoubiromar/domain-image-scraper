import { NextRequest, NextResponse } from 'next/server';
import { getStorage } from '@/lib/storage';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const taskId = params.id;
  
  // Get storage instance
  const storage = getStorage();

  // Check if results exist
  const result = await storage.get(taskId);

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
