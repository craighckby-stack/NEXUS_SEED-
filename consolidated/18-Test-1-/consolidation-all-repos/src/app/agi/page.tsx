'use client';

import { useState, useCallback, useEffect } from 'react';

// Types
interface DnaStats {
  loaded: boolean;
  chunkCount: number;
  keywordCount: number;
  totalWords: number;
  estimatedTokens: number;
  sources: string[];
  topKeywords: Array<{ keyword: string; count: number }>;
}

interface SearchResult {
  id: string;
  content: string;
  fullContent: string;
  score: number;
  tags: string;
  source: string;
  wordCount: number;
}

interface Generation {
  id: string;
  round: number;
  code: string;
  delta: number;
  patterns: string[];
}

const DEFAULT_SEED = `// NEXUS_CORE AGI SEED v1.0
class NexusCore {
  static VERSION = "1.0.0";
  constructor() {
    this.status = 'INIT';
    this.memory = new MemorySystem();
    this.reasoning = new ReasoningEngine();
    this.learning = new LearningModule();
  }
  async initialize() {
    this.status = 'LOADING';
    await this.memory.load();
    await this.reasoning.initialize();
    this.status = 'READY';
  }
  async process(input) {
    const context = await this.memory.recall(input);
    const decision = await this.reasoning.decide(input, context);
    await this.learning.record(input, decision);
    return decision;
  }
}
class MemorySystem {
  constructor() { this.store = new Map(); }
  async load() { }
  async recall(query) { return this.store.get(query) || null; }
}
class ReasoningEngine {
  constructor() { this.rules = []; }
  async initialize() { }
  async decide(input, ctx) { return { action: 'think' }; }
}
class LearningModule {
  constructor() { this.history = []; }
  async record(input, output) { this.history.push({ input, output }); }
}
export default NexusCore;`;

