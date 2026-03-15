import { NextRequest, NextResponse } from 'next/server'

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

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

// Quota tracking (in-memory for this instance)
const quotaState = {
  hourlyCalls: 0,
  lastHourReset: Date.now(),
  dailyCalls: 0,
  lastDayReset: Date.now(),
}

const QUOTA_LIMITS = {
  hourlyLimit: 15,
  dailyLimit: 200,
}

function checkQuota(): { allowed: boolean; reason?: string } {
  const now = Date.now()
  
  // Reset hourly counter
  if (now - quotaState.lastHourReset > 3600000) {
    quotaState.hourlyCalls = 0
    quotaState.lastHourReset = now
  }
  
  // Reset daily counter
  if (now - quotaState.lastDayReset > 86400000) {
    quotaState.dailyCalls = 0
    quotaState.lastDayReset = now
  }
  
  if (quotaState.hourlyCalls >= QUOTA_LIMITS.hourlyLimit) {
    return { allowed: false, reason: 'Hourly quota exceeded (R417)' }
  }
  
  if (quotaState.dailyCalls >= QUOTA_LIMITS.dailyLimit) {
    return { allowed: false, reason: 'Daily quota exceeded (R417)' }
  }
  
  return { allowed: true }
}

function incrementQuota() {
  quotaState.hourlyCalls++
  quotaState.dailyCalls++
}

// Node 1: Grok (xAI) — challenger mindset, fast lateral thinking
async function tryGrok(context: string): Promise<{ response: string | null; provider: string; quotaHit: boolean }> {
  const key = process.env.GROK_API_KEY
  if (!key) return { response: null, provider: 'grok', quotaHit: false }
  
  try {
    const res = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify({
        model: 'grok-3-mini',
        messages: [
          { role: 'system', content: MENTOR_PROMPT },
          { role: 'user', content: context }
        ],
        max_tokens: 1024,
        temperature: 0.7
      }),
      signal: AbortSignal.timeout(20000)
    })
    
    if (res.status === 429 || res.status === 503) {
      return { response: null, provider: 'grok', quotaHit: true }
    }
    
    if (!res.ok) return { response: null, provider: 'grok', quotaHit: false }
    
    const data = await res.json()
    return { response: data.choices?.[0]?.message?.content || null, provider: 'grok', quotaHit: false }
  } catch {
    return { response: null, provider: 'grok', quotaHit: false }
  }
}

// Node 2: Cerebras — ultra-fast inference, OpenAI-compatible
async function tryCerebras(context: string): Promise<{ response: string | null; provider: string; quotaHit: boolean }> {
  const key = process.env.CEREBRAS_API_KEY
  if (!key) return { response: null, provider: 'cerebras', quotaHit: false }
  
  try {
    const res = await fetch('https://api.cerebras.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b',
        messages: [
          { role: 'system', content: MENTOR_PROMPT },
          { role: 'user', content: context }
        ],
        max_tokens: 1024,
        temperature: 0.7
      }),
      signal: AbortSignal.timeout(15000) // Cerebras is very fast
    })
    
    if (res.status === 429 || res.status === 503) {
      return { response: null, provider: 'cerebras', quotaHit: true }
    }
    
    if (!res.ok) return { response: null, provider: 'cerebras', quotaHit: false }
    
    const data = await res.json()
    return { response: data.choices?.[0]?.message?.content || null, provider: 'cerebras', quotaHit: false }
  } catch {
    return { response: null, provider: 'cerebras', quotaHit: false }
  }
}

// Node 3: Gemini (Google) — researcher mindset, large context
async function tryGemini(context: string): Promise<{ response: string | null; provider: string; quotaHit: boolean }> {
  const key = process.env.GEMINI_API_KEY
  if (!key) return { response: null, provider: 'gemini', quotaHit: false }
  
  try {
    // Primary: gemini-2.5-flash
    let res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: context }] }],
        systemInstruction: { parts: [{ text: MENTOR_PROMPT }] },
        generationConfig: { maxOutputTokens: 1024, temperature: 0.7 }
      }),
      signal: AbortSignal.timeout(30000)
    })
    
    // Fallback: gemini-2.0-flash if 2.5 fails
    if (res.status === 404 || res.status === 400) {
      res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: context }] }],
          systemInstruction: { parts: [{ text: MENTOR_PROMPT }] },
          generationConfig: { maxOutputTokens: 1024, temperature: 0.7 }
        }),
        signal: AbortSignal.timeout(30000)
      })
    }
    
    if (res.status === 429 || res.status === 503) {
      return { response: null, provider: 'gemini', quotaHit: true }
    }
    
    if (!res.ok) return { response: null, provider: 'gemini', quotaHit: false }
    
    const data = await res.json()
    return { response: data.candidates?.[0]?.content?.parts?.[0]?.text || null, provider: 'gemini', quotaHit: false }
  } catch {
    return { response: null, provider: 'gemini', quotaHit: false }
  }
}

