import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const GITHUB_TOKEN = 'GITHUB_TOKEN_PLACEHOLDER'
const GITHUB_API = 'https://api.github.com'

// All branches to ingest from Test-1
const BRANCHES = [
  { name: 'main', priority: 1, description: 'Primary development' },
  { name: 'System', priority: 2, description: 'Core system' },
  { name: 'Nexus-Database', priority: 2, description: 'Database layer' },
  { name: 'sovereign-v90-optimizations', priority: 3, description: 'Optimized version' },
]

// File categories and their priorities
const FILE_CATEGORIES = {
  // Core AGI components
  kernel: { extensions: [], patterns: ['kernel', 'nexus', 'core', 'bootstrap'], priority: 10 },
  engine: { extensions: ['.engine.js', '.engine.ts', 'Engine.js', 'Engine.ts'], patterns: ['engine', 'calculus'], priority: 9 },
  governance: { extensions: [], patterns: ['governance', 'policy', 'constraint', 'gacr', 'compliance'], priority: 8 },
  agent: { extensions: [], patterns: ['agent', 'gax', 'executor', 'worker'], priority: 7 },
  service: { extensions: [], patterns: ['service', 'kms', 'vmo', 'dse', 'sgs'], priority: 6 },
  protocol: { extensions: ['.sol'], patterns: ['protocol', 'interface', 'contract'], priority: 5 },
  config: { extensions: ['.json', '.yaml', '.yml'], patterns: ['config', 'schema', 'registry'], priority: 4 },
  utility: { extensions: [], patterns: ['util', 'helper', 'tool', 'validator'], priority: 3 },
  test: { extensions: ['.test.js', '.spec.js', '.test.ts', '.spec.ts'], patterns: ['test', 'spec', 'mock'], priority: 2 },
  doc: { extensions: ['.md', '.txt'], patterns: ['doc', 'readme', 'guide'], priority: 1 },
}

// Code extensions to prioritize
const CODE_EXTENSIONS = ['.js', '.ts', '.py', '.rs', '.go', '.jsx', '.tsx', '.sol']
const CONFIG_EXTENSIONS = ['.json', '.yaml', '.yml']
const DOC_EXTENSIONS = ['.md', '.txt']

// Determine category for a file
function categorizeFile(path: string): { category: string; priority: number } {
  const pathLower = path.toLowerCase()
  const ext = '.' + path.split('.').pop()?.toLowerCase()
  
  for (const [category, config] of Object.entries(FILE_CATEGORIES)) {
    // Check extensions
    if (config.extensions.some(e => path.endsWith(e))) {
      return { category, priority: config.priority }
    }
    // Check patterns
    if (config.patterns.some(p => pathLower.includes(p))) {
      return { category, priority: config.priority }
    }
  }
  
  // Default by extension
  if (CODE_EXTENSIONS.includes(ext)) return { category: 'code', priority: 5 }
  if (CONFIG_EXTENSIONS.includes(ext)) return { category: 'config', priority: 4 }
  if (DOC_EXTENSIONS.includes(ext)) return { category: 'doc', priority: 1 }
  
  return { category: 'other', priority: 0 }
}

