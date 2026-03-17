import { NextResponse } from 'next/server';
import { getAGI } from '@/lib/agi/core';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const agi = await getAGI();
    const stats = await agi.getStats();
    const status = agi.getStatus();

    const agents = await db.aGIAgent.findMany({
      orderBy: { type: 'asc' }
    });

    const recentLogs = await db.aGILog.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' }
    });

    const recentCycles = await db.evolutionCycle.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      stats,
      status,
      agents: agents.map(a => ({
        ...a,
        capabilities: JSON.parse(a.capabilities)
      })),
      recentLogs,
      recentCycles
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
