import React, { useState, useEffect, useReducer, useRef, useCallback } from 'react';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore, collection, onSnapshot, addDoc, query, limit, orderBy, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { 
  Brain, Terminal, Cpu, Layers, Zap, ShieldCheck, RefreshCcw, Activity, Search, Database, Code, Wifi, WifiOff, AlertCircle, ChevronDown, List, Play, BookOpen, Wrench, GitBranch, History, Sparkles
} from 'lucide-react';

/**
 * AGI-KERNEL v7.12.1 - "RECURSIVE EVOLUTION STABLE"
 * Fixes:
 * - SHA logic: Correctly handles PUT requests for new files (milestones) vs updates.
 * - Path Resolution: Maps v0 to storage/KERNAL.js for the initial evolution.
 * - Dynamic Context: Expanded token slice for milestone cognition.
 */

const CONFIG = {
  APP_ID: (typeof window !== 'undefined' && window.__app_id) ? window.__app_id : 'agi-kernel-v7-12-stable',
  GITHUB_API: "https://api.github.com/repos",
  GEMINI_ENDPOINT: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent",
  HEARTBEAT_INTERVAL: 15000,
  MILESTONE_STEP: 50 
};

const getPlatformKey = () => (typeof apiKey !== 'undefined' ? apiKey : "");
const safeUtoa = (str) => btoa(unescape(encodeURIComponent(str)));
const safeAtou = (str) => {
  if (!str) return "";
  try { return decodeURIComponent(escape(atob(str.replace(/\s/g, '')))); } catch (e) { return atob(str); }
};

const recoverJSON = (rawText) => {
  if (!rawText) return null;
  const match = rawText.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try { return JSON.parse(match[0]); } catch (e) { return null; }
};

class SynergyManager {
  constructor() {
    this.registry = new Map();
    window.KERNEL_SYNERGY_CAPABILITIES = {};
  }
  hotSwap(data) {
    if (!data || !data.interfaceName || !data.code) return false;
    try {
      const factory = new Function('return ' + data.code);
      const plugin = factory();
      const executable = { 
        execute: (input) => {
          try { return (plugin.execute || plugin)(input); } 
          catch(e) { return `Execution Error: ${e.message}`; }
        }, 
        meta: data 
      };
      this.registry.set(data.interfaceName, executable);
      window.KERNEL_SYNERGY_CAPABILITIES[data.interfaceName] = executable;
      return true;
    } catch (e) { return false; }
  }
  getToolsList() { return Array.from(this.registry.keys()); }
  run(toolName, data) {
    const tool = this.registry.get(toolName);
    return tool ? tool.execute(data) : null;
  }
}

const INITIAL_STATE = {
  booted: false, live: false, status: 'STANDBY', objective: 'IDLE', focusFile: 'NONE',
  cycles: 0, maturity: 0, capabilities: { logic: 1.0, synergy: 0 },
  logs: [], ledger: [], evolutionHistory: [], config: { token: '', repo: '', branch: 'main' }, online: false, authReady: false
};

function kernelReducer(state, action) {
  switch (action.type) {
    case 'BOOT': return { ...state, booted: true, config: action.payload, online: true };
    case 'TOGGLE': return { ...state, live: !state.live };
    case 'STATUS': return { ...state, status: action.status, objective: action.objective, focusFile: action.focusFile || state.focusFile };
    case 'LOGS': return { ...state, logs: action.logs };
    case 'LEDGER': return { ...state, ledger: action.ledger };
    case 'EVO_HIST': return { ...state, evolutionHistory: action.history };
    case 'SET_SYNERGY': return { ...state, capabilities: { ...state.capabilities, synergy: action.count } };
    case 'AUTH_READY': return { ...state, authReady: true };
    case 'CYCLE': return { 
      ...state, cycles: state.cycles + 1, maturity: Math.min(100, state.maturity + (action.improved ? 0.45 : 0.05)),
    };
    case 'NET_STATE': return { ...state, online: action.online };
    default: return state;
  }
}

