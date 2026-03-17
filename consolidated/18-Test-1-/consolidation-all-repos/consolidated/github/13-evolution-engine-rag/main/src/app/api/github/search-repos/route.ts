// src/app/api/github/search-repos/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { extractKeywords } from './extract-keywords';
import { removeDuplicates } from './remove-duplicates';
import { calculateRelevance } from './calculate-relevance';
import { fetchGitHubRepos } from './fetch-github-repos';
import { saveRelevantRepos } from './save-relevant-repos';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, projectType, techStack = [] } = body;

    const config = await db.systemConfig.findFirst();
    if (!config?.githubToken) {
      return NextResponse.json(
        { error: 'GitHub token not configured' },
        { status: 400 }
      );
    }

    const keywords = extractKeywords(query, projectType, techStack);
    const allRepos = await fetchGitHubRepos(keywords, config.githubToken);

    const uniqueRepos = removeDuplicates(allRepos);
    const reposWithRelevance = calculateRelevance(uniqueRepos, keywords, techStack, projectType);

    const user = await db.user.findFirst({
      where: { onboardingCompleted: true }
    });

    if (user) {
      await saveRelevantRepos(reposWithRelevance, user, db);
    }

    return NextResponse.json({
      repos: reposWithRelevance.slice(0, 20),
      total: reposWithRelevance.length
    });
  } catch (error: any) {
    console.error('GitHub search error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to search repositories' },
      { status: 500 }
    );
  }
}

// src/app/api/github/search-repos/extract-keywords.ts
export function extractKeywords(query: string, projectType: string, techStack: string[]): string[] {
  const keywords: string[] = [];

  keywords.push(...techStack);

  const projectKeywords: Record<string, string[]> = {
    'quantum-os': ['quantum computing', 'quantum simulation', 'quantum circuits', 'Qiskit', 'quantum algorithms', 'quantum machine learning', 'ibm quantum', 'quantum development'],
    'book-writer': ['writing assistant', 'book generation', 'AI writing', 'text generation', 'editor', 'markdown', 'document processing', 'content creation'],
    'ai-chatbot': ['chatbot', 'AI assistant', 'conversational AI', 'LLM', 'language model', 'chat interface', 'RAG'],
    'e-commerce': ['ecommerce', 'shopify', 'stripe', 'payment', 'inventory', 'product catalog', 'shopping cart'],
    'dashboard': ['analytics', 'dashboard', 'charts', 'visualization', 'data visualization', 'metrics', 'reporting'],
    'custom': []
  };

  keywords.push(...(projectKeywords[projectType] || []));

  const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  keywords.push(...words.slice(0, 5));

  keywords.push('nextjs', 'fullstack', 'typescript', 'react', 'tailwind', 'prisma');

  return [...new Set(keywords)].filter(k => k.length > 0);
}

// src/app/api/github/search-repos/remove-duplicates.ts
export function removeDuplicates(repos: any[]): any[] {
  const seen = new Set();
  return repos.filter(repo => {
    const key = repo.id;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

// src/app/api/github/search-repos/calculate-relevance.ts
export function calculateRelevance(repos: any[], keywords: string[], techStack: string[], projectType: string): any[] {
  return repos.map(repo => {
    let score = 0;

    const repoName = repo.name?.toLowerCase() || '';
    const description = repo.description?.toLowerCase() || '';
    const language = repo.language?.toLowerCase() || '';
    const topics = (repo.topics || []).map((t: string) => t.toLowerCase());

    techStack.forEach(tech => {
      const techLower = tech.toLowerCase();
      if (repoName.includes(techLower)) score += 0.3;
      if (description.includes(techLower)) score += 0.2;
      if (language === techLower) score += 0.25;
      if (topics.some(t => t.includes(techLower))) score += 0.15;
    });

    keywords.forEach(keyword => {
      const keywordLower = keyword.toLowerCase();
      if (repoName.includes(keywordLower)) score += 0.1;
      if (description.includes(keywordLower)) score += 0.08;
    });

    score += Math.min(repo.stargazers_count / 10000, 0.2);

    const lastUpdated = new Date(repo.updated_at);
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    if (lastUpdated > sixMonthsAgo) {
      score += 0.1;
    }

    score = Math.min(score, 1.0);

    return {
      ...repo,
      relevanceScore: score
    };
  }).sort((a, b) => b.relevanceScore - a.relevanceScore);
}

// src/app/api/github/search-repos/fetch-github-repos.ts
export async function fetchGitHubRepos(keywords: string[], githubToken: string): Promise<any[]> {
  const allRepos: any[] = [];

  for (const keyword of keywords) {
    try {
      const searchResponse = await fetch(
        `https://api.github.com/search/repositories?q=${encodeURIComponent(keyword)}&sort=stars&order=desc&per_page=5`,
        {
          headers: {
            'Authorization': `Bearer ${githubToken}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );

      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        if (searchData.items) {
          allRepos.push(...searchData.items);
        }
      }
    } catch (error) {
      console.error(`Error searching for keyword "${keyword}":`, error);
    }
  }

  return allRepos;
}

// src/app/api/github/search-repos/save-relevant-repos.ts
export async function saveRelevantRepos(reposWithRelevance: any[], user: any, db: any) {
  const projectSpec = await db.projectSpecification.findFirst({
    where: { userId: user.id }
  });

  if (projectSpec) {
    await db.relevantRepo.deleteMany({
      where: { projectId: projectSpec.id }
    });

    for (const repo of reposWithRelevance.slice(0, 20)) {
      await db.relevantRepo.create({
        data: {
          projectId: projectSpec.id,
          repoName: repo.name,
          repoUrl: repo.html_url,
          owner: repo.owner.login,
          description: repo.description,
          stars: repo.stargazers_count,
          language: repo.language,
          topics: JSON.stringify(repo.topics || []),
          relevanceScore: repo.relevanceScore
        }
      });
    }
  }
}