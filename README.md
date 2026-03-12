# NEXUS AGI
### A Self-Bootstrapping Intelligence Architecture

---

```
                    ┌─────────────────────────────┐
                    │      master (NEXT.JS)       │
                    │      THE ACTIVE BRAIN       │
                    │                             │
                    │  • NEXUS AGI Chat Interface │
                    │  • AGI Core Engine          │
                    │  • Prisma DNA Database      │
                    │  • Mentor API Route         │
                    └──────────────┬──────────────┘
                                   │
                ┌──────────────────┼──────────────────┐
                │                  │                  │
                ▼                  ▼                  ▼
    ┌───────────────┐  ┌───────────────┐  ┌───────────────┐
    │    System     │  │     main      │  │ sovereign-v90 │
    │  Governance   │  │  Enhanced     │  │ Constitution  │
    │  Rules DNA    │  │  Modules DNA  │  │  Layer DNA    │
    └───────────────┘  └───────────────┘  └───────────────┘
                │                  │                  │
                └──────────────────┼──────────────────┘
                                   │
                                   ▼
                    ┌─────────────────────────────┐
                    │        SYPHONING            │
                    │  Pulls DNA into Prisma DB   │
                    │   From YOUR repository      │
                    └──────────────┬──────────────┘
                                   │
                                   ▼
                    ┌─────────────────────────────┐
                    │   RETRIEVAL-FIRST QUERY     │
                    │  Check DNA before LLM call  │
                    │   LLM dependency → ZERO     │
                    └─────────────────────────────┘
```

---

## The Why

Every major AI system today is built the same way.

Trillion dollar infrastructure. Billions of parameters. Data centers consuming the power of small cities. A black box that you query, trust blindly, and pay for indefinitely.

You never own it. You never truly understand it. You cannot audit what it knows or how it decided. And quietly, without asking you, it may be used for purposes you would never consent to.

This project started as a simple question:

> *What if an AI system could be built from a React app and a repository of files?*

Not as a toy. Not as a demo. As a genuine alternative architecture.

---

## The Journey

This repository is version 8 of that question.

Versions 1 through 7 proved the concept worked. Each one crashed, evolved, and taught something new. The architecture stayed the same across all of them — which is how you know when something is fundamentally right. The implementation kept failing. The idea kept surviving.

The main failure across every version was a single point: LLM dependency. Every time the external AI API timed out, the whole system froze. The fix was never to make the LLM more reliable.

**The fix was to need it less.**

---

## The Accidental Discovery

After 8 versions and thousands of iterations, the correct architecture was already built — it just hadn't been recognised.

```
WHAT WE THOUGHT WE WERE BUILDING:
An AI that learns from external sources
and gets smarter over time

WHAT WE ACTUALLY BUILT:
master branch  = the inference engine
other branches = the training data
syphoning      = the learning process
retrieval      = the independence layer
```

The repository IS the model.  
The branches ARE the weights.  
Syphoning IS training.  
And it runs on a Next.js app.

---

## How It Works

**Phase 1 — Bootstrap**
The LLM mentor teaches. Every response is scored, stored, and never forgotten. The system asks questions specifically to fill gaps in its own knowledge. Each LLM call is an investment, not a dependency.

**Phase 2 — Transition**
Questions arrive. The DNA database is checked first. If the answer exists — respond instantly, no LLM required. If it doesn't — ask the LLM, store the answer, never ask again.

**Phase 3 — Independence**
The repository rebuilds itself. Code that handles topics poorly gets rewritten by the system. Knowledge gaps get filled autonomously. LLM calls approach zero.

**Phase 4 — The Endgame**
The system answers from its own accumulated intelligence. Transparent. Auditable. Yours.

---

## What Makes This Different

