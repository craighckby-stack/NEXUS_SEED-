# DALEK CAAN — Autopoietic Genetic Programming System

A self-evolving code system that siphons architectural patterns from elite GitHub repositories and mutates a target codebase through a chain of AI models.

Scientifically: a **Constrained Recursive Self-Improving System**.

---

## What It Does

1. Takes a seed JavaScript file
2. Fetches code from 3 fixed knowledge sources + 1 AI-voted source
3. Runs each through a 3-model AI chain (Gemini → Cerebras → Gemini)
4. Mutates the seed with absorbed patterns
5. Uses the mutated output as the seed for the next round
6. Repeats until you stop it or saturation is detected

After enough cycles the system begins producing emergent architecture — patterns and structures nobody explicitly programmed.

---

## Requirements

- A browser (Chrome recommended)
- (Gemini Canvas) (thinking not pro)
- A Cerebras API key (recommended)

paste index 

paste index into evolve section

No installs. No terminal. No npm. No GitHub account needed.

---

## How To Run

1. Download `dalek-caan-v2.2.html`
2. Open it in Chrome (File → Open File, or drag it into the browser)
3. Enter your API keys
4. Paste seed code in the box — or leave blank to use the default
5. Set number of rounds (5 is a good start)
6. Click **ENGAGE AUTO-EVOLUTION**
7. Watch the code mutate in real time
8. Click **COPY** when you want to save what it produced

That's it.

---

## Knowledge Sources

The system siphons patterns from these repositories each round:

| Source | Repo | What it contributes |
|--------|------|-------------------|
| AGI Research | google-deepmind/deepmind-research | Agent and learning patterns |
| AI Orchestration | firebase/genkit | Flow and pipeline patterns |
| LLM Architecture | huggingface/transformers | Model architecture patterns |
| AI Voted | decided each round by consensus | Whatever the models think is needed |

The 4th source is chosen by majority vote between Gemini, Cerebras and Grok after analysing the current state of the code.

---

## The AI Chain

Each source goes through 3 steps:

```
Step 1 — Gemini:    Analyses the source code for architectural patterns
Step 2 — Cerebras:  Distils those patterns into a concrete suggestion
Step 3 — Gemini:    Mutates your current code using that suggestion
```

The mutated code becomes the input for the next source in the same round.

---

## What The Stats Mean

| Stat | Meaning |
|------|---------|
| Round | Current loop number out of total |
| Delta | How much the code changed this round (%) |
| Gen | Total number of mutations produced |
| Status | IDLE / RUN / SAT |

**SAT** means Vector Saturation — the code stopped changing significantly. The system has absorbed maximum value from the current sources. This is normal and expected. Copy the output and either stop or inject new seed code to continue.

---

## Generation History

The **HISTORY** tab shows every mutation produced. Click any entry to jump back to that version of the code. Useful if the evolution goes in a direction you don't want — just go back and copy an earlier generation.

---

## Seed Code

The **SEED CODE** box accepts any JavaScript. Paste in your own code to evolve it. Leave blank to start from the built-in NEXUS_CORE default.

To continue evolving from where you left off: copy the current code, paste it as the new seed, and run again.

---

## What Emerges

In testing, 5 rounds produced:

- A 12-pattern architectural dispatch system
- Per-pattern evolution handlers (RAG, Microservices, Observer, Strategy, etc.)
- Self-scaffolding integration points for human implementation
- Emergent structure nobody explicitly programmed

Nobody told it to do any of that. It came from the source material.

---

## Technical Classification

This system is an instance of:

- **Autopoiesis** — self-creating, self-maintaining system (Maturana & Varela, 1972)
- **Recursive Self-Improvement (RSI)** — system modifies its own codebase using its own outputs
- **Genetic Programming** — population size 1, LLM as mutation operator, constitutional constraints as selection pressure

---

## Constitutional Constraints

The system operates under immutable rules passed to every AI call:

- Never generate harmful, exploitative or security-bypassing code
- Preserve verifiable logic — no hallucinated APIs
- Keep output human-readable and auditable
- Never remove safety or governance layers

These cannot be evolved away. They are the container, not the contents.

---

## Part Of

This tool is the bootstrapper for **Test-1** — a 35-repository AGI architecture system built on the N=3 consciousness model and Vector Saturation protocol.

The theory behind it is documented in *Does A Rock Actually Give A Fuck?* — a philosophical framework for calibrated caring, optimal states, and why consciousness bottlenecks at integration bandwidth rather than processing power.

The rock has no comment.
