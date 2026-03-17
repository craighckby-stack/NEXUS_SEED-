// constants.js
export const CORE_CONFIG = {
  MAX_FILE_SIZE: 500000,
  CYCLE_INTERVAL: 40000,
  MAX_RETRIES: 5,
  MODELS: [
    { id: 'gemini-2.5-flash-preview-09-2025', label: 'Flash 2.5 (Preview)', tier: 1 },
    { id: 'gemini-1.5-flash', label: 'Flash 1.5 (Stable)', tier: 2 },
    { id: 'gemini-1.5-pro', label: 'Pro 1.5 (High Power)', tier: 3 }
  ],
  PIPELINES: {
    CODE: [
      { id: 'refactor', label: 'Refactor', icon: '🛠️', text: 'Act as a Principal Engineer. Refactor for performance/readability.' },
      { id: 'security', label: 'Security', icon: '🛡️', text: 'Act as a Security Auditor. Fix vulnerabilities.' },
      { id: 'docs', label: 'Docs', icon: '📝', text: 'Act as a Technical Writer. Add JSDoc/Docstrings.' }
    ],
    CONFIG: [
      { id: 'validate', label: 'Lint', icon: '⚙️', text: 'Act as a DevOps Engineer. Validate syntax and sort keys.' }
    ],
    MARKDOWN: [
      { id: 'grammar', label: 'Clarity', icon: '✍️', text: 'Act as an Editor. Improve prose and formatting.' }
    ]
  },
  EXT_MAP: {
    code: /\.(js|jsx|ts|tsx|py|html|css|scss|sql|sh|java|go|rs|rb|php|cpp|c|h)$/i,
    config: /\.(json|yaml|yml|toml|ini)$/i,
    docs: /\.(md|txt|rst|adoc)$/i
  },
  SKIP_PATTERNS: [/node_modules\//, /\.min\./, /-lock\./, /dist\//, /build\//, /\.git\//],
  APP_ID: 'emg-v86-sovereign'
};

export const LS_MODEL_KEY = 'emg_active_model_v86';
export const LS_REPO_KEY = 'emg_repo_v86';
export const LS_QUEUE_KEY = 'emg_queue_v86';
export const LS_CURSOR_KEY = 'emg_cursor_v86';

// initialState.js
export const initialState = {
  isLive: false,
  isAcknowledged: false,
  isIndexed: false,
  status: 'IDLE',
  activePath: 'Ready for Uplink',
  pipelineStep: '',
  selectedModel: localStorage.getItem(LS_MODEL_KEY) || CORE_CONFIG.MODELS[0].id,
  targetRepo: localStorage.getItem(LS_REPO_KEY) || '',
  logs: [],
  insights: [],
  metrics: { mutations: 0, steps: 0, errors: 0, progress: 0 }
};

// reducer.js
export const reducer = (state, action) => {
  switch (action.type) {
    case 'SET_VAL': {
      if (['selectedModel', 'targetRepo'].includes(action.key)) {
        const lsKey = action.key === 'selectedModel' ? LS_MODEL_KEY : LS_REPO_KEY;
        localStorage.setItem(lsKey, action.value.toString());
      }
      return { ...state, [action.key]: action.value };
    }
    case 'ACKNOWLEDGE': return { ...state, isAcknowledged: true };
    case 'TOGGLE': return { ...state, isLive: !state.isLive, status: !state.isLive ? 'INITIALIZING' : 'IDLE' };
    case 'LOG': 
      return { ...state, logs: [action.payload, ...state.logs].slice(0, 50) };
    case 'SET_STATUS': return { ...state, status: action.value, activePath: action.path || state.activePath, pipelineStep: action.step || '' };
    case 'UPDATE_METRICS': 
      return { ...state, metrics: {
        mutations: state.metrics.mutations + (action.m || 0),
        steps: state.metrics.steps + (action.stepIncr || 0),
        errors: state.metrics.errors + (action.e || 0),
        progress: action.total ? Math.round((action.cursor / action.total) * 100) : state.metrics.progress
      }};
    case 'SET_INSIGHTS': return { ...state, insights: action.payload };
    default: return state;
  }
};

// utils.js
export const decodeBase64 = (str) => {
  try {
    return decodeURIComponent(atob(str).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
  } catch (e) {
    console.error("Base64 decode error:", e);
    return '';
  }
};

export const encodeBase64 = (str) => {
  try {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
      function(match, p1) {
        return String.fromCharCode(parseInt(p1, 16));
      }));
  } catch (e) {
    console.error("Base64 encode error:", e);
    return '';
  }
};

