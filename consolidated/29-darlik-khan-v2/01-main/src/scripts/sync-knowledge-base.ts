/**
 * Knowledge Base Repository Sync
 * Pulls code patterns from 20+ GitHub repos
 */

interface RepoConfig {
  owner: string;
  repo: string;
  priority: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  focusAreas: string[];
  excludePaths?: string[];
}

const REPO_CATALOG: RepoConfig[] = [
  {
    owner: 'langchain-ai',
    repo: 'langchainjs',
    priority: 'DAILY',
    focusAreas: ['src'],
    excludePaths: ['docs', 'examples', 'tests']
  },
  {
    owner: 'vercel',
    repo: 'ai',
    priority: 'DAILY',
    focusAreas: ['packages/main/src'],
    excludePaths: ['examples', '.github']
  },
  {
    owner: 'anthropics',
    repo: 'anthropic-sdk-typescript',
    priority: 'DAILY',
    focusAreas: ['src'],
    excludePaths: ['tests', 'examples']
  },
  {
    owner: 'google',
    repo: 'generative-ai-js',
    priority: 'DAILY',
    focusAreas: ['packages/main/src'],
    excludePaths: ['samples', 'docs']
  },
  {
    owner: 'supabase',
    repo: 'supabase',
    priority: 'WEEKLY',
    focusAreas: ['apps/docs/content/guides/ai'],
    excludePaths: ['marketing', 'studio']
  },
  {
    owner: 'pinecone-io',
    repo: 'pinecone-ts-client',
    priority: 'WEEKLY',
    focusAreas: ['src'],
    excludePaths: ['tests', 'examples']
  },
  {
    owner: 'chroma-core',
    repo: 'chroma',
    priority: 'WEEKLY',
    focusAreas: ['clients/js'],
    excludePaths: ['examples', 'docs']
  },
  {
    owner: 'gpt-engineer-org',
    repo: 'gpt-engineer',
    priority: 'WEEKLY',
    focusAreas: ['gpt_engineer/core'],
    excludePaths: ['tests', 'benchmark']
  },
  {
    owner: 'smol-ai',
    repo: 'developer',
    priority: 'WEEKLY',
    focusAreas: ['smol_dev'],
    excludePaths: ['examples']
  },
  {
    owner: 'Significant-Gravitas',
    repo: 'AutoGPT',
    priority: 'WEEKLY',
    focusAreas: ['autogpt/agents', 'autogpt/core'],
    excludePaths: ['tests', 'docs', 'benchmark']
  },
  {
    owner: 'reworkd',
    repo: 'AgentGPT',
    priority: 'WEEKLY',
    focusAreas: ['next/src/services', 'next/src/hooks'],
    excludePaths: ['docs', 'public']
  },
  {
    owner: 'microsoft',
    repo: 'TypeScript',
    priority: 'MONTHLY',
    focusAreas: ['src/compiler'],
    excludePaths: ['tests', 'scripts']
  },
  {
    owner: 'babel',
    repo: 'babel',
    priority: 'MONTHLY',
    focusAreas: ['packages/babel-core', 'packages/babel-parser'],
    excludePaths: ['test', 'docs']
  },
  {
    owner: 'prettier',
    repo: 'prettier',
    priority: 'MONTHLY',
    focusAreas: ['src'],
    excludePaths: ['tests', 'website']
  },
  {
    owner: 'vercel',
    repo: 'next.js',
    priority: 'WEEKLY',
    focusAreas: ['packages/next/src'],
    excludePaths: ['test', 'examples', 'bench']
  },
  {
    owner: 'pmndrs',
    repo: 'zustand',
    priority: 'MONTHLY',
    focusAreas: ['src'],
    excludePaths: ['tests', 'examples']
  },
  {
    owner: 'TanStack',
    repo: 'query',
    priority: 'WEEKLY',
    focusAreas: ['packages/react-query/src'],
    excludePaths: ['tests', 'examples']
  },
  {
    owner: 'octokit',
    repo: 'octokit.js',
    priority: 'MONTHLY',
    focusAreas: ['src'],
    excludePaths: ['test']
  },
  {
    owner: 'probot',
    repo: 'probot',
    priority: 'MONTHLY',
    focusAreas: ['src'],
    excludePaths: ['test', 'docs']
  },
  {
    owner: 'vitest-dev',
    repo: 'vitest',
    priority: 'MONTHLY',
    focusAreas: ['packages/vitest/src'],
    excludePaths: ['test', 'examples']
  },
  {
    owner: 'dair-ai',
    repo: 'Prompt-Engineering-Guide',
    priority: 'WEEKLY',
    focusAreas: ['guides', 'pages'],
    excludePaths: ['.github']
  }
];

class KnowledgeBaseSyncer {
  private githubToken: string;
  private knowledgeBaseEndpoint: string;

  constructor(githubToken: string, knowledgeBaseUrl: string) {
    this.githubToken = githubToken;
    this.knowledgeBaseEndpoint = knowledgeBaseUrl;
  }

