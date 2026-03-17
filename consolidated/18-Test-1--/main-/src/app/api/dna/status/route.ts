import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const chunkCount = await db.dnaChunk.count();
    const keywordCount = await db.dnaKeyword.count();
    
    const topKeywords = await db.dnaKeyword.findMany({
      take: 20,
      orderBy: { count: 'desc' }
    });
    
    const chunks = await db.dnaChunk.findMany({ select: { wordCount: true, source: true } });
    const totalWords = chunks.reduce((sum, c) => sum + (c.wordCount || 0), 0);
    const sources = [...new Set(chunks.map(c => c.source).filter(Boolean))];
    
    return NextResponse.json({
      success: true,
      status: {
        loaded: chunkCount > 0,
        chunkCount,
        keywordCount,
        totalWords,
        estimatedTokens: Math.round(totalWords * 1.3),
        sources,
        topKeywords: topKeywords.map(k => ({ keyword: k.keyword, count: k.count }))
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
