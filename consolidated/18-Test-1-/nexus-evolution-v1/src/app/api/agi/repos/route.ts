/**
 * AGI Repository Management API
 * Handles repository registration, cloning, and management
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, url, name, description, files } = body;

    switch (action) {
      case 'register': {
        if (!url || !name) {
          return NextResponse.json({ error: 'URL and name required' }, { status: 400 });
        }

        // Check if repository already exists
        const existing = await db.repository.findFirst({
          where: { url }
        });

        if (existing) {
          return NextResponse.json({ 
            error: 'Repository already registered',
            repository: existing 
          }, { status: 400 });
        }

        // Create repository record
        const repo = await db.repository.create({
          data: {
            name,
            url,
            description: description || '',
            analysisStatus: 'pending'
          }
        });

        return NextResponse.json({ 
          success: true, 
          message: 'Repository registered',
          repository: repo
        });
      }

      case 'addFiles': {
        const { repoId, files: fileList } = body;
        if (!repoId || !fileList || !Array.isArray(fileList)) {
          return NextResponse.json({ error: 'Repository ID and files array required' }, { status: 400 });
        }

        let addedCount = 0;
        for (const file of fileList) {
          try {
            await db.codeFile.create({
              data: {
                repositoryId: repoId,
                path: file.path,
                content: file.content,
                language: file.language,
                analyzed: false
              }
            });
            addedCount++;
          } catch (e) {
            console.error(`Failed to add file ${file.path}:`, e);
          }
        }

        // Update file count
        await db.repository.update({
          where: { id: repoId },
          data: { fileCount: addedCount }
        });

        return NextResponse.json({ 
          success: true, 
          message: `Added ${addedCount} files`,
          count: addedCount
        });
      }

      case 'importFromGitHub': {
        const { token, owner, repo: repoName } = body;
        if (!owner || !repoName) {
          return NextResponse.json({ error: 'Owner and repo name required' }, { status: 400 });
        }

        // Fetch repository contents from GitHub API
        const headers: Record<string, string> = {
          'Accept': 'application/vnd.github.v3+json'
        };
        if (token) {
          headers['Authorization'] = `token ${token}`;
        }

        // Get repository info
        const repoResponse = await fetch(
          `https://api.github.com/repos/${owner}/${repoName}`,
          { headers }
        );

        if (!repoResponse.ok) {
          return NextResponse.json({ 
            error: 'Failed to fetch repository info',
            status: repoResponse.status
          }, { status: 400 });
        }

        const repoData = await repoResponse.json();

        // Find or create repository record
        let repo = await db.repository.findFirst({
          where: { url: repoData.html_url }
        });
        
        if (!repo) {
          repo = await db.repository.create({
            data: {
              name: repoData.full_name,
              url: repoData.html_url,
              description: repoData.description || '',
              analysisStatus: 'pending'
            }
          });
        } else {
          repo = await db.repository.update({
            where: { id: repo.id },
            data: {
              description: repoData.description || ''
            }
          });
        }

        // Fetch file tree
        const treeResponse = await fetch(
          `https://api.github.com/repos/${owner}/${repoName}/git/trees/main?recursive=1`,
          { headers }
        );

        if (!treeResponse.ok) {
          // Try master branch
          const masterResponse = await fetch(
            `https://api.github.com/repos/${owner}/${repoName}/git/trees/master?recursive=1`,
            { headers }
          );
          if (masterResponse.ok) {
            const treeData = await masterResponse.json();
            await processTree(treeData.tree, repo.id, owner, repoName, headers);
          }
        } else {
          const treeData = await treeResponse.json();
          await processTree(treeData.tree, repo.id, owner, repoName, headers);
        }

        return NextResponse.json({ 
          success: true, 
          message: 'Repository imported',
          repository: repo
        });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Repository API error:', error);
    return NextResponse.json({
      error: 'Repository action failed',
      message: (error as Error).message
    }, { status: 500 });
  }
}

async function processTree(
  tree: Array<{ path: string; type: string; url?: string }>,
  repoId: string,
  owner: string,
  repoName: string,
  headers: Record<string, string>
) {
  // Filter for code files
  const codeExtensions = ['.ts', '.tsx', '.js', '.jsx', '.py', '.rs', '.go', '.java', '.kt', '.rb', '.php', '.cs', '.cpp', '.c', '.swift'];
  const codeFiles = tree.filter(item => 
    item.type === 'blob' && 
    codeExtensions.some(ext => item.path.endsWith(ext))
  );

  let addedCount = 0;

  // Process files in batches
  for (const file of codeFiles.slice(0, 100)) { // Limit to 100 files
    try {
      // Fetch file content
      const contentResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repoName}/contents/${file.path}`,
        { headers }
      );

      if (contentResponse.ok) {
        const contentData = await contentResponse.json();
        
        if (contentData.encoding === 'base64' && contentData.content) {
          const content = Buffer.from(contentData.content, 'base64').toString('utf-8');
          
          const ext = file.path.split('.').pop()?.toLowerCase() || '';
          const langMap: Record<string, string> = {
            'ts': 'typescript', 'tsx': 'typescript',
            'js': 'javascript', 'jsx': 'javascript',
            'py': 'python', 'rs': 'rust', 'go': 'go',
            'java': 'java', 'kt': 'kotlin', 'rb': 'ruby',
            'php': 'php', 'cs': 'csharp', 'cpp': 'cpp',
            'c': 'c', 'swift': 'swift'
          };

          await db.codeFile.create({
            data: {
              repositoryId: repoId,
              path: file.path,
              content: content.substring(0, 50000), // Limit content size
              language: langMap[ext] || 'text',
              analyzed: false
            }
          });
          addedCount++;
        }
      }
    } catch (e) {
      console.error(`Failed to process file ${file.path}:`, e);
    }
  }

  // Update file count
  await db.repository.update({
    where: { id: repoId },
    data: { fileCount: addedCount }
  });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const repoId = searchParams.get('id');

    if (repoId) {
      const repo = await db.repository.findUnique({
        where: { id: repoId },
        include: {
          files: {
            select: {
              id: true,
              path: true,
              language: true,
              analyzed: true
            },
            take: 100
          },
          patterns: {
            select: {
              id: true,
              name: true,
              type: true,
              confidence: true
            },
            take: 50
          }
        }
      });
      return NextResponse.json({ success: true, repository: repo });
    }

    // Get all repositories
    const repos = await db.repository.findMany({
      include: {
        _count: {
          select: { files: true, patterns: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const stats = {
      totalRepos: repos.length,
      totalFiles: await db.codeFile.count(),
      totalPatterns: await db.pattern.count(),
      analyzedRepos: repos.filter(r => r.analysisStatus === 'analyzed').length
    };

    return NextResponse.json({ success: true, repositories: repos, stats });
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to get repositories',
      message: (error as Error).message
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const repoId = searchParams.get('id');

    if (!repoId) {
      return NextResponse.json({ error: 'Repository ID required' }, { status: 400 });
    }

    // Delete related files and patterns first
    await db.pattern.deleteMany({ where: { repositoryId: repoId } });
    await db.codeFile.deleteMany({ where: { repositoryId: repoId } });
    await db.repository.delete({ where: { id: repoId } });

    return NextResponse.json({ success: true, message: 'Repository deleted' });
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to delete repository',
      message: (error as Error).message
    }, { status: 500 });
  }
}
