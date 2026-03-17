// Import dependencies
import { createMachine, assign, assignValue } from 'xstate';
import firebase from 'firebase/app';
import {
  getAuth,
  signInWithCustomToken,
  signInAnonymously,
  onAuthStateChanged,
  getToken,
} from 'firebase/auth';
import fetch from 'node-fetch';

// Configuration & Constants
const config = {
  MAX_FILE_SIZE_BYTES: Math.pow(10, 6),
  CYCLE_INTERVAL_MS: 15000,
  MAX_API_RETRIES: 5,
  LOCAL_STORAGE_PREFIX: 'emg_v86_',
  LOG_HISTORY_LIMIT: 60,
  GITHUB_API_BASE: 'https://api.github.com',
  GEMINI_API_BASE: 'https://generativelanguage.googleapis.com/v1beta',
};

const models = [
  { id: 'gemini-2.5-flash-preview-09-2025', label: 'Flash 2.5 Preview (Default)', tier: 1 },
  { id: 'gemini-1.5-flash', label: 'Flash 1.5 Stable', tier: 2 },
];

const pipelineSteps = {
  CODE: [
    { id: 'refactor', label: 'Refactor', prompt: 'Act as a Senior Software Engineer adhering strictly to the Rock Principle.' },
  ],
  CONFIG: [
    { id: 'validate', label: 'Lint', prompt: 'Act as a DevOps Engineer. Optimize configurations.' },
  ],
  DOCS: [
    { id: 'clarify', label: 'Editor', prompt: 'Act as a Technical Writer. Improve clarity of documentation.' },
  ],
};

const fileExtensions = {
  CODE: /\.(js|jsx|ts|tsx|py|html|css|scss|sql|sh|java|go|rs|rb|php|cpp|c|h)$/i,
  CONFIG: /\.(json|yaml|yml|toml|ini)$/i,
  DOCS: /\.(md|txt|rst|adoc|text)$/i,
};

const skipPatterns = [
  /node_modules\//, /\.min\./, /-lock\./, /dist\//, /build\//, /\.git\//, /\.log$/,
  /\/\.\.(?!\/|$)/i, // Added pattern to skip dot files
];

const todoFileNames = ['.sovereign-instructions.md', 'sovereign-todo.md', 'instructions.md'];

const persistKeys = new Set(['selectedModel', 'targetRepo']);

// Utility functions
const base64Decode = (str) => {
  if (!str) return '';
  const binaryString = atob(str);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new TextDecoder('utf-8').decode(bytes);
};

const base64Encode = (str) => {
  if (!str) return '';
  const bytes = new TextEncoder().encode(str);
  const binaryString = String.fromCharCode(...bytes);
  return btoa(binaryString);
};

const parseRepoPath = (repoString) => {
  if (!repoString) return null;
  const cleanString = repoString
    .replace(/^(https?:\/\/)?(www\.)?github\.com\//i, '')
    .replace(/\/$/, '');
  const match = cleanString.match(/^([^/]+)\/([^/]+)$/);
  return match ? [match[1], match[2]] : null;
};

const getPipeline = (filePath) => {
  if (fileExtensions.CONFIG.test(filePath)) return pipelineSteps.CONFIG;
  if (fileExtensions.DOCS.test(filePath)) return pipelineSteps.DOCS;
  return pipelineSteps.CODE;
};

// External service logic
class GithubService {
  async callGithubApi(url, method = 'GET', token, body = null, signal = null) {
    if (!token) throw new Error('GitHub token not provided.');
    const headers = {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
    };
    const config = { method, headers, signal };
    if (body) {
      if (method === 'POST' || method === 'PUT') {
        config.headers['Content-Type'] = 'application/json';
        config.body = JSON.stringify(body);
      }
    }
    const response = await fetch(url, config);
    if (!response.ok) {
      let errorDetail = await response.json().catch(() => ({ message: `HTTP Error ${response.status}` }));
      throw new Error(`GitHub API Error (${response.status}): ${errorDetail.message || 'Unknown Error'}`);
    }
    if (response.status === 204) return null;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    return response.text();
  }
}

class LlmService {
  async callGeminiApiWithRetry(payload, modelId, apiKey, signal, addLog, isLive, retryCount = 0) {
    const url = `${config.GEMINI_API_BASE}/models/${modelId}:generateContent?key=${apiKey}`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal,
      });
      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        const message = errorBody.error.message || `HTTP ${res.status}`;
        throw new Error(`API Error: ${message}`);
      }
      const data = await res.json();
      const text = data.candidates[0].content.parts[0].text;
      if (!text) throw new Error("Empty or Malformed Response from LLM");
      let cleanedText = text.trim();
      cleanedText = cleanedText
        .replace(/^```\w*\n/i, '')
        .replace(/\n``$\n/i, '')
        .trim();
      const preambleRegex = /^(?:Here is the source code|I have refactored the file|The revised content is|I've updated the plan|```\w*)\s*[:\n]+/i;
      cleanedText = cleanedText.replace(preambleRegex, '').trim();
      return cleanedText;
    } catch (e) {
      if (e.name === 'AbortError') throw e;
      if (retryCount < config.MAX_API_RETRIES && isLive) {
        const delay = Math.pow(2, retryCount) * 1000;
        addLog(`API call failed for ${modelId}. Retrying in ${delay / 1000}s...`, 'warning');
        await new Promise((r) => setTimeout(r, delay));
        return LlmService.callGeminiApiWithRetry(payload, modelId, apiKey, signal, addLog, isLive, retryCount + 1);
      }
      throw e;
    }
  }
}

// State machine
const machine = createMachine({
  id: 'session',
  initial: 'idle',
  context: {
    isLive: false,
    isAcknowledged: false,
    isIndexed: false,
    isComplete: false,
    status: 'IDLE',
    activePath: 'Ready',
    selectedModel: models[0].id,
    targetRepo: '',
    logs: [],
    metrics: { mutations: 0, steps: 0, errors: 0, progress: 0 },
  },
  states: {
    idle: {
      on: {
        START: {
          target: 'indexing',
          actions: assignValue('isLive', true),
        },
      },
    },
    indexing: {
      on: {
        INDEX_COMPLETE: {
          target: 'idle',
          actions: assign('isIndexed', (context) => true),
        },
      },
    },
    live: {
      on: {
        STOP: {
          target: 'idle',
          actions: assignValue('isLive', false),
        },
      },
    },
  },
});

// Custom hooks and core logic
function useFirebaseAuth(setUser) {
  const [firebaseReady, setFirebaseReady] = firebase.useState(false);
  firebase.useEffect(() => {
    const loadFirebase = async () => {
      try {
        const app = await firebase.initializeApp();
        const auth = firebase.getAuth(app);
        firebase.onAuthStateChanged(auth, (user) => {
          setUser(user);
          setFirebaseReady(true);
        });
      } catch (error) {
        console.error('Error initializing Firebase:', error);
        setFirebaseReady(false);
      }
    };
    loadFirebase();
  }, []);
  return firebaseReady;
}

// Export dependencies
export {
  config,
  models,
  pipelineSteps,
  fileExtensions,
  skipPatterns,
  todoFileNames,
  persistKeys,
  GithubService,
  LlmService,
  machine,
  useFirebaseAuth,
  base64Decode,
  base64Encode,
  parseRepoPath,
  getPipeline,
};
```

**