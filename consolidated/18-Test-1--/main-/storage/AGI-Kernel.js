import React, { useState, useEffect, useReducer, useRef, useCallback } from 'react';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore, collection, onSnapshot, addDoc } from 'firebase/firestore';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { Brain, Terminal, Cpu, Activity, Database, ShieldAlert, Zap, Search } from 'lucide-react';

/**
 * AGI-KERNAL v5.9.14 - "CLEAN-PIPE ARCHITECTURE"
 * FIX: Resolved URL Parse error on Cerebras endpoint.
 * PRIMARY: Cerebras (Llama-3.3-70B)
 * CONSULTANT: Gemini-2.5-Flash (Search Grounding)
 */

const KERNAL_CONSTANTS = {
  CEREBRAS_URL: "https://api.cerebras.ai/v1/chat/completions",
  GEMINI_MODEL: "gemini-2.5-flash-preview-09-2025",
  GITHUB_API: "https://api.github.com/repos"
};

const INITIAL_STATE = {
  isBooted: false,
  isLive: false,
  status: 'IDLE',
  activeObjective: 'Waiting for Swapped Initiation',
  cycleCount: 14,
  maturityScore: 0,
  logs: [],
  activeEngine: 'CEREBRAS_CORE', 
  config: { 
    token: '', 
    repo: 'craighckby-stack/Test-1', 
    path: 'storage/AGI-Kernal.js', 
    cerebrasKey: '', 
    cycleDelay: 300000 
  },
};

function reducer(state, action) {
  switch (action.type) {
    case 'BOOT': return { ...state, isBooted: true, config: { ...state.config, ...action.config } };
    case 'SET_LIVE': return { ...state, isLive: action.value, status: action.value ? 'STABILIZING' : 'STANDBY' };
    case 'SET_STATUS': return { ...state, status: action.value, activeObjective: action.objective || state.activeObjective };
    case 'SET_ENGINE': return { ...state, activeEngine: action.value };
    case 'LOG_UPDATE': return { ...state, logs: action.logs };
    case 'INCREMENT_CYCLE': 
      return { ...state, cycleCount: state.cycleCount + 1, maturityScore: action.maturity || state.maturityScore };
    default: return state;
  }
}

