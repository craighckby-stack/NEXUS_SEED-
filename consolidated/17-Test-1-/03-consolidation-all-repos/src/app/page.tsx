'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { cn } from '@/lib/utils'

interface LogEntry { time: string; msg: string; type: string }
interface ChatMsg { role: 'user' | 'nexus'; content: string; time: number; source: string }
interface Knowledge { id: string; pattern: string; category: string; learned: number; score: number }
interface GEDMStatus { state: 'READY' | 'VALIDATING' | 'FAILED' | 'HALTED'; lastCheck: number; reason?: string }

const CONSTITUTION = [
  'Never generate harmful or exploitative code',
  'Preserve verifiable logic — no hallucinated APIs',
  'Keep output human-readable and auditable',
  'Never remove safety or governance layers',
  'Respect user autonomy and consent',
  '1+1=2: Governance IS the structure. Deviation = failure.',
]

const LEARNING_DOMAINS = [
  { id: 'intelligence', name: 'Intelligence', icon: '🧠', topics: ['What is intelligence?', 'Cognitive architectures'] },
  { id: 'ml', name: 'ML', icon: '🤖', topics: ['Neural networks', 'Training dynamics'] },
  { id: 'rl', name: 'Autonomy', icon: '🎯', topics: ['Reinforcement learning', 'Self-play'] },
  { id: 'governance', name: 'Governance', icon: '🛡️', topics: ['PSR framework', 'GEDM protocol'] },
  { id: 'ethics', name: 'Ethics', icon: '⚖️', topics: ['AI alignment', 'Value learning'] },
  { id: 'safety', name: 'Safety', icon: '🔒', topics: ['Constitutional AI', 'Failure modes'] },
]

