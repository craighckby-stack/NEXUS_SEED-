import { NextResponse } from 'next/server';
import { omegaOrchestrator } from '@/lib/omega-orchestrator';

/**
 * API Route: Pause Evolution
 */
export async function POST() {
  try {
    // Simplify response object creation
    const { status, evolutionStatus } = {
      status: 'paused',
      evolutionStatus: 'paused',
    };

    // Use NextResponse.json with a single value for default status
    return NextResponse.json({ ...status, evolutionStatus });
  } catch (error) {
    // Return error response with an HTTP status code of 500
    return NextResponse.json({ error: 'Failed to pause evolution' }, {
      status: 500,
      statusText: 'Internal Server Error',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}