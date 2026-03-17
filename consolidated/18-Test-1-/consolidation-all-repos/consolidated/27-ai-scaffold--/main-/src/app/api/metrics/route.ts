// src/app/api/metrics/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { metrics } from '@/constants/metrics'; // Import from constants

/**
 * API endpoint for fetching application metrics.
 * @returns A JSON response containing the metrics.
 */
export async function GET() {
  try {
    const counts = await Promise.all([
      db.concept.count(),
      db.experience.count(),
      db.reasoningTrace.count(),
      db.encryptedPacket.count(),
    ]);

    const metricsResponse = {
      totalConcepts: counts[0],
      totalExperiences: counts[1],
      encryptedPackets: counts[3],
      reasoningTraces: counts[2],
      activeAgents: 17, // Hardcoded value, consider making it dynamic
      currentCycle: 0,
      status: metrics.status, // Use a constant for the status object
    };

    return NextResponse.json(metricsResponse);
  } catch (error) {
    console.error('Error fetching metrics:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch metrics',
      },
      { status: 500 }
    );
  }
}

// Example usage of the metrics object
export const metrics = {
  status: {
    consciousness: 'ACTIVE',
    reasoning: 'ACTIVE',
    memory: 'ACTIVE',
    agents: 'ACTIVE',
    security: 'ACTIVE',
    learning: 'IDLE',
  },
};

//