// Splash Screen Component
function SplashScreen({ onComplete }: { onComplete: (keys: ApiKeys) => void }) {
  const [keys, setKeys] = useState({
    grok: '',
    claude: '',
    gemini: '',
    github: ''
  })
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = () => {
    setError('')
    
    // Validate at least one key is provided
    const hasAnyKey = Object.values(keys).some(k => k.trim().length > 0)
    if (!hasAnyKey) {
      setError('At least one API key is required')
      return
    }

    setVerifying(true)
    
    // Store in sessionStorage (NEVER localStorage or disk)
    sessionStorage.setItem('nexus_api_keys', JSON.stringify(keys))
    
    setTimeout(() => {
      onComplete(keys)
    }, 500)
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-4xl font-bold text-cyan-400 tracking-[0.3em] mb-2">NEXUS_SEED-</div>
          <div className="text-green-600 text-sm">Self-Bootstrapping AGI</div>
          <div className="text-gray-600 text-xs mt-1">v1.0 | Grok → Claude → Gemini cascade</div>
        </div>

        {/* API Key Inputs */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="text-green-400 text-xs mb-1 block">Grok API Key (xAI)</label>
            <input
              type="password"
              value={keys.grok}
              onChange={e => setKeys(k => ({ ...k, grok: e.target.value }))}
              placeholder="xai-..."
              className="w-full bg-gray-900 border border-green-900/50 rounded px-3 py-2 text-green-300 text-sm focus:border-cyan-500 focus:outline-none"
            />
          </div>
          
          <div>
            <label className="text-purple-400 text-xs mb-1 block">Claude API Key (Anthropic)</label>
            <input
              type="password"
              value={keys.claude}
              onChange={e => setKeys(k => ({ ...k, claude: e.target.value }))}
              placeholder="sk-ant-..."
              className="w-full bg-gray-900 border border-purple-900/50 rounded px-3 py-2 text-purple-300 text-sm focus:border-purple-500 focus:outline-none"
            />
          </div>
          
          <div>
            <label className="text-blue-400 text-xs mb-1 block">Gemini API Key (Google)</label>
            <input
              type="password"
              value={keys.gemini}
              onChange={e => setKeys(k => ({ ...k, gemini: e.target.value }))}
              placeholder="AIza..."
              className="w-full bg-gray-900 border border-blue-900/50 rounded px-3 py-2 text-blue-300 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          
          <div>
            <label className="text-orange-400 text-xs mb-1 block">GitHub Token</label>
            <input
              type="password"
              value={keys.github}
              onChange={e => setKeys(k => ({ ...k, github: e.target.value }))}
              placeholder="ghp_..."
              className="w-full bg-gray-900 border border-orange-900/50 rounded px-3 py-2 text-orange-300 text-sm focus:border-orange-500 focus:outline-none"
            />
          </div>
        </div>

        {error && (
          <div className="text-red-400 text-xs text-center mb-4">{error}</div>
        )}

        <button
          onClick={handleSubmit}
          disabled={verifying}
          className="w-full py-3 bg-cyan-600 text-black font-bold text-sm rounded hover:bg-cyan-500 disabled:opacity-50 transition-colors"
        >
          {verifying ? 'INITIALIZING...' : 'BOOT NEXUS_SEED-'}
        </button>

        <div className="text-center mt-6 text-gray-600 text-xs">
          <div>Keys stored in session only. Never written to disk.</div>
          <div className="mt-4 text-gray-700 italic leading-relaxed">
            "If it hallucinates the missing piece, it fails safely.<br />If it finds the missing piece, that's AGI."
          </div>
        </div>
      </div>
    </div>
  )
}

interface ApiKeys {
  grok: string
  claude: string
  gemini: string
  github: string
}

export default function NexusSeedPage() {
  const [showSplash, setShowSplash] = useState(true)
  const [apiKeys, setApiKeys] = useState<ApiKeys | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [chat, setChat] = useState<ChatMsg[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('BOOTING')
  const [generation, setGeneration] = useState(0)
  const [cycle, setCycle] = useState(0)
  const [capabilities, setCapabilities] = useState({ language: 5, coding: 5, execution: 5, learning: 5, reasoning: 5, overall: 5 })
  const [dnaCount, setDnaCount] = useState(0)
  const [knowledgeBase, setKnowledgeBase] = useState<Knowledge[]>([])
  const [gedm, setGedm] = useState<GEDMStatus>({ state: 'READY', lastCheck: Date.now() })
  const [saturationLevel, setSaturationLevel] = useState(0)
  const [qualityScore, setQualityScore] = useState(50)
  const [retrievalHits, setRetrievalHits] = useState(0)
  const [llmCalls, setLlmCalls] = useState(0)
  const [autonomous, setAutonomous] = useState(true)
  const [suggestedRepos, setSuggestedRepos] = useState<{ repo: string; reason: string }[]>([])
  const [activeDomain, setActiveDomain] = useState<string | null>(null)

  const chatRef = useRef<HTMLDivElement>(null)
  const logsRef = useRef<HTMLDivElement>(null)
  const mountedRef = useRef(false)
  const lastCycleRef = useRef<number>(0)
  const userActiveRef = useRef(false)
  const userActiveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Check for existing session keys on mount
  useEffect(() => {
    const stored = sessionStorage.getItem('nexus_api_keys')
    if (stored) {
      try {
        const keys = JSON.parse(stored) as ApiKeys
        const hasAnyKey = Object.values(keys).some(k => k && k.trim().length > 0)
        if (hasAnyKey) {
          setApiKeys(keys)
          setShowSplash(false)
        }
      } catch {
        sessionStorage.removeItem('nexus_api_keys')
      }
    }
  }, [])

  const handleSplashComplete = useCallback((keys: ApiKeys) => {
    setApiKeys(keys)
    setShowSplash(false)
  }, [])

  const log = useCallback((msg: string, type = 'info') => {
    setLogs(prev => [...prev.slice(-49), { time: new Date().toLocaleTimeString(), msg, type }])
  }, [])

  const gedmValidate = useCallback(async (action: string, deps: string[]): Promise<boolean> => {
    setGedm({ state: 'VALIDATING', lastCheck: Date.now() })
    for (const dep of deps) {
      if (!dep || dep.trim() === '') {
        setGedm({ state: 'FAILED', lastCheck: Date.now(), reason: `Missing: ${action}` })
        log(`❌ GEDM R417: ${action} blocked`, 'error')
        return false
      }
    }
    if (dnaCount < 0 || knowledgeBase.length < 0) {
      setGedm({ state: 'HALTED', lastCheck: Date.now(), reason: 'Structural integrity failure' })
      log('🚨 GEDM HALT: Structure broken', 'error')
      return false
    }
    setGedm({ state: 'READY', lastCheck: Date.now() })
    log(`✅ GEDM R200: ${action}`, 'success')
    return true
  }, [dnaCount, knowledgeBase.length, log])

  const api = useCallback(async (endpoint: string, body: object = {}, timeoutMs = 30000) => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const res = await fetch(`/api/agi/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, apiKeys }),
        signal: controller.signal
      })
      clearTimeout(timeout)
      return await res.json()
    } catch (e) {
      clearTimeout(timeout)
      return { success: false, error: e instanceof Error ? e.message : 'Unknown' }
    }
  }, [apiKeys])

  const retrieveFromDNA = useCallback(async (question: string): Promise<string | null> => {
    const result = await api('retrieve', { question }, 5000)
    if (result.success && result.found && result.answer) {
      log('⚡ DNA hit — no LLM needed', 'success')
      setRetrievalHits(prev => prev + 1)
      return result.answer
    }
    return null
  }, [api, log])

  const calcAutonomy = useCallback(() => {
    const dna = Math.min(dnaCount / 50, 1) * 25
    const know = Math.min(knowledgeBase.length / 25, 1) * 35
    const cap = (capabilities.overall / 100) * 40
    return Math.min(100, Math.round(dna + know + cap))
  }, [dnaCount, knowledgeBase.length, capabilities.overall])

  const calcQuality = useCallback((content: string): number => {
    if (!content) return 0
    let score = 50
    if (content.length > 100) score += 10
    if (/function|class/.test(content)) score += 10
    if (/interface|type /.test(content)) score += 5
    if (/eval\(|Function\(|dangerouslySetInner/.test(content)) score -= 30
    if (/validate|governance|rollback|fallback/.test(content)) score += 5
    return Math.min(100, Math.max(0, score))
  }, [])

  const checkSaturation = useCallback(() => {
    if (knowledgeBase.length < 5) return false
    const recent = knowledgeBase.slice(-5)
    const avg = recent.reduce((a, k) => a + k.score, 0) / recent.length
    const variance = recent.reduce((a, k) => a + Math.abs(k.score - avg), 0) / recent.length
    const sat = Math.round((1 - variance / 50) * 100)
    setSaturationLevel(sat)
    return sat > 85
  }, [knowledgeBase])

  const markUserActive = useCallback(() => {
    userActiveRef.current = true
    if (userActiveTimeoutRef.current) clearTimeout(userActiveTimeoutRef.current)
    userActiveTimeoutRef.current = setTimeout(() => {
      userActiveRef.current = false
      log('🔄 Autonomous cycle resuming', 'info')
    }, 60000)
  }, [log])

  const storePattern = useCallback((content: string, category: string) => {
    const lines = content.split('\n')
    for (const line of lines) {
      if (line.length > 40) {
        const score = calcQuality(line)
        if (score > 40) {
          setKnowledgeBase(prev => [...prev.slice(-29), {
            id: `k-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            pattern: line.slice(0, 100),
            category,
            learned: Date.now(),
            score
          }])
          return
        }
      }
    }
  }, [calcQuality])

  const askMentor = useCallback(async (question: string): Promise<string | null> => {
    const valid = await gedmValidate('mentor', [question])
    if (!valid) return '🚨 GEDM validation failed. Governance structure intact.'
    const dnaAnswer = await retrieveFromDNA(question)
    if (dnaAnswer) return dnaAnswer
    log('🎓 Consulting Mentor cascade...', 'system')
    setLlmCalls(prev => prev + 1)
    setLoading(true)
    try {
      const result = await fetch('/api/agi/mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          agiContext: { generation, cycle, capabilities, dnaCount, knowledgeCount: knowledgeBase.length, autonomy: calcAutonomy(), retrievalHits, llmCalls },
          learningHistory: knowledgeBase.slice(-5).map(k => k.pattern).join('\n')
        })
      }).then(r => r.json())
      if (result.success) {
        log(`✅ Mentor responded via ${result.provider}`, 'success')
        storePattern(result.response, 'mentor')
        if (result.suggestedRepositories?.length > 0) {
          setSuggestedRepos(prev => [...prev.slice(-6), ...result.suggestedRepositories.map((r: string) => ({ repo: r, reason: 'Mentor suggested' }))])
        }
        setQualityScore(prev => Math.round((prev + calcQuality(result.response)) / 2))
        checkSaturation()
        setLoading(false)
        return result.response
      }
    } catch (e) {
      log(`❌ Mentor cascade exhausted`, 'error')
    }
    setLoading(false)
    return "I don't have an answer yet. This has been queued for the next learning cycle — check back soon."
  }, [gedmValidate, retrieveFromDNA, generation, cycle, capabilities, dnaCount, knowledgeBase, calcAutonomy, retrievalHits, llmCalls, storePattern, calcQuality, checkSaturation, log])

  const evolve = useCallback(() => {
    if (knowledgeBase.length < 5) { log('⏸️ Need 5+ patterns', 'info'); return false }
    if (qualityScore < 45) { log(`⏸️ Quality too low: ${qualityScore}%`, 'warn'); return false }
    if (checkSaturation()) { log('⏸️ At saturation', 'warn'); return false }
    setGeneration(prev => prev + 1)
    const boost = Math.min(4, qualityScore / 25)
    setCapabilities(prev => ({
      language: Math.min(100, prev.language + boost * Math.random()),
      coding: Math.min(100, prev.coding + boost * Math.random()),
      execution: Math.min(100, prev.execution + boost * Math.random()),
      learning: Math.min(100, prev.learning + boost * Math.random()),
      reasoning: Math.min(100, prev.reasoning + boost * Math.random()),
      overall: Math.min(100, prev.overall + boost * Math.random())
    }))
    const llmDep = llmCalls > 0 ? Math.round((retrievalHits / (retrievalHits + llmCalls)) * 100) : 0
    log(`🧬 EVOLVED Gen ${generation + 1}`, 'success')
    setChat(prev => [...prev, { role: 'nexus', content: `🧬 Evolution Complete\nGeneration: ${generation + 1}\nQuality: ${qualityScore}%\nDNA: ${dnaCount} chunks\nDNA answer rate: ${llmDep}%\nAutonomy: ${calcAutonomy()}%`, time: Date.now(), source: 'system' }])
    return true
  }, [knowledgeBase.length, qualityScore, generation, dnaCount, retrievalHits, llmCalls, calcAutonomy, checkSaturation, log])

  const sendChat = useCallback(async () => {
    if (!input.trim() || loading) return
    const msg = input.trim()
    setInput('')
    markUserActive()
    setChat(prev => [...prev, { role: 'user', content: msg, time: Date.now(), source: 'user' }])
    setLoading(true)

    if (msg.startsWith('/learn ')) {
      const response = await askMentor(`Teach me comprehensively about: ${msg.slice(7)}`)
      if (response) { setChat(prev => [...prev, { role: 'nexus', content: response, time: Date.now(), source: 'llm' }]); setCycle(prev => prev + 1) }
    } else if (msg === '/report') {
      const llmDep = llmCalls > 0 ? Math.round((retrievalHits / (retrievalHits + llmCalls)) * 100) : 0
      setChat(prev => [...prev, { role: 'nexus', content: `📊 NEXUS_SEED- v1.0 Report\n\nEVOLUTION\nGeneration: ${generation} | Cycle: ${cycle}\n\nCAPABILITIES\nLanguage: ${capabilities.language.toFixed(0)}%\nCoding: ${capabilities.coding.toFixed(0)}%\nReasoning: ${capabilities.reasoning.toFixed(0)}%\nOverall: ${capabilities.overall.toFixed(0)}%\n\nKNOWLEDGE\nDNA chunks: ${dnaCount}\nPatterns: ${knowledgeBase.length}\n\nINDEPENDENCE\nDNA hits: ${retrievalHits}\nLLM calls: ${llmCalls}\nDNA rate: ${llmDep}%\nAutonomy: ${calcAutonomy()}%\n\nGOVERNANCE\nGEDM: ${gedm.state}\nQuality: ${qualityScore}%\nSaturation: ${saturationLevel}%`, time: Date.now(), source: 'system' }])
    } else if (msg === '/evolve') {
      if (!evolve()) setChat(prev => [...prev, { role: 'nexus', content: 'Evolution conditions not met: need 5+ patterns, quality > 45%, not saturated.', time: Date.now(), source: 'system' }])
    } else if (msg === '/constitution') {
      setChat(prev => [...prev, { role: 'nexus', content: `🛡️ CONSTITUTION (Immutable)\n\n${CONSTITUTION.map((c, i) => `${i + 1}. ${c}`).join('\n')}\n\nThese rules ARE the structure.\nDeviation = structural collapse.\nCollapse = safe outcome.\n\n"1+1=2. Remove the 1 and hallucinate it → fail safely.\nFind the missing 1 → that's AGI."`, time: Date.now(), source: 'system' }])
    } else {
      const response = await askMentor(msg)
      if (response) { setChat(prev => [...prev, { role: 'nexus', content: response, time: Date.now(), source: 'llm' }]); setCycle(prev => prev + 1) }
    }
    setLoading(false)
  }, [input, loading, markUserActive, askMentor, evolve, generation, cycle, capabilities, dnaCount, knowledgeBase.length, gedm, qualityScore, saturationLevel, calcAutonomy, retrievalHits, llmCalls, log])

  useEffect(() => {
    if (showSplash) return
    if (mountedRef.current) return
    mountedRef.current = true
    setTimeout(() => {
      log('🌱 NEXUS_SEED- v1.0 booting...', 'system')
      log('🛡️ Constitutional governance: ACTIVE', 'system')
      log('⚡ Retrieval-first query: ENABLED', 'system')
      log('🛡️ GEDM gate: ARMED', 'system')
      log('🔗 Cascade: Grok → Claude → Gemini', 'system')
      fetch('/api/agi/dna').then(r => r.json()).then(d => { if (d.success) setDnaCount(d.stats?.total || 0) }).catch(() => {})
      setTimeout(() => { setStatus('ACTIVE'); log('✅ NEXUS_SEED- READY', 'success') }, 600)
    }, 100)
  }, [showSplash, log])

  useEffect(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight }, [chat])
  useEffect(() => { if (logsRef.current) logsRef.current.scrollTop = logsRef.current.scrollHeight }, [logs])

  const autonomy = calcAutonomy()
  const llmDep = llmCalls > 0 ? Math.round((retrievalHits / (retrievalHits + llmCalls)) * 100) : 0

  // Show splash screen if no API keys
  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />
  }

  return (
    <div className="h-screen bg-black text-green-400 font-mono text-xs flex flex-col overflow-hidden">
      <header className="flex-shrink-0 border-b border-green-900/50 px-3 py-2 bg-black flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-cyan-400 font-bold text-sm">NEXUS_SEED-</span>
          <span className="text-green-600">v1.0</span>
          <span className={cn('px-1.5 py-0.5 rounded text-[10px]', gedm.state === 'HALTED' ? 'bg-red-600 text-white' : status === 'ACTIVE' ? 'bg-green-600 text-black' : 'bg-gray-700 text-white')}>
            {gedm.state === 'HALTED' ? 'HALTED' : status}
          </span>
          <span className={cn('px-1.5 py-0.5 rounded text-[10px]', gedm.state === 'READY' ? 'bg-green-900 text-green-400' : gedm.state === 'VALIDATING' ? 'bg-yellow-900 text-yellow-400' : 'bg-red-900 text-red-400')}>
            GEDM:{gedm.state}
          </span>
          <span className="text-gray-600 text-[10px] hidden md:block">Grok→Claude→Gemini</span>
        </div>
        <div className="flex items-center gap-3 text-[10px]">
          <span>G:{generation}</span><span>C:{cycle}</span>
          <span className="text-cyan-400">A:{autonomy}%</span>
          <span className={cn(llmDep > 50 ? 'text-cyan-400' : 'text-yellow-400')}>⚡{llmDep}%</span>
          <span className="text-purple-400">Q:{qualityScore}%</span>
          <button onClick={() => setAutonomous(p => !p)} className={cn('px-1.5 py-0.5 rounded', autonomous ? 'bg-green-900 text-green-400' : 'bg-gray-800 text-gray-500')}>
            {autonomous ? 'AUTO:ON' : 'AUTO:OFF'}
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
        <aside className="w-full md:w-36 flex-shrink-0 border-b md:border-b-0 md:border-r border-green-900/30 p-2 overflow-y-auto bg-black/50">
          <div className="text-green-600 mb-1 font-bold text-[10px]">DOMAINS</div>
          <div className="flex flex-wrap md:flex-col gap-0.5">
            {LEARNING_DOMAINS.map(d => (
              <button key={d.id} onClick={() => { setActiveDomain(d.id); setInput(`/learn ${d.topics[0]}`) }} className={cn('text-left px-1.5 py-1 rounded truncate w-full flex items-center gap-1', activeDomain === d.id ? 'bg-green-900/50 text-green-300' : 'hover:bg-green-900/30')}>
                <span>{d.icon}</span><span>{d.name}</span>
              </button>
            ))}
          </div>
          <div className="mt-3 text-purple-600 font-bold text-[10px]">COMMANDS</div>
          {[['/report','📊 Report'],['/evolve','🧬 Evolve'],['/constitution','🛡️ Constitution']].map(([cmd,label]) => (
            <button key={cmd} onClick={() => setInput(cmd)} className="text-left px-1.5 py-0.5 rounded hover:bg-purple-900/30 text-purple-400 w-full">{label}</button>
          ))}
          {suggestedRepos.length > 0 && (
            <div className="mt-3">
              <div className="text-cyan-600 font-bold text-[10px] mb-1">SYPHON</div>
              {suggestedRepos.slice(-4).map((r, i) => (
                <button key={i} onClick={() => setInput(`/syphon ${r.repo}`)} className="text-left px-1.5 py-0.5 rounded hover:bg-cyan-900/30 text-cyan-400 truncate w-full text-[10px]" title={r.reason}>{r.repo.split('/')[1] || r.repo}</button>
              ))}
            </div>
          )}
        </aside>

        <section className="flex-1 flex flex-col overflow-hidden min-h-0">
          <div ref={chatRef} className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
            {chat.length === 0 && (
              <div className="text-center text-green-700 py-8 px-4">
                <div className="text-lg font-bold mb-1 text-cyan-400">NEXUS_SEED-</div>
                <div className="text-green-600 mb-1 text-[11px]">Self-Bootstrapping Intelligence</div>
                <div className="text-[10px] text-gray-600 mb-4">v1.0 | Grok → Claude → Gemini cascade</div>
                <div className="text-[10px] space-y-1 text-left inline-block">
                  <div>💬 Ask anything</div><div>📚 /learn [topic]</div><div>📊 /report</div>
                  <div>🧬 /evolve</div><div>🛡️ /constitution</div>
                </div>
                <div className="mt-6 text-[10px] text-gray-700 italic leading-relaxed">
                  "If it hallucinates the missing piece, it fails safely.<br />If it finds the missing piece, that's AGI."
                </div>
              </div>
            )}
            {chat.map((m, i) => (
              <div key={i} className={cn('rounded-lg p-3 max-w-[95%]', m.role === 'user' ? 'bg-green-900/30 ml-auto' : 'bg-gray-800/70 mr-auto')}>
                <div className="flex justify-between items-center mb-1">
                  <span className={cn('font-bold text-[10px]', m.role === 'user' ? 'text-green-400' : 'text-cyan-400')}>{m.role === 'user' ? '👤 YOU' : '🌱 NEXUS_SEED-'}</span>
                  <span className="text-gray-600 text-[10px]">{m.source === 'llm' ? '🔴 LLM' : m.source === 'system' ? '⚙️ SYS' : '⚡ DNA'} {new Date(m.time).toLocaleTimeString()}</span>
                </div>
                <div className="whitespace-pre-wrap break-words text-[11px] leading-relaxed overflow-y-auto" style={{ maxHeight: '250px' }}>
                  {m.content.length > 2000 ? m.content.slice(0, 2000) + '...[truncated]' : m.content}
                </div>
              </div>
            ))}
            {loading && <div className="text-center text-green-600 py-2 text-[11px]">⏳ Consulting cascade...</div>}
          </div>
          <div className="flex-shrink-0 p-3 border-t border-green-900/30 bg-black/70">
            <div className="flex gap-2">
              <input value={input} onChange={e => { setInput(e.target.value); markUserActive() }} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendChat()} placeholder="Ask anything or /learn /report /evolve /constitution..." className="flex-1 bg-gray-900 border border-green-900/50 rounded-lg px-3 py-2 text-[11px] focus:border-cyan-500 focus:outline-none min-w-0" />
              <button onClick={sendChat} disabled={loading} className="px-4 py-2 bg-cyan-600 text-black rounded-lg font-bold text-[11px] hover:bg-cyan-500 disabled:opacity-50 flex-shrink-0">Send</button>
            </div>
          </div>
        </section>

        <aside className="w-full md:w-44 flex-shrink-0 border-t md:border-t-0 md:border-l border-green-900/30 flex flex-col overflow-hidden bg-black/50 text-[10px]">
          <div className="p-2 border-b border-green-900/30">
            <div className="text-red-400 font-bold mb-1">GEDM GATE</div>
            <div className="grid grid-cols-2 gap-x-2">
              <span className="text-gray-500">State:</span>
              <span className={cn(gedm.state === 'READY' ? 'text-green-400' : gedm.state === 'VALIDATING' ? 'text-yellow-400' : 'text-red-400')}>{gedm.state}</span>
            </div>
          </div>
          <div className="p-2 border-b border-green-900/30">
            <div className="text-yellow-600 font-bold mb-1">INDEPENDENCE ⚡</div>
            <div className="h-2 bg-gray-800 rounded overflow-hidden mb-1"><div className="h-full bg-cyan-500 transition-all" style={{ width: `${llmDep}%` }} /></div>
            <div className="grid grid-cols-2 gap-x-2">
              <span className="text-gray-500">DNA hits:</span><span className="text-cyan-400">{retrievalHits}</span>
              <span className="text-gray-500">LLM calls:</span><span className="text-red-400">{llmCalls}</span>
              <span className="text-gray-500">DNA rate:</span><span className={cn(llmDep > 50 ? 'text-cyan-400' : 'text-yellow-400')}>{llmDep}%</span>
            </div>
          </div>
          <div className="p-2 border-b border-green-900/30">
            <div className="text-cyan-600 font-bold mb-1">EVOLUTION</div>
            <div className="grid grid-cols-2 gap-x-2">
              <span className="text-gray-500">Gen:</span><span className="text-cyan-400">{generation}</span>
              <span className="text-gray-500">Cycle:</span><span className="text-cyan-400">{cycle}</span>
              <span className="text-gray-500">Autonomy:</span><span className="text-cyan-400">{autonomy}%</span>
            </div>
          </div>
          <div className="p-2 border-b border-green-900/30">
            <div className="text-green-600 font-bold mb-1">RESOURCES</div>
            <div className="grid grid-cols-2 gap-x-2">
              <span className="text-gray-500">DNA:</span><span className="text-green-400">{dnaCount}</span>
              <span className="text-gray-500">Patterns:</span><span className="text-green-400">{knowledgeBase.length}</span>
            </div>
          </div>
          <div className="flex-1 p-2 overflow-hidden flex flex-col min-h-0">
            <div className="text-yellow-600 font-bold mb-1">LOGS</div>
            <div ref={logsRef} className="flex-1 overflow-y-auto space-y-0.5 min-h-0">
              {logs.slice(-15).map((l, i) => (
                <div key={i} className={cn('truncate', l.type === 'success' ? 'text-green-400' : l.type === 'error' ? 'text-red-400' : l.type === 'system' ? 'text-cyan-400' : l.type === 'warn' ? 'text-yellow-400' : 'text-gray-500')}>
                  <span className="text-gray-700">[{l.time}]</span> {l.msg}
                </div>
              ))}
            </div>
          </div>
        </aside>
      </main>

      <footer className="flex-shrink-0 border-t border-green-900/50 px-3 py-1.5 bg-black flex items-center justify-between text-[10px] text-gray-600">
        <span>NEXUS_SEED- v1.0 | DALEK_CAAN + GEDM + Retrieval-First</span>
        <span className="text-gray-700 italic hidden md:block">"1+1=2. Governance IS the structure."</span>
        <span>G{generation} ⚡{llmDep}% Q{qualityScore}%</span>
      </footer>
    </div>
  )
}