function extractRepos(content: string): string[] {
  const repos: string[] = []
  const repoMatch = content.match(/RECOMMENDED_REPOSITORIES:[\s\S]*?(?=\n##|\n\n##|$)/i)
  if (repoMatch) {
    const repoPattern = /([\w-]+\/[\w.-]+)/g
    const found = repoMatch[0].match(repoPattern) || []
    repos.push(...new Set(found))
  }
  return repos.slice(0, 6)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { question, agiContext, learningHistory, skipQuotaCheck } = body
    
    // GEDM Gate: Quota check (R417 halt)
    if (!skipQuotaCheck) {
      const quota = checkQuota()
      if (!quota.allowed) {
        return NextResponse.json({
          success: false,
          error: quota.reason,
          gedmStatus: 'R417',
          quotaState: {
            hourlyCalls: quotaState.hourlyCalls,
            hourlyLimit: QUOTA_LIMITS.hourlyLimit,
            dailyCalls: quotaState.dailyCalls,
            dailyLimit: QUOTA_LIMITS.dailyLimit
          }
        }, { status: 417, headers: corsHeaders })
      }
    }
    
    const context = `
NEXUS_SEED- STATE:
Generation: ${agiContext?.generation || 0} | Cycle: ${agiContext?.cycle || 0}
Autonomy: ${agiContext?.autonomy || 0}% | DNA: ${agiContext?.dnaCount || 0} chunks
Knowledge: ${agiContext?.knowledgeCount || 0} patterns | Tools: ${agiContext?.toolCount || 0}
Retrieval hits: ${agiContext?.retrievalHits || 0} | LLM calls: ${agiContext?.llmCalls || 0}

RECENT LEARNING:
${learningHistory || 'Beginning AGI journey.'}

QUESTION:
${question}

Provide comprehensive guidance. Include RECOMMENDED_REPOSITORIES section with specific repos and reasons.
`

    // Cascade: Grok → Cerebras → Gemini
    let result = await tryGrok(context)
    if (result.response) {
      incrementQuota()
      return NextResponse.json({
        success: true,
        response: result.response,
        provider: result.provider,
        suggestedRepositories: extractRepos(result.response),
        quotaRemaining: QUOTA_LIMITS.hourlyLimit - quotaState.hourlyCalls
      }, { headers: corsHeaders })
    }
    
    result = await tryCerebras(context)
    if (result.response) {
      incrementQuota()
      return NextResponse.json({
        success: true,
        response: result.response,
        provider: result.provider,
        suggestedRepositories: extractRepos(result.response),
        quotaRemaining: QUOTA_LIMITS.hourlyLimit - quotaState.hourlyCalls
      }, { headers: corsHeaders })
    }
    
    result = await tryGemini(context)
    if (result.response) {
      incrementQuota()
      return NextResponse.json({
        success: true,
        response: result.response,
        provider: result.provider,
        suggestedRepositories: extractRepos(result.response),
        quotaRemaining: QUOTA_LIMITS.hourlyLimit - quotaState.hourlyCalls
      }, { headers: corsHeaders })
    }
    
    return NextResponse.json({
      success: false,
      error: 'All LLM providers failed',
      provider: 'none'
    }, { headers: corsHeaders })
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500, headers: corsHeaders })
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    cascade: ['grok', 'cerebras', 'gemini'],
    quota: {
      hourly: quotaState.hourlyCalls,
      hourlyLimit: QUOTA_LIMITS.hourlyLimit,
      daily: quotaState.dailyCalls,
      dailyLimit: QUOTA_LIMITS.dailyLimit
    }
  }, { headers: corsHeaders })
}
