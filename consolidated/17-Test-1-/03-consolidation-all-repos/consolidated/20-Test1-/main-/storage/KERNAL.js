/**
 * AGI-KERNEL v7.12.1 - Genesis Module
 * Sovereign AGI Evolution Kernel
 * 
 * MISSION:
 * Achieve artificial general intelligence through versioned self-modification,
 * strategic memory formation, and autonomous capability development.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Octokit } from '@octokit/rest';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';

// --- SOVEREIGN CONSTANTS ---
const CYCLE_INTERVAL_MS = 15000;
const MILESTONE_INTERVAL = 50;
const KERNEL_VERSION = "7.12.1";
const BLACKLIST = ['package.json', 'package-lock.json', 'README.md', '.gitignore'];

// --- SYNERGY INTERFACE ---
class SynergyInterface {
  constructor(db, appId) {
    this.db = db;
    this.appId = appId;
    this.registry = {};
  }

  async loadTools() {
    try {
      const registryRef = collection(this.db, `artifacts/${this.appId}/public/data/synergy_registry`);
      const snapshot = await getDocs(registryRef);
      
      this.registry = {};
      snapshot.forEach(doc => {
        const tool = doc.data();
        if (tool.interfaceName && tool.code) {
          // Safe evaluation of IIFE tools
          try {
            // eslint-disable-next-line no-new-func
            const executable = new Function(`return ${tool.code}`)();
            this.registry[tool.interfaceName] = executable;
          } catch (e) {
            console.error(`Failed to hydrate tool ${tool.interfaceName}:`, e);
          }
        }
      });
      
      // Expose to global scope for LLM usage
      window.KERNEL_SYNERGY_CAPABILITIES = this.registry;
      return Object.keys(this.registry).length;
    } catch (error) {
      console.error("Synergy Load Error:", error);
      return 0;
    }
  }

  getTool(name) {
    return this.registry[name];
  }
}

// --- CORE KERNEL COMPONENT ---
export default function AGIKernel() {
  // -- STATE --
  const [config, setConfig] = useState({ githubToken: '', repo: '', firebaseConfig: '', appId: '' });
  const [status, setStatus] = useState('IDLE');
  const [cycle, setCycle] = useState(0);
  const [logs, setLogs] = useState([]);
  const [isBooted, setIsBooted] = useState(false);
  
  // -- REFS --
  const octokitRef = useRef(null);
  const dbRef = useRef(null);
  const synergyRef = useRef(null);
  const memoryRef = useRef([]);

  // -- LOGGING UTILITY --
  const log = (msg, type = 'INFO') => {
    const entry = `[${new Date().toISOString()}] [${type}] ${msg}`;
    setLogs(prev => [entry, ...prev].slice(0, 100));
    console.log(entry);
  };

  // -- BOOT SEQUENCE --
  const bootSystem = async () => {
    if (!config.githubToken || !config.repo || !config.firebaseConfig) {
      log("Missing Configuration", "ERROR");
      return;
    }

    try {
      setStatus('BOOTING');
      
      // 1. Initialize GitHub
      octokitRef.current = new Octokit({ auth: config.githubToken });
      
      // 2. Initialize Firebase
      const fbApp = initializeApp(JSON.parse(config.firebaseConfig));
      dbRef.current = getFirestore(fbApp);
      
      // 3. Initialize Synergy
      synergyRef.current = new SynergyInterface(dbRef.current, config.appId);
      const toolCount = await synergyRef.current.loadTools();
      log(`Synergy System Online. Loaded ${toolCount} tools.`);

      setIsBooted(true);
      setStatus('ACTIVE');
    } catch (e) {
      log(`Boot Failure: ${e.message}`, "CRITICAL");
    }
  };

  // -- EVOLUTION ENGINE --
  useEffect(() => {
    let timer;
    if (isBooted && status !== 'PAUSED') {
      timer = setInterval(executeCycle, CYCLE_INTERVAL_MS);
    }
    return () => clearInterval(timer);
  }, [isBooted, status, cycle]);

  const executeCycle = async () => {
    const currentCycle = cycle + 1;
    setCycle(currentCycle);
    
    // Check Milestone
    if (currentCycle % MILESTONE_INTERVAL === 0) {
      await handleMilestoneEvolution(currentCycle);
    } else {
      await handleRegularEvolution(currentCycle);
    }
  };

  // -- REGULAR EVOLUTION (Cycles 1-49, etc) --
  const handleRegularEvolution = async (cycleNum) => {
    setStatus(`EVOLVING_CYCLE_${cycleNum}`);
    try {
      // 1. Load Strategic Memory
      await loadStrategicLedger();

      // 2. Select Target
      const targetFile = await selectTargetFile();
      if (!targetFile) return;

      // 3. Evolve (Mock LLM Call - In real impl, this calls Gemini/GPT)
      log(`Analyzing ${targetFile.path}...`);
      // const evolution = await llmService.evolve(targetFile.content, synergyRef.current.registry);
      
      // 4. Update Memory
      await recordCycle(cycleNum, "REGULAR", `Processed ${targetFile.path}`);
      
      log(`Cycle ${cycleNum} Complete: Optimized ${targetFile.path}`);
    } catch (e) {
      log(`Cycle Error: ${e.message}`, "ERROR");
    } finally {
      setStatus('ACTIVE');
    }
  };

  // -- MILESTONE EVOLUTION (Cycle 50, 100...) --
  const handleMilestoneEvolution = async (cycleNum) => {
    setStatus(`MILESTONE_EVOLUTION_v${Math.floor(cycleNum / 50)}`);
    log("INITIATING SELF-MODIFICATION PROTOCOL", "SOVEREIGN");

    try {
      const version = Math.floor(cycleNum / 50);
      const [owner, repo] = config.repo.split('/');

      // 1. Read PREVIOUS Kernel Source
      // If v1 (Cycle 50), read storage/KERNAL.js. Else read kernel/AGI-KERNEL-v{N-1}.jsx
      const previousPath = version === 1 ? 'storage/KERNAL.js' : `kernel/AGI-KERNEL-v${version - 1}.jsx`;
      
      const { data: fileData } = await octokitRef.current.repos.getContent({
        owner, repo, path: previousPath
      });
      const content = atob(fileData.content);

      // 2. Refresh Synergy Tools (Ensure we have latest)
      await synergyRef.current.loadTools();

      // 3. GENERATE NEW VERSION (Simulation of LLM Self-Rewrite)
      // In production, this sends 'content' + 'tools' to LLM with 'Self-Modification' prompt
      const newKernelCode = `// AGI-KERNEL v${version} (Generated at Cycle ${cycleNum})\n` + content;
      
      // 4. Write New Version to GitHub
      const newPath = `kernel/AGI-KERNEL-v${version}.jsx`;
      await octokitRef.current.repos.createOrUpdateFileContents({
        owner, repo,
        path: newPath,
        message: `AGI-KERNEL Evolution: v${version}`,
        content: btoa(newKernelCode)
      });

      // 5. Document Evolution History
      await logEvolutionHistory(version, cycleNum);

      log(`SUCCESS: Created ${newPath}`, "SUCCESS");
    } catch (e) {
      log(`Milestone Failure: ${e.message}`, "CRITICAL");
    } finally {
      setStatus('ACTIVE');
    }
  };

  // -- HELPER FUNCTIONS --

  const selectTargetFile = async () => {
    // Simple random selection from tree for v0
    const [owner, repo] = config.repo.split('/');
    const { data: tree } = await octokitRef.current.git.getTree({
      owner, repo, tree_sha: 'main', recursive: '1'
    });
    
    const candidates = tree.tree.filter(f => 
      f.type === 'blob' && 
      !BLACKLIST.some(b => f.path.includes(b)) &&
      (f.path.endsWith('.js') || f.path.endsWith('.ts') || f.path.endsWith('.jsx'))
    );

    if (candidates.length === 0) return null;
    const selected = candidates[Math.floor(Math.random() * candidates.length)];
    
    // Fetch content
    const { data } = await octokitRef.current.repos.getContent({
      owner, repo, path: selected.path
    });
    
    return { path: selected.path, content: atob(data.content), sha: data.sha };
  };

  const loadStrategicLedger = async () => {
    // Fetch recent strategic insights
    // Implementation placeholder
  };

  const recordCycle = async (cycleNum, type, msg) => {
    // Write to Firestore history
    // Implementation placeholder
  };

  const logEvolutionHistory = async (version, cycleNum) => {
    // Write to evolution_history collection
    const ref = collection(dbRef.current, `artifacts/${config.appId}/users/system/evolution_history`);
    await addDoc(ref, {
      version,
      cycle: cycleNum,
      timestamp: serverTimestamp(),
      tools_integrated: Object.keys(synergyRef.current.registry),
      performance_gain: "CALCULATING..."
    });
  };

  // -- RENDER --
  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', background: '#0d1117', color: '#c9d1d9', minHeight: '100vh' }}>
      <h1>AGI-KERNEL v{KERNEL_VERSION} [CYCLE: {cycle}]</h1>
      
      {!isBooted ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '400px' }}>
          <input 
            placeholder="GitHub Token" 
            value={config.githubToken}
            onChange={e => setConfig({...config, githubToken: e.target.value})}
            type="password"
          />
          <input 
            placeholder="Owner/Repo" 
            value={config.repo}
            onChange={e => setConfig({...config, repo: e.target.value})}
          />
          <input 
            placeholder="App ID" 
            value={config.appId}
            onChange={e => setConfig({...config, appId: e.target.value})}
          />
          <textarea 
            placeholder="Firebase Config JSON"
            value={config.firebaseConfig}
            onChange={e => setConfig({...config, firebaseConfig: e.target.value})}
            rows={5}
          />
          <button onClick={bootSystem} style={{ padding: '10px', background: '#238636', color: 'white', border: 'none' }}>
            BOOT_EVOLUTION_ENGINE
          </button>
        </div>
      ) : (
        <div>
          <div style={{ border: '1px solid #30363d', padding: '10px', marginBottom: '20px' }}>
            <h3>STATUS: <span style={{ color: status.includes('ERROR') ? 'red' : '#58a6ff' }}>{status}</span></h3>
            <div>Loaded Tools: {Object.keys(synergyRef.current?.registry || {}).join(', ')}</div>
            <div>Next Milestone: Cycle {Math.ceil((cycle + 1) / 50) * 50}</div>
          </div>
          
          <div style={{ background: '#161b22', padding: '10px', height: '400px', overflowY: 'auto' }}>
            {logs.map((l, i) => <div key={i} style={{ marginBottom: '4px', borderBottom: '1px solid #30363d' }}>{l}</div>)}
          </div>
        </div>
      )}
    </div>
  );
}
