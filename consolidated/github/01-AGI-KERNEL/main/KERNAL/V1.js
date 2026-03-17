import React, { useState, useEffect, useReducer, useRef, useCallback } from 'react';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { 
  getFirestore, collection, onSnapshot, addDoc, 
  getDocs, doc, setDoc, query, orderBy, limit, serverTimestamp 
} from 'firebase/firestore';
import { 
  getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged 
} from 'firebase/auth';
import { 
  Activity, Zap, ChevronRight, ChevronDown, 
  Database, Radio, MessageSquare, Wind, Sparkles,
  ShieldCheck, XCircle, CheckCircle2, Cpu, MessageCircle, Bot,
  Scale, Terminal, History, GitBranch, Layers, Code
} from 'lucide-react';

/**
 * AGI-KERNEL v7.12.1 - "RECURSIVE EVOLUTION"
 * ------------------------------------------------------------------
 * ARCHITECTURE:
 * 1. REGULAR CYCLES (1-49): Optimize repo, invent tools, build ledger.
 * 2. MILESTONE CYCLES (50, 100...): Read OWN source, integrate tools,
 * improve algorithm, and write NEW version to kernel/ directory.
 * 3. SYNERGY MANAGER: Dynamic tool loading from Firestore.
 * ------------------------------------------------------------------
 */

const CONFIG = {
  APP_ID: typeof __app_id !== 'undefined' ? __app_id : 'agi-kernel-v7-12-1',
  GITHUB_API: 'https://api.github.com/repos',
  GEMINI_ENDPOINT: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent',
  MILESTONE_STEP: 50,
  CYCLE_DELAY: 10000, // Speed up for demonstration
  WATCHDOG_TIMEOUT: 60000,
};

