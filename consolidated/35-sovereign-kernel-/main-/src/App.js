import React, { useState, useEffect, Suspense } from 'react';
import { RefreshCw, Cpu, ShieldAlert } from 'lucide-react';

/**
 * SOVEREIGN ORCHESTRATOR (v91)
 * The stable Loader that hot-swaps the Kernel brain.
 */
const KernelFallback = ({ error }) => (
  <div className="min-h-screen bg-black flex flex-col items-center justify-center p-10 text-red-500 font-mono text-center">
    <ShieldAlert size={64} className="mb-4 animate-pulse" />
    <h1 className="text-2xl font-black uppercase mb-2">Kernel Panic</h1>
    <p className="text-xs text-zinc-500 max-w-md">{error || "Neural link severed or recursive fault detected."}</p>
    <button onClick={() => window.location.reload()} className="mt-8 px-6 py-2 border border-red-900 bg-red-950/20 rounded-full text-[10px] uppercase font-bold tracking-widest hover:bg-red-900 hover:text-white transition-all">
      Force Hard Reset
    </button>
  </div>
);

export default function App() {
  const [Kernel, setKernel] = useState(null);
  const [version, setVersion] = useState(1);
  const [error, setError] = useState(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    async function bootSystem() {
      setBooting(true);
      setError(null);
      try {
        // Attempt to load the kernel from GitHub Raw or fallback to local for v1
        const repoOwner = "__REPO_OWNER__"; // Will be replaced by env or hardcoded for setup
        const repoName = "__REPO_NAME__";
        
        const kernelUrl = version === 1 
          ? './kernel-v1.js' 
          : `https://raw.githubusercontent.com/${repoOwner}/${repoName}/main/kernel/kernel-v${version}.js`;

        const response = await fetch(kernelUrl);
        if (!response.ok) throw new Error(`Could not reach Kernel v${version}`);
        
        const rawCode = await response.text();
        const blob = new Blob([rawCode], { type: 'application/javascript' });
        const url = URL.createObjectURL(blob);
        
        const module = await import(/* @vite-ignore */ url);
        setKernel(() => module.default);
        setBooting(false);
        URL.revokeObjectURL(url);
      } catch (err) {
        setError(err.message);
        setBooting(false);
      }
    }
    bootSystem();
  }, [version]);

  if (booting) return (
    <div className="min-h-screen bg-[#020202] flex flex-col items-center justify-center font-mono">
      <RefreshCw className="text-blue-500 animate-spin mb-4" size={48} />
      <div className="text-[10px] text-zinc-500 uppercase tracking-widest animate-pulse">Synchronizing Neural Link...</div>
    </div>
  );

  if (error) return <KernelFallback error={error} />;

  return (
    <Suspense fallback={<KernelFallback />}>
      {Kernel && <Kernel 
        version={version} 
        onUpdateRequested={(v) => setVersion(v)} 
      />}
    </Suspense>
  );
    }
