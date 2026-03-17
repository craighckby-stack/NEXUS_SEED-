/**
 * Clean, configurable GitHubService
 *
 * - Accepts credentials and repository defaults via a single options object.
 * - Each public method accepts optional overrides for owner/repo/branch so caller
 *   can either rely on defaults or specify per-call values.
 * - Centralized request retry/backoff wrapper used for all API calls.
 * - Clear error messages and minimal side-effects (cache is optional).
 *
 * Usage:
 *   const svc = new GitHubService({ token: process.env.GITHUB_TOKEN, owner: 'me', repo: 'my-repo' });
 *   await svc.listFilesRecursive(); // uses defaults
 *   await svc.updateFile('path/to.md', 'new content', { message: 'update' }); // uses defaults
 */

import { Octokit } from '@octokit/rest';

export interface GitHubServiceOptions {
  token?: string;                     // GitHub PAT; will fall back to process.env.GITHUB_TOKEN
  owner?: string;                     // default owner (user/org) for operations
  repo?: string;                      // default repo for operations
  branch?: string;                    // default branch (e.g. 'main')
  userAgent?: string;                 // user agent string
  maxFileSize?: number;               // bytes; default 100KB
  retryAttempts?: number;             // default 3
  retryDelayBaseMs?: number;          // base backoff delay ms; default 1000
  enableCache?: boolean;              // default true
  cacheTtlMs?: number;                // cache TTL for content/files, default 2-5 minutes
}

export interface GitHubFile {
  path: string;
  sha: string;
  size?: number;
  type: 'file' | 'dir' | string;
}

export interface GitHubContent {
  content: string;
  sha: string;
  size: number;
}

export class GitHubService {
  private octokit: Octokit;
  private readonly defaults: Required<Pick<GitHubServiceOptions, 'owner' | 'repo' | 'branch' | 'userAgent' | 'maxFileSize' | 'retryAttempts' | 'retryDelayBaseMs' | 'enableCache' | 'cacheTtlMs'>>;
  private requestCache: Map<string, { value: any; expiresAt: number }> = new Map();
  private consecutiveErrors = 0;

  constructor(options: GitHubServiceOptions = {}) {
    const token = options.token ?? process.env.GITHUB_TOKEN;
    if (!token) throw new Error('GitHub token is required — pass token in options or set GITHUB_TOKEN env var');

    // Check for placeholder token
    if (token.includes('placeholder') || token === 'ghp_placeholder_token') {
      throw new Error('Please replace the placeholder GitHub token with a real token from https://github.com/settings/tokens');
    }

    const owner = options.owner ?? '';
    const repo = options.repo ?? '';
    const branch = options.branch ?? 'main';

    // sensible defaults
    this.defaults = {
      owner,
      repo,
      branch,
      userAgent: options.userAgent ?? 'GitHubService/1.0',
      maxFileSize: options.maxFileSize ?? 100_000,
      retryAttempts: options.retryAttempts ?? 3,
      retryDelayBaseMs: options.retryDelayBaseMs ?? 1000,
      enableCache: options.enableCache ?? true,
      cacheTtlMs: options.cacheTtlMs ?? 2 * 60 * 1000
    };

    // Always create fresh Octokit instance to pick up new environment variables
    this.octokit = new Octokit({
      auth: token,
      userAgent: this.defaults.userAgent,
      request: {
        // headers common to all requests
        headers: { 'X-GitHub-Api-Version': '2022-11-28' }
      }
    });
  }

  // ---- utility helpers ----
  private makeCacheKey(prefix: string, parts: Array<string | undefined | null>) {
    return `${prefix}:${parts.map(p => (p ?? '')).join(':')}`;
  }

  private getFromCache<T>(key: string): T | undefined {
    if (!this.defaults.enableCache) return undefined;
    const item = this.requestCache.get(key);
    if (!item) return undefined;
    if (Date.now() > item.expiresAt) {
      this.requestCache.delete(key);
      return undefined;
    }
    return item.value;
  }

  private setCache(key: string, value: any, ttlMs?: number) {
    if (!this.defaults.enableCache) return;
    const expiresAt = Date.now() + (ttlMs ?? this.defaults.cacheTtlMs);
    this.requestCache.set(key, { value, expiresAt });
  }

  private deleteCache(key: string) {
    this.requestCache.delete(key);
  }

