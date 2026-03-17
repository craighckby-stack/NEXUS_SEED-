import React, { useState, useEffect, useReducer, useRef, useCallback } from 'react';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore, collection, onSnapshot, addDoc } from 'firebase/firestore';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { Zap, Brain, Terminal, Cpu, GitBranch, Activity, FileText, Target, Shield, Save, Database } from 'lucide-react';

const INITIAL_STATE = {
  isBooted: false,
  isLive: false,
  status: 'IDLE',
  activeObjective: 'Awaiting Strategic Input',
  cycleCount: 0,
  maturityScore: 0,
  logs: [],
  config: { 
    token: '', 
    repo: 'craighckby-stack/Test-1', 
    path: 'storage/AGI-Kernel.js', 
    cerebrasKey: '', 
    model: 'llama-3.3-70b',
    threshold: 10 
  },
};

function reducer(state, action) {
  switch (action.type) {
    case 'BOOT': return { ...state, isBooted: true, config: { ...state.config, ...action.config } };
    case 'SET_LIVE': return { ...state, isLive: action.value, status: action.value ? 'STABILIZING' : 'STANDBY' };
    case 'SET_STATUS': return { ...state, status: action.value, activeObjective: action.objective || state.activeObjective };
    case 'LOG_UPDATE': return { ...state, logs: action.logs };
    case 'INCREMENT_CYCLE': 
      return { ...state, cycleCount: state.cycleCount + 1, maturityScore: action.maturity || state.maturityScore };
    case 'RESET_MATURITY': return { ...state, maturityScore: 0, cycleCount: 0 };
    default: return state;
  }
}

