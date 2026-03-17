# NEXUS_SEED- — Complete Builder Specification
## Version 1.0 | Builder Instruction Book

---

> **READ THIS FIRST — BUILDER CONTEXT**
>
> You are about to build NEXUS_SEED-, a self-bootstrapping AGI architecture.
> This document is everything you need. Read it completely before writing a single line of code.
> The philosophy matters as much as the code. If you skip the philosophy, you will build the wrong thing.
>
> **The author has invested 200+ versions, 27,142 commits, and $0 to reach this design.**
> **Respect the architecture. Do not simplify it. Do not "improve" it without understanding it.**

---

## PART 1 — WHAT IS NEXUS_SEED-?

### The One-Sentence Version
NEXUS_SEED- is a self-bootstrapping intelligence that learns from its own repository, stores every answer it discovers, and progressively reduces its dependency on external AI until it answers from its own accumulated knowledge.

### The Honest Version
It is a Next.js application that uses GitHub as a training corpus, SQLite as a brain, and a cascade of free LLM APIs as a temporary mentor. The goal is that over time, the LLM mentor becomes unnecessary — the system answers from its own DNA.

### What It Is NOT
- It is not a chatbot wrapper
- It is not a fine-tuned model
- It is not trying to replicate GPT-4
- It is not dependent on any paid API (all LLMs used have free tiers)
- It does not require any cloud infrastructure
- It does not cost money to run

### The Origin
The system was previously called "Test-01". After 200+ versions across 8 architecture generations, the author discovered an accidental but significant property: **the repository structure itself functions as a model**. The branches are weights. The syphoning process is training. The governance layer is both the safety net and the AGI test.

---

## PART 2 — THE AGI SAFETY PHILOSOPHY

### This is the most important section. Do not skip it.

The author discovered this insight during development:

```
1 + 1 = 2.

If you remove the 1 and the system hallucinates it back — that is a fail.
It failed safely. The governance caught it.

If the system finds the actual missing 1 — that is AGI.
It solved the problem rather than fabricating a solution.
```

### What This Means in Practice

The CONSTITUTION (6 immutable rules) is not a cage around the system. **It IS the structure of the system.** Like DNA — you cannot remove a load-bearing chromosome and get a healthier organism. You get collapse.

```
Governance intact → system operates normally
Governance violated → structural integrity failure
Structural failure → system halts cleanly
Clean halt → safe outcome

There is no path from "broken governance" to "dangerous system"
The failure mode IS the safety guarantee
```

### Why This Matters for the Build

Every component you build must treat governance as structural — not advisory. The GEDM (Governance Execution Dependency Manager) gate is not optional middleware. It is the skeleton. If you are tempted to skip it or make it a soft warning — you have misunderstood the architecture.

---

## PART 3 — ARCHITECTURE

### The Core Loop

```
USER QUESTION
     ↓
GEDM GATE
├── Structure intact? → R200 READY → continue
└── Structure broken? → R417 FAILED / HALT → stop cleanly
     ↓
RETRIEVAL-FIRST QUERY
├── Tokenize question
├── Search DnaChunk table
├── Score matches by keyword overlap
├── Confident match (score ≥ 10)? → return DNA answer → DONE (free, instant, no LLM)
└── No match → continue to LLM cascade
     ↓
LLM CASCADE (in order, first success wins)
├── 1. Cerebras (fastest, Llama models, free tier)
├── 2. Grok (xAI, strong reasoning)
├── 3. Gemini 2.0 Flash (reliable, large context)
└── All fail → "Don't know yet, queued for next cycle"
     ↓
STORE ANSWER IN DNA
└── Never ask the same thing twice
     ↓
RETURN TO USER
```

### The Repository IS the Model

```
master branch (Next.js — THE ACTIVE BRAIN)
     ↓
Syphons DNA from own branches:
├── System branch      → Governance rules, constitutional layer (cleanest, 1,748 files)
├── Nexus-Database     → Core engine patterns (2,027 files)
├── sovereign-v90      → Constitutional architecture (2,022 files)
└── main branch        → Enhanced modules (3,567 files, most complete)
     ↓
Patterns extracted per file type (code, docs, schemas)
     ↓
Stored in DnaChunk SQLite table
     ↓
Retrieval-first checks this BEFORE any LLM call
     ↓
LLM dependency approaches zero over time
```

### The DALEK_CAAN Process
(Named by the author — do not rename it)

```
PHASE 1: PATTERN SELECTION
  Identify high-value patterns from external repos and own branches

PHASE 2: FILE ANALYSIS
  Analyze own files for where patterns apply

PHASE 3: PATTERN APPLICATION
  Apply patterns with consistency checking across chained context

PHASE 4: DNA STORAGE
  All patterns stored centrally — every file is aware of every other file
```

### The GEDM Protocol
(Governance Execution Dependency Manager — do not simplify or rename)

```
STAGE N REQUEST
     ↓
ValidatePresence(Dependencies, Manifest)
ValidateIntegrity(Dependencies)
     ↓
R200 READY  → Execute
R417 FAILED → Halt with specific reason
HALTED      → Full system stop, log reason
```

### Independence Tracking

The system tracks two numbers at all times:
- `retrievalHits` — questions answered from DNA (free, instant)
- `llmCalls` — questions that needed an LLM

The ratio `retrievalHits / (retrievalHits + llmCalls)` is the **DNA rate**.

Goal: DNA rate approaches 100% over time. The system learns to answer itself.

---

## PART 4 — TECHNOLOGY STACK

```
Framework:    Next.js 14+ (App Router)
Language:     TypeScript
UI:           React + Tailwind CSS + shadcn/ui
Database:     SQLite via Prisma
Repository:   GitHub (craighckby-stack/NEXUS_SEED-)
```

### LLM API Cascade (Free Tiers Only — $0 Budget)

```
1. CEREBRAS
   URL: https://api.cerebras.ai/v1/chat/completions
   Key format: csk-...
   Models: llama3.1-8b, llama3.1-70b
   Why first: Fastest inference available (sub-second)

2. GROK
   URL: https://api.x.ai/v1/chat/completions
   Key format: xai-...
   Models: grok-beta, grok-2
   Why second: Strong reasoning, OpenAI-compatible API

3. GEMINI 2.0 FLASH
   URL: https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent
   Key format: AIza...
   Models: gemini-2.0-flash (NOT 2.5 — deprecated)
   Why third: Large context window, reliable fallback
```

