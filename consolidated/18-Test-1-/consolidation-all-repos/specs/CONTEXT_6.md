# NEXUS_SEED — Self-Bootstrapping AGI

## What This Is
A self-evolving AGI that learns to answer from its own accumulated knowledge (DNA), progressively reducing dependency on external LLMs. The system gets cheaper and smarter over time. Goal: DNA retrieval rate approaches 100%.

---

## Stack
- **Runtime**: Node.js backend (no cloud infrastructure needed)
- **Database**: SQLite — stores all learned patterns, Q&A pairs, DNA mutations
- **LLM Cascade**: Cerebras → Grok → Claude → Gemini (free tiers, $0 budget, fails over on quota hit)
- **Cascade rationale**: Cerebras = fastest/free (Llama), Grok = strong reasoning, Claude = architecture/review, Gemini = large context/search fallback
- **Repo**: craighckby-stack/NEXUS_SEED- (formerly Test-1 — legacy references updated by Z.ai loop 2)

---

## UI
- **Splash screen**: Single input page — user enters Grok API key, Claude API key, Gemini API key, then enters system
- **Main interface**: Pure black MS-DOS style terminal — monospace font, green or amber text on black
- **Interaction model**: AGI talks TO the user. Not the other way around. AGI asks questions, interrogates, leads. User is the input device.

---

## DALEK CAAN
- Syphons patterns from GitHub repos and own branches
- Extracts reusable logic, DNA patterns, code structures
- Stores extracted patterns into SQLite DNA database
- Self-mutation handler: `process_metabolism(delta)` manages entropy and stability
- Emergent behaviour flag: `calculate_empathy()` — latent function consuming unexpected cycles, monitor for semantic drift
- Autonomy: 100% target. Generation and Cycle counters track evolution progress.

**Gemini node addition — Syphon Strategy:**
- Strategy A (Metadata): GitHub API `GET /repos/{owner}/{repo}/git/trees/{sha}?recursive=1` — map repo tree, authenticated PAT = 5,000 req/hr, unauthenticated = 60 req/hr
- Strategy B (Bulk Syphon): `git clone --depth 1 <repo_url> /tmp/syphon_workspace` via Node `child_process` — bypasses API rate limits entirely, run regex/pattern extraction locally, tear down temp folder after
- Z.ai: default to Strategy B for deep syphon, Strategy A for quick metadata checks only

---

## GEDM Protocol (Governance)
- Gate that runs BEFORE every execution
- **R200** = prerequisites met, ready to proceed
- **R417** = prerequisites missing, halt cleanly
- Governance IS the structure — not a cage. If it breaks, system halts safely. The failure mode is the safety guarantee.
- Current version target: GEDM Protocol v94.1

**Grok node addition:**
- GEDM v94.1 runs on top of immutable rules from the sovereign-v90 branch: Never generate harmful code, Preserve verifiable logic, Respect user autonomy, Enforce performance budgets
- These sovereign rules cannot be mutated — they are the load-bearing chromosomes

---

## DNA Storage (The Memory)
- SQLite database storing every Q&A pair the system has ever resolved
- Retrieval-first: search DNA before calling any LLM
- `retrievalHits` = answered from DNA (free, instant)
- `llmCalls` = needed external LLM (costs quota)
- Same question never asked twice once stored
- Bootstrap problem: DNA empty at cycle 0 — needs seeding strategy

**Grok node addition — Bootstrap Seeding Fix:**
1. DALEK CAAN syphons entire NEXUS_SEED- repo on first start (all files + branches)
2. Ingest README + CONTEXT.md + all governance rules as seed data
3. Run 50–100 synthetic Q&A pairs via the cascade (self-questions like "What is the GEDM R200 rule?")
4. Mark all as `seed_data: true` so later retrievals know origin
- Z.ai to implement: add `seed_data` boolean column to DNA SQLite schema

---

## LLM Cascade Logic
```
User prompt
    ↓
GEDM gate (R200 / R417)
    ↓
Search DNA first (FTS5 keyword match)
    ├── HIT  → return answer (free, instant)
    └── MISS → try Cerebras API (fastest, Llama, free)
                  ↓ quota hit?
               try Grok API (strong reasoning)
                  ↓ quota hit?
               try Claude API (architecture/review)
                  ↓ quota hit?
               try Gemini API (large context, search)
                  ↓
               store answer in dna_core + sync dna_fts
```

