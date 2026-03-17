import { URL } from 'url';
import axios from 'axios';
import { Buffer } from 'buffer';
import dotenv from 'dotenv';

dotenv.config();

const CONFIG = {
  defaultBranch: 'main',
  defaultReplacement: '[REDACTED]',
  defaultCommitMessage: 'chore: redact sensitive information',
  supportedFileExtensions: new Set([
    '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.json',
    '.md', '.markdown', '.txt', '.yaml', '.yml', '.html', '.htm',
    '.css', '.scss', '.less', '.xml', '.svg', '.csv', '.tsv',
    '.env.example', '.gitignore', '.gitattributes',
    '.dockerfile', '.toml', '.ini', '.cfg', '.conf',
    '.py', '.rb', '.java', '.go', '.rs', '.php', '.sh', '.bat',
    '.ps1', '.lua', '.sql', '.graphql', '.gql', '.vue', '.svelte', '.astro',
    '.lock', '.map', '.log',
    '.gitkeep'
  ]),
  specificTextFiles: new Set([
    'Makefile',
    'Dockerfile',
    'LICENSE',
    'README',
  ]),
};

class GitHubApiClient {
  #token;

  constructor(token) {
    if (!token) {
      throw new Error('GitHub Personal Access Token is required.');
    }
    this.#token = token;
  }

  async createHeaders() {
    return {
      Authorization: `token ${this.#token}`,
      Accept: 'application/vnd.github.v3+json',
    };
  }

  async fetch(url, method = 'GET', data = null) {
    try {
      const headers = await this.createHeaders();
      const response = await axios({
        method,
        url: new URL(url, 'https://api.github.com').href,
        headers,
        data,
      });

      if (!response.status || !response.ok) {
        throw new Error(`GitHub ${response.status}: ${response.data.message}`);
      }
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async get(url) {
    return await this.fetch(url);
  }

  async put(url, data) {
    return await this.fetch(url, 'PUT', data);
  }
}

class Redactor {
  #client;
  #owner;
  #repo;
  #branch;

  constructor(token, owner, repo, branch = CONFIG.defaultBranch) {
    this.#client = new GitHubApiClient(token);
    this.#owner = owner;
    this.#repo = repo;
    this.#branch = branch;
  }

  async getTextFiles() {
    try {
      const { tree } = await this.#client.get(`repos/${this.#owner}/${this.#repo}/git/trees/${this.#branch}?recursive=1`);
      return tree.filter((item) => item.type === 'blob' && this.isTextFile(item.path)).map((item) => item.path);
    } catch (error) {
      console.warn(`Failed to retrieve text files: ${error.message}`);
      return [];
    }
  }

  isTextFile(path) {
    const ext = path.split('.').pop();
    return CONFIG.supportedFileExtensions.has(`.${ext}`) || CONFIG.specificTextFiles.has(path);
  }

  async getFileContent(path) {
    try {
      const { content, sha } = await this.#client.get(`repos/${this.#owner}/${this.#repo}/contents/${path}?ref=${this.#branch}`);
      return { content: Buffer.from(content, 'base64').toString('utf-8'), sha };
    } catch (error) {
      console.warn(`Could not read file "${path}": ${error.message}`);
      throw error;
    }
  }

  async updateFile(path, newContent, sha, message) {
    try {
      await this.#client.put(`repos/${this.#owner}/${this.#repo}/contents/${path}`, {
        message,
        content: Buffer.from(newContent).toString('base64'),
        sha,
        branch: this.#branch,
      });
    } catch (error) {
      console.warn(`Failed to update file "${path}": ${error.message}`);
      throw error;
    }
  }

  async run(options) {
    const pattern = this.buildRedactPattern(options.redactions);
    const flags = options.caseInsensitive
      ? (options.wordBoundary ? 'gi' : 'gi')
      : (options.wordBoundary ? '' : 'i');

    try {
      console.log('GitHub Redactor');
      console.log(`Repository: ${this.#owner}/${this.#repo} (${this.#branch})`);
      console.log(`Redact terms: ${options.redactions.join(', ')}`);
      console.log(`Replacement: ${options.replacement}`);
      console.log(`Commit back: ${options.commitChanges}`);
      console.log('');

      const files = await this.getTextFiles();
      console.log(`Found ${files.length} text file(s) to scan.`);
      console.log('');

      const report = [];
      for (const filePath of files) {
        const file = await this.getFileContent(filePath);
        const matches = file.content.match(new RegExp(pattern, flags));
        if (!matches) {
          report.push({ path: filePath, matchCount: 0, updated: false });
          continue;
        }

        const cleaned = file.content.replace(new RegExp(pattern, flags), options.replacement);
        const matchCount = matches.length;

        console.log(`Scanned ${filePath} — ${matchCount} match(es)`);
        if (options.commitChanges) {
          await this.updateFile(filePath, cleaned, file.sha, options.commitMessage);
          console.log('  Committed');
        }

        report.push({ path: filePath, matchCount, updated: options.commitChanges });
      }

      const totalMatches = report.reduce((sum, r) => sum + (r.matchCount || 0), 0);
      const filesChanged = report.filter((r) => r.updated).length;
      const filesWithHits = report.filter((r) => r.matchCount > 0).length;

      console.log('');
      console.log(`Total matches: ${totalMatches}`);
      console.log(`Files changed: ${filesChanged}`);
      console.log(`Files with hits: ${filesWithHits}`);
    } catch (error) {
      console.error(error.message);
    }
  }

  buildRedactPattern(terms) {
    return terms.map((term) => escapeRegExp(term)).join('|');
  }
}

const escapeRegExp = (str) => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function main(options) {
  if (!options.token) {
    throw new Error('GitHub Personal Access Token is required.');
  }
  if (!options.owner) {
    throw new Error('GitHub username or organization is required.');
  }
  if (!options.repo) {
    throw new Error('Repository name is required.');
  }

  if (!options.redactions || !Array.isArray(options.redactions)) {
    throw new Error('Redactions must be a non-empty array of strings.');
  }

  const redactor = new Redactor(options.token, options.owner, options.repo, options.branch);
  await redactor.run({
    redactions: options.redactions,
    replacement: options.replacement || CONFIG.defaultReplacement,
    commitChanges: options.commitChanges || false,
    commitMessage: options.commitMessage || CONFIG.defaultCommitMessage,
    caseInsensitive: options.caseInsensitive || false,
    wordBoundary: options.wordBoundary || false,
  });
}

export default main;

// example usage:
main({
  token: 'your-github-token',
  owner: 'your-github-username',
  repo: 'your-repo-name',
  redactions: ['term1', 'term2'],
});

// SUMMARY: Code refactored for better performance, naming conventions, and security