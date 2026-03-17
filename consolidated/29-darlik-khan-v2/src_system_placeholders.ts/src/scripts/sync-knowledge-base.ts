/**
 * Knowledge Base Repository Sync
 * Pulls relevant code patterns from GitHub repos into vector database
 * Run independently from main evolution system
 */

interface RepoConfig {
  owner: string;
  repo: string;
  priority: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  focusAreas: string[];
  excludePaths?: string[];
}

const REPO_CATALOG: RepoConfig[] = [
  // === AI/LLM INFRASTRUCTURE ===
  {
    owner: 'langchain-ai',
    repo: 'langchainjs',
    priority: 'DAILY',
    focusAreas: ['chains', 'agents', 'tools', 'prompts'],
    excludePaths: ['docs', 'examples', 'tests']
  },
  {
    owner: 'vercel',
    repo: 'ai',
    priority: 'DAILY',
    focusAreas: ['core', 'streams', 'react', 'svelte'],
    excludePaths: ['examples', '.github']
  },
  {
    owner: 'anthropics',
    repo: 'anthropic-sdk-typescript',
    priority: 'DAILY',
    focusAreas: ['src', 'resources'],
    excludePaths: ['tests', 'examples']
  },
  {
    owner: 'google',
    repo: 'generative-ai-js',
    priority: 'DAILY',
    focusAreas: ['packages/main/src'],
    excludePaths: ['samples', 'docs']
  },
  
  // === RAG & VECTOR DATABASES ===
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
  
  // === SELF-EVOLVING AI SYSTEMS ===
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
  
  // === CODE ANALYSIS & GENERATION ===
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
  
  // === REACT/NEXT.JS ===
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
  
  // === GITHUB INTEGRATION ===
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
  
  // === TESTING & QUALITY ===
  {
    owner: 'vitest-dev',
    repo: 'vitest',
    priority: 'MONTHLY',
    focusAreas: ['packages/vitest/src'],
    excludePaths: ['test', 'examples']
  },
  
  // === AI PROMPT ENGINEERING ===
  {
    owner: 'dair-ai',
    repo: 'Prompt-Engineering-Guide',
    priority: 'WEEKLY',
    focusAreas: ['guides', 'pages'],
    excludePaths: ['.github']
  },
  
  // === SYSTEM ARCHITECTURE ===
  {
    owner: 'goldbergyoni',
    repo: 'nodebestpractices',
    priority: 'MONTHLY',
    focusAreas: ['sections'],
    excludePaths: ['assets']
  },
  {
    owner: 'kamranahmedse',
    repo: 'developer-roadmap',
    priority: 'MONTHLY',
    focusAreas: ['src/data/roadmaps'],
    excludePaths: ['public', 'scripts']
  }
];

class KnowledgeBaseSyncer {
  private githubToken: string;
  private knowledgeBaseEndpoint: string;

  constructor(githubToken: string, knowledgeBaseUrl: string) {
    this.githubToken = githubToken;
    this.knowledgeBaseEndpoint = knowledgeBaseUrl;
  }

  /**
   * Main sync function - call this from cron job or manual trigger
   */
  async syncRepositories(priority?: 'DAILY' | 'WEEKLY' | 'MONTHLY') {
    const reposToSync = priority 
      ? REPO_CATALOG.filter(r => r.priority === priority)
      : REPO_CATALOG;

    console.log(`🔄 Syncing ${reposToSync.length} repositories...`);

    for (const repo of reposToSync) {
      try {
        await this.syncRepository(repo);
        console.log(`✅ Synced: ${repo.owner}/${repo.repo}`);
      } catch (error) {
        console.error(`❌ Failed: ${repo.owner}/${repo.repo}`, error);
      }
    }
  }

  /**
   * Sync single repository
   */
  private async syncRepository(config: RepoConfig) {
    const { owner, repo, focusAreas, excludePaths = [] } = config;

    // Get repository tree
    const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/main?recursive=1`;
    const response = await fetch(treeUrl, {
      headers: {
        'Authorization': `Bearer ${this.githubToken}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!response.ok) throw new Error(`GitHub API error: ${response.status}`);

    const treeData = await response.json();

