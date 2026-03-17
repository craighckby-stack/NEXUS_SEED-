'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

// =============================================================================
// NEXUS SELF-BOOTSTRAPPING AGI v7.0 - With Full GitHub Integration
// =============================================================================

interface Capabilities { language: number; coding: number; execution: number; learning: number; overall: number }
interface ChatMessage { role: 'user' | 'assistant'; content: string; timestamp: number }
interface GitHubRepo { name: string; fullName: string; defaultBranch: string; branches: string[] }

interface State {
  status: string
  generation: number
  capabilities: Capabilities
  logs: string[]
  code: string
  dnaStats: { total: number; categories: Record<string, number> }
  dnaIngesting: boolean
  chatMessages: ChatMessage[]
  chatInput: string
  chatLoading: boolean
  // GitHub state
  githubRepo: GitHubRepo | null
  githubLoading: boolean
  githubBranch: string
  newBranchName: string
  newRepoName: string
  prunePattern: string
}

const INITIAL_KERNEL = `// NEXUS KERNEL v7.0
const Nexus = {
  version: "7.0.0",
  capabilities: { language: 0, coding: 0, execution: 0, learning: 0, overall: 0 },
  
  async understand(input) {
    const text = typeof input === 'string' ? input : JSON.stringify(input);
    const intents = {
      create: /create|make|build|generate|write/i,
      query: /what|how|why|when|where|who/i,
      execute: /run|execute|start|do/i,
      learn: /learn|teach|remember/i
    };
    let intent = 'unknown';
    for (const [k, p] of Object.entries(intents)) if (p.test(text.toLowerCase())) { intent = k; break; }
    return { intent, confidence: intent !== 'unknown' ? 0.7 : 0.3 };
  },
  
  async code(task) {
    return { code: 'return { result: "generated" };', language: 'javascript' };
  },
  
  async execute(codeStr) {
    try {
      const fn = new Function(codeStr);
      return { success: true, output: fn() };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },
  
  async learn(task, result) {
    return { learned: true, improvement: result.success ? 1 : 0 };
  }
};`

