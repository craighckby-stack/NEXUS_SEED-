import { NextRequest, NextResponse } from 'next/server';
import { TriLoopReasoning } from '@/lib/reasoning/tri-loop';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

interface Context {
  sessionId: string;
  timestamp: number;
  userId?: string;
}

interface ReasoningTrace {
  queryId: string;
  userId: string | null;
  ethicalRiskScore: number;
  riskCategory: string;
  riskFactors: string[];
  strategy: string;
  certaintyGain: number;
  timePenalty: number;
  computationalCost: number;
  ccrr: number;
  decision: string;
  justification: string;
  improvementPlan?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { query, context = {} } = await request.json();

    const reasoning = new TriLoopReasoning();
    const { trace, sessionId } = await reasoning.reason(query, { ...context, sessionId: uuidv4() });

    await db.reasoningTrace.create({
      data: {
        queryId: trace.queryId,
        userId: context.userId || null,
        ethicalRiskScore: trace.ethicalRiskScore,
        riskCategory: trace.riskCategory,
        riskFactors: trace.riskFactors.join(', '),
        strategy: trace.strategy,
        certaintyGain: trace.certaintyGain,
        timePenalty: trace.timePenalty,
        computationalCost: trace.computationalCost,
        ccrr: trace.ccrr,
        decision: trace.decision,
        justification: JSON.stringify(trace.justification),
        improvementPlan: trace.improvementPlan ? JSON.stringify(trace.improvementPlan) : undefined,
      }
    });

    return NextResponse.json({
      success: true,
      trace,
      sessionId,
    });
  } catch (error: any) {
    console.error('Reasoning API error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}