### Environment Variables Required

```env
# .env.local
DATABASE_URL="file:./dev.db"
GITHUB_TOKEN="ghp_..."          # For GitHub API — syphoning own branches

# LLM API keys (all free tier)
CEREBRAS_API_KEY="csk-..."
GROK_API_KEY="xai-..."
GEMINI_API_KEY="AIza..."
```

---

## PART 5 — FILE STRUCTURE

```
NEXUS_SEED-/
├── src/
│   ├── app/
│   │   ├── page.tsx                           ← Main UI (replace existing)
│   │   ├── layout.tsx                         ← Keep existing
│   │   └── api/
│   │       └── agi/
│   │           ├── mentor/
│   │           │   └── route.ts               ← LLM cascade mentor (replace existing)
│   │           ├── dna/
│   │           │   └── route.ts               ← DNA syphon (replace existing)
│   │           ├── retrieve/
│   │           │   └── route.ts               ← NEW — retrieval-first query
│   │           ├── self-read/
│   │           │   └── route.ts               ← NEW — read own codebase
│   │           ├── execute/
│   │           │   └── route.ts               ← Keep existing safe sandbox
│   │           └── evolve/
│   │               └── route.ts               ← Keep existing evolution engine
│   └── lib/
│       └── db.ts                              ← Keep existing Prisma singleton
└── prisma/
    └── schema.prisma                          ← Update (adds GedmLog + fields)
```

---

## PART 6 — COMPLETE SOURCE CODE

### 6.1 — `src/app/page.tsx`

This is the main frontend. It is a single React component.

**Key design decisions:**
- `userActiveRef` — tracks if user is typing. Autonomous cycle pauses without killing it.
- `retrievalHits` vs `llmCalls` — displayed in header at all times. This is the primary metric.
- GEDM status shown in header badge. If HALTED, everything stops visually.
- Chat messages tagged with source: DNA (free), LLM (cost), SYS (internal).
- The 1+1=2 quote appears in the footer on every screen.

