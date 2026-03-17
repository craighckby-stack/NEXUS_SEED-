'use client'

import { useState, useEffect, useCallback } from 'react'

// =============================================================================
// NEXUS AGI UNIFIED DNA SYSTEM v8.0
// All branches, all components, unified evolution
// =============================================================================

interface DnaStats {
  total: number
  categories: Record<string, number>
  branchesIngested: string[]
  sourcesCount: number
}

interface BranchResult {
  branch: string
  total: number
  processed: number
  stored: number
  errors: number
  skipped: number
}

interface Analysis {
  branches: { name: string; fileCount: number; description: string }[]
  components: Record<string, number>
  fileTypes: Record<string, number>
  totalFiles: number
}

export function useDnaSystem() {
  const [stats, setStats] = useState<DnaStats | null>(null)
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [ingesting, setIngesting] = useState(false)
  const [ingestionResults, setIngestionResults] = useState<BranchResult[] | null>(null)
  const [logs, setLogs] = useState<string[]>([])
  
  const log = useCallback((msg: string) => {
    const time = new Date().toLocaleTimeString()
    setLogs(prev => [...prev.slice(-100), `[${time}] ${msg}`])
  }, [])
  
  // Fetch DNA stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/agi/dna')
      const data = await res.json()
      if (data.success) {
        setStats(data.stats)
      }
    } catch (e) {
      log(`Failed to fetch stats: ${e}`)
    }
  }, [log])
  
  // Analyze repository
  const analyzeRepo = useCallback(async () => {
    setLoading(true)
    log('Analyzing Test-1 repository structure...')
    
    try {
      const res = await fetch('/api/agi/dna', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'analyze' })
      })
      
      const data = await res.json()
      
      if (data.success) {
        setAnalysis(data.analysis)
        log(`Analysis complete: ${data.analysis.totalFiles} files across ${data.analysis.branches.length} branches`)
        
        // Log component breakdown
        for (const [cat, count] of Object.entries(data.analysis.components)) {
          log(`  ${cat}: ${count} files`)
        }
      }
    } catch (e) {
      log(`Analysis failed: ${e}`)
    }
    
    setLoading(false)
  }, [log])
  
  // Ingest all branches
  const ingestAll = useCallback(async (limitPerBranch = 500) => {
    setIngesting(true)
    setIngestionResults(null)
    log('Starting unified DNA ingestion from ALL branches...')
    log('Branches: main, System, Nexus-Database, sovereign-v90-optimizations')
    
    try {
      const res = await fetch('/api/agi/dna', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'ingestAll',
          limit: limitPerBranch
        })
      })
      
      const data = await res.json()
      
      if (data.success) {
        setIngestionResults(data.summary.branches)
        log('=== INGESTION COMPLETE ===')
        log(`Total stored: ${data.summary.total.stored}`)
        log(`Total processed: ${data.summary.total.processed}`)
        log(`Total errors: ${data.summary.total.errors}`)
        log(`Total skipped: ${data.summary.total.skipped}`)
        
        await fetchStats()
      } else {
        log(`Ingestion failed: ${data.error}`)
      }
    } catch (e) {
      log(`Ingestion error: ${e}`)
    }
    
    setIngesting(false)
  }, [log, fetchStats])
  
  // Get DNA for evolution
  const getDna = useCallback(async (categories = ['engine', 'governance', 'agent', 'kernel']) => {
    try {
      const res = await fetch('/api/agi/dna', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'getDna',
          categories,
          maxChunks: 10,
          maxLength: 10000
        })
      })
      
      const data = await res.json()
      
      if (data.success) {
        return data.dna
      }
    } catch (e) {
      log(`Failed to get DNA: ${e}`)
    }
    
    return ''
  }, [log])
  
  // Clear all DNA
  const clearDna = useCallback(async () => {
    try {
      await fetch('/api/agi/dna', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear' })
      })
      
      log('DNA cleared')
      await fetchStats()
    } catch (e) {
      log(`Failed to clear: ${e}`)
    }
  }, [log, fetchStats])
  
  // Search DNA
  const searchDna = useCallback(async (query: string, category?: string) => {
    try {
      const res = await fetch('/api/agi/dna', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'search',
          query,
          category,
          limit: 20
        })
      })
      
      const data = await res.json()
      
      if (data.success) {
        return data.results
      }
    } catch (e) {
      log(`Search failed: ${e}`)
    }
    
    return []
  }, [log])
  
  // Initial load - only once on mount
  useEffect(() => {
    // Use a flag to prevent multiple calls
    let mounted = true
    
    const init = async () => {
      if (!mounted) return
      await fetchStats()
      if (!mounted) return
      await analyzeRepo()
    }
    
    init()
    
    return () => {
      mounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run once on mount
  
  return {
    stats,
    analysis,
    loading,
    ingesting,
    ingestionResults,
    logs,
    fetchStats,
    analyzeRepo,
    ingestAll,
    getDna,
    clearDna,
    searchDna
  }
}

// DNA Panel Component
export function DnaPanel({ 
  stats, 
  analysis, 
  ingesting, 
  onIngest, 
  onClear,
  logs 
}: { 
  stats: DnaStats | null
  analysis: Analysis | null
  ingesting: boolean
  onIngest: () => void
  onClear: () => void
  logs: string[]
}) {
  return (
    <div className="bg-black/50 border border-cyan-900/30 rounded p-3 space-y-3">
      <div className="text-xs text-cyan-600 font-bold">◈ UNIFIED DNA POOL</div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-5 gap-1 text-xs">
        <div className="text-center bg-cyan-950/30 rounded p-1">
          <div className="text-cyan-400 font-bold text-lg">{stats?.total || 0}</div>
          <div className="text-cyan-700">TOTAL</div>
        </div>
        <div className="text-center bg-red-950/30 rounded p-1">
          <div className="text-red-400 font-bold text-lg">{stats?.categories.kernel || 0}</div>
          <div className="text-red-700">KERNEL</div>
        </div>
        <div className="text-center bg-amber-950/30 rounded p-1">
          <div className="text-amber-400 font-bold text-lg">{stats?.categories.engine || 0}</div>
          <div className="text-amber-700">ENGINE</div>
        </div>
        <div className="text-center bg-purple-950/30 rounded p-1">
          <div className="text-purple-400 font-bold text-lg">{stats?.categories.governance || 0}</div>
          <div className="text-purple-700">GOV</div>
        </div>
        <div className="text-center bg-green-950/30 rounded p-1">
          <div className="text-green-400 font-bold text-lg">{stats?.categories.agent || 0}</div>
          <div className="text-green-700">AGENT</div>
        </div>
      </div>
      
      {/* Branches */}
      {analysis && (
        <div className="text-xs">
          <div className="text-cyan-700 mb-1">REPOSITORY ANALYSIS:</div>
          <div className="grid grid-cols-4 gap-1">
            {analysis.branches.map(b => (
              <div key={b.name} className="bg-black/30 rounded p-1 text-center">
                <div className="text-green-400">{b.fileCount}</div>
                <div className="text-green-700 truncate">{b.name}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Component Breakdown */}
      {analysis && (
        <div className="text-xs">
          <div className="text-cyan-700 mb-1">COMPONENTS:</div>
          <div className="flex flex-wrap gap-1">
            {Object.entries(analysis.components)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 10)
              .map(([cat, count]) => (
                <span key={cat} className="bg-cyan-950/30 text-cyan-400 px-2 py-0.5 rounded">
                  {cat}: {count}
                </span>
              ))}
          </div>
        </div>
      )}
      
      {/* Actions */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={onIngest}
          disabled={ingesting}
          className={`py-2 rounded font-bold text-xs ${
            ingesting 
              ? 'bg-cyan-900/50 text-cyan-700 cursor-wait' 
              : 'bg-gradient-to-r from-cyan-600 to-purple-600 text-white hover:from-cyan-500 hover:to-purple-500'
          }`}
        >
          {ingesting ? '⏳ INGESTING ALL...' : '⬡ INGEST ALL BRANCHES'}
        </button>
        
        <button
          onClick={onClear}
          disabled={ingesting}
          className="py-2 rounded font-bold text-xs bg-red-900/50 text-red-400 hover:bg-red-800/50 disabled:opacity-50"
        >
          ✗ CLEAR DNA
        </button>
      </div>
      
      {/* Mini Logs */}
      {logs.length > 0 && (
        <div className="text-xs">
          <div className="text-cyan-700 mb-1">INGESTION LOG:</div>
          <div className="h-20 overflow-y-auto bg-black/30 rounded p-1 font-mono">
            {logs.slice(-10).map((l, i) => (
              <div key={i} className="text-cyan-500">{l}</div>
            ))}
          </div>
        </div>
      )}
      
      {/* Branches Ingested */}
      {stats?.branchesIngested && stats.branchesIngested.length > 0 && (
        <div className="text-xs">
          <div className="text-cyan-700 mb-1">INGESTED FROM:</div>
          <div className="flex flex-wrap gap-1">
            {stats.branchesIngested.map(b => (
              <span key={b} className="bg-green-950/30 text-green-400 px-2 py-0.5 rounded">
                ✓ {b}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
