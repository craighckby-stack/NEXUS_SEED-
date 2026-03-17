import { NextRequest, NextResponse } from 'next/server';
import { getMetaSystem } from '@/lib/agi/meta-system';

export async function GET(request: NextRequest) {
  try {
    const meta = await getMetaSystem();
    const status = meta.getStatus();
    const allMetadata = meta.getAllMetadata();

    return NextResponse.json({
      success: true,
      status,
      filesTracked: allMetadata.length,
      metadata: allMetadata.slice(0, 20) // Return first 20 files
    });
  } catch (error) {
    console.error('Meta status error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, filePath, content, sources } = body;

    const meta = await getMetaSystem();

    switch (action) {
      case 'analyze':
        if (!filePath || !content) {
          return NextResponse.json({
            success: false,
            error: 'filePath and content required for analysis'
          }, { status: 400 });
        }
        const analyzed = await meta.analyzeFile(filePath, content);
        return NextResponse.json({
          success: true,
          metadata: analyzed
        });

      case 'vote':
        if (!filePath || !sources) {
          return NextResponse.json({
            success: false,
            error: 'filePath and sources required for voting'
          }, { status: 400 });
        }
        const vote = await meta.voteOnFile(filePath, sources);
        return NextResponse.json({
          success: true,
          vote
        });

      case 'round':
        const round = await meta.runMetaRound();
        return NextResponse.json({
          success: true,
          round
        });

      case 'get':
        if (!filePath) {
          return NextResponse.json({
            success: false,
            error: 'filePath required'
          }, { status: 400 });
        }
        const metadata = meta.getMetadata(filePath);
        return NextResponse.json({
          success: true,
          metadata
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use: analyze, vote, round, get'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Meta action error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
