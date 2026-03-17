import { NextRequest, NextResponse } from 'next/server';
import { 
  runDailySync, 
  runWeeklySync, 
  runMonthlySync, 
  runFullSync,
  REPO_CATALOG 
} from '@/scripts/sync-knowledge-base';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { syncType, githubToken, knowledgeBaseUrl } = body;

  if (!githubToken || !knowledgeBaseUrl) {
    return NextResponse.json(
      { error: 'githubToken and knowledgeBaseUrl required' },
      { status: 400 }
    );
  }

  try {
    let result;

    switch (syncType) {
      case 'DAILY':
        await runDailySync(githubToken, knowledgeBaseUrl);
        result = { message: 'Daily sync completed', reposSynced: REPO_CATALOG.filter(r => r.priority === 'DAILY').length };
        break;

      case 'WEEKLY':
        await runWeeklySync(githubToken, knowledgeBaseUrl);
        result = { message: 'Weekly sync completed', reposSynced: REPO_CATALOG.filter(r => r.priority === 'WEEKLY').length };
        break;

      case 'MONTHLY':
        await runMonthlySync(githubToken, knowledgeBaseUrl);
        result = { message: 'Monthly sync completed', reposSynced: REPO_CATALOG.filter(r => r.priority === 'MONTHLY').length };
        break;

      case 'FULL':
        await runFullSync(githubToken, knowledgeBaseUrl);
        result = { message: 'Full sync completed', reposSynced: REPO_CATALOG.length };
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid syncType. Use: DAILY, WEEKLY, MONTHLY, FULL' },
          { status: 400 }
        );
    }

    return NextResponse.json(result);

  } catch (error) {
    return NextResponse.json(
      { error: 'Sync failed', details: String(error) },
      { status: 500 }
    );
  }
}