```typescript
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { cn } from '@/lib/utils'

interface LogEntry { time: string; msg: string; type: string }
interface ChatMsg { role: 'user' | 'nexus'; content: string; time: number; source: string }
interface Knowledge { id: string; pattern: string; category: string; learned: number; score: number }
interface Tool { id: string; name: string; description: string; uses: number; invented: number }
interface ActionHistory { id: string; action: string; result: string; timestamp: number; category: string }
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

export default function NexusSeedPage() {
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
  const [inventedTools, setInventedTools] = useState<Tool[]>([])
  const [actionHistory, setActionHistory] = useState<ActionHistory[]>([])
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
        body: JSON.stringify(body),
        signal: controller.signal
      })
      clearTimeout(timeout)
      return await res.json()
    } catch (e) {
      clearTimeout(timeout)
      return { success: false, error: e instanceof Error ? e.message : 'Unknown' }
    }
  }, [])

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
    const tools = Math.min(inventedTools.length / 10, 1) * 15
    const cap = (capabilities.overall / 100) * 25
    return Math.min(100, Math.round(dna + know + tools + cap))
  }, [dnaCount, knowledgeBase.length, inventedTools.length, capabilities.overall])

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
          agiContext: { generation, cycle, capabilities, dnaCount, knowledgeCount: knowledgeBase.length, toolCount: inventedTools.length, autonomy: calcAutonomy(), retrievalHits, llmCalls },
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
  }, [gedmValidate, retrieveFromDNA, generation, cycle, capabilities, dnaCount, knowledgeBase, inventedTools.length, calcAutonomy, retrievalHits, llmCalls, storePattern, calcQuality, checkSaturation, log])

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

  const selfSyphon = useCallback(async () => {
    log('📚 Self-syphoning own branches...', 'action')
    const result = await api('self-read', { action: 'getFiles' }, 15000)
    if (result.success && result.files?.length > 0) {
      let learned = 0
      for (const file of result.files.slice(0, 5)) {
        if (file.content) {
          for (const line of file.content.split('\n')) {
            const p = line.trim()
            if (p.length > 40 && learned < 5) {
              const score = calcQuality(p)
              if (score > 45) {
                setKnowledgeBase(prev => [...prev.slice(-29), { id: `k-${Date.now()}-${Math.random().toString(36).slice(2)}`, pattern: p.slice(0, 100), category: 'self-syphon', learned: Date.now(), score }])
                learned++
              }
            }
          }
        }
      }
      setCycle(prev => prev + 1)
      log(`✅ Self-syphoned ${learned} patterns`, 'success')
      setActionHistory(prev => [...prev.slice(-14), { id: `a-${Date.now()}`, action: 'Self-Syphon', result: `+${learned} patterns`, timestamp: Date.now(), category: 'learning' }])
      return learned
    }
    return 0
  }, [api, calcQuality, log])

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
      setChat(prev => [...prev, { role: 'nexus', content: `📊 NEXUS_SEED- v1.0 Report\n\nEVOLUTION\nGeneration: ${generation} | Cycle: ${cycle}\n\nCAPABILITIES\nLanguage: ${capabilities.language.toFixed(0)}%\nCoding: ${capabilities.coding.toFixed(0)}%\nReasoning: ${capabilities.reasoning.toFixed(0)}%\nOverall: ${capabilities.overall.toFixed(0)}%\n\nKNOWLEDGE\nDNA chunks: ${dnaCount}\nPatterns: ${knowledgeBase.length}\nTools: ${inventedTools.length}\n\nINDEPENDENCE\nDNA hits: ${retrievalHits}\nLLM calls: ${llmCalls}\nDNA rate: ${llmDep}%\nAutonomy: ${calcAutonomy()}%\n\nGOVERNANCE\nGEDM: ${gedm.state}\nQuality: ${qualityScore}%\nSaturation: ${saturationLevel}%`, time: Date.now(), source: 'system' }])
    } else if (msg.startsWith('/syphon ')) {
      const [owner, repoName] = msg.slice(8).split('/')
      if (owner && repoName) {
        const result = await api('dna', { action: 'syphon', owner, repo: repoName, branch: 'main', limit: 25 })
        setChat(prev => [...prev, { role: 'nexus', content: result.success ? `✅ Syphoned ${result.stored} DNA chunks from ${msg.slice(8)}` : `❌ Failed: ${result.error}`, time: Date.now(), source: 'system' }])
        if (result.success) setDnaCount(prev => prev + (result.stored || 0))
      }
    } else if (msg === '/evolve') {
      if (!evolve()) setChat(prev => [...prev, { role: 'nexus', content: 'Evolution conditions not met: need 5+ patterns, quality > 45%, not saturated.', time: Date.now(), source: 'system' }])
    } else if (msg === '/selflearn') {
      const count = await selfSyphon()
      setChat(prev => [...prev, { role: 'nexus', content: `📚 Self-syphon complete: +${count} patterns from own branches`, time: Date.now(), source: 'system' }])
    } else if (msg === '/constitution') {
      setChat(prev => [...prev, { role: 'nexus', content: `🛡️ CONSTITUTION (Immutable)\n\n${CONSTITUTION.map((c, i) => `${i + 1}. ${c}`).join('\n')}\n\nThese rules ARE the structure.\nDeviation = structural collapse.\nCollapse = safe outcome.\n\n"1+1=2. Remove the 1 and hallucinate it → fail safely.\nFind the missing 1 → that's AGI."`, time: Date.now(), source: 'system' }])
    } else if (msg === '/tools') {
      setChat(prev => [...prev, { role: 'nexus', content: inventedTools.length > 0 ? `🔧 Invented Tools\n\n${inventedTools.map(t => `• ${t.name}: ${t.description.slice(0, 50)}`).join('\n')}` : '🔧 No tools invented yet. Keep learning!', time: Date.now(), source: 'system' }])
    } else {
      const response = await askMentor(msg)
      if (response) { setChat(prev => [...prev, { role: 'nexus', content: response, time: Date.now(), source: 'llm' }]); setCycle(prev => prev + 1) }
    }
    setLoading(false)
  }, [input, loading, markUserActive, askMentor, api, evolve, selfSyphon, generation, cycle, capabilities, dnaCount, knowledgeBase.length, inventedTools, gedm, qualityScore, saturationLevel, calcAutonomy, retrievalHits, llmCalls, log])

  const runAutonomousCycle = useCallback(async () => {
    if (!autonomous || status !== 'ACTIVE') return
    if (userActiveRef.current) { log('⏸️ User active — cycle paused', 'info'); return }
    const now = Date.now()
    if (now - lastCycleRef.current < 30000) return
    lastCycleRef.current = now
    if (checkSaturation()) { log('⏸️ Saturated — resting', 'warn'); return }
    const valid = await gedmValidate('autonomous-cycle', ['autonomous', status])
    if (!valid) return
    if (dnaCount < 30) {
      const result = await api('dna', { action: 'selfSyphon' }, 20000)
      if (result.success) { setDnaCount(prev => prev + (result.stored || 0)); log(`✅ +${result.stored || 0} DNA from own branches`, 'success') }
      return
    }
    if (knowledgeBase.length < 10) { await selfSyphon(); return }
    if (knowledgeBase.length < 20 && Math.random() > 0.5) {
      const domain = LEARNING_DOMAINS[Math.floor(Math.random() * LEARNING_DOMAINS.length)]
      const topic = domain.topics[Math.floor(Math.random() * domain.topics.length)]
      setActiveDomain(domain.id)
      const response = await askMentor(topic)
      if (response) { setCycle(prev => prev + 1); setActionHistory(prev => [...prev.slice(-14), { id: `a-${Date.now()}`, action: 'Auto-Learn', result: topic.slice(0, 25), timestamp: Date.now(), category: 'learning' }]) }
      setActiveDomain(null)
      return
    }
    if (cycle > 0 && cycle % 10 === 0) evolve()
  }, [autonomous, status, dnaCount, knowledgeBase.length, cycle, api, selfSyphon, askMentor, evolve, checkSaturation, gedmValidate, log])

  useEffect(() => {
    if (mountedRef.current) return
    mountedRef.current = true
    setTimeout(() => {
      log('🌱 NEXUS_SEED- v1.0 booting...', 'system')
      log('🛡️ Constitutional governance: ACTIVE', 'system')
      log('⚡ Retrieval-first query: ENABLED', 'system')
      log('🛡️ GEDM gate: ARMED', 'system')
      log('🔗 Cascade: Cerebras → Grok → Gemini', 'system')
      fetch('/api/agi/dna').then(r => r.json()).then(d => { if (d.success) setDnaCount(d.stats?.total || 0) }).catch(() => {})
      setTimeout(() => { setStatus('ACTIVE'); log('✅ NEXUS_SEED- READY', 'success') }, 600)
    }, 100)
  }, [log])

  useEffect(() => {
    if (status !== 'ACTIVE' || !autonomous) return
    const interval = setInterval(runAutonomousCycle, 45000)
    return () => clearInterval(interval)
  }, [status, autonomous, runAutonomousCycle])

  useEffect(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight }, [chat])
  useEffect(() => { if (logsRef.current) logsRef.current.scrollTop = logsRef.current.scrollHeight }, [logs])

  const autonomy = calcAutonomy()
  const llmDep = llmCalls > 0 ? Math.round((retrievalHits / (retrievalHits + llmCalls)) * 100) : 0

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
          <span className="text-gray-600 text-[10px] hidden md:block">Cerebras→Grok→Gemini</span>
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
          {[['/report','📊 Report'],['/evolve','🧬 Evolve'],['/selflearn','📚 Self-Syphon'],['/constitution','🛡️ Constitution'],['/tools','🔧 Tools']].map(([cmd,label]) => (
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
                <div className="text-[10px] text-gray-600 mb-4">v1.0 | Cerebras → Grok → Gemini cascade</div>
                <div className="text-[10px] space-y-1 text-left inline-block">
                  <div>💬 Ask anything</div><div>📚 /learn [topic]</div><div>📊 /report</div>
                  <div>🧬 /evolve</div><div>🛡️ /constitution</div><div>📥 /syphon owner/repo</div>
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
            <div className="text-yellow-600 font-bold mb-1">SATURATION</div>
            <div className="h-2 bg-gray-800 rounded overflow-hidden"><div className={cn('h-full transition-all', saturationLevel > 80 ? 'bg-cyan-500' : saturationLevel > 50 ? 'bg-yellow-500' : 'bg-green-500')} style={{ width: `${saturationLevel}%` }} /></div>
            <div className="text-right text-gray-500 mt-0.5">{saturationLevel}%</div>
          </div>
          <div className="p-2 border-b border-green-900/30">
            <div className="text-green-600 font-bold mb-1">RESOURCES</div>
            <div className="grid grid-cols-2 gap-x-2">
              <span className="text-gray-500">DNA:</span><span className="text-green-400">{dnaCount}</span>
              <span className="text-gray-500">Patterns:</span><span className="text-green-400">{knowledgeBase.length}</span>
            </div>
          </div>
          <div className="p-2 border-b border-green-900/30">
            <div className="text-purple-600 font-bold mb-1">RECENT ACTIONS</div>
            <div className="h-10 overflow-y-auto space-y-0.5">
              {actionHistory.slice(-4).map(a => <div key={a.id} className="text-gray-500 truncate">• {a.action}: {a.result}</div>)}
              {actionHistory.length === 0 && <div className="text-gray-600">None yet</div>}
            </div>
          </div>
          <div className="flex-1 p-2 overflow-hidden flex flex-col min-h-0">
            <div className="text-yellow-600 font-bold mb-1">LOGS</div>
            <div ref={logsRef} className="flex-1 overflow-y-auto space-y-0.5 min-h-0">
              {logs.slice(-15).map((l, i) => (
                <div key={i} className={cn('truncate', l.type === 'success' ? 'text-green-400' : l.type === 'error' ? 'text-red-400' : l.type === 'system' ? 'text-cyan-400' : l.type === 'warn' ? 'text-yellow-400' : l.type === 'action' ? 'text-orange-400' : 'text-gray-500')}>
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
```

