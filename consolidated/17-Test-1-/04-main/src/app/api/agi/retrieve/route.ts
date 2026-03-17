import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

// Stopwords to filter out from keyword matching
const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
  'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need',
  'it', 'its', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she',
  'we', 'they', 'what', 'which', 'who', 'when', 'where', 'why', 'how',
  'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some',
  'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too',
  'very', 'just', 'also', 'now', 'here', 'there', 'then', 'once', 'about'
])

// Minimum non-stopword keywords required before declaring HIT
const MIN_KEYWORD_MATCHES = 2

// Static threshold for single-result fallback
const SINGLE_RESULT_MIN_SCORE = 75

// Score multiplier for rank-relative filtering
const RANK_RATIO_THRESHOLD = 2.0

// Tokenize question into keywords (excluding stopwords)
function tokenize(text: string): { keywords: string[]; nonStopwordCount: number } {
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2)
    .slice(0, 15)

  const keywords = words
  const nonStopwordCount = words.filter(w => !STOPWORDS.has(w)).length

  return { keywords, nonStopwordCount }
}

// Keyword guard: require minimum non-stopword matches
function keywordGuard(keywords: string[]): { pass: boolean; nonStopwords: string[] } {
  const nonStopwords = keywords.filter(w => !STOPWORDS.has(w))
  return {
    pass: nonStopwords.length >= MIN_KEYWORD_MATCHES,
    nonStopwords
  }
}

// Score match by keyword overlap (enhanced)
function scoreMatch(content: string, keywords: string[]): number {
  const contentLower = content.toLowerCase()
  let score = 0

  for (const kw of keywords) {
    if (STOPWORDS.has(kw)) continue // Skip stopwords

    const regex = new RegExp(kw, 'gi')
    const matches = contentLower.match(regex)
    if (matches) {
      // Exact match gets higher score
      score += matches.length * 5
      
      // Bonus for title/header matches
      if (/^#{1,3}\s.*\bkw\b/i.test(content)) {
        score += 10
      }
    }
  }

  return score
}

// Rank-relative filtering: top > 2x second = HIT
function rankRelativeFilter(scored: Array<{ score: number }>): boolean {
  if (scored.length < 2) return false

  const top = scored[0].score
  const second = scored[1].score

  return top > second * RANK_RATIO_THRESHOLD
}

