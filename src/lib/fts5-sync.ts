/**
 * FTS5 SYNC TRIGGER — CRITICAL
 * 
 * Without this, the system could return a cached answer confidently from
 * a table that hasn't seen the last 50 inserts. Silent stale data is the
 * worst kind of bug - it undermines the whole DNA trust model.
 * 
 * This module ensures dna_fts stays in sync with dna_core.
 */

import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

let fts5Initialized = false

// Create FTS5 virtual table and sync triggers
export async function initializeFts5(): Promise<{ success: boolean; error?: string }> {
  if (fts5Initialized) {
    return { success: true }
  }

  try {
    // 1. Create FTS5 virtual table (if not exists)
    await db.$executeRawUnsafe(`
      CREATE VIRTUAL TABLE IF NOT EXISTS dna_fts USING fts5(
        prompt,
        response,
        content='DnaCore',
        content_rowid='id'
      );
    `)

    // 2. Create INSERT trigger - sync new Q&A pairs
    await db.$executeRawUnsafe(`
      CREATE TRIGGER IF NOT EXISTS dna_fts_ai AFTER INSERT ON DnaCore BEGIN
        INSERT INTO dna_fts(rowid, prompt, response)
        VALUES (NEW.id, NEW.prompt, NEW.response);
      END;
    `)

    // 3. Create DELETE trigger - clean up removed Q&A pairs
    await db.$executeRawUnsafe(`
      CREATE TRIGGER IF NOT EXISTS dna_fts_ad AFTER DELETE ON DnaCore BEGIN
        INSERT INTO dna_fts(dna_fts, rowid, prompt, response)
        VALUES('delete', OLD.id, OLD.prompt, OLD.response);
      END;
    `)

    // 4. Create UPDATE trigger - keep modifications in sync
    await db.$executeRawUnsafe(`
      CREATE TRIGGER IF NOT EXISTS dna_fts_au AFTER UPDATE ON DnaCore BEGIN
        INSERT INTO dna_fts(dna_fts, rowid, prompt, response)
        VALUES('delete', OLD.id, OLD.prompt, OLD.response);
        INSERT INTO dna_fts(rowid, prompt, response)
        VALUES (NEW.id, NEW.prompt, NEW.response);
      END;
    `)

    // 5. Initial sync: populate FTS from existing DnaCore data
    await db.$executeRawUnsafe(`
      INSERT OR IGNORE INTO dna_fts(rowid, prompt, response)
      SELECT id, prompt, response FROM DnaCore;
    `)

    fts5Initialized = true
    return { success: true }

  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown FTS5 error'
    
    // SQLite without FTS5 support - fallback to keyword search
    if (msg.includes('no such module: fts5')) {
      console.log('⚠️ FTS5 not available - falling back to keyword search')
      fts5Initialized = true // Mark as initialized to prevent retry
      return { success: true, error: 'FTS5 module not available' }
    }

    console.error('FTS5 initialization error:', msg)
    return { success: false, error: msg }
  }
}

// Search DNA using FTS5 (with fallback to keyword search)
export async function searchDnaFts(
  query: string, 
  limit: number = 10
): Promise<Array<{ id: number; prompt: string; response: string; score: number }>> {
  
  // Ensure FTS5 is initialized
  await initializeFts5()

  try {
    // Try FTS5 search first
    const ftsResults = await db.$queryRawUnsafe<Array<{
      id: number
      prompt: string
      response: string
      score: number
    }>>(`
      SELECT 
        rowid as id,
        prompt,
        response,
        bm25(dna_fts) as score
      FROM dna_fts
      WHERE dna_fts MATCH ?
      ORDER BY bm25(dna_fts)
      LIMIT ?;
    `, query, limit)

    if (ftsResults.length > 0) {
      return ftsResults
    }
  } catch {
    // FTS5 failed, fallback to keyword search
  }

  // Fallback: keyword search on DnaCore
  const keywords = query
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOPWORDS.has(w))
    .slice(0, 10)

  if (keywords.length === 0) {
    return []
  }

  // Build LIKE conditions
  const conditions = keywords.map(kw => 
    `LOWER(prompt) LIKE '%${kw}%' OR LOWER(response) LIKE '%${kw}%'`
  ).join(' OR ')

  const likeResults = await db.$queryRawUnsafe<Array<{
    id: number
    prompt: string
    response: string
  }>>(`
    SELECT id, prompt, response
    FROM DnaCore
    WHERE ${conditions}
    LIMIT ?
  `, limit)

  // Score by keyword matches
  return likeResults.map(r => {
    let score = 0
    for (const kw of keywords) {
      const promptMatches = (r.prompt.toLowerCase().match(new RegExp(kw, 'g')) || []).length
      const responseMatches = (r.response.toLowerCase().match(new RegExp(kw, 'g')) || []).length
      score += (promptMatches * 3 + responseMatches) * 5
    }
    return { ...r, score }
  }).sort((a, b) => b.score - a.score)
}

// Stopwords for keyword fallback
const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
  'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need',
  'it', 'its', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she',
  'we', 'they', 'what', 'which', 'who', 'when', 'where', 'why', 'how'
])

// Verify FTS5 sync health
export async function verifyFts5Sync(): Promise<{
  healthy: boolean
  dnaCoreCount: number
  ftsCount: number
  inSync: boolean
}> {
  try {
    const coreCount = await db.dnaCore.count()

    let ftsCount = 0
    try {
      const ftsResult = await db.$queryRawUnsafe<[{ count: number }]>(`
        SELECT COUNT(*) as count FROM dna_fts;
      `)
      ftsCount = ftsResult[0]?.count || 0
    } catch {
      ftsCount = -1 // FTS5 unavailable
    }

    const inSync = ftsCount === coreCount || ftsCount === -1

    return {
      healthy: inSync,
      dnaCoreCount: coreCount,
      ftsCount,
      inSync
    }
  } catch (error) {
    return {
      healthy: false,
      dnaCoreCount: 0,
      ftsCount: 0,
      inSync: false
    }
  }
}
