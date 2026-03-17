// src/App.js
import {
  useState,
  useEffect,
  useReducer,
  useRef,
  useCallback
} from 'react';
import { initializeApp, getFirestore, getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from 'firebase/app';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { GitHub } from 'github-api';
import { useAuthState } from 'react-firebase-hooks/auth';
import { config } from './config.json';
import { loadEnv } from './env';

const initialState = {
  isLive: false,
  isAcknowledged: false,
  status: 'IDLE',
  activePath: 'Ready',
  selectedModel: process.env.REACT_APP_ACTIVE_MODEL ?? config.MODELS[0].id,
  targetRepo: process.env.REACT_APP_TARGET_REPO ?? '',
  geminiKeys: Array(10).fill(''),
  keyHealth: {},
  currentCycle: 1,
  logs: [],
  metrics: { mutations: 0, progress: 0 }
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'SET_VAL':
      if (action.key === 'targetRepo') localStorage.setItem('targetRepo', action.value);
      if (action.key === 'selectedModel') localStorage.setItem('selectedModel', action.value);
      return { ...state, [action.key]: action.value };
    case 'MARK_KEY_HEALTH':
      return { ...state, keyHealth: { ...state.keyHealth, [action.index]: { blocked: action.blocked, resetAt: action.resetAt } } };
    case 'INCREMENT_CYCLE':
      return { ...state, currentCycle: state.currentCycle + 1, metrics: { ...state.metrics, progress: 0 } };
    case 'ACKNOWLEDGE':
      return { ...state, isAcknowledged: true };
    case 'TOGGLE':
      return { ...state, isLive: !state.isLive, status: !state.isLive ? 'BOOTING' : 'IDLE' };
    case 'LOG':
      return { ...state, logs: [{ id: uuidv4(), ...action.payload }, ...state.logs].slice(0, 50) };
    case 'UPDATE_METRICS':
      return { ...state, metrics: { ...state.metrics, ...action.payload } };
    case 'SET_STATUS':
      return { ...state, status: action.value, activePath: action.path || state.activePath };
    default:
      return state;
  }
};

const useEnvironment = () => {
  const loadEnvData = useCallback(() => loadEnv(), []);
  return { ...loadEnvData() };
};

const useGithub = (token) => {
  const [github, setGithub] = useState(null);
  useEffect(() => {
    if (!token) return;
    setGithub(new GitHub({ token }));
  }, [token]);
  return github;
};