  private async retryWithBackoff<T>(op: () => Promise<T>, attempts = this.defaults.retryAttempts, baseMs = this.defaults.retryDelayBaseMs): Promise<T> {
    let lastError: any = new Error('unknown');
    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        const res = await op();
        this.consecutiveErrors = 0;
        return res;
      } catch (err: any) {
        lastError = err;
        this.consecutiveErrors++;
        // best-effort simple rate-limit detection
        const msg = (err?.message ?? '').toString().toLowerCase();
        if (msg.includes('rate limit') || msg.includes('secondary rate limit')) {
          // wait an exponential backoff (caller can also use plugins for better handling)
        }
        if (attempt < attempts) {
          const delay = baseMs * Math.pow(2, attempt - 1);
          await new Promise(r => setTimeout(r, delay));
        }
      }
    }
    throw lastError;
  }

  // Resolve owner/repo/branch for a call (use provided overrides or defaults).
  private resolveRepoParams(owner?: string, repo?: string, branch?: string) {
    const o = owner ?? this.defaults.owner;
    const r = repo ?? this.defaults.repo;
    const b = branch ?? this.defaults.branch;
    if (!o) throw new Error('Repository owner is not set. Provide owner in constructor options or as a method argument.');
    if (!r) throw new Error('Repository name is not set. Provide repo in constructor options or as a method argument.');
    return { owner: o, repo: r, branch: b };
  }

  // ---- public API ----

  // List files recursively from a directory (default root). Uses GitHub "getContent" and recurses.
  async listFilesRecursive(owner?: string, repo?: string, dir = '', branch?: string): Promise<GitHubFile[]> {
    const params = this.resolveRepoParams(owner, repo, branch);
    const cacheKey = this.makeCacheKey('files', [params.owner, params.repo, params.branch, dir || '/']);
    const cached = this.getFromCache<GitHubFile[]>(cacheKey);
    if (cached) return cached;

    const result: GitHubFile[] = [];
    const visited = new Set<string>();

    const walk = async (path: string) => {
      const callParams: any = { owner: params.owner, repo: params.repo, ref: params.branch };
      if (path && path.trim().length > 0) callParams.path = path;

      const res = await this.retryWithBackoff(() => this.octokit.rest.repos.getContent(callParams));
      const items = Array.isArray(res.data) ? res.data : [res.data];

      for (const item of items) {
        if (!item || !item.type) continue;
        if (item.type === 'file') {
          result.push({ path: item.path, sha: item.sha, size: item.size ?? 0, type: 'file' });
        } else if (item.type === 'dir') {
          if (!visited.has(item.path)) {
            visited.add(item.path);
            await walk(item.path);
          }
        } else {
          // ignore other types (symlink/submodule)
        }
      }
    };

    await walk(dir);

    this.setCache(cacheKey, result);
    return result;
  }

  // Get file content (decoded). Throws if path is a directory.
  async getFileContent(path: string, owner?: string, repo?: string, branch?: string): Promise<GitHubContent> {
    if (!path) throw new Error('path is required');
    const params = this.resolveRepoParams(owner, repo, branch);
    const cacheKey = this.makeCacheKey('content', [params.owner, params.repo, params.branch, path]);
    const cached = this.getFromCache<GitHubContent>(cacheKey);
    if (cached) return cached;

    const res: any = await this.retryWithBackoff(() =>
      this.octokit.rest.repos.getContent({ owner: params.owner, repo: params.repo, path, ref: params.branch })
    );

    if (Array.isArray(res.data)) {
      throw new Error(`Requested path "${path}" is a directory, not a file`);
    }
    if (!('content' in res.data) || !('sha' in res.data)) {
      throw new Error(`Unexpected response when fetching content for "${path}"`);
    }

    const decoded = Buffer.from(res.data.content, 'base64').toString('utf8');
    const content: GitHubContent = { content: decoded, sha: res.data.sha, size: res.data.size ?? decoded.length };
    this.setCache(cacheKey, content);
    return content;
  }

  // Update or create a file. If sha is omitted and the file exists, method will read the file to obtain sha.
  // options.message optional commit message (defaults)
  async updateFile(path: string, content: string, opts?: { owner?: string; repo?: string; branch?: string; sha?: string; message?: string; }): Promise<{ committedSha: string }> {
    if (!path) throw new Error('path is required');
    if (typeof content !== 'string') throw new Error('content must be a string');

    const { owner, repo, branch } = this.resolveRepoParams(opts?.owner, opts?.repo, opts?.branch);
    let sha = opts?.sha;

    // If no SHA provided, try to read the file to update (if exists). If 404, create new file.
    if (!sha) {
      try {
        const current = await this.getFileContent(path, owner, repo, branch);
        sha = current.sha;
        if (current.size > this.defaults.maxFileSize) {
          throw new Error(`File too large (${current.size} bytes > ${this.defaults.maxFileSize})`);
        }
      } catch (err: any) {
        const msg = (err?.message ?? '').toString().toLowerCase();
        if (!msg.includes('not found') && !msg.includes('404')) {
          throw err; // rethrow unexpected errors
        }
        // else file not found -> we will create new file (sha stays undefined)
      }
    }

    const params: any = {
      owner,
      repo,
      path,
      message: opts?.message ?? `[GitHubService] update ${path}`,
      content: Buffer.from(content, 'utf8').toString('base64'),
      branch
    };
    if (sha) params.sha = sha;

    const res: any = await this.retryWithBackoff(() => this.octokit.rest.repos.createOrUpdateFileContents(params));
    // invalidate cache for the file
    const cacheKey = this.makeCacheKey('content', [owner, repo, branch, path]);
    this.deleteCache(cacheKey);

    const committedSha = res?.data?.content?.sha ?? res?.data?.commit?.sha;
    if (!committedSha) throw new Error('Failed to determine committed SHA after update');
    return { committedSha };
  }

  // Create a branch from base (or return if exists)
  async ensureBranch(branch: string, opts?: { owner?: string; repo?: string; base?: string; }): Promise<{ created: boolean; branch: string }> {
    if (!branch) throw new Error('branch is required');
    const { owner, repo } = this.resolveRepoParams(opts?.owner, opts?.repo, undefined);
    const base = opts?.base ?? this.defaults.branch;

    try {
      await this.retryWithBackoff(() => this.octokit.rest.git.getRef({ owner, repo, ref: `heads/${branch}` }));
      return { created: false, branch };
    } catch (err: any) {
      const status = err?.status ?? undefined;
      if (status !== 404) throw err;

      // read base sha and create
      const baseRef: any = await this.retryWithBackoff(() => this.octokit.rest.git.getRef({ owner, repo, ref: `heads/${base}` }));
      const sha = baseRef?.data?.object?.sha;
      if (!sha) throw new Error(`Could not resolve SHA for base branch "${base}"`);
      await this.retryWithBackoff(() => this.octokit.rest.git.createRef({ owner, repo, ref: `refs/heads/${branch}`, sha }));
      return { created: true, branch };
    }
  }

  // Create a PR. head can be branch name or "owner:branch" (fork)
  async createPullRequest(params: { title: string; body: string; head: string; base?: string; owner?: string; repo?: string; draft?: boolean; }) {
    const { owner, repo } = this.resolveRepoParams(params.owner, params.repo, undefined);
    if (!params.title || !params.body) throw new Error('title and body are required for PR creation');
    const base = params.base ?? this.defaults.branch;

    const res: any = await this.retryWithBackoff(() =>
      this.octokit.rest.pulls.create({
        owner,
        repo,
        title: `[GitHubService] ${params.title}`,
        body: params.body,
        head: params.head,
        base,
        draft: !!params.draft
      })
    );

    return { number: res.data.number, url: res.data.html_url };
  }

  // Simple health check using authenticated user
  async healthCheck(): Promise<{ ok: boolean; user?: string; message?: string }> {
    try {
      const res: any = await this.retryWithBackoff(() => this.octokit.rest.users.getAuthenticated());
      return { ok: true, user: res.data?.login };
    } catch (err: any) {
      return { ok: false, message: err?.message ?? String(err) };
    }
  }

  // Validate repository exists and is accessible
  async validateRepository(owner?: string, repo?: string): Promise<boolean> {
    try {
      const params = this.resolveRepoParams(owner, repo, undefined);
      const res: any = await this.retryWithBackoff(() => 
        this.octokit.rest.repos.get({ owner: params.owner, repo: params.repo })
      );
      return !!res.data;
    } catch (err: any) {
      return false;
    }
  }

  clearCache() {
    this.requestCache.clear();
  }
}