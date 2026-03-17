/**
 * AGI System Initialization API
 * Seeds the system with all backup repositories
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as fs from 'fs';
import * as path from 'path';

const BACKUP_DIR = '/home/z/my-project/all-repos-backup';

// Code file extensions to import
const CODE_EXTENSIONS = [
  '.ts', '.tsx', '.js', '.jsx', '.py', '.rs', '.go', 
  '.java', '.kt', '.rb', '.php', '.cs', '.cpp', '.c', 
  '.swift', '.json', '.yaml', '.yml', '.md'
];

const EXT_TO_LANG: Record<string, string> = {
  'ts': 'typescript', 'tsx': 'typescript',
  'js': 'javascript', 'jsx': 'javascript',
  'py': 'python', 'rs': 'rust', 'go': 'go',
  'java': 'java', 'kt': 'kotlin', 'rb': 'ruby',
  'php': 'php', 'cs': 'csharp', 'cpp': 'cpp',
  'c': 'c', 'swift': 'swift', 'json': 'json',
  'yaml': 'yaml', 'yml': 'yaml', 'md': 'markdown'
};

function getAllFiles(dir: string, baseDir: string): Array<{ path: string; fullPath: string }> {
  const files: Array<{ path: string; fullPath: string }> = [];
  
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        // Skip node_modules, .git, and other non-essential directories
        if (!['node_modules', '.git', 'dist', 'build', '.next', 'out'].includes(entry.name)) {
          files.push(...getAllFiles(fullPath, baseDir));
        }
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (CODE_EXTENSIONS.includes(ext)) {
          files.push({
            path: path.relative(baseDir, fullPath),
            fullPath
          });
        }
      }
    }
  } catch (error) {
    // Skip directories we can't read
  }
  
  return files;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, limit } = body;

    if (action === 'seed') {
      const startTime = Date.now();
      const results = {
        reposProcessed: 0,
        filesImported: 0,
        errors: [] as string[]
      };

      // Get all repository directories
      const entries = fs.readdirSync(BACKUP_DIR, { withFileTypes: true });
      const repos = entries
        .filter(e => e.isDirectory())
        .map(e => e.name)
        .filter(name => !name.startsWith('.'))
        .slice(0, limit || 100); // Limit repos if specified

      for (const repoName of repos) {
        try {
          const repoPath = path.join(BACKUP_DIR, repoName);
          
          // Create or get repository record
          let repo = await db.repository.findFirst({
            where: { name: repoName }
          });

          if (!repo) {
            repo = await db.repository.create({
              data: {
                name: repoName,
                url: `local://${repoName}`,
                description: `Imported from backup`,
                analysisStatus: 'pending'
              }
            });
          }

          // Get all code files
          const files = getAllFiles(repoPath, repoPath);
          let importedCount = 0;

          // Import files in batches
          for (const file of files.slice(0, 200)) { // Limit files per repo
            try {
              const content = fs.readFileSync(file.fullPath, 'utf-8');
              const ext = path.extname(file.path).toLowerCase().replace('.', '');
              const language = EXT_TO_LANG[ext] || 'text';

              // Check if file already exists
              const existing = await db.codeFile.findFirst({
                where: { repositoryId: repo.id, path: file.path }
              });

              if (!existing) {
                await db.codeFile.create({
                  data: {
                    repositoryId: repo.id,
                    path: file.path,
                    content: content.substring(0, 50000), // Limit content size
                    language,
                    analyzed: false
                  }
                });
                importedCount++;
              }
            } catch (e) {
              // Skip files we can't read
            }
          }

          // Update file count
          await db.repository.update({
            where: { id: repo.id },
            data: { fileCount: importedCount }
          });

          results.reposProcessed++;
          results.filesImported += importedCount;

        } catch (error) {
          results.errors.push(`Failed to process ${repoName}: ${(error as Error).message}`);
        }
      }

      return NextResponse.json({
        success: true,
        results,
        duration: Date.now() - startTime
      });
    }

    if (action === 'status') {
      const repos = await db.repository.count();
      const files = await db.codeFile.count();
      const patterns = await db.pattern.count();
      const analyzed = await db.codeFile.count({ where: { analyzed: true } });

      return NextResponse.json({
        success: true,
        stats: { repos, files, patterns, analyzed }
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Seed API error:', error);
    return NextResponse.json({
      error: 'Seeding failed',
      message: (error as Error).message
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const entries = fs.readdirSync(BACKUP_DIR, { withFileTypes: true });
    const repos = entries
      .filter(e => e.isDirectory())
      .map(e => e.name)
      .filter(name => !name.startsWith('.'));

    return NextResponse.json({
      success: true,
      availableRepos: repos,
      count: repos.length
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to list repos',
      message: (error as Error).message
    }, { status: 500 });
  }
}
