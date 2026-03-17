// src/app/api/evolution/placeholders/[id]/implement/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

interface ImplementationResultRequest {
  files: any[];
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body: ImplementationResultRequest = await request.json();

    const implementationResult = await createImplementationResult(id, body.files);
    return NextResponse.json(implementationResult);
  } catch (error) {
    logger.error('Error creating implementation result:', error);
    return NextResponse.json({ error: 'Failed to create implementation result' }, { status: 500 });
  }
}

async function createImplementationResult(placeholderId: string, files: any[]) {
  return await db.implementationResult.create({
    data: {
      placeholderId,
      files: JSON.stringify(files || []),
      timestamp: new Date()
    }
  });
}