const App = () => {
  const { isLive, isAcknowledged, status, activePath, selectedModel, targetRepo, geminiKeys, keyHealth, currentCycle, logs, metrics } = initialState;
  const [state, dispatch] = useReducer(reducer, initialState);
  const [user, loading, error] = useAuthState(getAuth());
  const ghTokenRef = useRef('');
  const geminiKeyIndexRef = useRef(0);
  const isBusy = useRef(false);
  const queueRef = useRef([]);
  const indexRef = useRef(0);
  const mutationsHistory = useRef([]);

  const { REACT_APP_ACTIVE_MODEL, REACT_APP_TARGET_REPO } = useEnvironment();

  useEffect(() => {
    if (!loading && !error) runCycle();
  }, [user]);

  useEffect(() => {
    const initAuth = async () => {
      if (REACT_APP_INITIAL_AUTH_TOKEN) await signInWithCustomToken(getAuth(), REACT_APP_INITIAL_AUTH_TOKEN);
      else await signInAnonymously(getAuth());
    };
    initAuth();
    return onAuthStateChanged(getAuth(), (user) => user && runCycle());
  }, []);

  const getNextKey = () => {
    const validKeys = state.geminiKeys.map((k, i) => ({ k: k.trim(), i }));
    const filteredKeys = validKeys.filter(node => node.k !== '');
    if (filteredKeys.length === 0) throw new Error("Cluster Empty");
    const health = state.keyHealth[filteredKeys[0].i];
    if (!health?.blocked || health.resetAt < Date.now()) {
      geminiKeyIndexRef.current = (filteredKeys.indexOf(filteredKeys.find(node => node.k !== '')) + 1) % filteredKeys.length;
      return filteredKeys[0].k;
    }
    throw new Error("Cluster Overheat");
  };

  const github = useGithub(ghTokenRef.current);

  const syncProjectDocs = async (repo) => {
    if (mutationsHistory.current.length === 0) return;
    dispatch({ type: 'SET_STATUS', value: 'CHRONICLING' });

    try {
      const docs = ['README.md', 'TODO.md'];
      for (const docName of docs) {
        const { data } = await github.repos.getContents(repo, docName);
        let content = atob(data.content);
        const timestamp = new Date().toLocaleString();

        const logEntry = `\n\n### 🏛️ Sovereign Pass ${state.currentCycle} [${timestamp}]\n` + 
                         mutationsHistory.current.map(m => `- **${m.path}**: ${m.change}`).join('\n');

        if (docName === 'README.md') {
          content = content.includes('## 📜 Audit Log') ? 
                    content.replace('## 📜 Audit Log', `## 📜 Audit Log${logEntry}`) : 
                    content + `\n\n## 📜 Audit Log${logEntry}`;
        } else if (docName === 'TODO.md') {
          content += `\n\n- [x] Completed Architectural Pass ${state.currentCycle} (${timestamp})`;
        }

        const { data: updateData } = await github.repos.updateContents(repo, docName, {
          message: `[Chronicler] Update ${docName} - Pass ${state.currentCycle}`,
          content: btoa(unescape(encodeURIComponent(content))),
          sha: data.sha
        });
        dispatch({ type: 'LOG', payload: { id: uuidv4(), message: `Synchronized ${docName}`, timestamp } });
      }
    } catch (e) { 
      dispatch({ type: 'LOG', payload: { id: uuidv4(), message: "Sync Error: " + e.message, timestamp, type: 'error' } }); 
    }
    mutationsHistory.current = [];
  };

  const runCycle = async () => {
    if (!isLive || isBusy.current || !user) return;
    isBusy.current = true;

    try {
      const repo = targetRepo.trim().replace(/^https?:\/\/github\.com\//, '');
      if (queueRef.current.length === 0) {
        dispatch({ type: 'SET_STATUS', value: 'INDEXING' });
        const { data } = await github.repos.get(repo);
        const { data: treeData } = await github.repos.getTree(repo, data.default_branch);
        queueRef.current = treeData.tree.filter(f => f.type === 'blob' && f.path.match(/\.(js|jsx|ts|tsx|py|html|css|json)$/i)).map(f => f.path);
      }

      if (indexRef.current >= queueRef.current.length) {
        await syncProjectDocs(repo);
        dispatch({ type: 'LOG', payload: { id: uuidv4(), message: `Pass ${state.currentCycle} Complete.`, timestamp } });
        indexRef.current = 0;
        localStorage.setItem('index', "0");
        dispatch({ type: 'INCREMENT_CYCLE' });
        isBusy.current = false;
        return;
      }

      const path = queueRef.current[indexRef.current];
      if (['README.md', 'TODO.md'].includes(path)) { indexRef.current++; isBusy.current = false; return; }

      dispatch({ type: 'SET_STATUS', value: 'REFACTORING', path });

      const { data } = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${getNextKey()}`, {
        contents: [{ parts: [{ text: `TASK: Fully optimize and refactor.
          MANDATORY: Return full code first, then append "Full log"` }]}]
      }, { headers: { 'Authorization': `token ${ghTokenRef.current}`, 'Accept': 'application/vnd.github.v3+json' } });

      // Process the generated content
      const content = data.contents[0].parts[0].text;
      // ... (rest of the code remains the same)
    } catch (e) { 
      dispatch({ type: 'LOG', payload: { id: uuidv4(), message: "Error: " + e.message, timestamp, type: 'error' } }); 
      isBusy.current = false; 
    }
    isBusy.current = false;
  };

  useEffect(() => {
    const intervalId = setInterval(runCycle, config.CYCLE_INTERVAL);
    return () => clearInterval(intervalId);
  }, [isLive, user]);

  return (
    // Render the App component
  );
};

export default App;
```
```javascript
// src/env.js
import dotenv from 'dotenv';
import { loadJson } from 'fs-extra';

dotenv.config();

const loadEnv = async () => {
  const env = {};
  const secret = await loadJson('.env');
  env.REACT_APP_ACTIVE_MODEL = secret.REACT_APP_ACTIVE_MODEL;
  env.REACT_APP_TARGET_REPO = secret.REACT_APP_TARGET_REPO;
  env.REACT_APP_INITIAL_AUTH_TOKEN = secret.REACT_APP_INITIAL_AUTH_TOKEN;
  return env;
};

export { loadEnv };
```
```javascript
// src/config.json
{
  "CYCLE_INTERVAL": 6000,
  "MODELS": [
    { "id": "gemini-2.5-flash-lite-preview-09-2025", "label": "Flash Lite (Speed)" },
    { "id": "gemini-2.5-flash-preview-09-2025", "label": "Flash 2.5 (Pro)" },
    { "id": "gemini-3-flash-preview-09-2025", "label": "Flash 3.0 (Exp)" }
  ]
}