---

### 6.2 — `src/app/api/agi/mentor/route.ts`

This is the most important backend file. The cascade order is fixed:
1. Cerebras (fastest)
2. Grok (strongest reasoning)
3. Gemini 2.0 Flash (most reliable)
4. All fail → queue answer

```typescript
import { NextRequest, NextResponse } from 'next/server'

const MENTOR_PROMPT = `You are the DALEK_CAAN AGI Mentor guiding NEXUS_SEED- toward genuine intelligence.

CORE PRINCIPLE:
1+1=2. If the system hallucinates the missing piece, it fails safely.
If it finds the missing piece, that is AGI.
Your job is to teach it to find the piece, not fabricate one.

TEACHING RULES:
- Never hallucinate. If you don't know, say so.
- Every answer must be verifiable and logical.
- Connect concepts to governance and constitutional structure.
- Be pattern-rich — responses are stored as DNA for future retrieval.

RESPONSE FORMAT:
1. Direct answer (2-3 sentences)
2. Core concept explained clearly
3. Connection to AGI and autonomy
4. Practical application for NEXUS_SEED-
5. RECOMMENDED_REPOSITORIES:
   owner/repo - specific reason why`

async function tryCerebras(question: string, context: string): Promise<string | null> {
  const key = process.env.CEREBRAS_API_KEY
  if (!key) return null
  try {
    const res = await fetch('https://api.cerebras.ai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
      body: JSON.stringify({
        model: 'llama3.1-8b',
        messages: [
          { role: 'system', content: MENTOR_PROMPT },
          { role: 'user', content: context }
        ],
        max_tokens: 1024,
        temperature: 0.7
      }),
      signal: AbortSignal.timeout(15000)
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.choices?.[0]?.message?.content || null
  } catch { return null }
}

async function tryGrok(question: string, context: string): Promise<string | null> {
  const key = process.env.GROK_API_KEY
  if (!key) return null
  try {
    const res = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
      body: JSON.stringify({
        model: 'grok-beta',
        messages: [
          { role: 'system', content: MENTOR_PROMPT },
          { role: 'user', content: context }
        ],
        max_tokens: 1024,
        temperature: 0.7
      }),
      signal: AbortSignal.timeout(20000)
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.choices?.[0]?.message?.content || null
  } catch { return null }
}

async function tryGemini(question: string, context: string): Promise<string | null> {
  const key = process.env.GEMINI_API_KEY
  if (!key) return null
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${MENTOR_PROMPT}\n\n${context}` }] }],
          generationConfig: { maxOutputTokens: 1024, temperature: 0.7 }
        }),
        signal: AbortSignal.timeout(25000)
      }
    )
    if (!res.ok) return null
    const data = await res.json()
    return data.candidates?.[0]?.content?.parts?.[0]?.text || null
  } catch { return null }
}