    // Filter files based on focus areas
    const relevantFiles = treeData.tree.filter((file: any) => {
      if (file.type !== 'blob') return false;
      if (!file.path) return false;

      // Check if in focus areas
      const inFocusArea = focusAreas.some(area => 
        file.path!.startsWith(area)
      );
      if (!inFocusArea) return false;

      // Check if excluded
      const isExcluded = excludePaths.some(exclude => 
        file.path!.includes(exclude)
      );
      if (isExcluded) return false;

      // Only code files
      const codeExtensions = ['.ts', '.tsx', '.js', '.jsx', '.md'];
      if (!codeExtensions.some(ext => file.path!.endsWith(ext))) return false;

      return true;
    });

    // Process files in batches
    const batchSize = 10;
    for (let i = 0; i < relevantFiles.length; i += batchSize) {
      const batch = relevantFiles.slice(i, i + batchSize);
      await Promise.all(batch.map((file: any) => this.processFile(owner, repo, file)));
    }
  }

  /**
   * Process individual file and add to knowledge base
   */
  private async processFile(owner: string, repo: string, file: any) {
    try {
      // Fetch file content
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

        // Skip if too large (>100KB)
        if (content.length > 100000) return;

        // Determine file type and language
        const language = this.detectLanguage(file.path!);
        const category = this.categorizeFile(file.path!, content);

        // Add to knowledge base via API
        await this.addToKnowledgeBase({
          source: `${owner}/${repo}`,
          file: file.path!,
          language,
          category,
          content,
          metadata: {
            repository: `${owner}/${repo}`,
            path: file.path!,
            url: fileData.html_url,
            lastUpdated: new Date().toISOString()
          }
        });
      }
    } catch (error) {
      console.error(`Failed to process ${file.path}:`, error);
    }
  }

  /**
   * Detect programming language from file extension
   */
  private detectLanguage(path: string): string {
    if (path.endsWith('.ts') || path.endsWith('.tsx')) return 'typescript';
    if (path.endsWith('.js') || path.endsWith('.jsx')) return 'javascript';
    if (path.endsWith('.md')) return 'markdown';
    return 'unknown';
  }

  /**
   * Categorize file based on path and content
   */
  private categorizeFile(path: string, content: string): string {
    // AI/LLM patterns
    if (content.includes('ChatCompletionRequest') || 
        content.includes('streamText') ||
        content.includes('generateText')) {
      return 'ai-llm-patterns';
    }

    // Agent patterns
    if (content.includes('agent') && content.includes('tool')) {
      return 'ai-agent-architecture';
    }

    // RAG patterns
    if (content.includes('embedding') || 
        content.includes('vector') ||
        content.includes('similarity')) {
      return 'rag-vector-search';
    }

    // React patterns
    if (content.includes('useState') || content.includes('useEffect')) {
      return 'react-hooks-patterns';
    }

    // API patterns
    if (path.includes('/api/') || path.includes('route.ts')) {
      return 'api-route-patterns';
    }

    // State management
    if (content.includes('zustand') || content.includes('createStore')) {
      return 'state-management';
    }

    // GitHub integration
    if (content.includes('octokit') || content.includes('github')) {
      return 'github-automation';
    }

    // Prompt engineering
    if (path.includes('prompt') || content.includes('system prompt')) {
      return 'prompt-engineering';
    }

    return 'general-patterns';
  }

  /**
   * Add document to knowledge base
   */
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

// === USAGE EXAMPLES ===

// Daily sync (run every 24 hours)
export async function runDailySync(githubToken: string, knowledgeBaseUrl: string) {
  const syncer = new KnowledgeBaseSyncer(githubToken, knowledgeBaseUrl);
  await syncer.syncRepositories('DAILY');
}

// Weekly sync (run every 7 days)
export async function runWeeklySync(githubToken: string, knowledgeBaseUrl: string) {
  const syncer = new KnowledgeBaseSyncer(githubToken, knowledgeBaseUrl);
  await syncer.syncRepositories('WEEKLY');
}

// Monthly sync (run every 30 days)
export async function runMonthlySync(githubToken: string, knowledgeBaseUrl: string) {
  const syncer = new KnowledgeBaseSyncer(githubToken, knowledgeBaseUrl);
  await syncer.syncRepositories('MONTHLY');
}

// Full sync (all repos)
export async function runFullSync(githubToken: string, knowledgeBaseUrl: string) {
  const syncer = new KnowledgeBaseSyncer(githubToken, knowledgeBaseUrl);
  await syncer.syncRepositories();
}

export { REPO_CATALOG, KnowledgeBaseSyncer };
