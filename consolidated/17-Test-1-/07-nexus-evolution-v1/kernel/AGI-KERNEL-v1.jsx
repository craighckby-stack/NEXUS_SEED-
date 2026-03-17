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

