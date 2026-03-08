/**
 * AGI Code Analysis API
 * Handles pattern extraction and code analysis
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCodeAnalyzer } from '@/lib/agi';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, content, path, language, repoId } = body;

    const analyzer = await getCodeAnalyzer();

    switch (action) {
      case 'analyzeFile': {
        if (!content) {
          return NextResponse.json({ error: 'Content required' }, { status: 400 });
        }
        const result = await analyzer.analyzeFile(content, path || 'unknown', language || 'typescript');
        return NextResponse.json({ success: true, result });
      }

      case 'analyzeRepository': {
        if (!repoId) {
          return NextResponse.json({ error: 'Repository ID required' }, { status: 400 });
        }
        const result = await analyzer.analyzeRepository(repoId);
        return NextResponse.json({ success: true, result });
      }

      case 'extractPatterns': {
        const { files } = body;
        if (!files || !Array.isArray(files)) {
          return NextResponse.json({ error: 'Files array required' }, { status: 400 });
        }
        const patterns = await analyzer.extractPatterns(files);
        return NextResponse.json({ success: true, patterns, count: patterns.length });
      }

      case 'getPatterns': {
        const patterns = await analyzer.getPatternsForEvolution();
        return NextResponse.json({ success: true, patterns, count: patterns.length });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Analysis API error:', error);
    return NextResponse.json({
      error: 'Analysis failed',
      message: (error as Error).message
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const repoId = searchParams.get('repoId');
    const patternType = searchParams.get('type');

    if (repoId) {
      // Get patterns for a specific repository
      const patterns = await db.pattern.findMany({
        where: { repositoryId: repoId },
        orderBy: { confidence: 'desc' },
        take: 50
      });
      return NextResponse.json({ success: true, patterns });
    }

    if (patternType) {
      // Get patterns by type
      const patterns = await db.pattern.findMany({
        where: { type: patternType },
        orderBy: { confidence: 'desc' },
        take: 50
      });
      return NextResponse.json({ success: true, patterns });
    }

    // Get all high-confidence patterns
    const patterns = await db.pattern.findMany({
      where: { confidence: { gte: 0.7 } },
      orderBy: { confidence: 'desc' },
      take: 100
    });

    const stats = {
      total: await db.pattern.count(),
      byType: {
        architectural: await db.pattern.count({ where: { type: 'architectural' } }),
        structural: await db.pattern.count({ where: { type: 'structural' } }),
        behavioral: await db.pattern.count({ where: { type: 'behavioral' } }),
        semantic: await db.pattern.count({ where: { type: 'semantic' } })
      }
    };

    return NextResponse.json({ success: true, patterns, stats });
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to get patterns',
      message: (error as Error).message
    }, { status: 500 });
  }
}
