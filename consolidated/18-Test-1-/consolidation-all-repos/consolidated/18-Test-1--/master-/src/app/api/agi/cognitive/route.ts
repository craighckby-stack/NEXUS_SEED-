/**
 * AGI Cognitive API
 * Handles reasoning, thinking, and decision-making requests
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCognitiveCore } from '@/lib/agi';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, input, context, options, goal } = body;

    const cognitive = await getCognitiveCore();

    switch (action) {
      case 'think': {
        if (!input) {
          return NextResponse.json({ error: 'Input required for think action' }, { status: 400 });
        }
        const thought = await cognitive.think(input, context);
        return NextResponse.json({ success: true, thought });
      }

      case 'setGoal': {
        if (!goal) {
          return NextResponse.json({ error: 'Goal required' }, { status: 400 });
        }
        const thought = await cognitive.setGoal(goal);
        return NextResponse.json({ success: true, thought, goal });
      }

      case 'analyzeCode': {
        const { code, language } = body;
        if (!code) {
          return NextResponse.json({ error: 'Code required' }, { status: 400 });
        }
        const thought = await cognitive.analyzeCode(code, language || 'typescript');
        return NextResponse.json({ success: true, thought });
      }

      case 'generateCode': {
        const { description, language, patterns } = body;
        if (!description) {
          return NextResponse.json({ error: 'Description required' }, { status: 400 });
        }
        const thought = await cognitive.generateCode(description, language || 'typescript', patterns);
        return NextResponse.json({ success: true, thought });
      }

      case 'decide': {
        const { options: decisionOptions, context: decisionContext } = body;
        if (!decisionOptions || !Array.isArray(decisionOptions)) {
          return NextResponse.json({ error: 'Options array required' }, { status: 400 });
        }
        const decision = await cognitive.makeDecision(decisionOptions, decisionContext || '');
        return NextResponse.json({ success: true, decision });
      }

      case 'reflect': {
        const thought = await cognitive.reflect();
        return NextResponse.json({ success: true, thought });
      }

      case 'learn': {
        const { key, value } = body;
        if (!key || value === undefined) {
          return NextResponse.json({ error: 'Key and value required' }, { status: 400 });
        }
        await cognitive.learn(key, value);
        return NextResponse.json({ success: true, learned: { key, value } });
      }

      case 'getState': {
        const state = cognitive.getState();
        return NextResponse.json({ success: true, state });
      }

      case 'getHistory': {
        const history = cognitive.getConversationHistory();
        return NextResponse.json({ success: true, history });
      }

      case 'clearHistory': {
        cognitive.clearHistory();
        return NextResponse.json({ success: true, message: 'History cleared' });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Cognitive API error:', error);
    return NextResponse.json({
      error: 'Cognitive processing failed',
      message: (error as Error).message
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const cognitive = await getCognitiveCore();
    const state = cognitive.getState();
    
    return NextResponse.json({
      success: true,
      status: 'active',
      state: {
        currentGoal: state.currentGoal,
        activeTask: state.activeTask,
        memorySize: state.memory.size,
        recentThoughtCount: state.recentThoughts.length,
        learningBufferSize: state.learningBuffer.length
      }
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to get cognitive state',
      message: (error as Error).message
    }, { status: 500 });
  }
}
