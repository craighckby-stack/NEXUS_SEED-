// src/app/api/llm2/evolution/start/route.ts
import { NextResponse } from 'next/server';
import { omegaOrchestrator } from '@/lib/omega-orchestrator';
import { experienceDatabase } from '@/lib/memory/experience-database';

/**
 * API Route: Start Evolution Cycle
 *
 * @returns {object} API response with evolution cycle metadata
 */
export async function POST() {
  try {
    const { cycle, phase, progress, strategiesApplied, improvement } = await omegaOrchestrator.startEvolutionCycle();
    const response = {
      status: 'running',
      cycle,
      phase,
      progress,
      strategiesApplied,
      improvement,
    };
    return NextResponse.json(response);
  } catch (error) {
    const errorResponse = {
      error: 'Failed to start evolution cycle',
      message: error.message,
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}