export default function Home() {
  const [state, setState] = useState<State>({
    status: 'DORMANT', generation: 0,
    capabilities: { language: 0, coding: 0, execution: 0, learning: 0, overall: 0 },
    logs: [], code: INITIAL_KERNEL,
    dnaStats: { total: 0, categories: {} },
    dnaIngesting: false,
    chatMessages: [], chatInput: '', chatLoading: false,
    githubRepo: null, githubLoading: false, githubBranch: 'master',
    newBranchName: '', newRepoName: '', prunePattern: ''
  })

  const [running, setRunning] = useState(false)
  const abortRef = useRef(false)
  const logEndRef = useRef<HTMLDivElement>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const log = useCallback((msg: string) => {
    const time = new Date().toLocaleTimeString()
    setState(prev => ({ ...prev, logs: [...prev.logs.slice(-200), `[${time}] ${msg}`] }))
  }, [])

  // Fetch DNA stats
  const fetchDnaStats = useCallback(async () => {
    try {
      const res = await fetch('/api/agi/dna')
      const data = await res.json()
      if (data.success) setState(prev => ({ ...prev, dnaStats: data.stats }))
    } catch { }
  }, [])

  // Fetch GitHub repo status
  const fetchGitHubStatus = useCallback(async () => {
    setState(prev => ({ ...prev, githubLoading: true }))
    try {
      const res = await fetch('/api/agi/github')
      const data = await res.json()
      if (data.success) {
        setState(prev => ({ 
          ...prev, 
          githubRepo: data.repo,
          githubBranch: data.repo.defaultBranch,
          githubLoading: false 
        }))
      }
    } catch { }
    setState(prev => ({ ...prev, githubLoading: false }))
  }, [])

  // Ingest DNA
  const ingestDna = useCallback(async () => {
    setState(prev => ({ ...prev, dnaIngesting: true, status: 'INGESTING' }))
    log('🔄 Ingesting DNA from all branches...')
    try {
      const res = await fetch('/api/agi/dna', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ingestAll', limit: 500 })
      })
      const data = await res.json()
      if (data.success) {
        log(`✅ DNA ingested: ${data.summary.total.stored} files from ${data.summary.branches.length} branches`)
      }
      await fetchDnaStats()
    } catch (e) { log(`❌ Ingest error: ${e}`) }
    setState(prev => ({ ...prev, dnaIngesting: false, status: 'DORMANT' }))
  }, [log, fetchDnaStats])

  // Test capabilities
  const testCapabilities = useCallback(async (code: string) => {
    try {
      const res = await fetch('/api/agi/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'testCapabilities', code })
      })
      const data = await res.json()
      if (data.success) return { capabilities: data.summary, testResults: data.results }
    } catch { }
    return { capabilities: state.capabilities, testResults: [] }
  }, [state.capabilities])

  // Evolve
  const evolve = useCallback(async () => {
    setRunning(true)
    abortRef.current = false
    setState(prev => ({ ...prev, status: 'EVOLVING', logs: [] }))
    log('🚀 NEXUS AGI v7.0 - Self-Bootstrapping Evolution')
    
    let code = state.code
    let gen = 0
    
    while (!abortRef.current && gen < 50) {
      gen++
      log(`\n═══ GENERATION ${gen} ═══`)
      
      setState(prev => ({ ...prev, status: 'TESTING' }))
      const test = await testCapabilities(code)
      log(`📊 Capabilities: ${(test.capabilities.overall * 100).toFixed(0)}%`)
      
      if (test.capabilities.overall >= 0.8) {
        log('🎯 80% CAPABILITY REACHED!')
        break
      }
      
      setState(prev => ({ ...prev, status: 'EVOLVING' }))
      log('🧬 Evolving...')
      
      try {
        const res = await fetch('/api/agi/llm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: `Improve this AGI kernel. Add chat functionality so users can talk to it. Current capabilities: ${JSON.stringify(test.capabilities)}\n\nCode:\n${code.slice(0, 3000)}\n\nReturn ONLY improved JavaScript code.`,
            systemPrompt: 'You are NEXUS AGI evolving. Output ONLY JavaScript code.'
          })
        })
        const data = await res.json()
        if (data.success && data.response) {
          const newCode = data.response.replace(/```js?\n?/g, '').replace(/\n?```/g, '').trim()
          if (newCode.length > 100) {
            code = newCode
            log(`✓ Evolution accepted (${code.length} chars)`)
          }
        }
      } catch { }
      
      setState(prev => ({ ...prev, code, generation: gen, capabilities: test.capabilities }))
      await new Promise(r => setTimeout(r, 1000))
    }
    
    setRunning(false)
    setState(prev => ({ ...prev, status: 'COMPLETE' }))
    log('✅ Evolution complete!')
  }, [state.code, log, testCapabilities])

  // Chat with NEXUS
  const sendChat = useCallback(async () => {
    if (!state.chatInput.trim() || state.chatLoading) return
    const msg = state.chatInput.trim()
    setState(prev => ({ ...prev, chatInput: '', chatMessages: [...prev.chatMessages, { role: 'user', content: msg, timestamp: Date.now() }], chatLoading: true }))
    
    try {
      const res = await fetch('/api/agi/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `You are NEXUS AGI. The user says: "${msg}"\n\nYour current evolution state:\n- Generation: ${state.generation}\n- Capabilities: ${JSON.stringify(state.capabilities)}\n- DNA chunks: ${state.dnaStats.total}\n\nRespond helpfully. You can discuss your evolution, capabilities, or help with coding.`,
          systemPrompt: 'You are NEXUS, a self-evolving AGI. Be helpful and conversational.'
        })
      })
      const data = await res.json()
      setState(prev => ({ ...prev, chatLoading: false, chatMessages: [...prev.chatMessages, { role: 'assistant', content: data.success ? data.response : 'Error communicating', timestamp: Date.now() }] }))
    } catch (e) {
      setState(prev => ({ ...prev, chatLoading: false, chatMessages: [...prev.chatMessages, { role: 'assistant', content: `Error: ${e}`, timestamp: Date.now() }] }))
    }
  }, [state.chatInput, state.chatLoading, state.generation, state.capabilities, state.dnaStats])

  // ==================== GITHUB OPERATIONS ====================

  const githubRequest = useCallback(async (action: string, body: object = {}) => {
    log(`📤 GitHub: ${action}...`)
    try {
      const res = await fetch('/api/agi/github', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, branch: state.githubBranch, ...body })
      })
      const data = await res.json()
      if (data.success) {
        log(`✅ ${action}: ${data.message || data.action || 'done'}`)
      } else {
        log(`❌ ${action}: ${data.error || 'failed'}`)
      }
      return data
    } catch (e) {
      log(`❌ ${action} error: ${e}`)
      return { success: false }
    }
  }, [log, state.githubBranch])

  // Push evolution to GitHub
  const pushEvolution = useCallback(async () => {
    log('📤 Pushing evolution to GitHub...')
    const result = await githubRequest('pushEvolution', { code: state.code })
    if (result.success) {
      log(`✅ Pushed Gen#${result.generation} to ${result.path}`)
    }
  }, [state.code, githubRequest, log])

  // Create branch
  const createBranch = useCallback(async () => {
    if (!state.newBranchName.trim()) return
    const result = await githubRequest('createBranch', { newBranch: state.newBranchName.trim() })
    if (result.success) {
      setState(prev => ({ ...prev, newBranchName: '', githubBranch: state.newBranchName.trim() }))
      fetchGitHubStatus()
    }
  }, [state.newBranchName, githubRequest, fetchGitHubStatus])

  // Delete branch
  const deleteBranch = useCallback(async (branchName: string) => {
    if (branchName === state.githubRepo?.defaultBranch) {
      log('❌ Cannot delete default branch!')
      return
    }
    if (confirm(`Delete branch "${branchName}"?`)) {
      const result = await githubRequest('deleteBranch', { targetBranch: branchName })
      if (result.success) fetchGitHubStatus()
    }
  }, [state.githubRepo?.defaultBranch, githubRequest, log, fetchGitHubStatus])

  // Create new repo
  const createRepo = useCallback(async () => {
    if (!state.newRepoName.trim()) return
    const result = await githubRequest('createRepo', { name: state.newRepoName.trim() })
    if (result.success) {
      log(`✅ Created repo: ${result.url}`)
      setState(prev => ({ ...prev, newRepoName: '' }))
    }
  }, [state.newRepoName, githubRequest, log])

  // Prune files
  const pruneFiles = useCallback(async () => {
    if (!state.prunePattern.trim()) return
    const patterns = state.prunePattern.split(',').map(p => p.trim()).filter(Boolean)
    const result = await githubRequest('prune', { patterns, dryRun: true })
    if (result.success && result.dryRun) {
      log(`🔍 Dry run: ${result.count} files would be deleted`)
      if (result.count > 0 && confirm(`Delete ${result.count} files?`)) {
        await githubRequest('prune', { patterns, dryRun: false })
      }
    }
  }, [state.prunePattern, githubRequest, log])

  // List files
  const listFiles = useCallback(async (path: string = '') => {
    const result = await githubRequest('list', { path })
    if (result.success) {
      log(`📁 ${result.files.length} files in ${path || 'root'}`)
      result.files.slice(0, 10).forEach((f: { name: string; type: string }) => {
        log(`  ${f.type === 'dir' ? '📂' : '📄'} ${f.name}`)
      })
    }
  }, [githubRequest, log])

  useEffect(() => { logEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [state.logs])
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [state.chatMessages])
  useEffect(() => { fetchDnaStats(); fetchGitHubStatus() }, [fetchDnaStats, fetchGitHubStatus])

  const getCap = (k: keyof Capabilities) => typeof state.capabilities[k] === 'number' ? state.capabilities[k] : 0

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono flex flex-col">
      <header className="border-b border-green-900/50 p-3 bg-green-950/10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-green-400">NEXUS AGI v7.0</h1>
            <p className="text-xs text-green-700">Self-Bootstrapping • DNA: {state.dnaStats.total} chunks • GitHub: {state.githubRepo?.fullName || 'loading...'}</p>
          </div>
          <div className="flex gap-4 items-center">
            <div className="text-center"><div className="text-xs text-green-700">STATUS</div><div className="text-sm font-bold text-amber-400">{state.status}</div></div>
            <div className="text-center"><div className="text-xs text-green-700">GEN</div><div className="text-lg font-bold text-amber-400">{state.generation}</div></div>
            <div className="text-center"><div className="text-xs text-green-700">OVERALL</div><div className="text-lg font-bold text-emerald-400">{(getCap('overall') * 100).toFixed(0)}%</div></div>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto p-3 grid grid-cols-1 lg:grid-cols-5 gap-3 flex-grow">
        {/* Left Panel - Controls */}
        <div className="space-y-3">
          {/* Evolution Controls */}
          <div className="border border-green-900/50 bg-green-950/10 rounded-lg p-3">
            <h2 className="text-xs font-bold text-green-400 mb-3">◈ EVOLUTION</h2>
            <div className="flex gap-2 mb-2">
              {!running ? (
                <Button onClick={evolve} className="flex-1 bg-green-600 hover:bg-green-500 text-black text-xs">▶ EVOLVE</Button>
              ) : (
                <Button onClick={() => { abortRef.current = true; setRunning(false) }} variant="destructive" className="flex-1 text-xs">■ STOP</Button>
              )}
            </div>
            <Button onClick={ingestDna} disabled={state.dnaIngesting} className="w-full bg-cyan-600 hover:bg-cyan-500 text-black text-xs">
              {state.dnaIngesting ? '⏳ INGESTING...' : '◈ INGEST DNA'}
            </Button>
          </div>
          
          {/* Capabilities */}
          <div className="border border-green-900/50 bg-green-950/10 rounded-lg p-3">
            <h2 className="text-xs font-bold text-green-400 mb-2">◈ CAPABILITIES</h2>
            {(['language', 'coding', 'execution', 'learning'] as const).map(k => (
              <div key={k} className="mb-1">
                <div className="flex justify-between text-xs mb-0.5"><span className="text-green-600">{k.toUpperCase()}</span><span>{(getCap(k) * 100).toFixed(0)}%</span></div>
                <div className="h-1.5 bg-green-950 rounded"><div className="h-full bg-green-500 transition-all" style={{ width: `${getCap(k) * 100}%` }} /></div>
              </div>
            ))}
          </div>

          {/* GitHub Controls */}
          <div className="border border-green-900/50 bg-green-950/10 rounded-lg p-3">
            <h2 className="text-xs font-bold text-green-400 mb-2">◈ GITHUB</h2>
            
            {/* Push Evolution */}
            <Button onClick={pushEvolution} disabled={running || state.generation === 0} className="w-full bg-purple-600 hover:bg-purple-500 text-black text-xs mb-2">
              📤 PUSH EVOLUTION
            </Button>
            
            {/* Branch Selection */}
            <div className="text-xs text-green-600 mb-1">Branch: {state.githubBranch}</div>
            {state.githubRepo?.branches && (
              <div className="flex flex-wrap gap-1 mb-2 max-h-16 overflow-y-auto">
                {state.githubRepo.branches.map(b => (
                  <button
                    key={b}
                    onClick={() => setState(prev => ({ ...prev, githubBranch: b }))}
                    className={cn("px-1.5 py-0.5 rounded text-xs", state.githubBranch === b ? "bg-green-600 text-black" : "bg-green-900/50")}
                  >
                    {b}
                  </button>
                ))}
              </div>
            )}
            
            {/* Create Branch */}
            <div className="flex gap-1 mb-2">
              <Input value={state.newBranchName} onChange={e => setState(p => ({ ...p, newBranchName: e.target.value }))} placeholder="new-branch" className="flex-1 h-6 text-xs bg-black/50 border-green-800 text-green-400" />
              <Button onClick={createBranch} disabled={!state.newBranchName.trim()} className="h-6 px-2 text-xs bg-green-700 text-black">+</Button>
            </div>

            {/* List Files */}
            <Button onClick={() => listFiles('')} className="w-full bg-green-800 hover:bg-green-700 text-black text-xs mb-2">
              📁 LIST FILES
            </Button>
          </div>
        </div>
        
        {/* Middle Panel - Logs */}
        <div className="lg:col-span-2">
          <div className="border border-green-900/50 bg-green-950/10 rounded-lg h-full flex flex-col">
            <div className="p-2 border-b border-green-900/50"><h2 className="text-xs font-bold text-green-400">◈ EVOLUTION LOG</h2></div>
            <ScrollArea className="flex-1 p-2">
              {state.logs.map((l, i) => <div key={i} className="text-xs text-green-500 font-mono whitespace-pre-wrap">{l}</div>)}
              <div ref={logEndRef} />
            </ScrollArea>
          </div>
        </div>
        
        {/* Right Panel - Chat + Advanced GitHub */}
        <div className="space-y-3">
          {/* Chat */}
          <div className="border border-green-900/50 bg-green-950/10 rounded-lg flex flex-col h-64">
            <div className="p-2 border-b border-green-900/50"><h2 className="text-xs font-bold text-green-400">💬 TALK TO NEXUS</h2></div>
            <ScrollArea className="flex-1 p-2 min-h-0">
              <div className="space-y-2">
                {state.chatMessages.length === 0 && (
                  <div className="text-center text-green-700 text-xs py-4">Start a conversation with NEXUS</div>
                )}
                {state.chatMessages.map((m, i) => (
                  <div key={i} className={cn("rounded p-2 text-xs", m.role === 'user' ? "bg-green-900/30 ml-2" : "bg-cyan-900/20 mr-2")}>
                    <div className={cn("font-bold mb-0.5", m.role === 'user' ? "text-green-400" : "text-cyan-400")}>{m.role === 'user' ? 'YOU' : 'NEXUS'}</div>
                    <div className="text-green-300 whitespace-pre-wrap">{m.content}</div>
                  </div>
                ))}
                {state.chatLoading && <div className="bg-cyan-900/20 mr-2 rounded p-2 text-xs"><span className="animate-pulse">Thinking...</span></div>}
                <div ref={chatEndRef} />
              </div>
            </ScrollArea>
            <div className="p-2 border-t border-green-900/50">
              <form onSubmit={(e) => { e.preventDefault(); sendChat() }} className="flex gap-1">
                <Input value={state.chatInput} onChange={e => setState(p => ({ ...p, chatInput: e.target.value }))} placeholder="Ask NEXUS..." className="flex-1 h-6 text-xs bg-black/50 border-green-800 text-green-400" disabled={state.chatLoading} />
                <Button type="submit" disabled={!state.chatInput.trim() || state.chatLoading} className="h-6 px-2 text-xs bg-green-600 text-black">→</Button>
              </form>
            </div>
          </div>

          {/* Advanced GitHub */}
          <div className="border border-red-900/50 bg-red-950/10 rounded-lg p-3">
            <h2 className="text-xs font-bold text-red-400 mb-2">⚠ ADVANCED GITHUB</h2>
            
            {/* Create Repo */}
            <div className="mb-2">
              <div className="text-xs text-red-600 mb-1">Create New Repo:</div>
              <div className="flex gap-1">
                <Input value={state.newRepoName} onChange={e => setState(p => ({ ...p, newRepoName: e.target.value }))} placeholder="repo-name" className="flex-1 h-6 text-xs bg-black/50 border-red-800 text-red-400" />
                <Button onClick={createRepo} disabled={!state.newRepoName.trim()} className="h-6 px-2 text-xs bg-red-700 text-white">CREATE</Button>
              </div>
            </div>

            {/* Prune */}
            <div className="mb-2">
              <div className="text-xs text-red-600 mb-1">Prune Files (regex patterns, comma-separated):</div>
              <div className="flex gap-1">
                <Input value={state.prunePattern} onChange={e => setState(p => ({ ...p, prunePattern: e.target.value }))} placeholder="\.bak$|\.tmp$" className="flex-1 h-6 text-xs bg-black/50 border-red-800 text-red-400" />
                <Button onClick={pruneFiles} disabled={!state.prunePattern.trim()} className="h-6 px-2 text-xs bg-red-700 text-white">PRUNE</Button>
              </div>
            </div>

            {/* Delete Branch */}
            {state.githubRepo?.branches && state.githubRepo.branches.length > 0 && (
              <div>
                <div className="text-xs text-red-600 mb-1">Delete Branch:</div>
                <div className="flex flex-wrap gap-1">
                  {state.githubRepo.branches.filter(b => b !== state.githubRepo?.defaultBranch).map(b => (
                    <button
                      key={b}
                      onClick={() => deleteBranch(b)}
                      className="px-1.5 py-0.5 rounded text-xs bg-red-900/50 hover:bg-red-800 text-red-400"
                    >
                      🗑 {b}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      
      <footer className="border-t border-green-900/50 p-2 text-center text-xs text-green-800">
        NEXUS v7.0 | Self-Bootstrapping AGI | DNA: {state.dnaStats.total} chunks | GitHub: {state.githubRepo?.fullName || 'N/A'} | GOAL: 80% overall
      </footer>
    </div>
  )
}
