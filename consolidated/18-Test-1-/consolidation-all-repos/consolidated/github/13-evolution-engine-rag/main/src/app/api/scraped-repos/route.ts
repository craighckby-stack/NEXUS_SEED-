// src/app/api/scraped-repos/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Constants
const DEFAULT_FILE_COUNT = 0;
const DEFAULT_COMMIT_COUNT = 0;
const DEFAULT_ISSUE_COUNT = 0;
const DEFAULT_BRANCH_COUNT = 0;

// Type definitions
interface ScrapedRepository {
  full_name: string;
  name: string;
  description: string;
  language: string;
  stars: number;
  forks: number;
  url: string;
  owner: string;
  readme: string;
  file_count: number;
  commit_count: number;
  issue_count: number;
  branch_count: number;
  scraped_at: Date;
  is_processed: boolean;
}

interface ScrapedFile {
  name: string;
  path: string;
  size: number;
  type: string;
  language: string;
  content: string | null;
  scraped_at: Date;
  is_embedded: boolean;
}

interface ScrapedCommit {
  sha: string;
  message: string;
  date: Date;
  author: string;
  scraped_at: Date;
}

interface ScrapedIssue {
  number: number;
  title: string;
  body: string;
  labels: string[];
  created_at: Date;
  scraped_at: Date;
}

// Helper functions
async function saveScrapedRepository(body: any) {
  const repo = await db.scrapedRepository.upsert({
    where: { full_name: body.full_name },
    create: {
      full_name: body.full_name,
      name: body.name,
      description: body.description,
      language: body.language,
      stars: body.stars,
      forks: body.forks,
      url: body.url,
      owner: body.owner,
      readme: body.readme,
      file_count: DEFAULT_FILE_COUNT,
      commit_count: DEFAULT_COMMIT_COUNT,
      issue_count: DEFAULT_ISSUE_COUNT,
      branch_count: DEFAULT_BRANCH_COUNT,
      scraped_at: new Date(),
      is_processed: false,
    },
    update: {
      file_count: body.file_count || DEFAULT_FILE_COUNT,
      commit_count: body.commit_count || DEFAULT_COMMIT_COUNT,
      issue_count: body.issue_count || DEFAULT_ISSUE_COUNT,
      branch_count: body.branch_count || DEFAULT_BRANCH_COUNT,
    },
  });

  return repo;
}

async function saveScrapedFiles(repoId: number, files: any[]) {
  if (files && Array.isArray(files)) {
    for (const file of files) {
      await db.scrapedFile.create({
        data: {
          repo_id: repoId,
          name: file.name,
          path: file.path,
          size: file.size,
          type: file.type,
          language: file.language,
          content: file.content || null,
          scraped_at: new Date(),
          is_embedded: false,
        },
      });
    }
  }
}

async function saveScrapedCommits(repoId: number, commits: any[]) {
  if (commits && Array.isArray(commits)) {
    for (const commit of commits) {
      await db.scrapedCommit.create({
        data: {
          repo_id: repoId,
          sha: commit.sha,
          message: commit.message,
          date: commit.date,
          author: commit.author,
          scraped_at: new Date(),
        },
      });
    }
  }
}

async function saveScrapedIssues(repoId: number, issues: any[]) {
  if (issues && Array.isArray(issues)) {
    for (const issue of issues) {
      await db.scrapedIssue.create({
        data: {
          repo_id: repoId,
          number: issue.number,
          title: issue.title,
          body: issue.body,
          labels: JSON.stringify(issue.labels || []),
          created_at: issue.created_at,
          scraped_at: new Date(),
        },
      });
    }
  }
}

async function logToSystem(body: any) {
  await db.systemLog.create({
    data: {
      message: `📂 Scraped repository: ${body.name} (${body.file_count || DEFAULT_FILE_COUNT} files, ${body.commits?.length || 0} commits)`,
      type: 'info',
      timestamp: new Date(),
    },
  });
}

// API Endpoints
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const repo = await saveScrapedRepository(body);
    await saveScrapedFiles(repo.id, body.files);
    await saveScrapedCommits(repo.id, body.commits);
    await saveScrapedIssues(repo.id, body.issues);
    await logToSystem(body);

    return NextResponse.json({
      success: true,
      repoId: repo.id,
      message: 'Repository data saved successfully',
    });
  } catch (error: any) {
    console.error('Error saving scraped repository:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save scraped repository' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const repos = await db.scrapedRepository.findMany({
      orderBy: { scraped_at: 'desc' },
      take: 50,
    });

    return NextResponse.json({
      repos,
      total: repos.length,
    });
  } catch (error: any) {
    console.error('Error fetching scraped repositories:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch scraped repositories' },
      { status: 500 }
    );
  }
}