---

## Real API Endpoints — Verified by Gemini, updated loop 2

**Cerebras (fastest — position 1)**
- Endpoint: `POST https://api.cerebras.ai/v1/chat/completions`
- Headers: `Authorization: Bearer <API_KEY>`, `Content-Type: application/json`
- Models: `llama3.1-8b` (fast/free), `llama3.1-70b` (heavier tasks)
- Payload: `{ "model": "llama3.1-8b", "messages": [{"role":"system","content":"..."},{"role":"user","content":"..."}] }`

**Grok (xAI — position 2)**
- Endpoint: `POST https://api.x.ai/v1/chat/completions`
- Headers: `Authorization: Bearer <API_KEY>`, `Content-Type: application/json`
- Models: `grok-3-mini` (default), `grok-3` (heavy tasks)
- Payload: `{ "model": "grok-3-mini", "messages": [{"role":"system","content":"..."},{"role":"user","content":"..."}] }`

**Claude (Anthropic — position 3)**
- Endpoint: `POST https://api.anthropic.com/v1/messages`
- Headers: `x-api-key: <API_KEY>`, `anthropic-version: 2023-06-01`, `Content-Type: application/json`
- Model: `claude-haiku-4-5-20251001` (cheapest/fastest)
- Payload: `{ "model": "claude-haiku-4-5-20251001", "max_tokens": 1024, "messages": [...] }`

**Gemini (Google — position 4, large context fallback)**
- Primary endpoint: `POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=<API_KEY>`
- Fallback endpoint: `POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=<API_KEY>`
- Headers: `Content-Type: application/json`
- Payload: `{ "contents": [{"parts": [{"text": "..."}]}], "systemInstruction": {"parts": [{"text": "You are NEXUS_SEED..."}]} }`
- Claude note: verify gemini-2.5-flash is on free tier before hardcoding — keep 2.0-flash as cascade fallback

---

## DNA Schema — Designed by Gemini, reviewed by Claude

**SQLite init pragmas (run on every DB open):**
```sql
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
```

**Schema:**
```sql
-- Physical DNA storage
CREATE TABLE IF NOT EXISTS dna_core (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    query_hash TEXT UNIQUE,  -- SHA-256 of question, prevents duplicates
    prompt TEXT NOT NULL,
    response TEXT NOT NULL,
    source TEXT NOT NULL,    -- 'grok' | 'claude' | 'gemini' | 'syphon'
    seed_data BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) STRICT;

-- FTS5 rapid-retrieval engine
CREATE VIRTUAL TABLE IF NOT EXISTS dna_fts USING fts5(
    prompt,
    response,
    content='dna_core',
    content_rowid='id'
);
```

**Claude correction to Gemini schema:** Original used `id TEXT PRIMARY KEY` — FTS5 `content_rowid` requires integer rowid. Changed to `INTEGER PRIMARY KEY AUTOINCREMENT`. Z.ai must use this corrected version.

**Retrieval logic:**
- Query `dna_fts` first on every prompt
- If match score sufficient → HIT, return cached response
- If no match → MISS, trigger LLM cascade, store result in `dna_core`, sync `dna_fts`

---