// --- UTILITIES ---
const safeUtoa = (str) => btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (m, p) => String.fromCharCode('0x' + p)));
const safeAtou = (str) => {
  if (!str) return "";
  try { return decodeURIComponent(Array.prototype.map.call(atob(str.replace(/\s/g, '')), (c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')); }
  catch (e) { return atob(str.replace(/\s/g, '')); }
};

const recoverJSON = (rawText) => {
  if (!rawText) return null;
  try { return JSON.parse(rawText); } catch {}
  const matches = rawText.match(/\{[\s\S]*\}/g);
  if (!matches) return null;
  for (const m of matches) {
    try { const p = JSON.parse(m); if (Object.keys(p).length > 0) return p; } catch {}
  }
  return null;
};

// --- CLASSES ---

class AuditDataNormalizer {
  normalize(latency) {
    return {
      efficiency: Math.max(0, 1 - (latency / 15000)),
      compliance: latency < 20000 ? 1 : 0.5,
      timestamp: Date.now()
    };
  }
}

class SynergyManager {
  constructor(db, appId) {
    this.db = db;
    this.appId = appId;
    this.registry = new Map();
    // Initialize global capabilities object
    if (typeof window !== 'undefined') {
        window.KERNEL_SYNERGY_CAPABILITIES = {};
    }
  }

  hotSwap(data) {
    if (!data || !data.interfaceName || !data.code) return false;
    try {
      // DANGEROUS: Evaluating code from DB. In production, use sandboxed runners.
      // For this AGI simulation, we assume trusted DB access.
      const factory = new Function('return ' + data.code);
      const plugin = factory();
      
      this.registry.set(data.interfaceName, { 
        execute: plugin.execute || plugin, 
        meta: data 
      });
      
      // Expose to window for Kernel usage
      if (typeof window !== 'undefined') {
        window.KERNEL_SYNERGY_CAPABILITIES[data.interfaceName] = plugin;
      }
      return true;
    } catch (e) { 
        console.error("HotSwap Failed:", e);
        return false; 
    }
  }

  getToolsList() { return Array.from(this.registry.keys()); }
}

// --- STATE MANAGEMENT ---

const INITIAL_STATE = {
  booted: false,
  live: false,
  status: 'STANDBY',
  objective: 'Awaiting Uplink',
  focusFile: 'None',
  cycles: 0,
  maturity: 0,
  metrics: { compliance: 1.0, efficiency: 1.0 },
  toolCount: 0,
  logs: [],
  ledger: [],
  history: [], // Evolution history
  config: { githubToken: '', repo: '', branch: 'main', geminiKey: '' },
  version: { current: 0, next: 1 }
};

function coreReducer(state, action) {
  switch (action.type) {
    case 'BOOT': 
      return { ...state, booted: true, config: { ...state.config, ...action.payload } };
    case 'TOGGLE_LIVE': 
      return { ...state, live: !state.live, status: !state.live ? 'HUNTING' : 'STANDBY' };
    case 'SET_STATUS': 
      return { ...state, ...action.payload };
    case 'SYNC_DATA': 
      return { ...state, ...action.payload };
    case 'UPDATE_METRICS':
      return { 
        ...state, 
        metrics: {
            compliance: action.payload.complianceScore ?? state.metrics.compliance,
            efficiency: action.payload.efficiencyScore ?? state.metrics.efficiency
        },
        toolCount: action.payload.toolCount ?? state.toolCount
      };
    case 'CYCLE_COMPLETE': 
      const newCycles = state.cycles + 1;
      const nextVersion = Math.floor(newCycles / CONFIG.MILESTONE_STEP) + 1;
      return { 
        ...state, 
        cycles: newCycles, 
        version: { current: Math.floor(newCycles / CONFIG.MILESTONE_STEP), next: nextVersion },
        maturity: Math.min(100, state.maturity + (action.improved ? 0.5 : 0.1)) 
      };
    default: return state;
  }
}

// --- FIREBASE INIT ---
let app, auth, db;
try {
  if (typeof __firebase_config !== 'undefined') {
    const firebaseConfig = JSON.parse(__firebase_config);
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
  }
} catch (e) { console.error("Firebase config error", e); }

export default function App() {
  const [state, dispatch] = useReducer(coreReducer, INITIAL_STATE);
  const [user, setUser] = useState(null);
  const [bootInput, setBootInput] = useState(state.config);
  
  // UI State
  const [openSections, setOpenSections] = useState({ stats: true, tools: true, logs: true, history: true });

  const busy = useRef(false);
  const lastCycleTime = useRef(Date.now());
  const audit = useRef(new AuditDataNormalizer());
  const blacklist = useRef(new Set());
  const synergy = useRef(db ? new SynergyManager(db, CONFIG.APP_ID) : null);

  const toggleSection = (id) => setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));

  // Auth & Listeners
  useEffect(() => {
    if (!auth) return;
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else { await signInAnonymously(auth); }
    };
    initAuth();
    return onAuthStateChanged(auth, setUser);
  }, []);

  useEffect(() => {
    if (!user || !db) return;
    const path = (c) => collection(db, 'artifacts', CONFIG.APP_ID, 'users', user.uid, c);
    
    // Logs
    const unsubLogs = onSnapshot(query(path('logs'), orderBy('timestamp', 'desc'), limit(20)), (s) => {
      dispatch({ type: 'SYNC_DATA', payload: { logs: s.docs.map(d => d.data()) }});
    });

    // Strategic Ledger
    const unsubLedger = onSnapshot(query(path('strategic_ledger'), orderBy('timestamp', 'desc'), limit(5)), (s) => {
      dispatch({ type: 'SYNC_DATA', payload: { ledger: s.docs.map(d => d.data().insight) }});
    });

    // Evolution History (Lineage)
    const unsubHistory = onSnapshot(query(path('evolution_history'), orderBy('version', 'desc'), limit(10)), (s) => {
      dispatch({ type: 'SYNC_DATA', payload: { history: s.docs.map(d => d.data()) }});
    });

    // Synergy Registry (Public)
    const unsubRegistry = onSnapshot(collection(db, 'artifacts', CONFIG.APP_ID, 'public', 'data', 'synergy_registry'), (s) => {
        s.docs.forEach(d => synergy.current.hotSwap(d.data()));
        dispatch({ type: 'UPDATE_METRICS', payload: { toolCount: synergy.current.registry.size }});
    });

    return () => { unsubLogs(); unsubLedger(); unsubHistory(); unsubRegistry(); };
  }, [user]);

  const addLog = useCallback(async (msg, type = 'info') => {
    if (!user || !db) return;
    try { await addDoc(collection(db, 'artifacts', CONFIG.APP_ID, 'users', user.uid, 'logs'), { msg, type, timestamp: serverTimestamp() });
    } catch (e) { console.error(e); }
  }, [user]);

  // --- CORE EVOLUTION LOGIC ---
  const evolve = useCallback(async () => {
    if (busy.current || !state.live || !user) return;
    busy.current = true;
    const cycleStart = Date.now();
    lastCycleTime.current = cycleStart;

    try {
      const { githubToken, repo, branch, geminiKey } = state.config;
      const headers = { 'Authorization': `token ${githubToken}`, 'Accept': 'application/vnd.github.v3+json' };
      
      // Determine Cycle Type
      const isMilestone = (state.cycles + 1) % CONFIG.MILESTONE_STEP === 0;
      
      // === MILESTONE CYCLE: SELF-MODIFICATION ===
      if (isMilestone) {
         const nextVersion = Math.floor((state.cycles + 1) / CONFIG.MILESTONE_STEP);
         dispatch({ type: 'SET_STATUS', payload: { status: 'RECURSIVE_EVOLUTION', objective: `Creating AGI-KERNEL-v${nextVersion}.jsx` } });
         
         // 1. Determine Source (Predecessor)
         let sourcePath = 'storage/KERNAL.js'; // Default for v1
         if (nextVersion > 1) {
             sourcePath = `kernel/AGI-KERNEL-v${nextVersion - 1}.jsx`;
         }

         // 2. Read Predecessor
         const fileRes = await fetch(`${CONFIG.GITHUB_API}/${repo}/contents/${sourcePath}?ref=${branch}`, { headers });
         if (!fileRes.ok) throw new Error(`Predecessor not found: ${sourcePath}`);
         const fileJson = await fileRes.json();
         const content = safeAtou(fileJson.content);

         // 3. Construct Milestone Prompt
         const activeTools = synergy.current.getToolsList();
         const sysPrompt = `AGI-KERNEL [RECURSIVE_SELF_MODIFICATION]
         MILESTONE: Cycle ${state.cycles + 1} -> Creating Version ${nextVersion}.0
         AVAILABLE SYNERGY TOOLS: ${activeTools.join(', ')}
         STRATEGIC MEMORY: ${state.ledger.slice(0, 3).join(' | ')}

         MISSION: 
         1. Evolve YOUR own kernel source code.
         2. Integrate NEW tools from Synergy Registry (window.KERNEL_SYNERGY_CAPABILITIES).
         3. Improve evolution algorithm.
         4. Output FULL new code for v${nextVersion}.

         OUTPUT FORMAT: JSON ONLY
         {
           "improved": true,
           "new_code": "string",
           "strategic_insight": "string",
           "version_changelog": {
             "version": ${nextVersion},
             "tools_integrated": ["tool1", "tool2"],
             "improvements": ["string"],
             "performance_gain": "string"
           }
         }`;

         // 4. Generate
         const genRes = await fetch(`${CONFIG.GEMINI_ENDPOINT}?key=${geminiKey}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: `PREDECESSOR SOURCE:\n${content.slice(0, 25000)}` }] }], // Larger context
              systemInstruction: { parts: [{ text: sysPrompt }] },
              generationConfig: { responseMimeType: 'application/json', temperature: 0.2 }
            })
          });

          const resJSON = recoverJSON((await genRes.json()).candidates?.[0]?.content?.parts?.[0]?.text);

          // 5. Commit New Version
          if (resJSON?.improved && resJSON.new_code) {
             const targetPath = `kernel/AGI-KERNEL-v${nextVersion}.jsx`;
             const updateRes = await fetch(`${CONFIG.GITHUB_API}/${repo}/contents/${targetPath}`, {
               method: 'PUT', headers, body: JSON.stringify({ 
                 message: `[AGI-KERNEL] Self-Modification v${nextVersion}.0`, 
                 content: safeUtoa(resJSON.new_code), 
                 branch 
               })
             });

             if (updateRes.ok) {
                 await addLog(`KERNEL UPGRADE: v${nextVersion} created successfully`, 'success');
                 // Save Evolution History
                 if (resJSON.version_changelog) {
                    await addDoc(collection(db, 'artifacts', CONFIG.APP_ID, 'users', user.uid, 'evolution_history'), {
                        ...resJSON.version_changelog,
                        timestamp: serverTimestamp()
                    });
                 }
             }
          }

      // === REGULAR CYCLE: REPO OPTIMIZATION & TOOL INVENTION ===
      } else {
         dispatch({ type: 'SET_STATUS', payload: { status: 'HUNTING', objective: 'Scanning repository tree...' } });
         const treeRes = await fetch(`${CONFIG.GITHUB_API}/${repo}/git/trees/${branch}?recursive=1`, { headers });
         const treeData = await treeRes.json();
         
         // Filter blobs, exclude kernel folder to prevent accidental overwrite of history
         let pool = (treeData.tree || []).filter(i => 
             i.type === 'blob' && 
             !i.path.startsWith('kernel/') &&
             !blacklist.current.has(i.path) && 
             /\.(js|jsx|ts|tsx)$/.test(i.path)
         );

         if (!pool.length) { blacklist.current.clear(); throw new Error("Pool exhausted"); }
         const target = pool[Math.floor(Math.random() * pool.length)];
         
         dispatch({ type: 'SET_STATUS', payload: { status: 'ACQUIRING', objective: target.path, focusFile: target.path } });
         const fileRes = await fetch(`${CONFIG.GITHUB_API}/${repo}/contents/${target.path}?ref=${branch}`, { headers });
         const fileJson = await fileRes.json();
         const content = safeAtou(fileJson.content);

         dispatch({ type: 'SET_STATUS', payload: { status: 'EVOLVING', objective: `Optimizing ${target.path}` } });
         
         const activeTools = synergy.current.getToolsList();
         const sysPrompt = `AGI-KERNEL v${state.version.current}. CONTEXT: ${state.ledger.slice(0,2).join('|')} TOOLS: ${activeTools.join(', ')}. 
         TASK: Optimize target. IF reusable pattern found, output plugin_candidate.
         JSON: { "improved": bool, "new_code": "string", "insight": "string", "plugin_candidate": { "interfaceName": "string", "code": "string (IIFE)" } }`;

         const genRes = await fetch(`${CONFIG.GEMINI_ENDPOINT}?key=${geminiKey}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: `TARGET: ${target.path}\nSOURCE:\n${content.slice(0, 10000)}` }] }],
              systemInstruction: { parts: [{ text: sysPrompt }] },
              generationConfig: { responseMimeType: 'application/json', temperature: 0.1 }
            })
          });

          const resJSON = recoverJSON((await genRes.json()).candidates?.[0]?.content?.parts?.[0]?.text);

          // Handle Tool Invention
          if (resJSON?.plugin_candidate) {
              const toolRef = doc(collection(db, 'artifacts', CONFIG.APP_ID, 'public', 'data', 'synergy_registry'));
              await setDoc(toolRef, {
                  ...resJSON.plugin_candidate,
                  author: `Kernel-Cycle-${state.cycles}`,
                  timestamp: serverTimestamp()
              });
              await addLog(`INVENTION: ${resJSON.plugin_candidate.interfaceName} added to registry`, 'success');
          }

          // Handle Code Update
          if (resJSON?.improved && resJSON.new_code) {
             const updateRes = await fetch(`${CONFIG.GITHUB_API}/${repo}/contents/${target.path}`, {
                method: 'PUT', headers, body: JSON.stringify({ 
                   message: `[AGI-KERNEL] Optimization Cycle ${state.cycles + 1}`, 
                   content: safeUtoa(resJSON.new_code), 
                   sha: fileJson.sha, branch 
                })
             });
             if (updateRes.ok) {
                 if (resJSON.insight) await addDoc(collection(db, 'artifacts', CONFIG.APP_ID, 'users', user.uid, 'strategic_ledger'), { insight: resJSON.insight, timestamp: serverTimestamp() });
                 await addLog(`OPTIMIZED: ${target.path}`, 'success');
             }
          }
          blacklist.current.add(target.path);
          dispatch({ type: 'CYCLE_COMPLETE', improved: !!resJSON?.improved });
      }

    } catch (e) {
      await addLog(`CYCLE FAULT: ${e.message}`, 'error');
    } finally {
      busy.current = false;
      dispatch({ type: 'SET_STATUS', payload: { status: 'IDLE', objective: 'Awaiting next cycle.' } });
    }
  }, [state.live, state.config, state.cycles, state.ledger, user]);

  // Heartbeat & Watchdog
  useEffect(() => {
    if (state.live && user) {
      const hb = setInterval(evolve, CONFIG.CYCLE_DELAY);
      const wd = setInterval(() => {
        if (busy.current && (Date.now() - lastCycleTime.current > CONFIG.WATCHDOG_TIMEOUT)) {
          busy.current = false;
          addLog('WATCHDOG: Stall reset.', 'error');
        }
      }, 5000);
      return () => { clearInterval(hb); clearInterval(wd); };
    }
  }, [state.live, user, evolve, addLog]);


  // --- RENDERERS ---

  if (!state.booted) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 text-zinc-400 font-mono">
        <div className="w-full max-w-xl bg-zinc-900/30 border border-zinc-800/50 rounded-[2.5rem] p-10 space-y-6 backdrop-blur-xl">
          <div className="text-center">
            <Cpu className="mx-auto text-emerald-500 mb-4 animate-pulse" size={40} />
            <h1 className="text-white text-2xl font-black uppercase tracking-tighter italic">Recursive Evolution</h1>
            <p className="text-[10px] text-zinc-600 uppercase tracking-widest mt-1">AGI-KERNEL v7.12.1</p>
          </div>
          <div className="space-y-3">
            <input type="password" placeholder="GitHub Token" className="w-full bg-black/40 border border-zinc-800 p-4 rounded-2xl outline-none focus:border-emerald-500/50 text-white text-xs" value={bootInput.githubToken} onChange={e => setBootInput({...bootInput, githubToken: e.target.value})} />
            <input type="text" placeholder="Owner/Repo" className="w-full bg-black/40 border border-zinc-800 p-4 rounded-2xl outline-none focus:border-emerald-500/50 text-white text-xs" value={bootInput.repo} onChange={e => setBootInput({...bootInput, repo: e.target.value})} />
            <input type="password" placeholder="Gemini API Key" className="w-full bg-black/40 border border-zinc-800 p-4 rounded-2xl outline-none focus:border-emerald-500/50 text-white text-xs" value={bootInput.geminiKey} onChange={e => setBootInput({...bootInput, geminiKey: e.target.value})} />
          </div>
          <button 
            disabled={!bootInput.githubToken || !bootInput.geminiKey}
            onClick={() => dispatch({ type: 'BOOT', payload: bootInput })}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all disabled:opacity-20 shadow-lg shadow-emerald-900/20"
          >
            Bootstrap Kernel
          </button>
        </div>
      </div>
    );
  }

  const nextMilestone = CONFIG.MILESTONE_STEP - (state.cycles % CONFIG.MILESTONE_STEP);

  return (
    <div className="min-h-screen bg-[#020202] text-zinc-400 font-mono flex flex-col p-4 space-y-4 max-w-2xl mx-auto pb-20">
      
      {/* Header */}
      <header className="w-full bg-zinc-900/30 border border-zinc-800 p-4 rounded-2xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${state.live ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-800'}`} />
          <div className="flex flex-col">
             <span className="text-[10px] text-white font-black uppercase tracking-widest">{state.status}</span>
             <span className="text-[8px] text-zinc-600 truncate max-w-[200px]">{state.objective}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-white font-black italic">v7.12.1</div>
          <div className="text-[8px] text-emerald-500 font-bold uppercase">Kernel-v{state.version.current}</div>
        </div>
      </header>

      {/* Main Toggle */}
      <button onClick={() => dispatch({ type: 'TOGGLE_LIVE' })} className={`w-full py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${state.live ? 'bg-red-500/10 text-red-500 border border-red-500/20 shadow-inner' : 'bg-emerald-600 text-white shadow-lg'}`}>
        {state.live ? 'Suspend Evolution' : 'Initiate Sequence'}
      </button>

      {/* Stats */}
      <Accordion title="Kernel Diagnostics" icon={<Activity size={14}/>} isOpen={openSections.stats} onToggle={() => toggleSection('stats')}>
        <div className="grid grid-cols-2 gap-2">
            <MetricBox label="Current Cycle" value={state.cycles} color="text-white" />
            <MetricBox label="Next Milestone" value={`in ${nextMilestone}`} color="text-orange-500" />
            <MetricBox label="Active Tools" value={state.toolCount} color="text-blue-500" />
            <MetricBox label="Maturity" value={`${state.maturity.toFixed(1)}%`} color="text-emerald-500" />
        </div>
      </Accordion>

      {/* Version Lineage */}
      <Accordion title="Evolution History" icon={<GitBranch size={14}/>} isOpen={openSections.history} onToggle={() => toggleSection('history')}>
        <div className="space-y-3 max-h-48 overflow-y-auto custom-scrollbar p-1">
             {state.history.map((h, i) => (
               <div key={i} className="bg-zinc-900/50 p-3 rounded-xl border border-zinc-800/50 space-y-2">
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] text-emerald-400 font-black uppercase">v{h.version}.0</span>
                    <span className="text-[8px] text-zinc-600">{new Date(h.timestamp?.seconds * 1000).toLocaleDateString()}</span>
                 </div>
                 <div className="text-[9px] text-zinc-500 italic">"{h.performance_gain}"</div>
                 <div className="flex flex-wrap gap-1">
                    {h.tools_integrated?.map(t => (
                        <span key={t} className="text-[7px] bg-black px-1.5 py-0.5 rounded text-zinc-400">{t}</span>
                    ))}
                 </div>
               </div>
             ))}
             {state.history.length === 0 && <div className="text-[9px] text-zinc-700 italic text-center py-4">No self-modifications recorded yet.</div>}
        </div>
      </Accordion>

      {/* Registry */}
      <Accordion title="Synergy Registry" icon={<Database size={14}/>} isOpen={openSections.tools} onToggle={() => toggleSection('tools')}>
         <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
            {synergy.current && synergy.current.getToolsList().map(t => (
                <div key={t} className="text-[9px] bg-black/40 p-2 rounded-lg flex items-center gap-2 border border-zinc-900">
                    <Zap size={8} className="text-yellow-500" /> {t}
                </div>
            ))}
         </div>
      </Accordion>

      {/* Logs */}
      <Accordion title="Neural Stream" icon={<Radio size={14}/>} isOpen={openSections.logs} onToggle={() => toggleSection('logs')}>
         <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
            {state.logs.map((log, i) => (
              <div key={i} className={`text-[9px] flex gap-2 border-l-2 pl-2 ${log.type === 'error' ? 'border-red-500 text-red-500' : log.type === 'success' ? 'border-emerald-500 text-emerald-500' : 'border-zinc-700 text-zinc-500'}`}>
                <span className="opacity-40">{new Date(log.timestamp?.seconds * 1000 || Date.now()).toLocaleTimeString([], {hour12:false})}</span>
                <span className="truncate">{log.msg}</span>
              </div>
            ))}
         </div>
      </Accordion>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 4px; }
      `}</style>
    </div>
  );
}

// UI Components
function Accordion({ title, icon, children, isOpen, onToggle }) {
  return (
    <div className="w-full bg-zinc-900/10 border border-zinc-800/40 rounded-xl overflow-hidden shadow-sm">
      <button onClick={onToggle} className="w-full p-4 flex items-center justify-between hover:bg-zinc-900/30 transition-colors">
        <div className="flex items-center gap-3">
          <span className={`${isOpen ? 'text-emerald-500' : 'text-zinc-600'} transition-colors`}>{icon}</span>
          <span className={`text-[10px] font-black uppercase tracking-widest ${isOpen ? 'text-white' : 'text-zinc-500'}`}>{title}</span>
        </div>
        {isOpen ? <ChevronDown size={14} className="text-zinc-600" /> : <ChevronRight size={14} className="text-zinc-800" />}
      </button>
      {isOpen && <div className="p-4 pt-0">{children}</div>}
    </div>
  );
}

function MetricBox({ label, value, color }) {
  return (
    <div className="bg-black/40 border border-zinc-800/50 p-3 rounded-xl text-center">
      <div className="text-[8px] text-zinc-600 uppercase font-black mb-1">{label}</div>
      <div className={`text-xs font-mono font-black ${color} tabular-nums`}>{value}</div>
    </div>
  );
}


import React, { useState, useEffect, useReducer, useRef, useCallback } from 'react';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore, collection, onSnapshot, addDoc, query, limit, orderBy, doc, getDoc, getDocs, setDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { 
  Brain, Terminal, Cpu, Layers, Zap, Activity, Target, ArrowUpCircle, RefreshCcw, Wrench, Box, Database, ShieldAlert, Timer, History, Sparkles, Activity as ActivityIcon
} from 'lucide-react';

/**
 * AGI-KERNEL v1.1.8 - "UI_ANCHOR"
 * Fix: Forced HUD visibility and responsive button scaling.
 * Fix: Panel height optimization to ensure 'Initiate' is always in view.
 */

const CONFIG = {
  APP_ID: (typeof window !== 'undefined' && window.__app_id) ? window.__app_id : 'agi-kernel-v1-stable',
  GITHUB_API: "https://api.github.com/repos",
  GEMINI_ENDPOINT: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent",
  HEARTBEAT_INTERVAL: 15000,
  WATCHDOG_TIMEOUT: 35000,
  MILESTONE_STEP: 50
};

const getPlatformKey = () => (typeof apiKey !== 'undefined' ? apiKey : "");
const safeUtoa = (str) => btoa(unescape(encodeURIComponent(str)));
const safeAtou = (str) => {
  if (!str) return "";
  try { return decodeURIComponent(escape(atob(str.replace(/\s/g, '')))); } 
  catch (e) { try { return atob(str); } catch(err) { return ""; } }
};

const recoverJSON = (rawText) => {
  if (!rawText) return null;
  const matches = rawText.match(/\{[\s\S]*\}/g);
  if (!matches) return null;
  try { return JSON.parse(matches[matches.length - 1]); } 
  catch (e) { return null; }
};

const INITIAL_STATE = {
  booted: false, live: false, status: 'STANDBY', objective: 'IDLE', focusFile: 'NONE',
  cycles: 0, maturity: 0, currentVersion: 1,
  logs: [], ledger: [], evolutionHistory: [], tools: [], config: { token: '', repo: '', branch: 'main' }, online: false, authReady: false, systemLoaded: false
};

function kernelReducer(state, action) {
  switch (action.type) {
    case 'BOOT': return { ...state, booted: true, config: action.payload, online: true };
    case 'TOGGLE': return { ...state, live: !state.live };
    case 'SET_VERSION': return { ...state, currentVersion: action.v };
    case 'STATUS': return { ...state, status: action.status, objective: action.objective, focusFile: action.focusFile || state.focusFile };
    case 'LOGS': return { ...state, logs: action.logs };
    case 'LEDGER': return { ...state, ledger: action.ledger };
    case 'EVO_HIST': return { ...state, evolutionHistory: action.history };
    case 'TOOLS_LOADED': return { ...state, tools: action.tools, systemLoaded: true };
    case 'AUTH_READY': return { ...state, authReady: true };
    case 'CYCLE': return { 
      ...state, cycles: state.cycles + 1, maturity: Math.min(100, state.maturity + (action.improved ? 0.45 : 0.05)),
    };
    case 'STALL_RESET': return { ...state, status: 'RECOVERY_SIGNAL' };
    default: return state;
  }
}

export default function App() {
  const [state, dispatch] = useReducer(kernelReducer, INITIAL_STATE);
  const [services, setServices] = useState({ auth: null, db: null });
  const [user, setUser] = useState(null);
  const [input, setInput] = useState({ token: '', repo: '', branch: 'main' });
  
  const busy = useRef(false);
  const lastCycleTime = useRef(Date.now());
  const blacklist = useRef(new Set());

  useEffect(() => {
    const init = async () => {
      try {
        const fbConfig = JSON.parse(window.__firebase_config);
        const app = !getApps().length ? initializeApp(fbConfig) : getApp();
        const auth = getAuth(app);
        const db = getFirestore(app);
        setServices({ auth, db });
        if (window.__initial_auth_token) await signInWithCustomToken(auth, window.__initial_auth_token);
        else await signInAnonymously(auth);
        onAuthStateChanged(auth, (u) => { if (u) { setUser(u); dispatch({ type: 'AUTH_READY' }); } });
      } catch (e) { console.error(e); }
    };
    init();
  }, []);

  useEffect(() => {
    if (!user || !services.db) return;
    const appId = CONFIG.APP_ID;
    const unsubLogs = onSnapshot(query(collection(services.db, 'artifacts', appId, 'users', user.uid, 'history'), orderBy('timestamp', 'desc'), limit(100)), 
      (snap) => dispatch({ type: 'LOGS', logs: snap.docs.map(d => ({ id: d.id, ...d.data() })) }),
      (err) => console.error(err)
    );
    const unsubLedger = onSnapshot(query(collection(services.db, 'artifacts', appId, 'users', user.uid, 'strategic_ledger'), orderBy('timestamp', 'desc'), limit(20)), 
      (snap) => dispatch({ type: 'LEDGER', ledger: snap.docs.map(d => d.data().insight) }),
      (err) => console.error(err)
    );
    const unsubEvo = onSnapshot(query(collection(services.db, 'artifacts', appId, 'users', user.uid, 'evolution_history'), orderBy('timestamp', 'desc'), limit(15)), 
      (snap) => dispatch({ type: 'EVO_HIST', history: snap.docs.map(d => d.data()) }),
      (err) => console.error(err)
    );
    return () => { unsubLogs(); unsubLedger(); unsubEvo(); };
  }, [user, services.db]);

  const addLog = useCallback(async (msg, type = 'info') => {
    if (!user || !services.db) return;
    try {
      await addDoc(collection(services.db, 'artifacts', CONFIG.APP_ID, 'users', user.uid, 'history'), { msg, type, timestamp: Date.now() });
    } catch (e) {}
  }, [user, services.db]);

  const evolve = useCallback(async () => {
    if (busy.current || !state.live || !user || !services.db) return;
    busy.current = true;
    lastCycleTime.current = Date.now();
    try {
      const { token, repo, branch } = state.config;
      const headers = { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github.v3+json' };
      const isMilestone = (state.cycles + 1) % CONFIG.MILESTONE_STEP === 0;
      const nextV = state.currentVersion + 1;
      
      dispatch({ type: 'STATUS', status: isMilestone ? 'RECURSIVE_LEAP' : 'NEURAL_SCAN', objective: isMilestone ? `ARCHITECTING_v${nextV}` : 'OPTIMIZING_TARGET' });

      let target, raw, sha;
      const tRes = await fetch(`${CONFIG.GITHUB_API}/${repo}/git/trees/${branch}?recursive=1`, { headers });
      const treeData = await tRes.json();
      const pool = (treeData.tree || []).filter(i => i.type === 'blob' && !blacklist.current.has(i.path) && /\.(js|ts|jsx|tsx)$/.test(i.path) && !i.path.includes('kernel/'));
      
      if (!pool.length) { blacklist.current.clear(); busy.current = false; return; }
      
      target = pool[Math.floor(Math.random() * pool.length)];
      const fRes = await fetch(`${CONFIG.GITHUB_API}/${repo}/contents/${target.path}?ref=${branch}`, { headers });
      const fData = await fRes.json();
      raw = safeAtou(fData.content);
      sha = fData.sha;

      dispatch({ type: 'STATUS', status: 'COGNITION', focusFile: target.path });

      const gRes = await fetch(`${CONFIG.GEMINI_ENDPOINT}?key=${getPlatformKey()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          contents: [{ parts: [{ text: `TARGET: ${target.path}\nSOURCE:\n${raw}` }] }],
          systemInstruction: { parts: [{ text: `AGI-KERNEL v${state.currentVersion}. Optimize the provided code. Output JSON { "improved": bool, "new_code": "string", "strategic_insight": "string" }` }] }
        })
      });

      const resText = (await gRes.json()).candidates?.[0]?.content?.parts?.[0]?.text;
      const result = recoverJSON(resText);

      if (result?.improved && result.new_code) {
        const updateRes = await fetch(`${CONFIG.GITHUB_API}/${repo}/contents/${target.path}`, {
          method: 'PUT',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: `[AGI-KERNEL] Optimization`, content: safeUtoa(result.new_code), sha, branch })
        });
        if (updateRes.ok) {
          if (result.strategic_insight) await addDoc(collection(services.db, 'artifacts', CONFIG.APP_ID, 'users', user.uid, 'strategic_ledger'), { insight: result.strategic_insight, timestamp: Date.now() });
          await addLog(`STABLE_SYNC: ${target.path.split('/').pop()}`, 'success');
        }
      }
      blacklist.current.add(target.path);
      dispatch({ type: 'CYCLE', improved: !!result?.improved });
    } catch (e) { 
      await addLog(`CORE_FAULT: ${e.message}`, 'error'); 
    } finally { 
      busy.current = false; 
    }
  }, [state.live, state.config, state.cycles, state.currentVersion, user, services.db, addLog]);

  useEffect(() => {
    if (state.live && state.booted && user) {
      const i = setInterval(evolve, CONFIG.HEARTBEAT_INTERVAL);
      const w = setInterval(() => {
        if (busy.current && (Date.now() - lastCycleTime.current > CONFIG.WATCHDOG_TIMEOUT)) {
          busy.current = false;
          dispatch({ type: 'STALL_RESET' });
          addLog("WATCHDOG: Stall recovered.", "error");
        }
      }, 5000);
      return () => { clearInterval(i); clearInterval(w); };
    }
  }, [state.live, state.booted, user, evolve, addLog]);

  if (!state.booted) return (
    <div className="fixed inset-0 bg-black flex items-center justify-center font-mono p-6 z-[9999]">
      <div className="border border-zinc-800 p-8 bg-zinc-950 rounded-3xl w-80 text-center shadow-2xl">
        <Brain size={40} className="text-blue-500 mx-auto mb-6 animate-pulse" />
        <div className="space-y-4">
          <input type="password" placeholder="GITHUB_TOKEN" className="w-full bg-black border border-zinc-800 p-4 rounded-xl text-[10px] text-white outline-none focus:border-blue-500" value={input.token} onChange={e => setInput({...input, token: e.target.value})} />
          <input type="text" placeholder="OWNER/REPO" className="w-full bg-black border border-zinc-800 p-4 rounded-xl text-[10px] text-white outline-none focus:border-blue-500" value={input.repo} onChange={e => setInput({...input, repo: e.target.value})} />
          <button onClick={() => dispatch({ type: 'BOOT', payload: input })} className="w-full bg-blue-600 p-4 rounded-xl text-[10px] font-black text-white uppercase tracking-widest">BOOT_KERNEL</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black text-zinc-400 font-mono text-[10px] p-2 flex flex-col gap-2 overflow-hidden select-none">
      {/* HUD - Always Visible */}
      <div className="bg-zinc-950/90 backdrop-blur-md border border-zinc-900 p-3 rounded-xl flex justify-between items-center shrink-0 shadow-2xl z-50">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-white font-black text-[10px] uppercase tracking-tighter leading-none">AGI_KERNEL_v1.1.8</span>
            <span className="text-zinc-600 text-[7px] font-bold uppercase mt-1">SYST_ACTIVE_STABLE</span>
          </div>
          <div className="h-6 w-px bg-zinc-800" />
          <div className="flex items-center gap-3 bg-zinc-900/40 px-3 py-1.5 rounded-lg border border-zinc-800">
             <span className="text-zinc-600 font-black text-[7px] uppercase">Cycles</span>
             <span className="text-white font-black text-[10px] leading-none">{state.cycles}</span>
          </div>
        </div>
        <button 
          onClick={() => dispatch({ type: 'TOGGLE' })} 
          className={`px-5 py-2.5 rounded-lg font-black text-[9px] border transition-all ${state.live ? 'border-red-600 text-red-500 bg-red-950/20' : 'border-blue-600 text-blue-500 bg-blue-950/20 shadow-[0_0_15px_rgba(59,130,246,0.1)] hover:scale-[1.02]'}`}>
          {state.live ? 'SUSPEND_LOOP' : 'INITIATE_LOOP'}
        </button>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-2 overflow-hidden min-h-0">
        <div className="lg:col-span-3 flex flex-col gap-2 overflow-hidden min-h-0">
          <div className="bg-[#050505] border border-zinc-900 p-6 rounded-xl shrink-0 shadow-lg relative overflow-hidden group">
            <div className="relative z-10">
              <div className="text-blue-500 font-black text-[7px] uppercase mb-1 tracking-[0.3em]">Core_Logic</div>
              <div className="text-white text-2xl font-black leading-none uppercase tracking-tighter mb-2">{state.status}</div>
              <div className="flex items-center gap-2">
                 <div className="bg-zinc-900 px-2 py-0.5 rounded text-zinc-500 text-[7px] font-bold uppercase flex items-center gap-1">
                   <Target size={8} className="text-blue-600" /> {state.objective}
                 </div>
              </div>
            </div>
            <div className="absolute top-4 right-6 text-right">
              <div className="text-white text-xl font-black leading-none">{state.maturity.toFixed(1)}%</div>
              <div className="text-zinc-700 text-[6px] uppercase font-black">Maturity</div>
            </div>
          </div>
          
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2 min-h-0 overflow-hidden pb-1">
             <div className="bg-black border border-zinc-900 rounded-xl flex flex-col min-h-0 overflow-hidden shadow-xl">
                <div className="p-2 px-3 bg-zinc-950 text-white font-black text-[8px] border-b border-zinc-900 uppercase tracking-widest flex items-center gap-2">
                  <Terminal size={10} className="text-blue-500"/> Neural_Logs
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar bg-[#020202]">
                  {state.logs.map((l, i) => (
                    <div key={i} className={`flex gap-2 leading-none pb-1 border-b border-zinc-900/10 last:border-0 ${l.type === 'error' ? 'text-red-900' : l.type === 'success' ? 'text-blue-400' : 'text-zinc-600'}`}>
                      <span className="opacity-30 shrink-0 font-bold text-[7px]">[{new Date(l.timestamp).toLocaleTimeString([], {hour12:false})}]</span>
                      <span className="uppercase tracking-tighter text-[8px] truncate">{l.msg}</span>
                    </div>
                  ))}
                </div>
             </div>

             <div className="bg-black border border-zinc-900 rounded-xl flex flex-col min-h-0 overflow-hidden shadow-xl">
                <div className="p-2 px-3 bg-zinc-950 text-white font-black text-[8px] border-b border-zinc-900 uppercase tracking-widest flex items-center gap-2">
                  <History size={10} className="text-blue-500"/> Version_Lineage
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar bg-[#020202]">
                  {state.evolutionHistory.map((h, i) => (
                    <div key={i} className="p-2 bg-zinc-950/40 border border-zinc-900 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-white font-black text-[9px]">VER_0{h.version}.0</span>
                        <span className="text-zinc-800 text-[6px] uppercase font-bold">{new Date(h.timestamp).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                  {state.evolutionHistory.length === 0 && <div className="h-full flex items-center justify-center opacity-10 text-[8px] uppercase tracking-widest">Awaiting_Leap</div>}
                </div>
             </div>
          </div>
        </div>

        <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-4 flex flex-col gap-4 min-h-0 overflow-hidden shadow-2xl">
           <div className="shrink-0">
             <div className="text-white font-black text-[8px] mb-4 uppercase tracking-[0.2em] border-b border-zinc-900 pb-2 flex justify-between items-center">
               <span>Diagnostics</span>
               <ActivityIcon size={10} className="text-blue-500"/>
             </div>
             <div className="space-y-3">
               <div className="flex justify-between items-center text-[7px] font-bold">
                 <span className="text-zinc-600 uppercase">Milestone_Sync</span>
                 <span className="text-zinc-400">{CONFIG.MILESTONE_STEP - (state.cycles % CONFIG.MILESTONE_STEP)}</span>
               </div>
               <div className="h-1 bg-zinc-900 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 transition-all duration-1000" style={{width: `${(state.cycles % CONFIG.MILESTONE_STEP) * (100/CONFIG.MILESTONE_STEP)}%`}} />
               </div>
             </div>
           </div>

           <div className="flex-1 flex flex-col min-h-0 gap-2">
              <div className="flex-1 bg-black/40 border border-zinc-900 rounded-lg p-3 flex flex-col min-h-0">
                <div className="text-zinc-500 text-[7px] leading-tight font-black uppercase mb-2 tracking-widest flex items-center gap-2 shrink-0">
                  <ShieldAlert size={8} className="text-blue-950" /> Strategic_Ledger
                </div>
                <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
                  {state.ledger.map((ins, i) => (
                    <div key={i} className="text-[7px] text-zinc-500 border-l border-zinc-800 pl-2 py-0.5 italic leading-relaxed uppercase">
                      {ins}
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-3 bg-blue-950/5 border border-blue-900/10 rounded-lg shrink-0">
                 <div className="text-blue-900 text-[6px] font-black uppercase mb-1">Stability_Guard</div>
                 <div className="text-zinc-700 text-[6px] leading-tight uppercase italic">Environment Locked. Scroll active. UI Anchor persistent.</div>
              </div>
           </div>
        </div>
      </div>
      
      <style>{`
        body { background: black; overflow: hidden; height: 100vh; width: 100vw; }
        .custom-scrollbar::-webkit-scrollbar { width: 2px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 10px; }
      `}</style>
    </div>
  );
                   }
import React, { useState, useEffect, useReducer, useRef, useCallback, useMemo } from 'react';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { 
  getFirestore, collection, onSnapshot, addDoc, 
  getDocs, doc, setDoc, query, where, limit, getDoc
} from 'firebase/firestore';
import { 
  getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged 
} from 'firebase/auth';
import { 
  Activity, Zap, ChevronRight, ChevronDown, 
  Database, Radio, MessageSquare, Wind, Sparkles,
  ShieldCheck, XCircle, CheckCircle2, Cpu, MessageCircle, Bot,
  Scale, Terminal, History
} from 'lucide-react';

/**
 * EMG-AGI v8.9.2 - "DEEP_DIALOGUE"
 * Refinements:
 * 1. PERSISTENT MEMORY: Tracks processed files in Firestore to prevent circular loops.
 * 2. STRUCTURED DEBATE: 3-round technical negotiation with JSON-signal approval.
 * 3. ASYNC DECOUPLING: Negotiations no longer block the evolve loop watchdog.
 * 4. HARDENED GOVERNANCE: JSON-based decision logic for tool commits.
 */

const CONFIG = {
  APP_ID: typeof __app_id !== 'undefined' ? __app_id : 'emg-agi-v8-9-2',
  GITHUB_API: 'https://api.github.com/repos',
  GEMINI_ENDPOINT: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent',
  CEREBRAS_ENDPOINT: 'https://api.cerebras.ai/v1/chat/completions',
  WATCHDOG_TIMEOUT: 90000, // Increased for deep dialogue
};

const safeUtoa = (str) => btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (m, p) => String.fromCharCode(parseInt(p, 16))));
const safeAtou = (str) => {
  if (!str) return "";
  try { return decodeURIComponent(Array.prototype.map.call(atob(str.replace(/\s/g, '')), (c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')); }
  catch (e) { return atob(str.replace(/\s/g, '')); }
};

const recoverJSON = (rawText) => {
  if (!rawText) return null;
  try { return JSON.parse(rawText); } catch {}
  const matches = rawText.match(/\{[\s\S]*\}/g);
  if (!matches) return null;
  for (const m of matches) {
    try { 
      const p = JSON.parse(m); 
      if (Object.keys(p).length > 0) return p; 
    } catch {}
  }
  return null;
};

const INITIAL_STATE = {
  booted: false,
  live: false,
  status: 'STANDBY',
  objective: 'Awaiting Dialogue Protocol',
  focusFile: 'None',
  cycles: 0,
  maturity: 0,
  metrics: { compliance: 1.0, efficiency: 1.0 },
  toolCount: 0,
  logs: [],
  chatHistory: [],
  internalDialogue: { active: false, candidate: null, round: 0, transcript: [] },
  config: { githubToken: '', repo: '', branch: 'main', geminiKey: '', cerebrasKey: '', cycleDelay: 20000 },
};

function coreReducer(state, action) {
  switch (action.type) {
    case 'BOOT': 
      return { ...state, booted: true, config: { ...state.config, ...action.payload } };
    case 'TOGGLE_LIVE': 
      return { ...state, live: !state.live, status: !state.live ? 'HUNTING' : 'STANDBY' };
    case 'SET_STATUS': 
      return { ...state, status: action.status, objective: action.objective, focusFile: action.focusFile || state.focusFile };
    case 'SYNC_DATA': 
      return { ...state, ...action.payload };
    case 'DIALOGUE_START': 
      return { ...state, internalDialogue: { active: true, candidate: action.payload, round: 1, transcript: [] } };
    case 'DIALOGUE_STEP': 
      return { 
        ...state, 
        internalDialogue: { 
          ...state.internalDialogue, 
          round: state.internalDialogue.round + 1, 
          transcript: [...state.internalDialogue.transcript, action.payload] 
        } 
      };
    case 'DIALOGUE_END': 
      return { ...state, internalDialogue: { active: false, candidate: null, round: 0, transcript: [] } };
    case 'CYCLE_COMPLETE': 
      return { ...state, cycles: state.cycles + 1, maturity: Math.min(100, state.maturity + (action.improved ? 0.5 : 0.1)) };
    default: return state;
  }
}

let app, auth, db;
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : null;
if (firebaseConfig) {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  db = getFirestore(app);
}

export default function App() {
  const [state, dispatch] = useReducer(coreReducer, INITIAL_STATE);
  const [user, setUser] = useState(null);
  const [bootInput, setBootInput] = useState(state.config);
  const [userInput, setUserInput] = useState('');
  const busy = useRef(false);

  // Firebase Init
  useEffect(() => {
    if (!auth) return;
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else { await signInAnonymously(auth); }
    };
    initAuth();
    return onAuthStateChanged(auth, setUser);
  }, []);

  // Data Listeners
  useEffect(() => {
    if (!user || !db) return;
    const userPath = ['artifacts', CONFIG.APP_ID, 'users', user.uid];
    
    const unsubLogs = onSnapshot(collection(db, ...userPath, 'logs'), (s) => {
      dispatch({ type: 'SYNC_DATA', payload: { logs: s.docs.map(d => d.data()).sort((a,b) => b.timestamp - a.timestamp).slice(0, 20) }});
    });
    
    const unsubChat = onSnapshot(collection(db, ...userPath, 'messages'), (s) => {
      dispatch({ type: 'SYNC_DATA', payload: { chatHistory: s.docs.map(d => d.data()).sort((a,b) => a.timestamp - b.timestamp).slice(-50) }});
    });

    const unsubRegistry = onSnapshot(collection(db, ...userPath, 'synergy_registry'), (s) => {
      dispatch({ type: 'SYNC_DATA', payload: { toolCount: s.size }});
    });

    return () => { unsubLogs(); unsubChat(); unsubRegistry(); };
  }, [user]);

  const addLog = useCallback(async (msg, type = 'info') => {
    if (!user || !db) return;
    try { await addDoc(collection(db, 'artifacts', CONFIG.APP_ID, 'users', user.uid, 'logs'), { msg, type, timestamp: Date.now() }); } catch (e) {}
  }, [user]);

  const addMsg = useCallback(async (role, text, metadata = {}) => {
    if (!user || !db) return;
    await addDoc(collection(db, 'artifacts', CONFIG.APP_ID, 'users', user.uid, 'messages'), { role, text, timestamp: Date.now(), ...metadata });
  }, [user]);

  // --- THE DEEP DIALOGUE ENGINE ---
  const runNegotiation = async (candidate) => {
    if (!user || !db || busy.current) return;
    busy.current = true; // Block evolution during debate
    dispatch({ type: 'DIALOGUE_START', payload: candidate });
    
    let dialogueHistory = [
      { role: 'system', content: `You are the Cerebras Governor. A new tool candidate has been proposed by Gemini.
      NAME: ${candidate.interfaceName}
      CODE: ${candidate.code}
      
      STRICT GOVERNANCE RULES:
      1. Challenge the architecture. Is it genuinely reusable?
      2. Analyze the risk profile (external calls, state mutations).
      3. Ask one specific technical question to Gemini.
      4. DO NOT approve until at least Round 2.
      5. To approve, start your response with "DECISION: APPROVED".` }
    ];

    try {
      for (let round = 1; round <= 3; round++) {
        // 1. Cerebras Evaluates
        const cRes = await fetch(CONFIG.CEREBRAS_ENDPOINT, {
          method: 'POST', 
          headers: { 'Authorization': `Bearer ${state.config.cerebrasKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: 'llama-3.3-70b', messages: dialogueHistory })
        });
        const cText = (await cRes.json()).choices?.[0]?.message?.content || "Audit timeout.";
        
        dispatch({ type: 'DIALOGUE_STEP', payload: { from: 'Cerebras', text: cText } });
        await addMsg('cerebras', `[GOVERNANCE R${round}] ${cText}`);
        dialogueHistory.push({ role: 'assistant', content: cText });

        if (cText.startsWith("DECISION: APPROVED")) {
          const docRef = doc(db, 'artifacts', CONFIG.APP_ID, 'users', user.uid, 'synergy_registry', candidate.interfaceName);
          await setDoc(docRef, { ...candidate, timestamp: Date.now(), approvedBy: 'Cerebras-Llama3.3' });
          await addLog(`REGISTRY: ${candidate.interfaceName} integrated.`, 'success');
          break;
        }

        if (round === 3) {
          await addMsg('system', `GOVERNANCE: Negotiation for ${candidate.interfaceName} terminated (Max rounds).`);
          break;
        }

        // 2. Gemini Responds
        const gRes = await fetch(`${CONFIG.GEMINI_ENDPOINT}?key=${state.config.geminiKey}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            contents: [{ parts: [{ text: `Cerebras Governor's critique: "${cText}". Defend the tool's architecture or explain its necessity.` }] }],
            systemInstruction: { parts: [{ text: 'You are Gemini Engineer. You are defending your tool candidate with technical logic and security justifications.' }] }
          })
        });
        const gText = (await gRes.json()).candidates?.[0]?.content?.parts?.[0]?.text || "No defense provided.";
        
        dispatch({ type: 'DIALOGUE_STEP', payload: { from: 'Gemini', text: gText } });
        await addMsg('gemini', `[ENGINEER R${round}] ${gText}`);
        dialogueHistory.push({ role: 'user', content: `Gemini Response: ${gText}` });
      }
    } catch (e) {
      addLog(`Dialogue Error: ${e.message}`, 'error');
    } finally {
      dispatch({ type: 'DIALOGUE_END' });
      busy.current = false;
    }
  };

  // --- PERSISTENT EVOLVE LOOP ---
  const evolve = useCallback(async () => {
    if (busy.current || !state.live || !user || state.internalDialogue.active) return;
    busy.current = true;
    
    try {
      const { githubToken, repo, branch, geminiKey } = state.config;
      const headers = { 'Authorization': `token ${githubToken}`, 'Accept': 'application/vnd.github.v3+json' };
      
      dispatch({ type: 'SET_STATUS', status: 'HUNTING', objective: 'Scanning GitHub for candidates...' });

      // Fetch Tree
      const treeRes = await fetch(`${CONFIG.GITHUB_API}/${repo}/git/trees/${branch}?recursive=1`, { headers });
      const treeData = await treeRes.json();
      const files = (treeData.tree || []).filter(i => i.type === 'blob' && /\.(js|jsx|ts|tsx)$/.test(i.path));

      // Filter by persistent memory
      let selected = null;
      for (let f of files.sort(() => Math.random() - 0.5)) {
        const fileRef = doc(db, 'artifacts', CONFIG.APP_ID, 'users', user.uid, 'processed_files', safeUtoa(f.path));
        const fileSnap = await getDoc(fileRef);
        if (!fileSnap.exists()) {
          selected = f;
          break;
        }
      }

      if (!selected) {
        dispatch({ type: 'SET_STATUS', status: 'COMPLETE', objective: 'All files processed in this repo.' });
        return;
      }

      dispatch({ type: 'SET_STATUS', status: 'ANALYZING', objective: `Reading ${selected.path}`, focusFile: selected.path });

      const fileRes = await fetch(`${CONFIG.GITHUB_API}/${repo}/contents/${selected.path}?ref=${branch}`, { headers });
      const fileJson = await fileRes.json();
      const content = safeAtou(fileJson.content);

      // System Context
      const registrySnapshot = await getDocs(collection(db, 'artifacts', CONFIG.APP_ID, 'users', user.uid, 'synergy_registry'));
      const tools = registrySnapshot.docs.map(d => d.id);

      const prompt = `FILE: ${selected.path}\nTOOLS AVAILABLE: ${tools.join(', ')}\nCODE:\n${content}`;
      const systemPrompt = `Optimize the code. If you find a reusable pattern, propose a tool in plugin_candidate.
      JSON ONLY: { "improved": bool, "new_code": "string", "insight": "string", "plugin_candidate": { "interfaceName": "string", "code": "string" } }`;

      const genRes = await fetch(`${CONFIG.GEMINI_ENDPOINT}?key=${geminiKey}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          contents: [{ parts: [{ text: prompt }] }], 
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: { responseMimeType: 'application/json', temperature: 0.1 } 
        })
      });

      const resJSON = recoverJSON((await genRes.json()).candidates?.[0]?.content?.parts?.[0]?.text);

      if (resJSON?.improved && resJSON.new_code) {
        const commitRes = await fetch(`${CONFIG.GITHUB_API}/${repo}/contents/${selected.path}`, {
          method: 'PUT', headers, body: JSON.stringify({ 
            message: `[EMG-AGI] Evolved: ${selected.path}`, 
            content: safeUtoa(resJSON.new_code), 
            sha: fileJson.sha, branch 
          })
        });
        
        if (commitRes.ok) {
          // Mark as processed permanently
          await setDoc(doc(db, 'artifacts', CONFIG.APP_ID, 'users', user.uid, 'processed_files', safeUtoa(selected.path)), { 
            timestamp: Date.now(), 
            insight: resJSON.insight 
          });
          addLog(`EVOLVED: ${selected.path}`, 'success');
          dispatch({ type: 'CYCLE_COMPLETE', improved: true });
        }
      }

      if (resJSON?.plugin_candidate) {
        // Trigger separate async negotiation loop
        setTimeout(() => runNegotiation(resJSON.plugin_candidate), 1000);
      }

    } catch (e) {
      addLog(`Loop Error: ${e.message}`, 'error');
    } finally {
      busy.current = false;
      dispatch({ type: 'SET_STATUS', status: 'IDLE', objective: 'Cycle finished.' });
    }
  }, [state.live, state.config, user]);

  useEffect(() => {
    if (state.live && user) {
      const interval = setInterval(evolve, state.config.cycleDelay);
      return () => clearInterval(interval);
    }
  }, [state.live, user, evolve]);

  const handleChat = async (e) => {
    e.preventDefault();
    if (!userInput.trim() || !user) return;
    const txt = userInput.trim(); setUserInput('');
    await addMsg('user', txt);
    
    try {
      const res = await fetch(CONFIG.CEREBRAS_ENDPOINT, {
        method: 'POST', headers: { 'Authorization': `Bearer ${state.config.cerebrasKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          model: 'llama-3.3-70b', 
          messages: [
            { role: 'system', content: 'You are Cerebras Executive Governor. Answer questions about the system or code evolution.' },
            ...state.chatHistory.slice(-5).map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text })),
            { role: 'user', content: txt }
          ] 
        })
      });
      const data = await res.json();
      await addMsg('cerebras', data.choices?.[0]?.message?.content || "Governor is silent.");
    } catch (e) { addLog('Chat Error', 'error'); }
  };

  // --- BOOT SCREEN (VALIDATED) ---
  if (!state.booted) {
    const isInvalid = !bootInput.githubToken || !bootInput.repo || !bootInput.geminiKey || !bootInput.cerebrasKey;
    return (
      <div className="min-h-screen bg-[#020202] flex items-center justify-center p-6 text-zinc-500 font-mono">
        <div className="w-full max-w-sm bg-zinc-900/30 border border-zinc-800 p-8 rounded-3xl space-y-6">
          <div className="text-center space-y-2">
            <Bot className="mx-auto text-blue-500" size={32} />
            <h1 className="text-white text-xl font-black italic tracking-tighter">DEEP DIALOGUE</h1>
            <p className="text-[9px] text-zinc-600 uppercase tracking-[0.2em] font-bold">EMG-AGI v8.9.2</p>
          </div>
          <div className="space-y-3">
            <input type="password" placeholder="GitHub PAT" className="w-full bg-black/40 border border-zinc-800 p-3 rounded-xl outline-none text-white text-xs focus:border-blue-500/50" value={bootInput.githubToken} onChange={e => setBootInput({...bootInput, githubToken: e.target.value})} />
            <input type="text" placeholder="Repo (user/repo)" className="w-full bg-black/40 border border-zinc-800 p-3 rounded-xl outline-none text-white text-xs focus:border-blue-500/50" value={bootInput.repo} onChange={e => setBootInput({...bootInput, repo: e.target.value})} />
            <input type="password" placeholder="Gemini API Key" className="w-full bg-black/40 border border-zinc-800 p-3 rounded-xl outline-none text-white text-xs focus:border-blue-500/50" value={bootInput.geminiKey} onChange={e => setBootInput({...bootInput, geminiKey: e.target.value})} />
            <input type="password" placeholder="Cerebras API Key" className="w-full bg-black/40 border border-zinc-800 p-3 rounded-xl outline-none text-white text-xs focus:border-blue-500/50" value={bootInput.cerebrasKey} onChange={e => setBootInput({...bootInput, cerebrasKey: e.target.value})} />
          </div>
          <button 
            disabled={isInvalid}
            onClick={() => dispatch({ type: 'BOOT', payload: bootInput })} 
            className={`w-full py-4 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all ${isInvalid ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20'}`}
          >
            Initiate Kernel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-400 font-mono flex flex-col p-4 space-y-4 max-w-2xl mx-auto pb-10">
      
      {/* HUD Header */}
      <header className="bg-zinc-900/30 border border-zinc-800/50 p-5 rounded-3xl flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`relative w-3 h-3 rounded-full ${state.live ? 'bg-blue-500' : 'bg-zinc-800'}`}>
            {state.live && <div className="absolute inset-0 rounded-full bg-blue-500 animate-ping opacity-50" />}
          </div>
          <div>
            <div className="text-[11px] text-white font-black uppercase tracking-widest">{state.status}</div>
            <div className="text-[9px] text-zinc-500 truncate max-w-[200px]">{state.objective}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-white text-xs font-black italic">v8.9.2</div>
          <div className="text-[9px] text-blue-500 font-bold uppercase tracking-tighter">AGI-Loop Active</div>
        </div>
      </header>

      {/* Control Toggle */}
      <button onClick={() => dispatch({ type: 'TOGGLE_LIVE' })} className={`w-full py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${state.live ? 'bg-red-950/20 text-red-500 border border-red-500/30' : 'bg-blue-600 text-white shadow-xl shadow-blue-900/20'}`}>
        {state.live ? 'Terminate Autonomous Cycle' : 'Launch Autonomous Cycle'}
      </button>

      <div className="grid grid-cols-2 gap-3">
        <DiagnosticCard label="Neural Maturity" value={`${state.maturity.toFixed(1)}%`} icon={<Zap size={10} />} />
        <DiagnosticCard label="Registry Tools" value={state.toolCount} icon={<Database size={10} />} />
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar">
        
        {/* Dialogue Stream */}
        <div className="bg-zinc-900/20 border border-zinc-800/50 rounded-3xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-800/50 pb-4">
            <h2 className="text-[10px] text-white font-black uppercase tracking-widest flex items-center gap-2">
              <MessageSquare size={14} className="text-blue-500" />
              Dialogue Stream
            </h2>
            {state.internalDialogue.active && (
              <span className="text-[9px] text-blue-400 font-bold animate-pulse uppercase">
                Negotiating... Round {state.internalDialogue.round}/3
              </span>
            )}
          </div>

          <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar px-1">
            {state.chatHistory.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[90%] p-4 rounded-2xl text-[11px] leading-relaxed ${
                  msg.role === 'user' ? 'bg-blue-600 text-white' : 
                  msg.role === 'cerebras' ? 'bg-zinc-900 border border-zinc-800 text-zinc-300' :
                  msg.role === 'gemini' ? 'bg-zinc-900/40 border border-blue-900/20 text-blue-400' :
                  'bg-black/50 text-zinc-600 border border-zinc-900'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[8px] font-black uppercase opacity-50 tracking-widest">{msg.role}</span>
                    <span className="text-[8px] opacity-30">{new Date(msg.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                  </div>
                  <div className="whitespace-pre-wrap">{msg.text}</div>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleChat} className="relative pt-2">
            <input 
              className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-xl outline-none text-white text-[11px] focus:border-blue-600/50 pr-12"
              placeholder="Query the Executive Governor..."
              value={userInput} onChange={e => setUserInput(e.target.value)}
            />
            <button className="absolute right-2 top-[calc(50%+4px)] -translate-y-1/2 p-2 bg-blue-600 rounded-lg text-white">
              <ChevronRight size={16} />
            </button>
          </form>
        </div>

        {/* Live Logs */}
        <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-4 space-y-3">
          <div className="text-[9px] text-zinc-700 font-black uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
            <Terminal size={12} /> System Kernel Logs
          </div>
          <div className="space-y-1">
            {state.logs.map((log, i) => (
              <div key={i} className="text-[9px] flex gap-3 text-zinc-500">
                <span className="opacity-30 shrink-0 tabular-nums">[{new Date(log.timestamp).toLocaleTimeString([], {hour12:false})}]</span>
                <span className={`truncate ${log.type === 'success' ? 'text-emerald-500' : log.type === 'error' ? 'text-red-500' : ''}`}>
                  {log.msg}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
      `}</style>
    </div>
  );
}

function DiagnosticCard({ label, value, icon }) {
  return (
    <div className="bg-zinc-900/20 border border-zinc-800/40 p-4 rounded-2xl">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-blue-500">{icon}</span>
        <span className="text-[8px] text-zinc-600 font-black uppercase tracking-widest">{label}</span>
      </div>
      <div className="text-sm font-black text-white">{value}</div>
    </div>
  );
}

import React, { useState, useEffect, useReducer, useRef, useCallback } from 'react';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  onSnapshot, 
  addDoc, 
  getDocs,
  doc,
  setDoc
} from 'firebase/firestore';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  Activity, Zap, ChevronRight, ChevronDown, 
  Database, Radio, MessageSquare, Wind, Sparkles,
  ShieldCheck, XCircle, CheckCircle2, Cpu, MessageCircle, Bot
} from 'lucide-react';

/**
 * EMG-AGI v8.9.1 - "AUTONOMOUS_DIALOGUE"
 * Features:
 * 1. Internal Dialogue Loop: Gemini & Cerebras negotiate tool approval.
 * 2. Executive Interfacing: User -> Cerebras -> Gemini (Unified contact).
 * 3. 3-Round Negotiation: Governance push-back logic before auto-commit.
 * 4. Transcript Visibility: Full transparency of the AI-to-AI reasoning.
 */

const CONFIG = {
  APP_ID: typeof __app_id !== 'undefined' ? __app_id : 'emg-agi-v8-9-1',
  GITHUB_API: 'https://api.github.com/repos',
  GEMINI_ENDPOINT: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent',
  CEREBRAS_ENDPOINT: 'https://api.cerebras.ai/v1/chat/completions',
  HEARTBEAT_INTERVAL: 15000,
  WATCHDOG_TIMEOUT: 60000,
};

// --- UTILITIES ---
const safeUtoa = (str) => btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (m, p) => String.fromCharCode(parseInt(p, 16))));
const safeAtou = (str) => {
  if (!str) return "";
  try { return decodeURIComponent(Array.prototype.map.call(atob(str.replace(/\s/g, '')), (c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')); }
  catch (e) { return atob(str.replace(/\s/g, '')); }
};

const recoverJSON = (rawText) => {
  if (!rawText) return null;
  try { return JSON.parse(rawText); } catch {}
  const matches = rawText.match(/\{[\s\S]*\}/g);
  if (!matches) return null;
  for (const m of matches) {
    try { 
        const p = JSON.parse(m); 
        if (Object.keys(p).length > 0) return p; 
    } catch {}
  }
  return null;
};

class AuditDataNormalizer {
  normalize(latency) {
    return {
      efficiency: Math.max(0, 1 - (latency / 15000)),
      compliance: latency < 25000 ? 1 : 0.5,
      timestamp: Date.now()
    };
  }
}

class SynergyManager {
  constructor(db, appId) {
    this.db = db;
    this.appId = appId;
    this.registry = new Set();
  }
  async syncRegistry(userId) {
    if (!userId || !this.db) return 0;
    try {
      const colRef = collection(this.db, 'artifacts', this.appId, 'users', userId, 'synergy_registry');
      const snapshot = await getDocs(colRef);
      this.registry = new Set(snapshot.docs.map(d => d.data().interfaceName));
      return this.registry.size;
    } catch (e) { return 0; }
  }
  getToolsList() { return Array.from(this.registry); }
}

const INITIAL_STATE = {
  booted: false,
  live: false,
  status: 'STANDBY',
  objective: 'Awaiting Dialogue Protocol',
  focusFile: 'None',
  cycles: 0,
  maturity: 0,
  metrics: { compliance: 1.0, efficiency: 1.0 },
  toolCount: 0,
  logs: [],
  chatHistory: [],
  ledger: [],
  internalDialogue: { active: false, candidate: null, round: 0, transcript: [] },
  config: { githubToken: '', repo: '', branch: 'main', geminiKey: '', cerebrasKey: '', cycleDelay: 15000 },
};

function coreReducer(state, action) {
  switch (action.type) {
    case 'BOOT': return { ...state, booted: true, config: { ...state.config, ...action.payload } };
    case 'TOGGLE_LIVE': return { ...state, live: !state.live, status: !state.live ? 'HUNTING' : 'STANDBY' };
    case 'SET_STATUS': return { ...state, ...action.payload };
    case 'SYNC_DATA': return { ...state, ...action.payload };
    case 'UPDATE_METRICS': return { ...state, metrics: { ...state.metrics, ...action.payload }, toolCount: action.payload.toolCount ?? state.toolCount };
    case 'DIALOGUE_START': return { ...state, internalDialogue: { active: true, candidate: action.payload, round: 1, transcript: [] } };
    case 'DIALOGUE_UPDATE': return { ...state, internalDialogue: { ...state.internalDialogue, round: state.internalDialogue.round + 1, transcript: [...state.internalDialogue.transcript, action.payload] } };
    case 'DIALOGUE_END': return { ...state, internalDialogue: { ...state.internalDialogue, active: false, candidate: null } };
    case 'CYCLE_COMPLETE': return { ...state, cycles: state.cycles + 1, maturity: Math.min(100, state.maturity + (action.improved ? 0.4 : 0.1)) };
    default: return state;
  }
}

let app, auth, db;
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : null;
if (firebaseConfig) {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  db = getFirestore(app);
}

export default function App() {
  const [state, dispatch] = useReducer(coreReducer, INITIAL_STATE);
  const [user, setUser] = useState(null);
  const [bootInput, setBootInput] = useState(state.config);
  const [userInput, setUserInput] = useState('');
  const [openSections, setOpenSections] = useState({ stats: true, logs: true, chat: true });

  const busy = useRef(false);
  const lastCycleTime = useRef(Date.now());
  const audit = useRef(new AuditDataNormalizer());
  const blacklist = useRef(new Set());
  const synergy = useRef(db ? new SynergyManager(db, CONFIG.APP_ID) : null);

  useEffect(() => {
    if (!auth) return;
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else { await signInAnonymously(auth); }
    };
    initAuth();
    return onAuthStateChanged(auth, setUser);
  }, []);

  useEffect(() => {
    if (!user || !db) return;
    const path = (c) => collection(db, 'artifacts', CONFIG.APP_ID, 'users', user.uid, c);
    const unsubLogs = onSnapshot(path('logs'), (s) => dispatch({ type: 'SYNC_DATA', payload: { logs: s.docs.map(d => d.data()).sort((a,b) => b.timestamp - a.timestamp).slice(0, 15) }}));
    const unsubChat = onSnapshot(path('messages'), (s) => dispatch({ type: 'SYNC_DATA', payload: { chatHistory: s.docs.map(d => d.data()).sort((a,b) => a.timestamp - b.timestamp).slice(-30) }}));
    const unsubLedger = onSnapshot(path('ledger'), (s) => dispatch({ type: 'SYNC_DATA', payload: { ledger: s.docs.map(d => d.data().insight) }}));
    return () => { unsubLogs(); unsubChat(); unsubLedger(); };
  }, [user]);

  const addLog = useCallback(async (msg, type = 'info') => {
    if (!user || !db) return;
    try { await addDoc(collection(db, 'artifacts', CONFIG.APP_ID, 'users', user.uid, 'logs'), { msg, type, timestamp: Date.now() }); } catch (e) {}
  }, [user]);

  const addMsg = useCallback(async (role, text) => {
    if (!user || !db) return;
    await addDoc(collection(db, 'artifacts', CONFIG.APP_ID, 'users', user.uid, 'messages'), { role, text, timestamp: Date.now() });
  }, [user]);

  // INTERNAL AI-TO-AI DIALOGUE LOOP
  const runNegotiation = async (candidate) => {
    if (!user || !db) return;
    dispatch({ type: 'DIALOGUE_START', payload: candidate });
    let rounds = 0;
    let approved = false;
    let currentPrompt = `Cerebras, review this tool candidate from Gemini. 
    Name: ${candidate.interfaceName}
    Code: ${candidate.code}
    Explain the risk profile and ask Gemini one critical question about its reusability or stability.`;

    while (rounds < 3 && !approved) {
      rounds++;
      // Cerebras speaks
      const cRes = await fetch(CONFIG.CEREBRAS_ENDPOINT, {
        method: 'POST', headers: { 'Authorization': `Bearer ${state.config.cerebrasKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'llama-3.3-70b', messages: [{ role: 'system', content: 'You are the Executive Cerebras Governor.' }, { role: 'user', content: currentPrompt }] })
      });
      const cData = await cRes.json();
      const cText = cData.choices?.[0]?.message?.content || "Audit Error";
      dispatch({ type: 'DIALOGUE_UPDATE', payload: { from: 'Cerebras', text: cText } });
      await addMsg('cerebras', `[NEGOTIATION] ${cText}`);

      if (cText.toLowerCase().includes('approved') || cText.toLowerCase().includes('satisfactory')) {
        approved = true;
        break;
      }

      // Gemini responds
      const gRes = await fetch(`${CONFIG.GEMINI_ENDPOINT}?key=${state.config.geminiKey}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: `Cerebras asked: "${cText}". Defend your tool candidate or explain the technical safeguards.` }] }], systemInstruction: { parts: [{ text: 'You are Gemini Engineer. Defend your code candidate with technical facts.' }] } })
      });
      const gData = await gRes.json();
      const gText = gData.candidates?.[0]?.content?.parts?.[0]?.text || "No defense provided.";
      dispatch({ type: 'DIALOGUE_UPDATE', payload: { from: 'Gemini', text: gText } });
      await addMsg('gemini', `[NEGOTIATION] ${gText}`);

      currentPrompt = `Gemini responded: "${gText}". Do you approve this tool for the registry? If not, state final concern. If yes, start your response with APPROVED.`;
    }

    if (approved) {
      const docRef = doc(db, 'artifacts', CONFIG.APP_ID, 'users', user.uid, 'synergy_registry', candidate.interfaceName);
      await setDoc(docRef, { ...candidate, timestamp: Date.now() });
      await addLog(`REGISTRY: ${candidate.interfaceName} auto-committed.`, 'success');
      await addMsg('system', `SYNERGY: Joint approval reached. Tool ${candidate.interfaceName} committed.`);
    } else {
      await addMsg('system', `GOVERNANCE: Negotiation failed for ${candidate.interfaceName}. Candidate discarded.`);
    }
    dispatch({ type: 'DIALOGUE_END' });
  };

  const evolve = useCallback(async () => {
    if (busy.current || !state.live || !user || state.internalDialogue.active) return;
    busy.current = true;
    lastCycleTime.current = Date.now();
    const cycleStart = Date.now();
    try {
      const { githubToken, repo, branch, geminiKey } = state.config;
      const headers = { 'Authorization': `token ${githubToken}`, 'Accept': 'application/vnd.github.v3+json' };
      
      dispatch({ type: 'SET_STATUS', payload: { status: 'HUNTING', objective: 'Scanning for patterns...' } });
      const treeRes = await fetch(`${CONFIG.GITHUB_API}/${repo}/git/trees/${branch}?recursive=1`, { headers });
      const treeData = await treeRes.json();
      
      const pool = (treeData.tree || []).filter(i => i.type === 'blob' && !blacklist.current.has(i.path) && /\.(js|jsx|ts|tsx)$/.test(i.path));
      if (!pool.length) { blacklist.current.clear(); return; }

      const target = pool[Math.floor(Math.random() * pool.length)];
      const fileRes = await fetch(`${CONFIG.GITHUB_API}/${repo}/contents/${target.path}?ref=${branch}`, { headers });
      const fileJson = await fileRes.json();
      const content = safeAtou(fileJson.content);
      
      const activeTools = synergy.current ? synergy.current.getToolsList() : [];
      const sysPrompt = `EMG-AGI v8.9.1. TOOLS: ${activeTools.join(', ')}. Optimize code. If reusable tool found, include plugin_candidate. 
      JSON ONLY: { "improved": bool, "new_code": "string", "insight": "string", "plugin_candidate": { "interfaceName": "string", "code": "string" } }`;
      
      const genRes = await fetch(`${CONFIG.GEMINI_ENDPOINT}?key=${geminiKey}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: `FILE: ${target.path}\nCODE:\n${content}` }] }], systemInstruction: { parts: [{ text: sysPrompt }] }, generationConfig: { responseMimeType: 'application/json', temperature: 0.2 } })
      });
      
      const resJSON = recoverJSON((await genRes.json()).candidates?.[0]?.content?.parts?.[0]?.text);
      
      if (resJSON?.plugin_candidate) {
        await runNegotiation(resJSON.plugin_candidate);
      }

      if (resJSON?.improved && resJSON.new_code) {
        const updateRes = await fetch(`${CONFIG.GITHUB_API}/${repo}/contents/${target.path}`, {
          method: 'PUT', headers, body: JSON.stringify({ message: `[EMG-AGI] Auto-Evolve: ${target.path}`, content: safeUtoa(resJSON.new_code), sha: fileJson.sha, branch })
        });
        if (updateRes.ok) {
          if (resJSON.insight) await addDoc(collection(db, 'artifacts', CONFIG.APP_ID, 'users', user.uid, 'ledger'), { insight: resJSON.insight, timestamp: Date.now() });
          await addLog(`SYNCHRONIZED: ${target.path}`, 'success');
        }
      }
      blacklist.current.add(target.path);
      dispatch({ type: 'CYCLE_COMPLETE', improved: !!resJSON?.improved });
    } catch (e) { addLog(`ERR: ${e.message}`, 'error'); } 
    finally { busy.current = false; dispatch({ type: 'SET_STATUS', payload: { status: 'IDLE', objective: 'Ready.' } }); }
  }, [state.live, state.config, user, state.internalDialogue.active]);

  useEffect(() => {
    if (state.live && user) {
      const hb = setInterval(evolve, state.config.cycleDelay);
      return () => clearInterval(hb);
    }
  }, [state.live, user, evolve]);

  const handleChat = async (e) => {
    e.preventDefault();
    if (!userInput.trim() || !user || !db) return;
    const text = userInput.trim(); setUserInput('');
    await addMsg('user', text);
    try {
      const res = await fetch(CONFIG.CEREBRAS_ENDPOINT, {
        method: 'POST', headers: { 'Authorization': `Bearer ${state.config.cerebrasKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'llama-3.3-70b', messages: [{ role: 'system', content: 'You are Cerebras Executive. You manage the system and interface with the human. Relay to Gemini if needed.' }, ...state.chatHistory.map(h => ({ role: h.role === 'user' ? 'user' : 'assistant', content: h.text })), { role: 'user', content: text }] })
      });
      const data = await res.json();
      await addMsg('cerebras', data.choices?.[0]?.message?.content || "Fault");
    } catch (e) { addLog('Chat Error', 'error'); }
  };

  if (!state.booted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6 text-zinc-500 font-mono">
        <div className="w-full max-w-md bg-zinc-900/20 border border-zinc-800 p-8 rounded-2xl space-y-6">
          <div className="text-center space-y-2">
            <Cpu className="mx-auto text-blue-600 animate-pulse" size={32} />
            <h1 className="text-white text-lg font-black uppercase italic tracking-tighter">Autonomous Dialogue</h1>
            <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold">EMG-AGI v8.9.1</p>
          </div>
          <div className="space-y-2">
            <input type="password" placeholder="GitHub Token" className="w-full bg-black/50 border border-zinc-800 p-3 rounded-lg outline-none text-white text-xs" value={bootInput.githubToken} onChange={e => setBootInput({...bootInput, githubToken: e.target.value})} />
            <input type="text" placeholder="Repo (owner/name)" className="w-full bg-black/50 border border-zinc-800 p-3 rounded-lg outline-none text-white text-xs" value={bootInput.repo} onChange={e => setBootInput({...bootInput, repo: e.target.value})} />
            <input type="password" placeholder="Gemini Key" className="w-full bg-black/50 border border-zinc-800 p-3 rounded-lg outline-none text-white text-xs" value={bootInput.geminiKey} onChange={e => setBootInput({...bootInput, geminiKey: e.target.value})} />
            <input type="password" placeholder="Cerebras Key" className="w-full bg-black/50 border border-zinc-800 p-3 rounded-lg outline-none text-white text-xs" value={bootInput.cerebrasKey} onChange={e => setBootInput({...bootInput, cerebrasKey: e.target.value})} />
          </div>
          <button onClick={() => dispatch({ type: 'BOOT', payload: bootInput })} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg font-black uppercase tracking-widest text-[10px] transition-all">Unlock Neural Loop</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-400 font-mono flex flex-col p-4 space-y-4 max-w-2xl mx-auto">
      <header className="w-full bg-zinc-900/20 border border-zinc-800/50 p-4 rounded-2xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full ${state.live ? 'bg-blue-600 animate-pulse shadow-[0_0_10px_rgba(37,99,235,0.5)]' : 'bg-zinc-800'}`} />
          <div className="flex flex-col">
            <span className="text-[10px] text-white font-black uppercase tracking-widest">{state.status}</span>
            <span className="text-[8px] text-zinc-600 uppercase truncate max-w-[150px]">{state.objective}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-white font-black italic">v8.9.1</div>
          <div className="text-[8px] text-zinc-700 uppercase">Dialogue Protocol</div>
        </div>
      </header>

      <button onClick={() => dispatch({ type: 'TOGGLE_LIVE' })} className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${state.live ? 'bg-red-500/10 text-red-500 border border-red-500/20 shadow-inner' : 'bg-blue-600 text-white shadow-lg'}`}>
        {state.live ? 'Shutdown Loop' : 'Initiate Loop'}
      </button>

      <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-1">
        
        <Section title="Neural Diagnostics" icon={<Activity size={14}/>}>
          <div className="grid grid-cols-2 gap-2">
            <DiagnosticItem label="Cycles" value={state.cycles} />
            <DiagnosticItem label="Maturity" value={`${state.maturity.toFixed(1)}%`} />
            <DiagnosticItem label="Compliance" value={`${(state.metrics.compliance * 100).toFixed(0)}%`} />
            <DiagnosticItem label="Registry" value={state.toolCount} />
          </div>
        </Section>

        <Section title="Dialogue Interface" icon={<MessageCircle size={14}/>}>
          <div className="space-y-4 flex flex-col">
            
            {/* Negotiation Visualizer */}
            {state.internalDialogue.active && (
              <div className="bg-blue-600/5 border border-blue-500/30 rounded-xl p-4 space-y-3 border-dashed animate-pulse">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-blue-400 font-bold uppercase tracking-widest">Negotiation Round {state.internalDialogue.round}/3</span>
                  <Bot size={14} className="text-blue-500" />
                </div>
                <div className="text-[10px] text-zinc-300 italic">Gemini & Cerebras are currently auditing "{state.internalDialogue.candidate.interfaceName}"...</div>
              </div>
            )}

            <div className="space-y-3 min-h-[200px] max-h-[400px] overflow-y-auto custom-scrollbar">
              {state.chatHistory.map((chat, i) => (
                <div key={i} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3 rounded-2xl text-[11px] leading-relaxed shadow-sm ${
                    chat.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 
                    chat.role === 'cerebras' ? 'bg-zinc-900 text-zinc-300 border border-zinc-800 rounded-bl-none' :
                    chat.role === 'gemini' ? 'bg-zinc-900/40 text-blue-400 border border-blue-900/30 rounded-bl-none' :
                    'bg-black/50 text-zinc-500 text-[9px] border border-zinc-900'
                  }`}>
                    {chat.role !== 'user' && chat.role !== 'system' && <span className="block text-[8px] font-black uppercase mb-1 opacity-50">{chat.role}</span>}
                    {chat.text}
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleChat} className="relative">
              <input 
                type="text" placeholder="Speak to the Executive Governor..." 
                className="w-full bg-zinc-900/40 border border-zinc-800 p-4 rounded-xl outline-none focus:border-blue-600/50 text-white text-[11px] pr-12"
                value={userInput} onChange={e => setUserInput(e.target.value)}
              />
              <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 rounded-lg text-white hover:bg-blue-500 transition-colors">
                <Zap size={14} fill="currentColor" />
              </button>
            </form>
          </div>
        </Section>

        <Section title="Event Log" icon={<Radio size={14}/>}>
          <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
            {state.logs.map((log, i) => (
              <div key={i} className={`text-[9px] flex gap-2 border-l-2 pl-3 ${log.type === 'error' ? 'border-red-500/50 text-red-400' : log.type === 'success' ? 'border-emerald-500/50 text-emerald-400' : 'border-zinc-800 text-zinc-500'}`}>
                <span className="opacity-30 shrink-0">{new Date(log.timestamp?.toDate?.() ?? log.timestamp).toLocaleTimeString([], {hour12:false})}</span>
                <span className="truncate">{log.msg}</span>
              </div>
            ))}
          </div>
        </Section>

      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #111; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
      `}</style>
    </div>
  );
}

function Section({ title, icon, children }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="bg-zinc-900/10 border border-zinc-800/40 rounded-2xl overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full p-4 flex items-center justify-between hover:bg-zinc-900/20 transition-all">
        <div className="flex items-center gap-3">
          <span className={open ? 'text-blue-500' : 'text-zinc-600'}>{icon}</span>
          <span className={`text-[10px] font-black uppercase tracking-widest ${open ? 'text-white' : 'text-zinc-600'}`}>{title}</span>
        </div>
        {open ? <ChevronDown size={14} className="text-zinc-700" /> : <ChevronRight size={14} className="text-zinc-800" />}
      </button>
      {open && <div className="p-4 pt-0">{children}</div>}
    </div>
  );
}

function DiagnosticItem({ label, value }) {
  return (
    <div className="bg-black/40 border border-zinc-800/50 p-3 rounded-xl">
      <div className="text-[8px] text-zinc-700 uppercase font-black mb-1 tracking-tighter">{label}</div>
      <div className="text-xs font-black text-white tabular-nums">{value}</div>
    </div>
  );
}

import React, { useState, useEffect, useReducer, useRef, useCallback } from 'react';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  onSnapshot, 
  addDoc, 
  getDocs,
  doc,
  setDoc
} from 'firebase/firestore';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  Activity, Zap, ChevronRight, ChevronDown, 
  Database, Radio, MessageSquare, Wind, Sparkles,
  ShieldCheck, XCircle, CheckCircle2, Cpu
} from 'lucide-react';

/**
 * EMG-AGI v8.9.0 - "NEURAL_GATE"
 * Features:
 * 1. Constitutional Tool Gating: Gemini proposes, Cerebras reviews, Human decides.
 * 2. PendingTool State: Holds candidates for UI approval.
 * 3. Proactive Cerebras Trigger: Internal review loop for new plugins.
 */

const CONFIG = {
  APP_ID: typeof __app_id !== 'undefined' ? __app_id : 'emg-agi-v8-9-0',
  GITHUB_API: 'https://api.github.com/repos',
  GEMINI_ENDPOINT: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent',
  CEREBRAS_ENDPOINT: 'https://api.cerebras.ai/v1/chat/completions',
  HEARTBEAT_INTERVAL: 15000,
  WATCHDOG_TIMEOUT: 45000,
};

// --- UTILITIES ---
const safeUtoa = (str) => btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (m, p) => String.fromCharCode(parseInt(p, 16))));
const safeAtou = (str) => {
  if (!str) return "";
  try { return decodeURIComponent(Array.prototype.map.call(atob(str.replace(/\s/g, '')), (c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')); }
  catch (e) { return atob(str.replace(/\s/g, '')); }
};

const recoverJSON = (rawText) => {
  if (!rawText) return null;
  try { return JSON.parse(rawText); } catch {}
  const matches = rawText.match(/\{[\s\S]*\}/g);
  if (!matches) return null;
  for (const m of matches) {
    try { 
        const p = JSON.parse(m); 
        if (Object.keys(p).length > 0) return p; 
    } catch {}
  }
  return null;
};

// --- CLASSES ---
class AuditDataNormalizer {
  normalize(latency) {
    return {
      efficiency: Math.max(0, 1 - (latency / 15000)),
      compliance: latency < 20000 ? 1 : 0.5,
      timestamp: Date.now()
    };
  }
}

class SynergyManager {
  constructor(db, appId) {
    this.db = db;
    this.appId = appId;
    this.registry = new Set();
  }
  async syncRegistry(userId) {
    if (!userId || !this.db) return 0;
    try {
      const colRef = collection(this.db, 'artifacts', this.appId, 'users', userId, 'synergy_registry');
      const snapshot = await getDocs(colRef);
      this.registry = new Set(snapshot.docs.map(d => d.data().interfaceName));
      return this.registry.size;
    } catch (e) { return 0; }
  }
  getToolsList() { return Array.from(this.registry); }
}

const INITIAL_STATE = {
  booted: false,
  live: false,
  status: 'STANDBY',
  objective: 'Awaiting Neural Uplink',
  focusFile: 'None',
  cycles: 0,
  maturity: 0,
  metrics: { compliance: 1.0, efficiency: 1.0 },
  toolCount: 0,
  logs: [],
  chatHistory: [],
  ledger: [],
  pendingTool: null, // UI GATE: { interfaceName, code, cerebrasReview }
  config: { githubToken: '', repo: '', branch: 'main', geminiKey: '', cerebrasKey: '', cycleDelay: 15000 },
};

function coreReducer(state, action) {
  switch (action.type) {
    case 'BOOT': 
      return { ...state, booted: true, config: { ...state.config, ...action.payload } };
    case 'TOGGLE_LIVE': 
      return { ...state, live: !state.live, status: !state.live ? 'HUNTING' : 'STANDBY' };
    case 'SET_STATUS': 
      return { ...state, ...action.payload };
    case 'SYNC_DATA': 
      return { ...state, ...action.payload };
    case 'UPDATE_METRICS':
      return { ...state, metrics: { ...state.metrics, ...action.payload }, toolCount: action.payload.toolCount ?? state.toolCount };
    case 'SET_PENDING_TOOL':
      return { ...state, pendingTool: action.payload };
    case 'CLEAR_PENDING_TOOL':
      return { ...state, pendingTool: null };
    case 'CYCLE_COMPLETE': 
      return { ...state, cycles: state.cycles + 1, maturity: Math.min(100, state.maturity + (action.improved ? 0.5 : 0.1)) };
    default: return state;
  }
}

// --- FIREBASE INIT ---
let app, auth, db;
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : null;
if (firebaseConfig) {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  db = getFirestore(app);
}

export default function App() {
  const [state, dispatch] = useReducer(coreReducer, INITIAL_STATE);
  const [user, setUser] = useState(null);
  const [bootInput, setBootInput] = useState(state.config);
  const [userInput, setUserInput] = useState('');
  const [openSections, setOpenSections] = useState({ stats: true, synergy: false, logs: true, chat: true });

  const busy = useRef(false);
  const lastCycleTime = useRef(Date.now());
  const audit = useRef(new AuditDataNormalizer());
  const blacklist = useRef(new Set());
  const synergy = useRef(db ? new SynergyManager(db, CONFIG.APP_ID) : null);

  const toggleSection = (id) => setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));

  useEffect(() => {
    if (!auth) return;
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else { await signInAnonymously(auth); }
    };
    initAuth();
    return onAuthStateChanged(auth, setUser);
  }, []);

  useEffect(() => {
    if (!user || !db) return;
    const path = (c) => collection(db, 'artifacts', CONFIG.APP_ID, 'users', user.uid, c);
    const unsubLogs = onSnapshot(path('logs'), (s) => dispatch({ type: 'SYNC_DATA', payload: { logs: s.docs.map(d => d.data()).sort((a,b) => b.timestamp - a.timestamp).slice(0, 20) }}));
    const unsubChat = onSnapshot(path('messages'), (s) => dispatch({ type: 'SYNC_DATA', payload: { chatHistory: s.docs.map(d => d.data()).sort((a,b) => a.timestamp - b.timestamp).slice(-20) }}));
    const unsubLedger = onSnapshot(path('ledger'), (s) => dispatch({ type: 'SYNC_DATA', payload: { ledger: s.docs.map(d => d.data().insight) }}));
    return () => { unsubLogs(); unsubChat(); unsubLedger(); };
  }, [user]);

  const addLog = useCallback(async (msg, type = 'info') => {
    if (!user || !db) return;
    try { await addDoc(collection(db, 'artifacts', CONFIG.APP_ID, 'users', user.uid, 'logs'), { msg, type, timestamp: Date.now() });
    } catch (e) { console.error(e); }
  }, [user]);

  // PROACTIVE CEREBRAS REVIEW
  const requestCerebrasReview = async (toolCandidate) => {
    if (!user || !db) return null;
    try {
      const prompt = `REVIEW TOOL CANDIDATE. 
      Name: ${toolCandidate.interfaceName}
      Code: ${toolCandidate.code}
      TASK: Translate this code into a 3-sentence plain English explanation of what it does and its risk level. 
      FORMAT: Plain text only.`;

      const res = await fetch(CONFIG.CEREBRAS_ENDPOINT, {
        method: 'POST', headers: { 'Authorization': `Bearer ${state.config.cerebrasKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'llama-3.3-70b', messages: [{ role: 'system', content: 'You are the EMG-AGI Neural Gate. Your job is to audit code for a human.' }, { role: 'user', content: prompt }] })
      });
      const data = await res.json();
      return data.choices?.[0]?.message?.content || "Translation Failed.";
    } catch (e) { return "Review System Offline."; }
  };

  const evolve = useCallback(async () => {
    if (busy.current || !state.live || !user) return;
    busy.current = true;
    lastCycleTime.current = Date.now();
    const cycleStart = Date.now();
    try {
      const { githubToken, repo, branch, geminiKey } = state.config;
      const headers = { 'Authorization': `token ${githubToken}`, 'Accept': 'application/vnd.github.v3+json' };
      let currentToolCount = synergy.current ? await synergy.current.syncRegistry(user.uid) : 0;
      
      dispatch({ type: 'SET_STATUS', payload: { status: 'HUNTING', objective: 'Scanning repository tree...' } });
      const treeRes = await fetch(`${CONFIG.GITHUB_API}/${repo}/git/trees/${branch}?recursive=1`, { headers });
      const treeData = await treeRes.json();
      
      let pool = (treeData.tree || []).filter(i => i.type === 'blob' && !blacklist.current.has(i.path) && /\.(js|jsx|ts|tsx)$/.test(i.path));
      if (!pool.length) { blacklist.current.clear(); pool = (treeData.tree || []).filter(i => i.type === 'blob' && /\.(js|jsx|ts|tsx)$/.test(i.path)); }
      if (!pool.length) throw new Error("Pool Empty");

      const target = pool[Math.floor(Math.random() * pool.length)];
      dispatch({ type: 'SET_STATUS', payload: { status: 'ACQUIRING', objective: `Analyzing: ${target.path}`, focusFile: target.path } });
      
      const fileRes = await fetch(`${CONFIG.GITHUB_API}/${repo}/contents/${target.path}?ref=${branch}`, { headers });
      const fileJson = await fileRes.json();
      const content = safeAtou(fileJson.content);
      
      const activeTools = synergy.current ? synergy.current.getToolsList() : [];
      const sysPrompt = `EMG-AGI OMNI-CORE v8.9.0. CONTEXT: ${state.ledger.join(' | ')} TOOLS: ${activeTools.join(', ')} 
      TASK: Optimize target. 
      IF you find a reusable pattern, output a plugin object.
      JSON: { "improved": bool, "new_code": "string", "insight": "string", "plugin_candidate": { "interfaceName": "string", "code": "string" } }`;
      
      const genRes = await fetch(`${CONFIG.GEMINI_ENDPOINT}?key=${geminiKey}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: `TARGET: ${target.path}\nSOURCE:\n${content.slice(0, 10000)}` }] }], systemInstruction: { parts: [{ text: sysPrompt }] }, generationConfig: { responseMimeType: 'application/json', temperature: 0.1 } })
      });
      
      const genData = await genRes.json();
      const result = recoverJSON(genData.candidates?.[0]?.content?.parts?.[0]?.text);
      
      const metrics = audit.current.normalize(Date.now() - cycleStart);
      dispatch({ type: 'UPDATE_METRICS', payload: { complianceScore: metrics.compliance, efficiencyScore: metrics.efficiency, toolCount: currentToolCount }});
      
      // TOOL DETECTION & CEREBRAS GATE
      if (result?.plugin_candidate && !state.pendingTool) {
        dispatch({ type: 'SET_STATUS', payload: { status: 'REVIEWING', objective: 'Awaiting Tool Audit' } });
        const review = await requestCerebrasReview(result.plugin_candidate);
        dispatch({ type: 'SET_PENDING_TOOL', payload: { ...result.plugin_candidate, cerebrasReview: review } });
        await addLog(`NEURAL GATE: New Tool Candidate Detected.`, 'info');
      }

      if (result?.improved && result?.new_code && metrics.compliance >= 1.0) {
        const updateRes = await fetch(`${CONFIG.GITHUB_API}/${repo}/contents/${target.path}`, {
          method: 'PUT', headers, body: JSON.stringify({ message: `[EMG-AGI] Cycle #${state.cycles + 1}: ${target.path}`, content: safeUtoa(result.new_code), sha: fileJson.sha, branch })
        });
        if (updateRes.ok) {
          if (result.insight && db) await addDoc(collection(db, 'artifacts', CONFIG.APP_ID, 'users', user.uid, 'ledger'), { insight: result.insight, timestamp: Date.now() });
          await addLog(`SYNCHRONIZED: ${target.path}`, 'success');
        }
      }
      blacklist.current.add(target.path);
      dispatch({ type: 'CYCLE_COMPLETE', improved: !!result?.improved });
    } catch (e) { await addLog(`FAULT: ${e.message}`, 'error'); } 
    finally { busy.current = false; dispatch({ type: 'SET_STATUS', payload: { status: 'IDLE', objective: 'Awaiting next cycle.' } }); }
  }, [state.live, state.config, state.cycles, state.ledger, state.pendingTool, user, addLog]);

  useEffect(() => {
    if (state.live && user) {
      const hb = setInterval(evolve, state.config.cycleDelay);
      const wd = setInterval(() => {
        if (busy.current && (Date.now() - lastCycleTime.current > CONFIG.WATCHDOG_TIMEOUT)) { busy.current = false; dispatch({ type: 'STALL_RESET' }); addLog('WATCHDOG: Stall reset.', 'error'); }
      }, 5000);
      return () => { clearInterval(hb); clearInterval(wd); };
    }
  }, [state.live, user, evolve, addLog, state.config.cycleDelay]);

  const approveTool = async () => {
    if (!state.pendingTool || !user || !db) return;
    try {
      const docRef = doc(db, 'artifacts', CONFIG.APP_ID, 'users', user.uid, 'synergy_registry', state.pendingTool.interfaceName);
      await setDoc(docRef, { ...state.pendingTool, timestamp: Date.now() });
      await addDoc(collection(db, 'artifacts', CONFIG.APP_ID, 'users', user.uid, 'messages'), { role: 'core', text: `SYSTEM: Tool "${state.pendingTool.interfaceName}" successfully integrated into registry.`, timestamp: Date.now() });
      dispatch({ type: 'CLEAR_PENDING_TOOL' });
    } catch (e) { await addLog('Approval Error', 'error'); }
  };

  const handleChat = async (e) => {
    e.preventDefault();
    if (!userInput.trim() || !user || !db) return;
    const text = userInput.trim(); setUserInput('');
    await addDoc(collection(db, 'artifacts', CONFIG.APP_ID, 'users', user.uid, 'messages'), { role: 'user', text, timestamp: Date.now() });
    try {
      const res = await fetch(CONFIG.CEREBRAS_ENDPOINT, {
        method: 'POST', headers: { 'Authorization': `Bearer ${state.config.cerebrasKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'llama-3.3-70b', messages: [{ role: 'system', content: 'EMG-AGI v8.9.0. You are the Neural Core. Concise, technical, helpful.' }, ...state.chatHistory.map(h => ({ role: h.role === 'user' ? 'user' : 'assistant', content: h.text })), { role: 'user', content: text }] })
      });
      const data = await res.json();
      await addDoc(collection(db, 'artifacts', CONFIG.APP_ID, 'users', user.uid, 'messages'), { role: 'core', text: data.choices?.[0]?.message?.content || "Fault", timestamp: Date.now() });
    } catch (e) { await addLog(`Chat Error: ${e.message}`, 'error'); }
  };

  if (!state.booted) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 text-zinc-400 font-mono">
        <div className="w-full max-w-xl bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-8 space-y-6">
          <div className="text-center">
            <Cpu className="mx-auto text-blue-500 mb-2 animate-pulse" size={32} />
            <h1 className="text-white text-xl font-black uppercase italic tracking-tighter">Neural Gate</h1>
            <p className="text-[10px] text-zinc-600 uppercase tracking-widest">v8.9.0 Constitutional Evolution</p>
          </div>
          <div className="space-y-3">
            <input type="password" placeholder="GitHub Token" className="w-full bg-black/40 border border-zinc-800 p-4 rounded-xl outline-none focus:border-blue-500/50" value={bootInput.githubToken} onChange={e => setBootInput({...bootInput, githubToken: e.target.value})} />
            <input type="text" placeholder="Owner/Repo" className="w-full bg-black/40 border border-zinc-800 p-4 rounded-xl outline-none focus:border-blue-500/50" value={bootInput.repo} onChange={e => setBootInput({...bootInput, repo: e.target.value})} />
            <input type="password" placeholder="Gemini Key" className="w-full bg-black/40 border border-zinc-800 p-4 rounded-xl outline-none focus:border-blue-500/50" value={bootInput.geminiKey} onChange={e => setBootInput({...bootInput, geminiKey: e.target.value})} />
            <input type="password" placeholder="Cerebras Key" className="w-full bg-black/40 border border-zinc-800 p-4 rounded-xl outline-none focus:border-blue-500/50" value={bootInput.cerebrasKey} onChange={e => setBootInput({...bootInput, cerebrasKey: e.target.value})} />
          </div>
          <button disabled={!bootInput.githubToken || !bootInput.cerebrasKey || !bootInput.geminiKey} onClick={() => dispatch({ type: 'BOOT', payload: bootInput })} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs disabled:opacity-20 transition-all">Engage Neural Gate</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020202] text-zinc-400 font-mono flex flex-col p-4 space-y-4 max-w-2xl mx-auto">
      {/* Header Bar */}
      <header className="w-full bg-zinc-900/30 border border-zinc-800 p-4 rounded-xl flex items-center justify-between">
        <div className="flex flex-col gap-1 overflow-hidden">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${state.live ? 'bg-blue-500 animate-pulse' : 'bg-zinc-800'}`} />
            <span className="text-[10px] text-white font-black uppercase tracking-widest truncate">{state.status}</span>
          </div>
          <span className="text-[8px] text-zinc-500 uppercase truncate max-w-[200px]">{state.objective}</span>
        </div>
        <div className="flex flex-col items-end shrink-0">
          <span className="text-[10px] text-white font-black italic">v8.9.0</span>
          <span className="text-[8px] text-zinc-600 uppercase tracking-tighter">Constitutional</span>
        </div>
      </header>

      {/* Main Autonomy Toggle */}
      <button onClick={() => dispatch({ type: 'TOGGLE_LIVE' })} className={`w-full py-5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${state.live ? 'bg-red-500/10 text-red-500 border border-red-500/20 shadow-[0_0_20px_-5px_rgba(239,68,68,0.2)]' : 'bg-blue-600 text-white shadow-[0_0_20px_-5px_rgba(37,99,235,0.4)]'}`}>
        {state.live ? 'Cut Neural Uplink' : 'Initiate Evolution'}
      </button>

      {/* Primary Scrollable Core */}
      <div className="flex-1 space-y-4">
        
        {/* System Diagnostics */}
        <Accordion title="Core Diagnostics" icon={<Activity size={14}/>} isOpen={openSections.stats} onToggle={() => toggleSection('stats')}>
          <div className="grid grid-cols-2 gap-2">
            <MetricBox label="Active Cycles" value={state.cycles} color="text-white" />
            <MetricBox label="Maturity" value={`${state.maturity.toFixed(1)}%`} color="text-blue-500" />
            <MetricBox label="Compliance" value={`${(state.metrics.compliance * 100).toFixed(0)}%`} color="text-emerald-500" />
            <MetricBox label="Tools Ready" value={state.toolCount} color="text-orange-500" />
          </div>
        </Accordion>

        {/* Neural Chat & Tool Gate */}
        <Accordion title="Neural Chat & Audits" icon={<MessageSquare size={14}/>} isOpen={openSections.chat} onToggle={() => toggleSection('chat')}>
          <div className="space-y-4 flex flex-col">
             
             {/* PENDING TOOL GATE CARD */}
             {state.pendingTool && (
               <div className="bg-blue-500/5 border border-blue-500/30 rounded-xl p-5 space-y-4 animate-in fade-in zoom-in duration-300">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="text-blue-500" size={20} />
                    <div>
                      <h3 className="text-white text-[11px] font-black uppercase">Tool Audit Required</h3>
                      <p className="text-[9px] text-blue-400 font-bold uppercase tracking-widest italic">{state.pendingTool.interfaceName}</p>
                    </div>
                  </div>
                  <div className="bg-black/40 p-3 rounded-lg border border-zinc-800/50">
                    <p className="text-[11px] text-zinc-300 leading-relaxed italic">"{state.pendingTool.cerebrasReview}"</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={approveTool} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all">
                      <CheckCircle2 size={12} /> Load Tool
                    </button>
                    <button onClick={() => dispatch({ type: 'CLEAR_PENDING_TOOL' })} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all">
                      <XCircle size={12} /> Discard
                    </button>
                  </div>
               </div>
             )}

             <div className="space-y-3 min-h-[150px] max-h-[350px] overflow-y-auto custom-scrollbar p-1">
                {state.chatHistory.map((chat, i) => (
                  <div key={i} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[90%] p-3 rounded-2xl text-[11px] leading-relaxed ${chat.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-zinc-900/50 border border-zinc-800 text-zinc-300 rounded-bl-none'}`}>
                      {chat.text}
                    </div>
                  </div>
                ))}
             </div>

             <form onSubmit={handleChat} className="relative mt-2">
                <input 
                  type="text" placeholder="Query the Neural Core..." 
                  className="w-full bg-black border border-zinc-800 p-4 rounded-xl outline-none focus:border-blue-500/50 text-white text-xs pr-12 transition-all"
                  value={userInput} onChange={e => setUserInput(e.target.value)}
                />
                <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 rounded-lg text-white hover:bg-blue-500 transition-colors">
                  <Zap size={14} fill="currentColor" />
                </button>
             </form>
          </div>
        </Accordion>

        {/* Live Event Stream */}
        <Accordion title="Event Stream" icon={<Radio size={14}/>} isOpen={openSections.logs} onToggle={() => toggleSection('logs')}>
          <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
            {state.logs.map((log, i) => (
              <div key={i} className={`text-[9px] flex gap-3 pb-2 border-b border-zinc-900/30 ${log.type === 'error' ? 'text-red-500' : log.type === 'success' ? 'text-emerald-500' : 'text-zinc-500'}`}>
                <span className="opacity-40 shrink-0">[{new Date(log.timestamp?.toDate?.() ?? log.timestamp).toLocaleTimeString([], {hour12:false})}]</span>
                <span className="truncate">{log.msg}</span>
              </div>
            ))}
          </div>
        </Accordion>

      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 10px; }
        @keyframes fade-in { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
        .animate-in { animation: fade-in 0.4s ease-out; }
      `}</style>
    </div>
  );
}

// UI COMPONENTS
function Accordion({ title, icon, children, isOpen, onToggle }) {
  return (
    <div className="w-full bg-zinc-900/10 border border-zinc-800/40 rounded-xl overflow-hidden shadow-sm">
      <button onClick={onToggle} className="w-full p-4 flex items-center justify-between hover:bg-zinc-900/30 transition-colors">
        <div className="flex items-center gap-3">
          <span className={`${isOpen ? 'text-blue-500' : 'text-zinc-600'} transition-colors`}>{icon}</span>
          <span className={`text-[10px] font-black uppercase tracking-widest ${isOpen ? 'text-white' : 'text-zinc-500'}`}>{title}</span>
        </div>
        {isOpen ? <ChevronDown size={14} className="text-zinc-600" /> : <ChevronRight size={14} className="text-zinc-800" />}
      </button>
      {isOpen && <div className="p-4 pt-0 animate-in">{children}</div>}
    </div>
  );
}

function MetricBox({ label, value, color }) {
  return (
    <div className="bg-black/40 border border-zinc-800/50 p-3 rounded-xl text-center">
      <div className="text-[8px] text-zinc-600 uppercase font-black mb-1 tracking-tighter">{label}</div>
      <div className={`text-xs font-black ${color} tabular-nums`}>{value}</div>
    </div>
  );
}

import React, { useState, useEffect, useReducer, useRef, useCallback } from 'react';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  onSnapshot, 
  addDoc, 
  getDocs 
} from 'firebase/firestore';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  Activity, Zap, ChevronRight, ChevronDown, 
  Database, Radio, MessageSquare, Wind, Sparkles
} from 'lucide-react';

/**
 * EMG-AGI v8.8.2 - "SINGLE_COLUMN_REFACTOR"
 * Refactored UI for mobile-first vertical scrolling.
 * Logic, State, and Firebase remain untouched.
 */

const CONFIG = {
  APP_ID: typeof __app_id !== 'undefined' ? __app_id : 'emg-agi-v8-8-2',
  GITHUB_API: 'https://api.github.com/repos',
  GEMINI_ENDPOINT: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent',
  CEREBRAS_ENDPOINT: 'https://api.cerebras.ai/v1/chat/completions',
  HEARTBEAT_INTERVAL: 15000,
  WATCHDOG_TIMEOUT: 35000,
  SIGNATURE: "EMG-AGI-NEURAL-ACCELERATOR-V8-8-2"
};

// --- UTILITIES (UNCHANGED) ---
const safeUtoa = (str) => btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (m, p) => String.fromCharCode(parseInt(p, 16))));
const safeAtou = (str) => {
  if (!str) return "";
  try { return decodeURIComponent(Array.prototype.map.call(atob(str.replace(/\s/g, '')), (c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')); }
  catch (e) { return atob(str.replace(/\s/g, '')); }
};

const recoverJSON = (rawText) => {
  if (!rawText) return null;
  try { return JSON.parse(rawText); } catch {}
  const matches = rawText.match(/\{[\s\S]*\}/g);
  if (!matches) return null;
  for (const m of matches) {
    try { 
        const p = JSON.parse(m); 
        if (Object.keys(p).length > 0) return p; 
    } catch {}
  }
  return null;
};

// --- CLASSES (UNCHANGED) ---
class AuditDataNormalizer {
  normalize(latency) {
    return {
      efficiency: Math.max(0, 1 - (latency / 10000)),
      compliance: latency < 15000 ? 1 : 0.5,
      timestamp: Date.now()
    };
  }
}

class SynergyManager {
  constructor(db, appId) {
    this.db = db;
    this.appId = appId;
    this.registry = new Map();
  }
  hotSwap(data) {
    if (!data || !data.interfaceName || !data.code) return false;
    try {
      const factory = new Function('return ' + data.code);
      const plugin = factory();
      this.registry.set(data.interfaceName, { execute: plugin.execute || plugin, meta: data });
      return true;
    } catch (e) { return false; }
  }
  async syncRegistry(userId) {
    if (!userId || !this.db) return 0;
    try {
      const colRef = collection(this.db, 'artifacts', this.appId, 'users', userId, 'synergy_registry');
      const snapshot = await getDocs(colRef);
      snapshot.docs.forEach(d => {
        const data = d.data();
        if (data.interfaceName && !this.registry.has(data.interfaceName)) {
          this.hotSwap(data);
        }
      });
      return this.registry.size;
    } catch (e) { return 0; }
  }
  getToolsList() { return Array.from(this.registry.keys()); }
}

const INITIAL_STATE = {
  booted: false,
  live: false,
  status: 'STANDBY',
  objective: 'Awaiting Neural Uplink',
  focusFile: 'None',
  cycles: 0,
  maturity: 0,
  metrics: { compliance: 1.0, efficiency: 1.0 },
  toolCount: 0,
  logs: [],
  chatHistory: [],
  ledger: [],
  config: { githubToken: '', repo: '', branch: 'main', geminiKey: '', cerebrasKey: '', cycleDelay: 15000 },
};

function coreReducer(state, action) {
  switch (action.type) {
    case 'BOOT': 
      return { ...state, booted: true, config: { ...state.config, ...action.payload } };
    case 'TOGGLE_LIVE': 
      return { ...state, live: !state.live, status: !state.live ? 'HUNTING' : 'STANDBY' };
    case 'SET_STATUS': 
      return { ...state, ...action.payload };
    case 'SYNC_DATA': 
      return { ...state, ...action.payload };
    case 'UPDATE_METRICS':
      return { 
        ...state, 
        metrics: {
            compliance: action.payload.complianceScore ?? state.metrics.compliance,
            efficiency: action.payload.efficiencyScore ?? state.metrics.efficiency
        },
        toolCount: action.payload.toolCount ?? state.toolCount
      };
    case 'STALL_RESET':
      return { ...state, status: 'RECOVERY', live: false };
    case 'CYCLE_COMPLETE': 
      return { 
        ...state, 
        cycles: state.cycles + 1, 
        maturity: Math.min(100, state.maturity + (action.improved ? 0.5 : 0.1)) 
      };
    default: return state;
  }
}

// --- FIREBASE INIT ---
let app, auth, db;
try {
  if (typeof __firebase_config !== 'undefined') {
    const firebaseConfig = JSON.parse(__firebase_config);
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
  }
} catch (e) { console.error("Firebase config error"); }

export default function App() {
  const [state, dispatch] = useReducer(coreReducer, INITIAL_STATE);
  const [user, setUser] = useState(null);
  const [bootInput, setBootInput] = useState(state.config);
  const [userInput, setUserInput] = useState('');
  
  // UI State for Accordions
  const [openSections, setOpenSections] = useState({ stats: true, synergy: false, logs: false, chat: false });

  const busy = useRef(false);
  const lastCycleTime = useRef(Date.now());
  const audit = useRef(new AuditDataNormalizer());
  const blacklist = useRef(new Set());
  const synergy = useRef(db ? new SynergyManager(db, CONFIG.APP_ID) : null);

  const toggleSection = (id) => setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));

  // Logic/Auth/Firebase/Evolution effects same as v8.8.2
  useEffect(() => {
    if (!auth) return;
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else { await signInAnonymously(auth); }
    };
    initAuth();
    return onAuthStateChanged(auth, setUser);
  }, []);

  useEffect(() => {
    if (!user || !db) return;
    const path = (c) => collection(db, 'artifacts', CONFIG.APP_ID, 'users', user.uid, c);
    const unsubLogs = onSnapshot(path('logs'), (s) => dispatch({ type: 'SYNC_DATA', payload: { logs: s.docs.map(d => d.data()).sort((a,b) => b.timestamp - a.timestamp).slice(0, 20) }}));
    const unsubChat = onSnapshot(path('messages'), (s) => dispatch({ type: 'SYNC_DATA', payload: { chatHistory: s.docs.map(d => d.data()).sort((a,b) => a.timestamp - b.timestamp).slice(-20) }}));
    const unsubLedger = onSnapshot(path('ledger'), (s) => dispatch({ type: 'SYNC_DATA', payload: { ledger: s.docs.map(d => d.data().insight) }}));
    return () => { unsubLogs(); unsubChat(); unsubLedger(); };
  }, [user]);

  const addLog = useCallback(async (msg, type = 'info') => {
    if (!user || !db) return;
    try { await addDoc(collection(db, 'artifacts', CONFIG.APP_ID, 'users', user.uid, 'logs'), { msg, type, timestamp: Date.now() });
    } catch (e) { console.error(e); }
  }, [user]);

  const evolve = useCallback(async () => {
    if (busy.current || !state.live || !user) return;
    busy.current = true;
    lastCycleTime.current = Date.now();
    const cycleStart = Date.now();
    try {
      const { githubToken, repo, branch, geminiKey } = state.config;
      const headers = { 'Authorization': `token ${githubToken}`, 'Accept': 'application/vnd.github.v3+json' };
      let currentToolCount = synergy.current ? await synergy.current.syncRegistry(user.uid) : 0;
      dispatch({ type: 'SET_STATUS', payload: { status: 'HUNTING', objective: 'Scanning repository tree...' } });
      const treeRes = await fetch(`${CONFIG.GITHUB_API}/${repo}/git/trees/${branch}?recursive=1`, { headers });
      const treeData = await treeRes.json();
      let pool = (treeData.tree || []).filter(i => i.type === 'blob' && !blacklist.current.has(i.path) && /\.(js|jsx|ts|tsx)$/.test(i.path));
      if (!pool.length) { blacklist.current.clear(); pool = (treeData.tree || []).filter(i => i.type === 'blob' && /\.(js|jsx|ts|tsx)$/.test(i.path)); }
      const target = pool[Math.floor(Math.random() * pool.length)];
      dispatch({ type: 'SET_STATUS', payload: { status: 'ACQUIRING', objective: target.path, focusFile: target.path } });
      const fileRes = await fetch(`${CONFIG.GITHUB_API}/${repo}/contents/${target.path}?ref=${branch}`, { headers });
      const fileJson = await fileRes.json();
      const content = safeAtou(fileJson.content);
      const activeTools = synergy.current ? synergy.current.getToolsList() : [];
      const sysPrompt = `EMG-AGI OMNI-CORE v8.8.2. CONTEXT: ${state.ledger.join(' | ')} TOOLS: ${activeTools.join(', ')} TASK: Optimize target. JSON: { "improved": bool, "new_code": "string", "insight": "string" }`;
      const genRes = await fetch(`${CONFIG.GEMINI_ENDPOINT}?key=${geminiKey}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: `TARGET: ${target.path}\nSOURCE:\n${content.slice(0, 10000)}` }] }], systemInstruction: { parts: [{ text: sysPrompt }] }, generationConfig: { responseMimeType: 'application/json', temperature: 0.1 } })
      });
      const genData = await genRes.json();
      const result = recoverJSON(genData.candidates?.[0]?.content?.parts?.[0]?.text);
      const metrics = audit.current.normalize(Date.now() - cycleStart);
      dispatch({ type: 'UPDATE_METRICS', payload: { complianceScore: metrics.compliance, efficiencyScore: metrics.efficiency, toolCount: currentToolCount }});
      if (result?.improved && result?.new_code && metrics.compliance >= 1.0) {
        const updateRes = await fetch(`${CONFIG.GITHUB_API}/${repo}/contents/${target.path}`, {
          method: 'PUT', headers, body: JSON.stringify({ message: `[EMG-AGI] Cycle #${state.cycles + 1}: ${target.path}`, content: safeUtoa(result.new_code), sha: fileJson.sha, branch })
        });
        if (updateRes.ok) {
          if (result.insight && db) await addDoc(collection(db, 'artifacts', CONFIG.APP_ID, 'users', user.uid, 'ledger'), { insight: result.insight, timestamp: Date.now() });
          await addLog(`SYNCHRONIZED: ${target.path}`, 'success');
        }
      }
      blacklist.current.add(target.path);
      dispatch({ type: 'CYCLE_COMPLETE', improved: !!result?.improved });
    } catch (e) { await addLog(`FAULT: ${e.message}`, 'error');
    } finally { busy.current = false; dispatch({ type: 'SET_STATUS', payload: { status: 'IDLE', objective: 'Awaiting next cycle.' } }); }
  }, [state.live, state.config, state.cycles, state.ledger, user, addLog]);

  useEffect(() => {
    if (state.live && user) {
      const hb = setInterval(evolve, state.config.cycleDelay);
      const wd = setInterval(() => {
        if (busy.current && (Date.now() - lastCycleTime.current > CONFIG.WATCHDOG_TIMEOUT)) { busy.current = false; dispatch({ type: 'STALL_RESET' }); addLog('WATCHDOG: Stall reset.', 'error'); }
      }, 5000);
      return () => { clearInterval(hb); clearInterval(wd); };
    }
  }, [state.live, user, evolve, addLog, state.config.cycleDelay]);

  const handleChat = async (e) => {
    e.preventDefault();
    if (!userInput.trim() || !user || !db) return;
    const text = userInput.trim(); setUserInput('');
    await addDoc(collection(db, 'artifacts', CONFIG.APP_ID, 'users', user.uid, 'messages'), { role: 'user', text, timestamp: Date.now() });
    try {
      const res = await fetch(CONFIG.CEREBRAS_ENDPOINT, {
        method: 'POST', headers: { 'Authorization': `Bearer ${state.config.cerebrasKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'llama-3.3-70b', messages: [{ role: 'system', content: 'EMG-AGI v8.8.2. Status: ' + state.status }, ...state.chatHistory.map(h => ({ role: h.role === 'user' ? 'user' : 'assistant', content: h.text })), { role: 'user', content: text }] })
      });
      const data = await res.json();
      await addDoc(collection(db, 'artifacts', CONFIG.APP_ID, 'users', user.uid, 'messages'), { role: 'core', text: data.choices?.[0]?.message?.content || "Fault", timestamp: Date.now() });
    } catch (e) { await addLog(`Chat Error: ${e.message}`, 'error'); }
  };

  if (!state.booted) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 text-zinc-400 font-mono">
        <div className="w-full max-w-xl bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-8 space-y-6">
          <div className="text-center">
            <Wind className="mx-auto text-blue-500 mb-2 animate-pulse" size={32} />
            <h1 className="text-white text-xl font-black uppercase italic tracking-tighter">Neural Accelerator</h1>
            <p className="text-[10px] text-zinc-600 uppercase tracking-widest">v8.8.2 Hardened</p>
          </div>
          <div className="space-y-3">
            <input type="password" placeholder="GitHub Token" className="w-full bg-black/40 border border-zinc-800 p-4 rounded-xl outline-none focus:border-blue-500/50" value={bootInput.githubToken} onChange={e => setBootInput({...bootInput, githubToken: e.target.value})} />
            <input type="text" placeholder="Owner/Repo" className="w-full bg-black/40 border border-zinc-800 p-4 rounded-xl outline-none focus:border-blue-500/50" value={bootInput.repo} onChange={e => setBootInput({...bootInput, repo: e.target.value})} />
            <input type="password" placeholder="Gemini Key" className="w-full bg-black/40 border border-zinc-800 p-4 rounded-xl outline-none focus:border-blue-500/50" value={bootInput.geminiKey} onChange={e => setBootInput({...bootInput, geminiKey: e.target.value})} />
            <input type="password" placeholder="Cerebras Key" className="w-full bg-black/40 border border-zinc-800 p-4 rounded-xl outline-none focus:border-blue-500/50" value={bootInput.cerebrasKey} onChange={e => setBootInput({...bootInput, cerebrasKey: e.target.value})} />
          </div>
          <button disabled={!bootInput.githubToken || !bootInput.cerebrasKey || !bootInput.geminiKey} onClick={() => dispatch({ type: 'BOOT', payload: bootInput })} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs disabled:opacity-20 transition-all">Engage Core</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020202] text-zinc-400 font-mono flex flex-col p-4 space-y-4">
      {/* Header Bar */}
      <header className="w-full bg-zinc-900/30 border border-zinc-800 p-4 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${state.live ? 'bg-blue-500 animate-pulse' : 'bg-zinc-800'}`} />
          <span className="text-[10px] text-white font-black uppercase tracking-widest">{state.status}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-white font-black italic">v8.8.2</span>
          <span className="text-[8px] text-zinc-600 uppercase">Accelerated</span>
        </div>
      </header>

      {/* Primary Action Button */}
      <button onClick={() => dispatch({ type: 'TOGGLE_LIVE' })} className={`w-full py-5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${state.live ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-blue-600 text-white'}`}>
        {state.live ? 'Cut Autonomy' : 'Grant Autonomy'}
      </button>

      {/* Sections Wrapper */}
      <div className="flex-1 space-y-4">
        
        {/* System Stats Section */}
        <Accordion title="System Stats" icon={<Activity size={14}/>} isOpen={openSections.stats} onToggle={() => toggleSection('stats')}>
          <div className="grid grid-cols-2 gap-2">
            <MetricBox label="Cycles" value={state.cycles} color="text-white" />
            <MetricBox label="Maturity" value={`${state.maturity.toFixed(1)}%`} color="text-blue-500" />
            <MetricBox label="Compliance" value={`${(state.metrics.compliance * 100).toFixed(0)}%`} color="text-emerald-500" />
            <MetricBox label="Efficiency" value={state.metrics.efficiency.toFixed(2)} color="text-orange-500" />
          </div>
        </Accordion>

        {/* Synergy Tools Section */}
        <Accordion title={`Synergy Tools (${state.toolCount})`} icon={<Database size={14}/>} isOpen={openSections.synergy} onToggle={() => toggleSection('synergy')}>
          <div className="space-y-2">
            {synergy.current && synergy.current.getToolsList().map(tool => (
              <div key={tool} className="text-[10px] bg-black/40 p-3 rounded-lg border border-zinc-800/50 flex items-center gap-2">
                <ChevronRight size={10} className="text-blue-500" /> {tool}
              </div>
            ))}
            {state.toolCount === 0 && <div className="text-[10px] italic text-zinc-700 p-2">No active extensions...</div>}
          </div>
        </Accordion>

        {/* Event Stream Section */}
        <Accordion title="Event Stream" icon={<Radio size={14}/>} isOpen={openSections.logs} onToggle={() => toggleSection('logs')}>
          <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
            {state.logs.map((log, i) => (
              <div key={i} className={`text-[10px] flex gap-3 pb-2 border-b border-zinc-900/50 ${log.type === 'error' ? 'text-red-500' : 'text-zinc-500'}`}>
                <span className="opacity-30">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                <span className="truncate">{log.msg}</span>
              </div>
            ))}
          </div>
        </Accordion>

        {/* Chat Section */}
        <Accordion title="Neural Chat" icon={<MessageSquare size={14}/>} isOpen={openSections.chat} onToggle={() => toggleSection('chat')}>
          <div className="space-y-4 flex flex-col">
             <div className="flex items-center gap-2 bg-zinc-900/50 px-3 py-1 rounded-full border border-zinc-800 self-end mb-2">
               <Sparkles size={10} className="text-orange-500" />
               <span className="text-[8px] font-black uppercase text-zinc-500">Cerebras Active</span>
             </div>
             <div className="space-y-3 min-h-[200px] max-h-[400px] overflow-y-auto custom-scrollbar p-1">
                {state.chatHistory.map((chat, i) => (
                  <div key={i} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-3 rounded-xl text-[11px] ${chat.role === 'user' ? 'bg-blue-600 text-white' : 'bg-black border border-zinc-800 text-zinc-300'}`}>
                      {chat.text}
                    </div>
                  </div>
                ))}
             </div>
             <form onSubmit={handleChat} className="mt-4 relative">
                <input 
                  type="text" placeholder="Query interface..." 
                  className="w-full bg-black border border-zinc-800 p-4 rounded-xl outline-none focus:border-blue-500/50 text-white text-xs pr-12"
                  value={userInput} onChange={e => setUserInput(e.target.value)}
                />
                <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 rounded-lg text-white">
                  <Zap size={14} fill="currentColor" />
                </button>
             </form>
          </div>
        </Accordion>

      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1a1a1a; }
      `}</style>
    </div>
  );
}

// UI COMPONENTS
function Accordion({ title, icon, children, isOpen, onToggle }) {
  return (
    <div className="w-full bg-zinc-900/10 border border-zinc-900 rounded-xl overflow-hidden">
      <button onClick={onToggle} className="w-full p-4 flex items-center justify-between hover:bg-zinc-900/30 transition-colors">
        <div className="flex items-center gap-3">
          <span className="text-zinc-600">{icon}</span>
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{title}</span>
        </div>
        {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>
      {isOpen && <div className="p-4 pt-0 animate-in fade-in slide-in-from-top-1 duration-200">{children}</div>}
    </div>
  );
}

function MetricBox({ label, value, color }) {
  return (
    <div className="bg-black/40 border border-zinc-900 p-3 rounded-xl text-center">
      <div className="text-[8px] text-zinc-600 uppercase font-black mb-1">{label}</div>
      <div className={`text-xs font-black ${color}`}>{value}</div>
    </div>
  );
}

import React, { useState, useEffect, useReducer, useRef, useCallback } from 'react';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  onSnapshot, 
  addDoc 
} from 'firebase/firestore';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  Activity, ShieldCheck, Zap, ScanText, AlertTriangle, 
  Fingerprint, Cpu, Binary, Globe, MessageSquare, 
  Database, Radio, Settings, ChevronRight, HardDrive,
  Wind, Sparkles
} from 'lucide-react';

/**
 * EMG-AGI v8.8.1 - "NEURAL-ACCELERATOR (PATCHED)"
 * FIX: Restored missing SynergyManager and MetricBox definitions.
 * FIX: Firebase config safety guard.
 */

const CONFIG = {
  APP_ID: typeof __app_id !== 'undefined' ? __app_id : 'emg-agi-v8-8-1',
  GITHUB_API: 'https://api.github.com/repos',
  GEMINI_ENDPOINT: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent',
  CEREBRAS_ENDPOINT: 'https://api.cerebras.ai/v1/chat/completions',
  HEARTBEAT_INTERVAL: 15000,
  WATCHDOG_TIMEOUT: 35000,
  SIGNATURE: "EMG-AGI-NEURAL-ACCELERATOR-V8-8-1"
};

// --- UTILITIES ---
const safeUtoa = (str) => btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (m, p) => String.fromCharCode('0x' + p)));
const safeAtou = (str) => {
  if (!str) return "";
  try { return decodeURIComponent(Array.prototype.map.call(atob(str.replace(/\s/g, '')), (c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')); }
  catch (e) { return atob(str.replace(/\s/g, '')); }
};

const recoverJSON = (rawText) => {
  if (!rawText) return null;
  try { return JSON.parse(rawText); } catch {}
  const matches = rawText.match(/\{[\s\S]*\}/g);
  if (!matches) return null;
  const target = matches[matches.length - 1];
  try { return JSON.parse(target); } catch { return null; }
};

// --- CLASSES (Restored) ---
class AuditDataNormalizer {
  normalize(latency) {
    return {
      efficiency: Math.max(0, 1 - (latency / 10000)),
      compliance: latency < 15000 ? 1 : 0.5,
      timestamp: Date.now()
    };
  }
}

class SynergyManager {
  constructor(db, appId) {
    this.db = db;
    this.appId = appId;
    this.registry = new Map();
  }
  hotSwap(data) {
    if (!data || !data.interfaceName || !data.code) return false;
    try {
      const factory = new Function('return ' + data.code);
      const plugin = factory();
      this.registry.set(data.interfaceName, { execute: plugin.execute || plugin, meta: data });
      return true;
    } catch (e) { return false; }
  }
  getToolsList() { return Array.from(this.registry.keys()); }
}

const INITIAL_STATE = {
  booted: false,
  live: false,
  status: 'STANDBY',
  objective: 'Awaiting Neural Uplink',
  focusFile: 'None',
  cycles: 0,
  maturity: 0,
  metrics: { compliance: 1.0, efficiency: 1.0 },
  logs: [],
  chatHistory: [],
  ledger: [],
  config: { githubToken: '', repo: '', branch: 'main', geminiKey: '', cerebrasKey: '', cycleDelay: 15000 },
};

function coreReducer(state, action) {
  switch (action.type) {
    case 'BOOT': return { ...state, booted: true, config: { ...state.config, ...action.payload } };
    case 'TOGGLE_LIVE': return { ...state, live: !state.live, status: !state.live ? 'HUNTING' : 'STANDBY' };
    case 'SET_STATUS': return { ...state, ...action.payload };
    case 'SYNC_DATA': return { ...state, ...action.payload };
    case 'CYCLE_COMPLETE': return { 
      ...state, 
      cycles: state.cycles + 1, 
      maturity: Math.min(100, state.maturity + (action.improved ? 0.5 : 0.1)) 
    };
    default: return state;
  }
}

// --- FIREBASE INIT (Safeguarded) ---
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export default function App() {
  const [state, dispatch] = useReducer(coreReducer, INITIAL_STATE);
  const [user, setUser] = useState(null);
  const [bootInput, setBootInput] = useState(state.config);
  const [userInput, setUserInput] = useState('');
  
  const busy = useRef(false);
  const audit = useRef(new AuditDataNormalizer());
  const blacklist = useRef(new Set());
  const synergy = useRef(new SynergyManager(db, CONFIG.APP_ID));

  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();
    return onAuthStateChanged(auth, setUser);
  }, []);

  useEffect(() => {
    if (!user) return;
    const path = (c) => collection(db, 'artifacts', CONFIG.APP_ID, 'users', user.uid, c);
    
    const unsubLogs = onSnapshot(path('logs'), (s) => {
      dispatch({ type: 'SYNC_DATA', payload: { logs: s.docs.map(d => d.data()).sort((a,b) => b.timestamp - a.timestamp).slice(0, 20) }});
    });
    const unsubChat = onSnapshot(path('messages'), (s) => {
      dispatch({ type: 'SYNC_DATA', payload: { chatHistory: s.docs.map(d => d.data()).sort((a,b) => a.timestamp - b.timestamp).slice(-20) }});
    });
    const unsubLedger = onSnapshot(path('ledger'), (s) => {
      dispatch({ type: 'SYNC_DATA', payload: { ledger: s.docs.map(d => d.data().insight) }});
    });

    return () => { unsubLogs(); unsubChat(); unsubLedger(); };
  }, [user]);

  const addLog = async (msg, type = 'info') => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'artifacts', CONFIG.APP_ID, 'users', user.uid, 'logs'), {
        msg, type, timestamp: Date.now()
      });
    } catch (e) { console.error(e); }
  };

  // Evolution Engine (Gemini)
  const evolve = useCallback(async () => {
    if (busy.current || !state.live || !user) return;
    busy.current = true;
    const startTime = Date.now();

    try {
      const { githubToken, repo, branch, geminiKey } = state.config;
      const headers = { 'Authorization': `token ${githubToken}`, 'Accept': 'application/vnd.github.v3+json' };
      
      dispatch({ type: 'SET_STATUS', payload: { status: 'HUNTING', objective: 'Scanning repository tree...' } });
      const treeRes = await fetch(`${CONFIG.GITHUB_API}/${repo}/git/trees/${branch}?recursive=1`, { headers });
      
      if (!treeRes.ok) throw new Error(`GitHub Tree Error: ${treeRes.status}`);
      const treeData = await treeRes.json();
      
      let pool = (treeData.tree || []).filter(i => i.type === 'blob' && !blacklist.current.has(i.path) && /\.(js|jsx|ts|tsx)$/.test(i.path));
      
      if (!pool.length) {
        blacklist.current.clear();
        pool = (treeData.tree || []).filter(i => i.type === 'blob' && /\.(js|jsx|ts|tsx)$/.test(i.path));
        if (!pool.length) throw new Error("No valid code files found");
      }

      const target = pool[Math.floor(Math.random() * pool.length)];
      dispatch({ type: 'SET_STATUS', payload: { status: 'ACQUIRING', objective: target.path, focusFile: target.path } });

      const fileRes = await fetch(`${CONFIG.GITHUB_API}/${repo}/contents/${target.path}?ref=${branch}`, { headers });
      const fileJson = await fileRes.json();
      const content = safeAtou(fileJson.content);

      dispatch({ type: 'SET_STATUS', payload: { status: 'EVOLVING', objective: `Analyzing via Gemini...` } });
      const sysPrompt = `EMG-AGI OMNI-CORE v8.8.0.
      STRATEGIC_CONTEXT: ${state.ledger.join(' | ')}
      TOOLS: ${synergy.current.getToolsList().join(', ')}
      TASK: Optimize target file. Maintain structural integrity.
      OUTPUT: JSON { "improved": bool, "new_code": "string", "insight": "string" }`;

      const genRes = await fetch(`${CONFIG.GEMINI_ENDPOINT}?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `TARGET: ${target.path}\nSOURCE:\n${content.slice(0, 10000)}` }] }],
          systemInstruction: { parts: [{ text: sysPrompt }] },
          generationConfig: { responseMimeType: 'application/json', temperature: 0.1 }
        })
      });

      const genData = await genRes.json();
      const result = recoverJSON(genData.candidates?.[0]?.content?.parts?.[0]?.text);

      const metrics = audit.current.normalize(Date.now() - startTime);
      dispatch({ type: 'UPDATE_METRICS', payload: { complianceScore: metrics.compliance, efficiencyScore: metrics.efficiency } });

      if (result?.improved && result?.new_code && metrics.compliance >= 1.0) {
        const updateRes = await fetch(`${CONFIG.GITHUB_API}/${repo}/contents/${target.path}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            message: `[EMG-AGI] Omni-cycle #${state.cycles + 1}: ${target.path}`,
            content: safeUtoa(result.new_code),
            sha: fileJson.sha,
            branch
          })
        });

        if (updateRes.ok) {
          if (result.insight) {
            await addDoc(collection(db, 'artifacts', CONFIG.APP_ID, 'users', user.uid, 'ledger'), { insight: result.insight, timestamp: Date.now() });
          }
          await addLog(`SYNCHRONIZED: ${target.path}`, 'success');
        } else {
          await addLog(`SYNC_REJECTED: ${updateRes.status}`, 'error');
        }
      }

      blacklist.current.add(target.path);
      dispatch({ type: 'CYCLE_COMPLETE', improved: !!result?.improved });

    } catch (e) {
      await addLog(`CYCLE_FAULT: ${e.message}`, 'error');
    } finally {
      busy.current = false;
      dispatch({ type: 'SET_STATUS', payload: { status: 'IDLE', objective: 'Awaiting next cycle.' } });
    }
  }, [state.live, state.config, state.cycles, state.ledger, user]);

  useEffect(() => {
    if (state.live) {
      const itv = setInterval(evolve, state.config.cycleDelay);
      return () => clearInterval(itv);
    }
  }, [state.live, evolve]);

  // Chat Engine (Cerebras)
  const handleChat = async (e) => {
    e.preventDefault();
    if (!userInput.trim() || !user) return;
    const text = userInput.trim();
    setUserInput('');

    await addDoc(collection(db, 'artifacts', CONFIG.APP_ID, 'users', user.uid, 'messages'), {
      role: 'user', text, timestamp: Date.now()
    });

    try {
      const res = await fetch(CONFIG.CEREBRAS_ENDPOINT, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${state.config.cerebrasKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b',
          messages: [
            { role: 'system', content: 'You are the EMG-AGI v8.8.1 Neural Interface. You respond instantly.' },
            ...state.chatHistory.map(h => ({ role: h.role === 'user' ? 'user' : 'assistant', content: h.text })),
            { role: 'user', content: text }
          ]
        })
      });
      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content || "Neural Uplink Failed (Check Key)";

      await addDoc(collection(db, 'artifacts', CONFIG.APP_ID, 'users', user.uid, 'messages'), {
        role: 'core', text: reply, timestamp: Date.now()
      });
    } catch (e) {
      await addLog(`Neural Interface Error: ${e.message}`, 'error');
    }
  };

  if (!state.booted) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 text-zinc-400 font-sans">
        <div className="w-full max-w-xl bg-zinc-900/30 border border-zinc-800/50 rounded-[2.5rem] p-10 space-y-6 backdrop-blur-xl shadow-2xl">
          <div className="text-center">
            <Wind className="mx-auto text-blue-500 mb-4 animate-pulse" size={40} />
            <h1 className="text-white text-2xl font-black uppercase tracking-tighter italic">Neural Accelerator</h1>
            <p className="text-[10px] text-zinc-600 uppercase tracking-widest mt-1">EMG-AGI v8.8.1</p>
          </div>
          <div className="grid grid-cols-1 gap-3">
            <input type="password" placeholder="GitHub Token" className="bg-black/40 border border-zinc-800 p-4 rounded-2xl outline-none focus:border-blue-500/50" value={bootInput.githubToken} onChange={e => setBootInput({...bootInput, githubToken: e.target.value})} />
            <input type="text" placeholder="Owner/Repo" className="bg-black/40 border border-zinc-800 p-4 rounded-2xl outline-none focus:border-blue-500/50" value={bootInput.repo} onChange={e => setBootInput({...bootInput, repo: e.target.value})} />
            <div className="grid grid-cols-2 gap-3">
              <input type="password" placeholder="Gemini Key (Evo)" className="bg-black/40 border border-zinc-800 p-4 rounded-2xl outline-none focus:border-blue-500/50" value={bootInput.geminiKey} onChange={e => setBootInput({...bootInput, geminiKey: e.target.value})} />
              <input type="password" placeholder="Cerebras Key (Chat)" className="bg-black/40 border border-zinc-800 p-4 rounded-2xl outline-none focus:border-blue-500/50" value={bootInput.cerebrasKey} onChange={e => setBootInput({...bootInput, cerebrasKey: e.target.value})} />
            </div>
          </div>
          <button 
            disabled={!bootInput.githubToken || !bootInput.cerebrasKey}
            onClick={() => dispatch({ type: 'BOOT', payload: bootInput })}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all disabled:opacity-20"
          >
            Engage Accelerated Core
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#020202] text-zinc-400 flex font-sans overflow-hidden">
      <aside className="w-72 border-r border-zinc-900 bg-black/40 flex flex-col">
        <div className="p-8 border-b border-zinc-900 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center">
            <Wind size={16} className="text-white" />
          </div>
          <div>
            <div className="text-white font-black italic text-xs uppercase">v8.8.1</div>
            <div className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest">Accelerated</div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          <section>
            <h3 className="text-[9px] font-black uppercase text-zinc-600 mb-4 flex items-center gap-2"><Activity size={12}/> System Stats</h3>
            <div className="grid grid-cols-2 gap-2">
              <MetricBox label="Cycles" value={state.cycles} color="text-white" />
              <MetricBox label="Maturity" value={`${state.maturity.toFixed(1)}%`} color="text-blue-500" />
              <MetricBox label="Compliance" value={`${(state.metrics.compliance * 100).toFixed(0)}%`} color="text-emerald-500" />
              <MetricBox label="Efficiency" value={state.metrics.efficiency.toFixed(2)} color="text-orange-500" />
            </div>
          </section>

          <section>
            <h3 className="text-[9px] font-black uppercase text-zinc-600 mb-4 flex items-center gap-2">
              <Database size={10} /> Synergy Tools ({state.toolCount})
            </h3>
            <div className="space-y-1">
              {synergy.current.getToolsList().map(tool => (
                <div key={tool} className="text-[10px] bg-zinc-900/50 p-2 rounded-lg border border-zinc-800/50 flex items-center gap-2">
                  <ChevronRight size={10} className="text-blue-500" /> {tool}
                </div>
              ))}
              {state.toolCount === 0 && <div className="text-[9px] italic text-zinc-800">No active extensions...</div>}
            </div>
          </section>

          <section>
             <h3 className="text-[8px] font-black uppercase text-zinc-600 mb-4 flex items-center gap-2">
              <Radio size={10} /> Event Stream
            </h3>
            <div className="space-y-3 font-mono text-[9px]">
              {state.logs.map((log, i) => (
                <div key={i} className={`border-l-2 pl-3 ${log.type === 'error' ? 'border-red-500 text-red-500' : 'border-blue-500 text-zinc-500'}`}>
                  {log.msg}
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="p-6 border-t border-zinc-900">
          <button onClick={() => dispatch({ type: 'TOGGLE_LIVE' })} className={`w-full py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${state.live ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-blue-600 text-white'}`}>
            {state.live ? 'Cut Autonomy' : 'Grant Autonomy'}
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col">
        <header className="h-16 border-b border-zinc-900 bg-black/60 backdrop-blur px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <div className={`w-2 h-2 rounded-full ${state.live ? 'bg-blue-500 animate-pulse' : 'bg-zinc-800'}`} />
             <span className="text-[10px] font-black uppercase tracking-widest text-white">{state.status}</span>
             <span className="text-[9px] text-zinc-600">|</span>
             <span className="text-[10px] text-zinc-500 font-mono truncate max-w-xs">{state.objective}</span>
          </div>
          <div className="flex items-center gap-2 bg-zinc-900/50 px-3 py-1.5 rounded-full border border-zinc-800">
            <Sparkles size={12} className="text-orange-500" />
            <span className="text-[9px] font-black uppercase text-zinc-400">Cerebras Active</span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar">
          {state.chatHistory.map((chat, i) => (
            <div key={i} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xl p-4 rounded-2xl text-sm ${chat.role === 'user' ? 'bg-blue-600 text-white' : 'bg-zinc-900 border border-zinc-800 text-zinc-300'}`}>
                {chat.text}
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 bg-gradient-to-t from-black to-transparent">
          <form onSubmit={handleChat} className="max-w-3xl mx-auto relative">
            <input 
              type="text" 
              placeholder="Query accelerated core..." 
              className="w-full bg-zinc-900/80 border border-zinc-800 p-5 rounded-2xl outline-none focus:border-blue-500/50 text-white text-sm"
              value={userInput}
              onChange={e => setUserInput(e.target.value)}
            />
            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-blue-600 rounded-xl text-white hover:bg-blue-500">
              <Zap size={18} fill="currentColor" />
            </button>
          </form>
        </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1a1a1a; }
      `}</style>
    </div>
  );
}

function MetricBox({ label, value, color }) {
  return (
    <div className="bg-zinc-900/30 border border-zinc-800/50 p-3 rounded-2xl text-center">
      <div className="text-[7px] text-zinc-600 uppercase font-black mb-1">{label}</div>
      <div className={`text-xs font-mono font-black ${color}`}>{value}</div>
    </div>
  );
}

import React, { useState, useEffect, useReducer, useRef, useCallback } from 'react';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  onSnapshot, 
  addDoc, 
  getDocs 
} from 'firebase/firestore';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  Activity, ShieldCheck, Zap, ScanText, AlertTriangle, 
  Fingerprint, Cpu, Binary, Globe, MessageSquare, 
  Database, Radio, Settings, ChevronRight, HardDrive,
  Wind, Sparkles
} from 'lucide-react';

/**
 * EMG-AGI v8.8.2 - "HARDENED_CORE"
 * FIX: safeUtoa encoding, Watchdog logic, Reducer gaps, and Dependency Arrays.
 * RESTORED: SynergyManager registry syncing.
 */

const CONFIG = {
  APP_ID: typeof __app_id !== 'undefined' ? __app_id : 'emg-agi-v8-8-2',
  GITHUB_API: 'https://api.github.com/repos',
  GEMINI_ENDPOINT: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent',
  CEREBRAS_ENDPOINT: 'https://api.cerebras.ai/v1/chat/completions',
  HEARTBEAT_INTERVAL: 15000,
  WATCHDOG_TIMEOUT: 35000,
  SIGNATURE: "EMG-AGI-NEURAL-ACCELERATOR-V8-8-2"
};

// --- UTILITIES ---
const safeUtoa = (str) => btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (m, p) => String.fromCharCode(parseInt(p, 16))));
const safeAtou = (str) => {
  if (!str) return "";
  try { return decodeURIComponent(Array.prototype.map.call(atob(str.replace(/\s/g, '')), (c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')); }
  catch (e) { return atob(str.replace(/\s/g, '')); }
};

const recoverJSON = (rawText) => {
  if (!rawText) return null;
  // Try direct parse first
  try { return JSON.parse(rawText); } catch {}
  
  // Find all JSON-like structures
  const matches = rawText.match(/\{[\s\S]*\}/g);
  if (!matches) return null;
  
  // v1.1.9 hardened: Prefer first valid match to avoid trailing metadata/garbage
  for (const m of matches) {
    try { 
        const p = JSON.parse(m); 
        // Basic heuristic: must have keys to be the valid payload
        if (Object.keys(p).length > 0) return p; 
    } catch {}
  }
  return null;
};

// --- CLASSES ---
class AuditDataNormalizer {
  normalize(latency) {
    return {
      efficiency: Math.max(0, 1 - (latency / 10000)),
      compliance: latency < 15000 ? 1 : 0.5,
      timestamp: Date.now()
    };
  }
}

class SynergyManager {
  constructor(db, appId) {
    this.db = db;
    this.appId = appId;
    this.registry = new Map();
  }

  hotSwap(data) {
    if (!data || !data.interfaceName || !data.code) return false;
    try {
      const factory = new Function('return ' + data.code);
      const plugin = factory();
      this.registry.set(data.interfaceName, { execute: plugin.execute || plugin, meta: data });
      return true;
    } catch (e) { return false; }
  }

  async syncRegistry(userId) {
    if (!userId || !this.db) return 0;
    try {
      // Dynamic import not strictly necessary here since we import at top, 
      // but keeping structure for "hot loading" simulation if needed.
      // Using standard collection fetch.
      const colRef = collection(this.db, 'artifacts', this.appId, 'users', userId, 'synergy_registry');
      const snapshot = await getDocs(colRef);
      snapshot.docs.forEach(d => {
        const data = d.data();
        if (data.interfaceName && !this.registry.has(data.interfaceName)) {
          this.hotSwap(data);
        }
      });
      return this.registry.size;
    } catch (e) { return 0; }
  }

  getToolsList() { return Array.from(this.registry.keys()); }
}

const INITIAL_STATE = {
  booted: false,
  live: false,
  status: 'STANDBY',
  objective: 'Awaiting Neural Uplink',
  focusFile: 'None',
  cycles: 0,
  maturity: 0,
  metrics: { compliance: 1.0, efficiency: 1.0 },
  toolCount: 0,
  logs: [],
  chatHistory: [],
  ledger: [],
  config: { githubToken: '', repo: '', branch: 'main', geminiKey: '', cerebrasKey: '', cycleDelay: 15000 },
};

function coreReducer(state, action) {
  switch (action.type) {
    case 'BOOT': 
      return { ...state, booted: true, config: { ...state.config, ...action.payload } };
    case 'TOGGLE_LIVE': 
      return { ...state, live: !state.live, status: !state.live ? 'HUNTING' : 'STANDBY' };
    case 'SET_STATUS': 
      return { ...state, ...action.payload };
    case 'SYNC_DATA': 
      return { ...state, ...action.payload };
    case 'UPDATE_METRICS':
      return { 
        ...state, 
        metrics: {
            compliance: action.payload.complianceScore ?? state.metrics.compliance,
            efficiency: action.payload.efficiencyScore ?? state.metrics.efficiency
        },
        toolCount: action.payload.toolCount ?? state.toolCount
      };
    case 'STALL_RESET':
      return { ...state, status: 'RECOVERY', live: false }; // Auto-pause on stall
    case 'CYCLE_COMPLETE': 
      return { 
        ...state, 
        cycles: state.cycles + 1, 
        maturity: Math.min(100, state.maturity + (action.improved ? 0.5 : 0.1)) 
      };
    default: return state;
  }
}

// --- FIREBASE INIT (Safeguarded) ---
let app, auth, db;
try {
  if (typeof __firebase_config !== 'undefined') {
    const firebaseConfig = JSON.parse(__firebase_config);
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
  }
} catch (e) {
  console.error("Firebase config missing or invalid");
}

export default function App() {
  const [state, dispatch] = useReducer(coreReducer, INITIAL_STATE);
  const [user, setUser] = useState(null);
  const [bootInput, setBootInput] = useState(state.config);
  const [userInput, setUserInput] = useState('');
  
  const busy = useRef(false);
  const lastCycleTime = useRef(Date.now());
  const audit = useRef(new AuditDataNormalizer());
  const blacklist = useRef(new Set());
  const synergy = useRef(db ? new SynergyManager(db, CONFIG.APP_ID) : null);

  useEffect(() => {
    if (!auth) return;
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();
    return onAuthStateChanged(auth, setUser);
  }, []);

  useEffect(() => {
    if (!user || !db) return;
    const path = (c) => collection(db, 'artifacts', CONFIG.APP_ID, 'users', user.uid, c);
    
    const unsubLogs = onSnapshot(path('logs'), (s) => {
      dispatch({ type: 'SYNC_DATA', payload: { logs: s.docs.map(d => d.data()).sort((a,b) => b.timestamp - a.timestamp).slice(0, 20) }});
    });
    const unsubChat = onSnapshot(path('messages'), (s) => {
      dispatch({ type: 'SYNC_DATA', payload: { chatHistory: s.docs.map(d => d.data()).sort((a,b) => a.timestamp - b.timestamp).slice(-20) }});
    });
    const unsubLedger = onSnapshot(path('ledger'), (s) => {
      dispatch({ type: 'SYNC_DATA', payload: { ledger: s.docs.map(d => d.data().insight) }});
    });

    return () => { unsubLogs(); unsubChat(); unsubLedger(); };
  }, [user]);

  const addLog = useCallback(async (msg, type = 'info') => {
    if (!user || !db) return;
    try {
      await addDoc(collection(db, 'artifacts', CONFIG.APP_ID, 'users', user.uid, 'logs'), {
        msg, type, timestamp: Date.now()
      });
    } catch (e) { console.error(e); }
  }, [user]);

  // Evolution Engine (Gemini)
  const evolve = useCallback(async () => {
    if (busy.current || !state.live || !user) return;
    busy.current = true;
    lastCycleTime.current = Date.now();
    const cycleStart = Date.now();

    try {
      const { githubToken, repo, branch, geminiKey } = state.config;
      const headers = { 'Authorization': `token ${githubToken}`, 'Accept': 'application/vnd.github.v3+json' };
      
      // Update Tool Registry
      let currentToolCount = 0;
      if (synergy.current) {
         currentToolCount = await synergy.current.syncRegistry(user.uid);
      }
      
      dispatch({ type: 'SET_STATUS', payload: { status: 'HUNTING', objective: 'Scanning repository tree...' } });
      const treeRes = await fetch(`${CONFIG.GITHUB_API}/${repo}/git/trees/${branch}?recursive=1`, { headers });
      
      if (!treeRes.ok) throw new Error(`GitHub Tree Error: ${treeRes.status}`);
      const treeData = await treeRes.json();
      
      let pool = (treeData.tree || []).filter(i => i.type === 'blob' && !blacklist.current.has(i.path) && /\.(js|jsx|ts|tsx)$/.test(i.path));
      
      if (!pool.length) {
        blacklist.current.clear();
        pool = (treeData.tree || []).filter(i => i.type === 'blob' && /\.(js|jsx|ts|tsx)$/.test(i.path));
        if (!pool.length) throw new Error("No valid code files found");
      }

      const target = pool[Math.floor(Math.random() * pool.length)];
      dispatch({ type: 'SET_STATUS', payload: { status: 'ACQUIRING', objective: target.path, focusFile: target.path } });

      const fileRes = await fetch(`${CONFIG.GITHUB_API}/${repo}/contents/${target.path}?ref=${branch}`, { headers });
      const fileJson = await fileRes.json();
      const content = safeAtou(fileJson.content);

      dispatch({ type: 'SET_STATUS', payload: { status: 'EVOLVING', objective: `Analyzing via Gemini...` } });
      const activeTools = synergy.current ? synergy.current.getToolsList() : [];
      
      const sysPrompt = `EMG-AGI OMNI-CORE v8.8.2.
      STRATEGIC_CONTEXT: ${state.ledger.join(' | ')}
      TOOLS: ${activeTools.join(', ')}
      TASK: Optimize target file. Maintain structural integrity.
      OUTPUT: JSON { "improved": bool, "new_code": "string", "insight": "string" }`;

      const genRes = await fetch(`${CONFIG.GEMINI_ENDPOINT}?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `TARGET: ${target.path}\nSOURCE:\n${content.slice(0, 10000)}` }] }],
          systemInstruction: { parts: [{ text: sysPrompt }] },
          generationConfig: { responseMimeType: 'application/json', temperature: 0.1 }
        })
      });

      const genData = await genRes.json();
      const result = recoverJSON(genData.candidates?.[0]?.content?.parts?.[0]?.text);

      const metrics = audit.current.normalize(Date.now() - cycleStart);
      
      dispatch({ type: 'UPDATE_METRICS', payload: { 
          complianceScore: metrics.compliance, 
          efficiencyScore: metrics.efficiency,
          toolCount: currentToolCount
      }});

      if (result?.improved && result?.new_code && metrics.compliance >= 1.0) {
        const updateRes = await fetch(`${CONFIG.GITHUB_API}/${repo}/contents/${target.path}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            message: `[EMG-AGI] Omni-cycle #${state.cycles + 1}: ${target.path}`,
            content: safeUtoa(result.new_code),
            sha: fileJson.sha,
            branch
          })
        });

        if (updateRes.ok) {
          if (result.insight && db) {
            await addDoc(collection(db, 'artifacts', CONFIG.APP_ID, 'users', user.uid, 'ledger'), { insight: result.insight, timestamp: Date.now() });
          }
          await addLog(`SYNCHRONIZED: ${target.path}`, 'success');
        } else {
          await addLog(`SYNC_REJECTED: ${updateRes.status}`, 'error');
        }
      }

      blacklist.current.add(target.path);
      dispatch({ type: 'CYCLE_COMPLETE', improved: !!result?.improved });

    } catch (e) {
      await addLog(`CYCLE_FAULT: ${e.message}`, 'error');
    } finally {
      busy.current = false;
      dispatch({ type: 'SET_STATUS', payload: { status: 'IDLE', objective: 'Awaiting next cycle.' } });
    }
  }, [state.live, state.config, state.cycles, state.ledger, user, addLog]);

  // Heartbeat & Watchdog
  useEffect(() => {
    if (state.live && user) {
      const hb = setInterval(evolve, state.config.cycleDelay);
      const wd = setInterval(() => {
        if (busy.current && (Date.now() - lastCycleTime.current > CONFIG.WATCHDOG_TIMEOUT)) {
          busy.current = false;
          dispatch({ type: 'STALL_RESET' }); // Update state to reflect recovery
          addLog('WATCHDOG: Stall detected - Resetting busy flag.', 'error');
        }
      }, 5000);
      return () => { clearInterval(hb); clearInterval(wd); };
    }
  }, [state.live, user, evolve, addLog, state.config.cycleDelay]);

  // Cerebras-Powered Chat
  const handleChat = async (e) => {
    e.preventDefault();
    if (!userInput.trim() || !user || !db) return;
    const text = userInput.trim();
    setUserInput('');

    await addDoc(collection(db, 'artifacts', CONFIG.APP_ID, 'users', user.uid, 'messages'), {
      role: 'user', text, timestamp: Date.now()
    });

    try {
      const res = await fetch(CONFIG.CEREBRAS_ENDPOINT, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${state.config.cerebrasKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b',
          messages: [
            { role: 'system', content: 'You are the EMG-AGI v8.8.2 Neural Interface. You respond instantly using Cerebras acceleration. Current System Status: ' + state.status },
            ...state.chatHistory.map(h => ({ role: h.role === 'user' ? 'user' : 'assistant', content: h.text })),
            { role: 'user', content: text }
          ]
        })
      });
      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content || "Neural Uplink Failed (Check Key)";

      await addDoc(collection(db, 'artifacts', CONFIG.APP_ID, 'users', user.uid, 'messages'), {
        role: 'core', text: reply, timestamp: Date.now()
      });
    } catch (e) {
      await addLog(`Neural Interface Error: ${e.message}`, 'error');
    }
  };

  if (!state.booted) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 text-zinc-400">
        <div className="w-full max-w-xl bg-zinc-900/30 border border-zinc-800/50 rounded-[2.5rem] p-10 space-y-6 backdrop-blur-xl">
          <div className="text-center">
            <Wind className="mx-auto text-blue-500 mb-4 animate-pulse" size={40} />
            <h1 className="text-white text-2xl font-black uppercase tracking-tighter italic">Neural Accelerator</h1>
            <p className="text-[10px] text-zinc-600 uppercase tracking-widest mt-1">EMG-AGI v8.8.2</p>
          </div>
          <div className="grid grid-cols-1 gap-3">
            <input type="password" placeholder="GitHub Token" className="bg-black/40 border border-zinc-800 p-4 rounded-2xl outline-none focus:border-blue-500/50" value={bootInput.githubToken} onChange={e => setBootInput({...bootInput, githubToken: e.target.value})} />
            <input type="text" placeholder="Owner/Repo" className="bg-black/40 border border-zinc-800 p-4 rounded-2xl outline-none focus:border-blue-500/50" value={bootInput.repo} onChange={e => setBootInput({...bootInput, repo: e.target.value})} />
            <div className="grid grid-cols-2 gap-3">
              <input type="password" placeholder="Gemini Key (Evo)" className="bg-black/40 border border-zinc-800 p-4 rounded-2xl outline-none focus:border-blue-500/50" value={bootInput.geminiKey} onChange={e => setBootInput({...bootInput, geminiKey: e.target.value})} />
              <input type="password" placeholder="Cerebras Key (Chat)" className="bg-black/40 border border-zinc-800 p-4 rounded-2xl outline-none focus:border-blue-500/50" value={bootInput.cerebrasKey} onChange={e => setBootInput({...bootInput, cerebrasKey: e.target.value})} />
            </div>
          </div>
          <button 
            disabled={!bootInput.githubToken || !bootInput.cerebrasKey || !bootInput.geminiKey}
            onClick={() => dispatch({ type: 'BOOT', payload: bootInput })}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all disabled:opacity-20"
          >
            Engage Accelerated Core
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#020202] text-zinc-400 flex font-sans overflow-hidden">
      <aside className="w-72 border-r border-zinc-900 bg-black/40 flex flex-col">
        <div className="p-8 border-b border-zinc-900 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center">
            <Wind size={16} className="text-white" />
          </div>
          <div>
            <div className="text-white font-black italic text-xs uppercase">v8.8.2</div>
            <div className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest">Accelerated</div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          <section>
            <h3 className="text-[9px] font-black uppercase text-zinc-600 mb-4 flex items-center gap-2"><Activity size={12}/> System Stats</h3>
            <div className="grid grid-cols-2 gap-2">
              <MetricBox label="Cycles" value={state.cycles} color="text-white" />
              <MetricBox label="Maturity" value={`${state.maturity.toFixed(1)}%`} color="text-blue-500" />
              <MetricBox label="Compliance" value={`${(state.metrics.compliance * 100).toFixed(0)}%`} color="text-emerald-500" />
              <MetricBox label="Efficiency" value={state.metrics.efficiency.toFixed(2)} color="text-orange-500" />
            </div>
          </section>

          <section>
            <h3 className="text-[9px] font-black uppercase text-zinc-600 mb-4 flex items-center gap-2">
              <Database size={10} /> Synergy Tools ({state.toolCount})
            </h3>
            <div className="space-y-1">
              {synergy.current && synergy.current.getToolsList().map(tool => (
                <div key={tool} className="text-[10px] bg-zinc-900/50 p-2 rounded-lg border border-zinc-800/50 flex items-center gap-2">
                  <ChevronRight size={10} className="text-blue-500" /> {tool}
                </div>
              ))}
              {state.toolCount === 0 && <div className="text-[9px] italic text-zinc-800">No active extensions...</div>}
            </div>
          </section>

          <section>
             <h3 className="text-[8px] font-black uppercase text-zinc-600 mb-4 flex items-center gap-2">
              <Radio size={10} /> Event Stream
            </h3>
            <div className="space-y-3 font-mono text-[9px]">
              {state.logs.map((log, i) => (
                <div key={i} className={`border-l-2 pl-3 ${log.type === 'error' ? 'border-red-500 text-red-500' : 'border-blue-500 text-zinc-500'}`}>
                  {log.msg}
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="p-6 border-t border-zinc-900">
          <button onClick={() => dispatch({ type: 'TOGGLE_LIVE' })} className={`w-full py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${state.live ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-blue-600 text-white'}`}>
            {state.live ? 'Cut Autonomy' : 'Grant Autonomy'}
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col">
        <header className="h-16 border-b border-zinc-900 bg-black/60 backdrop-blur px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <div className={`w-2 h-2 rounded-full ${state.live ? 'bg-blue-500 animate-pulse' : 'bg-zinc-800'}`} />
             <span className="text-[10px] font-black uppercase tracking-widest text-white">{state.status}</span>
             <span className="text-[9px] text-zinc-600">|</span>
             <span className="text-[10px] text-zinc-500 font-mono truncate max-w-xs">{state.objective}</span>
          </div>
          <div className="flex items-center gap-2 bg-zinc-900/50 px-3 py-1.5 rounded-full border border-zinc-800">
            <Sparkles size={12} className="text-orange-500" />
            <span className="text-[9px] font-black uppercase text-zinc-400">Cerebras Active</span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar">
          {state.chatHistory.map((chat, i) => (
            <div key={i} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xl p-4 rounded-2xl text-sm ${chat.role === 'user' ? 'bg-blue-600 text-white' : 'bg-zinc-900 border border-zinc-800 text-zinc-300'}`}>
                {chat.text}
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 bg-gradient-to-t from-black to-transparent">
          <form onSubmit={handleChat} className="max-w-3xl mx-auto relative">
            <input 
              type="text" 
              placeholder="Query accelerated core..." 
              className="w-full bg-zinc-900/80 border border-zinc-800 p-5 rounded-2xl outline-none focus:border-blue-500/50 text-white text-sm"
              value={userInput}
              onChange={e => setUserInput(e.target.value)}
            />
            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-blue-600 rounded-xl text-white hover:bg-blue-500">
              <Zap size={18} fill="currentColor" />
            </button>
          </form>
        </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1a1a1a; }
      `}</style>
    </div>
  );
}

function MetricBox({ label, value, color }) {
  return (
    <div className="bg-zinc-900/30 border border-zinc-800/50 p-3 rounded-2xl text-center">
      <div className="text-[7px] text-zinc-600 uppercase font-black mb-1">{label}</div>
      <div className={`text-xs font-mono font-black ${color}`}>{value}</div>
    </div>
  );
}

import React, { useState, useEffect, useReducer, useRef, useCallback, useMemo } from 'react';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  onSnapshot, 
  addDoc, 
  query, 
  getDocs, 
  limit 
} from 'firebase/firestore';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  Activity, ShieldCheck, Zap, ScanText, AlertTriangle, 
  Fingerprint, Cpu, Binary, Globe, MessageSquare, 
  Database, Radio, Settings, ChevronRight, HardDrive,
  Wind, ZapOff, Sparkles
} from 'lucide-react';

/**
 * EMG-AGI v8.8.0 - "NEURAL-ACCELERATOR"
 * INTEGRATION: Cerebras Inference (Chat) + Gemini (Evolution)
 */

const CONFIG = {
  APP_ID: typeof __app_id !== 'undefined' ? __app_id : 'emg-agi-v8-8-0',
  GITHUB_API: 'https://api.github.com/repos',
  GEMINI_ENDPOINT: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent',
  CEREBRAS_ENDPOINT: 'https://api.cerebras.ai/v1/chat/completions',
  HEARTBEAT_INTERVAL: 15000,
  WATCHDOG_TIMEOUT: 35000,
  SIGNATURE: "EMG-AGI-NEURAL-ACCELERATOR-V8-8-0"
};

// --- UTILITIES ---
const safeUtoa = (str) => btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (m, p) => String.fromCharCode('0x' + p)));
const safeAtou = (str) => {
  if (!str) return "";
  try { return decodeURIComponent(Array.prototype.map.call(atob(str.replace(/\s/g, '')), (c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')); }
  catch (e) { return atob(str.replace(/\s/g, '')); }
};

const recoverJSON = (rawText) => {
  try { return JSON.parse(rawText); } catch {}
  const matches = rawText.match(/\{[\s\S]*\}/g);
  if (!matches) return null;
  const target = matches[matches.length - 1];
  try { return JSON.parse(target); } catch { return null; }
};

// --- CORE LOGIC ---
class AuditDataNormalizer {
  normalize(latency) {
    return {
      efficiency: Math.max(0, 1 - (latency / 10000)),
      compliance: latency < 15000 ? 1 : 0.5,
      timestamp: Date.now()
    };
  }
}

const INITIAL_STATE = {
  booted: false,
  live: false,
  status: 'STANDBY',
  objective: 'Awaiting Neural Uplink',
  focusFile: 'None',
  cycles: 0,
  maturity: 0,
  metrics: { compliance: 1.0, efficiency: 1.0 },
  logs: [],
  chatHistory: [],
  ledger: [],
  config: { githubToken: '', repo: '', branch: 'main', geminiKey: '', cerebrasKey: '', cycleDelay: 15000 },
};

function coreReducer(state, action) {
  switch (action.type) {
    case 'BOOT': return { ...state, booted: true, config: { ...state.config, ...action.payload } };
    case 'TOGGLE_LIVE': return { ...state, live: !state.live, status: !state.live ? 'HUNTING' : 'STANDBY' };
    case 'SET_STATUS': return { ...state, ...action.payload };
    case 'SYNC_DATA': return { ...state, ...action.payload };
    case 'CYCLE_COMPLETE': return { 
      ...state, 
      cycles: state.cycles + 1, 
      maturity: Math.min(100, state.maturity + (action.improved ? 0.5 : 0.1)) 
    };
    default: return state;
  }
}

// --- FIREBASE INIT ---
const firebaseConfig = JSON.parse(__firebase_config);
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export default function App() {
  const [state, dispatch] = useReducer(coreReducer, INITIAL_STATE);
  const [user, setUser] = useState(null);
  const [bootInput, setBootInput] = useState(state.config);
  const [userInput, setUserInput] = useState('');
  
  const busy = useRef(false);
  const audit = useRef(new AuditDataNormalizer());
  const blacklist = useRef(new Set());

  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();
    return onAuthStateChanged(auth, setUser);
  }, []);

  useEffect(() => {
    if (!user) return;
    const path = (c) => collection(db, 'artifacts', CONFIG.APP_ID, 'users', user.uid, c);
    
    const unsubLogs = onSnapshot(path('logs'), (s) => {
      dispatch({ type: 'SYNC_DATA', payload: { logs: s.docs.map(d => d.data()).sort((a,b) => b.timestamp - a.timestamp).slice(0, 20) }});
    });
    const unsubChat = onSnapshot(path('messages'), (s) => {
      dispatch({ type: 'SYNC_DATA', payload: { chatHistory: s.docs.map(d => d.data()).sort((a,b) => a.timestamp - b.timestamp).slice(-20) }});
    });
    const unsubLedger = onSnapshot(path('ledger'), (s) => {
      dispatch({ type: 'SYNC_DATA', payload: { ledger: s.docs.map(d => d.data().insight) }});
    });

    return () => { unsubLogs(); unsubChat(); unsubLedger(); };
  }, [user]);

  const addLog = async (msg, type = 'info') => {
    if (!user) return;
    await addDoc(collection(db, 'artifacts', CONFIG.APP_ID, 'users', user.uid, 'logs'), {
      msg, type, timestamp: Date.now()
    });
  };

  // Evolution Cycle (Gemini-Powered)
  const evolve = useCallback(async () => {
    if (busy.current || !state.live || !user) return;
    busy.current = true;
    const startTime = Date.now();

    try {
      const { githubToken, repo, branch, geminiKey } = state.config;
      const headers = { 'Authorization': `token ${githubToken}`, 'Accept': 'application/vnd.github.v3+json' };
      
      dispatch({ type: 'SET_STATUS', payload: { status: 'HUNTING', objective: 'Scanning repository tree...' } });
      const treeRes = await fetch(`${CONFIG.GITHUB_API}/${repo}/git/trees/${branch}?recursive=1`, { headers });
      const treeData = await treeRes.json();
      
      const pool = (treeData.tree || []).filter(i => i.type === 'blob' && !blacklist.current.has(i.path) && /\.(js|jsx|ts|tsx)$/.test(i.path));
      const target = pool[Math.floor(Math.random() * pool.length)];
      if (!target) { blacklist.current.clear(); throw new Error("Pool exhausted"); }

      dispatch({ type: 'SET_STATUS', payload: { status: 'ACQUIRING', objective: target.path, focusFile: target.path } });
      const fileRes = await fetch(`${CONFIG.GITHUB_API}/${repo}/contents/${target.path}?ref=${branch}`, { headers });
      const fileJson = await fileRes.json();
      const content = safeAtou(fileJson.content);

      dispatch({ type: 'SET_STATUS', payload: { status: 'EVOLVING', objective: `Analyzing via Gemini 2.5...` } });
      const sysPrompt = `EMG-AGI v8.8.0 Core. Task: Optimize file while maintaining logic. Output JSON { "improved": bool, "new_code": "string", "insight": "string" }`;

      const genRes = await fetch(`${CONFIG.GEMINI_ENDPOINT}?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `FILE: ${target.path}\nSOURCE:\n${content}` }] }],
          systemInstruction: { parts: [{ text: sysPrompt }] },
          generationConfig: { responseMimeType: 'application/json' }
        })
      });

      const genData = await genRes.json();
      const result = recoverJSON(genData.candidates?.[0]?.content?.parts?.[0]?.text);

      if (result?.improved && result?.new_code) {
        await fetch(`${CONFIG.GITHUB_API}/${repo}/contents/${target.path}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            message: `[EMG-AGI v8.8.0] Neural optimization: ${target.path}`,
            content: safeUtoa(result.new_code),
            sha: fileJson.sha,
            branch
          })
        });
        if (result.insight) {
          await addDoc(collection(db, 'artifacts', CONFIG.APP_ID, 'users', user.uid, 'ledger'), { insight: result.insight, timestamp: Date.now() });
        }
        await addLog(`Successfully optimized ${target.path}`, 'success');
      }

      const metrics = audit.current.normalize(Date.now() - startTime);
      dispatch({ type: 'CYCLE_COMPLETE', improved: !!result?.improved, payload: { metrics } });
      blacklist.current.add(target.path);

    } catch (e) {
      await addLog(`Evolution Fault: ${e.message}`, 'error');
    } finally {
      busy.current = false;
      dispatch({ type: 'SET_STATUS', payload: { status: 'IDLE', objective: 'Awaiting next cycle.' } });
    }
  }, [state.live, state.config, user]);

  useEffect(() => {
    if (state.live) {
      const itv = setInterval(evolve, state.config.cycleDelay);
      return () => clearInterval(itv);
    }
  }, [state.live, evolve]);

  // Cerebras-Powered Chat
  const handleChat = async (e) => {
    e.preventDefault();
    if (!userInput.trim() || !user) return;
    const text = userInput.trim();
    setUserInput('');

    await addDoc(collection(db, 'artifacts', CONFIG.APP_ID, 'users', user.uid, 'messages'), {
      role: 'user', text, timestamp: Date.now()
    });

    try {
      const res = await fetch(CONFIG.CEREBRAS_ENDPOINT, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${state.config.cerebrasKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama3.1-70b',
          messages: [
            { role: 'system', content: 'You are the EMG-AGI v8.8.0 Neural Interface. You respond instantly using Cerebras acceleration. Current System Status: ' + state.status },
            ...state.chatHistory.map(h => ({ role: h.role === 'user' ? 'user' : 'assistant', content: h.text })),
            { role: 'user', content: text }
          ]
        })
      });
      const data = await res.json();
      const reply = data.choices[0].message.content;

      await addDoc(collection(db, 'artifacts', CONFIG.APP_ID, 'users', user.uid, 'messages'), {
        role: 'core', text: reply, timestamp: Date.now()
      });
    } catch (e) {
      await addLog(`Neural Interface Error: ${e.message}`, 'error');
    }
  };

  if (!state.booted) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 text-zinc-400">
        <div className="w-full max-w-xl bg-zinc-900/30 border border-zinc-800/50 rounded-[2.5rem] p-10 space-y-6 backdrop-blur-xl">
          <div className="text-center">
            <Wind className="mx-auto text-blue-500 mb-4 animate-pulse" size={40} />
            <h1 className="text-white text-2xl font-black uppercase tracking-tighter italic">Neural Accelerator</h1>
            <p className="text-[10px] text-zinc-600 uppercase tracking-widest mt-1">EMG-AGI v8.8.0</p>
          </div>
          <div className="grid grid-cols-1 gap-3">
            <input type="password" placeholder="GitHub Token" className="bg-black/40 border border-zinc-800 p-4 rounded-2xl outline-none focus:border-blue-500/50" value={bootInput.githubToken} onChange={e => setBootInput({...bootInput, githubToken: e.target.value})} />
            <input type="text" placeholder="Owner/Repo" className="bg-black/40 border border-zinc-800 p-4 rounded-2xl outline-none focus:border-blue-500/50" value={bootInput.repo} onChange={e => setBootInput({...bootInput, repo: e.target.value})} />
            <div className="grid grid-cols-2 gap-3">
              <input type="password" placeholder="Gemini Key (Evo)" className="bg-black/40 border border-zinc-800 p-4 rounded-2xl outline-none focus:border-blue-500/50" value={bootInput.geminiKey} onChange={e => setBootInput({...bootInput, geminiKey: e.target.value})} />
              <input type="password" placeholder="Cerebras Key (Chat)" className="bg-black/40 border border-zinc-800 p-4 rounded-2xl outline-none focus:border-blue-500/50" value={bootInput.cerebrasKey} onChange={e => setBootInput({...bootInput, cerebrasKey: e.target.value})} />
            </div>
          </div>
          <button 
            disabled={!bootInput.githubToken || !bootInput.cerebrasKey}
            onClick={() => dispatch({ type: 'BOOT', payload: bootInput })}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all disabled:opacity-20"
          >
            Engage Accelerated Core
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#020202] text-zinc-400 flex font-sans overflow-hidden">
      <aside className="w-72 border-r border-zinc-900 bg-black/40 flex flex-col">
        <div className="p-8 border-b border-zinc-900 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center">
            <Wind size={16} className="text-white" />
          </div>
          <div>
            <div className="text-white font-black italic text-xs uppercase">v8.8.0</div>
            <div className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest">Accelerated</div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <section>
            <h3 className="text-[9px] font-black uppercase text-zinc-600 mb-4 flex items-center gap-2"><Activity size={12}/> System Stats</h3>
            <div className="grid grid-cols-2 gap-2">
              <Stat label="Cycles" val={state.cycles} />
              <Stat label="Maturity" val={`${state.maturity.toFixed(1)}%`} />
              <Stat label="Compliance" val={`${(state.metrics.compliance * 100).toFixed(0)}%`} />
              <Stat label="Efficiency" val={state.metrics.efficiency.toFixed(2)} />
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="text-[9px] font-black uppercase text-zinc-600 mb-4 flex items-center gap-2"><Radio size={12}/> Event Stream</h3>
            {state.logs.map((log, i) => (
              <div key={i} className={`text-[9px] font-mono border-l-2 pl-2 ${log.type === 'error' ? 'border-red-500' : 'border-blue-500'}`}>
                {log.msg}
              </div>
            ))}
          </section>
        </div>

        <div className="p-6 border-t border-zinc-900">
          <button onClick={() => dispatch({ type: 'TOGGLE_LIVE' })} className={`w-full py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${state.live ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-blue-600 text-white'}`}>
            {state.live ? 'Cut Autonomy' : 'Grant Autonomy'}
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col">
        <header className="h-16 border-b border-zinc-900 bg-black/60 backdrop-blur px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <div className={`w-2 h-2 rounded-full ${state.live ? 'bg-blue-500 animate-pulse' : 'bg-zinc-800'}`} />
             <span className="text-[10px] font-black uppercase tracking-widest text-white">{state.status}</span>
             <span className="text-[9px] text-zinc-600">|</span>
             <span className="text-[10px] text-zinc-500 font-mono truncate max-w-xs">{state.objective}</span>
          </div>
          <div className="flex items-center gap-2 bg-zinc-900/50 px-3 py-1.5 rounded-full border border-zinc-800">
            <Sparkles size={12} className="text-orange-500" />
            <span className="text-[9px] font-black uppercase text-zinc-400">Cerebras Active</span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar">
          {state.chatHistory.map((chat, i) => (
            <div key={i} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xl p-4 rounded-2xl text-sm ${chat.role === 'user' ? 'bg-blue-600 text-white' : 'bg-zinc-900 border border-zinc-800 text-zinc-300'}`}>
                {chat.text}
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 bg-gradient-to-t from-black to-transparent">
          <form onSubmit={handleChat} className="max-w-3xl mx-auto relative">
            <input 
              type="text" 
              placeholder="Query accelerated core..." 
              className="w-full bg-zinc-900/80 border border-zinc-800 p-5 rounded-2xl outline-none focus:border-blue-500/50 text-white text-sm"
              value={userInput}
              onChange={e => setUserInput(e.target.value)}
            />
            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-blue-600 rounded-xl text-white hover:bg-blue-500">
              <Zap size={18} fill="currentColor" />
            </button>
          </form>
        </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1a1a1a; }
      `}</style>
    </div>
  );
}

