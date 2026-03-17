import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

function extractKeywords(text: string): string[] {
  return text.toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/).filter(w => w.length > 2);
}

function scoreRelevance(content: string, keywords: string[]): number {
  const lower = content.toLowerCase();
  let score = 0;
  for (const kw of keywords) {
    const matches = lower.match(new RegExp(kw, 'gi'));
    if (matches) score += matches.length;
  }
  return score;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '5');
    
    if (!query) {
      return NextResponse.json({ error: 'Query required' }, { status: 400 });
    }
    
    const queryKeywords = extractKeywords(query);
    
    // Find matching keywords
    const keywordRecords = await db.dnaKeyword.findMany({
      where: { keyword: { in: queryKeywords } }
    });
    
    // Collect chunk hashes
    const chunkHashes = new Set<string>();
    for (const record of keywordRecords) {
      try {
        const hashes = JSON.parse(record.chunkIds) as string[];
        hashes.forEach(h => chunkHashes.add(h));
      } catch {}
    }
    
    // Get chunks
    let chunks = chunkHashes.size > 0
      ? await db.dnaChunk.findMany({ where: { hash: { in: Array.from(chunkHashes) } } })
      : await db.dnaChunk.findMany({ take: 10, orderBy: { chunkIndex: 'asc' } });
    
    // Score and sort
    const scored = chunks
      .map(c => ({ ...c, score: scoreRelevance(c.content, queryKeywords) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
    
    return NextResponse.json({
      success: true,
      query,
      keywords: queryKeywords,
      results: scored.map(c => ({
        id: c.id,
        content: c.content.slice(0, 500),
        fullContent: c.content,
        score: c.score,
        tags: c.tags,
        source: c.source,
        wordCount: c.wordCount
      }))
    });
    
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
