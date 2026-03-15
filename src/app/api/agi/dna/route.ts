import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const GITHUB_TOKEN = '${GITHUB_TOKEN}'
const GITHUB_API = 'https://api.github.com'

// Code extensions to ingest
const CODE_EXTENSIONS = ['.js', '.ts', '.py', '.rs', '.go', '.jsx', '.tsx', '.sol', '.md', '.json', '.yaml', '.yml']

// Categorize file
function categorizeFile(path: string): string {
  const lower = path.toLowerCase()
  if (lower.includes('kernel') || lower.includes('nexus') || lower.includes('core')) return 'kernel'
  if (lower.includes('engine') || lower.includes('calculus')) return 'engine'
  if (lower.includes('governance') || lower.includes('policy')) return 'governance'
  if (lower.includes('agent') || lower.includes('executor')) return 'agent'
  if (lower.includes('service')) return 'service'
  if (lower.includes('protocol') || lower.includes('contract')) return 'protocol'
  if (lower.includes('config') || lower.includes('schema')) return 'config'
  if (lower.includes('.test.') || lower.includes('.spec.')) return 'test'
  if (lower.includes('.md') || lower.includes('readme')) return 'doc'
  const ext = '.' + path.split('.').pop()?.toLowerCase()
  if (['.js', '.ts', '.py', '.go', '.rs'].includes(ext)) return 'code'
  if (['.json', '.yaml', '.yml'].includes(ext)) return 'config'
  return 'other'
}

// Syphon from any GitHub repo
async function syphonRepo(owner: string, repo: string, branch: string, limit: number) {
  const treeUrl = `${GITHUB_API}/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`
  const treeRes = await fetch(treeUrl, {
    headers: { Authorization: `token ${GITHUB_TOKEN}` }
  })
  
  if (!treeRes.ok) {
    return { stored: 0, error: `Failed to fetch ${owner}/${repo}/${branch}` }
  }
  
  const tree = await treeRes.json()
  const files = (tree.tree || []).filter((f: { type: string; path: string }) => {
    if (f.type !== 'blob') return false
    const ext = '.' + f.path.split('.').pop()?.toLowerCase()
    return CODE_EXTENSIONS.includes(ext)
  })
  
  let stored = 0
  const toProcess = files.slice(0, limit)
  
  for (const file of toProcess) {
    try {
      const hash = `${owner}/${repo}/${branch}/${file.path}`
      const existing = await db.dnaChunk.findFirst({ where: { hash } })
      if (existing) continue
      
      const contentUrl = `${GITHUB_API}/repos/${owner}/${repo}/contents/${file.path}?ref=${branch}`
      const contentRes = await fetch(contentUrl, {
        headers: { Authorization: `token ${GITHUB_TOKEN}` }
      })
      
      if (!contentRes.ok) continue
      const content = await contentRes.json()
      if (!content.content) continue
      
      const decoded = Buffer.from(content.content.replace(/\s/g, ''), 'base64').toString('utf-8')
      if (decoded.length < 50 || decoded.length > 100000) continue
      
      const category = categorizeFile(file.path)
      
      await db.dnaChunk.create({
        data: {
          content: decoded.slice(0, 50000),
          tags: `${category},${owner}/${repo},${branch}`,
          source: `${owner}/${repo}/${branch}/${file.path}`,
          hash,
          wordCount: decoded.split(/\s+/).length
        }
      })
      
      stored++
    } catch { }
    
    await new Promise(r => setTimeout(r, 100))
  }
  
  return { stored, total: files.length }
}