  async syncRepositories(priority?: 'DAILY' | 'WEEKLY' | 'MONTHLY') {
    const reposToSync = priority 
      ? REPO_CATALOG.filter(r => r.priority === priority)
      : REPO_CATALOG;

    console.log(`Syncing ${reposToSync.length} repositories...`);

    for (const repo of reposToSync) {
      try {
        await this.syncRepository(repo);
        console.log(`Synced: ${repo.owner}/${repo.repo}`);
      } catch (error) {
        console.error(`Failed: ${repo.owner}/${repo.repo}`, error);
      }
    }
  }

  private async syncRepository(config: RepoConfig) {
    const { owner, repo, focusAreas, excludePaths = [] } = config;
    const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/main?recursive=1`;
    
    const response = await fetch(treeUrl, {
      headers: {
        'Authorization': `Bearer ${this.githubToken}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!response.ok) throw new Error(`GitHub API error: ${response.status}`);

    const treeData = await response.json();
    const relevantFiles = treeData.tree.filter((file: any) => {
      if (file.type !== 'blob') return false;
      if (!file.path) return false;

      const inFocusArea = focusAreas.some(area => file.path.startsWith(area));
      if (!inFocusArea) return false;

      const isExcluded = excludePaths.some(exclude => file.path.includes(exclude));
      if (isExcluded) return false;

      const codeExtensions = ['.ts', '.tsx', '.js', '.jsx', '.md'];
      if (!codeExtensions.some(ext => file.path.endsWith(ext))) return false;

      return true;
    });

    const batchSize = 10;
    for (let i = 0; i < relevantFiles.length; i += batchSize) {
      const batch = relevantFiles.slice(i, i + batchSize);
      await Promise.all(batch.map((file: any) => this.processFile(owner, repo, file)));
    }
  }

  private async processFile(owner: string, repo: string, file: any) {
    try {
      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${file.path}`,
        {
          headers: {
            'Authorization': `Bearer ${this.githubToken}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );

      if (!response.ok) return;

      const fileData = await response.json();
      if ('content' in fileData) {
        const content = Buffer.from(fileData.content, 'base64').toString('utf-8');
        if (content.length > 100000) return;

        const language = this.detectLanguage(file.path);
        const category = this.categorizeFile(file.path, content);

        await this.addToKnowledgeBase({
          source: `${owner}/${repo}`,
          file: file.path,
          language,
          category,
          content,
          metadata: {
            repository: `${owner}/${repo}`,
            path: file.path,
            url: fileData.html_url,
            lastUpdated: new Date().toISOString()
          }
        });
      }
    } catch (error) {
      console.error(`Failed to process ${file.path}:`, error);
    }
  }

  private detectLanguage(path: string): string {
    if (path.endsWith('.ts') || path.endsWith('.tsx')) return 'typescript';
    if (path.endsWith('.js') || path.endsWith('.jsx')) return 'javascript';
    if (path.endsWith('.md')) return 'markdown';
    return 'unknown';
  }

  private categorizeFile(path: string, content: string): string {
    if (content.includes('ChatCompletionRequest') || 
        content.includes('streamText') ||
        content.includes('generateText')) {
      return 'ai-llm-patterns';
    }
    if (content.includes('agent') && content.includes('tool')) {
      return 'ai-agent-architecture';
    }
    if (content.includes('embedding') || 
        content.includes('vector') ||
        content.includes('similarity')) {
      return 'rag-vector-search';
    }
    if (content.includes('useState') || content.includes('useEffect')) {
      return 'react-hooks-patterns';
    }
    if (path.includes('/api/') || path.includes('route.ts')) {
      return 'api-route-patterns';
    }
    if (content.includes('zustand') || content.includes('createStore')) {
      return 'state-management';
    }
    if (content.includes('octokit') || content.includes('github')) {
      return 'github-automation';
    }
    if (path.includes('prompt') || content.includes('system prompt')) {
      return 'prompt-engineering';
    }
    return 'general-patterns';
  }

  private async addToKnowledgeBase(document: any) {
    try {
      const response = await fetch(this.knowledgeBaseEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add',
          document
        })
      });
      if (!response.ok) {
        throw new Error(`Knowledge base error: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to add to knowledge base:', error);
    }
  }
}

export async function runDailySync(githubToken: string, knowledgeBaseUrl: string) {
  const syncer = new KnowledgeBaseSyncer(githubToken, knowledgeBaseUrl);
  await syncer.syncRepositories('DAILY');
}

export async function runWeeklySync(githubToken: string, knowledgeBaseUrl: string) {
  const syncer = new KnowledgeBaseSyncer(githubToken, knowledgeBaseUrl);
  await syncer.syncRepositories('WEEKLY');
}

export async function runMonthlySync(githubToken: string, knowledgeBaseUrl: string) {
  const syncer = new KnowledgeBaseSyncer(githubToken, knowledgeBaseUrl);
  await syncer.syncRepositories('MONTHLY');
}

export async function runFullSync(githubToken: string, knowledgeBaseUrl: string) {
  const syncer = new KnowledgeBaseSyncer(githubToken, knowledgeBaseUrl);
  await syncer.syncRepositories();
}

export { REPO_CATALOG, KnowledgeBaseSyncer };