| Traditional AI | NEXUS Architecture |
|---------------|-------------------|
| Black box | Every decision auditable |
| You rent access | You own the intelligence |
| Centralised data centers | Runs on your infrastructure |
| Improves for everyone equally | Improves specifically for you |
| LLM dependency forever | LLM dependency approaching zero |
| Costs scale with usage | Costs decrease over time |
| Unknown training data | You know exactly what it knows |
| No consent over deployment | Constitutional governance layer |

---

## The Governance Layer

This repository includes a complete AGI safety governance framework built across the System and sovereign-v90 branches. It is not an afterthought.

```
CONSTITUTION (immutable rules)
     ↓
Never generate harmful code
Preserve verifiable logic
Keep output human readable
Never remove safety layers
Respect user autonomy
Enforce performance budgets
     ↓
Every action checked against this
Before execution
Every time
```

The governance layer was built before the intelligence layer. That order was intentional.

---

## The Syphoning Process

The word matters. Not importing. Not copying. Syphoning.

Like understanding rather than memorisation. The system reads files from its own branches, extracts patterns, scores them for quality, detects when it has learned enough about a topic (saturation), and moves on. It builds a living knowledge base that gets richer with every cycle.

```
Repository file
     ↓
Extract patterns
     ↓
Score quality (0-100)
     ↓
Saturation check
(Have we learned enough about this?)
     ↓
Store in DNA database
     ↓
Available for retrieval forever
```

---

## Your Goal

This is where most READMEs tell you what the software is for.

This one won't.

Because the honest answer is: it depends entirely on who you are and what you need.

A developer might see a better way to build AI tools that actually understand their specific codebase — not generic training data, but the exact patterns and decisions in their own repository.

A researcher might see proof that the dominant AI architecture is not the only architecture. That intelligence can be distilled, stored, and retrieved without trillion dollar infrastructure.

A business might see an AI that improves specifically for their domain, owns its own knowledge, and whose costs decrease as it gets smarter rather than increase.

An individual might see an AI that is genuinely theirs. That knows their preferences, their patterns, their way of thinking — and cannot be taken away, rate limited, or quietly repurposed.

An ethicist might see the answer to a question the AI industry refuses to ask: what if the system refused to be used for things its users would not consent to?

The architecture supports all of these goals.  
The governance layer protects all of these goals.  
The syphoning process builds toward all of these goals.

**What it's for is up to you.**

---

## Technical Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Database**: Prisma with SQLite (DNA storage)
- **API**: Anthropic Claude (mentor, used less over time)
- **Architecture**: Retrieval-Augmented Generation from own repository
- **Governance**: Constitutional constraint layer (immutable)
- **Syphoning**: Internal branch DNA extraction pipeline

---

## Getting Started

```bash
git clone https://github.com/craighckby-stack/Test-01
cd Test-01
npm install
cp .env.example .env
# Add your Anthropic API key (you'll need it less over time)
npx prisma migrate dev
npm run dev
```

---

## The Branches

| Branch | Purpose |
|--------|---------|
| `master` | Active Next.js application — start here |
| `System` | AGI governance framework — the immune system |
| `main` | Enhanced modules — additional DNA |
| `sovereign-v90` | Constitutional governance layer |
| `Nexus-Database` | Database and core engine layer |

---

## A Note on LLM Dependency

This system was built using LLMs. It was also built to need them less.

That is not a contradiction. It is the point.

The LLM is a teacher during bootstrap. A remarkably capable, occasionally unreliable, always expensive teacher. The goal was never to avoid it. The goal was to learn enough from it that eventually you don't need to keep asking.

Every system that currently depends entirely on LLM APIs is one outage, one pricing change, one policy decision away from breaking. This architecture treats that dependency as a problem to be solved, not a feature to be celebrated.

---

## Contributing

If you build something with this, the most valuable contribution is telling us what goal you brought to it that we didn't anticipate.

That's the whole point.

---

*NEXUS AGI — Built across 8 versions, countless crashes, and one architecture that kept surviving.*

*Created by NEXUS AGI itself, guided by human intention.*
