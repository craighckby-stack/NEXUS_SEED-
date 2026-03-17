import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import crypto from 'crypto';

const CHUNK_SIZE = 2000;
const OVERLAP = 200;

function extractKeywords(text: string): string[] {
  const cleanText = text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]+`/g, ' ')
    .replace(/[{}[\]()]/g, ' ')
    .toLowerCase();
  
  const words = cleanText.split(/\s+/).filter(w => w.length > 3);
  const wordCount: Record<string, number> = {};
  
  for (const word of words) {
    wordCount[word] = (wordCount[word] || 0) + 1;
  }
  
  return Object.entries(wordCount)
    .filter(([w, c]) => c > 1 || isImportant(w))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([w]) => w);
}

function isImportant(word: string): boolean {
  const important = ['class', 'function', 'async', 'await', 'return', 'const', 'let', 'var',
    'import', 'export', 'interface', 'type', 'agent', 'memory', 'learning', 'reasoning',
    'evolution', 'mutation', 'nexus', 'core', 'lifecycle', 'governance', 'trust', 'agi'];
  return important.includes(word);
}

function hashContent(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex').slice(0, 32);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, source = 'user-upload' } = body;
    
    if (!content) {
      return NextResponse.json({ error: 'No content provided' }, { status: 400 });
    }
    
    // Clear existing
    await db.dnaChunk.deleteMany({});
    await db.dnaKeyword.deleteMany({});
    
    // Split into chunks
    const chunks: Array<{ content: string; index: number; start: number; end: number }> = [];
    let pos = 0, idx = 0;
    
    while (pos < content.length) {
      const end = Math.min(pos + CHUNK_SIZE, content.length);
      chunks.push({ content: content.slice(pos, end), index: idx, start: pos, end });
      pos += CHUNK_SIZE - OVERLAP;
      idx++;
    }
    
    const keywordIndex: Record<string, string[]> = {};
    let stored = 0;
    
    for (const chunk of chunks) {
      const hash = hashContent(chunk.content);
      const keywords = extractKeywords(chunk.content);
      const wordCount = chunk.content.split(/\s+/).length;
      
      try {
        await db.dnaChunk.create({
          data: {
            content: chunk.content,
            tags: keywords.join(','),
            source,
            hash,
            chunkIndex: chunk.index,
            charStart: chunk.start,
            charEnd: chunk.end,
            wordCount
          }
        });
        stored++;
        
        for (const kw of keywords) {
          if (!keywordIndex[kw]) keywordIndex[kw] = [];
          keywordIndex[kw].push(hash);
        }
      } catch {}
    }
    
    // Store keywords
    for (const [keyword, hashes] of Object.entries(keywordIndex)) {
      try {
        await db.dnaKeyword.create({
          data: {
            keyword,
            chunkIds: JSON.stringify(hashes),
            count: hashes.length
          }
        });
      } catch {}
    }
    
    return NextResponse.json({
      success: true,
      stats: { totalChunks: chunks.length, storedChunks: stored, keywordsIndexed: Object.keys(keywordIndex).length, source }
    });
    
  } catch (error) {
    console.error('Ingest error:', error);
    return NextResponse.json({ error: 'Failed to ingest' }, { status: 500 });
  }
}