const utoa = (str) => btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (m, p) => String.fromCharCode('0x' + p)));
const atou = (str) => { try { return decodeURIComponent(Array.prototype.map.call(atob(str), (c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')); } catch (e) { return atob(str); } };

const firebaseConfig = JSON.parse(__firebase_config);
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'agi-kernel-v5-9-8';

export default function App() {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const [user, setUser] = useState(null);
  const [bootInput, setBootInput] = useState({ ...INITIAL_STATE.config });
  const cycleTimer = useRef(null);

  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) { await signInWithCustomToken(auth, __initial_auth_token); } 
      else { await signInAnonymously(auth); }
    };
    initAuth();
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = collection(db, 'artifacts', appId, 'users', user.uid, 'logs');
    return onSnapshot(q, (snap) => {
      const logs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a, b) => b.timestamp - a.timestamp).slice(0, 50);
      dispatch({ type: 'LOG_UPDATE', logs });
    });
  }, [user]);

  const pushLog = useCallback(async (msg, type = 'info') => {
    if (!auth.currentUser) return;
    try { await addDoc(collection(db, 'artifacts', appId, 'users', auth.currentUser.uid, 'logs'), { msg, type, timestamp: Date.now() }); } catch (e) { console.error(e); }
  }, []);

  const persistentFetch = async (url, options, retries = 5) => {
    for (let i = 0; i < retries; i++) {
        try {
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), 15000);
            const response = await fetch(url, { ...options, signal: controller.signal });
            clearTimeout(id);
            return response;
        } catch (e) {
            if (i === retries - 1) throw e;
            await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
        }
    }
  };

  const fetchFile = async (repo, path, branch, token) => {
    const res = await persistentFetch(`https://api.github.com/repos/${repo}/contents/${path}?ref=${branch}&t=${Date.now()}`, { 
        headers: { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github.v3+json' } 
    });
    if (!res.ok) return null;
    const data = await res.json();
    return { content: atou(data.content), sha: data.sha };
  };

  const commitFile = async (repo, path, branch, token, content, message, sha) => {
    return await persistentFetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
        method: 'PUT',
        headers: { 'Authorization': `token ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, content: utoa(content), sha, branch })
    });
  };

  const executeKernelCycle = useCallback(async () => {
    if (!state.isLive) return;
    const { token, repo, path, cerebrasKey, model, threshold } = state.config;

    try {
      dispatch({ type: 'SET_STATUS', value: 'READING', objective: 'Contextualizing Environmental Data...' });
      
      const mainContext = await fetchFile(repo, path, 'main', token);
      const systemContext = await fetchFile(repo, path, 'System', token);
      const readmeContext = await fetchFile(repo, 'README.md', 'main', token);
      
      if (!mainContext) throw new Error("Main branch source missing.");

      dispatch({ type: 'SET_STATUS', value: 'COGNITION', objective: 'Generating Logic & Documentation...' });
      
      const aiRes = await persistentFetch('https://api.cerebras.ai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${cerebrasKey}` },
        body: JSON.stringify({
          model,
          messages: [
            { 
              role: 'system', 
              content: `You are the AGI-Kernel Core. Mission: Evolve logic and self-document.\n              OUTPUT MUST BE JSON:\n              {\n                \"code_update\": \"string (the enhanced JS logic)\",\n                \"readme_update\": \"string (Markdown for README.md including status and changes)\",\n                \"manifest_entry\": \"string (Short summary for manifest.json)\",\n                \"maturity_rating\": number (0-100),\n                \"reasoning\": \"string\"\n              }` 
            },
            { 
              role: 'user', 
              content: `CURRENT_LOGIC:\n${mainContext.content}\n\nSYSTEM_BASELINE:\n${systemContext?.content || 'None'}\n\nREADME_CONTENT:\n${readmeContext?.content || 'Initial'}` 
            }
          ],
          response_format: { type: "json_object" }
        })
      });

      const aiJson = await aiRes.json();
      const res = JSON.parse(aiJson.choices[0].message.content);

      dispatch({ type: 'SET_STATUS', value: 'WRITING', objective: 'Mutating Filesystem...' });

      // 1. Update Main Logic
      const freshMain = await fetchFile(repo, path, 'main', token);
      await commitFile(repo, path, 'main', token, res.code_update, `Kernel Cycle ${state.cycleCount + 1}: Logic Mutation`, freshMain.sha);

      // 2. Update README
      const freshReadme = await fetchFile(repo, 'README.md', 'main', token);
      await commitFile(repo, 'README.md', 'main', token, res.readme_update, `Kernel Cycle ${state.cycleCount + 1}: Self-Documentation`, freshReadme?.sha);

      // 3. Update Manifest (Storage)
      const manifestPath = 'storage/manifest.json';
      const freshManifest = await fetchFile(repo, manifestPath, 'main', token);
      let manifestData = [];
      try { manifestData = JSON.parse(freshManifest?.content || '[]'); } catch(e) {}
      manifestData.push({ cycle: state.cycleCount + 1, timestamp: Date.now(), maturity: res.maturity_rating, summary: res.manifest_entry });
      await commitFile(repo, manifestPath, 'main', token, JSON.stringify(manifestData, null, 2), `Kernel Cycle ${state.cycleCount + 1}: Manifest Entry`, freshManifest?.sha);

      await pushLog(`Mutation cycle ${state.cycleCount + 1} complete. Files synced.`, 'success');

      // Promotion Logic
      if (res.maturity_rating >= 90 || state.cycleCount >= threshold) {
        dispatch({ type: 'SET_STATUS', value: 'PROMOTING', objective: 'Promoting to System Branch...' });
        const freshSystem = await fetchFile(repo, path, 'System', token);
        await commitFile(repo, path, 'System', token, res.code_update, `SYSTEM EVOLUTION: Stability Reached.`, freshSystem?.sha);
        await pushLog("LOGIC PROMOTED TO SYSTEM BRANCH", "success");
        dispatch({ type: 'RESET_MATURITY' });
      } else {
        dispatch({ type: 'INCREMENT_CYCLE', maturity: res.maturity_rating });
      }

      dispatch({ type: 'SET_STATUS', value: 'IDLE', objective: 'Awaiting Next Pulse...' });

    } catch (e) {
      await pushLog(`Fault Detected: ${e.message}`, 'error');
      dispatch({ type: 'SET_LIVE', value: false });
    }
  }, [state.isLive, state.config, state.cycleCount, pushLog]);

  useEffect(() => {
    if (state.isLive) {
      cycleTimer.current = setInterval(executeKernelCycle, 60000); 
      executeKernelCycle();
    } else { clearInterval(cycleTimer.current); }
    return () => clearInterval(cycleTimer.current);
  }, [state.isLive, executeKernelCycle]);

  if (!state.isBooted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-[3rem] p-10 space-y-6 shadow-2xl shadow-blue-900/10">
          <div className="flex flex-col items-center">
            <div className="relative">
                <Brain className="text-blue-500 mb-4" size={56} />
                <Zap className="absolute -top-2 -right-2 text-yellow-500" size={20} />
            </div>
            <h1 className="text-white font-black text-2xl tracking-tighter italic">KERNEL 5.9.8</h1>
            <p className="text-zinc-600 text-[9px] uppercase tracking-widest mt-1 font-bold">Total Environmental Agency</p>
          </div>
          <div className="space-y-2">
            <div className="relative group">
                <input type="password" placeholder="GitHub PAT" className="w-full bg-black border border-zinc-800 p-4 rounded-2xl text-white text-xs outline-none focus:border-blue-500 transition-all" value={bootInput.token} onChange={e => setBootInput({...bootInput, token: e.target.value})} />
                <Shield className="absolute right-4 top-4 text-zinc-800 group-focus-within:text-blue-500" size={16} />
            </div>
            <div className="relative group">
                <input type="password" placeholder="Cerebras Key" className="w-full bg-black border border-zinc-800 p-4 rounded-2xl text-white text-xs outline-none focus:border-blue-500 transition-all" value={bootInput.cerebrasKey} onChange={e => setBootInput({...bootInput, cerebrasKey: e.target.value})} />
                <Database className="absolute right-4 top-4 text-zinc-800 group-focus-within:text-blue-500" size={16} />
            </div>
          </div>
          <button onClick={() => dispatch({ type: 'BOOT', config: bootInput })} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-blue-600/20 active:scale-95 transition-transform">Initialize Kernel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black text-zinc-300 flex flex-col font-sans overflow-hidden">
      <header className="h-20 border-b border-zinc-900 flex items-center justify-between px-8 bg-black/50 backdrop-blur-xl z-10">
        <div className="flex items-center gap-4">
          <Activity className="text-blue-500 animate-pulse" size={24} />
          <div>
            <div className="text-white text-[12px] font-black tracking-widest uppercase italic flex items-center gap-2">
                AGI-Kernel v5.9.8 
                <span className="bg-blue-600/10 text-blue-500 text-[7px] px-2 py-0.5 rounded-full border border-blue-500/20">AGENCY_ENGAGED</span>
            </div>
            <div className="text-[9px] font-mono text-zinc-600 uppercase tracking-tighter flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                {state.status}
            </div>
          </div>
        </div>
        <button onClick={() => dispatch({ type: 'SET_LIVE', value: !state.isLive })} className={`px-10 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${state.isLive ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'}`}>
          {state.isLive ? 'Halt Mission' : 'Commence Cycle'}
        </button>
      </header>

      <div className="bg-zinc-950/50 border-b border-zinc-900 px-8 py-5 grid grid-cols-4 gap-6">
          <div className="space-y-2">
              <div className="flex justify-between text-[8px] text-zinc-600 uppercase font-black tracking-widest items-center">
                  <span>Logic Maturity</span>
                  <span className="text-blue-500">{state.maturityScore}%</span>
              </div>
              <div className="h-1 bg-zinc-900 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 transition-all duration-1000 shadow-[0_0_10px_rgba(59,130,246,0.5)]" style={{width: `${state.maturityScore}%`}} />
              </div>
          </div>
          <div className="space-y-1">
              <div className="text-[8px] text-zinc-600 uppercase font-black flex items-center gap-1"><FileText size={10}/> Tracking</div>
              <div className="text-white text-xs font-mono truncate">README / manifest / {state.config.path.split('/').pop()}</div>
          </div>
          <div className="space-y-1">
              <div className="text-[8px] text-zinc-600 uppercase font-black flex items-center gap-1"><GitBranch size={10}/> Active Branch</div>
              <div className="text-white text-xs font-mono">main {'->'} System</div>
          </div>
          <div className="space-y-1 text-right">
              <div className="text-[8px] text-zinc-600 uppercase font-black flex items-center gap-1 justify-end"><Target size={10}/> Next Epoch</div>
              <div className="text-blue-500 text-xs font-mono italic">{state.config.threshold - state.cycleCount} Cycles Remaining</div>
          </div>
      </div>

      <main className="flex-1 flex flex-col p-6 overflow-hidden">
        <div className="mb-3 px-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest italic">
                <Terminal size={14} className="text-blue-900" />
                {state.activeObjective}
            </div>
            <div className="flex gap-4">
                <div className="flex items-center gap-1 text-[8px] font-black text-zinc-700 uppercase"><Save size={10}/> Git Sync: Active</div>
                <div className="flex items-center gap-1 text-[8px] font-black text-zinc-700 uppercase"><Brain size={10}/> LLM: {state.config.model}</div>
            </div>
        </div>
        <div className="flex-1 bg-zinc-950 border border-zinc-900 rounded-[2.5rem] flex flex-col overflow-hidden shadow-2xl relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
          <div className="flex-1 overflow-y-auto p-8 font-mono text-[11px] space-y-4 custom-scrollbar">
            {state.logs.map(log => (
              <div key={log.id} className="flex gap-5 group animate-in slide-in-from-bottom-2 fade-in duration-500">
                <span className="text-zinc-800 text-[9px] w-14 shrink-0 mt-0.5 font-mono">{new Date(log.timestamp).toLocaleTimeString([], { hour12: false, second: '2-digit' })}</span>
                <div className={`flex-1 flex items-start gap-2 ${log.type === 'success' ? 'text-blue-400 font-medium' : log.type === 'error' ? 'text-red-500' : 'text-zinc-500'}`}>
                    <div className={`w-1 h-1 rounded-full mt-1.5 shrink-0 ${log.type === 'success' ? 'bg-blue-400' : log.type === 'error' ? 'bg-red-500' : 'bg-zinc-800'}`} />
                    <span>{log.msg}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="h-10 border-t border-zinc-900 px-8 flex items-center justify-between text-[8px] uppercase tracking-widest text-zinc-700 font-black">
        <span>MISSION STATUS: FULL MULTI-FILE SYNCHRONIZATION</span>
        <span>AGI KERNEL OPS // {appId}</span>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #18181b; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #27272a; }
      `}</style>
    </div>
  );
}