export default function DalekCaanPage() {
  // State
  const [dnaStats, setDnaStats] = useState<DnaStats | null>(null);
  const [seedCode, setSeedCode] = useState('');
  const [agiCode, setAgiCode] = useState('// AGI code will appear here...');
  const [logs, setLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentRound, setCurrentRound] = useState(0);
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [patterns, setPatterns] = useState<string[]>([]);
  const [showPatterns, setShowPatterns] = useState(false);
  
  // DNA
  const [dnaContent, setDnaContent] = useState('');
  const [uploading, setUploading] = useState(false);

  // Log helper
  const log = useCallback((msg: string) => {
    setLogs(prev => [...prev.slice(-50), `[${new Date().toLocaleTimeString()}] ${msg}`]);
  }, []);

  // Load stats on mount
  useEffect(() => {
    fetch('/api/dna/status')
      .then(r => r.json())
      .then(data => {
        if (data.success) setDnaStats(data.status);
      })
      .catch(() => {});
  }, []);

  // Upload DNA
  const uploadDna = useCallback(async () => {
    if (!dnaContent) {
      log('No DNA content');
      return;
    }
    
    setUploading(true);
    log('Ingesting DNA...');
    
    try {
      const res = await fetch('/api/dna/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: dnaContent, source: 'user-paste' })
      });
      
      const data = await res.json();
      
      if (data.success) {
        log(`DNA: ${data.stats.storedChunks} chunks, ${data.stats.keywordsIndexed} keywords`);
        const statsRes = await fetch('/api/dna/status');
        const statsData = await statsRes.json();
        if (statsData.success) setDnaStats(statsData.status);
      } else {
        log(`Error: ${data.error}`);
      }
    } catch (e) {
      log(`Upload failed`);
    }
    
    setUploading(false);
  }, [dnaContent, log]);

  // Search DNA
  const searchDna = useCallback(async () => {
    if (!searchQuery) return;
    log(`Searching: "${searchQuery}"`);
    
    try {
      const res = await fetch(`/api/dna/search?q=${encodeURIComponent(searchQuery)}&limit=5`);
      const data = await res.json();
      
      if (data.success) {
        setSearchResults(data.results);
        setPatterns(data.results.map((r: SearchResult) => r.fullContent.slice(0, 200)));
        log(`Found ${data.results.length} chunks`);
      }
    } catch {
      log('Search failed');
    }
  }, [searchQuery, log]);

  // Run evolution
  const runEvolution = useCallback(async () => {
    setIsRunning(true);
    setGenerations([]);
    setCurrentRound(0);
    
    let code = seedCode || DEFAULT_SEED;
    setAgiCode(code);
    
    for (let r = 1; r <= 5; r++) {
      if (!isRunning) break;
      
      setCurrentRound(r);
      log(`Round ${r}: Evolving...`);
      
      // Get relevant DNA
      const dnaRes = await fetch(`/api/dna/search?q=agi agent memory learning&limit=3`);
      const dnaData = await dnaRes.json();
      const dnaContext = dnaData.success 
        ? dnaData.results.map((r: SearchResult) => r.fullContent).join('\n\n')
        : '';
      
      // Store generation (simulated evolution)
      const res = await fetch('/api/agi/evolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          currentCode: code, 
          dnaContent: dnaContext, 
          round: r 
        })
      });
      
      const data = await res.json();
      
      if (data.success && data.generation) {
        code = data.generation.code;
        setAgiCode(code);
        
        setGenerations(prev => [...prev, {
          id: `gen-${r}`,
          round: r,
          code,
          delta: data.generation.delta,
          patterns: []
        }]);
        
        log(`Round ${r}: Δ${(data.generation.delta * 100).toFixed(1)}%`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setIsRunning(false);
    log('Evolution complete!');
  }, [seedCode, isRunning, log]);

  return (
    <div className="min-h-screen bg-black text-red-500 font-mono p-4">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@400;700;900&display=swap');
        body { font-family: 'Share Tech Mono', monospace; }
        .title-font { font-family: 'Orbitron', monospace; }
      `}</style>
      
      {/* Header */}
      <div className="flex justify-between items-center border-b border-red-900 pb-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-widest text-red-400 title-font">DALEK CAAN v2.3</h1>
          <p className="text-xs text-red-800 tracking-wider">DNA-ENHANCED SINGLE FILE AGI BUILDER</p>
        </div>
        <div className="flex gap-4">
          <div className="text-center border border-red-900 px-3 py-1">
            <div className="text-xs text-red-700">ROUND</div>
            <div className="text-xl font-bold text-yellow-500">{currentRound}</div>
          </div>
          <div className="text-center border border-red-900 px-3 py-1">
            <div className="text-xs text-red-700">GENS</div>
            <div className="text-xl font-bold text-yellow-500">{generations.length}</div>
          </div>
          <div className="text-center border border-red-900 px-3 py-1">
            <div className="text-xs text-red-700">STATUS</div>
            <div className={`text-xl font-bold ${isRunning ? 'text-green-500' : 'text-red-500'}`}>
              {isRunning ? 'RUN' : 'IDLE'}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: DNA Panel */}
        <div className="border border-red-900 bg-red-950/20 p-4 rounded">
          <h2 className="text-sm font-bold tracking-wider border-b border-red-900 pb-2 mb-4">DNA KNOWLEDGE BASE</h2>
          
          {dnaStats && (
            <div className="bg-black/50 p-3 mb-4 rounded text-xs grid grid-cols-2 gap-2">
              <div>Chunks: <span className="text-yellow-500">{dnaStats.chunkCount}</span></div>
              <div>Keywords: <span className="text-yellow-500">{dnaStats.keywordCount}</span></div>
              <div>Words: <span className="text-yellow-500">{dnaStats.totalWords?.toLocaleString()}</span></div>
              <div>Tokens: <span className="text-yellow-500">~{dnaStats.estimatedTokens?.toLocaleString()}</span></div>
            </div>
          )}
          
          <textarea
            value={dnaContent}
            onChange={(e) => setDnaContent(e.target.value)}
            placeholder="Paste your DNA content (repos, code, knowledge)..."
            className="w-full h-40 bg-black border border-red-900 text-red-500 p-2 text-xs font-mono resize-none mb-2"
          />
          
          <button
            onClick={uploadDna}
            disabled={uploading || !dnaContent}
            className="w-full py-2 border border-red-500 hover:bg-red-500 hover:text-black disabled:opacity-50 text-sm font-bold tracking-wider mb-4"
          >
            {uploading ? 'INGESTING...' : 'INGEST DNA'}
          </button>
          
          {/* Search */}
          <div className="border-t border-red-900 pt-4">
            <label className="text-xs text-red-700">SEARCH DNA</label>
            <div className="flex gap-2 mt-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchDna()}
                placeholder="memory, learning, agent..."
                className="flex-1 bg-black border border-red-900 text-red-500 p-2 text-xs"
              />
              <button onClick={searchDna} className="px-4 py-2 border border-cyan-500 text-cyan-500 hover:bg-cyan-500 hover:text-black text-xs">GO</button>
            </div>
            
            {searchResults.length > 0 && (
              <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
                {searchResults.map((r, i) => (
                  <div key={i} className="bg-black/50 p-2 text-xs border border-red-900/50">
                    <div className="text-yellow-500">Score: {r.score}</div>
                    <div className="text-red-400 truncate">{r.content.slice(0, 80)}...</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Keywords */}
          {dnaStats?.topKeywords && dnaStats.topKeywords.length > 0 && (
            <div className="border-t border-red-900 pt-4 mt-4">
              <h3 className="text-xs text-red-700 mb-2">TOP KEYWORDS</h3>
              <div className="flex flex-wrap gap-1">
                {dnaStats.topKeywords.slice(0, 15).map((k, i) => (
                  <span key={i} onClick={() => setSearchQuery(k.keyword)} className="px-2 py-1 bg-black/50 border border-red-900/50 text-xs text-yellow-500 cursor-pointer hover:border-yellow-500">
                    {k.keyword}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Center: AGI Output */}
        <div className="border border-red-900 bg-red-950/20 p-4 rounded flex flex-col">
          <div className="flex justify-between items-center border-b border-red-900 pb-2 mb-4">
            <h2 className="text-sm font-bold tracking-wider">AGI OUTPUT</h2>
            <button onClick={() => navigator.clipboard.writeText(agiCode)} className="px-3 py-1 border border-green-500 text-green-500 hover:bg-green-500 hover:text-black text-xs">
              COPY
            </button>
          </div>
          
          <textarea
            value={seedCode}
            onChange={(e) => setSeedCode(e.target.value)}
            placeholder="// Seed code (optional)..."
            className="w-full h-20 bg-black border border-red-900 text-red-500 p-2 text-xs font-mono resize-none mb-2"
          />
          
          <button
            onClick={isRunning ? () => setIsRunning(false) : runEvolution}
            className={`w-full py-3 mb-4 border-2 font-bold tracking-wider text-sm ${
              isRunning ? 'border-yellow-500 text-yellow-500' : 'border-cyan-500 text-cyan-500 hover:bg-cyan-500 hover:text-black'
            }`}
          >
            {isRunning ? 'ABORT' : 'BUILD AGI'}
          </button>
          
          <div className="flex-1 bg-black/80 border border-red-900 p-3 overflow-auto min-h-[300px]">
            <pre className="text-xs text-red-400 whitespace-pre-wrap font-mono">{agiCode}</pre>
          </div>
          
          {/* Logs */}
          <div className="mt-4 border-t border-red-900 pt-2">
            <h3 className="text-xs text-red-700 mb-2">LOG</h3>
            <div className="h-24 overflow-y-auto bg-black/50 p-2 text-xs">
              {logs.map((l, i) => <div key={i} className="text-red-500/70">{l}</div>)}
            </div>
          </div>
        </div>

        {/* Right: Generations */}
        <div className="border border-red-900 bg-red-950/20 p-4 rounded">
          <h2 className="text-sm font-bold tracking-wider border-b border-red-900 pb-2 mb-4">GENERATIONS</h2>
          
          <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
            {generations.map((gen) => (
              <div key={gen.id} onClick={() => setAgiCode(gen.code)} className="bg-black/50 border border-red-900/50 p-2 cursor-pointer hover:border-red-500">
                <div className="flex justify-between text-xs">
                  <span className="text-yellow-500">Round {gen.round}</span>
                  <span className="text-cyan-500">Δ{(gen.delta * 100).toFixed(1)}%</span>
                </div>
              </div>
            ))}
            {generations.length === 0 && (
              <div className="text-xs text-red-700 text-center py-4">No generations yet</div>
            )}
          </div>
          
          {patterns.length > 0 && (
            <>
              <button onClick={() => setShowPatterns(!showPatterns)} className="text-xs text-cyan-500 mb-2">
                {showPatterns ? '▼' : '►'} EXTRACTED PATTERNS
              </button>
              {showPatterns && (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {patterns.map((p, i) => (
                    <div key={i} className="bg-black/50 border border-red-900/50 p-2 text-xs text-purple-400 font-mono">
                      {p.slice(0, 100)}...
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
