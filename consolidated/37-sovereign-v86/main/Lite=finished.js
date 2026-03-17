import { useState, useEffect, useReducer, useCallback, useRef } from 'react';
import { initializeApp, getFirestore, serverTimestamp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { v4 as uuidv4 } from 'uuid';
import fetch from 'node-fetch';

const AppConfig = {
  MAX_FILE_SIZE_BYTES: 500_000,
  PROCESSING_CYCLE_MS: 6000, // milliseconds
  MAX_API_RETRIES: 5,
  API_TIMEOUT_MS: 60000, // milliseconds
  LOCAL_STORAGE_PREFIX: 'sov_v86_',
  LOG_HISTORY_LIMIT: 40,
  SYSTEM_ID: typeof __app_id !== 'undefined' ? __app_id : 'sovereign-lite-v86',
};

const ApiModels = [
  { id: 'gemini-2.5-flash-preview-09-2025', label: 'Flash 2.5 Preview', tier: 1 },
  { id: 'gemini-1.5-flash', label: 'Flash 1.5 Stable', tier: 2 },
];

const ProcessingPipelines = {
  CODE: [{ id: 'refactor', label: 'Optimizing Architecture' }],
  MARKDOWN: [{ id: 'prose', label: 'Improving Clarity' }],
};

const FileExtensions = {
  CODE: /\.?(js|jsx|ts|tsx|py|html|css|cpp|rs|go|php|java|sql)$/,
  DOCS: /\.?(md|txt|adoc)$/,
};

const SkipPatterns = [
  /node_modules\//,
  /\.min\./,
  /-lock\./,
  /dist\//,
  /build\//,
  /\.git\//,
  /\.png$|\.jpg$|\.jpeg$|\.gif$/i,
];

const GithubApiBase = 'https://api.github.com/repos';
const GeminiApiBase = 'https://generativelanguage.googleapis.com/v1beta/models';

const decodeB64 = (str) => {
  try {
    return atob(str).replaceAll('.', '%');
  } catch (e) {
    return '';
  }
};

const encodeB64 = (str) => btoa(str);

const parseRepo = (path) => {
  const match = path.match(/github\.com\/([^/]+)\/([^/]+)/);
  return match ? { owner: match[1], repo: match[2].replace(/\.git$/i, '') } : null;
};

const cleanAIOutput = (text) => {
  if (!text) return '';

  const fenceMatch = text.match(/^\s*```[a-z]*\n([\s\S]*?)\n```\s*$/i);
  if (fenceMatch) {
    return fenceMatch[1].trim();
  }

  if (text.startsWith('```') && text.endsWith('```')) {
    return text.slice(3, -3).trim();
  }

  return text.trim();
};

const initialState = {
  isLive: false,
  isIndexed: false,
  isComplete: false,
  status: 'IDLE',
  activePath: 'Ready for Uplink',
  selectedModel: AppConfig.SYSTEM_ID === 'sovereign-lite-v86' ? ApiModels[0].id : localStorage.getItem(`${AppConfig.LOCAL_STORAGE_PREFIX}model`) || ApiModels[0].id,
  targetRepo: localStorage.getItem(`${AppConfig.LOCAL_STORAGE_PREFIX}repo`) || '',
  logs: [],
  metrics: { mutations: 0, steps: 0, errors: 0, progress: 0, totalFiles: 0 },
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'SET_REPO':
      localStorage.setItem(`${AppConfig.LOCAL_STORAGE_PREFIX}repo`, action.payload);
      return { ...state, targetRepo: action.payload };
    case 'SET_MODEL':
      localStorage.setItem(`${AppConfig.LOCAL_STORAGE_PREFIX}model`, action.payload);
      return { ...state, selectedModel: action.payload };
    case 'TOGGLE_LIVE':
      return {
        ...state,
        isLive: !state.isLive,
        status: !state.isLive ? 'INITIALIZING' : 'HALTED',
      };
    case 'SET_INDEXED':
      return {
        ...state,
        isIndexed: action.payload.value,
        metrics: { ...state.metrics, totalFiles: action.payload.total || state.metrics.totalFiles },
      };
    case 'UPDATE_METRICS':
      return {
        ...state,
        metrics: {
          ...state.metrics,
          ...(action.payload || {}),
          progress: action.payload.cursor !== undefined && state.metrics.totalFiles > 0
            ? Math.floor((action.payload.cursor / state.metrics.totalFiles) * 100)
            : state.metrics.progress,
        },
      };
    case 'ADD_LOG':
      return {
        ...state,
        logs: [
          ...(action.payload ? [{ id: uuidv4(), ...action.payload }] : []),
          ...state.logs.slice(0, AppConfig.LOG_HISTORY_LIMIT),
        ],
      };
    case 'SET_STATUS':
      return { ...state, status: action.payload.text, activePath: action.payload.path || state.activePath };
    case 'COMPLETE':
      return {
        ...state,
        isLive: false,
        isComplete: true,
        status: 'FINISHED',
        activePath: 'System Nominal',
      };
    case 'RESET':
      return {
        ...initialState,
        targetRepo: state.targetRepo,
        selectedModel: state.selectedModel,
      };
    default:
      return state;
  }
};

const useAbortController = () => {
  const abortControllerRef = useRef(new AbortController());
  useEffect(() => {
    return () => {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    };
  }, []);
  return abortControllerRef;
};

const robustFetcher = useCallback(async (url, options) => {
  try {
    const response = await fetch(url, { ...options, signal: useAbortController().current.signal });
    if (!response.ok) {
      throw new Error(`Fetch failed with status ${response.status}`);
    }
    return response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      return null;
    }
    console.error('Fetch failed:', error);
    throw error;
  }
}, []);

const fetchWithRetries = async (url, options, retries = 0) => {
  try {
    return await robustFetcher(url, options);
  } catch (error) {
    if (error.message === 'Fetch failed with status 429') {
      return fetchWithRetries(url, options, retries + 1);
    }
    throw error;
  }
};

export { AppConfig, ApiModels, ProcessingPipelines, FileExtensions, SkipPatterns, GithubApiBase, GeminiApiBase, decodeB64, encodeB64, parseRepo, cleanAIOutput, initialState, reducer, useAbortController, robustFetcher, fetchWithRetries };
```

**