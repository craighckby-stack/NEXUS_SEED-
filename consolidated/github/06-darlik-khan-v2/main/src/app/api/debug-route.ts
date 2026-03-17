/**
 * Debug API route - Shows exactly what's happening
 */

import { NextResponse } from 'next/server';

export async function GET() {
  const githubToken = localStorage?.getItem('GITHUB_TOKEN') || '';
  const apiKey = localStorage?.getItem('NEXT_PUBLIC_LLM_API_KEY') || '';
  const repoOwner = localStorage?.getItem('GITHUB_REPO_OWNER') || 'craighckby-stack';
  const repoName = localStorage?.getItem('GITHUB_REPO_NAME') || 'darlik-khan-v2';

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    environment: {
      githubToken: githubToken ? 'SET (' + githubToken.length + ' chars)' : 'NOT SET',
      apiKey: apiKey ? 'SET (' + apiKey.length + ' chars)' : 'NOT SET',
      repoOwner,
      repoName,
      repository: `${repoOwner}/${repoName}`
    },
    message: 'Debug information retrieved successfully'
  });
}