// Search GitHub for repos
async function searchRepos(query: string, limit: number = 10) {
  const searchUrl = `${GITHUB_API}/search/repositories?q=${encodeURIComponent(query)}&per_page=${limit}`
  const res = await fetch(searchUrl, {
    headers: { Authorization: `token ${GITHUB_TOKEN}` }
  })
  
  if (!res.ok) return []
  
  const data = await res.json()
  return (data.items || []).map((r: { full_name: string; description?: string; stargazers_count: number; default_branch: string }) => ({
    fullName: r.full_name,
    description: r.description,
    stars: r.stargazers_count,
    defaultBranch: r.default_branch
  }))
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'syphon': {
        // Syphon from any repo
        const { owner, repo, branch, limit = 100 } = body
        if (!owner || !repo) {
          return NextResponse.json({ error: 'owner and repo required' }, { status: 400 })
        }
        
        const result = await syphonRepo(owner, repo, branch || 'main', limit)
        return NextResponse.json({ success: true, ...result })
      }
      
      case 'syphonMultiple': {
        // Syphon from multiple repos
        const { repos, limitPerRepo = 50 } = body
        if (!repos || !Array.isArray(repos)) {
          return NextResponse.json({ error: 'repos array required' }, { status: 400 })
        }
        
        let totalStored = 0
        const results = []
        
        for (const r of repos) {
          const result = await syphonRepo(r.owner, r.repo, r.branch || 'main', limitPerRepo)
          totalStored += result.stored
          results.push({ repo: `${r.owner}/${r.repo}`, ...result })
        }
        
        return NextResponse.json({ success: true, totalStored, results })
      }
      
      case 'search': {
        // Search for repos to syphon
        const { query, limit } = body
        const repos = await searchRepos(query, limit || 10)
        return NextResponse.json({ success: true, repos })
      }
      
      case 'autoSyphon': {
        // Auto-syphon from interesting repos
        const queries = [
          'artificial intelligence agent',
          'AGI framework',
          'autonomous agent',
          'LLM chain',
          'self-evolving code'
        ]
        
        let totalStored = 0
        const syphoned = []
        
        for (const query of queries) {
          const repos = await searchRepos(query, 3)
          for (const r of repos.slice(0, 2)) {
            const [owner, repo] = r.fullName.split('/')
            const result = await syphonRepo(owner, repo, r.defaultBranch, 30)
            totalStored += result.stored
            if (result.stored > 0) {
              syphoned.push({ repo: r.fullName, stored: result.stored })
            }
          }
        }
        
        return NextResponse.json({ 
          success: true, 
          totalStored, 
          syphoned,
          message: `Auto-syphoned ${totalStored} chunks from ${syphoned.length} repos`
        })
      }
      
      case 'inject': {
        // Manually inject code into DNA
        const { content, tags, source } = body
        if (!content) {
          return NextResponse.json({ error: 'content required' }, { status: 400 })
        }
        
        const hash = `manual/${Date.now()}`
        await db.dnaChunk.create({
          data: {
            content: content.slice(0, 50000),
            tags: tags || 'manual,injected',
            source: source || 'manual-injection',
            hash,
            wordCount: content.split(/\s+/).length
          }
        })
        
        return NextResponse.json({ success: true, message: 'Code injected into DNA' })
      }
      
      case 'ingestAll': {
        // Updated: ingest from NEXUS_SEED- branches (was Test-1)
        const branches = ['main', 'System', 'Nexus-Database', 'sovereign-v90-optimizations']
        let totalStored = 0

        for (const branch of branches) {
          const result = await syphonRepo('craighckby-stack', 'NEXUS_SEED-', branch, 100)
          totalStored += result.stored
        }

        return NextResponse.json({ success: true, stored: totalStored, source: 'NEXUS_SEED-' })
      }

      case 'selfSyphon': {
        // Self-syphon from NEXUS_SEED- own branches
        const ownBranches = ['main', 'System', 'Nexus-Database', 'sovereign-v90-optimizations']
        let selfStored = 0
        const branchResults = []

        for (const branch of ownBranches) {
          try {
            const result = await syphonRepo('craighckby-stack', 'NEXUS_SEED-', branch, 50)
            selfStored += result.stored
            if (result.stored > 0) {
              branchResults.push({ branch, stored: result.stored })
            }
          } catch {
            // Branch may not exist
          }
        }

        return NextResponse.json({
          success: true,
          stored: selfStored,
          branches: branchResults,
          message: `Self-syphoned ${selfStored} DNA chunks from NEXUS_SEED- branches`
        })
      }
      
      case 'getStats': {
        const total = await db.dnaChunk.count()
        const sources = await db.dnaChunk.groupBy({
          by: ['source'],
          _count: true,
          orderBy: { _count: { source: 'desc' } },
          take: 10
        })
        
        return NextResponse.json({
          success: true,
          stats: {
            total,
            topSources: sources.map(s => ({ source: s.source, count: s._count }))
          }
        })
      }
      
      case 'getDna': {
        const { categories, maxChunks = 8, maxLength = 10000 } = body
        const cats = categories || ['kernel', 'engine', 'code']
        
        const chunks = await db.dnaChunk.findMany({
          where: {
            OR: cats.map((cat: string) => ({ tags: { contains: cat } }))
          },
          take: maxChunks * 3
        })
        
        let totalLen = 0
        const dna = chunks.slice(0, maxChunks).map(c => {
          const available = maxLength - totalLen
          if (available <= 0) return null
          const content = c.content.slice(0, Math.min(available, 2000))
          totalLen += content.length
          return `// ${c.source}\n${content}`
        }).filter(Boolean).join('\n\n')
        
        return NextResponse.json({ success: true, dna, length: totalLen })
      }
      
      case 'clear': {
        await db.dnaChunk.deleteMany({})
        return NextResponse.json({ success: true, message: 'DNA cleared' })
      }
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('DNA API Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  const total = await db.dnaChunk.count()
  const categories = ['kernel', 'engine', 'governance', 'agent', 'code', 'config', 'doc']
  const counts: Record<string, number> = {}
  
  for (const cat of categories) {
    counts[cat] = await db.dnaChunk.count({
      where: { tags: { contains: cat } }
    })
  }
  
  return NextResponse.json({
    success: true,
    stats: { total, categories: counts }
  })
}
