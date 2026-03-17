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
  Shield,
  Cpu,
  Zap,
  Terminal,
  Database,
  Layers,
  RefreshCw,
  ShieldCheck,
  Github,
  Key,
  Square,
  Play,
  CpuIcon,
  Wand2,
  Binary,
  Merge
} from 'lucide-react';

/**
 * EMG-KERNEL v12.0.0 "SYNTHETIC ARCHITECT"
 * ======================================================================
 * TARGET: craighckby-stack/Test-1
 * ENHANCEMENT: Recursive Merge of Stored Tools + Original Kernel
 * ======================================================================
 */

const APP_ID = typeof window !== 'undefined' && window.__app_id ? window.__app_id : 'emg-kernel-v12';
const VERSION = '12.0.0-SYNTH-ARCH';
const GEMINI_MODEL = "gemini-2.5-flash-preview-09-2025";

const REPO_OWNER = "craighckby-stack";
const REPO_NAME = "Test-1";
const REPO_BRANCH = "main";
const ENHANCEMENT_URL = "https://raw.githubusercontent.com/craighckby-stack/AGI-KERNEL-/main/KERNAL/orgional.js";

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
  const [metrics, setMetrics] = useState({ evolution: 1.0, maturity: 0 });

  const statusRef = useRef(status);
  const isPausedRef = useRef(isPaused);
  const userRef = useRef(user);
  const dbRef = useRef(null);

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

    const unsubPlugins = onSnapshot(query(collection(db, ...publicPath, 'plugins'), limit(20)), (snap) => {
      setPlugins(snap.docs.map(d => ({ id: d.id, ...d.data() })));
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

  // ----------------------------------------------------------------------
  // RECURSIVE ENHANCEMENT ENGINE
  // ----------------------------------------------------------------------
  const runEvolutionCycle = useCallback(async () => {
    if (statusRef.current === 'EVOLVING' || isPausedRef.current || !userRef.current) return;

    setStatus('EVOLVING');
    const isEnhancementCycle = (cycleCount + 1) % 20 === 0;
    addLog(isEnhancementCycle ? "!!! INITIATING MASTER ENHANCEMENT MERGE !!!" : "Cycle Start...", isEnhancementCycle ? 'warn' : 'info');

    try {
      const ghHeaders = { 'Authorization': `token ${gitToken}` };
      
      // 1. Fetch Target Code (Deep Scan)
      const treeRes = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/git/trees/${REPO_BRANCH}?recursive=1`, { headers: ghHeaders });
      const treeData = await treeRes.json();
      const files = treeData.tree || [];
      const target = files.find(f => f.path.toLowerCase().endsWith('app.jsx')) || files.find(f => f.path.endsWith('.jsx')) || files[0];
      
      const contentRes = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${target.path}?ref=${REPO_BRANCH}`, { 
        headers: { ...ghHeaders, 'Accept': 'application/vnd.github.v3.raw' } 
      });
      const currentCode = await contentRes.text();

      let promptText = "";
      let systemPrompt = "";

      if (isEnhancementCycle) {
        // 2. ENHANCEMENT MODE: Fetch Original + All Stored Tools
        addLog("Retrieving Original Kernel blueprint...", "info");
        const origRes = await fetch(ENHANCEMENT_URL);
        const originalKernelCode = await origRes.text();

        addLog(`Compiling ${plugins.length} synthetic tool schemas for integration...`, "info");
        const toolManifest = plugins.map(p => `TOOL_NAME: ${p.name}\nTOOL_CODE:\n${p.code}`).join("\n\n---\n\n");

        systemPrompt = `You are a Master Synthetic Architect.
        INPUTS:
        1. ORIGINAL_KERNEL: The foundational logic.
        2. CURRENT_TARGET: The current running application.
        3. SYNTHETIC_TOOLS: A collection of code snippets created in previous cycles.

        TASK: 
        Analyze the SYNTHETIC_TOOLS. Physically integrate their logic, functions, and enhancements into a new version of the CURRENT_TARGET, using the ORIGINAL_KERNEL as the architectural guide. 
        Create a 'Master Plugin' that represents the unified capability of all stored tools.
        
        RETURN JSON: { "insight": "detailed merge summary", "newMetrics": {...}, "plugin": { "name": "MASTER_SYNTH_CORE", "code": "merged_logic" } }`;

        promptText = `ORIGINAL_KERNEL_CODE:\n${originalKernelCode}\n\nCURRENT_APP_CODE:\n${currentCode}\n\nSTORED_SYNTHETIC_TOOLS:\n${toolManifest}`;
      } else {
        // 3. STANDARD MODE
        systemPrompt = `Analyze code and evolve one specific tool. Return JSON: { "insight": "string", "newMetrics": {}, "plugin": { "name": "string", "code": "js" } }`;
        promptText = `FILE: ${target.path}\nCODE:\n${currentCode}`;
      }

      // 4. Gemini Execution
      const apiKey = ""; 
      const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: { responseMimeType: "application/json" }
        })
      });

      const geminiData = await geminiRes.json();
      const result = JSON.parse(geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "{}");

      // 5. Persistence
      if (dbRef.current) {
        if (result.plugin) {
          await addDoc(collection(dbRef.current, 'artifacts', APP_ID, 'public', 'data', 'plugins'), result.plugin);
          addLog(`New ${isEnhancementCycle ? 'Master Core' : 'Tool'} synthesized.`, 'success');
        }
        await addDoc(collection(dbRef.current, 'artifacts', APP_ID, 'users', userRef.current.uid, 'ledger'), {
          insight: isEnhancementCycle ? `[ARCHITECT_MERGE] ${result.insight}` : result.insight,
          timestamp: serverTimestamp()
        });
      }

      setCycleCount(c => c + 1);
      if (result.newMetrics) setMetrics(m => ({ ...m, ...result.newMetrics, maturity: Math.min(100, m.maturity + 2) }));

    } catch (err) {
      addLog(`Nexus Interrupted: ${err.message}`, 'danger');
    } finally {
      setStatus('OPERATIONAL');
    }
  }, [gitToken, cycleCount, plugins, addLog]);

  useEffect(() => {
    if (isLive && user && !isPaused) {
      const interval = setInterval(runEvolutionCycle, 60000);
      return () => clearInterval(interval);
    }
  }, [isLive, user, isPaused, runEvolutionCycle]);

  if (!isLive) {
    return (
      <div className="min-h-screen bg-[#05070a] text-[#c9d1d9] flex items-center justify-center p-6 font-mono">
        <div className="max-w-md w-full bg-[#0d1117] border border-[#30363d] rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-purple-600"></div>
          <div className="flex flex-col items-center mb-8">
            <div className="p-4 bg-blue-500/10 rounded-full border border-blue-500/20 mb-4 animate-pulse">
              <Binary className="w-10 h-10 text-blue-500" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tighter uppercase">EMG-Architect</h1>
            <span className="text-[10px] text-blue-400 font-bold tracking-[0.3em] uppercase">{VERSION}</span>
          </div>
          <div className="space-y-4">
            <input type="password" value={gitToken} onChange={(e) => setGitToken(e.target.value)} placeholder="GitHub Access Token" className="w-full bg-black/60 border border-[#30363d] rounded-lg px-4 py-3.5 text-sm focus:border-blue-500" />
            <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4 flex gap-3">
              <Merge className="w-4 h-4 text-blue-500 shrink-0" />
              <p className="text-[10px] text-blue-200/60 leading-relaxed italic">
                Recursive Synthesis active. Every 20 cycles, the system will merge all stored synthetic tools into the core architecture.
              </p>
            </div>
            <button onClick={() => setIsLive(true)} disabled={!user || !gitToken} className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-20 rounded-xl font-black text-white uppercase tracking-widest text-xs">Initialize Kernel</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05070a] text-[#c9d1d9] font-mono p-4 flex flex-col">
      <header className="flex items-center justify-between mb-4 border-b border-[#30363d] pb-4 px-2">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20"><Cpu className="w-5 h-5 text-blue-500" /></div>
          <div>
            <div className="text-sm font-black tracking-tight flex items-center gap-2 uppercase">EMG-Architect <span className="text-[9px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded border border-purple-500/30 font-bold tracking-widest">Synthetic Merge</span></div>
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">Cycle: {cycleCount} | Enhanced in {20 - (cycleCount % 20)}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsPaused(!isPaused)} className={`p-2 rounded-lg border border-[#30363d] transition-all ${isPaused ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
            {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Square className="w-4 h-4 fill-current" />}
          </button>
          <button onClick={runEvolutionCycle} disabled={status === 'EVOLVING' || isPaused} className="p-2 bg-[#161b22] border border-[#30363d] rounded-lg text-blue-400"><RefreshCw className={`w-4 h-4 ${status === 'EVOLVING' ? 'animate-spin' : ''}`} /></button>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-4 flex-1 overflow-hidden">
        <div className="col-span-12 lg:col-span-3 flex flex-col gap-4">
          <div className="bg-[#0d1117] border border-[#30363d] rounded-xl p-5 shadow-sm">
            <h3 className="text-[10px] text-gray-600 uppercase font-black mb-5 flex items-center gap-2"><Activity className="w-3 h-3" /> SYSTEM STATUS</h3>
            <MetricItem label="Kernel Maturity" value={`${metrics.maturity.toFixed(1)}%`} color="text-blue-400" />
            <MetricItem label="Tools Indexed" value={plugins.length} color="text-purple-400" />
          </div>
          <div className="bg-[#0d1117] border border-[#30363d] rounded-xl p-5 flex-1 overflow-hidden flex flex-col shadow-sm">
            <h3 className="text-[10px] text-gray-600 uppercase font-black mb-4 flex items-center gap-2"><Database className="w-3 h-3" /> ARCHITECT LEDGER</h3>
            <div className="space-y-3 overflow-y-auto flex-1 pr-1 custom-scrollbar">
              {ledger.map((entry) => (
                <div key={entry.id} className="border-l-2 border-purple-500/30 pl-3 py-1">
                  <p className="text-[10px] text-gray-400 leading-tight">{entry.insight}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-6 bg-[#0d1117] border border-[#30363d] rounded-2xl flex flex-col overflow-hidden shadow-2xl">
          <div className="px-5 py-3 bg-[#161b22] border-b border-[#30363d] flex items-center gap-2 font-black text-[10px] uppercase text-gray-500 tracking-widest">
            <Terminal className="w-3.5 h-3.5" /> Recursive Stream
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-1.5 custom-scrollbar bg-black/20 font-mono">
            {logs.map((log) => (
              <div key={log.id} className={`text-[11px] ${log.type === 'danger' ? 'text-red-400' : log.type === 'warn' ? 'text-yellow-400 font-bold' : log.type === 'success' ? 'text-green-400' : 'text-blue-200/60'}`}>
                <span className="opacity-30 mr-2">[{new Date().toLocaleTimeString([], {hour12:false})}]</span> {log.msg}
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-3 flex flex-col gap-4 overflow-hidden">
          <div className="bg-[#0d1117] border border-[#30363d] rounded-xl p-5 flex-1 overflow-hidden flex flex-col shadow-sm">
            <h3 className="text-[10px] text-gray-600 uppercase font-black mb-5 flex items-center gap-2"><Layers className="w-3 h-3 text-green-500" /> SYNTHETIC REPOSITORY</h3>
            <div className="overflow-y-auto flex-1 pr-1 custom-scrollbar space-y-3">
              {plugins.map((p) => <SandboxPlugin key={p.id} plugin={p} />)}
            </div>
          </div>
        </div>
      </div>
      <style>{`.custom-scrollbar::-webkit-scrollbar { width: 3px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #30363d; border-radius: 10px; }`}</style>
    </div>
  );
}

const SandboxPlugin = ({ plugin }) => {
  const srcdoc = `<!DOCTYPE html><html><head><style>body { background: transparent; color: #c9d1d9; font-family: monospace; margin: 0; padding: 4px; font-size: 10px; overflow: hidden; } #root { border-radius: 4px; border: 1px solid #30363d; padding: 4px; background: rgba(0,0,0,0.2); height: 60px; }</style></head><body><div id="root"></div><script>(function(){ try { const code = ${JSON.stringify(plugin.code)}; const fn = new Function('c', code); fn(document.getElementById('root')); } catch(e){ document.body.innerHTML = e.message; } })();</script></body></html>`;
  return (
    <div className="border border-[#30363d] rounded-lg bg-[#161b22]/50 p-2 mb-3">
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-[9px] font-bold text-blue-400 uppercase truncate">{plugin.name}</span>
        <ShieldCheck className="w-3 h-3 text-green-500/30" />
      </div>
      <iframe title={plugin.name} srcDoc={srcdoc} sandbox="allow-scripts" className="w-full h-16 bg-black/20 rounded border-none" />
    </div>
  );
};

const MetricItem = ({ label, value, color }) => (
  <div className="mb-5 last:mb-0">
    <div className="text-[9px] text-gray-600 font-black uppercase mb-1 tracking-widest">{label}</div>
    <div className={`text-2xl font-black tracking-tighter tabular-nums ${color}`}>{value}</div>
  </div>
);

