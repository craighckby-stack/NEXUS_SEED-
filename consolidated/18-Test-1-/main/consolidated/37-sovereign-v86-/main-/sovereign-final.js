// imports and config
import { useState, useEffect, useReducer, useRef, useCallback } from 'react';
import { initializeApp, getFirestore, getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from 'firebase/app';
import axios from 'axios';

const CONFIG = {
  CYCLE_INTERVAL: 4e3,
  MAX_HISTORY: 500,
  MODELS: [
    { id: 'llama-3.3-70b', label: 'Llama 3.3 70B (Elite)' },
    { id: 'llama-3.1-8b', label: 'Llama 3.1 8B (Fast)' },
  ],
  ALLOWED_EXT: /\.(js|jsx|ts|tsx|cjs|mjs|py|html|css|rs|go|json|md|c|cpp|h|hpp|java|rb|php|sh|yml|yaml|sql|dart|swift|kt)$/i,
  IGNORED_PATHS: [
    'node_modules',
    'dist',
    'build',
    '.git',
    '.ico',
    'package-lock.json',
    '.next',
    'vendor',
    'bin',
  ],
};

const firebaseApp = initializeApp({
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
});

const db = getFirestore(firebaseApp);
const auth = getAuth(firebaseApp);

// initial state
const initialState = {
  isLive: false,
  status: 'IDLE',
  activePath: 'System Ready',
  selectedModel: localStorage.getItem('emg_v88_model') || 'llama-3.3-70b',
  targetRepo: localStorage.getItem('emg_v88_repo') || '',
  cerebrasKey: localStorage.getItem('emg_v88_key') || '',
  ghToken: '',
  logs: [],
  metrics: { mutations: 0, progress: 0, errors: 0 },
};

// reducer function
function reducer(state, action) {
  switch (action.type) {
    case 'SET_VAL':
      if (['targetRepo', 'selectedModel', 'cerebrasKey'].includes(action.key)) {
        localStorage.setItem(`emg_v88_${action.key}`, action.value);
      }
      return { ...state, [action.key]: action.value };
    case 'TOGGLE':
      return {
        ...state,
        isLive: !state.isLive,
        status: !state.isLive ? 'INITIALIZING' : 'IDLE',
      };
    case 'LOG':
      return {
        ...state,
        logs: [...state.logs, { ...action.payload, id: Math.random() }].slice(-CONFIG.MAX_HISTORY),
      };
    case 'UPDATE_METRICS':
      return { ...state, metrics: { ...state.metrics, ...action.payload } };
    case 'SET_STATUS':
      return {
        ...state,
        status: action.value,
        activePath: action.path || state.activePath,
      };
    case 'RESET':
      return {
        ...initialState,
        logs: [],
        metrics: { mutations: 0, progress: 0, errors: 0 },
      };
    default:
      return state;
  }
}

// refactored app component
export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [user, setUser] = useState(null);

  const isProcessing = useRef(false);
  const queue = useRef([]);
  const cursor = useRef(parseInt(localStorage.getItem('emg_v88_cursor'), 10) || 0);
  const logEndRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('emg_v88_cursor', cursor.current);
  }, [cursor.current]);

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (process.env.INITIAL_AUTH_TOKEN) {
          await signInWithCustomToken(auth, process.env.INITIAL_AUTH_TOKEN);
        } else {
          await signInAnonymously(auth);
        }
      } catch (e) {
        setTimeout(initAuth, 2000);
      }
    };
    initAuth();
    return onAuthStateChanged(auth, setUser);
  }, [user]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [state.logs]);

  // utilities
  const pushLog = useCallback((msg, type = 'info') => {
    dispatch({ type: 'LOG', payload: { msg, type, timestamp: new Date().toISOString() } });
  }, []);

  const b64Decode = (str) => Buffer.from(str, 'base64').toString('utf8');
  const b64Encode = (str) => Buffer.from(str).toString('base64');

  // refactored run cycle
  const runCycle = useCallback(async () => {
    if (!state.isLive || isProcessing.current || !user) return;

    const { targetRepo, ghToken, cerebrasKey, selectedModel } = state;
    const repo = targetRepo.trim().replace(/^https?:\/\/github\.com\//, '').replace(/\/$/, '');
    const token = ghToken.trim();
    const key = cerebrasKey.trim();

    if (!repo || !token || !key) return;

    isProcessing.current = true;
    const headers = { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github.v3+json' };

    try {
      if (queue.current.length === 0) {
        dispatch({ type: 'SET_STATUS', value: 'INDEXING' });
        const rRes = await axios.get(`https://api.github.com/repos/${repo}`, { headers });
        const rData = rRes.data;
        const tRes = await axios.get(`https://api.github.com/repos/${repo}/git/trees/${rData.default_branch}?recursive=1`, { headers });
        const tData = tRes.data;
        queue.current = (tData.tree || [])
          .filter(f => f.type === 'blob' && !CONFIG.IGNORED_PATHS.some(p => f.path.includes(p)))
          .filter(f => !f.path.includes('.') || CONFIG.ALLOWED_EXT.test(f.path))
          .map(f => f.path);
        pushLog(`Universal Discovery: ${queue.current.length} assets ready.`, 'success');
      }

      if (cursor.current >= queue.current.length) {
        pushLog(`Cycle Reset. Re-scanning repository...`, 'success');
        cursor.current = 0;
        queue.current = [];
        isProcessing.current = false;
        return;
      }

      const path = queue.current[cursor.current];

      // 1. ATOMIC FETCH
      dispatch({ type: 'SET_STATUS', value: 'FETCHING', path });
      const fRes = await axios.get(`https://api.github.com/repos/${repo}/contents/${path}`, { headers });
      const fData = fRes.data;
      const raw = b64Decode(fData.content);

      // 2. INTENSE EVOLUTION
      dispatch({ type: 'SET_STATUS', value: 'EVOLVING', path });
      const aiRes = await axios.post('https://api.cerebras.ai/v1/chat/completions', JSON.stringify({
        model: selectedModel,
        messages: [
          {
            role: 'system',
            content: 'You are Sovereign, an elite software evolution engine. Your task is to refactor and improve the code provided. You must not return the same code. Look for: 1. Logic bottlenecks 2. Redundant operations 3. Naming clarity 4. Modern syntax adoption. Return ONLY the code.',
          },
        ],
        input: raw,
      }));
      isProcessing.current = false;
    } catch (error) {
      console.error(error);
      isProcessing.current = false;
    }
  }, [state, user]);

  useEffect(() => {
    const intervalId = setInterval(runCycle, CONFIG.CYCLE_INTERVAL);
    return () => clearInterval(intervalId);
  }, [runCycle]);

  return (
    <div>
      {/* Component Tree */}
      <div>
        {/* Display logs and metrics */}
        {/* Display status and active path */}
        {/* Display models and target repository */}
      </div>
    </div>
  );
}
```

**