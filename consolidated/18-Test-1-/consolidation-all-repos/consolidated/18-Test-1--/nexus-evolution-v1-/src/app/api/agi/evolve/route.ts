import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import crypto from 'crypto';

const DEFAULT_SEED = `// NEXUS_CORE AGI v1.0
class NexusCore {
  static VERSION = "1.0.0";
  constructor() {
    this.status = 'INIT';
    this.memory = new MemorySystem();
    this.reasoning = new ReasoningEngine();
    this.learning = new LearningModule();
    this.agents = new AgentOrchestrator();
  }
  async initialize() {
    this.status = 'LOADING';
    await this.memory.load();
    await this.reasoning.initialize();
    this.status = 'READY';
  }
  async process(input) {
    const ctx = await this.memory.recall(input);
    const decision = await this.reasoning.decide(input, ctx);
    await this.learning.record(input, decision);
    return decision;
  }
}
class MemorySystem {
  constructor() { this.store = new Map(); }
  async load() { }
  async recall(q) { return this.store.get(q) || null; }
}
class ReasoningEngine {
  constructor() { this.rules = []; }
  async initialize() { }
  async decide(input, ctx) { return { action: 'think', confidence: 0.5 }; }
}
class LearningModule {
  constructor() { this.history = []; }
  async record(input, out) { this.history.push({ input, out, t: Date.now() }); }
}
class AgentOrchestrator {
  constructor() { this.agents = []; }
}
export default NexusCore;`;

function extractCodePatterns(code: string): string[] {
  const patterns: string[] = [];
  
  // Classes
  const classes = code.match(/class\s+\w+\s*\{[^}]{0,300}/g);
  if (classes) patterns.push(...classes.slice(0, 2));
  
  // Methods
  const methods = code.match(/(?:async\s+)?\w+\s*\([^)]*\)\s*\{[^}]{0,200}/g);
  if (methods) patterns.push(...methods.slice(0, 2));
  
  return patterns;
}

function mutateCode(code: string, dnaContext: string): { code: string; delta: number } {
  // Simple mutation: add comments and small enhancements based on DNA
  const patterns = extractCodePatterns(dnaContext);
  
  let mutated = code;
  let changes = 0;
  
  // Add version bump
  mutated = mutated.replace(/VERSION = "[\d.]+"/, (m) => {
    changes++;
    const parts = m.match(/[\d]+/g) || ['1', '0', '0'];
    parts[2] = String(parseInt(parts[2] || '0') + 1);
    return `VERSION = "${parts.join('.')}"`;
  });
  
  // Add entropy tracking if not present
  if (!mutated.includes('entropy')) {
    mutated = mutated.replace(
      'this.status = \'INIT\';',
      `this.status = 'INIT';
    this.entropy = 0;
    this.generation = 0;`
    );
    changes++;
  }
  
  // Add self-awareness
  if (!mutated.includes('selfAware')) {
    mutated = mutated.replace(
      'class NexusCore {',
      `class NexusCore {
  // Self-awareness metrics
  selfAware = true;
  introspectionDepth = 0;`
    );
    changes++;
  }
  
  // Add DNA pattern insights as comments
  if (patterns.length > 0 && !mutated.includes('// DNA Pattern')) {
    const comment = `\n  // DNA Pattern insights:\n${patterns.slice(0, 2).map(p => `  // ${p.slice(0, 80).replace(/\n/g, ' ')}...`).join('\n')}\n`;
    mutated = mutated.replace('constructor() {', `${comment}  constructor() {`);
    changes++;
  }
  
  const delta = changes > 0 ? Math.min(0.2, changes * 0.05) : 0.01;
  
  return { code: mutated, delta };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { currentCode, dnaContent, round = 1, source = 'evolution' } = body;
    
    const code = currentCode || DEFAULT_SEED;
    
    // Mutate based on DNA
    const { code: newCode, delta } = mutateCode(code, dnaContent || '');
    
    // Store generation
    const generation = await db.agiGeneration.create({
      data: {
        round,
        code: newCode,
        delta,
        source,
        tokensUsed: Math.round(newCode.length / 4),
        patterns: JSON.stringify(extractCodePatterns(dnaContent || ''))
      }
    });
    
    return NextResponse.json({
      success: true,
      generation: {
        id: generation.id,
        round,
        code: newCode,
        delta,
        tokensUsed: generation.tokensUsed
      }
    });
    
  } catch (error) {
    console.error('Evolution error:', error);
    return NextResponse.json({ error: 'Evolution failed' }, { status: 500 });
  }
}