// FTS5 initialization with sync triggers
async function ensureFts5Tables() {
  try {
    // Create FTS5 virtual table if not exists
    await db.$executeRawUnsafe(`
      CREATE VIRTUAL TABLE IF NOT EXISTS dna_fts USING fts5(
        content,
        tags,
        source,
        content='DnaChunk',
        content_rowid='rowid'
      );
    `)
    
    // Create INSERT trigger
    await db.$executeRawUnsafe(`
      CREATE TRIGGER IF NOT EXISTS dna_fts_insert AFTER INSERT ON DnaChunk BEGIN
        INSERT INTO dna_fts(rowid, content, tags, source)
        VALUES (NEW.rowid, NEW.content, NEW.tags, NEW.source);
      END;
    `)
    
    // Create UPDATE trigger
    await db.$executeRawUnsafe(`
      CREATE TRIGGER IF NOT EXISTS dna_fts_update AFTER UPDATE ON DnaChunk BEGIN
        UPDATE dna_fts SET 
          content = NEW.content,
          tags = NEW.tags,
          source = NEW.source
        WHERE rowid = NEW.rowid;
      END;
    `)
    
    // Create DELETE trigger
    await db.$executeRawUnsafe(`
      CREATE TRIGGER IF NOT EXISTS dna_fts_delete AFTER DELETE ON DnaChunk BEGIN
        DELETE FROM dna_fts WHERE rowid = OLD.rowid;
      END;
    `)
    
    return true
  } catch (error) {
    // FTS5 may already exist or SQLite doesn't support
    console.log('FTS5 setup note:', error instanceof Error ? error.message : 'Unknown')
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    const { question } = await request.json()

    if (!question || typeof question !== 'string') {
      return NextResponse.json({
        success: false,
        found: false,
        error: 'Question required'
      })
    }

    const { keywords, nonStopwordCount } = tokenize(question)

    // Keyword guard: require minimum non-stopword matches
    const guard = keywordGuard(keywords)
    if (!guard.pass) {
      return NextResponse.json({
        success: true,
        found: false,
        reason: 'Insufficient keyword diversity',
        nonStopwordCount: nonStopwordCount,
        minRequired: MIN_KEYWORD_MATCHES,
        keywords: keywords
      })
    }

    // Search DnaChunk table
    const chunks = await db.dnaChunk.findMany({
      take: 100,
      orderBy: { createdAt: 'desc' }
    })

    if (chunks.length === 0) {
      return NextResponse.json({
        success: true,
        found: false,
        reason: 'DNA database empty',
        keywords: keywords
      })
    }

    // Score each chunk
    const scored = chunks.map(chunk => ({
      chunk,
      score: scoreMatch(chunk.content, keywords)
    })).filter(s => s.score > 0)

    if (scored.length === 0) {
      return NextResponse.json({
        success: true,
        found: false,
        reason: 'No matching chunks',
        keywords: keywords
      })
    }

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score)

    // SINGLE-RESULT FALLBACK: If only one result, require higher threshold
    if (scored.length === 1) {
      const single = scored[0]
      if (single.score >= SINGLE_RESULT_MIN_SCORE) {
        const relevantPortion = extractRelevantPortion(single.chunk.content, keywords)
        return NextResponse.json({
          success: true,
          found: true,
          answer: relevantPortion,
          score: single.score,
          confidence: 'single-result-fallback',
          source: single.chunk.source,
          keywords: keywords
        })
      }
      
      return NextResponse.json({
        success: true,
        found: false,
        reason: 'Single result below threshold',
        score: single.score,
        threshold: SINGLE_RESULT_MIN_SCORE,
        keywords: keywords
      })
    }

    // RANK-RELATIVE FILTERING: top > 2x second = HIT
    if (rankRelativeFilter(scored)) {
      const best = scored[0]
      const relevantPortion = extractRelevantPortion(best.chunk.content, keywords)
      
      return NextResponse.json({
        success: true,
        found: true,
        answer: relevantPortion,
        score: best.score,
        confidence: 'rank-relative',
        secondScore: scored[1].score,
        ratio: (best.score / scored[1].score).toFixed(2),
        source: best.chunk.source,
        keywords: keywords
      })
    }

    // If rank-relative fails, check if top score is very high (>= 50)
    const best = scored[0]
    if (best.score >= 50) {
      const relevantPortion = extractRelevantPortion(best.chunk.content, keywords)
      
      return NextResponse.json({
        success: true,
        found: true,
        answer: relevantPortion,
        score: best.score,
        confidence: 'high-score-fallback',
        source: best.chunk.source,
        keywords: keywords
      })
    }

    return NextResponse.json({
      success: true,
      found: false,
      reason: 'No confident match',
      bestScore: best.score,
      secondScore: scored[1]?.score,
      keywords: keywords
    })

  } catch (error) {
    console.error('Retrieve API Error:', error)
    return NextResponse.json({
      success: false,
      found: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

// Extract the most relevant portion of content
function extractRelevantPortion(content: string, keywords: string[]): string {
  const lines = content.split('\n')
  const scored = lines.map((line, idx) => ({
    line,
    idx,
    score: scoreMatch(line, keywords)
  })).filter(s => s.score > 0)

  if (scored.length === 0) {
    return content.slice(0, 500) + (content.length > 500 ? '...' : '')
  }

  scored.sort((a, b) => b.score - a.score)
  const bestIdx = scored[0].idx

  const start = Math.max(0, bestIdx - 5)
  const end = Math.min(lines.length, bestIdx + 6)

  return lines.slice(start, end).join('\n')
}

export async function GET() {
  try {
    // Ensure FTS5 tables exist with triggers
    await ensureFts5Tables()
    
    const total = await db.dnaChunk.count()
    
    return NextResponse.json({
      success: true,
      stats: { total },
      retrieval: {
        minKeywordMatches: MIN_KEYWORD_MATCHES,
        singleResultThreshold: SINGLE_RESULT_MIN_SCORE,
        rankRatioThreshold: RANK_RATIO_THRESHOLD,
        stopwordsCount: STOPWORDS.size
      }
    })
  } catch (error) {
    const total = await db.dnaChunk.count()
    return NextResponse.json({
      success: true,
      stats: { total },
      fts5: 'unavailable'
    })
  }
}