// Calculate content hash for deduplication
function contentHash(content: string): string {
  let hash = 0
  for (let i = 0; i < Math.min(content.length, 10000); i++) {
    const char = content.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(16)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, branch, limit = 500, categories, clearExisting = false } = body
    
    switch (action) {
      case 'ingestAll': {
        // Ingest from ALL branches
        const results = []
        let totalStored = 0
        let totalProcessed = 0
        let totalErrors = 0
        let totalSkipped = 0
        
        for (const branchInfo of BRANCHES) {
          log(`Starting ingestion from branch: ${branchInfo.name}`)
          
          const result = await ingestBranch(branchInfo.name, limit)
          results.push({ branch: branchInfo.name, ...result })
          
          totalStored += result.stored
          totalProcessed += result.processed
          totalErrors += result.errors
          totalSkipped += result.skipped
        }
        
        return NextResponse.json({
          success: true,
          summary: {
            branches: results,
            total: {
              stored: totalStored,
              processed: totalProcessed,
              errors: totalErrors,
              skipped: totalSkipped
            }
          }
        })
      }
      
      case 'ingest': {
        // Ingest from specific branch
        const result = await ingestBranch(branch || 'main', limit)
        return NextResponse.json({
          success: true,
          branch: branch || 'main',
          ...result
        })
      }
      
      case 'status': {
        const total = await db.dnaChunk.count()
        const byCategory = await db.dnaChunk.groupBy({
          by: ['tags'],
          _count: true
        })
        
        const bySource = await db.dnaChunk.groupBy({
          by: ['source'],
          _count: true
        })
        
        return NextResponse.json({
          success: true,
          stats: {
            total,
            byCategory: byCategory.slice(0, 20),
            bySource: bySource.slice(0, 10)
          }
        })
      }
      
      case 'search': {
        const { query, category, limit: searchLimit = 10 } = body
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const where: any = {}
        if (category) {
          where.tags = { contains: category }
        }
        if (query) {
          where.OR = [
            { content: { contains: query } },
            { source: { contains: query } }
          ]
        }
        
        const results = await db.dnaChunk.findMany({
          where,
          take: searchLimit,
          orderBy: { createdAt: 'desc' }
        })
        
        return NextResponse.json({
          success: true,
          results: results.map(r => ({
            source: r.source,
            tags: r.tags,
            preview: r.content.slice(0, 500),
            wordCount: r.wordCount
          }))
        })
      }
      
      case 'getDna': {
        const cats = categories || ['engine', 'governance', 'agent', 'kernel']
        const maxChunks = body.maxChunks || 8
        const maxLength = body.maxLength || 12000
        
        // Get high-priority DNA first
        const chunks = await db.dnaChunk.findMany({
          where: {
            OR: cats.map((cat: string) => ({
              tags: { contains: cat }
            }))
          },
          take: maxChunks * 4
        })
        
        // Sort by priority (from tags)
        const sorted = chunks.sort((a, b) => {
          const aPriority = FILE_CATEGORIES[a.tags.split(',')[0] as keyof typeof FILE_CATEGORIES]?.priority || 0
          const bPriority = FILE_CATEGORIES[b.tags.split(',')[0] as keyof typeof FILE_CATEGORIES]?.priority || 0
          return bPriority - aPriority
        })
        
        const selected = sorted.slice(0, maxChunks)
        
        let totalLength = 0
        const dna = selected.map(chunk => {
          const available = maxLength - totalLength
          if (available <= 0) return null
          const content = chunk.content.slice(0, Math.min(available, 2500))
          totalLength += content.length
          return `// === ${chunk.source} ===\n${content}`
        }).filter(Boolean).join('\n\n')
        
        return NextResponse.json({
          success: true,
          dna,
          sources: selected.map(s => s.source),
          totalLength,
          categories: cats
        })
      }
      
      case 'analyze': {
        // Analyze repository structure
        const analysis = {
          branches: [],
          components: {},
          fileTypes: {},
          totalFiles: 0
        }
        
        for (const branchInfo of BRANCHES) {
          const treeUrl = `${GITHUB_API}/repos/craighckby-stack/Test-1/git/trees/${branchInfo.name}?recursive=1`
          const treeRes = await fetch(treeUrl, {
            headers: { Authorization: `token ${GITHUB_TOKEN}` }
          })
          
          if (!treeRes.ok) continue
          
          const tree = await treeRes.json()
          const files = tree.tree?.filter((f: { type: string }) => f.type === 'blob') || []
          
          analysis.branches.push({
            name: branchInfo.name,
            fileCount: files.length,
            description: branchInfo.description
          })
          
          analysis.totalFiles += files.length
          
          // Analyze components
          for (const file of files) {
            const path = file.path as string
            const ext = '.' + path.split('.').pop()
            
            // Count file types
            analysis.fileTypes[ext] = (analysis.fileTypes[ext] || 0) + 1
            
            // Identify components
            const { category } = categorizeFile(path)
            analysis.components[category] = (analysis.components[category] || 0) + 1
          }
        }
        
        return NextResponse.json({
          success: true,
          analysis
        })
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

// Helper function to log
function log(msg: string) {
  console.log(`[DNA] ${msg}`)
}

// Ingest from a specific branch
async function ingestBranch(branch: string, limit: number) {
  const treeUrl = `${GITHUB_API}/repos/craighckby-stack/Test-1/git/trees/${branch}?recursive=1`
  const treeRes = await fetch(treeUrl, {
    headers: { Authorization: `token ${GITHUB_TOKEN}` }
  })
  
  if (!treeRes.ok) {
    return { total: 0, processed: 0, stored: 0, errors: 1, skipped: 0, error: 'Failed to fetch tree' }
  }
  
  const tree = await treeRes.json()
  
  // Filter files by extension and categorize
  const files = tree.tree?.filter((f: { type: string; path: string }) => {
    if (f.type !== 'blob') return false
    const ext = '.' + f.path.split('.').pop()?.toLowerCase()
    return CODE_EXTENSIONS.includes(ext) || 
           CONFIG_EXTENSIONS.includes(ext) || 
           DOC_EXTENSIONS.includes(ext)
  }) || []
  
  // Sort by priority
  const sortedFiles = files.map((f: { path: string }) => {
    const { category, priority } = categorizeFile(f.path)
    return { ...f, category, priority }
  }).sort((a: { priority: number }, b: { priority: number }) => b.priority - a.priority)
  
  log(`Found ${files.length} files in ${branch}, processing ${Math.min(files.length, limit)}`)
  
  let processed = 0
  let stored = 0
  let errors = 0
  let skipped = 0
  
  const batchSize = 5
  const toProcess = sortedFiles.slice(0, limit)
  
  for (let i = 0; i < toProcess.length; i += batchSize) {
    const batch = toProcess.slice(i, i + batchSize)
    
    for (const file of batch) {
      try {
        // Check if already exists (by path across all branches)
        const existing = await db.dnaChunk.findFirst({
          where: { hash: `${branch}/${file.path}` }
        })
        
        if (existing) {
          skipped++
          processed++
          continue
        }
        
        // Fetch file content
        const contentUrl = `${GITHUB_API}/repos/craighckby-stack/Test-1/contents/${file.path}?ref=${branch}`
        const contentRes = await fetch(contentUrl, {
          headers: { Authorization: `token ${GITHUB_TOKEN}` }
        })
        
        if (!contentRes.ok) {
          errors++
          continue
        }
        
        const content = await contentRes.json()
        
        if (!content.content) {
          errors++
          continue
        }
        
        // Decode base64
        const decoded = Buffer.from(content.content.replace(/\s/g, ''), 'base64').toString('utf-8')
        
        // Skip very small or very large files
        if (decoded.length < 50 || decoded.length > 100000) {
          skipped++
          processed++
          continue
        }
        
        const { category } = file
        
        // Store in database
        await db.dnaChunk.create({
          data: {
            content: decoded.slice(0, 50000),
            tags: `${category},${file.path.split('.').pop()},${branch}`,
            source: `Test-1/${branch}/${file.path}`,
            hash: `${branch}/${file.path}`,
            wordCount: decoded.split(/\s+/).length
          }
        })
        
        stored++
        processed++
        
      } catch (e) {
        errors++
      }
    }
    
    // Rate limiting
    await new Promise(r => setTimeout(r, 150))
  }
  
  log(`Branch ${branch}: stored ${stored}, skipped ${skipped}, errors ${errors}`)
  
  return {
    total: files.length,
    processed,
    stored,
    errors,
    skipped
  }
}

export async function GET() {
  const total = await db.dnaChunk.count()
  
  // Get counts by category
  const categories = ['kernel', 'engine', 'governance', 'agent', 'service', 'protocol', 'config', 'utility', 'doc']
  const counts: Record<string, number> = {}
  
  for (const cat of categories) {
    counts[cat] = await db.dnaChunk.count({
      where: { tags: { contains: cat } }
    })
  }
  
  // Get branches ingested
  const sources = await db.dnaChunk.groupBy({
    by: ['source'],
    _count: true
  })
  
  const branches = new Set(
    sources.map(s => s.source.split('/')[1])
  )
  
  return NextResponse.json({
    success: true,
    stats: {
      total,
      categories: counts,
      branchesIngested: Array.from(branches),
      sourcesCount: sources.length
    }
  })
}