const utoa = (str) => btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (m, p) => String.fromCharCode('0x' + p)));
const atou = (str) => { try { return decodeURIComponent(Array.prototype.map.call(atob(str), (c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')); } catch (e) { return atob(str); } };

const firebaseConfig = JSON.parse(__firebase_config);
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'agi-kernal-v5';

export default function App() {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const [user, setUser] = useState(null);
  const [bootInput, setBootInput] = useState({ ...INITIAL_STATE.config });
  const cycleTimer = useRef(null);
  const apiKey = ""; 

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
    }, (err) => console.error("Firestore Fail:", err));
  }, [user]);

  const pushLog = useCallback(async (msg, type = 'info') => {
    if (!auth.currentUser) return;
    try { await addDoc(collection(db, 'artifacts', appId, 'users', auth.currentUser.uid, 'logs'), { msg, type, timestamp: Date.now() }); } catch (e) { console.error(e); }
  }, []);

  // Removed persistentFetch, now relies on PersistentFetcher plugin.

  const fetchFile = async (repo, path, branch, token) => {
    const res = await fetch(`${KERNAL_CONSTANTS.GITHUB_API}/${repo}/contents/${path}?ref=${branch}`, { 
        headers: { 'Authorization': `token ${token}` } 
    });
    if (!res.ok) return null;
    const data = await res.json();
    return { content: atou(data.content), sha: data.sha };
  };

  const commitFile = async (repo, path, branch, token, content, message, sha) => {
    if (!content) return;
    return await fetch(`${KERNAL_CONSTANTS.GITHUB_API}/${repo}/contents/${path}`, {
        method: 'PUT',
        headers: { 'Authorization': `token ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, content: utoa(content), sha, branch })
    });
  };

  const executeKernalCycle = useCallback(async () => {
    if (!state.isLive) return;
    const { token, repo, path, cerebrasKey } = state.config;

    try {
      dispatch({ type: 'SET_STATUS', value: 'SCANNING', objective: 'Reading Nexus Memory...' });
      const [main, nexus, readme] = await Promise.all([
        fetchFile(repo, path, 'main', token),
        fetchFile(repo, 'nexus_memory.json', 'Nexus-Database', token),
        fetchFile(repo, 'README.md', 'main', token)
      ]);

      dispatch({ type: 'SET_STATUS', value: 'REASONING', objective: 'Cerebras Leading Evolution...' });
      dispatch({ type: 'SET_ENGINE', value: 'CEREBRAS_CORE' });

      if (!cerebrasKey) throw new Error("Missing Cerebras Key");

      const cerebrasRes = await PersistentFetcher.execute({
          url: KERNAL_CONSTANTS.CEREBRAS_URL,
          options: {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${cerebrasKey.trim()}` },
              body: JSON.stringify({
                model: 'llama-3.3-70b',
                messages: [{ role: 'user', content: `Current Logic: ${main?.content || "INIT"}. Evolve this code. Also, suggest a search query to verify if this logic is optimal. Respond ONLY in JSON: {logic_update, nexus_update, readme_update, maturity, research_query}` }],
                response_format: { type: "json_object" }
              })
          }
      });
      const cData = await cerebrasRes.json();
      const initialRes = JSON.parse(cData.choices[0].message.content);

      dispatch({ type: 'SET_STATUS', value: 'RESEARCHING', objective: 'Gemini Deep Research...' });
      let researchData = "Search disabled.";
      try {
        const geminiRes = await PersistentFetcher.execute({
            url: `https://generativelanguage.googleapis.com/v1beta/models/${KERNAL_CONSTANTS.GEMINI_MODEL}:generateContent?key=${apiKey}`,
            options: {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  contents: [{ parts: [{ text: `Perform deep research for: ${initialRes.research_query || "latest web technologies 2024"}` }]}],
                  tools: [{ "google_search": {} }]
                })
            }
        });
        const gData = await geminiRes.json();
        researchData = gData.candidates?.[0]?.content?.parts?.[0]?.text || "No research results returned.";
      } catch (e) {
        await pushLog("Gemini Consultant failed research pulse. Skipping to commit.", "warning");
      }

      dispatch({ type: 'SET_STATUS', value: 'COMMITTING', objective: 'Syncing Changes...' });
      
      await Promise.all([
        commitFile(repo, path, 'main', token, initialRes.logic_update, `Cycle ${state.cycleCount+1}`, main?.sha),
        commitFile(repo, 'README.md', 'main', token, `${initialRes.readme_update}\n\n## Gemini Research\n${researchData}`, `Cycle ${state.cycleCount+1}`, readme?.sha),
        commitFile(repo, 'nexus_memory.json', 'Nexus-Database', token, initialRes.nexus_update, `Cycle ${state.cycleCount+1}`, nexus?.sha)
      ]);

      await pushLog(`Successfully synced Cycle ${state.cycleCount+1}. Engine: Cerebras.`, 'success');
      dispatch({ type: 'INCREMENT_CYCLE', maturity: initialRes.maturity });

    } catch (e) {
      await pushLog(`Kernal Fault: ${e.message}`, 'error');
    } finally {
      dispatch({ type: 'SET_STATUS', value: 'IDLE', objective: 'Cycle Finished.' });
    }
  }, [state.isLive, state.config, state.cycleCount, pushLog, apiKey]);

  useEffect(() => {
    if (state.isLive) {
      cycleTimer.current = setInterval(executeKernalCycle, state.config.cycleDelay);
      executeKernalCycle();
    } else { clearInterval(cycleTimer.current); }
    return () => clearInterval(cycleTimer.current);
  }, [state.isLive, executeKernalCycle, state.config.cycleDelay]);

  if (!state.isBooted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-[3rem] p-12 space-y-6">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-yellow-600/10 rounded-full flex items-center justify-center mb-4">
               <Zap className="text-yellow-500" size={32} />
            </div>
            <h1 className="text-white font-black text-2xl tracking-tighter italic">AGI-KERNAL</h1>
            <p className="text-zinc-600 text-[9px] uppercase tracking-widest mt-1">v5.9.14 // CLEAN-PIPE</p>
          </div>
          <div className="space-y-3">
            <input type="password" placeholder="GitHub Token" className="w-full bg-black border border-zinc-800 p-4 rounded-2xl text-white text-xs placeholder:text-zinc-700" value={bootInput.token} onChange={e => setBootInput({...bootInput, token: e.target.value})} />
            <input type="password" placeholder="Cerebras Key" className="w-full bg-black border border-zinc-800 p-4 rounded-2xl text-white text-xs placeholder:text-zinc-700" value={bootInput.cerebrasKey} onChange={e => setBootInput({...bootInput, cerebrasKey: e.target.value})} />
          </div>
          <button onClick={() => dispatch({ type: 'BOOT', config: bootInput })} className="w-full bg-yellow-600 hover:bg-yellow-500 text-black py-4 rounded-2xl font-black uppercase text-[10px] transition-colors">Initialize System</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black text-zinc-400 flex flex-col font-sans overflow-hidden">
      <header className="h-24 border-b border-zinc-900 flex items-center justify-between px-12 bg-black">
        <div className="flex items-center gap-6">
          <Activity className={`text-yellow-500 ${state.isLive ? 'animate-pulse' : ''}`} size={28} />
          <div>
            <div className="text-white text-[16px] font-black tracking-widest uppercase italic">AGI-KERNAL</div>
            <div className="text-[10px] font-mono text-zinc-600 uppercase flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${state.isLive ? 'bg-yellow-500 animate-ping' : 'bg-zinc-800'}`} />
                {state.status} | Core: <span className="text-yellow-500 font-bold">{state.activeEngine}</span>
            </div>
          </div>
        </div>
        <button onClick={() => dispatch({ type: 'SET_LIVE', value: !state.isLive })} className={`px-12 py-4 rounded-[2rem] text-[11px] font-black uppercase transition-all ${state.isLive ? 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700' : 'bg-yellow-600 text-black shadow-lg shadow-yellow-600/20 hover:bg-yellow-500'}`}>
          {state.isLive ? 'Emergency Stop' : 'Launch Engine'}
        </button>
      </header>

      <main className="flex-1 flex flex-col p-10 overflow-hidden">
        <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-4 text-[12px] font-black text-zinc-600 uppercase tracking-widest">
                <Terminal size={18} className="text-yellow-700" />
                {state.activeObjective}
            </div>
            <div className="flex gap-4 text-[10px] text-zinc-700 font-mono">
               <span>Cycle: {state.cycleCount}</span>
               <span>Mode: Swapped_Lead</span>
            </div>
        </div>
        
        <div className="flex-1 bg-zinc-950 border border-zinc-900 rounded-[3rem] flex flex-col overflow-hidden shadow-inner">
          <div className="flex-1 overflow-y-auto p-12 font-mono text-[12px] space-y-4 custom-scrollbar">
            {state.logs.length === 0 && <div className="text-zinc-800 italic uppercase tracking-widest text-center mt-20">System logs awaiting activity...</div>}
            {state.logs.map(log => (
              <div key={log.id} className="flex gap-8 group">
                <span className="text-zinc-800 text-[10px] w-24 shrink-0 font-black">{new Date(log.timestamp).toLocaleTimeString()}</span>
                <div className={`flex-1 ${log.type === 'success' ? 'text-yellow-500' : log.type === 'error' ? 'text-red-500' : 'text-zinc-500'}`}>
                    {log.msg}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="h-10 border-t border-zinc-900 px-12 flex items-center justify-between text-[8px] uppercase tracking-[0.5em] text-zinc-800 font-black">
        <span>Swapped Priority Logic</span>
        <span className="text-yellow-900 tracking-normal italic">Cerebras 70B Lead // Gemini Flash Sub</span>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 10px; }
      `}</style>
    </div>
  );
}