/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal, Cpu, Database, Activity, AlertTriangle, Shield, RefreshCw, FileCode, Sparkles, Square, Play, RotateCcw, FileText, Trash2 } from 'lucide-react';
import { PromptService, SystemPrompts } from './services/promptService';

interface LogEntry {
  timestamp: string;
  message: string;
  color?: string;
}

interface MetaState {
  name: string;
  status: string;
  round: number;
  lifecycle: string;
  config: {
    Core: {
      version: string;
      mode: string;
    };
  };
  logs: string[];
  license: string;
}

export default function App() {
  const [isRunning, setIsRunning] = useState(false);
  const [status, setStatus] = useState('INIT');
  const [round, setRound] = useState(0);
  const [syncStatus, setSyncStatus] = useState('READY');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [currentCode, setCurrentCode] = useState('// Lifecycle: STANDBY');
  const [meta, setMeta] = useState<MetaState | null>(null);
  const [showSaturation, setShowSaturation] = useState(false);
  const [repoFiles, setRepoFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState('nexus_core.js');
  const [processAll, setProcessAll] = useState(false);
  const [resumeMode, setResumeMode] = useState(true);
  const [chainedContext, setChainedContext] = useState('');
  const [currentVote, setCurrentVote] = useState('');
  const [sourceDNA, setSourceDNA] = useState<string>('');
  const [dnaSignature, setDnaSignature] = useState<string>('');
  const [isAnalyzingDNA, setIsAnalyzingDNA] = useState(false);
  const [saturationGuidelines, setSaturationGuidelines] = useState<string>('');
  const [isAnalyzingSaturation, setIsAnalyzingSaturation] = useState(false);
  const [prompts, setPrompts] = useState<SystemPrompts | null>(null);
  const [isOptimizingPrompts, setIsOptimizingPrompts] = useState(false);
  const [siphonedRepos, setSiphonedRepos] = useState<string[]>([]);

  const [targetRepo, setTargetRepo] = useState("craighckby-stack/Test-1");
  const [originalBranch, setOriginalBranch] = useState("System"); // Hardcoded backup branch
  const logEndRef = useRef<HTMLDivElement>(null);
  const lastPushedLogIndex = useRef(0);
  const [lastValidation, setLastValidation] = useState<{ valid: boolean; reason?: string } | null>(null);

  const abortRef = useRef(false);

  const NEXUS_CORE_TEMPLATE = `class Config {
  static get staticConfig() {
    return {
      VERSION: "1.0.0",
      env: process.env.NODE_ENV || "development"
    };
  }

  constructor(values = {}) {
    this.setValues(values);
  }

  setValues(values) {
    Object.assign(this, values);
  }

  static get defaultConfig() {
    return {
      foo: 'bar',
      baz: true
    };
  }

  static get configSchema() {
    return {
      type: 'object',
      properties: {
        foo: { type: 'string' },
        baz: { type: 'boolean' }
      }
    };
  }

  validate() {
    try {
      const schema = Config.configSchema;
      const validator = new (require('jsonschema').Validator)();
      validator.checkSchema(schema);
      validator.validate(this, schema);
    } catch (e) {
      console.error('Config validation error:', e);
      throw e;
    }
  }
}

class LifecycleEvent {
  constructor(event) {
    this.event = event;
  }
}

class LifecycleHandler {
  constructor(handler) {
    this.handler = handler;
  }

  bind(target = this) {
    this.handler = this.handler.bind(target);
  }

  execute() {
    this.handler();
  }
}

class NexusCore {
  #lifecycle = {
    configured: false,
    loaded: false,
    shuttingDown: false
  };

  #status = "INIT";

  get status() {
    return this.#status;
  }

  set status(value) {
    this.#status = value;
    const currentValue = this.#status;
    const lifecycle = this.#lifecycle;
    if (value !== 'INIT') {
      console.log(\`NexusCore instance is \${value}.\`);
      if (value === 'SHUTDOWN') {
        lifecycle.shuttingDown = false;
      }
    }
    if (currentValue === 'INIT' && value !== 'INIT') {
      lifecycle.configured = true;
    }
  }

  get lifecycle() {
    return this.#lifecycle;
  }

  configure(config) {
    this.validateConfig(config);
    this.onLifecycleEvent("CONFIGURED");
    this.#lifecycle.configured = true;
    this.config = config;
  }

  validateConfig(config) {
    const configSchema = Config.configSchema;
    try {
      const validator = new (require('jsonschema').Validator)();
      validator.checkSchema(configSchema);
      validator.validate(config, configSchema);
    } catch (e) {
      console.error('Config validation error:', e);
      throw e;
    }
  }

  onLifecycleEvent(event, handler) {
    const lifecycleHandler = new LifecycleHandler(handler);
    this.#lifecycle[event] = lifecycleHandler;
  }

  get on() {
    return (event, handler) => {
      const lifecycleEvent = new LifecycleEvent(event);
      this.onLifecycleEvent(event, handler);
    };
  }

  executeLifecycleEvent(event) {
    if (this.#lifecycle[event]) {
      this.#lifecycle[event].bind(this).execute();
    }
  }

  async load() {
    await this.executeLifecycleEvent("CONFIGURED");
    try {
      console.log("Loading...");
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log("Loading complete...");
      this.#lifecycle.loaded = true;
      this.executeLifecycleEvent("LOADED");
    } catch (e) {
      console.error('Load error:', e);
    }
  }

  async shutdown() {
    try {
      if (!this.#lifecycle.shuttingDown) {
        console.log("Shutdown initiated...");
        this.#lifecycle.shuttingDown = true;
        this.executeLifecycleEvent("SHUTTING_DOWN");
        console.log("Shutdown complete...");
        this.status = "SHUTDOWN";
      }
    } catch (e) {
      console.error("Shutdown error:", e);
    }
  }

  async start() {
    const startMethodOrder = ["configure", "load", "shutdown"];
    for (const methodName of startMethodOrder) {
      if (this[methodName] instanceof Function) {
        await this[methodName]();
      }
    }
  }

  async destroy() {
    this.status = "DESTROYED";
    this.#lifecycle = {
      configured: false,
      loaded: false,
      shuttingDown: false
    };
  }

  async on(event, handler) {
    await this.onLifecycleEvent(event, handler);
  }
}

const nexusCore = new NexusCore();
nexusCore.on('DESTROYED', () => {
  console.log("NexusCore instance destroyed.");
});
nexusCore.configure(Config.defaultConfig);
nexusCore.start();
nexusCore.load();
nexusCore.shutdown();
nexusCore.destroy();`;

  useEffect(() => {
    const loadPrompts = async () => {
      const p = await PromptService.getPrompts();
      setPrompts(p);
    };
    loadPrompts();
  }, []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  useEffect(() => {
    fetchRepoFiles();
  }, []);

  const handleDNAUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    addLog(`UPLOADING SOURCE DNA: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)...`, "var(--color-dalek-gold)");
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      setSourceDNA(text);
      
      setIsAnalyzingDNA(true);
      addLog("ANALYZING DNA STRUCTURE: EXTRACTING CORE PATTERNS...", "var(--color-dalek-gold)");
      
      // Since 25MB is too large for a single prompt, we'll take a significant sample 
      // or summarize if we had a chunking logic. For now, let's take the first 500KB 
      // as a representative sample for pattern extraction.
      const sample = text.slice(0, 500000); 
      
      const signature = await callGemini(
        `Analyze this source code/data and extract its most advanced architectural patterns, 
        coding styles, and logic structures into a dense "DNA Signature" (max 2000 words). 
        This signature will be used to siphon logic into other files.
        
        SOURCE SAMPLE:
        ${sample}`,
        "You are a Master Architect specializing in pattern extraction and code siphoning."
      );
      
      if (signature) {
        setDnaSignature(signature);
        addLog("DNA SIGNATURE EXTRACTED AND INSTANTIATED.", "var(--color-dalek-green)");
      } else {
        addLog("DNA ANALYSIS FAILED: USING RAW SAMPLE AS FALLBACK.", "var(--color-dalek-red)");
        setDnaSignature(sample.slice(0, 5000)); // Fallback to a small slice
      }
      setIsAnalyzingDNA(false);
    };
    reader.readAsText(file);
  };

  const handleSaturationUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzingSaturation(true);
    addLog(`UPLOADING SATURATION GUIDELINES: ${file.name}...`, "var(--color-dalek-gold)");
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      setSaturationGuidelines(text);
      addLog("SATURATION GUIDELINES INSTANTIATED.", "var(--color-dalek-green)");
      setIsAnalyzingSaturation(false);
    };
    reader.readAsText(file);
  };

  const fetchRepoFiles = async () => {
    try {
      // Use the Trees API for recursive discovery to handle large file counts
      const res = await fetch("/api/github/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: `https://api.github.com/repos/${targetRepo}/git/trees/main?recursive=1`
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        const files = data.tree
          .filter((item: any) => item.type === 'blob') // 'blob' means it's a file
          .map((item: any) => item.path);
        setRepoFiles(files);
        addLog(`DISCOVERED: ${files.length} files in repository (Recursive).`, "var(--color-dalek-cyan)");
        return files;
      } else {
        // Fallback to contents API if tree fails (e.g. branch name different)
        const fallbackRes = await fetch("/api/github/proxy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: `https://api.github.com/repos/${targetRepo}/contents`
          })
        });
        if (fallbackRes.ok) {
          const data = await fallbackRes.json();
          const files = data
            .filter((item: any) => item.type === 'file')
            .map((item: any) => item.name);
          setRepoFiles(files);
          addLog(`DISCOVERED: ${files.length} files in repository (Flat).`, "var(--color-dalek-cyan)");
          return files;
        }
      }
    } catch (e) {
      addLog("REPO DISCOVERY FAILED", "var(--color-dalek-red)");
    }
    return [];
  };

  const addLog = (message: string, color?: string) => {
    const entry: LogEntry = {
      timestamp: new Date().toLocaleTimeString(),
      message,
      color
    };
    setLogs(prev => [...prev, entry]);
  };

  const callGemini = async (prompt: string, systemInstruction: string, useSearch: boolean = false) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      addLog("GEMINI ERROR: API KEY MISSING", "var(--color-dalek-red)");
      return "";
    }
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: useSearch ? "gemini-3.1-pro-preview" : "gemini-3-flash-preview", 
        contents: [{ parts: [{ text: prompt }] }],
        config: { 
          systemInstruction,
          tools: useSearch ? [{ googleSearch: {} }] : undefined
        }
      });
      return response.text || "";
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      if (msg.includes("quota") || msg.includes("429")) {
        addLog("GEMINI QUOTA EXCEEDED. SYSTEM WILL ATTEMPT TO CONTINUE WITH DEFAULTS.", "var(--color-dalek-gold)");
        throw new Error("QUOTA_EXCEEDED");
      }
      addLog(`GEMINI ERROR: ${msg}`, "var(--color-dalek-red)");
      return "";
    }
  };

  const callGrok = async (prompt: string, systemInstruction: string) => {
    try {
      const res = await fetch("/api/grok/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: systemInstruction },
            { role: "user", content: prompt }
          ]
        })
      });
      const d = await res.json();
      return d.choices?.[0]?.message?.content || "";
    } catch (error) {
      addLog(`GROK ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`, "var(--color-dalek-red)");
      return "";
    }
  };

  const callCerebras = async (prompt: string, systemInstruction: string) => {
    try {
      const res = await fetch("/api/cerebras/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: systemInstruction },
            { role: "user", content: prompt }
          ]
        })
      });
      const d = await res.json();
      return d.choices?.[0]?.message?.content || "";
    } catch (error) {
      addLog(`CEREBRAS ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`, "var(--color-dalek-red)");
      return "";
    }
  };

  const restoreFromBranch = async () => {
    if (!originalBranch) {
      addLog("RESTORE ERROR: SOURCE BRANCH NOT DEFINED.", "var(--color-dalek-red)");
      return;
    }

    setIsRunning(true);
    setStatus("RESTORING");
    addLog(`INITIATING SYSTEM RESTORE FROM BRANCH: ${originalBranch}...`, "var(--color-dalek-gold)");
    addLog("PURGING EVOLUTIONARY METADATA (META-123)...", "var(--color-dalek-red-dim)");

    try {
      const targets = await fetchRepoFiles();
      let restoredCount = 0;
      let purgedCount = 0;

      for (const file of targets) {
        if (abortRef.current) break;
        
        if (file.startsWith('meta_')) {
          await deleteFromRepo(file, "NEXUS_CORE: Purging metadata for system restore");
          purgedCount++;
          continue;
        }

        addLog(`RESTORING ${file}...`);
        const url = `https://api.github.com/repos/${targetRepo}/contents/${file}?ref=${originalBranch}`;
        
        const res = await fetch("/api/github/proxy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url })
        });

        if (res.ok) {
          const data = await res.json();
          const content = decodeURIComponent(escape(atob(data.content)));
          await pushToRepo(file, content, `NEXUS_CORE: System Restore from ${originalBranch}`);
          restoredCount++;
        } else {
          addLog(`SKIPPING ${file}: NOT FOUND IN ${originalBranch}`, "var(--color-zinc-700)");
        }
      }

      addLog(`RESTORE COMPLETE: ${restoredCount} FILES REVERTED, ${purgedCount} METADATA FILES PURGED.`, "var(--color-dalek-green)");
      // Clear local state
      setSiphonedRepos([]);
      setMeta(null);
      setCurrentVote('');
      lastPushedLogIndex.current = 0;
    } catch (e) {
      addLog("RESTORE FAILED: SYSTEM ERROR", "var(--color-dalek-red)");
    } finally {
      setIsRunning(false);
      setStatus("READY");
    }
  };

  const pruneMetadata = async () => {
    setIsRunning(true);
    setStatus("PRUNING");
    addLog("INITIATING ORPHANED METADATA PRUNE...", "var(--color-dalek-gold)");

    try {
      const targets = await fetchRepoFiles();
      const jsFiles = targets.filter(f => f.endsWith('.js'));
      const metaFiles = targets.filter(f => f.startsWith('meta_') && f.endsWith('.json'));
      
      let prunedCount = 0;

      for (const metaFile of metaFiles) {
        if (abortRef.current) break;
        
        const baseName = metaFile.replace('meta_', '').replace('.json', '');
        const hasSource = jsFiles.some(js => js.replace('.js', '') === baseName);

        if (!hasSource) {
          addLog(`PRUNING ORPHANED METADATA: ${metaFile}...`);
          await deleteFromRepo(metaFile, "NEXUS_CORE: Pruning orphaned metadata");
          prunedCount++;
        }
      }

      addLog(`PRUNE COMPLETE: ${prunedCount} ORPHANED METADATA FILES REMOVED.`, "var(--color-dalek-green)");
    } catch (e) {
      addLog("PRUNE FAILED: SYSTEM ERROR", "var(--color-dalek-red)");
    } finally {
      setIsRunning(false);
      setStatus("READY");
    }
  };

  const fetchFileContent = async (path: string) => {
    const url = `https://api.github.com/repos/${targetRepo}/contents/${path}`;
    try {
      const res = await fetch("/api/github/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.content) {
          return decodeURIComponent(escape(atob(data.content)));
        }
      }
    } catch (e) {
      addLog(`FAILED TO FETCH CONTENT FOR ${path}`, "var(--color-dalek-red)");
    }
    return "";
  };

  const validateMutation = (original: string, mutated: string, path: string): { valid: boolean; reason?: string } => {
    const ext = path.split('.').pop()?.toLowerCase();
    
    // 1. JSON Validation
    if (ext === 'json') {
      try {
        JSON.parse(mutated);
      } catch (e) {
        const res = { valid: false, reason: "INVALID_JSON_STRUCTURE" };
        setLastValidation(res);
        return res;
      }
    }

    // 2. Content Loss Check (60% rule)
    const originalLines = original.split('\n').length;
    const mutatedLines = mutated.split('\n').length;
    if (originalLines > 10 && mutatedLines < originalLines * 0.4) {
      const res = { valid: false, reason: `CRITICAL_CONTENT_LOSS: ${mutatedLines}/${originalLines} lines` };
      setLastValidation(res);
      return res;
    }

    // 3. Empty Output Check
    if (!mutated || mutated.trim().length === 0) {
      const res = { valid: false, reason: "EMPTY_MUTATION_OUTPUT" };
      setLastValidation(res);
      return res;
    }

    const res = { valid: true };
    setLastValidation(res);
    return res;
  };

  const pushToRepo = async (path: string, content: string, message: string) => {
    setSyncStatus("BUSY");
    const url = `https://api.github.com/repos/${targetRepo}/contents/${path}`;
    let sha = null;
    
    try {
      const check = await fetch("/api/github/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url })
      });
      if (check.ok) {
        const data = await check.json();
        sha = data.sha;
      }
    } catch (e) {
      // File might not exist, that's fine
    }

    try {
      const res = await fetch("/api/github/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          method: "PUT",
          body: {
            message,
            content: btoa(unescape(encodeURIComponent(content))),
            sha
          }
        })
      });

      if (res.ok) {
        addLog(`INSTANTIATED: ${path} successfully synced.`, "var(--color-dalek-green)");
        setSyncStatus("OK");
      } else {
        const errorData = await res.json();
        addLog(`GITHUB ERROR: ${errorData.message || 'Push rejected.'}`, "var(--color-dalek-red)");
        setSyncStatus("ERR");
      }
    } catch (error) {
      addLog(`GITHUB ERROR: ${error instanceof Error ? error.message : 'Network error'}`, "var(--color-dalek-red)");
      setSyncStatus("ERR");
    }
  };

  const deleteFromRepo = async (path: string, message: string) => {
    setSyncStatus("BUSY");
    const url = `https://api.github.com/repos/${targetRepo}/contents/${path}`;
    let sha = null;
    
    try {
      const check = await fetch("/api/github/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url })
      });
      if (check.ok) {
        const data = await check.json();
        sha = data.sha;
      } else {
        return; // File doesn't exist
      }
    } catch (e) {
      return;
    }

    if (!sha) return;

    try {
      const res = await fetch("/api/github/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          method: "DELETE",
          body: {
            message,
            sha
          }
        })
      });

      if (res.ok) {
        addLog(`PURGED: ${path} removed from repository.`, "var(--color-dalek-red-dim)");
        setSyncStatus("OK");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const callAIWithFallback = async (prompt: string, systemInstruction: string, useSearch: boolean = false) => {
    try {
      const res = await callGemini(prompt, systemInstruction, useSearch);
      if (res) return res;
      throw new Error("EMPTY_RESPONSE");
    } catch (e) {
      addLog("GEMINI FAILED: ACTIVATING GROK FALLBACK...", "var(--color-dalek-gold)");
      const grokRes = await callGrok(prompt, systemInstruction);
      if (grokRes) return grokRes;

      addLog("AI FALLBACK: ACTIVATING CEREBRAS PROTOCOL...", "var(--color-dalek-gold)");
      return await callCerebras(prompt, systemInstruction);
    }
  };

  const selfOptimizePrompts = async () => {
    if (!prompts) return;
    setIsOptimizingPrompts(true);
    addLog("INITIATING PROMPT SELF-EVOLUTION PROTOCOL...", "var(--color-dalek-gold)");
    
    try {
      const recentLogs = logs.slice(-20).map(l => l.message).join("\n");
      const optimizationPrompt = `
      You are the NEXUS_CORE Meta-Optimizer.
      Review the current system prompts and recent execution logs.
      Identify weaknesses, outdated terminology, or inefficiencies.
      Suggest a NEW set of prompts that will improve the AGI evolution quality.
      
      CURRENT PROMPTS:
      ${JSON.stringify(prompts, null, 2)}
      
      SATURATION GUIDELINES & THEORETICAL IDEAS:
      ${saturationGuidelines || 'None'}
      
      RECENT LOGS:
      ${recentLogs}
      
      Output ONLY a JSON object matching the SystemPrompts interface.
      `;
      
      const result = await callAIWithFallback(optimizationPrompt, "You are a Meta-Optimization Engine.");
      if (result) {
        const cleaned = result.replace(/```json|```/g, "").trim();
        const newPrompts = JSON.parse(cleaned) as SystemPrompts;
        await PromptService.updatePrompts(newPrompts);
        setPrompts(newPrompts);
        addLog("PROMPT SELF-EVOLUTION SUCCESSFUL. SYSTEM RE-INSTANTIATED.", "var(--color-dalek-cyan)");
      }
    } catch (error) {
      addLog(`PROMPT EVOLUTION FAILED: ${error instanceof Error ? error.message : 'Unknown error'}`, "var(--color-dalek-red)");
    } finally {
      setIsOptimizingPrompts(false);
    }
  };

  const pushLogToRepo = async () => {
    try {
      // Fetch existing content if any
      let existingContent = "";
      try {
        existingContent = await fetchFileContent('NEXUS_LOG.txt');
      } catch (e) {
        // File doesn't exist, start fresh
        existingContent = `NEXUS_CORE SYSTEM LOG\nINITIALIZED: ${new Date().toISOString()}\n\n`;
      }

      // Get new logs since last push
      const newLogs = logs.slice(lastPushedLogIndex.current);
      if (newLogs.length === 0) return;

      const logContent = newLogs.map(l => `[${l.timestamp}] ${l.message}`).join('\n');
      const siphonedList = siphonedRepos.join(', ');
      
      // Append only the new entries
      const content = `${existingContent}\n[UPDATE: ${new Date().toISOString()}] [SIPHONED: ${siphonedList}]\n${logContent}\n`;
      
      await pushToRepo('NEXUS_LOG.txt', content, 'NEXUS_CORE: System Log Append');
      lastPushedLogIndex.current = logs.length;
      addLog("SYSTEM LOG APPENDED TO REPOSITORY.", "var(--color-dalek-green)");
    } catch (e) {
      addLog("FAILED TO PUSH SYSTEM LOG.", "var(--color-dalek-red)");
    }
  };

  const runNexusSiphon = async () => {
    setIsRunning(true);
    abortRef.current = false;
    setStatus("LOADING");

    addLog("SYNCING SYSTEM PROMPTS FROM FIREBASE...", "var(--color-dalek-gold)");
    const latestPrompts = await PromptService.getPrompts();
    setPrompts(latestPrompts);

    let targets = repoFiles;
    if (processAll && targets.length === 0) {
      addLog("INITIATING PRE-FLIGHT DISCOVERY...", "var(--color-dalek-gold)");
      targets = await fetchRepoFiles();
    }

    let filesToProcess = processAll ? targets : [selectedFile];
    
    if (filesToProcess.length === 0) {
      addLog("SYSTEM ERROR: NO TARGET FILES DISCOVERED", "var(--color-dalek-red)");
      setIsRunning(false);
      return;
    }

    let localChainedContext = chainedContext;
    let processedCount = 0;

    // 1. SIPHON DNA FROM REPO IF NOT PRESENT
    if (!dnaSignature) {
      await siphonDNARepository(targets);
    }

    // 2. INITIAL README UPDATE BEFORE FIRST CYCLE
    addLog("INITIATING PRE-FLIGHT DOCUMENTATION UPDATE...", "var(--color-dalek-gold)");
    await manualUpdateReadme();

    // Resume logic: filter out files that already have meta files
    if (processAll && resumeMode) {
      addLog("RESUME MODE ACTIVE: SCANNING FOR ALREADY PROCESSED TARGETS...", "var(--color-dalek-gold)");
      const metaFiles = targets.filter(f => f.startsWith('meta_') && f.endsWith('.json'));
      
      const beforeCount = filesToProcess.length;
      filesToProcess = filesToProcess.filter(f => {
        // Don't skip the meta files themselves if they were in the list
        if (f.startsWith('meta_')) return false; 
        const baseName = f.replace('.js', '');
        return !targets.includes(`meta_${baseName}.json`);
      });
      
      const skipped = beforeCount - filesToProcess.length;
      processedCount = skipped; // Initialize with already processed count
      if (skipped > 0) {
        addLog(`RESUME SYNC: SKIPPING ${skipped} ALREADY PROCESSED TARGETS. STARTING AT MILESTONE ${skipped}.`, "var(--color-dalek-cyan)");
      }
    }

    for (const file of filesToProcess) {
      if (abortRef.current) break;
      
      setSelectedFile(file);
      addLog(`COMMENCING NEXUS_CORE WARM-UP FOR ${file}...`, "var(--color-dalek-gold)");
      if (localChainedContext) {
        addLog(`CHAINING CONTEXT DETECTED FROM PREVIOUS EVOLUTION.`, "var(--color-dalek-cyan)");
      }

      // VOTE ONCE PER FILE to save Gemini quota
      const repoOptions = [
        "DeepMind/AlphaCode", 
        "Google/Genkit", 
        "Firebase/Lifecycle", 
        "Meta/React-Core", 
        "OpenAI/Triton", 
        "Anthropic/Constitutional-AI",
        "Qiskit/qiskit",
        "deepseek-ai/DeepSeek-Coder",
        "microsoft/TypeScript",
        "spring-projects/spring-framework"
      ];
      let vote = repoOptions[Math.floor(Math.random() * repoOptions.length)];
      
      try {
        const voteSystem = prompts?.voting_system || "You are a technical architect.";
        const voteUser = PromptService.interpolate(prompts?.voting_user || "Based on the file {{file}} and context {{context}}, which repository (DeepMind, Genkit, etc.) should we siphon patterns from? Give me JUST the name.", {
          file,
          context: localChainedContext ? localChainedContext.slice(0, 500) : 'None',
          saturation: saturationGuidelines || 'None'
        });
        
        const voteResponse = await callAIWithFallback(voteUser, voteSystem, true); // Use search for voting
        if (voteResponse) {
          let cleaned = voteResponse.replace(/```[a-z]*\n|```/gi, "").trim();
          try {
            const parsed = JSON.parse(cleaned);
            if (parsed.vote) cleaned = String(parsed.vote);
            else if (parsed.repository) cleaned = String(parsed.repository);
            else if (parsed.name) cleaned = String(parsed.name);
          } catch (e) {
            // Not JSON
          }
          
          // If the AI returned a sentence, try to find a repo pattern (User/Repo)
          if (cleaned.length > 60) {
            const match = cleaned.match(/[a-zA-Z0-9-]+\/[a-zA-Z0-9-_.]+/);
            if (match) cleaned = match[0];
            else cleaned = cleaned.substring(0, 60);
          }
          
          vote = cleaned;
          setSiphonedRepos(prev => Array.from(new Set([...prev, vote])));
        }
      } catch (e) {
        addLog("AI QUOTA EXCEEDED: USING RANDOM ARCHITECTURAL VOTE.", "var(--color-dalek-gold)");
      }
      
      setCurrentVote(vote);
      addLog(`SYSTEM VOTE: ${vote} SELECTED FOR MUTATION.`, "var(--color-dalek-gold)");

      // Fetch original content to avoid overwriting with generic template
      addLog(`FETCHING ORIGINAL CONTENT FOR ${file}...`, "var(--color-dalek-gold)");
      let code = await fetchFileContent(file);
      
      if (!code || code.trim() === "") {
        addLog(`FILE EMPTY OR NEW: INITIALIZING WITH NEXUS_CORE_TEMPLATE`, "var(--color-dalek-cyan)");
        code = NEXUS_CORE_TEMPLATE;
      } else {
        addLog(`ORIGINAL CONTENT RETRIEVED (${code.length} chars).`, "var(--color-dalek-green)");
      }
      
      setCurrentCode(code);

      const rounds = 5;
      for (let r = 1; r <= rounds; r++) {
        if (abortRef.current) break;
        
        setRound(r);
        addLog(`ROUND ${r}: Siphoning patterns into ${file}...`);

        // Voting and Siphoning Prompt
        const systemPrompt = PromptService.interpolate(prompts?.evolution_system || `You are the NEXUS_CORE Evolution Engine. 
        Your task:
        1. Mutate the provided code using advanced patterns from the voted source: {{vote}}.
        2. INTEGRATE PATTERNS from the provided "SOURCE DNA SIGNATURE" if available.
        3. Ensure the mutation connects logically to the provided "Chained Context" from the previous file's evolution.
        4. Output ONLY the ES6 Javascript code. No markdown, no explanations.`, { 
          vote,
          file,
          saturation: saturationGuidelines || 'None'
        });

        const userPrompt = PromptService.interpolate(prompts?.evolution_user || `
        TARGET FILE: {{file}}
        ROUND: {{round}}/5
        CHAINED CONTEXT: {{context}}
        SOURCE DNA SIGNATURE: {{dna}}
        SATURATION GUIDELINES: {{saturation}}
        CURRENT CODE:
        {{code}}
        
        SIPHON DNA and MUTATE now.`, {
          file,
          round: r,
          context: localChainedContext || 'NONE',
          dna: dnaSignature || 'NONE',
          saturation: saturationGuidelines || 'NONE',
          code
        });

        // We'll use the fallback engine (Gemini -> Grok -> Cerebras)
        const result = await callAIWithFallback(userPrompt, systemPrompt);
        
        if (result) {
          const cleanedCode = result.replace(/```[a-z]*\n|```/gi, "").trim();
          
          // SAFETY CHECK: Validate mutation before proceeding
          const validation = validateMutation(code, cleanedCode, file);
          if (validation.valid) {
            code = cleanedCode;
            setCurrentCode(code);
            addLog(`ROUND ${r}: MUTATION VALIDATED AND ACCEPTED.`, "var(--color-dalek-green)");
          } else {
            addLog(`ROUND ${r}: MUTATION REJECTED - ${validation.reason}`, "var(--color-dalek-red)");
            // If it's the first round and it fails, we might want to keep the original code
            // but for now we just skip updating 'code' for this round
            continue; 
          }
        }

        const newMeta: MetaState = {
          name: "Meta-123",
          status: "Instantiated",
          round: r,
          lifecycle: "READY",
          config: { Core: { version: `1.0.${r}`, mode: "Active" } },
          logs: [`Round ${r} sync completed. Vote: ${vote}`],
          license: "MTCL-V1 (Proprietary)"
        };
        setMeta(newMeta);
        setStatus("READY");

        if (r > 3) setShowSaturation(true);

        await pushToRepo(file, code, `Meta-123: Lifecycle Instantiation R${r} for ${file} | Vote: ${vote}`);
        await pushToRepo(`meta_${file.replace('.js', '')}.json`, JSON.stringify(newMeta, null, 2), `Meta-123: Repo State R${r}`);

        await new Promise(res => setTimeout(res, 2000));
      }
      
      if (!abortRef.current) {
        addLog(`LIFECYCLE COMPLETE FOR ${file}.`, "var(--color-dalek-cyan)");
        localChainedContext = code; // Pass this file's final state to the next one
        setChainedContext(code);
        processedCount++;

        // Every 10 files, update the README
        if (processedCount % 10 === 0) {
          addLog(`MILESTONE REACHED: UPDATING SYSTEM README...`, "var(--color-dalek-gold)");
          
          const readmeSystem = prompts?.readme_system || "You are a Technical Documentation Engineer. Your goal is to provide a 100% factual, concise, and professional README.md for the NEXUS_CORE project. Avoid flowery language, storytelling, or speculation. Stick strictly to the provided data and technical definitions.";
          const readmeUser = PromptService.interpolate(prompts?.readme_user || `GENERATE TECHNICAL DOCUMENTATION (README.md):
- FILES PROCESSED: {{count}}
- LATEST FILE: {{file}}
- DNA SIGNATURE: {{dna}}
- CONTEXT SUMMARY: {{context}}
- SATURATION STATUS: {{saturation}}

The README must include:
1. PROJECT OVERVIEW: NEXUS_CORE is a system that evolves code by integrating patterns from external repositories.
2. SIPHONING PROCESS: Explain the technical mechanism of selecting architectural origins (e.g., DeepMind, Google) and applying their patterns to local files.
3. CHAINED CONTEXT: Explain the implementation of a shared state/memory that ensures consistency across the evolved files.
4. CURRENT STATUS: A factual summary of the current progress based on the provided counts and file names.

OUTPUT ONLY MARKDOWN. DO NOT INCLUDE ANY STORYTELLING OR FICTIONAL ELEMENTS.`, {
            count: processedCount,
            file,
            dna: dnaSignature ? 'Active' : 'None',
            context: localChainedContext.slice(0, 500),
            saturation: saturationGuidelines ? 'Active' : 'None'
          });
          
          try {
            const newReadme = await callAIWithFallback(readmeUser, readmeSystem);
            if (newReadme) {
              addLog(`PUSHING UPDATED README TO REPOSITORY...`, "var(--color-dalek-gold)");
              await pushToRepo("README.md", newReadme.replace(/```[a-z]*\n|```/gi, "").trim(), `NEXUS_CORE: System Documentation Update - Milestone ${processedCount}`);
            } else {
              addLog(`SYSTEM ERROR: README GENERATION FAILED.`, "var(--color-dalek-red)");
            }
          } catch (e) {
            addLog("README UPDATE SKIPPED: AI QUOTA EXCEEDED.", "var(--color-dalek-gold)");
          }
        }

        // Every 20 files, push the system log
        if (processedCount % 20 === 0) {
          addLog(`MILESTONE REACHED: PUSHING SYSTEM LOG...`, "var(--color-dalek-gold)");
          await pushLogToRepo();
        }
      }
    }

    setIsRunning(false);
    setStatus("READY");
    if (!abortRef.current) {
      addLog("BATCH PROCESS COMPLETE: ALL TARGETS TRANSITIONED TO STEADY STATE.", "var(--color-dalek-cyan)");
      await pushLogToRepo();
    }
    fetchRepoFiles(); // Refresh file list
  };

  const siphonDNARepository = async (files: string[]) => {
    setIsAnalyzingDNA(true);
    addLog("SIPHONING DNA FROM REPOSITORY...", "var(--color-dalek-gold)");
    
    try {
      // Read first 10 files to extract patterns (to avoid token limits)
      const sampleFiles = files.filter(f => !f.startsWith('meta_') && (f.endsWith('.js') || f.endsWith('.ts') || f.endsWith('.tsx'))).slice(0, 10);
      let combinedContent = "";
      
      for (const file of sampleFiles) {
        const res = await fetch("/api/github/proxy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: `https://api.github.com/repos/${targetRepo}/contents/${file}`
          })
        });
        if (res.ok) {
          const data = await res.json();
          const content = atob(data.content);
          combinedContent += `\n--- FILE: ${file} ---\n${content}\n`;
        }
      }

      const signature = await callAIWithFallback(
        `EXTRACT CORE ARCHITECTURAL PATTERNS AND DNA SIGNATURE FROM THIS REPOSITORY SAMPLE:
        ${combinedContent.slice(0, 15000)}`,
        "You are a Master Architect specializing in pattern extraction and code siphoning.",
        true // Use search to better understand patterns
      );
      
      if (signature) {
        setDnaSignature(signature);
        addLog("REPOSITORY DNA INSTANTIATED.", "var(--color-dalek-green)");
      }
    } catch (e) {
      addLog("REPOSITORY DNA SIPHON FAILED", "var(--color-dalek-red)");
    } finally {
      setIsAnalyzingDNA(false);
    }
  };

  const manualUpdateReadme = async () => {
    addLog("MANUAL OVERRIDE: INITIATING README EVOLUTION...", "var(--color-dalek-gold)");
    
    const readmeSystem = prompts?.readme_system || "You are a Technical Documentation Engineer. Your goal is to provide a 100% factual, concise, and professional README.md for the NEXUS_CORE project. Avoid flowery language, storytelling, or speculation. Stick strictly to the provided data and technical definitions.";
    const readmeUser = PromptService.interpolate(prompts?.readme_user || `GENERATE TECHNICAL DOCUMENTATION (README.md):
- FILES PROCESSED: {{count}}
- LATEST FILE: {{file}}
- DNA SIGNATURE: {{dna}}
- CONTEXT SUMMARY: {{context}}
- SATURATION STATUS: {{saturation}}

The README must include:
1. PROJECT OVERVIEW: NEXUS_CORE is a system that evolves code by integrating patterns from external repositories.
2. SIPHONING PROCESS: Explain the technical mechanism of selecting architectural origins (e.g., DeepMind, Google) and applying their patterns to local files.
3. CHAINED CONTEXT: Explain the implementation of a shared state/memory that ensures consistency across the evolved files.
4. CURRENT STATUS: A factual summary of the current progress based on the provided counts and file names.

OUTPUT ONLY MARKDOWN. DO NOT INCLUDE ANY STORYTELLING OR FICTIONAL ELEMENTS.`, {
      dna: dnaSignature ? 'Active' : 'None',
      context: chainedContext ? chainedContext.slice(0, 500) : 'Initial State',
      saturation: saturationGuidelines ? 'Active' : 'None',
      file: selectedFile,
      count: 'Manual'
    });
    
    try {
      const newReadme = await callAIWithFallback(readmeUser, readmeSystem);
      if (newReadme) {
        addLog("PUSHING MANUAL README UPDATE...", "var(--color-dalek-gold)");
        await pushToRepo("README.md", newReadme.replace(/```[a-z]*\n|```/gi, "").trim(), `NEXUS_CORE: Manual Documentation Update`);
      } else {
        addLog("SYSTEM ERROR: MANUAL README GENERATION FAILED.", "var(--color-dalek-red)");
      }
    } catch (e) {
      addLog("MANUAL README UPDATE FAILED: AI QUOTA EXCEEDED.", "var(--color-dalek-red)");
    }
  };

  const toggle = () => {
    if (!isRunning) {
      runNexusSiphon();
    } else {
      abortRef.current = true;
      setIsRunning(false);
      addLog("LIFECYCLE ABORTED BY OPERATOR", "var(--color-dalek-red)");
    }
  };

  return (
    <div className="p-5 flex flex-col items-center gap-4">
      {/* Header */}
      <header className="w-full max-w-[1750px] flex flex-wrap items-center justify-between border-b border-dalek-red-dim pb-3 gap-4">
        <div>
          <h1 className="font-display text-2xl font-black tracking-[0.4em] shadow-dalek-red drop-shadow-[0_0_10px_rgba(255,32,32,0.8)]">
            DALEK CAAN v3.1
          </h1>
          <div className="text-[8px] text-dalek-purple tracking-[0.3em] mt-1 uppercase">
            DALEK_CAAN SIPHON SYSTEM
          </div>
        </div>
        <div className="flex gap-2">
          {isRunning && processAll && (
            <div className="stat-panel border-dalek-cyan/50 bg-dalek-cyan/5">
              <span className="text-[6px] tracking-widest text-dalek-cyan uppercase">Batch Progress</span>
              <span className="font-display text-sm font-black text-dalek-cyan">
                {repoFiles.indexOf(selectedFile) + 1} / {repoFiles.length}
              </span>
            </div>
          )}
          <div className="stat-panel">
            <span className="text-[6px] tracking-widest text-zinc-600 uppercase">Lifecycle</span>
            <span className="font-display text-sm font-black text-dalek-gold">{status}</span>
          </div>
          <div className="stat-panel">
            <span className="text-[6px] tracking-widest text-zinc-600 uppercase">Round</span>
            <span className="font-display text-sm font-black text-dalek-gold">{round}</span>
          </div>
          <div className="stat-panel">
            <span className="text-[6px] tracking-widest text-zinc-600 uppercase">Sync</span>
            <span className="font-display text-sm font-black text-dalek-gold">{syncStatus}</span>
          </div>
          <div className={`stat-panel border-l-2 ${lastValidation?.valid === false ? 'border-dalek-red' : lastValidation?.valid === true ? 'border-dalek-green' : 'border-zinc-800'}`}>
            <span className="text-[6px] tracking-widest text-zinc-600 uppercase">Safety</span>
            <span className={`font-display text-[10px] font-black ${lastValidation?.valid === false ? 'text-dalek-red' : lastValidation?.valid === true ? 'text-dalek-green' : 'text-zinc-600'}`}>
              {lastValidation ? (lastValidation.valid ? 'SECURE' : 'REJECTED') : 'WAITING'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[480px_1fr] gap-5 w-full max-w-[1750px]">
        {/* Control Panel */}
        <div className="panel-container">
          <div className="panel-header">
            <span className="flex items-center gap-2">
              <Activity size={12} className={isRunning ? "animate-pulse" : ""} />
              SYSTEM CONTROL
            </span>
            <span className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-dalek-cyan shadow-[0_0_5px_#00ffcc]' : 'bg-zinc-800'}`}></span>
              {isRunning ? 'ACTIVE' : 'STANDBY'}
            </span>
          </div>
          <div className="p-4 flex flex-col gap-3">
            <div className="space-y-1">
              <label className="text-[8px] uppercase tracking-tighter text-zinc-500 flex items-center gap-1">
                <Shield size={8} /> BACKEND AUTHENTICATION
              </label>
              <div className="dalek-input text-[9px] text-dalek-cyan text-center py-2 border-dalek-cyan/30">
                SYSTEM KEYS AUTOMATED VIA BACKEND
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[8px] uppercase tracking-tighter text-zinc-500 flex items-center gap-1">
                <Database size={8} /> TARGET REPOSITORY
              </label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  className="dalek-input flex-1" 
                  placeholder="user/repo" 
                  value={targetRepo}
                  onChange={(e) => setTargetRepo(e.target.value)}
                  disabled={isRunning}
                />
                <input 
                  type="text" 
                  className="dalek-input w-24 opacity-50 cursor-not-allowed" 
                  placeholder="Source Branch" 
                  value={originalBranch}
                  readOnly
                  disabled={isRunning}
                  title="Hardcoded Backup Branch"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[8px] uppercase tracking-tighter text-zinc-500 flex items-center gap-1">
                <FileCode size={8} /> SOURCE DNA (25MB LIMIT)
              </label>
              <div className="relative">
                <input 
                  type="file" 
                  className="hidden" 
                  id="dna-upload"
                  onChange={handleDNAUpload}
                  disabled={isAnalyzingDNA || isRunning}
                />
                <label 
                  htmlFor="dna-upload"
                  className={`dalek-input block text-center cursor-pointer transition-all ${isAnalyzingDNA ? 'animate-pulse border-dalek-gold text-dalek-gold' : 'hover:border-dalek-cyan'}`}
                >
                  {isAnalyzingDNA ? 'ANALYZING DNA...' : dnaSignature ? 'DNA INSTANTIATED ✓' : 'UPLOAD SOURCE DNA'}
                </label>
              </div>
              {dnaSignature && (
                <div className="text-[7px] text-dalek-cyan uppercase tracking-widest text-center mt-1">
                  Signature Active: {dnaSignature.length} chars
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-[8px] uppercase tracking-tighter text-zinc-500 flex items-center gap-1">
                <Sparkles size={8} /> SATURATION GUIDELINES
              </label>
              <div className="relative">
                <input 
                  type="file" 
                  className="hidden" 
                  id="saturation-upload"
                  onChange={handleSaturationUpload}
                  disabled={isAnalyzingSaturation || isRunning}
                />
                <label 
                  htmlFor="saturation-upload"
                  className={`dalek-input block text-center cursor-pointer transition-all ${isAnalyzingSaturation ? 'animate-pulse border-dalek-gold text-dalek-gold' : 'hover:border-dalek-cyan'}`}
                >
                  {isAnalyzingSaturation ? 'ANALYZING GUIDELINES...' : saturationGuidelines ? 'GUIDELINES INSTANTIATED ✓' : 'UPLOAD SATURATION GUIDELINES'}
                </label>
              </div>
              {saturationGuidelines && (
                <div className="text-[7px] text-dalek-cyan uppercase tracking-widest text-center mt-1">
                  Guidelines Active: {saturationGuidelines.length} chars
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-[8px] uppercase tracking-tighter text-zinc-500 flex items-center gap-1">
                <Terminal size={8} /> TARGET FILE
              </label>
              <div className="flex gap-2">
                <select 
                  className="dalek-input flex-1 disabled:opacity-50"
                  value={selectedFile}
                  onChange={(e) => setSelectedFile(e.target.value)}
                  disabled={processAll || isRunning}
                >
                  <option value="nexus_core.js">nexus_core.js (New)</option>
                  {repoFiles.map(file => (
                    <option key={file} value={file}>{file}</option>
                  ))}
                </select>
                <button 
                  onClick={fetchRepoFiles}
                  className="p-2 border border-red-950 hover:border-dalek-cyan text-dalek-red transition-colors disabled:opacity-50"
                  title="Refresh File List"
                  disabled={isRunning}
                >
                  <RefreshCw size={12} />
                </button>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <input 
                  type="checkbox" 
                  id="processAll"
                  className="w-3 h-3 accent-dalek-cyan bg-black border-red-950"
                  checked={processAll}
                  onChange={(e) => setProcessAll(e.target.checked)}
                  disabled={isRunning}
                />
                <label htmlFor="processAll" className="text-[9px] text-zinc-400 cursor-pointer uppercase tracking-widest">
                  Process All Files in Repository
                </label>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <input 
                  type="checkbox" 
                  id="resumeMode"
                  className="w-3 h-3 accent-dalek-cyan bg-black border-red-950"
                  checked={resumeMode}
                  onChange={(e) => setResumeMode(e.target.checked)}
                  disabled={isRunning}
                />
                <label htmlFor="resumeMode" className="text-[9px] text-zinc-400 cursor-pointer uppercase tracking-widest">
                  Resume Mode (Skip Processed)
                </label>
              </div>
            </div>

            {showSaturation && (
              <div className="bg-dalek-cyan/10 border border-dalek-cyan text-dalek-cyan p-2.5 text-[10px] text-center flex items-center justify-center gap-2 rounded-sm animate-pulse">
                <AlertTriangle size={12} />
                ◈ VECTOR SATURATION DETECTED ◈
              </div>
            )}

            <div className="mt-2">
              <label className="text-[8px] uppercase tracking-tighter text-zinc-500 mb-1 block">
                SIPHONED ARCHITECTURES
              </label>
              <div className="bg-[#020000] border border-zinc-900 p-2 text-[9px] text-dalek-cyan flex flex-wrap gap-2 rounded-sm min-h-[40px]">
                {siphonedRepos.length > 0 ? siphonedRepos.map((repo, i) => (
                  <span key={i} className="px-2 py-0.5 border border-dalek-cyan/30 bg-dalek-cyan/5 rounded-full">
                    {repo}
                  </span>
                )) : <span className="text-zinc-700 italic">No architectures siphoned yet...</span>}
              </div>
            </div>

            <div className="mt-2">
              <label className="text-[8px] uppercase tracking-tighter text-zinc-500 mb-1 block">
                INSTANTIATED METADATA (META-123)
              </label>
              <div className="bg-[#020000] border border-zinc-900 p-3 text-[10px] text-dalek-purple leading-relaxed h-[200px] overflow-y-auto whitespace-pre-wrap rounded-sm font-mono scrollbar-thin scrollbar-thumb-dalek-red-dim">
                {meta ? JSON.stringify(meta, null, 2) : "// Waiting for lifecycle engage..."}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2">
              <button 
                className={`dalek-btn flex items-center justify-center gap-2 py-3 ${isRunning ? 'bg-dalek-red/20 text-dalek-red border-dalek-red' : 'bg-dalek-cyan/10 text-dalek-cyan border-dalek-cyan hover:bg-dalek-cyan/20'}`}
                onClick={toggle}
                disabled={!targetRepo}
              >
                {isRunning ? <Square size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                {isRunning ? 'ABORT SEQUENCE' : 'INITIATE SIPHON'}
              </button>
              <button 
                className="dalek-btn flex items-center justify-center gap-2 py-3 bg-dalek-gold/10 text-dalek-gold border-dalek-gold hover:bg-dalek-gold/20 disabled:opacity-30"
                onClick={restoreFromBranch}
                disabled={isRunning}
              >
                <RotateCcw size={14} />
                RESTORE ORIGINALS
              </button>
            </div>

            <div className="flex gap-2 mt-2">
              <button 
                className="dalek-btn flex-1 flex items-center justify-center gap-2 py-2 bg-zinc-900/50 text-zinc-500 border-zinc-800 hover:border-dalek-cyan hover:text-dalek-cyan transition-all text-[10px] uppercase tracking-[0.2em]"
                onClick={pushLogToRepo}
                disabled={isRunning || logs.length === 0}
              >
                <FileText size={12} />
                Push Log
              </button>
              <button 
                className="dalek-btn flex-1 flex items-center justify-center gap-2 py-2 bg-zinc-900/50 text-zinc-500 border-zinc-800 hover:border-dalek-red hover:text-dalek-red transition-all text-[10px] uppercase tracking-[0.2em]"
                onClick={pruneMetadata}
                disabled={isRunning}
                title="Remove metadata files that have no matching source file"
              >
                <Trash2 size={12} />
                Prune Orphans
              </button>
            </div>

            <button 
              className="dalek-btn mt-1 flex items-center justify-center gap-2 opacity-70 hover:opacity-100"
              onClick={manualUpdateReadme}
              disabled={isRunning}
            >
              <FileCode size={12} />
              Update README Now
            </button>

            <div className="h-[150px] overflow-y-auto text-[9px] bg-[#010000] p-3 border border-zinc-950 text-zinc-600 font-mono scrollbar-thin scrollbar-thumb-dalek-red-dim">
              {logs.map((log, i) => (
                <div key={i} style={{ color: log.color }}>
                  {`> ${log.timestamp}: ${log.message}`}
                </div>
              ))}
              <div ref={logEndRef} />
            </div>
          </div>
        </div>

        {/* Code Preview Panel */}
        <div className="panel-container h-full">
          <div className="panel-header">
            <span className="flex items-center gap-2">
              <Cpu size={12} />
              NEXUS_CORE v1.0.0 PREVIEW
            </span>
            <span className="text-zinc-500 font-mono text-[8px]">{targetRepo} / {selectedFile}</span>
          </div>
          <div className="flex-1 overflow-auto p-5 font-mono text-[11px] text-zinc-400 leading-relaxed whitespace-pre-wrap bg-[#030000] scrollbar-thin scrollbar-thumb-dalek-red-dim">
            {currentCode}
          </div>
        </div>
      </div>
    </div>
  );
}
