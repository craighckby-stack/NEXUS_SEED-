/**
 * AGI Code Generation API
 * Handles code generation and mutation proposals
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCodeGenerator } from '@/lib/agi';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    const generator = await getCodeGenerator();

    switch (action) {
      case 'generate': {
        const { description, language, framework, patterns, constraints, targetFile } = body;
        if (!description) {
          return NextResponse.json({ error: 'Description required' }, { status: 400 });
        }
        const result = await generator.generate({
          description,
          language: language || 'typescript',
          framework,
          patterns,
          constraints,
          targetFile
        });
        return NextResponse.json({ success: true, result });
      }

      case 'proposeMutations': {
        const { targetFiles, goal } = body;
        if (!targetFiles || !Array.isArray(targetFiles)) {
          return NextResponse.json({ error: 'Target files array required' }, { status: 400 });
        }
        const mutations = await generator.proposeMutations(targetFiles, goal || 'Improve code quality');
        return NextResponse.json({ success: true, mutations, count: mutations.length });
      }

      case 'improveCode': {
        const { code, language } = body;
        if (!code) {
          return NextResponse.json({ error: 'Code required' }, { status: 400 });
        }
        const result = await generator.improveCode(code, language || 'typescript');
        return NextResponse.json({ success: true, result });
      }

      case 'generateTests': {
        const { code, language } = body;
        if (!code) {
          return NextResponse.json({ error: 'Code required' }, { status: 400 });
        }
        const result = await generator.generateTests(code, language || 'typescript');
        return NextResponse.json({ success: true, result });
      }

      case 'generateDocs': {
        const { code, language } = body;
        if (!code) {
          return NextResponse.json({ error: 'Code required' }, { status: 400 });
        }
        const docs = await generator.generateDocumentation(code, language || 'typescript');
        return NextResponse.json({ success: true, documentation: docs });
      }

      case 'selfImprove': {
        const result = await generator.selfImprove();
        return NextResponse.json({ success: true, result });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Generation API error:', error);
    return NextResponse.json({
      error: 'Generation failed',
      message: (error as Error).message
    }, { status: 500 });
  }
}
