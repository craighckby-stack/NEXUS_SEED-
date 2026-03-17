import { NextRequest, NextResponse } from 'next/server';
import { getAGI, type PatternMatch } from '@/lib/agi/core';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, patternIds, prompt } = body;

    const agi = await getAGI();

    if (prompt && !code) {
      // Generate new code from prompt
      const generated = await agi.generateCode(prompt);
      
      await db.mutation.create({
        data: {
          type: 'insert',
          description: `Generated code from prompt: ${prompt.slice(0, 100)}`,
          afterCode: generated,
          status: 'applied',
          appliedAt: new Date()
        }
      });

      return NextResponse.json({
        success: true,
        code: generated,
        type: 'generated'
      });
    }

    if (code) {
      // Get patterns for evolution
      let patterns: PatternMatch[] = [];
      
      if (patternIds && patternIds.length > 0) {
        const dbPatterns = await db.pattern.findMany({
          where: { id: { in: patternIds } }
        });
        patterns = dbPatterns.map(p => ({
          name: p.name,
          type: p.type,
          code: p.code,
          confidence: p.confidence,
          location: ''
        }));
      } else {
        // Use top patterns
        const topPatterns = await db.pattern.findMany({
          take: 10,
          orderBy: { confidence: 'desc' }
        });
        patterns = topPatterns.map(p => ({
          name: p.name,
          type: p.type,
          code: p.code,
          confidence: p.confidence,
          location: ''
        }));
      }

      const evolved = await agi.evolveCode(code, patterns);

      await db.mutation.create({
        data: {
          type: 'modify',
          description: 'Evolved code using learned patterns',
          beforeCode: code,
          afterCode: evolved,
          status: 'applied',
          appliedAt: new Date()
        }
      });

      return NextResponse.json({
        success: true,
        code: evolved,
        type: 'evolved',
        patternsUsed: patterns.length
      });
    }

    return NextResponse.json({ 
      success: false, 
      error: 'Either code or prompt is required' 
    }, { status: 400 });
  } catch (error) {
    console.error('Evolution error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

// Start evolution cycle
export async function PUT(request: NextRequest) {
  try {
    const agi = await getAGI();
    const cycle = await agi.startEvolution();

    return NextResponse.json({
      success: true,
      cycle
    });
  } catch (error) {
    console.error('Evolution cycle error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
