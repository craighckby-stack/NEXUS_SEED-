/**
 * AGI Auto-Initialization API
 * Automatically seeds repositories and starts the system on first load
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as fs from 'fs';
import * as path from 'path';

const BACKUP_DIR = '/home/z/my-project/all-repos-backup';

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
        if (!['node_modules', '.git', 'dist', 'build', '.next', 'out', '__MACOSX'].includes(entry.name)) {
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
  } catch {
    // Skip directories we can't read
  }
  
  return files;
}

// Global initialization state
let initializationPromise: Promise<{
  reposProcessed: number;
  filesImported: number;
  patternsCreated: number;
}> | null = null;

async function initializeSystem(): Promise<{
  reposProcessed: number;
  filesImported: number;
  patternsCreated: number;
}> {
  // Check if already initialized
  const existingRepos = await db.repository.count();
  if (existingRepos > 0) {
    const files = await db.codeFile.count();
    return {
      reposProcessed: existingRepos,
      filesImported: files,
      patternsCreated: await db.pattern.count()
    };
  }

  const results = {
    reposProcessed: 0,
    filesImported: 0,
    patternsCreated: 0
  };

  try {
    const entries = fs.readdirSync(BACKUP_DIR, { withFileTypes: true });
    const repos = entries
      .filter(e => e.isDirectory())
      .map(e => e.name)
      .filter(name => !name.startsWith('.'))
      .slice(0, 50); // Limit to 50 repos

    for (const repoName of repos) {
      try {
        const repoPath = path.join(BACKUP_DIR, repoName);
        
        // Create repository record
        const repo = await db.repository.create({
          data: {
            name: repoName,
            url: `local://${repoName}`,
            description: `Auto-imported from backup`,
            analysisStatus: 'pending'
          }
        });

        // Get all code files
        const files = getAllFiles(repoPath, repoPath).slice(0, 100); // 100 files per repo max
        let importedCount = 0;

        // Import files
        for (const file of files) {
          try {
            const content = fs.readFileSync(file.fullPath, 'utf-8');
            const ext = path.extname(file.path).toLowerCase().replace('.', '');
            const language = EXT_TO_LANG[ext] || 'text';

            await db.codeFile.create({
              data: {
                repositoryId: repo.id,
                path: file.path,
                content: content.substring(0, 30000), // Limit content size
                language,
                analyzed: false
              }
            });
            importedCount++;
          } catch {
            // Skip files we can't read
          }
        }

        // Update file count
        await db.repository.update({
          where: { id: repo.id },
          data: { fileCount: importedCount, analysisStatus: 'analyzed' }
        });

        results.reposProcessed++;
        results.filesImported += importedCount;

      } catch (error) {
        console.error(`Failed to process ${repoName}:`, error);
      }
    }

    // Mark system as initialized
    await db.systemState.upsert({
      where: { key: 'systemInitialized' },
      create: {
        key: 'systemInitialized',
        value: JSON.stringify({
          timestamp: new Date().toISOString(),
          ...results
        }),
        description: 'System initialization status'
      },
      update: {
        value: JSON.stringify({
          timestamp: new Date().toISOString(),
          ...results
        })
      }
    });

  } catch (error) {
    console.error('Initialization error:', error);
  }

  return results;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';

    // Check current status
    const existingRepos = await db.repository.count();
    const existingFiles = await db.codeFile.count();
    const existingPatterns = await db.pattern.count();

    // If already has data, return status immediately
    if (existingRepos > 0 && !force) {
      return NextResponse.json({
        success: true,
        initialized: true,
        status: 'ready',
        stats: {
          repos: existingRepos,
          files: existingFiles,
          patterns: existingPatterns
        }
      });
    }

    // Start or continue initialization
    if (!initializationPromise) {
      initializationPromise = initializeSystem();
    }

    const results = await initializationPromise;

    return NextResponse.json({
      success: true,
      initialized: true,
      status: 'ready',
      stats: {
        repos: results.reposProcessed,
        files: results.filesImported,
        patterns: results.patternsCreated
      }
    });

  } catch (error) {
    console.error('Init API error:', error);
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // Force re-initialization
  initializationPromise = null;
  return GET(request);
}
