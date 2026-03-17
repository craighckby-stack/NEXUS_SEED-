# NEXUS_SEED — Self-Bootstrapping AGI

## What This Is
A self-evolving AGI that learns to answer from its own accumulated knowledge (DNA), progressively reducing dependency on external LLMs. The system gets cheaper and smarter over time. Goal: DNA retrieval rate approaches 100%.

---

## Stack
- **Runtime**: Node.js backend (no cloud infrastructure needed)
- **Database**: SQLite — stores all learned patterns, Q&A pairs, DNA mutations
- **LLM Cascade**: Grok → Claude → Gemini (free tiers, $0 budget, fails over on quota hit)
- **Repo**: craighckby-stack/NEXUS_SEED-

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
    └── MISS → try Grok API
                  ↓ quota hit?
               try Claude API
                  ↓ quota hit?
               try Gemini API
                  ↓
               store answer in dna_core + sync dna_fts
```

---

## Real API Endpoints — Verified by Gemini

**Grok (xAI)**
- Endpoint: `POST https://api.x.ai/v1/chat/completions`
- Headers: `Authorization: Bearer <API_KEY>`, `Content-Type: application/json`
- Models: `grok-3-mini` (default), `grok-3` (heavy tasks)
- Payload: `{ "model": "grok-3-mini", "messages": [{"role":"system","content":"..."},{"role":"user","content":"..."}] }`

**Claude (Anthropic)**
- Endpoint: `POST https://api.anthropic.com/v1/messages`
- Headers: `x-api-key: <API_KEY>`, `anthropic-version: 2023-06-01`, `Content-Type: application/json`
- Model: `claude-haiku-4-5-20251001` (cheapest/fastest)
- Payload: `{ "model": "claude-haiku-4-5-20251001", "max_tokens": 1024, "messages": [...] }`

**Gemini (Google)**
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

**Build order:**
1. SQLite init — create `dna_core` + `dna_fts` with WAL pragma (use corrected INTEGER id schema above)
2. LLM cascade module — wire Grok → Claude → Gemini using exact endpoints above, quota detection on 429/503
3. DALEK CAAN syphon — implement Strategy B (shallow clone) as default, Strategy A for metadata only
4. Bootstrap seed — on first run, syphon own repo + generate 50–100 synthetic Q&A pairs, mark `seed_data=1`
5. GEDM gate — R200/R417 check wrapping every execution, sovereign-v90 rules hardcoded immutable
6. Splash screen — API key inputs for Grok, Claude, Gemini, store in session only (never write keys to disk)
7. DOS terminal UI — black screen, monospace, AGI speaks first, user responds

> Z.ai findings / questions / blockers: [ add here ]

---

## Open Questions — Council Must Answer These

These are unresolved. Every node that reads this file should attempt to answer or add thinking below each one. Do not delete the question — add your answer beneath it.

### Q1 — What is test-1 and how does it connect to NEXUS_SEED?
Is test-1 a sandboxed mutation branch, a DNA seed dataset, a safe trial environment before promoting to main, or something else entirely? This determines how DALEK CAAN treats it during syphon cycles.

> Claude: Unknown without repo access. Grok or Z.ai — please analyse test-1 repo and add findings below.
> Grok: [ analyse craighckby-stack/test-1 and add here — what is it, what does it contain, how does it relate to NEXUS_SEED ]
> Gemini: [ add here ]
> Z.ai: [ add here — you have full repo access, drag test-1 and describe its role ]

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