// App.js
import React, { useState, useEffect, useReducer, useRef, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, writeBatch, query, onSnapshot, 
  serverTimestamp, limit, doc
} from 'firebase/firestore';
import { 
  getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged 
} from 'firebase/auth';
import { CORE_CONFIG, LS_MODEL_KEY, LS_REPO_KEY, LS_QUEUE_KEY, LS_CURSOR_KEY, initialState, reducer, decodeBase64, encodeBase64 } from './constants';

const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const App = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [user, setUser] = useState(null);
  
  const ghTokenRef = useRef('');
  const geminiKeyRef = useRef('');
  const isBusy = useRef(false);
  const queueRef = useRef(JSON.parse(localStorage.getItem(LS_QUEUE_KEY)) || []);
  const indexRef = useRef(parseInt(localStorage.getItem(LS_CURSOR_KEY), 10) || 0);

  const pushLog = useCallback((msg, type = 'info') => {
    dispatch({ 
      type: 'LOG', 
      payload: { 
        msg, 
        type, 
        timestamp: new Date().toLocaleTimeString([], { hour12: false }),
        id: Date.now() 
      } 
    });
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else { 
          await signInAnonymously(auth); 
        }
      } catch (error) {
        console.error("Auth initialization failed, falling back to anonymous:", error);
        await signInAnonymously(auth);
      }
    };
    initAuth();
    return onAuthStateChanged(auth, setUser);
  }, []);

  useEffect(() => {
    if (!user) return;
    const insightsCollection = collection(db, 'artifacts', CORE_CONFIG.APP_ID, 'users', user.uid, 'insights');
    const q = query(insightsCollection, limit(15));
    
    return onSnapshot(q, (snap) => {
      const data = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
      dispatch({ type: 'SET_INSIGHTS', payload: data });
    });
  }, [user]);

  const geminiFetch = async (prompt, systemPrompt, modelId, apiKey, retryCount = 0) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent`;
    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      config: { 
        systemInstruction: systemPrompt,
        responseMimeType: "text/plain", 
        temperature: 0.1 
      }
    };

    try {
      const res = await fetch(url, { 
        method: 'POST', 
        headers: { 
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey 
        }, 
        body: JSON.stringify(payload) 
      });
      
      if (res.ok) return await res.json();
      
      if (res.status === 404 && modelId !== 'gemini-1.5-flash') {
        pushLog(`Model ${modelId} unavailable (404). Falling back to Flash 1.5.`, "error");
        dispatch({ type: 'SET_VAL', key: 'selectedModel', value: 'gemini-1.5-flash' });
        return geminiFetch(prompt, systemPrompt, 'gemini-1.5-flash', apiKey, 0);
      }

      if (retryCount < CORE_CONFIG.MAX_RETRIES) {
        const delay = 1000 * Math.pow(2, retryCount);
        pushLog(`AI Error ${res.status}. Retrying in ${delay / 1000}s...`, "warning");
        await new Promise(r => setTimeout(r, delay));
        return geminiFetch(prompt, systemPrompt, modelId, apiKey, retryCount + 1);
      }
      
      throw new Error(`AI ${res.status}`);

    } catch (e) {
      if (retryCount < CORE_CONFIG.MAX_RETRIES) {
        const delay = 1000 * Math.pow(2, retryCount);
        await new Promise(r => setTimeout(r, delay));
        return geminiFetch(prompt, systemPrompt, modelId, apiKey, retryCount + 1);
      }
      throw e;
    }
  };

  const runPipeline = async (path, repo, headers, geminiKey, modelId) => {
    try {
      const encodedPath = path.split('/').map(encodeURIComponent).join('/');
      const githubUrl = `https://api.github.com/repos/${repo}/contents/${encodedPath}`;
      
      const fRes = await fetch(githubUrl, { headers });
      if (!fRes.ok) throw new Error(`GitHub Fetch Error: ${fRes.status}`);
      const fData = await fRes.json();
      
      let currentContent = decodeBase64(fData.content);
      const { sha } = fData;

      let activePipeline = CORE_CONFIG.PIPELINES.CODE;
      if (CORE_CONFIG.EXT_MAP.config.test(path)) activePipeline = CORE_CONFIG.PIPELINES.CONFIG;
      else if (CORE_CONFIG.EXT_MAP.docs.test(path)) activePipeline = CORE_CONFIG.PIPELINES.MARKDOWN;

      let optimizedContent = currentContent;
      let successSteps = 0;

      for (const step of activePipeline) {
        dispatch({ type: 'SET_STATUS', value: 'OPTIMIZING', path, step: step.label });
        
        const systemPrompt = `${step.text}\nOutput ONLY the updated file content. NO markdown formatting blocks. NO preamble. NO chatter.`;
        const prompt = `Target File Path: ${path}\n\nExisting Content:\n${optimizedContent}`;

        const aiData = await geminiFetch(prompt, systemPrompt, modelId, geminiKey);
        let opt = aiData?.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (opt) {
          opt = opt.replace(/^```[a-z]*\n/i, '').replace(/\n```$/i, '').trim();
        }

        if (opt && opt !== optimizedContent && opt.length > 5) {
          optimizedContent = opt;
          successSteps++;
          dispatch({ type: 'UPDATE_METRICS', stepIncr: 1 });
        }
      }

      if (successSteps > 0) {
        const putRes = await fetch(githubUrl, {
          method: 'PUT',
          headers,
          body: JSON.stringify({ 
            message: `[Sovereign v86.15] Automatic Optimization: ${path} (${successSteps} steps)`, 
            content: encodeBase64(optimizedContent), 
            sha 
          })
        });
        return putRes.ok ? 'MUTATED' : `GH_PUT_${putRes.status}`;
      }
      return 'SKIPPED';
    } catch (e) { 
      return { status: 'ERROR', message: e.message }; 
    }
  };

  const runCycle = useCallback(async () => {
    if (!state.isLive || isBusy.current || !user || !state.isIndexed) return;
    
    isBusy.current = true;
    const target = queueRef.current[indexRef.current];

    if (!target) {
      pushLog("Full Vault Sync Complete. Stopping cycle.", "success");
      dispatch({ type: 'SET_VAL', key: 'isLive', value: false });
      isBusy.current = false;
      return;
    }

    try {
      const repo = state.targetRepo.replace(/^https?:\/\/github\.com\//, '').replace(/\/$/, '');
      const headers = { 
        'Authorization': `token ${ghTokenRef.current}`, 
        'Accept': 'application/vnd.github.v3+json' 
      };
      
      const result = await runPipeline(target, repo, headers, geminiKeyRef.current, state.selectedModel);

      if (result === 'MUTATED') {
        const insightsCollection = collection(db, 'artifacts', CORE_CONFIG.APP_ID, 'users', user.uid, 'insights');
        const batch = writeBatch(db);
        batch.set(doc(insightsCollection), { filePath: target, timestamp: serverTimestamp() });
        await batch.commit();
        
        pushLog(`Successfully Optimized: ${target}`, "success");
        dispatch({ type: 'UPDATE_METRICS', m: 1 });
      } else if (result.status === 'ERROR') {
        pushLog(`Failed: ${target} - ${result.message}`, "error");
        dispatch({ type: 'UPDATE_METRICS', e: 1 });
      } else if (result === 'SKIPPED') {
        pushLog(`Skipped (No change): ${target.split('/').pop()}`, "info");
      }

      indexRef.current += 1;
      localStorage.setItem(LS_CURSOR_KEY, indexRef.current.toString());
      dispatch({ type: 'UPDATE_METRICS', cursor: indexRef.current, total: queueRef.current.length });
      
    } catch (error) {
      pushLog(`Critical Cycle Error: ${error.message}`, "error");
      dispatch({ type: 'UPDATE_METRICS', e: 1 });
    } finally {
      isBusy.current = false;
      dispatch({ type: 'SET_STATUS', value: 'IDLE' });
    }
  }, [state.isLive, state.targetRepo, state.selectedModel, state.isIndexed, user, pushLog]);

  useEffect(() => {
    if (!state.isLive) return;
    const t = setInterval(runCycle, CORE_CONFIG.CYCLE_INTERVAL);
    runCycle(); 
    return () => clearInterval(t);
  }, [state.isLive, runCycle]);

  const startIndexing = async () => {
    if (!state.targetRepo || !ghTokenRef.current) {
      pushLog("Indexing requires a Vault Identifier and GitHub Key.", "error");
      return;
    }
    
    try {
      dispatch({ type: 'SET_STATUS', value: 'INDEXING' });
      const repo = state.targetRepo.replace(/^https?:\/\/github\.com\//, '').replace(/\/$/, '');
      const headers = { 'Authorization': `token ${ghTokenRef.current}`, 'Accept': 'application/vnd.github.v3+json' };
      
      const repoRes = await fetch(`https://api.github.com/repos/${repo}`, { headers });
      if (!repoRes.ok) throw new Error(`Repo Access Error: ${repoRes.status}`);
      const repoData = await repoRes.json();
      const defaultBranch = repoData.default_branch;

      const treeRes = await fetch(`https://api.github.com/repos/${repo}/git/trees/${defaultBranch}?recursive=1`, { headers });
      if (!treeRes.ok) throw new Error(`Tree Fetch Error: ${treeRes.status}`);
      const treeData = await treeRes.json();
      
      const files = (treeData?.tree || [])
        .filter(f => {
          if (f.type !== 'blob' || f.size >= CORE_CONFIG.MAX_FILE_SIZE) return false;
          
          const isTargetExt = CORE_CONFIG.EXT_MAP.code.test(f.path) || 
                              CORE_CONFIG.EXT_MAP.config.test(f.path) || 
                              CORE_CONFIG.EXT_MAP.docs.test(f.path);
          if (!isTargetExt) return false;

          const isSkipped = CORE_CONFIG.SKIP_PATTERNS.some(p => p.test(f.path));
          return !isSkipped;
        })
        .map(f => f.path);

      queueRef.current = files;
      localStorage.setItem(LS_QUEUE_KEY, JSON.stringify(files));
      indexRef.current = 0;
      localStorage.setItem(LS_CURSOR_KEY, '0');
      
      dispatch({ type: 'SET_VAL', key: 'isIndexed', value: true });
      pushLog(`Indexing Success: ${files.length} artifacts filtered from ${defaultBranch}`, "success");
      
    } catch (e) { 
      pushLog(`GitHub Index Error: ${e.message}`, "error"); 
    } finally { 
      dispatch({ type: 'SET_STATUS', value: 'IDLE' }); 
    }
  };

  if (!state.isAcknowledged) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-8 text-white font-mono">
        <div className="max-w-md w-full p-12 rounded-[2.5rem] bg-zinc-900 border border-emerald-500/20 text-center shadow-2xl">
          <div className="text-5xl mb-6 animate-pulse">📡</div>
          <h1 className="text-3xl font-black uppercase tracking-tighter mb-2 text-white">Sovereign <span className="text-emerald-500">v86.15</span></h1>
          <p className="text-[10px] text-emerald-500/60 uppercase tracking-[0.5em] mb-12 font-bold italic">Resilient Routing Protocol</p>
          <button 
            onClick={() => dispatch({ type: 'ACKNOWLEDGE' })} 
            className="w-full py-5 bg-emerald-600 rounded-xl font-black uppercase text-[11px] tracking-widest hover:bg-emerald-500 transition-all text-white shadow-lg shadow-emerald-500/20 active:scale-95"
          >
            Establish Link
          </button>
        </div>
      </div>
    );
  }

  const inputFields = [
    { id: 'targetRepo', label: 'Vault Identifier (user/repo)', ph: 'e.g. facebook/react', type: 'text', value: state.targetRepo, onChange: (e) => dispatch({ type: 'SET_VAL', key: 'targetRepo', value: e.target.value }) },
    { id: 'token', label: 'GitHub Access Key', ph: 'ghp_...', type: 'password', ref: ghTokenRef },
    { id: 'apiKey', label: 'AI Interface Key', ph: 'AIza...', type: 'password', ref: geminiKeyRef }
  ];

  const metricCards = [
    { label: 'Mutations', val: state.metrics.mutations, color: 'text-emerald-500' },
    { label: 'Artifacts', val: queueRef.current.length, color: 'text-zinc-500' },
    { label: 'Coverage', val: `${state.metrics.progress}%`, color: 'text-white' },
    { label: 'Faults', val: state.metrics.errors, color: 'text-red-600' }
  ];

  return (
    <div className="min-h-screen bg-[#020202] text-zinc-300 p-4 md:p-8">
      {/* Render UI components here */}
    </div>
  );
};

export default App;