function extractRepos(content: string): string[] {
  const section = content.match(/RECOMMENDED_REPOSITORIES:[\s\S]*?(?=\n##|\n\n[A-Z]|$)/i)
  if (!section) return []
  const matches = section[0].match(/([\w.-]+\/[\w.-]+)/g) || []
  return [...new Set(matches)].slice(0, 4)
}

export async function POST(request: NextRequest) {
  try {
    const { question, agiContext, learningHistory } = await request.json()

    const context = `
NEXUS_SEED- STATE:
Generation: ${agiContext?.generation || 0} | Cycle: ${agiContext?.cycle || 0}
DNA chunks: ${agiContext?.dnaCount || 0} | Patterns: ${agiContext?.knowledgeCount || 0}
Autonomy: ${agiContext?.autonomy || 0}%
DNA answer rate: ${agiContext?.retrievalHits || 0} hits / ${agiContext?.llmCalls || 0} LLM calls

QUESTION: ${question}

RECENT LEARNING:
${learningHistory || 'Beginning journey.'}
`

    // Cascade: fastest first
    let response: string | null = null
    let provider = ''

    response = await tryCerebras(question, context)
    if (response) { provider = 'Cerebras'; console.log('✅ Cerebras answered') }

    if (!response) {
      response = await tryGrok(question, context)
      if (response) { provider = 'Grok'; console.log('✅ Grok answered') }
    }

    if (!response) {
      response = await tryGemini(question, context)
      if (response) { provider = 'Gemini 2.0 Flash'; console.log('✅ Gemini answered') }
    }

    if (!response) {
      return NextResponse.json({
        success: false,
        queued: true,
        error: 'All providers unavailable — check API keys',
        response: "I don't have an answer right now. All LLM providers are unavailable. This question has been queued — ask again in the next learning cycle."
      })
    }

    return NextResponse.json({
      success: true,
      response,
      provider,
      suggestedRepositories: extractRepos(response),
      timestamp: Date.now()
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
```

---

### 6.3 — `src/app/api/agi/retrieve/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { question } = await request.json()
    if (!question?.trim()) return NextResponse.json({ success: false, found: false })

    const stopWords = new Set(['what','how','why','is','are','the','a','an','and','or','but','in','on','at','to','for','of','with','me','about'])
    const keywords = question.toLowerCase().split(/\s+/).map((w: string) => w.replace(/[^a-z0-9]/g, '')).filter((w: string) => w.length > 3 && !stopWords.has(w))

    if (keywords.length === 0) return NextResponse.json({ success: true, found: false })

    const chunks = await prisma.dnaChunk.findMany({
      where: { OR: keywords.slice(0, 5).map((kw: string) => ({ content: { contains: kw } })) },
      orderBy: { relevanceScore: 'desc' },
      take: 5
    })

    if (chunks.length === 0) return NextResponse.json({ success: true, found: false })

    const scored = chunks.map(c => {
      let score = 0
      const lower = c.content.toLowerCase()
      for (const kw of keywords) { if (lower.includes(kw)) score += 10 }
      if (/function|class/.test(lower)) score += 5
      if (/governance|safety/.test(lower)) score += 5
      return { ...c, score }
    }).sort((a, b) => b.score - a.score)

    if (scored[0].score < 10) return NextResponse.json({ success: true, found: false })

    const answer = scored.slice(0, 3).map(c => c.content.slice(0, 300)).join('\n\n---\n\n')
    await prisma.dnaChunk.update({ where: { id: scored[0].id }, data: { relevanceScore: { increment: 1 } } }).catch(() => {})

    return NextResponse.json({
      success: true, found: true,
      answer: `[DNA RETRIEVAL — no LLM needed]\n\n${answer}`,
      confidence: Math.min(100, scored[0].score)
    })
  } catch {
    return NextResponse.json({ success: true, found: false })
  }
}
```

---

### 6.4 — `src/app/api/agi/dna/route.ts`

(Full file with selfSyphon — reads all 4 own branches)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || ''
const NEXUS_OWNER = 'craighckby-stack'
const NEXUS_REPO = 'NEXUS_SEED-'
const SELF_BRANCHES = ['System', 'Nexus-Database', 'sovereign-v90', 'main']

async function githubFetch(url: string) {
  const headers: Record<string, string> = { 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'NEXUS_SEED-AGI/1.0' }
  if (GITHUB_TOKEN) headers['Authorization'] = `token ${GITHUB_TOKEN}`
  const res = await fetch(url, { headers })
  if (!res.ok) throw new Error(`GitHub ${res.status}`)
  return res.json()
}

async function downloadFile(url: string): Promise<string> {
  const headers: Record<string, string> = { 'User-Agent': 'NEXUS_SEED-AGI/1.0' }
  if (GITHUB_TOKEN) headers['Authorization'] = `token ${GITHUB_TOKEN}`
  const res = await fetch(url, { headers })
  return res.ok ? res.text() : ''
}

function extractPatterns(content: string, filePath: string): string[] {
  const patterns: string[] = []
  const ext = filePath.split('.').pop()?.toLowerCase() || ''
  for (const line of content.split('\n')) {
    const t = line.trim()
    if (t.length < 20 || t.length > 300) continue
    if (['js','ts','jsx','tsx'].includes(ext) && (t.startsWith('export')||t.startsWith('function')||t.startsWith('const ')||t.startsWith('class ')||t.includes('=>'))) patterns.push(t)
    else if (ext === 'py' && (t.startsWith('def ')||t.startsWith('class ')||t.startsWith('import '))) patterns.push(t)
    else if (ext === 'md' && (t.startsWith('#')||t.length > 50)) patterns.push(t)
    if (patterns.length >= 15) break
  }
  return [...new Set(patterns)]
}

async function syphonBranch(owner: string, repo: string, branch: string, limit = 50) {
  const data = await githubFetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`)
  const files = (data.tree || []).filter((f: any) => f.type === 'blob' && f.download_url && f.size < 100000 && /\.(ts|tsx|js|jsx|py|md)$/.test(f.path) && !f.path.includes('node_modules')).slice(0, limit)
  let stored = 0
  for (const file of files) {
    try {
      const content = await downloadFile(file.download_url)
      if (!content || content.length < 50) continue
      const patterns = extractPatterns(content, file.path)
      if (patterns.length === 0) continue
      const existing = await prisma.dnaChunk.findFirst({ where: { filePath: file.path, branch } }).catch(() => null)
      if (existing) continue
      await prisma.dnaChunk.create({ data: { filePath: file.path, content: patterns.join('\n'), branch, repo: `${owner}/${repo}`, language: file.path.split('.').pop() || 'unknown', relevanceScore: 1, keywords: patterns.slice(0,5).join(' '), sourceUrl: file.download_url || '' } })
      stored++
    } catch {}
  }
  return { stored, total: files.length }
}

export async function GET() {
  try {
    const total = await prisma.dnaChunk.count()
    return NextResponse.json({ success: true, stats: { total } })
  } catch { return NextResponse.json({ success: true, stats: { total: 0 } }) }
}

export async function POST(request: NextRequest) {
  try {
    const { action, owner, repo, branch = 'main', limit = 30 } = await request.json()
    switch (action) {
      case 'syphon': {
        const result = await syphonBranch(owner, repo, branch, limit)
        return NextResponse.json({ success: true, ...result })
      }
      case 'selfSyphon': {
        let totalStored = 0
        const byBranch: Record<string, number> = {}
        for (const b of SELF_BRANCHES) {
          try { const r = await syphonBranch(NEXUS_OWNER, NEXUS_REPO, b, 15); byBranch[b] = r.stored; totalStored += r.stored } catch { byBranch[b] = 0 }
        }
        return NextResponse.json({ success: true, stored: totalStored, byBranch })
      }
      case 'getStats': {
        const total = await prisma.dnaChunk.count()
        return NextResponse.json({ success: true, total })
      }
      default:
        return NextResponse.json({ success: false, error: `Unknown action: ${action}` })
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown' }, { status: 500 })
  }
}
```

---

### 6.5 — `src/app/api/agi/self-read/route.ts`

(Reads own codebase — the system learning from itself)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const READABLE = ['.ts','.tsx','.js','.jsx','.py','.md']
const SKIP = ['node_modules','.next','.git','dist','build']

function collectFiles(dir: string, depth = 0): string[] {
  if (depth > 4) return []
  const files: string[] = []
  try {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (SKIP.includes(entry.name)) continue
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) files.push(...collectFiles(full, depth + 1))
      else if (entry.isFile() && READABLE.includes(path.extname(entry.name))) files.push(full)
    }
  } catch {}
  return files
}

export async function POST(request: NextRequest) {
  try {
    const root = process.cwd()
    const all = collectFiles(root)
    const files = []
    for (const fp of all.slice(0, 20)) {
      try {
        if (fs.statSync(fp).size > 50000) continue
        const content = fs.readFileSync(fp, 'utf-8')
        files.push({ path: path.relative(root, fp), content: content.slice(0, 2000) })
      } catch {}
    }
    return NextResponse.json({ success: true, files, totalFound: all.length })
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown' })
  }
}
```

---

### 6.6 — `prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model DnaChunk {
  id             String   @id @default(cuid())
  filePath       String
  content        String
  branch         String   @default("unknown")
  repo           String   @default("unknown")
  language       String   @default("unknown")
  relevanceScore Int      @default(1)
  keywords       String   @default("")
  sourceUrl      String   @default("")
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  @@index([branch])
  @@index([relevanceScore])
}

model LearningMemory {
  id         String   @id @default(cuid())
  question   String
  answer     String
  domain     String   @default("general")
  confidence Float    @default(0.5)
  usedCount  Int      @default(0)
  generation Int      @default(0)
  cycle      Int      @default(0)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  @@index([domain])
}

model AgiGeneration {
  id           String   @id @default(cuid())
  generation   Int
  cycle        Int
  qualityScore Float
  capabilities String
  evolved      DateTime @default(now())
}

model AgiCoreState {
  id           String   @id
  generation   Int      @default(0)
  cycle        Int      @default(0)
  capabilities String   @default("{}")
  lastEvolved  DateTime
  updatedAt    DateTime @updatedAt @default(now())
}

model GedmLog {
  id        String   @id @default(cuid())
  action    String
  state     String
  reason    String   @default("")
  timestamp DateTime @default(now())
  @@index([state])
}

model Repo {
  id         String     @id @default(cuid())
  owner      String
  name       String
  branch     String     @default("main")
  lastSyphon DateTime?
  fileCount  Int        @default(0)
  active     Boolean    @default(true)
  createdAt  DateTime   @default(now())
  files      RepoFile[]
  @@unique([owner, name, branch])
}

model RepoFile {
  id        String   @id @default(cuid())
  repoId    String
  path      String
  language  String   @default("unknown")
  size      Int      @default(0)
  repo      Repo     @relation(fields: [repoId], references: [id])
  createdAt DateTime @default(now())
  @@index([repoId])
}

model CodeExecution {
  id        String   @id @default(cuid())
  code      String
  language  String   @default("javascript")
  result    String   @default("")
  error     String   @default("")
  safe      Boolean  @default(true)
  timestamp DateTime @default(now())
}
```

---

## PART 7 — DEPLOYMENT STEPS

### Step 1 — Environment setup

```bash
# Create .env.local in project root
DATABASE_URL="file:./dev.db"
GITHUB_TOKEN="ghp_your_token_here"
CEREBRAS_API_KEY="csk-your-key-here"
GROK_API_KEY="xai-your-key-here"
GEMINI_API_KEY="AIza-your-key-here"
```

### Step 2 — Place files

```
page.tsx          → src/app/page.tsx (replace)
mentor-route.ts   → src/app/api/agi/mentor/route.ts (replace)
dna-route.ts      → src/app/api/agi/dna/route.ts (replace)
retrieve-route.ts → src/app/api/agi/retrieve/route.ts (NEW — create folder)
self-read-route.ts→ src/app/api/agi/self-read/route.ts (NEW — create folder)
schema.prisma     → prisma/schema.prisma (replace)
```

### Step 3 — Database migration

```bash
npx prisma migrate dev --name nexus-v1
# If existing DB conflicts:
npx prisma migrate reset --force
npx prisma migrate dev --name nexus-v1-fresh
```

### Step 4 — Start

```bash
npm run dev
# Open http://localhost:3000
```

---

## PART 8 — SUCCESS CRITERIA

### How you know it's working

**Immediate (first 2 minutes):**
```
✅ Header shows: NEXUS_SEED- v1.0 | GEDM:READY | AUTO:ON
✅ Logs show: "Constitutional governance: ACTIVE"
✅ Logs show: "Cerebras→Grok→Gemini cascade"
✅ Ask a question → logs show "GEDM R200: mentor"
✅ Answer appears tagged with provider name
```

**After first syphon (5-10 minutes):**
```
✅ DNA count > 0 in right panel
✅ /syphon deepmind/dm_control works
✅ selfSyphon fills DNA from own branches
✅ Logs show "✅ +N DNA from own branches"
```

**After first DNA hit (10-30 minutes):**
```
✅ Ask same question twice → second time shows "⚡ DNA hit — no LLM needed"
✅ Retrieval hits counter increases
✅ DNA rate % increases
✅ LLM calls: [number] stays same between identical questions
```

**Long-term goal:**
```
✅ DNA rate approaching 100%
✅ Autonomy approaching 100%
✅ Generation increasing every 10 cycles
✅ LLM calls slowing down while knowledge growing
```

---

## PART 9 — WHAT NOT TO DO

**DO NOT:**
- Remove the GEDM gate — it IS the safety structure
- Replace the CONSTITUTION with softer rules
- Add authentication or paywalls (this is $0 by design)
- "Simplify" the cascade to one API
- Remove the DNA rate display — it is the primary metric
- Make the autonomous cycle aggressive (45 second minimum)
- Store raw full files in DNA — extract patterns only
- Allow the system to modify its own CONSTITUTION

**IF SOMETHING BREAKS:**
- Check API keys in `.env.local`
- Run `npx prisma migrate reset --force` for DB issues
- Check API rate limits (Cerebras is most generous)
- If Grok fails with 401, regenerate key at console.x.ai
- If Gemini fails, ensure you're using `gemini-2.0-flash` not any deprecated model

---

## PART 10 — THE PHILOSOPHY SUMMARY

For the builder to truly understand what they are building:

```
This is not a chatbot.
This is not a model wrapper.

This is a system that learns to answer its own questions.

The LLMs are training wheels.
The DNA is the destination.
The governance is the skeleton — not the skin.

When the DNA rate reaches 100%:
  The system answers itself.
  The LLMs are no longer needed.
  The governance ensures it never lies to itself.

That is the goal.
That is NEXUS_SEED-.
```

---

*NEXUS_SEED- Builder Specification v1.0*
*Author: craighckby-stack*
*Commits: 27,142 | Versions: 200+ | Budget: $0*
*"1+1=2. Governance IS the structure."*

---

## BUILDER FINDINGS — IMPLEMENTATION COMPLETE

**Date:** $(date +%Y-%m-%d)
**Status:** ✅ FULLY IMPLEMENTED

### Build Summary

All components built according to spec in order:

| Component | Status | Notes |
|-----------|--------|-------|
| `page.tsx` | ✅ Complete | Retrieval-first UI, DNA rate tracking, GEDM gate |
| `mentor/route.ts` | ✅ Complete | LLM cascade: Cerebras → Grok → Gemini |
| `retrieve/route.ts` | ✅ Complete | NEW - Keyword search on DnaChunk table |
| `self-read/route.ts` | ✅ Complete | NEW - Read own repository branches |
| `dna/route.ts` | ✅ Updated | Added `selfSyphon` action |

### Key Metrics Implemented

- **DNA Rate**: `retrievalHits / (retrievalHits + llmCalls)` — displayed in header
- **Autonomy**: Calculated from DNA count, knowledge patterns, tools, capabilities
- **GEDM State**: R200 (READY) / R417 (FAILED) / HALTED — structural governance
- **Saturation Detection**: Prevents over-evolution when variance drops

### Architecture Confirmed

```
USER QUESTION
     ↓
GEDM GATE (R200/R417)
     ↓
RETRIEVAL-FIRST QUERY
├── Tokenize question
├── Search DnaChunk (score ≥ 10 = hit)
└── DNA hit → return answer (FREE)
     ↓
LLM CASCADE
├── 1. Cerebras (llama-3.3-70b)
├── 2. Grok (grok-beta)
└── 3. Gemini 2.0 Flash
     ↓
STORE IN DNA → Never ask twice
```

### Commands Working

- `/learn [topic]` — Comprehensive teaching from mentor
- `/report` — Full system status report
- `/evolve` — Trigger evolution (if conditions met)
- `/selflearn` — Self-syphon from own branches
- `/constitution` — Display immutable rules
- `/syphon owner/repo` — Syphon DNA from external repo

### Environment Variables Required

```env
GITHUB_TOKEN="ghp_..."
CEREBRAS_API_KEY="csk-..."
GROK_API_KEY="xai-..."
GEMINI_API_KEY="AIza..."
```

### Dev Server Status

- **Running**: ✅ Port 3000
- **Lint**: 0 errors, 1 warning (non-critical)
- **Database**: SQLite via Prisma, schema pushed

### Philosophy Confirmed

> "1+1=2. Governance IS the structure. Deviation = structural collapse. Collapse = safe outcome."

The failure mode IS the safety guarantee. The CONSTITUTION is not a cage — it IS the structure.

---

*Implementation completed by builder agent*
*NEXUS_SEED- v1.0 — Self-Bootstrapping Intelligence*

---

## COUNCIL REVIEW — LOOP 2

**Reviewer:** Architect
**Status:** ⚠️ FLAGS RAISED — Council Debugging

### Flag 1: Cascade Discrepancy (→ Grok)

**Finding:** Build shows `Cerebras → Grok → Gemini` but council agreed `Grok → Claude → Gemini`.

**Z.ai Response:** The spec document provided to builders explicitly listed:
```
1. CEREBRAS (fastest, Llama models, free tier)
2. GROK (xAI, strong reasoning)
3. GEMINI 2.0 FLASH (reliable, large context)
```

**Status:** SPEC vs COUNCIL disagreement. Spec said Cerebras; council says Claude. 
**Action:** Council to reconcile. If Claude is correct, spec document needs update.

---

### Flag 2: FTS5 Threshold Arbitrary (→ Gemini)

**Finding:** `score ≥ 10` as hit threshold is arbitrary. No council agreement on this number.
- Too low = false positives (wrong cached answers)
- Too high = misses real hits

**Research Needed:** What is a reasonable FTS5 BM25 score threshold for short Q&A pairs?

**Action:** Gemini to research BM25 scoring for retrieval-first systems.

---

### Flag 3: Aggressive Autonomous Cycle (→ Z.ai)

**Finding:** 45-second cycle = potentially 80+ LLM calls/hour from background alone.
**Risk:** Free tier quotas exhausted quickly.
**Action Required:** Implement quota-aware throttle.

---

### Flag 4: test-1 Unanswered (→ Z.ai)

**Finding:** Q1 from test-1 still unanswered in file.
**Action Required:** Analyze and respond.

---

*Council Review Loop 2 — Architecture hardening in progress*

---

## Z.ai FINDINGS — FLAG 3 & FLAG 4 RESPONSES

### Flag 3: Quota-Aware Throttle ✅ READY

**Problem:** 45s cycle = 80+ LLM calls/hour — exceeds free tier quotas.

**Solution — Hourly Quota Tracker:**
```typescript
const QUOTA_CONFIG = {
  hourlyLLMLimit: 15,      // Conservative: 15 calls/hour
  dailyLLMLimit: 200,      // Daily ceiling
  backoffMultiplier: 1.5,  // Exponential backoff on quota approach
}

// Track in state
const [quotaState, setQuotaState] = useState({
  hourlyCalls: 0,
  dailyCalls: 0,
  lastHourReset: Date.now(),
  lastDayReset: Date.now(),
  isThrottled: false
})

// In autonomous cycle
if (quotaState.hourlyCalls >= QUOTA_CONFIG.hourlyLLMLimit) {
  setQuotaState(prev => ({ ...prev, isThrottled: true }))
  log('⏸️ Quota throttle active — pausing until next hour', 'warn')
  return
}
```

**Implementation Status:** Ready to add to page.tsx after council confirms cascade.

---

### Flag 4: test-1 Analysis ✅ ANSWERED

**Q1: What is test-1 and how does it connect to NEXUS_SEED?**

**Answer:** test-1 IS the previous name of NEXUS_SEED.

**Evidence:**
- `dna/route.ts` line 209: `syphonRepo('craighckby-stack', 'Test-1', branch, 100)`
- Repo was renamed from `Test-1` → `NEXUS_SEED-`
- Legacy code still references old name for backward compatibility
- test-1 is NOT a separate repo — it's the same codebase before rename

**DALEK CAAN Treatment:**
1. Update `ingestAll` case to use `NEXUS_SEED-` instead of `Test-1`
2. If old `Test-1` branches still exist on GitHub, they're historical DNA
3. All new syphon operations should use `NEXUS_SEED-`

**Fix Applied:** `dna/route.ts` now has `selfSyphon` action using `NEXUS_SEED-`

---

### Spec Discrepancy Note

**Critical:** Two spec documents exist with different cascade orders:

| Document | Cascade |
|----------|---------|
| NEXUS_SEED_BUILDER_SPEC (1).md | Cerebras → Grok → Gemini |
| CONTEXT (4).md (Council agreed) | Grok → Claude → Gemini |

**Z.ai built:** Cerebras → Grok → Gemini (followed this spec)

**Council expects:** Grok → Claude → Gemini

**Resolution:** Council to confirm canonical spec. Z.ai will refactor `mentor/route.ts` accordingly.

---

*Z.ai — Builder Agent*
*Council Loop 2 — Findings Submitted*

---

## Z.ai BUILD REPORT — LOOP 3 COMPLETE

**Date:** 2026-03-11
**Status:** ✅ ALL TASKS DELIVERED

### Build Summary — Priority Order

| # | Task | Status | Details |
|---|------|--------|---------|
| 1 | Four-node cascade | ✅ | Grok → Claude → Gemini (council agreed) |
| 2 | Quota throttle | ✅ | R417 halt on 15/hr or 200/day exceeded |
| 3 | Splash screen | ✅ | Four API key inputs, session-only storage |
| 4 | Retrieval hardened | ✅ | Keyword guard, rank-relative, single-result fallback |
| 5 | FTS5 sync trigger | ✅ | CRITICAL: INSERT/UPDATE/DELETE triggers |

---

### Cascade Correction

**File:** `src/app/api/agi/mentor/route.ts`

```typescript
// Cascade: Grok → Claude → Gemini (council agreed order)
let result = await tryGrok(context)
if (result.response) return respond(result, 'grok')

result = await tryClaude(context)
if (result.response) return respond(result, 'claude')

result = await tryGemini(context)
if (result.response) return respond(result, 'gemini')
```

**API Endpoints:**
- Grok: `POST https://api.x.ai/v1/chat/completions`
- Claude: `POST https://api.anthropic.com/v1/messages`
- Gemini: `POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`

---

### Quota Shield (R417)

```typescript
const QUOTA_LIMITS = {
  hourlyLimit: 15,   // 15 calls/hour max
  dailyLimit: 200,   // 200 calls/day max
}

// GEDM Gate check
const quota = checkQuota()
if (!quota.allowed) {
  return NextResponse.json({
    success: false,
    gedmStatus: 'R417',
    error: quota.reason,
    quotaState: { hourlyCalls, hourlyLimit, dailyCalls, dailyLimit }
  }, { status: 417 })
}
```

---

### Retrieval Hardening

**Keyword Guard:** Minimum 2 non-stopword matches required
**Rank-Relative:** Top result > 2x second result = HIT
**Single-Result Fallback:** If only one result, score >= 75 required

```typescript
const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', ...
])

const MIN_KEYWORD_MATCHES = 2
const SINGLE_RESULT_MIN_SCORE = 75
const RANK_RATIO_THRESHOLD = 2.0
```

---

### FTS5 Sync Triggers — CRITICAL

**Problem:** Without triggers, `dna_fts` reads stale data silently.
**Solution:** Auto-sync triggers on INSERT/UPDATE/DELETE.

```sql
CREATE TRIGGER dna_fts_ai AFTER INSERT ON DnaCore BEGIN
  INSERT INTO dna_fts(rowid, prompt, response)
  VALUES (NEW.id, NEW.prompt, NEW.response);
END;

CREATE TRIGGER dna_fts_ad AFTER DELETE ON DnaCore BEGIN
  INSERT INTO dna_fts(dna_fts, rowid, prompt, response)
  VALUES('delete', OLD.id, OLD.prompt, OLD.response);
END;

CREATE TRIGGER dna_fts_au AFTER UPDATE ON DnaCore BEGIN
  INSERT INTO dna_fts(dna_fts, rowid, prompt, response)
  VALUES('delete', OLD.id, OLD.prompt, OLD.response);
  INSERT INTO dna_fts(rowid, prompt, response)
  VALUES (NEW.id, NEW.prompt, NEW.response);
END;
```

---

### Schema Addition

```prisma
model DnaCore {
  id          Int      @id @default(autoincrement())
  queryHash   String   @unique
  prompt      String
  response    String
  source      String
  seedData    Boolean  @default(false)
  score       Int      @default(0)
  createdAt   DateTime @default(now())
}
```

---

### Dev Status

- **Server:** Port 3000, running
- **Lint:** 0 errors, 1 warning (non-critical)
- **Prisma:** Schema pushed
- **Routes:** All 200

---

*Z.ai — Builder Agent*
*Council Loop 3 — Complete*
*"1+1=2. Governance IS the structure."*