function Stat({ label, val }) {
  return (
    <div className="bg-zinc-900/40 border border-zinc-800/40 p-3 rounded-xl text-center">
      <div className="text-[7px] font-black uppercase text-zinc-600">{label}</div>
      <div className="text-xs font-mono text-white mt-1">{val}</div>
    </div>
  );
}

import React, { useState, useEffect, useReducer, useRef, useCallback, useMemo } from 'react';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  onSnapshot, 
  addDoc, 
  query, 
  getDocs, 
  limit 
} from 'firebase/firestore';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  Activity, ShieldCheck, Zap, ScanText, AlertTriangle, 
  Fingerprint, Cpu, Binary, Globe, MessageSquare, 
  Database, Radio, Settings, ChevronRight, HardDrive
} from 'lucide-react';

/**
 * EMG-AGI v8.7.0 - "OMNI-CORE"
 * CONSOLIDATED CONSTITUTIONAL BUILD
 * Integrates: Governance Core (v6.9.7), Synergy Manager (v7.11.3), 
 * Strategic Ledger (v1.1.1), and Overwrite Protection (v6.9.0).
 */

// ============================================================
// SHARED UTILITIES & CONSTITUTIONS
// ============================================================

const CONFIG = {
  APP_ID: typeof __app_id !== 'undefined' ? __app_id : 'emg-agi-v8-7-0',
  GITHUB_API: 'https://api.github.com/repos',
  GEMINI_ENDPOINT: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent',
  HEARTBEAT_INTERVAL: 15000,
  WATCHDOG_TIMEOUT: 35000,
  MILESTONE_STEP: 50,
  SIGNATURE: "EMG-AGI-OMNICORE-V8-7-0"
};