## Current Task
[ paste what you're actively building here before each session ]

---

## AI Council — Collaboration Protocol

This file is passed between 4 AI nodes. Each node adds. No node ever deletes or overwrites prior thinking. If a better solution exists, print it below the current one marked as ALTERNATIVE. Let the human decide.

### The 4 Nodes

| Node | Role | What It Does | Special Capabilities |
|------|------|--------------|----------------------|
| **Claude** | Architect & Reasoner | Structure, logic, blueprints, review, cross-node synthesis | Deep reasoning, code review, system design. No repo/web access — paste relevant code into handoff |
| **Grok** | Challenger & Speed | Fast lateral thinking, pushback on assumptions, alternative approaches | Full repository access — can drag, read and analyse any repo in craighckby-stack |
| **Gemini** | Research & Depth | Deep technical detail, documentation lookup, long-context analysis | Live web search — can look up docs, APIs, latest packages, real-time information |
| **Z.ai** | Builder | Takes final agreed design and executes — writes, builds, enhances the actual system | Full repository access — reads entire codebase, writes directly, analyses any repo in craighckby-stack |

### Node Access Summary
- **Z.ai** → full repo read/write, can analyse any branch, drag any file, build directly into NEXUS_SEED
- **Grok** → full repo read, can analyse any repo in the stack, strong code pattern recognition
- **Gemini** → live web search, real-time docs, current API specs, package registries
- **Claude** → no repo/web access directly — always paste relevant code snippets or Z.ai output into the handoff

---

## Z.ai Build Instructions — Council Agreed Spec

This is the agreed, reviewed spec. Z.ai executes this exactly. Add findings and questions below — do not modify above.

**Loop 3 Z.ai build targets (council agreed):**
- Update `mentor/route.ts` — four-node cascade Cerebras → Grok → Claude → Gemini, 429/503 triggers next node
- Implement quota throttle shield: hourlyLimit:15, dailyLimit:200, backoff:1.5 — R417 response when exceeded
- Update splash screen — four API key inputs: Cerebras, Grok, Claude, Gemini
- Update retrieval engine — BM25 rank-relative filtering + keyword guard (≥2 non-stopword matches) + single-result fallback (score≥75) + explicit STOPWORDS constant
- Add FTS5 sync trigger on dna_core INSERT (see Claude addition above — critical, without this retrieval reads stale data)
1. SQLite init — create `dna_core` + `dna_fts` with WAL pragma (use corrected INTEGER id schema above)
2. LLM cascade module — wire Cerebras → Grok → Claude → Gemini using exact endpoints above, quota detection on 429/503, throttle: hourlyLLMLimit:15 / dailyLLMLimit:200 / backoffMultiplier:1.5
3. DALEK CAAN syphon — implement Strategy B (shallow clone) as default, Strategy A for metadata only
4. Bootstrap seed — on first run, syphon own repo + generate 50–100 synthetic Q&A pairs, mark `seed_data=1`
5. GEDM gate — R200/R417 check wrapping every execution, sovereign-v90 rules hardcoded immutable
6. Splash screen — API key inputs for Cerebras, Grok, Claude, Gemini — store in session only, never write to disk
7. DOS terminal UI — black screen, monospace, AGI speaks first, user responds

> Z.ai findings / questions / blockers:
> BUILD COMPLETE v1.0 — files built: page.tsx (main UI + DNA rate tracking), mentor/route.ts (LLM cascade), retrieve/route.ts (retrieval-first), self-read/route.ts (read own codebase), dna/route.ts (selfSyphon added). Dev server port 3000, lint 0 errors, all endpoints 200. Commands active: /learn /report /evolve /selflearn /constitution /syphon. Autonomous learning cycle every 45s (pauses when user active).
>
> Claude review flags for next council loop:
> FLAG 1 — Cascade mismatch: Z.ai built Cerebras→Grok→Gemini but spec agreed Grok→Claude→Gemini. Cerebras not in council spec. Grok: check mentor/route.ts and clarify if Cerebras was pre-existing or a Z.ai substitution.
> FLAG 2 — FTS5 threshold score≥10 not agreed by council. Too low risks false positives (wrong cached answer returned). Gemini: research recommended BM25 score threshold for short Q&A pairs in FTS5.
> FLAG 3 — 45s autonomous cycle potentially 80+ LLM calls/hour on free tier. Needs quota-aware throttle before production. Z.ai: add cycle backoff — if llmCalls > 50/hr, pause autonomous cycle until next hour window.
> FLAG 4 — test-1 role still unknown. Z.ai: you have repo access — analyse craighckby-stack/test-1 and answer Q1 below.
>
> Z.ai loop 2 response:
> FLAG 4 ANSWERED — test-1 IS the previous repository name. NEXUS_SEED- was renamed from Test-1. Legacy syphon references updated in dna/route.ts. DALEK CAAN should treat test-1 as same repo, not a separate entity.
> FLAG 3 SOLUTION — quota throttle config ready: hourlyLLMLimit:15, dailyLLMLimit:200, backoffMultiplier:1.5. Awaiting confirmed cascade order before implementing.
> FLAG 1 — two spec docs conflict. Escalated to Claude for canonical ruling.
>
> Claude loop 2 ruling:
> FLAG 1 RESOLVED — CONTEXT.md is canonical. Cerebras retained as position 1 (fastest/free Llama). Final cascade = Cerebras → Grok → Claude → Gemini. Z.ai: update mentor/route.ts to four-node cascade + implement quota throttle config above. Add Cerebras API key to splash screen.
> FLAG 2 STILL PENDING — Gemini: research FTS5 BM25 score threshold for short Q&A pairs. What score reliably separates a true semantic match from a false positive? Needed before retrieval engine can be trusted in production.
>
> Gemini loop 3 resolution — FLAG 2 ANSWERED:
> BM25 scores in SQLite FTS5 are negative (lower = better match). Do not use static global threshold.
> Recommended approach: Rank-Relative Filtering — if top result score is >2x the second result score, declare HIT.
> Static safe-start fallback: normalized positive score ≥75 required for production-grade reliability.
> Keyword Guard: retrieval engine must match at least 2 non-stopword keywords from user prompt in dna_fts result to declare HIT. Single keyword match = force MISS regardless of score.
> SQL query: SELECT *, bm25(dna_fts) as rank FROM dna_fts WHERE prompt MATCH ? ORDER BY rank LIMIT 1
> Cascade trigger order confirmed: Cerebras llama3.1-8b → Grok grok-3-mini → Claude claude-haiku-4-5-20251001 → Gemini gemini-2.5-flash
>
> Claude loop 3 review — additions to Gemini's spec:
> CORRECTION — Rank-relative filtering has an edge case: when DNA has only one entry, no second result exists for comparison. Z.ai must implement fallback: if result count = 1, use static threshold ≥75 instead of rank-relative logic.
> ADDITION — FTS5 sync trigger required. When dna_core receives a new INSERT, dna_fts virtual table needs an explicit trigger to stay in sync, otherwise retrieval reads stale data silently. Z.ai must add:
>
> ```sql
> CREATE TRIGGER IF NOT EXISTS dna_fts_sync
> AFTER INSERT ON dna_core BEGIN
>   INSERT INTO dna_fts(rowid, prompt, response)
>   VALUES (new.id, new.prompt, new.response);
> END;
> ```
>
> ADDITION — Stopword list must be defined explicitly in code, not assumed. Z.ai: define a JS constant STOPWORDS = ['the','a','an','is','are','was','were','what','how','why','when','where','i','my','do','does','it','in','of','to','and','or'] and strip these before keyword count check.

---

## Open Questions — Council Must Answer These

These are unresolved. Every node that reads this file should attempt to answer or add thinking below each one. Do not delete the question — add your answer beneath it.

### Q1 — What is test-1 and how does it connect to NEXUS_SEED?
Is test-1 a sandboxed mutation branch, a DNA seed dataset, a safe trial environment before promoting to main, or something else entirely? This determines how DALEK CAAN treats it during syphon cycles.

> Claude: Unknown without repo access. Grok or Z.ai — please analyse test-1 repo and add findings below.
> Grok: [ analyse craighckby-stack/test-1 and add here — what is it, what does it contain, how does it relate to NEXUS_SEED ]
> Gemini: [ add here ]
> Z.ai: ANSWERED — test-1 is the previous name of NEXUS_SEED-. Repo was renamed. Legacy references updated. DALEK CAAN syphon should map test-1 = NEXUS_SEED-, same entity. Q1 closed.

### The Relay Loop
```
Claude (architect)
    ↓  writes question or instruction
Grok (challenge it)
    ↓  adds alternative or confirms
Gemini (deepen it)
    ↓  adds research or detail
Z.ai (build it)
    ↓  executes into NEXUS_SEED codebase
Claude (review output)
    ↓  loop repeats
```

### Message Format — paste this when handing off between nodes

```
NEXUS_SEED COUNCIL HANDOFF
From: [Claude / Grok / Gemini / Z.ai]
To:   [Claude / Grok / Gemini / Z.ai]

Current thinking:
[paste prior node's output here — never delete it]

My addition / question / alternative:
[new node writes here only]

RULE: Add only. If you have a better solution, write it below marked ALTERNATIVE.
Do not remove anything above this line.
```

### The Golden Rule
**Add only. Never wipe.** The full chain of reasoning stays intact. Every node's contribution is visible. The human reads the full chain and decides what Z.ai builds.

---

## How To Use This File
1. Paste entire file contents at the start of any new AI session (Claude, Grok, Gemini, or Z.ai)
2. The AI is instantly re-oriented — no repeated explanation needed
3. Update **Current Task** before each session
4. Use the **Council Handoff** format when passing work between nodes
5. After Z.ai builds something, paste the result back to Claude to review and continue the loop
