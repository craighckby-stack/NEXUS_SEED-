import { NextRequest, NextResponse } from 'next/server'

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || ''
const GITHUB_API = 'https://api.github.com'

// NEXUS_SEED- repository branches to self-syphon
const OWN_BRANCHES = ['main', 'System', 'Nexus-Database', 'sovereign-v90-optimizations']
const CODE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.py', '.md', '.json']

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    if (action === 'getFiles') {
      // Read own repository files
      const files: Array<{ path: string; content: string; branch: string }> = []

      for (const branch of OWN_BRANCHES) {
        try {
          const branchFiles = await getBranchFiles('craighckby-stack', 'NEXUS_SEED-', branch)
          files.push(...branchFiles.slice(0, 10)) // Limit per branch
        } catch {
          // Branch may not exist, continue
        }
      }

      return NextResponse.json({
        success: true,
        files,
        totalFiles: files.length
      })
    }

    if (action === 'getStructure') {
      // Get repository structure
      const structure: Array<{ branch: string; fileCount: number; files: string[] }> = []

      for (const branch of OWN_BRANCHES) {
        try {
          const tree = await getBranchTree('craighckby-stack', 'NEXUS_SEED-', branch)
          structure.push({
            branch,
            fileCount: tree.length,
            files: tree.slice(0, 20)
          })
        } catch {
          // Branch may not exist
        }
      }

      return NextResponse.json({
        success: true,
        structure
      })
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action. Use getFiles or getStructure.'
    })

  } catch (error) {
    console.error('Self-read API Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

async function getBranchTree(owner: string, repo: string, branch: string): Promise<string[]> {
  const treeUrl = `${GITHUB_API}/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`

  const res = await fetch(treeUrl, {
    headers: {
      'Authorization': `token ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  })

  if (!res.ok) return []

  const data = await res.json()
  return (data.tree || [])
    .filter((f: { type: string; path: string }) => {
      if (f.type !== 'blob') return false
      const ext = '.' + f.path.split('.').pop()?.toLowerCase()
      return CODE_EXTENSIONS.includes(ext)
    })
    .map((f: { path: string }) => f.path)
}

async function getBranchFiles(owner: string, repo: string, branch: string): Promise<Array<{ path: string; content: string; branch: string }>> {
  const files: Array<{ path: string; content: string; branch: string }> = []

  const treeUrl = `${GITHUB_API}/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`

  const treeRes = await fetch(treeUrl, {
    headers: {
      'Authorization': `token ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  })

  if (!treeRes.ok) return []

  const tree = await treeRes.json()
  const codeFiles = (tree.tree || []).filter((f: { type: string; path: string }) => {
    if (f.type !== 'blob') return false
    const ext = '.' + f.path.split('.').pop()?.toLowerCase()
    return CODE_EXTENSIONS.includes(ext)
  })

  // Get content for first 5 files
  for (const file of codeFiles.slice(0, 5)) {
    try {
      const contentUrl = `${GITHUB_API}/repos/${owner}/${repo}/contents/${file.path}?ref=${branch}`
      const contentRes = await fetch(contentUrl, {
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      })

      if (!contentRes.ok) continue

      const content = await contentRes.json()
      if (content.content) {
        const decoded = Buffer.from(content.content.replace(/\s/g, ''), 'base64').toString('utf-8')
        files.push({
          path: file.path,
          content: decoded.slice(0, 5000), // Limit content size
          branch
        })
      }
    } catch {
      // Continue on error
    }

    // Rate limiting
    await new Promise(r => setTimeout(r, 100))
  }

  return files
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'NEXUS_SEED- self-read API',
    branches: OWN_BRANCHES
  })
}