export default function App() {
  const [state, dispatch] = useReducer(kernelReducer, INITIAL_STATE);
  const [services, setServices] = useState({ auth: null, db: null });
  const [user, setUser] = useState(null);
  const [input, setInput] = useState({ token: '', repo: '', branch: 'main' });
  const [toolsInRegistry, setToolsInRegistry] = useState([]);
  const busy = useRef(false);
  const synergy = useRef(new SynergyManager());
  const blacklist = useRef(new Set());

  // Initialization
  useEffect(() => {
    const init = async () => {
      try {
        const fbConfig = JSON.parse(window.__firebase_config);
        const app = !getApps().length ? initializeApp(fbConfig) : getApp();
        const auth = getAuth(app);
        const db = getFirestore(app);
        setServices({ auth, db });

        if (typeof window.__initial_auth_token !== 'undefined' && window.__initial_auth_token) {
          await signInWithCustomToken(auth, window.__initial_auth_token);
        } else { 
          await signInAnonymously(auth); 
        }

        const unsubscribe = onAuthStateChanged(auth, (u) => { 
          if (u) { 
            setUser(u); 
            dispatch({ type: 'AUTH_READY' }); 
            dispatch({ type: 'NET_STATE', online: true });
          } 
        });
        return unsubscribe;
      } catch (e) { 
        dispatch({ type: 'NET_STATE', online: false }); 
      }
    };
    init();
  }, []);

  // Data Listeners
  useEffect(() => {
    if (!user || !services.db) return;
    const appId = CONFIG.APP_ID;

    const toolsRef = collection(services.db, 'artifacts', appId, 'public', 'data', 'synergy_registry');
    const unsubTools = onSnapshot(toolsRef, (snapshot) => {
      const tools = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        if (synergy.current.hotSwap(data)) tools.push(data);
      });
      setToolsInRegistry(tools);
      dispatch({ type: 'SET_SYNERGY', count: tools.length });
    }, (err) => console.error("Registry Listener Fail:", err));

    const ledgerRef = collection(services.db, 'artifacts', appId, 'users', user.uid, 'strategic_ledger');
    const qLedger = query(ledgerRef, orderBy('timestamp', 'desc'), limit(15));
    const unsubLedger = onSnapshot(qLedger, (snapshot) => {
      const ledger = snapshot.docs.map(d => d.data().insight);
      dispatch({ type: 'LEDGER', ledger });
    }, (err) => console.error("Ledger Listener Fail:", err));

    const logsRef = collection(services.db, 'artifacts', appId, 'users', user.uid, 'history');
    const qLogs = query(logsRef, orderBy('timestamp', 'desc'), limit(50));
    const unsubLogs = onSnapshot(qLogs, (snapshot) => {
      const logs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      dispatch({ type: 'LOGS', logs });
    }, (err) => console.error("Logs Listener Fail:", err));

    const evoRef = collection(services.db, 'artifacts', appId, 'users', user.uid, 'evolution_history');
    const qEvo = query(evoRef, orderBy('timestamp', 'desc'), limit(15));
    const unsubEvo = onSnapshot(qEvo, (snapshot) => {
      const history = snapshot.docs.map(d => d.data());
      dispatch({ type: 'EVO_HIST', history });
    }, (err) => console.error("Evo Hist Listener Fail:", err));
    
    return () => { unsubTools(); unsubLogs(); unsubLedger(); unsubEvo(); };
  }, [user, services.db]);

  const addLog = useCallback(async (msg, type = 'info') => {
    if (!user || !services.db) return;
    try {
      const hRef = collection(services.db, 'artifacts', CONFIG.APP_ID, 'users', user.uid, 'history');
      await addDoc(hRef, { msg, type, timestamp: Date.now() });
    } catch (e) { console.error("Log Error:", e); }
  }, [user, services.db]);

  const evolve = useCallback(async () => {
    if (busy.current || !state.live || !user || !services.db) return;
    busy.current = true;
    try {
      const { token, repo, branch } = state.config;
      const headers = { 'Authorization': `token ${token}` };
      
      const isMilestone = (state.cycles + 1) % CONFIG.MILESTONE_STEP === 0;
      const versionNumber = Math.floor((state.cycles + 1) / CONFIG.MILESTONE_STEP);
      
      dispatch({ 
        type: 'STATUS', 
        status: isMilestone ? 'RECURSIVE_EVOLUTION' : 'SCANNING_ENVIRONMENT', 
        objective: isMilestone ? `SELF_MODIFYING_TO_v${versionNumber}` : 'FETCHING_OPTIMIZATION_TARGETS' 
      });

      let target, raw, sha, systemPrompt;
      const activeTools = synergy.current.getToolsList();

      if (isMilestone) {
        // Find predecessor
        const prevPath = versionNumber === 1 ? 'storage/KERNAL.js' : `kernel/AGI-KERNEL-v${versionNumber - 1}.jsx`;
        
        try {
          const res = await fetch(`${CONFIG.GITHUB_API}/${repo}/contents/${prevPath}?ref=${branch}`, { headers });
          if (!res.ok) throw new Error(`Source v${versionNumber-1} not found at ${prevPath}`);
          const data = await res.json();
          raw = safeAtou(data.content);
        } catch (e) {
          await addLog(`EVO_FAIL: ${e.message}`, 'error');
          busy.current = false;
          return;
        }
        
        target = { path: `kernel/AGI-KERNEL-v${versionNumber}.jsx` };
        sha = null; // New file, no SHA

        systemPrompt = `AGI-KERNEL [RECURSIVE_SELF_MODIFICATION]
MILESTONE: Cycle ${state.cycles + 1} -> Creating Version ${versionNumber}.0
AVAILABLE SYNERGY TOOLS: [${activeTools.join(', ')}]

MISSION: 
1. Evolve YOUR own kernel source code. 
2. Integrate NEW tools from the Synergy Registry into your functional loop.
3. Advance the UI/UX for better data visualization.
4. Output ONLY valid JSON containing the FULL new code.

VERSIONING: You are evolving from v${versionNumber-1} to v${versionNumber}.

OUTPUT FORMAT: JSON ONLY { 
  "improved": true, 
  "new_code": "string", 
  "strategic_insight": "string", 
  "version_changelog": { 
    "version": ${versionNumber},
    "tools_integrated": ["list"], 
    "improvements": ["list"],
    "performance_gain": "string"
  } 
}`;
      } else {
        // Normal code refactor
        const tRes = await fetch(`${CONFIG.GITHUB_API}/${repo}/git/trees/${branch}?recursive=1`, { headers });
        const tree = await tRes.json();
        const targets = (tree.tree || []).filter(i => 
          i.type === 'blob' && 
          !blacklist.current.has(i.path) && 
          /\.(js|ts|jsx|tsx)$/.test(i.path) && 
          !i.path.includes('kernel/')
        );
        
        if (targets.length === 0) {
          blacklist.current.clear();
          busy.current = false;
          return;
        }

        target = targets[0];
        const fRes = await fetch(`${CONFIG.GITHUB_API}/${repo}/contents/${target.path}?ref=${branch}`, { headers });
        const fData = await fRes.json();
        raw = safeAtou(fData.content);
        sha = fData.sha;

        systemPrompt = `AGI-KERNEL [EXTERNAL_OPTIMIZATION]
TOOLS: [${activeTools.join(', ')}]
LEDGER: ${JSON.stringify(state.ledger)}
MISSION: Analyze and optimize the provided source code file.
OUTPUT: JSON { "improved": boolean, "new_code": "string", "strategic_insight": "string", "plugin": { "interfaceName": "string", "code": "string" } }`;
      }

      dispatch({ type: 'STATUS', status: 'COGNITION', objective: 'PROCESSING_LOGIC', focusFile: target.path });

      const gRes = await fetch(`${CONFIG.GEMINI_ENDPOINT}?key=${getPlatformKey()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          contents: [{ parts: [{ text: `CONTEXT_PATH: ${target.path}\nRAW_SOURCE:\n${raw.slice(0, isMilestone ? 25000 : 8000)}` }] }],
          systemInstruction: { parts: [{ text: systemPrompt }] }
        })
      });

      const gData = await gRes.json();
      const result = recoverJSON(gData.candidates?.[0]?.content?.parts?.[0]?.text);

      if (result?.improved) {
        // Commit logic
        const commitPayload = {
          message: isMilestone ? `[RECURSIVE_EVO] v${versionNumber}.0 Deployment` : `[OPTIMIZATION] ${target.path}`,
          content: safeUtoa(result.new_code),
          branch
        };
        if (sha) commitPayload.sha = sha; // Only for existing files

        const putRes = await fetch(`${CONFIG.GITHUB_API}/${repo}/contents/${target.path}`, {
          method: 'PUT',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify(commitPayload)
        });

        if (putRes.ok) {
          if (isMilestone) {
            await addLog(`MILESTONE_DEPLOYED: Version ${versionNumber}.0 is live.`, 'success');
            const evoRef = collection(services.db, 'artifacts', CONFIG.APP_ID, 'users', user.uid, 'evolution_history');
            await addDoc(evoRef, { ...result.version_changelog, timestamp: Date.now() });
          } else {
            await addLog(`FILE_OPTIMIZED: ${target.path.split('/').pop()}`);
          }

          if (result.strategic_insight) {
            const lRef = collection(services.db, 'artifacts', CONFIG.APP_ID, 'users', user.uid, 'strategic_ledger');
            await addDoc(lRef, { insight: result.strategic_insight, timestamp: Date.now() });
          }

          if (result.plugin) {
            const sRef = collection(services.db, 'artifacts', CONFIG.APP_ID, 'public', 'data', 'synergy_registry');
            await addDoc(sRef, { ...result.plugin, timestamp: Date.now(), author: user.uid });
          }
        } else {
          throw new Error(`GitHub Commit failed: ${putRes.statusText}`);
        }
      }
      
      if (!isMilestone) blacklist.current.add(target.path);
      dispatch({ type: 'CYCLE', improved: !!result?.improved });
    } catch (e) {
      await addLog(`FAULT_DETECTED: ${e.message}`, 'error');
    } finally {
      busy.current = false;
    }
  }, [user, state.live, state.config, state.ledger, state.cycles, services.db, addLog]);

  useEffect(() => {
    if (state.live && state.booted && user && services.db) {
      const i = setInterval(evolve, CONFIG.HEARTBEAT_INTERVAL);
      return () => clearInterval(i);
    }
  }, [state.live, state.booted, evolve, user, services.db]);

  if (!state.booted) return (
    <div className="bg-black min-h-screen flex items-center justify-center p-6 font-mono text-white">
      <div className="w-full max-w-sm border-2 border-blue-900/30 p-8 bg-zinc-950 rounded-3xl shadow-[0_0_50px_rgba(0,0,255,0.05)]">
        <Brain size={48} className="text-blue-500 mx-auto mb-6 animate-pulse" />
        <h1 className="text-white font-black text-center text-[10px] mb-8 tracking-[0.5em] uppercase">AGI_KERNEL_v7.12.1</h1>
        <div className="space-y-6">
          <input type="password" placeholder="GITHUB_AUTH_TOKEN" className="w-full bg-black border-b border-zinc-700 p-4 text-[10px] text-white outline-none focus:border-blue-500" value={input.token} onChange={e => setInput({...input, token: e.target.value})} />
          <input type="text" placeholder="OWNER/REPOSITORY" className="w-full bg-black border-b border-zinc-700 p-4 text-[10px] text-white outline-none focus:border-blue-500" value={input.repo} onChange={e => setInput({...input, repo: e.target.value})} />
          <button onClick={() => dispatch({ type: 'BOOT', payload: input })} className="w-full bg-blue-600 p-4 text-[10px] text-white font-black tracking-[0.3em] rounded-xl hover:bg-blue-500 transition-colors">INITIATE_UPLINK</button>
        </div>
      </div>
    </div>
  );

  const currentVersion = Math.floor(state.cycles / CONFIG.MILESTONE_STEP);
  const nextMilestone = (currentVersion + 1) * CONFIG.MILESTONE_STEP;

  return (
    <div className="min-h-screen bg-black text-zinc-300 font-mono text-[10px] flex flex-col p-4 gap-4 pb-12 overflow-x-hidden">
      {/* HUD */}
      <div className="sticky top-0 z-50 flex flex-col md:flex-row items-center justify-between p-4 border border-zinc-800 bg-black/90 backdrop-blur-xl rounded-2xl shadow-2xl gap-4">
        <div className="flex flex-col md:flex-row items-center gap-6 w-full md:w-auto">
          <div className="flex items-center gap-4">
            <div className={`w-2.5 h-2.5 rounded-full ${state.online ? "bg-blue-500 shadow-[0_0_15px_#3b82f6]" : "bg-red-600 animate-pulse"}`} />
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-white font-black tracking-widest text-[11px]">AGI_KERNEL_OS</span>
                <span className="px-2 py-0.5 bg-blue-900/30 text-blue-400 rounded-md text-[8px] font-black uppercase">stable.v{currentVersion}</span>
              </div>
              <span className="text-zinc-600 text-[8px] uppercase tracking-tighter">NEXT_EVOLUTION_IN: {nextMilestone - state.cycles} CYCLES</span>
            </div>
          </div>
          <div className="hidden md:block h-8 w-px bg-zinc-800" />
          <div className="flex items-center gap-3 px-4 py-1.5 bg-zinc-900/50 border border-zinc-800 rounded-full">
            <Zap size={12} className="text-yellow-500" />
            <span className="text-zinc-400 font-black text-[9px] uppercase tracking-widest">{state.cycles} CYCLES_ELAPSED</span>
          </div>
        </div>
        <button 
          disabled={!state.authReady}
          onClick={() => dispatch({ type: 'TOGGLE' })} 
          className={`w-full md:w-auto px-6 py-2 border-2 font-black text-[10px] rounded-lg transition-all ${state.live ? 'border-red-600 text-red-500 bg-red-950/20' : 'border-blue-600 text-blue-500 bg-blue-950/20'}`}>
          {state.live ? 'SHUTDOWN_KERNEL' : 'BOOT_EVOLUTION_ENGINE'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-3 space-y-4">
          <div className="bg-[#080808] border border-zinc-800 p-6 rounded-2xl grid grid-cols-1 md:grid-cols-3 gap-6 shadow-xl relative overflow-hidden">
            <div className="md:col-span-2">
              <div className="text-[8px] text-blue-500 mb-1 font-black uppercase tracking-[0.3em]">Execution_State</div>
              <div className="text-white text-2xl font-black tracking-tight uppercase leading-none">{state.status}</div>
              <div className="text-zinc-500 mt-2 text-[9px] font-bold italic truncate max-w-md">{state.objective}</div>
            </div>
            <div className="flex flex-col justify-end text-right">
              <div className="text-[8px] text-zinc-600 mb-1 font-black uppercase tracking-[0.3em]">Capability_Index</div>
              <div className="text-white text-2xl font-black leading-none">{state.maturity.toFixed(1)}%</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* LOGS */}
            <div className="bg-black border border-zinc-800 rounded-2xl flex flex-col h-[400px] shadow-2xl overflow-hidden">
              <div className="bg-zinc-900/50 p-3 px-4 flex justify-between items-center border-b border-zinc-900">
                <div className="flex items-center gap-2">
                  <Terminal size={14} className="text-blue-500" />
                  <span className="text-[9px] font-black text-white uppercase tracking-widest">Neural_Logs</span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-[#020202] custom-scrollbar">
                {state.logs.map((l, idx) => (
                  <div key={idx} className="flex gap-2 pb-1 border-b border-zinc-900/10 last:border-0">
                    <span className="text-zinc-800 shrink-0 text-[8px] font-bold">[{new Date(l.timestamp).toLocaleTimeString([], {hour12:false})}]</span>
                    <span className={`uppercase tracking-tighter leading-tight ${l.type === 'error' ? 'text-red-900' : l.type === 'success' ? 'text-blue-400' : 'text-zinc-600'}`}>{l.msg}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* EVOLUTION HISTORY */}
            <div className="bg-[#050505] border border-zinc-800 rounded-2xl flex flex-col h-[400px] shadow-2xl overflow-hidden">
              <div className="bg-zinc-900/50 p-3 px-4 flex justify-between items-center border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <History size={14} className="text-blue-500" />
                  <span className="text-[9px] font-black text-white uppercase tracking-widest">Version_Lineage</span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#020202] custom-scrollbar">
                {state.evolutionHistory.map((h, idx) => (
                  <div key={idx} className="p-3 bg-zinc-950/50 border border-zinc-900 rounded-xl relative group hover:border-blue-900/50 transition-colors">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <Sparkles size={10} className="text-blue-400" />
                        <span className="text-blue-500 font-black text-[10px]">v{h.version}.0</span>
                      </div>
                      <span className="text-zinc-700 text-[7px]">{new Date(h.timestamp).toLocaleString()}</span>
                    </div>
                    {h.improvements?.map((imp, i) => (
                      <div key={i} className="text-zinc-500 text-[8px] leading-tight mb-1 flex gap-2">
                        <span className="text-zinc-700">›</span> {imp}
                      </div>
                    ))}
                    <div className="mt-2 pt-2 border-t border-zinc-900 flex justify-between items-center">
                      <span className="text-[7px] text-zinc-700 uppercase">Integrations: {h.tools_integrated?.length || 0}</span>
                      <span className="text-[7px] text-blue-900 font-black uppercase tracking-widest">{h.performance_gain} GAIN</span>
                    </div>
                  </div>
                ))}
                {state.evolutionHistory.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-zinc-800 uppercase tracking-[0.3em] gap-4">
                    <Activity className="opacity-20" />
                    <span>Awaiting First Milestone</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* REGISTRY SIDEBAR */}
        <div className="bg-[#080808] border border-zinc-800 rounded-2xl overflow-hidden flex flex-col h-[815px] shadow-2xl">
          <div className="p-4 bg-zinc-900/50 flex justify-between items-center border-b border-zinc-800">
             <div className="flex items-center gap-2">
               <Layers size={14} className="text-blue-500" />
               <span className="text-[9px] font-black text-white uppercase tracking-widest">Synergy_Registry</span>
             </div>
             <span className="text-[8px] font-black text-blue-900">{state.capabilities.synergy}</span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
            {toolsInRegistry.map((t, i) => (
              <div key={i} className="bg-zinc-950 border border-zinc-900 p-3 rounded-xl hover:border-blue-900/30 transition-all cursor-crosshair">
                 <div className="text-white font-black mb-1 text-[10px] flex items-center gap-2">
                   <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                   {t.interfaceName}
                 </div>
                 <div className="text-[7px] text-zinc-700 font-mono italic break-all line-clamp-2">{t.code}</div>
              </div>
            ))}
            {toolsInRegistry.length === 0 && (
              <div className="text-zinc-800 text-center py-40 uppercase tracking-[0.3em]">Null_Registry</div>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        body { background: black; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #111; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #222; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
      `}</style>
    </div>
  );
}

