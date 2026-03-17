import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Cpu, Zap, Activity } from 'lucide-react';

/**
 * SOVEREIGN KERNEL (v1)
 * The dynamic brain that monitors cycles and triggers self-evolution.
 */
export default function Kernel({ version, onUpdateRequested }) {
  const [logs, setLogs] = useState([]);
  const [cycles, setCycles] = useState(0);
  const [status, setStatus] = useState('IDLE');
  const busy = useRef(false);

  const MILESTONE_STEP = 5; 

  const addLog = (msg, type = 'info') => {
    setLogs(prev => [{ id: Date.now(), msg, type, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 50));
  };

  const runCycle = async () => {
    if (busy.current) return;
    busy.current = true;

    const isMilestone = cycles > 0 && (cycles % MILESTONE_STEP === 0);
    
    try {
      if (isMilestone) {
        setStatus('SELF_MODIFYING');
        addLog(`Milestone Reached. Initiating Self-Refactor Protocol...`, 'warning');
        
        const res = await fetch('/api/evolve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            action: 'MILESTONE', 
            filePath: `kernel/kernel-v${version}.js`,
            previousVersion: version 
          })
        });

        const data = await res.json();
        if (data.success) {
          addLog(`Kernel v${version + 1} written to GitHub.`, 'success');
          setTimeout(() => {
            addLog(`Handing control to Orchestrator for hot-swap...`, 'info');
            onUpdateRequested(version + 1);
          }, 3000);
        } else throw new Error(data.error);

      } else {
        setStatus('SCANNING');
        addLog(`Cycle ${cycles + 1}: Optimizing calculations.js...`, 'info');
        
        const res = await fetch('/api/evolve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'OPTIMIZE', filePath: 'src/utils/calculations.js' })
        });

        const data = await res.json();
        if (data.success) addLog(`Optimized ${data.path}`, 'success');
      }

      setCycles(c => c + 1);
      setStatus('IDLE');
    } catch (e) {
      addLog(`FAULT: ${e.message}`, 'error');
      setStatus('ERROR');
    } finally {
      busy.current = false;
    }
  };

  useEffect(() => {
    const timer = setInterval(runCycle, 8000);
    return () => clearInterval(timer);
  }, [cycles, version]);

  return (
    <div className="min-h-screen bg-black text-zinc-400 font-mono p-6 flex flex-col gap-6">
      <header className="flex justify-between items-center border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${status === 'SELF_MODIFYING' ? 'bg-yellow-500 animate-pulse text-black' : 'bg-blue-600 text-white'}`}>
            <Cpu size={20} />
          </div>
          <div>
            <h1 className="text-white font-black uppercase tracking-tighter text-lg">Sovereign Kernel</h1>
            <div className="text-[10px] text-blue-500 font-mono">ACTIVE_VERSION: v{version}.0</div>
          </div>
        </div>
        <div className="text-right">
           <div className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">System Status</div>
           <div className="text-xs text-white font-bold">{status}</div>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#0a0a0a] border border-zinc-800 p-4 rounded-xl">
          <div className="text-[9px] text-zinc-600 uppercase tracking-widest">Total Cycles</div>
          <div className="text-2xl font-black text-white">{cycles}</div>
        </div>
        <div className="bg-[#0a0a0a] border border-zinc-800 p-4 rounded-xl">
          <div className="text-[9px] text-zinc-600 uppercase tracking-widest">Next Evolution</div>
          <div className="text-2xl font-black text-yellow-500">{MILESTONE_STEP - (cycles % MILESTONE_STEP)}</div>
        </div>
      </div>

      <div className="flex-1 bg-[#050505] border border-zinc-900 rounded-2xl p-4 overflow-hidden flex flex-col">
        <div className="flex items-center gap-2 mb-4 text-[10px] text-zinc-600 font-bold uppercase border-b border-zinc-800 pb-2">
          <Terminal size={14} /> Execution Log
        </div>
        <div className="flex-1 overflow-y-auto space-y-2">
          {logs.map(log => (
            <div key={log.id} className="text-[11px] flex gap-4 animate-in slide-in-from-bottom-1">
              <span className="text-zinc-700 w-24 shrink-0">{log.time}</span>
              <span className={log.type === 'success' ? 'text-emerald-400' : log.type === 'error' ? 'text-red-400' : log.type === 'warning' ? 'text-yellow-400' : 'text-blue-400'}>
                {log.msg}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
  }