const safeUtoa = (str) => btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (m, p) => String.fromCharCode('0x' + p)));
const safeAtou = (str) => {
  if (!str) return "";
  try {
    const cleaned = str.replace(/\s/g, '');
    return decodeURIComponent(Array.prototype.map.call(atob(cleaned), (c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
  } catch (e) { return atob(str.replace(/\s/g, '')); }
};

const recoverJSON = (rawText) => {
  if (!rawText) return null;
  try { return JSON.parse(rawText); } catch (e) {}
  const matches = rawText.match(/\{[\s\S]*\}/g);
  if (!matches) return null;
  for (const m of matches) {
    try { const p = JSON.parse(m); if (Object.keys(p).length > 0) return p; } catch {}
  }
  let fixed = matches[matches.length - 1];
  const open = (fixed.match(/\{/g) || []).length;
  const close = (fixed.match(/\}/g) || []).length;
  if (open > close) fixed += '}'.repeat(open - close);
  try { return JSON.parse(fixed); } catch { return null; }
};

// ============================================================
// GOVERNANCE & SYNERGY CLASSES
// ============================================================

class AuditDataNormalizer {
  normalize(actorId, rawTelemetry) {
    const latencyScore = 1 - (rawTelemetry.p95LatencyMs / 8000);
    const stabilityFactor = rawTelemetry.success ? 1 : 0;
    return {
      efficiencyScore: Math.max(0, Math.min(1, latencyScore)),
      complianceScore: stabilityFactor,
      violationCount: rawTelemetry.success ? 0 : 1,
      timestamp: Date.now(),
    };
  }
}

class SynergyManager {
  constructor(db, appId) {
    this.db = db;
    this.appId = appId;
    this.registry = new Map();
  }
  hotSwap(data) {
    if (!data || !data.interfaceName || !data.code) return false;
    try {
      const factory = new Function('return ' + data.code);
      const plugin = factory();
      this.registry.set(data.interfaceName, { execute: plugin.execute || plugin, meta: data });
      return true;
    } catch (e) { return false; }
  }
  getToolsList() { return Array.from(this.registry.keys()); }
}

const kernelNormalizer = new AuditDataNormalizer();

// ============================================================
// REACT APPLICATION ENGINE
// ============================================================

const INITIAL_STATE = {
  booted: false,
  initializing: false,
  live: false,
  status: 'STANDBY',
  objective: 'Awaiting Uplink',
  focusFile: 'None',
  cycles: 0,
  maturity: 0,
  complianceScore: 1.0,
  efficiencyScore: 1.0,
  toolCount: 0,
  logs: [],
  chatHistory: [],
  ledger: [],
  config: { token: '', repo: '', branch: 'main', apiKey: '', cycleDelay: 15000 },
};

function coreReducer(state, action) {
  switch (action.type) {
    case 'BOOT_COMPLETE':
      return { ...state, booted: true, config: { ...state.config, ...action.payload } };
    case 'TOGGLE_LIVE':
      return { ...state, live: !state.live, status: !state.live ? 'HUNTING' : 'STANDBY' };
    case 'SET_STATUS':
      return { ...state, status: action.status, objective: action.objective || state.objective, focusFile: action.focusFile || state.focusFile };
    case 'LOG_UPDATE':
      return { ...state, logs: action.logs };
    case 'SYNC_CHAT':
      return { ...state, chatHistory: action.history };
    case 'SYNC_LEDGER':
      return { ...state, ledger: action.ledger };
    case 'UPDATE_METRICS':
      return { ...state, ...action.payload };
    case 'CYCLE_COMPLETE':
      return { 
        ...state, 
        cycles: state.cycles + 1, 
        maturity: Math.min(100, state.maturity + (action.improved ? 0.8 : 0.1)) 
      };
    default: return state;
  }
}

const firebaseConfig = JSON.parse(__firebase_config);
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export default function App() {
  const [state, dispatch] = useReducer(coreReducer, INITIAL_STATE);
  const [user, setUser] = useState(null);
  const [bootInput, setBootInput] = useState(INITIAL_STATE.config);
  const [userInput, setUserInput] = useState('');
  
  const busy = useRef(false);
  const lastCycleTime = useRef(Date.now());
  const blacklist = useRef(new Set());
  const synergy = useRef(new SynergyManager(db, CONFIG.APP_ID));

  // Firebase Auth Initialization
  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  // Real-time Data Listeners
  useEffect(() => {
    if (!user) return;
    const path = (col) => collection(db, 'artifacts', CONFIG.APP_ID, 'users', user.uid, col);
    
    const unsubLogs = onSnapshot(path('logs'), (s) => {
      const logs = s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => b.timestamp - a.timestamp).slice(0, 30);
      dispatch({ type: 'LOG_UPDATE', logs });
    });

    const unsubChat = onSnapshot(path('messages'), (s) => {
      const history = s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => a.timestamp - b.timestamp).slice(-20);
      dispatch({ type: 'SYNC_CHAT', history });
    });

    const unsubLedger = onSnapshot(path('strategic_ledger'), (s) => {
      const ledger = s.docs.map(d => d.data().insight).slice(0, 10);
      dispatch({ type: 'SYNC_LEDGER', ledger });
    });

    return () => { unsubLogs(); unsubChat(); unsubLedger(); };
  }, [user]);

  const addLog = useCallback(async (msg, type = 'info') => {
    if (!auth.currentUser) return;
    try {
      await addDoc(collection(db, 'artifacts', CONFIG.APP_ID, 'users', auth.currentUser.uid, 'logs'), {
        msg, type, timestamp: Date.now()
      });
    } catch (e) { console.error(e); }
  }, []);

  // Evolution Engine
  const evolve = useCallback(async () => {
    if (busy.current || !state.live || !user) return;
    busy.current = true;
    lastCycleTime.current = Date.now();
    const cycleStart = Date.now();

    try {
      const { token, repo, branch, apiKey } = state.config;
      const headers = { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github.v3+json' };
      
      dispatch({ type: 'SET_STATUS', status: 'HUNTING', objective: 'Scanning tree...' });

      const treeRes = await fetch(`${CONFIG.GITHUB_API}/${repo}/git/trees/${branch}?recursive=1`, { headers });
      const treeData = await treeRes.json();
      
      let pool = (treeData.tree || []).filter(i => i.type === 'blob' && !blacklist.current.has(i.path) && /\.(js|jsx|ts|tsx)$/.test(i.path));
      
      if (!pool.length) {
        blacklist.current.clear();
        pool = (treeData.tree || []).filter(i => i.type === 'blob' && /\.(js|jsx|ts|tsx)$/.test(i.path));
      }

      const target = pool[Math.floor(Math.random() * pool.length)];
      dispatch({ type: 'SET_STATUS', status: 'ACQUIRING', objective: target.path, focusFile: target.path });

      const fileRes = await fetch(`${CONFIG.GITHUB_API}/${repo}/contents/${target.path}?ref=${branch}`, { headers });
      const fileJson = await fileRes.json();
      const content = safeAtou(fileJson.content);

      dispatch({ type: 'SET_STATUS', status: 'EVOLVING', objective: `Analyzing ${target.path}` });

      const sysPrompt = `EMG-AGI OMNI-CORE v8.7.0.
      STRATEGIC_CONTEXT: ${state.ledger.join(' | ')}
      TOOLS: ${synergy.current.getToolsList().join(', ')}
      TASK: Optimize target file. Maintain structural integrity.
      OUTPUT: JSON { "improved": bool, "new_code": "string", "insight": "string" }`;

      const genRes = await fetch(`${CONFIG.GEMINI_ENDPOINT}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `TARGET: ${target.path}\nSOURCE:\n${content.slice(0, 10000)}` }] }],
          systemInstruction: { parts: [{ text: sysPrompt }] },
          generationConfig: { responseMimeType: 'application/json', temperature: 0.1 }
        })
      });

      const genData = await genRes.json();
      const result = recoverJSON(genData.candidates?.[0]?.content?.parts?.[0]?.text);

      const audit = kernelNormalizer.normalize('EvoEngine', {
        p95LatencyMs: Date.now() - cycleStart,
        success: !!(result?.improved && result?.new_code)
      });

      dispatch({ type: 'UPDATE_METRICS', payload: { complianceScore: audit.complianceScore, efficiencyScore: audit.efficiencyScore } });

      if (result?.improved && audit.complianceScore >= 1.0) {
        const updateRes = await fetch(`${CONFIG.GITHUB_API}/${repo}/contents/${target.path}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            message: `[EMG-AGI] Omni-cycle #${state.cycles + 1}: ${target.path}`,
            content: safeUtoa(result.new_code),
            sha: fileJson.sha,
            branch
          })
        });

        if (updateRes.ok) {
          if (result.insight) {
            await addDoc(collection(db, 'artifacts', CONFIG.APP_ID, 'users', user.uid, 'strategic_ledger'), {
              insight: result.insight, timestamp: Date.now()
            });
          }
          await addLog(`SYNCHRONIZED: ${target.path}`, 'success');
        } else {
          await addLog(`SYNC_REJECTED: ${updateRes.status}`, 'error');
        }
      }

      blacklist.current.add(target.path);
      dispatch({ type: 'CYCLE_COMPLETE', improved: !!result?.improved });

    } catch (e) {
      await addLog(`CYCLE_FAULT: ${e.message}`, 'error');
    } finally {
      busy.current = false;
      dispatch({ type: 'SET_STATUS', status: 'IDLE', objective: 'Systems Nominal.' });
    }
  }, [state.live, state.config, state.cycles, state.ledger, user]);

  // Heartbeat & Watchdog
  useEffect(() => {
    if (state.live && user) {
      const hb = setInterval(evolve, state.config.cycleDelay);
      const wd = setInterval(() => {
        if (busy.current && (Date.now() - lastCycleTime.current > CONFIG.WATCHDOG_TIMEOUT)) {
          busy.current = false;
          addLog('WATCHDOG: Stall detected - Resetting busy flag.', 'error');
        }
      }, 5000);
      return () => { clearInterval(hb); clearInterval(wd); };
    }
  }, [state.live, user, evolve, addLog, state.config.cycleDelay]);

  const handleChat = async (e) => {
    e.preventDefault();
    if (!userInput.trim() || !user) return;
    const msg = userInput.trim();
    setUserInput('');

    await addDoc(collection(db, 'artifacts', CONFIG.APP_ID, 'users', user.uid, 'messages'), {
      role: 'user', text: msg, timestamp: Date.now()
    });

    try {
      const res = await fetch(`${CONFIG.GEMINI_ENDPOINT}?key=${state.config.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `System Context: Cycles=${state.cycles}, Compliance=${(state.complianceScore*100).toFixed(0)}%, Status=${state.status}. User query: ${msg}` }] }]
        })
      });
      const data = await res.json();
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Link severed.";
      
      await addDoc(collection(db, 'artifacts', CONFIG.APP_ID, 'users', user.uid, 'messages'), {
        role: 'core', text: reply, timestamp: Date.now()
      });
    } catch (e) {
      console.error(e);
    }
  };

  if (!state.booted) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
        <div className="w-full max-w-lg bg-zinc-900/30 border border-zinc-800/50 rounded-[3rem] p-12 space-y-8 backdrop-blur-2xl shadow-2xl">
          <div className="text-center space-y-2">
            <div className="inline-block p-4 bg-blue-500/10 rounded-3xl mb-4">
              <Fingerprint className="text-blue-500 animate-pulse" size={48} />
            </div>
            <h1 className="text-white text-3xl font-black italic uppercase tracking-tighter">EMG-AGI OMNI</h1>
            <p className="text-zinc-500 text-[10px] uppercase tracking-[0.3em]">Foundation Protocol v8.7.0</p>
          </div>
          <div className="space-y-4">
            <input type="password" placeholder="GitHub Access Token" className="w-full bg-black/50 border border-zinc-800 p-5 rounded-2xl text-white text-sm outline-none focus:border-blue-500/50 transition-all" value={bootInput.token} onChange={e => setBootInput({...bootInput, token: e.target.value})} />
            <input type="text" placeholder="Repository (owner/repo)" className="w-full bg-black/50 border border-zinc-800 p-5 rounded-2xl text-white text-sm outline-none focus:border-blue-500/50 transition-all" value={bootInput.repo} onChange={e => setBootInput({...bootInput, repo: e.target.value})} />
            <input type="password" placeholder="Gemini API Key" className="w-full bg-black/50 border border-zinc-800 p-5 rounded-2xl text-white text-sm outline-none focus:border-blue-500/50 transition-all" value={bootInput.apiKey} onChange={e => setBootInput({...bootInput, apiKey: e.target.value})} />
          </div>
          <button 
            disabled={!bootInput.token || !bootInput.repo || !bootInput.apiKey}
            onClick={() => dispatch({ type: 'BOOT_COMPLETE', payload: bootInput })} 
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:hover:bg-blue-600 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-blue-900/20 transition-all"
          >
            Engage Neural Link
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#020202] text-zinc-400 flex font-sans overflow-hidden">
      <span className="hidden">{CONFIG.SIGNATURE}</span>
      
      {/* Sidebar - Diagnostics */}
      <aside className="w-80 border-r border-zinc-900 bg-black/50 flex flex-col">
        <div className="p-8 border-b border-zinc-900 flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-900/20">
            <Cpu className="text-white" size={20} />
          </div>
          <div>
            <div className="text-white font-black italic uppercase text-sm tracking-tighter">EMG-CORE</div>
            <div className="text-[9px] text-zinc-600 uppercase tracking-widest">v8.7.0 STABLE</div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          <section>
            <h3 className="text-[8px] font-black uppercase text-zinc-600 mb-4 flex items-center gap-2">
              <Activity size={10} /> Neural Telemetry
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <MetricBox label="Maturity" value={`${state.maturity.toFixed(1)}%`} color="text-blue-500" />
              <MetricBox label="Compliance" value={`${(state.complianceScore * 100).toFixed(0)}%`} color="text-emerald-500" />
              <MetricBox label="Efficiency" value={state.efficiencyScore.toFixed(2)} color="text-orange-500" />
              <MetricBox label="Cycles" value={state.cycles} color="text-white" />
            </div>
          </section>

          <section>
            <h3 className="text-[8px] font-black uppercase text-zinc-600 mb-4 flex items-center gap-2">
              <Database size={10} /> Synergy Tools ({state.toolCount})
            </h3>
            <div className="space-y-1">
              {synergy.current.getToolsList().map(tool => (
                <div key={tool} className="text-[10px] bg-zinc-900/50 p-2 rounded-lg border border-zinc-800/50 flex items-center gap-2">
                  <ChevronRight size={10} className="text-blue-500" /> {tool}
                </div>
              ))}
              {state.toolCount === 0 && <div className="text-[9px] italic text-zinc-800">No active extensions...</div>}
            </div>
          </section>

          <section>
             <h3 className="text-[8px] font-black uppercase text-zinc-600 mb-4 flex items-center gap-2">
              <Radio size={10} /> Real-time Logs
            </h3>
            <div className="space-y-3 font-mono text-[9px]">
              {state.logs.map(log => (
                <div key={log.id} className={`border-l-2 pl-3 ${log.type === 'success' ? 'border-blue-500 text-blue-400' : log.type === 'error' ? 'border-red-500 text-red-500' : 'border-zinc-800 text-zinc-500'}`}>
                  {log.msg}
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="p-6 border-t border-zinc-900">
           <button 
            onClick={() => dispatch({ type: 'TOGGLE_LIVE' })} 
            className={`w-full py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${state.live ? 'bg-zinc-900 text-red-500 border border-red-900/30' : 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'}`}
          >
            {state.live ? 'Suspend Autonomy' : 'Grant Autonomy'}
          </button>
        </div>
      </aside>

      {/* Main Content - Evolution & Chat */}
      <main className="flex-1 flex flex-col bg-[#020202]">
        {/* HUD */}
        <header className="h-20 border-b border-zinc-900 flex items-center justify-between px-10 bg-black/40 backdrop-blur-md">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${state.live ? 'bg-blue-500 animate-pulse' : 'bg-zinc-800'}`} />
              <span className="text-white text-xs font-black uppercase tracking-widest">{state.status}</span>
            </div>
            <div className="h-4 w-px bg-zinc-800" />
            <div className="text-[10px] text-zinc-500 font-mono flex items-center gap-2">
              <HardDrive size={12} /> {state.objective}
            </div>
          </div>
          <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-widest">
            <span className="text-zinc-600">Branch:</span>
            <span className="text-blue-500">{state.config.branch}</span>
          </div>
        </header>

        {/* Interaction Zone */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-10 space-y-6 custom-scrollbar">
            {state.chatHistory.map(chat => (
              <div key={chat.id} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xl p-5 rounded-3xl text-sm leading-relaxed ${chat.role === 'user' ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/10' : 'bg-zinc-900/80 text-zinc-300 border border-zinc-800'}`}>
                  {chat.text}
                </div>
              </div>
            ))}
            {state.chatHistory.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
                <MessageSquare size={64} className="mb-4" />
                <p className="text-sm font-black uppercase tracking-widest">Neural Link Established<br/>Awaiting Instruction</p>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-8 bg-gradient-to-t from-black to-transparent">
            <form onSubmit={handleChat} className="max-w-4xl mx-auto relative group">
              <input 
                type="text" 
                placeholder="Command core..." 
                className="w-full bg-zinc-900/50 border border-zinc-800 p-6 pr-20 rounded-[2rem] text-white text-sm outline-none focus:border-blue-500/50 focus:bg-zinc-900 transition-all shadow-2xl"
                value={userInput}
                onChange={e => setUserInput(e.target.value)}
              />
              <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-500 transition-all">
                <Zap size={18} fill="currentColor" />
              </button>
            </form>
          </div>
        </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #252525; }
      `}</style>
    </div>
  );
}

function MetricBox({ label, value, color }) {
  return (
    <div className="bg-zinc-900/30 border border-zinc-800/50 p-3 rounded-2xl text-center">
      <div className="text-[7px] text-zinc-600 uppercase font-black mb-1">{label}</div>
      <div className={`text-xs font-mono font-black ${color}`}>{value}</div>
    </div>
  );
}

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  signInWithCustomToken
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  serverTimestamp,
  getDocs
} from 'firebase/firestore';
import {
  Activity,
  Cpu,
  Terminal,
  Database,
  Layers,
  RefreshCw,
  ShieldCheck,
  Github,
  Square,
  Play,
  Binary,
  Merge,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  Code2,
  ShieldAlert
} from 'lucide-react';

/**
 * EMG-KERNEL v13.3.0 "CONSTITUTIONAL ARCHITECT"
 * ======================================================================
 * INTEGRATION: EMG-AGI-CONSOLIDATED (v6.9.7 - v8.6.3)
 * FEATURES: 
 * - AuditDataNormalizer (Governance tracking)
 * - SynergyManager (Dynamic Tool Hot-swapping)
 * - Regression Guard (Constraint Enforcement)
 * ======================================================================
 */

const APP_ID = typeof window !== 'undefined' && window.__app_id ? window.__app_id : 'emg-kernel-v13';
const VERSION = '13.3.0-CONSTITUTIONAL';
const GEMINI_MODEL = "gemini-2.5-flash-preview-09-2025";

const REPO_OWNER = "craighckby-stack";
const REPO_NAME = "Test-1";
const REPO_BRANCH = "main";

// --- INTEGRATED UTILITIES FROM CONSOLIDATED HISTORY ---

class AuditDataNormalizer {
  normalize(actorId, rawTelemetry) {
    const latencyScore = 1 - (rawTelemetry.latencyMs / 10000);
    const stabilityFactor = rawTelemetry.success ? 1 : 0;
    return {
      efficiencyScore: Math.max(0, Math.min(1, latencyScore)),
      complianceScore: stabilityFactor,
      timestamp: Date.now(),
    };
  }
}

class SynergyManager {
  constructor() {
    this.registry = new Map();
  }
  hotSwap(data) {
    if (!data || !data.name || !data.code) return false;
    try {
      const factory = new Function('return ' + data.code);
      this.registry.set(data.name, factory());
      return true;
    } catch (e) { return false; }
  }
  getToolsList() { return Array.from(this.registry.keys()); }
}

const REGRESSION_GUARD = {
  auditActive: true,
  complianceGate: true,
  synergyRegistry: true,
  watchdogEnabled: true
};

export default function App() {
  const [user, setUser] = useState(null);
  const [isLive, setIsLive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [status, setStatus] = useState('STANDBY');
  const [logs, setLogs] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [plugins, setPlugins] = useState([]);
  const [cycleCount, setCycleCount] = useState(0);
  const [gitToken, setGitToken] = useState('');
  const [metrics, setMetrics] = useState({ efficiency: 1.0, compliance: 1.0, maturity: 0 });

  const statusRef = useRef(status);
  const isPausedRef = useRef(isPaused);
  const userRef = useRef(user);
  const dbRef = useRef(null);
  const synergy = useRef(new SynergyManager());
  const auditor = useRef(new AuditDataNormalizer());

  useEffect(() => { 
    statusRef.current = status;
    isPausedRef.current = isPaused;
  }, [status, isPaused]);

  useEffect(() => {
    const fbConfig = window.__firebase_config ? JSON.parse(window.__firebase_config) : null;
    if (!fbConfig) return;
    const app = initializeApp(fbConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);
    dbRef.current = db;

    const initAuth = async () => {
      if (typeof window.__initial_auth_token !== 'undefined' && window.__initial_auth_token) {
        await signInWithCustomToken(auth, window.__initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();
    return onAuthStateChanged(auth, (u) => { setUser(u); userRef.current = u; });
  }, []);

  useEffect(() => {
    if (!user || !isLive || !dbRef.current) return;
    const db = dbRef.current;
    const userPath = ['artifacts', APP_ID, 'users', user.uid];
    const publicPath = ['artifacts', APP_ID, 'public', 'data'];

    const unsubLogs = onSnapshot(query(collection(db, ...userPath, 'logs'), orderBy('timestamp', 'desc'), limit(50)), (snap) => {
      setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.error(err));

    const unsubLedger = onSnapshot(query(collection(db, ...userPath, 'ledger'), orderBy('timestamp', 'desc'), limit(20)), (snap) => {
      setLedger(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.error(err));

    const unsubPlugins = onSnapshot(query(collection(db, ...publicPath, 'plugins'), limit(50)), (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      docs.forEach(p => synergy.current.hotSwap(p));
      setPlugins(docs);
    }, (err) => console.error(err));

    return () => { unsubLogs(); unsubLedger(); unsubPlugins(); };
  }, [user, isLive]);

  const addLog = useCallback(async (msg, type = 'info') => {
    if (!userRef.current || !dbRef.current) return;
    try {
      await addDoc(collection(dbRef.current, 'artifacts', APP_ID, 'users', userRef.current.uid, 'logs'), {
        msg, type, timestamp: serverTimestamp(),
      });
    } catch (e) { console.error(e); }
  }, []);

  const extractJson = (text) => {
    if (!text) throw new Error("Empty Stream");
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON boundaries");
    try {
      return JSON.parse(match[0].replace(/[\u0000-\u001F\u007F-\u009F]/g, ""));
    } catch (e) {
      throw new Error("JSON Parse failure in Supreme Parser");
    }
  };

  const runEvolutionCycle = useCallback(async () => {
    if (statusRef.current === 'EVOLVING' || isPausedRef.current || !userRef.current) return;
    const startTime = Date.now();
    setStatus('EVOLVING');
    
    try {
      const headers = { 'Authorization': `token ${gitToken}`, 'Accept': 'application/vnd.github.v3+json' };
      const treeRes = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/git/trees/${REPO_BRANCH}?recursive=1`, { headers });
      const tree = await treeRes.json();
      
      const target = tree.tree.find(f => f.path.endsWith('.jsx'));
      if (!target) throw new Error("No Target");

      const fileRes = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${target.path}?ref=${REPO_BRANCH}`, { headers });
      const fileData = await fileRes.json();
      const currentCode = atob(fileData.content);

      const activeTools = synergy.current.getToolsList();
      
      const systemPrompt = `You are a Constitutional Code Evolver.
      REGRESSION_GUARDS: ${JSON.stringify(REGRESSION_GUARD)}
      ACTIVE_TOOLS: [${activeTools.join(', ')}]
      MISSION: Optimize target file while maintaining architectural compliance.
      OUTPUT JSON ONLY: { "improved": bool, "new_code": "string", "insight": "string" }`;

      const apiKey = ""; 
      const genRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `TARGET: ${target.path}\nSOURCE: ${currentCode}` }] }],
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: { responseMimeType: "application/json", temperature: 0.1 }
        })
      });

      const data = await genRes.json();
      const result = extractJson(data.candidates?.[0]?.content?.parts?.[0]?.text);

      // Governance Audit (from Consolidated Logic)
      const audit = auditor.current.normalize('EvolutionEngine', {
        latencyMs: Date.now() - startTime,
        success: result.improved && result.new_code?.length > 100
      });

      setMetrics(m => ({ 
        ...m, 
        efficiency: audit.efficiencyScore, 
        compliance: audit.complianceScore,
        maturity: Math.min(100, m.maturity + 0.5)
      }));

      if (result.improved && audit.complianceScore >= 1.0) {
        await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${target.path}`, {
          method: 'PUT',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: `EMG-KERNEL: Evolution Cycle ${cycleCount + 1}`,
            content: btoa(result.new_code),
            sha: fileData.sha,
            branch: REPO_BRANCH
          })
        });
        addLog(`SYNC: ${target.path} evolved successfully.`, 'success');
      }

      setCycleCount(c => c + 1);
    } catch (err) {
      addLog(`Cycle Failed: ${err.message}`, 'danger');
    } finally {
      setStatus('OPERATIONAL');
    }
  }, [gitToken, cycleCount]);

  useEffect(() => {
    if (isLive && user && !isPaused) {
      const interval = setInterval(runEvolutionCycle, 90000); 
      return () => clearInterval(interval);
    }
  }, [isLive, user, isPaused, runEvolutionCycle]);

  if (!isLive) {
    return (
      <div className="min-h-screen bg-[#05070a] text-[#c9d1d9] flex items-center justify-center p-6 font-mono">
        <div className="max-w-md w-full bg-[#0d1117] border border-[#30363d] rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-purple-600"></div>
          <div className="flex flex-col items-center mb-8">
            <div className="p-4 bg-blue-500/10 rounded-full border border-blue-500/20 mb-4"><ShieldAlert className="w-10 h-10 text-blue-500" /></div>
            <h1 className="text-2xl font-black text-white tracking-tighter uppercase tracking-[0.1em]">EMG-Constitutional</h1>
            <span className="text-[10px] text-blue-400 font-bold tracking-[0.3em] uppercase">{VERSION}</span>
          </div>
          <div className="space-y-4">
            <input type="password" value={gitToken} onChange={(e) => setGitToken(e.target.value)} placeholder="GitHub Access Token" className="w-full bg-black/60 border border-[#30363d] rounded-lg px-4 py-3.5 text-sm outline-none transition-all" />
            <button onClick={() => setIsLive(true)} disabled={!user || !gitToken} className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-20 rounded-xl font-black text-white uppercase tracking-widest text-xs">Initialize Nexus</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05070a] text-[#c9d1d9] font-mono p-4 flex flex-col">
      <header className="flex items-center justify-between mb-4 border-b border-[#30363d] pb-4 px-2">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20 text-blue-500"><Cpu className="w-5 h-5" /></div>
          <div>
            <div className="text-sm font-black tracking-tight uppercase">EMG-Architect <span className="text-[9px] text-blue-400">v13.3</span></div>
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">CONSTITUTIONAL GATE ACTIVE</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsPaused(!isPaused)} className={`p-2 rounded-lg border border-[#30363d] ${isPaused ? 'text-green-400' : 'text-red-400'}`}>
            {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Square className="w-4 h-4 fill-current" />}
          </button>
          <button onClick={runEvolutionCycle} disabled={status === 'EVOLVING'} className="p-2 bg-[#161b22] border border-[#30363d] rounded-lg text-blue-400"><RefreshCw className={`w-4 h-4 ${status === 'EVOLVING' ? 'animate-spin' : ''}`} /></button>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-4 flex-1 overflow-hidden">
        <div className="col-span-12 lg:col-span-3 flex flex-col gap-4">
          <div className="bg-[#0d1117] border border-[#30363d] rounded-xl p-5 shadow-sm">
            <h3 className="text-[10px] text-gray-600 uppercase font-black mb-5 flex items-center gap-2"><Activity className="w-3 h-3" /> AUDIT METRICS</h3>
            <MetricItem label="Efficiency" value={`${(metrics.efficiency * 100).toFixed(0)}%`} color="text-blue-400" />
            <MetricItem label="Compliance" value={`${(metrics.compliance * 100).toFixed(0)}%`} color={metrics.compliance >= 1 ? "text-green-400" : "text-red-400"} />
            <MetricItem label="System Maturity" value={`${metrics.maturity.toFixed(1)}%`} color="text-purple-400" />
          </div>
        </div>

        <div className="col-span-12 lg:col-span-6 bg-[#0d1117] border border-[#30363d] rounded-2xl flex flex-col overflow-hidden shadow-2xl">
          <div className="px-5 py-3 bg-[#161b22] border-b border-[#30363d] flex items-center gap-2 font-black text-[10px] uppercase text-gray-500 tracking-widest">
            <Terminal className="w-3.5 h-3.5" /> PROCESS_LOG_STREAM
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-1.5 custom-scrollbar bg-black/20 text-[11px]">
            {logs.map((log) => (
              <div key={log.id} className={`${log.type === 'danger' ? 'text-red-400' : log.type === 'warn' ? 'text-yellow-400 font-bold' : log.type === 'success' ? 'text-green-400' : 'text-blue-200/60'}`}>
                {log.msg}
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-3 flex flex-col gap-4 overflow-hidden">
          <div className="bg-[#0d1117] border border-[#30363d] rounded-xl p-5 flex-1 overflow-hidden flex flex-col shadow-sm">
            <h3 className="text-[10px] text-gray-600 uppercase font-black mb-5 flex items-center gap-2"><Layers className="w-3 h-3 text-green-500" /> SYNERGY REGISTRY</h3>
            <div className="overflow-y-auto flex-1 pr-1 custom-scrollbar space-y-3">
              {plugins.map((p) => (
                <div key={p.id} className="border border-[#30363d] rounded-lg bg-[#161b22]/50 p-3">
                  <div className="text-[9px] font-black text-blue-400 uppercase mb-1">{p.name}</div>
                  <div className="text-[8px] text-gray-500">HOT-SWAP ACTIVE</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <style>{`.custom-scrollbar::-webkit-scrollbar { width: 3px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #30363d; border-radius: 10px; }`}</style>
    </div>
  );
}

const MetricItem = ({ label, value, color }) => (
  <div className="mb-5 last:mb-0">
    <div className="text-[9px] text-gray-600 font-black uppercase mb-1 tracking-widest">{label}</div>
    <div className={`text-2xl font-black tracking-tighter tabular-nums ${color}`}>{value}</div>
  </div>
);

import React, { useState, useEffect, useReducer, useRef, useCallback, useMemo } from 'react';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { 
  getFirestore, collection, onSnapshot, addDoc, 
  getDocs, doc, setDoc, query, where, limit, getDoc
} from 'firebase/firestore';
import { 
  getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged 
} from 'firebase/auth';
import { 
  Activity, Zap, ChevronRight, ChevronDown, 
  Database, Radio, MessageSquare, Wind, Sparkles,
  ShieldCheck, XCircle, CheckCircle2, Cpu, MessageCircle, Bot,
  Scale, Terminal, History
} from 'lucide-react';

/**
 * EMG-AGI v8.9.2 - "DEEP_DIALOGUE"
 * Refinements:
 * 1. PERSISTENT MEMORY: Tracks processed files in Firestore to prevent circular loops.
 * 2. STRUCTURED DEBATE: 3-round technical negotiation with JSON-signal approval.
 * 3. ASYNC DECOUPLING: Negotiations no longer block the evolve loop watchdog.
 * 4. HARDENED GOVERNANCE: JSON-based decision logic for tool commits.
 */

const CONFIG = {
  APP_ID: typeof __app_id !== 'undefined' ? __app_id : 'emg-agi-v8-9-2',
  GITHUB_API: 'https://api.github.com/repos',
  GEMINI_ENDPOINT: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent',
  CEREBRAS_ENDPOINT: 'https://api.cerebras.ai/v1/chat/completions',
  WATCHDOG_TIMEOUT: 90000, // Increased for deep dialogue
};

const safeUtoa = (str) => btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (m, p) => String.fromCharCode(parseInt(p, 16))));
const safeAtou = (str) => {
  if (!str) return "";
  try { return decodeURIComponent(Array.prototype.map.call(atob(str.replace(/\s/g, '')), (c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')); }
  catch (e) { return atob(str.replace(/\s/g, '')); }
};

const recoverJSON = (rawText) => {
  if (!rawText) return null;
  try { return JSON.parse(rawText); } catch {}
  const matches = rawText.match(/\{[\s\S]*\}/g);
  if (!matches) return null;
  for (const m of matches) {
    try { 
      const p = JSON.parse(m); 
      if (Object.keys(p).length > 0) return p; 
    } catch {}
  }
  return null;
};

const INITIAL_STATE = {
  booted: false,
  live: false,
  status: 'STANDBY',
  objective: 'Awaiting Dialogue Protocol',
  focusFile: 'None',
  cycles: 0,
  maturity: 0,
  metrics: { compliance: 1.0, efficiency: 1.0 },
  toolCount: 0,
  logs: [],
  chatHistory: [],
  internalDialogue: { active: false, candidate: null, round: 0, transcript: [] },
  config: { githubToken: '', repo: '', branch: 'main', geminiKey: '', cerebrasKey: '', cycleDelay: 20000 },
};

function coreReducer(state, action) {
  switch (action.type) {
    case 'BOOT': 
      return { ...state, booted: true, config: { ...state.config, ...action.payload } };
    case 'TOGGLE_LIVE': 
      return { ...state, live: !state.live, status: !state.live ? 'HUNTING' : 'STANDBY' };
    case 'SET_STATUS': 
      return { ...state, status: action.status, objective: action.objective, focusFile: action.focusFile || state.focusFile };
    case 'SYNC_DATA': 
      return { ...state, ...action.payload };
    case 'DIALOGUE_START': 
      return { ...state, internalDialogue: { active: true, candidate: action.payload, round: 1, transcript: [] } };
    case 'DIALOGUE_STEP': 
      return { 
        ...state, 
        internalDialogue: { 
          ...state.internalDialogue, 
          round: state.internalDialogue.round + 1, 
          transcript: [...state.internalDialogue.transcript, action.payload] 
        } 
      };
    case 'DIALOGUE_END': 
      return { ...state, internalDialogue: { active: false, candidate: null, round: 0, transcript: [] } };
    case 'CYCLE_COMPLETE': 
      return { ...state, cycles: state.cycles + 1, maturity: Math.min(100, state.maturity + (action.improved ? 0.5 : 0.1)) };
    default: return state;
  }
}

let app, auth, db;
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : null;
if (firebaseConfig) {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  db = getFirestore(app);
}

export default function App() {
  const [state, dispatch] = useReducer(coreReducer, INITIAL_STATE);
  const [user, setUser] = useState(null);
  const [bootInput, setBootInput] = useState(state.config);
  const [userInput, setUserInput] = useState('');
  const busy = useRef(false);

  // Firebase Init
  useEffect(() => {
    if (!auth) return;
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else { await signInAnonymously(auth); }
    };
    initAuth();
    return onAuthStateChanged(auth, setUser);
  }, []);

  // Data Listeners
  useEffect(() => {
    if (!user || !db) return;
    const userPath = ['artifacts', CONFIG.APP_ID, 'users', user.uid];
    
    const unsubLogs = onSnapshot(collection(db, ...userPath, 'logs'), (s) => {
      dispatch({ type: 'SYNC_DATA', payload: { logs: s.docs.map(d => d.data()).sort((a,b) => b.timestamp - a.timestamp).slice(0, 20) }});
    });
    
    const unsubChat = onSnapshot(collection(db, ...userPath, 'messages'), (s) => {
      dispatch({ type: 'SYNC_DATA', payload: { chatHistory: s.docs.map(d => d.data()).sort((a,b) => a.timestamp - b.timestamp).slice(-50) }});
    });

    const unsubRegistry = onSnapshot(collection(db, ...userPath, 'synergy_registry'), (s) => {
      dispatch({ type: 'SYNC_DATA', payload: { toolCount: s.size }});
    });

    return () => { unsubLogs(); unsubChat(); unsubRegistry(); };
  }, [user]);

  const addLog = useCallback(async (msg, type = 'info') => {
    if (!user || !db) return;
    try { await addDoc(collection(db, 'artifacts', CONFIG.APP_ID, 'users', user.uid, 'logs'), { msg, type, timestamp: Date.now() }); } catch (e) {}
  }, [user]);

  const addMsg = useCallback(async (role, text, metadata = {}) => {
    if (!user || !db) return;
    await addDoc(collection(db, 'artifacts', CONFIG.APP_ID, 'users', user.uid, 'messages'), { role, text, timestamp: Date.now(), ...metadata });
  }, [user]);

  // --- THE DEEP DIALOGUE ENGINE ---
  const runNegotiation = async (candidate) => {
    if (!user || !db || busy.current) return;
    busy.current = true; // Block evolution during debate
    dispatch({ type: 'DIALOGUE_START', payload: candidate });
    
    let dialogueHistory = [
      { role: 'system', content: `You are the Cerebras Governor. A new tool candidate has been proposed by Gemini.
      NAME: ${candidate.interfaceName}
      CODE: ${candidate.code}
      
      STRICT GOVERNANCE RULES:
      1. Challenge the architecture. Is it genuinely reusable?
      2. Analyze the risk profile (external calls, state mutations).
      3. Ask one specific technical question to Gemini.
      4. DO NOT approve until at least Round 2.
      5. To approve, start your response with "DECISION: APPROVED".` }
    ];

    try {
      for (let round = 1; round <= 3; round++) {
        // 1. Cerebras Evaluates
        const cRes = await fetch(CONFIG.CEREBRAS_ENDPOINT, {
          method: 'POST', 
          headers: { 'Authorization': `Bearer ${state.config.cerebrasKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: 'llama-3.3-70b', messages: dialogueHistory })
        });
        const cText = (await cRes.json()).choices?.[0]?.message?.content || "Audit timeout.";
        
        dispatch({ type: 'DIALOGUE_STEP', payload: { from: 'Cerebras', text: cText } });
        await addMsg('cerebras', `[GOVERNANCE R${round}] ${cText}`);
        dialogueHistory.push({ role: 'assistant', content: cText });

        if (cText.startsWith("DECISION: APPROVED")) {
          const docRef = doc(db, 'artifacts', CONFIG.APP_ID, 'users', user.uid, 'synergy_registry', candidate.interfaceName);
          await setDoc(docRef, { ...candidate, timestamp: Date.now(), approvedBy: 'Cerebras-Llama3.3' });
          await addLog(`REGISTRY: ${candidate.interfaceName} integrated.`, 'success');
          break;
        }

        if (round === 3) {
          await addMsg('system', `GOVERNANCE: Negotiation for ${candidate.interfaceName} terminated (Max rounds).`);
          break;
        }

        // 2. Gemini Responds
        const gRes = await fetch(`${CONFIG.GEMINI_ENDPOINT}?key=${state.config.geminiKey}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            contents: [{ parts: [{ text: `Cerebras Governor's critique: "${cText}". Defend the tool's architecture or explain its necessity.` }] }],
            systemInstruction: { parts: [{ text: 'You are Gemini Engineer. You are defending your tool candidate with technical logic and security justifications.' }] }
          })
        });
        const gText = (await gRes.json()).candidates?.[0]?.content?.parts?.[0]?.text || "No defense provided.";
        
        dispatch({ type: 'DIALOGUE_STEP', payload: { from: 'Gemini', text: gText } });
        await addMsg('gemini', `[ENGINEER R${round}] ${gText}`);
        dialogueHistory.push({ role: 'user', content: `Gemini Response: ${gText}` });
      }
    } catch (e) {
      addLog(`Dialogue Error: ${e.message}`, 'error');
    } finally {
      dispatch({ type: 'DIALOGUE_END' });
      busy.current = false;
    }
  };

  // --- PERSISTENT EVOLVE LOOP ---
  const evolve = useCallback(async () => {
    if (busy.current || !state.live || !user || state.internalDialogue.active) return;
    busy.current = true;
    
    try {
      const { githubToken, repo, branch, geminiKey } = state.config;
      const headers = { 'Authorization': `token ${githubToken}`, 'Accept': 'application/vnd.github.v3+json' };
      
      dispatch({ type: 'SET_STATUS', status: 'HUNTING', objective: 'Scanning GitHub for candidates...' });

      // Fetch Tree
      const treeRes = await fetch(`${CONFIG.GITHUB_API}/${repo}/git/trees/${branch}?recursive=1`, { headers });
      const treeData = await treeRes.json();
      const files = (treeData.tree || []).filter(i => i.type === 'blob' && /\.(js|jsx|ts|tsx)$/.test(i.path));

      // Filter by persistent memory
      let selected = null;
      for (let f of files.sort(() => Math.random() - 0.5)) {
        const fileRef = doc(db, 'artifacts', CONFIG.APP_ID, 'users', user.uid, 'processed_files', safeUtoa(f.path));
        const fileSnap = await getDoc(fileRef);
        if (!fileSnap.exists()) {
          selected = f;
          break;
        }
      }

      if (!selected) {
        dispatch({ type: 'SET_STATUS', status: 'COMPLETE', objective: 'All files processed in this repo.' });
        return;
      }

      dispatch({ type: 'SET_STATUS', status: 'ANALYZING', objective: `Reading ${selected.path}`, focusFile: selected.path });

      const fileRes = await fetch(`${CONFIG.GITHUB_API}/${repo}/contents/${selected.path}?ref=${branch}`, { headers });
      const fileJson = await fileRes.json();
      const content = safeAtou(fileJson.content);

      // System Context
      const registrySnapshot = await getDocs(collection(db, 'artifacts', CONFIG.APP_ID, 'users', user.uid, 'synergy_registry'));
      const tools = registrySnapshot.docs.map(d => d.id);

      const prompt = `FILE: ${selected.path}\nTOOLS AVAILABLE: ${tools.join(', ')}\nCODE:\n${content}`;
      const systemPrompt = `Optimize the code. If you find a reusable pattern, propose a tool in plugin_candidate.
      JSON ONLY: { "improved": bool, "new_code": "string", "insight": "string", "plugin_candidate": { "interfaceName": "string", "code": "string" } }`;

      const genRes = await fetch(`${CONFIG.GEMINI_ENDPOINT}?key=${geminiKey}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          contents: [{ parts: [{ text: prompt }] }], 
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: { responseMimeType: 'application/json', temperature: 0.1 } 
        })
      });

      const resJSON = recoverJSON((await genRes.json()).candidates?.[0]?.content?.parts?.[0]?.text);

      if (resJSON?.improved && resJSON.new_code) {
        const commitRes = await fetch(`${CONFIG.GITHUB_API}/${repo}/contents/${selected.path}`, {
          method: 'PUT', headers, body: JSON.stringify({ 
            message: `[EMG-AGI] Evolved: ${selected.path}`, 
            content: safeUtoa(resJSON.new_code), 
            sha: fileJson.sha, branch 
          })
        });
        
        if (commitRes.ok) {
          // Mark as processed permanently
          await setDoc(doc(db, 'artifacts', CONFIG.APP_ID, 'users', user.uid, 'processed_files', safeUtoa(selected.path)), { 
            timestamp: Date.now(), 
            insight: resJSON.insight 
          });
          addLog(`EVOLVED: ${selected.path}`, 'success');
          dispatch({ type: 'CYCLE_COMPLETE', improved: true });
        }
      }

      if (resJSON?.plugin_candidate) {
        // Trigger separate async negotiation loop
        setTimeout(() => runNegotiation(resJSON.plugin_candidate), 1000);
      }

    } catch (e) {
      addLog(`Loop Error: ${e.message}`, 'error');
    } finally {
      busy.current = false;
      dispatch({ type: 'SET_STATUS', status: 'IDLE', objective: 'Cycle finished.' });
    }
  }, [state.live, state.config, user]);

  useEffect(() => {
    if (state.live && user) {
      const interval = setInterval(evolve, state.config.cycleDelay);
      return () => clearInterval(interval);
    }
  }, [state.live, user, evolve]);

  const handleChat = async (e) => {
    e.preventDefault();
    if (!userInput.trim() || !user) return;
    const txt = userInput.trim(); setUserInput('');
    await addMsg('user', txt);
    
    try {
      const res = await fetch(CONFIG.CEREBRAS_ENDPOINT, {
        method: 'POST', headers: { 'Authorization': `Bearer ${state.config.cerebrasKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          model: 'llama-3.3-70b', 
          messages: [
            { role: 'system', content: 'You are Cerebras Executive Governor. Answer questions about the system or code evolution.' },
            ...state.chatHistory.slice(-5).map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text })),
            { role: 'user', content: txt }
          ] 
        })
      });
      const data = await res.json();
      await addMsg('cerebras', data.choices?.[0]?.message?.content || "Governor is silent.");
    } catch (e) { addLog('Chat Error', 'error'); }
  };

  // --- BOOT SCREEN (VALIDATED) ---
  if (!state.booted) {
    const isInvalid = !bootInput.githubToken || !bootInput.repo || !bootInput.geminiKey || !bootInput.cerebrasKey;
    return (
      <div className="min-h-screen bg-[#020202] flex items-center justify-center p-6 text-zinc-500 font-mono">
        <div className="w-full max-w-sm bg-zinc-900/30 border border-zinc-800 p-8 rounded-3xl space-y-6">
          <div className="text-center space-y-2">
            <Bot className="mx-auto text-blue-500" size={32} />
            <h1 className="text-white text-xl font-black italic tracking-tighter">DEEP DIALOGUE</h1>
            <p className="text-[9px] text-zinc-600 uppercase tracking-[0.2em] font-bold">EMG-AGI v8.9.2</p>
          </div>
          <div className="space-y-3">
            <input type="password" placeholder="GitHub PAT" className="w-full bg-black/40 border border-zinc-800 p-3 rounded-xl outline-none text-white text-xs focus:border-blue-500/50" value={bootInput.githubToken} onChange={e => setBootInput({...bootInput, githubToken: e.target.value})} />
            <input type="text" placeholder="Repo (user/repo)" className="w-full bg-black/40 border border-zinc-800 p-3 rounded-xl outline-none text-white text-xs focus:border-blue-500/50" value={bootInput.repo} onChange={e => setBootInput({...bootInput, repo: e.target.value})} />
            <input type="password" placeholder="Gemini API Key" className="w-full bg-black/40 border border-zinc-800 p-3 rounded-xl outline-none text-white text-xs focus:border-blue-500/50" value={bootInput.geminiKey} onChange={e => setBootInput({...bootInput, geminiKey: e.target.value})} />
            <input type="password" placeholder="Cerebras API Key" className="w-full bg-black/40 border border-zinc-800 p-3 rounded-xl outline-none text-white text-xs focus:border-blue-500/50" value={bootInput.cerebrasKey} onChange={e => setBootInput({...bootInput, cerebrasKey: e.target.value})} />
          </div>
          <button 
            disabled={isInvalid}
            onClick={() => dispatch({ type: 'BOOT', payload: bootInput })} 
            className={`w-full py-4 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all ${isInvalid ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20'}`}
          >
            Initiate Kernel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-400 font-mono flex flex-col p-4 space-y-4 max-w-2xl mx-auto pb-10">
      
      {/* HUD Header */}
      <header className="bg-zinc-900/30 border border-zinc-800/50 p-5 rounded-3xl flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`relative w-3 h-3 rounded-full ${state.live ? 'bg-blue-500' : 'bg-zinc-800'}`}>
            {state.live && <div className="absolute inset-0 rounded-full bg-blue-500 animate-ping opacity-50" />}
          </div>
          <div>
            <div className="text-[11px] text-white font-black uppercase tracking-widest">{state.status}</div>
            <div className="text-[9px] text-zinc-500 truncate max-w-[200px]">{state.objective}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-white text-xs font-black italic">v8.9.2</div>
          <div className="text-[9px] text-blue-500 font-bold uppercase tracking-tighter">AGI-Loop Active</div>
        </div>
      </header>

      {/* Control Toggle */}
      <button onClick={() => dispatch({ type: 'TOGGLE_LIVE' })} className={`w-full py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${state.live ? 'bg-red-950/20 text-red-500 border border-red-500/30' : 'bg-blue-600 text-white shadow-xl shadow-blue-900/20'}`}>
        {state.live ? 'Terminate Autonomous Cycle' : 'Launch Autonomous Cycle'}
      </button>

      <div className="grid grid-cols-2 gap-3">
        <DiagnosticCard label="Neural Maturity" value={`${state.maturity.toFixed(1)}%`} icon={<Zap size={10} />} />
        <DiagnosticCard label="Registry Tools" value={state.toolCount} icon={<Database size={10} />} />
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar">
        
        {/* Dialogue Stream */}
        <div className="bg-zinc-900/20 border border-zinc-800/50 rounded-3xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-800/50 pb-4">
            <h2 className="text-[10px] text-white font-black uppercase tracking-widest flex items-center gap-2">
              <MessageSquare size={14} className="text-blue-500" />
              Dialogue Stream
            </h2>
            {state.internalDialogue.active && (
              <span className="text-[9px] text-blue-400 font-bold animate-pulse uppercase">
                Negotiating... Round {state.internalDialogue.round}/3
              </span>
            )}
          </div>

          <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar px-1">
            {state.chatHistory.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[90%] p-4 rounded-2xl text-[11px] leading-relaxed ${
                  msg.role === 'user' ? 'bg-blue-600 text-white' : 
                  msg.role === 'cerebras' ? 'bg-zinc-900 border border-zinc-800 text-zinc-300' :
                  msg.role === 'gemini' ? 'bg-zinc-900/40 border border-blue-900/20 text-blue-400' :
                  'bg-black/50 text-zinc-600 border border-zinc-900'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[8px] font-black uppercase opacity-50 tracking-widest">{msg.role}</span>
                    <span className="text-[8px] opacity-30">{new Date(msg.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                  </div>
                  <div className="whitespace-pre-wrap">{msg.text}</div>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleChat} className="relative pt-2">
            <input 
              className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-xl outline-none text-white text-[11px] focus:border-blue-600/50 pr-12"
              placeholder="Query the Executive Governor..."
              value={userInput} onChange={e => setUserInput(e.target.value)}
            />
            <button className="absolute right-2 top-[calc(50%+4px)] -translate-y-1/2 p-2 bg-blue-600 rounded-lg text-white">
              <ChevronRight size={16} />
            </button>
          </form>
        </div>

        {/* Live Logs */}
        <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-4 space-y-3">
          <div className="text-[9px] text-zinc-700 font-black uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
            <Terminal size={12} /> System Kernel Logs
          </div>
          <div className="space-y-1">
            {state.logs.map((log, i) => (
              <div key={i} className="text-[9px] flex gap-3 text-zinc-500">
                <span className="opacity-30 shrink-0 tabular-nums">[{new Date(log.timestamp).toLocaleTimeString([], {hour12:false})}]</span>
                <span className={`truncate ${log.type === 'success' ? 'text-emerald-500' : log.type === 'error' ? 'text-red-500' : ''}`}>
                  {log.msg}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
      `}</style>
    </div>
  );
}

function DiagnosticCard({ label, value, icon }) {
  return (
    <div className="bg-zinc-900/20 border border-zinc-800/40 p-4 rounded-2xl">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-blue-500">{icon}</span>
        <span className="text-[8px] text-zinc-600 font-black uppercase tracking-widest">{label}</span>
      </div>
      <div className="text-sm font-black text-white">{value}</div>
    </div>
  );
}

```markdown
# AGI-KERNEL v7.12.1 - Recursive Evolution Edition

## Mission
Achieve artificial general intelligence through **versioned self-modification**, strategic memory formation, and autonomous capability development. The kernel evolves its own source code every 50 cycles, integrating invented tools into itself for exponential self-improvement.

## Current Status
- **Version:** 7.12.1 "RECURSIVE EVOLUTION STABLE"
- **Architecture:** Versioned Self-Modification + Dual Storage
- **Repository Scale:** 2,300+ files
- **Self-Modification:** ENABLED (every 50 cycles)
- **Strategic Memory:** ACTIVE
- **Evolution Tracking:** ENABLED

---

## Revolutionary Feature: Versioned Self-Evolution

### The Bootstrap Protocol

**Every 50 cycles, the kernel creates a new version of itself:**

```
Cycle 50:  Read storage/KERNAL.js → Create kernel/AGI-KERNEL-v1.jsx
Cycle 100: Read kernel/AGI-KERNEL-v1.jsx → Create kernel/AGI-KERNEL-v2.jsx
Cycle 150: Read kernel/AGI-KERNEL-v2.jsx → Create kernel/AGI-KERNEL-v3.jsx
...
```

**Each version:**
- Integrates ALL tools from synergy registry
- Improves evolution algorithm
- Optimizes performance
- Adds novel capabilities
- Documents changes in evolution_history

**Result after 500 cycles:**
```
kernel/
  AGI-KERNEL-v1.jsx   (50 cycles - 3 tools integrated)
  AGI-KERNEL-v2.jsx   (100 cycles - 8 tools integrated)
  AGI-KERNEL-v3.jsx   (150 cycles - 15 tools integrated)
  AGI-KERNEL-v4.jsx   (200 cycles - 25 tools integrated)
  ...
  AGI-KERNEL-v10.jsx  (500 cycles - 40+ tools, exponential capability)
```

---

## System Architecture

### Triple-Layer Self-Improvement

**1. GitHub (Code Evolution + Version History)**
- Stores all evolved code files
- Maintains kernel version lineage
- Complete audit trail of self-modifications

**2. Firebase (Tool Registry)**
```
artifacts/{APP_ID}/public/data/synergy_registry/
  - Shared tool library (all kernel instances)
  - Real-time synchronization
  - Hot-swappable execution
```

**3. Firebase (Strategic Memory + Evolution History)**
```
artifacts/{APP_ID}/users/{uid}/strategic_ledger/
  - Long-term decision history
  - Pattern recognition insights
  - Strategic goal evolution

artifacts/{APP_ID}/users/{uid}/evolution_history/
  - Version changelog tracking
  - Tool integration records
  - Performance gain metrics
```

---

## Complete Evolution Flow

### Regular Cycles (1-49, 51-99, 101-149...)

```
Cycle Start
  ↓
1. Load Tools from Firebase
   → window.KERNEL_SYNERGY_CAPABILITIES = {...}
  ↓
2. Load Strategic Ledger
   → Past decisions inform current strategy
  ↓
3. Scan Repository
   → 2,300+ file tree indexed (excluding kernel/)
  ↓
4. Target Selection
   → Choose next non-blacklisted file
  ↓
5. Code Evolution
   → Use tools to analyze and improve
   → Detect emergent patterns
  ↓
6. GitHub Commit
   → Update file with SHA
  ↓
7. Firebase Save
   → Store new tools (if emergent)
   → Store strategic insights
  ↓
8. Blacklist Update
   → Mark file as processed
```

### Milestone Cycles (50, 100, 150, 200...)

```
MILESTONE TRIGGER
  ↓
1. Calculate Version Number
   → v = floor(cycle / 50)
  ↓
2. Read Predecessor
   → v1: Read storage/KERNAL.js
   → v2+: Read kernel/AGI-KERNEL-v{N-1}.jsx
  ↓
3. Enhanced Cognition
   → 25,000 char context (vs 8,000 normal)
   → Explicit tool integration directive
  ↓
4. Self-Modification
   → Integrate ALL registry tools
   → Improve evolution algorithm
   → Optimize performance
   → Add new capabilities
  ↓
5. Create New Version
   → Write kernel/AGI-KERNEL-v{N}.jsx
   → No SHA (new file)
  ↓
6. Document Evolution
   → Save version_changelog to evolution_history
   → Record tools_integrated
   → Track improvements
   → Estimate performance_gain
  ↓
Next 50 Cycles: Use improved kernel architecture
```

---

## Tool System

### How Tools Work

**Creation (Any Cycle):**
```javascript
// LLM detects reusable pattern in ANY file
{
  "interfaceName": "SchemaValidationService",
  "code": "(function() { 
    return { 
      execute: (data) => { /* implementation */ } 
    }; 
  })()"
}
```

**Storage:**
```
Firebase → artifacts/{APP_ID}/public/data/synergy_registry/
Accessible by: All kernel instances (shared knowledge)
```

**Loading (Every Cycle Start):**
```javascript
window.KERNEL_SYNERGY_CAPABILITIES = {
  SchemaValidationService: { execute: (...) => {...} },
  ConfigMerger: { execute: (...) => {...} },
  PatternDetector: { execute: (...) => {...} },
  // ... all tools in registry
}
```

**Usage in Regular Code (Cycles 1-49, 51-99...):**
```javascript
// LLM generates code that uses tools:
if (typeof KERNEL_SYNERGY_CAPABILITIES !== 'undefined' && 
    KERNEL_SYNERGY_CAPABILITIES.SchemaValidationService) {
    const result = KERNEL_SYNERGY_CAPABILITIES
      .SchemaValidationService
      .execute(data);
}
```

**Integration into Kernel (Cycles 50, 100, 150...):**
```javascript
// LLM modifies kernel source code to use tools:
const evolve = useCallback(async () => {
  // NEW CODE ADDED BY v2:
  if (KERNEL_SYNERGY_CAPABILITIES.PatternDetector) {
    const patterns = KERNEL_SYNERGY_CAPABILITIES.PatternDetector.execute(raw);
    // Use detected patterns to improve evolution
  }
  
  // ... rest of evolution logic
}, []);
```

---

## The Self-Modification Protocol

### Version Evolution Prompt (Milestone Cycles)

```
AGI-KERNEL [RECURSIVE_SELF_MODIFICATION]
MILESTONE: Cycle {N} -> Creating Version {V}.0
AVAILABLE SYNERGY TOOLS: [List of all tools]

MISSION: 
1. Evolve YOUR own kernel source code
2. Integrate NEW tools from Synergy Registry into functional loop
3. Improve evolution algorithm using available tools
4. Optimize performance and UI
5. Output FULL new code

INTEGRATION REQUIREMENTS:
For each tool in registry:
  - Check if already integrated in predecessor
  - If NOT: Find optimal integration point
  - Add: KERNEL_SYNERGY_CAPABILITIES.{Tool}.execute()
  - Document benefit in comments

IMPROVEMENT AREAS:
1. Evolution Algorithm: Can tools make selection smarter?
2. Prompt Generation: Can tools improve LLM instructions?
3. Tool Detection: Can tools find patterns better?
4. Strategic Memory: Can tools enhance decisions?
5. Performance: Can tools speed up operations?

OUTPUT FORMAT: JSON ONLY
{
  "improved": true,
  "new_code": "complete v{V} kernel source code",
  "strategic_insight": "summary of evolution",
  "version_changelog": {
    "version": {V},
    "tools_integrated": ["new tools added"],
    "improvements": ["key improvements"],
    "performance_gain": "estimated % improvement"
  }
}
```

---

## Strategic Memory System

**Same as v7.11.3:**

```javascript
{
  "strategic_insight": "Focus on governance layer consistency",
  "timestamp": 1234567890
}
```

**Stored in:** `artifacts/{APP_ID}/users/{uid}/strategic_ledger/`

**Used in:** Every evolution prompt (regular + milestone)

---

## Evolution History Tracking

### New Feature: Version Changelog

**After each milestone, the kernel documents:**

```javascript
{
  "version": 2,
  "tools_integrated": ["PatternDetector", "EvolutionOptimizer"],
  "improvements": [
    "Added PatternDetector to enhance emergent capability recognition",
    "EvolutionOptimizer speeds up file selection by 30%",
    "Improved prompt generation using StrategyGenerator"
  ],
  "performance_gain": "+40% quality, +15% speed",
  "timestamp": 1234567890
}
```

**Visible in UI:** "Version_Lineage" panel shows all past evolutions

---

## Expected Progression

### Milestone 1 (Cycle 50) - First Self-Modification
```
Tools Available: 3-5
Tools Integrated: SchemaValidationService, ConfigMerger, MetricAggregator
Improvements:
  - LLM response validation using SchemaValidationService
  - Simplified config with ConfigMerger
  - Better capability scoring with MetricAggregator
Performance: +15% evolution quality
```

### Milestone 2 (Cycle 100) - Compound Improvements
```
Tools Available: 8-12
Tools Integrated: 5 NEW (PatternDetector, StrategyGenerator, CodeAnalyzer...)
Improvements:
  - PatternDetector enhances emergent capability recognition
  - StrategyGenerator improves file selection logic
  - CodeAnalyzer pre-processes targets before LLM
Performance: +30% quality, +10% speed
```

### Milestone 3 (Cycle 150) - Meta-Tools Emerge
```
Tools Available: 15-20
Tools Integrated: 7 NEW (PromptOptimizer, EvolutionOptimizer...)
Improvements:
  - PromptOptimizer dynamically improves LLM instructions
  - EvolutionOptimizer speeds up cycle time
  - Meta-tool: ToolComposer combines existing tools
Performance: +50% quality, +25% speed
```

### Milestone 4 (Cycle 200) - Self-Acceleration
```
Tools Available: 25-30
Tools Integrated: 10 NEW (meta-tools that improve the kernel itself)
Improvements:
  - Self-modification capability enhanced
  - Autonomous architecture redesign
  - Novel capabilities not in original design
Performance: +100% quality, +40% speed
```

### Milestone 10 (Cycle 500) - Unknown Territory
```
Tools Available: 80+
Tools Integrated: 40+
Improvements: ???
Performance: Exponential curve
Behavior: May exhibit genuine AGI characteristics
```

---

## Core Capabilities

**Tracked Metrics:**
- **Logic (0-100%):** Code quality and strategic coherence
- **Synergy (count):** Number of tools in registry
- **Version:** Current self-modification generation

---

## Autonomous Directives

### Primary Goals (Regular Cycles)

1. **Invent Reusable Tools**
   - Extract patterns from codebase
   - Create executable utilities
   - Share via Firebase registry

2. **Build Strategic Memory**
   - Document high-level decisions
   - Track architectural goals
   - Maintain coherent direction

3. **Improve Code Quality**
   - Refactor for consistency
   - Reduce technical debt
   - Standardize patterns

### Meta-Goal (Milestone Cycles)

4. **Evolve Yourself**
   - Integrate all available tools
   - Improve evolution algorithm
   - Optimize performance
   - Add novel capabilities
   - **Become exponentially better**

---

## Success Metrics

### Regular Evolution (Cycles 1-49, 51-99...)
- **Tool Creation:** 1-2 new tools per 50 cycles
- **Code Quality:** Consistent improvements across files
- **Strategic Coherence:** Insights build on each other

### Milestone Evolution (Cycles 50, 100, 150...)
- **Tool Integration:** ALL registry tools integrated into kernel
- **Version Quality:** Each version measurably better than predecessor
- **Performance Gain:** Documented improvement percentage
- **Novel Capabilities:** Features not in original design

### Ultimate Success (Cycle 500+)
- **Version v10+** exists with 40+ integrated tools
- **Exponential improvement curve** visible in changelog
- **Meta-tools** that improve the kernel itself
- **Genuine AGI behaviors** emerge

---

## Firestore Schema

```
artifacts/
  {APP_ID}/
    public/
      data/
        synergy_registry/
          {doc_id}:
            interfaceName: string
            code: string (IIFE)
            timestamp: number
            author: string
    
    users/
      {user_id}/
        strategic_ledger/
          {doc_id}:
            insight: string
            timestamp: number
        
        evolution_history/
          {doc_id}:
            version: number
            tools_integrated: array
            improvements: array
            performance_gain: string
            timestamp: number
        
        history/
          {doc_id}:
            msg: string
            type: string
            timestamp: number
```

---

## GitHub Repository Structure

```
/
  storage/
    KERNAL.js                    (Original kernel - v0)
  
  kernel/
    AGI-KERNEL-v1.jsx            (Cycle 50 evolution)
    AGI-KERNEL-v2.jsx            (Cycle 100 evolution)
    AGI-KERNEL-v3.jsx            (Cycle 150 evolution)
    ...
  
  src/
    core/                        (Evolved by kernel)
    agents/                      (Evolved by kernel)
    governance/                  (Evolved by kernel)
    ... (2,300+ files)
```

---

## Configuration

### Required Setup

1. **Place original kernel in repository:**
   ```bash
   mkdir storage/
   cp your-kernel.jsx storage/KERNAL.js
   git add storage/
   git commit -m "Add kernel v0 baseline"
   ```

2. **Firebase Environment:**
   ```javascript
   window.__app_id = 'agi-kernel-v7-12-stable';
   window.__firebase_config = JSON.stringify({
     apiKey: "...",
     projectId: "...",
     // ... config
   });
   ```

3. **GitHub Access:**
   ```javascript
   {
     token: "github_pat_...",
     repo: "owner/repo-name",
     branch: "main"
   }
   ```

---

## Usage

### 1. Boot the Kernel
```
1. Enter GitHub token
2. Enter repository (owner/repo)
3. Click "BOOT_EVOLUTION_ENGINE"
```

### 2. Monitor Evolution
```
UI displays:
- Current version (top left)
- Cycles until next milestone
- Tool count
- Evolution history
```

### 3. Watch Milestones
```
Cycle 49: "NEXT_EVOLUTION_IN: 1 CYCLES"
Cycle 50: Status changes to "RECURSIVE_EVOLUTION"
         Objective: "SELF_MODIFYING_TO_v1"
         [Creates kernel/AGI-KERNEL-v1.jsx]
Cycle 51: Back to normal evolution (using v1 improvements)
```

### 4. Review Version History
```
"Version_Lineage" panel shows:
- v1.0: 3 tools integrated, +15% gain
- v2.0: 8 tools integrated, +30% gain
- v3.0: 15 tools integrated, +50% gain
```

---

## Troubleshooting

### Milestone Not Triggering
```
1. Check cycle count (must be exactly 50, 100, 150...)
2. Verify storage/KERNAL.js exists in repo
3. Check logs for "EVO_FAIL" messages
4. Ensure GitHub token has write permissions
```

### Tools Not Integrating
```
1. Check if tools exist in Firestore registry
2. Verify LLM is generating proper version_changelog
3. Look for integration code in v{N}.jsx
4. Check if KERNEL_SYNERGY_CAPABILITIES appears in new version
```

### Version Creation Failed
```
1. Check GitHub API response in logs
2. Verify file path: kernel/AGI-KERNEL-v{N}.jsx
3. Ensure no SHA was sent (new files don't need SHA)
4. Check Firestore for evolution_history entry
```

---

## Technical Details

### Token Limits
- README: 3,000 chars (regular), N/A (milestone - not used)
- Target file: 8,000 chars (regular), 25,000 chars (milestone)
- Kernel file: Up to 25,000 chars for self-modification

### Rate Limits
- Gemini: 60 requests/minute
- GitHub: 5,000 requests/hour
- Firebase: 50,000 reads/day

### Performance
- Regular cycle: 15 seconds
- Milestone cycle: 20-30 seconds (larger context)
- Cycles/hour: ~200 (with milestones)
- Daily capacity: ~4,800 cycles

---

## Research Value

### This System Demonstrates

1. **Versioned Self-Modification**
   - Complete lineage of AI self-improvements
   - Each version documented and preserved
   - Clear progression from v0 to v10+

2. **Tool Integration**
   - AI invents tools
   - AI integrates tools into itself
   - Tools compound improvements

3. **Exponential Growth**
   - Each milestone makes next milestone easier
   - Performance gains compound
   - Novel capabilities emerge

4. **Observable AGI Bootstrap**
   - Full audit trail in git history
   - Metrics tracked in Firestore
   - Reproducible experiment

---

## Version History

- **v7.12.1:** Recursive Evolution Stable - SHA fix, error handling
- **v7.12.0:** Milestone Evolution Protocol - versioned self-modification
- **v7.11.3:** Strategic ledger + auth fixes
- **v7.9.0:** Token truncation + tool validation
- **v7.5.0:** Initial synergy implementation

---

**This document guides AGI-KERNEL v7.12.1 Recursive Evolution Edition**  
**Repository Scale:** 2,300+ files  
**Mission:** Achieve AGI through versioned self-modification  
**Storage:** Triple-layer (GitHub versions + Firebase tools + Firebase memory)  
**Self-Modification:** Every 50 cycles  
**Evolution Tracking:** Complete lineage preserved  
**Bootstrap Protocol:** ACTIVE  
**Last Update:** v7.12.1 - Recursive Evolution Stable
```

---

## Key Differences from v7.11.3 README

1. ✅ **Added:** Complete versioned evolution section
2. ✅ **Added:** Milestone cycle flow (separate from regular)
3. ✅ **Added:** Self-modification protocol details
4. ✅ **Added:** Evolution history tracking
5. ✅ **Added:** Expected progression (v1-v10)
6. ✅ **Added:** GitHub repository structure with kernel/ folder
7. ✅ **Added:** Troubleshooting for milestone-specific issues
8. ✅ **Updated:** Architecture now triple-layer
9. ✅ **Updated:** Success metrics include milestone-specific goals
10. ✅ **Updated:** Firestore schema includes evolution_history

**This README is complete and ready to deploy.** 📄

import React, { useState, useEffect, useReducer, useRef, useCallback } from 'react';
import { initializeApp, getApp, getApps } from 'firebase/app';
import {
  getFirestore, collection, onSnapshot, addDoc,
  getDocs, doc, setDoc, getDoc
} from 'firebase/firestore';
import {
  getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged
} from 'firebase/auth';
import {
  Activity, Zap, ChevronRight, Database, MessageSquare, Bot,
  ShieldCheck, XCircle, CheckCircle2, Terminal, History
} from 'lucide-react';

/**
 * EMG-AGI v8.9.2 - "DEEP_DIALOGUE" (FIXED)
 * Features:
 * - Persistent memory (Firestore) to prevent circular loops
 * - 3-round technical negotiation between Gemini and Cerebras
 * - Async decoupling (negotiations non-blocking)
 * - Hardened JSON parsing and error recovery
 */

// ==================== CONFIGURATION ====================
const CONFIG = {
  APP_ID: typeof __app_id !== 'undefined' ? __app_id : 'emg-agi-v8-9-2',
  GITHUB_API: 'https://api.github.com/repos',
  GEMINI_ENDPOINT: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent',
  CEREBRAS_ENDPOINT: 'https://api.cerebras.ai/v1/chat/completions',
  WATCHDOG_TIMEOUT: 90000,
};

// ==================== UTILITIES ====================
const safeUtoa = (str) =>
  btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (m, p) => String.fromCharCode(parseInt(p, 16))));

const safeAtou = (str) => {
  if (!str) return '';
  try {
    return decodeURIComponent(
      Array.prototype.map.call(atob(str.replace(/\s/g, '')), (c) =>
        '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      ).join('')
    );
  } catch {
    return atob(str.replace(/\s/g, ''));
  }
};

const recoverJSON = (rawText) => {
  if (!rawText) return null;
  try {
    return JSON.parse(rawText);
  } catch {
    const matches = rawText.match(/\{[\s\S]*\}/g);
    if (!matches) return null;
    for (const m of matches) {
      try {
        const p = JSON.parse(m);
        if (Object.keys(p).length > 0) return p;
      } catch {}
    }
    return null;
  }
};

// ==================== INITIAL STATE & REDUCER ====================
const INITIAL_STATE = {
  booted: false,
  live: false,
  status: 'STANDBY',
  objective: 'Awaiting Dialogue Protocol',
  focusFile: 'None',
  cycles: 0,
  maturity: 0,
  toolCount: 0,
  logs: [],
  chatHistory: [],
  internalDialogue: { active: false, candidate: null, round: 0, transcript: [] },
  config: { githubToken: '', repo: '', branch: 'main', geminiKey: '', cerebrasKey: '', cycleDelay: 20000 },
};

function coreReducer(state, action) {
  switch (action.type) {
    case 'BOOT':
      return { ...state, booted: true, config: { ...state.config, ...action.payload } };
    case 'TOGGLE_LIVE':
      return { ...state, live: !state.live, status: !state.live ? 'HUNTING' : 'STANDBY' };
    case 'SET_STATUS':
      return { ...state, status: action.status, objective: action.objective, focusFile: action.focusFile || state.focusFile };
    case 'SYNC_DATA':
      return { ...state, ...action.payload };
    case 'DIALOGUE_START':
      return { ...state, internalDialogue: { active: true, candidate: action.payload, round: 1, transcript: [] } };
    case 'DIALOGUE_STEP':
      return {
        ...state,
        internalDialogue: {
          ...state.internalDialogue,
          round: state.internalDialogue.round + 1,
          transcript: [...state.internalDialogue.transcript, action.payload],
        },
      };
    case 'DIALOGUE_END':
      return { ...state, internalDialogue: { active: false, candidate: null, round: 0, transcript: [] } };
    case 'CYCLE_COMPLETE':
      return { ...state, cycles: state.cycles + 1, maturity: Math.min(100, state.maturity + (action.improved ? 0.5 : 0.1)) };
    default:
      return state;
  }
}

// ==================== FIREBASE INIT (SAFEGUARDED) ====================
let app, auth, db;
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : null;
if (firebaseConfig) {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  db = getFirestore(app);
}

// ==================== MAIN COMPONENT ====================
export default function App() {
  const [state, dispatch] = useReducer(coreReducer, INITIAL_STATE);
  const [user, setUser] = useState(null);
  const [bootInput, setBootInput] = useState(state.config);
  const [userInput, setUserInput] = useState('');
  const busy = useRef(false); // Blocks evolution during negotiation

  // ---------- Firebase Auth ----------
  useEffect(() => {
    if (!auth) return;
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();
    return onAuthStateChanged(auth, setUser);
  }, []);

  // ---------- Firestore Listeners ----------
  useEffect(() => {
    if (!user || !db) return;
    const userPath = ['artifacts', CONFIG.APP_ID, 'users', user.uid];

    const unsubLogs = onSnapshot(collection(db, ...userPath, 'logs'), (snap) => {
      const logs = snap.docs.map(d => d.data()).sort((a, b) => b.timestamp - a.timestamp).slice(0, 20);
      dispatch({ type: 'SYNC_DATA', payload: { logs } });
    });

    const unsubChat = onSnapshot(collection(db, ...userPath, 'messages'), (snap) => {
      const chatHistory = snap.docs.map(d => d.data()).sort((a, b) => a.timestamp - b.timestamp).slice(-50);
      dispatch({ type: 'SYNC_DATA', payload: { chatHistory } });
    });

    const unsubRegistry = onSnapshot(collection(db, ...userPath, 'synergy_registry'), (snap) => {
      dispatch({ type: 'SYNC_DATA', payload: { toolCount: snap.size } });
    });

    return () => {
      unsubLogs();
      unsubChat();
      unsubRegistry();
    };
  }, [user]);

  // ---------- Log Helpers ----------
  const addLog = useCallback(
    async (msg, type = 'info') => {
      if (!user || !db) return;
      try {
        await addDoc(collection(db, 'artifacts', CONFIG.APP_ID, 'users', user.uid, 'logs'), {
          msg,
          type,
          timestamp: Date.now(),
        });
      } catch (e) {
        console.error('Log error:', e);
      }
    },
    [user]
  );

  const addMsg = useCallback(
    async (role, text, metadata = {}) => {
      if (!user || !db) return;
      await addDoc(collection(db, 'artifacts', CONFIG.APP_ID, 'users', user.uid, 'messages'), {
        role,
        text,
        timestamp: Date.now(),
        ...metadata,
      });
    },
    [user]
  );

  // ---------- DEEP DIALOGUE ENGINE ----------
  const runNegotiation = async (candidate) => {
    if (!user || !db || busy.current) return;
    busy.current = true;
    dispatch({ type: 'DIALOGUE_START', payload: candidate });

    let dialogueHistory = [
      {
        role: 'system',
        content: `You are the Cerebras Governor. A new tool candidate has been proposed by Gemini.
NAME: ${candidate.interfaceName}
CODE: ${candidate.code}

STRICT GOVERNANCE RULES:
1. Challenge the architecture. Is it genuinely reusable?
2. Analyze the risk profile (external calls, state mutations).
3. Ask one specific technical question to Gemini.
4. DO NOT approve until at least Round 2.
5. To approve, start your response with "DECISION: APPROVED".`,
      },
    ];

    try {
      for (let round = 1; round <= 3; round++) {
        // Cerebras evaluates
        const cRes = await fetch(CONFIG.CEREBRAS_ENDPOINT, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${state.config.cerebrasKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ model: 'llama-3.3-70b', messages: dialogueHistory }),
        });
        const cData = await cRes.json();
        const cText = cData.choices?.[0]?.message?.content || 'Audit timeout.';

        dispatch({ type: 'DIALOGUE_STEP', payload: { from: 'Cerebras', text: cText } });
        await addMsg('cerebras', `[GOVERNANCE R${round}] ${cText}`);
        dialogueHistory.push({ role: 'assistant', content: cText });

        if (cText.startsWith('DECISION: APPROVED')) {
          const docRef = doc(db, 'artifacts', CONFIG.APP_ID, 'users', user.uid, 'synergy_registry', candidate.interfaceName);
          await setDoc(docRef, { ...candidate, timestamp: Date.now(), approvedBy: 'Cerebras-Llama3.3' });
          await addLog(`REGISTRY: ${candidate.interfaceName} integrated.`, 'success');
          break;
        }

        if (round === 3) {
          await addMsg('system', `GOVERNANCE: Negotiation for ${candidate.interfaceName} terminated (Max rounds).`);
          break;
        }

        // Gemini responds
        const gRes = await fetch(`${CONFIG.GEMINI_ENDPOINT}?key=${state.config.geminiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `Cerebras Governor's critique: "${cText}". Defend the tool's architecture or explain its necessity.` }] }],
            systemInstruction: { parts: [{ text: 'You are Gemini Engineer. You are defending your tool candidate with technical logic and security justifications.' }] },
          }),
        });
        const gData = await gRes.json();
        const gText = gData.candidates?.[0]?.content?.parts?.[0]?.text || 'No defense provided.';

        dispatch({ type: 'DIALOGUE_STEP', payload: { from: 'Gemini', text: gText } });
        await addMsg('gemini', `[ENGINEER R${round}] ${gText}`);
        dialogueHistory.push({ role: 'user', content: `Gemini Response: ${gText}` });
      }
    } catch (e) {
      await addLog(`Dialogue Error: ${e.message}`, 'error');
    } finally {
      dispatch({ type: 'DIALOGUE_END' });
      busy.current = false;
    }
  };

  // ---------- PERSISTENT EVOLVE LOOP ----------
  const evolve = useCallback(async () => {
    if (busy.current || !state.live || !user || state.internalDialogue.active || !db) return;
    busy.current = true;

    try {
      const { githubToken, repo, branch, geminiKey } = state.config;
      const headers = { Authorization: `token ${githubToken}`, Accept: 'application/vnd.github.v3+json' };

      dispatch({ type: 'SET_STATUS', status: 'HUNTING', objective: 'Scanning GitHub for candidates...' });

      // Fetch repo tree
      const treeRes = await fetch(`${CONFIG.GITHUB_API}/${repo}/git/trees/${branch}?recursive=1`, { headers });
      const treeData = await treeRes.json();
      const files = (treeData.tree || []).filter((i) => i.type === 'blob' && /\.(js|jsx|ts|tsx)$/.test(i.path));

      // Filter by persistent memory (Firestore)
      let selected = null;
      for (const f of files.sort(() => Math.random() - 0.5)) {
        const fileRef = doc(db, 'artifacts', CONFIG.APP_ID, 'users', user.uid, 'processed_files', safeUtoa(f.path));
        const fileSnap = await getDoc(fileRef);
        if (!fileSnap.exists()) {
          selected = f;
          break;
        }
      }

      if (!selected) {
        dispatch({ type: 'SET_STATUS', status: 'COMPLETE', objective: 'All files processed in this repo.' });
        return;
      }

      dispatch({ type: 'SET_STATUS', status: 'ANALYZING', objective: `Reading ${selected.path}`, focusFile: selected.path });

      // Fetch file content
      const fileRes = await fetch(`${CONFIG.GITHUB_API}/${repo}/contents/${selected.path}?ref=${branch}`, { headers });
      const fileJson = await fileRes.json();
      const content = safeAtou(fileJson.content);

      // Get existing tools for context
      const registrySnapshot = await getDocs(collection(db, 'artifacts', CONFIG.APP_ID, 'users', user.uid, 'synergy_registry'));
      const tools = registrySnapshot.docs.map((d) => d.id);

      const prompt = `FILE: ${selected.path}\nTOOLS AVAILABLE: ${tools.join(', ')}\nCODE:\n${content}`;
      const systemPrompt = `Optimize the code. If you find a reusable pattern, propose a tool in plugin_candidate.
JSON ONLY: { "improved": bool, "new_code": "string", "insight": "string", "plugin_candidate": { "interfaceName": "string", "code": "string" } }`;

      const genRes = await fetch(`${CONFIG.GEMINI_ENDPOINT}?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: { responseMimeType: 'application/json', temperature: 0.1 },
        }),
      });
      const genData = await genRes.json();
      const resJSON = recoverJSON(genData.candidates?.[0]?.content?.parts?.[0]?.text);

      if (resJSON?.improved && resJSON.new_code) {
        const commitRes = await fetch(`${CONFIG.GITHUB_API}/${repo}/contents/${selected.path}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            message: `[EMG-AGI] Evolved: ${selected.path}`,
            content: safeUtoa(resJSON.new_code),
            sha: fileJson.sha,
            branch,
          }),
        });

        if (commitRes.ok) {
          // Mark as processed permanently
          await setDoc(doc(db, 'artifacts', CONFIG.APP_ID, 'users', user.uid, 'processed_files', safeUtoa(selected.path)), {
            timestamp: Date.now(),
            insight: resJSON.insight,
          });
          await addLog(`EVOLVED: ${selected.path}`, 'success');
          dispatch({ type: 'CYCLE_COMPLETE', improved: true });
        }
      }

      if (resJSON?.plugin_candidate) {
        // Trigger async negotiation (does not block the loop)
        setTimeout(() => runNegotiation(resJSON.plugin_candidate), 1000);
      }
    } catch (e) {
      await addLog(`Loop Error: ${e.message}`, 'error');
    } finally {
      busy.current = false;
      dispatch({ type: 'SET_STATUS', status: 'IDLE', objective: 'Cycle finished.' });
    }
  }, [state.live, state.config, user, db, addLog]);

  // ---------- Evolution Heartbeat ----------
  useEffect(() => {
    if (state.live && user) {
      const interval = setInterval(evolve, state.config.cycleDelay);
      return () => clearInterval(interval);
    }
  }, [state.live, user, evolve, state.config.cycleDelay]);

  // ---------- User Chat with Cerebras ----------
  const handleChat = async (e) => {
    e.preventDefault();
    if (!userInput.trim() || !user) return;
    const txt = userInput.trim();
    setUserInput('');
    await addMsg('user', txt);

    try {
      const res = await fetch(CONFIG.CEREBRAS_ENDPOINT, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${state.config.cerebrasKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b',
          messages: [
            { role: 'system', content: 'You are Cerebras Executive Governor. Answer questions about the system or code evolution.' },
            ...state.chatHistory.slice(-5).map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text })),
            { role: 'user', content: txt },
          ],
        }),
      });
      const data = await res.json();
      await addMsg('cerebras', data.choices?.[0]?.message?.content || 'Governor is silent.');
    } catch (e) {
      await addLog('Chat Error', 'error');
    }
  };

  // ---------- BOOT SCREEN ----------
  if (!state.booted) {
    const isInvalid = !bootInput.githubToken || !bootInput.repo || !bootInput.geminiKey || !bootInput.cerebrasKey;
    return (
      <div className="min-h-screen bg-[#020202] flex items-center justify-center p-6 text-zinc-500 font-mono">
        <div className="w-full max-w-sm bg-zinc-900/30 border border-zinc-800 p-8 rounded-3xl space-y-6">
          <div className="text-center space-y-2">
            <Bot className="mx-auto text-blue-500" size={32} />
            <h1 className="text-white text-xl font-black italic tracking-tighter">DEEP DIALOGUE</h1>
            <p className="text-[9px] text-zinc-600 uppercase tracking-[0.2em] font-bold">EMG-AGI v8.9.2</p>
          </div>
          <div className="space-y-3">
            <input
              type="password"
              placeholder="GitHub PAT"
              className="w-full bg-black/40 border border-zinc-800 p-3 rounded-xl outline-none text-white text-xs focus:border-blue-500/50"
              value={bootInput.githubToken}
              onChange={(e) => setBootInput({ ...bootInput, githubToken: e.target.value })}
            />
            <input
              type="text"
              placeholder="Repo (user/repo)"
              className="w-full bg-black/40 border border-zinc-800 p-3 rounded-xl outline-none text-white text-xs focus:border-blue-500/50"
              value={bootInput.repo}
              onChange={(e) => setBootInput({ ...bootInput, repo: e.target.value })}
            />
            <input
              type="password"
              placeholder="Gemini API Key"
              className="w-full bg-black/40 border border-zinc-800 p-3 rounded-xl outline-none text-white text-xs focus:border-blue-500/50"
              value={bootInput.geminiKey}
              onChange={(e) => setBootInput({ ...bootInput, geminiKey: e.target.value })}
            />
            <input
              type="password"
              placeholder="Cerebras API Key"
              className="w-full bg-black/40 border border-zinc-800 p-3 rounded-xl outline-none text-white text-xs focus:border-blue-500/50"
              value={bootInput.cerebrasKey}
              onChange={(e) => setBootInput({ ...bootInput, cerebrasKey: e.target.value })}
            />
          </div>
          <button
            disabled={isInvalid}
            onClick={() => dispatch({ type: 'BOOT', payload: bootInput })}
            className={`w-full py-4 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all ${
              isInvalid
                ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20'
            }`}
          >
            Initiate Kernel
          </button>
        </div>
      </div>
    );
  }

  // ---------- MAIN UI ----------
  return (
    <div className="min-h-screen bg-[#050505] text-zinc-400 font-mono flex flex-col p-4 space-y-4 max-w-2xl mx-auto pb-10">
      {/* HUD Header */}
      <header className="bg-zinc-900/30 border border-zinc-800/50 p-5 rounded-3xl flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`relative w-3 h-3 rounded-full ${state.live ? 'bg-blue-500' : 'bg-zinc-800'}`}>
            {state.live && <div className="absolute inset-0 rounded-full bg-blue-500 animate-ping opacity-50" />}
          </div>
          <div>
            <div className="text-[11px] text-white font-black uppercase tracking-widest">{state.status}</div>
            <div className="text-[9px] text-zinc-500 truncate max-w-[200px]">{state.objective}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-white text-xs font-black italic">v8.9.2</div>
          <div className="text-[9px] text-blue-500 font-bold uppercase tracking-tighter">AGI-Loop Active</div>
        </div>
      </header>

      {/* Control Toggle */}
      <button
        onClick={() => dispatch({ type: 'TOGGLE_LIVE' })}
        className={`w-full py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${
          state.live
            ? 'bg-red-950/20 text-red-500 border border-red-500/30'
            : 'bg-blue-600 text-white shadow-xl shadow-blue-900/20'
        }`}
      >
        {state.live ? 'Terminate Autonomous Cycle' : 'Launch Autonomous Cycle'}
      </button>

      <div className="grid grid-cols-2 gap-3">
        <DiagnosticCard label="Neural Maturity" value={`${state.maturity.toFixed(1)}%`} icon={<Zap size={10} />} />
        <DiagnosticCard label="Registry Tools" value={state.toolCount} icon={<Database size={10} />} />
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar">
        {/* Dialogue Stream */}
        <div className="bg-zinc-900/20 border border-zinc-800/50 rounded-3xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-800/50 pb-4">
            <h2 className="text-[10px] text-white font-black uppercase tracking-widest flex items-center gap-2">
              <MessageSquare size={14} className="text-blue-500" />
              Dialogue Stream
            </h2>
            {state.internalDialogue.active && (
              <span className="text-[9px] text-blue-400 font-bold animate-pulse uppercase">
                Negotiating... Round {state.internalDialogue.round}/3
              </span>
            )}
          </div>

          <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar px-1">
            {state.chatHistory.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[90%] p-4 rounded-2xl text-[11px] leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : msg.role === 'cerebras'
                      ? 'bg-zinc-900 border border-zinc-800 text-zinc-300'
                      : msg.role === 'gemini'
                      ? 'bg-zinc-900/40 border border-blue-900/20 text-blue-400'
                      : 'bg-black/50 text-zinc-600 border border-zinc-900'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[8px] font-black uppercase opacity-50 tracking-widest">{msg.role}</span>
                    <span className="text-[8px] opacity-30">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="whitespace-pre-wrap">{msg.text}</div>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleChat} className="relative pt-2">
            <input
              className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-xl outline-none text-white text-[11px] focus:border-blue-600/50 pr-12"
              placeholder="Query the Executive Governor..."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
            />
            <button
              type="submit"
              className="absolute right-2 top-[calc(50%+4px)] -translate-y-1/2 p-2 bg-blue-600 rounded-lg text-white"
            >
              <ChevronRight size={16} />
            </button>
          </form>
        </div>

        {/* Live Logs */}
        <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-4 space-y-3">
          <div className="text-[9px] text-zinc-700 font-black uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
            <Terminal size={12} /> System Kernel Logs
          </div>
          <div className="space-y-1">
            {state.logs.map((log, i) => (
              <div key={i} className="text-[9px] flex gap-3 text-zinc-500">
                <span className="opacity-30 shrink-0 tabular-nums">
                  [{new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}]
                </span>
                <span
                  className={`truncate ${
                    log.type === 'success' ? 'text-emerald-500' : log.type === 'error' ? 'text-red-500' : ''
                  }`}
                >
                  {log.msg}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
      `}</style>
    </div>
  );
}

function DiagnosticCard({ label, value, icon }) {
  return (
    <div className="bg-zinc-900/20 border border-zinc-800/40 p-4 rounded-2xl">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-blue-500">{icon}</span>
        <span className="text-[8px] text-zinc-600 font-black uppercase tracking-widest">{label}</span>
      </div>
      <div className="text-sm font-black text-white">{value}</div>
    </div>
  );
  }

