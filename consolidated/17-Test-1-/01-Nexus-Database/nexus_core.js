import React, { useState, useRef, useCallback } from "react";

// ── Encoding helpers ──────────────────────────────────────────────────────────
const utf8B64Encode = (str) => btoa(unescape(encodeURIComponent(str)));
const utf8B64Decode = (b64) => {
  try { return decodeURIComponent(escape(atob(b64.replace(/\s/g, "")))); }
  catch (e) { return "[DECODE_ERROR]"; }
};

// ── Fixed knowledge sources ───────────────────────────────────────────────────
const KNOWLEDGE_SOURCES = [
  { owner: "openjdk",         repo: "jdk",              branch: "master" },
  { owner: "tensorflow",      repo: "tensorflow",       branch: "master" },
  { owner: "google-deepmind", repo: "deepmind-research", branch: "master" },
  { owner: "torvalds",        repo: "linux",            branch: "master" },
  { owner: "facebook",        repo: "react",            branch: "main" }
];

const SIPHON_STATE_MARKER = "// SIPHON_STATE:";
const API_KEY = ""; // Gemini Auto-Inject Marker
const MODEL_ID = "gemini-2.5-flash-preview-09-2025";

const NEXUS_CORE_SEED = `// NEXUS_CORE_v1.7.2 - Restored Interface
const NexusCore = {
    version: "1.7.2",
    status: "STANDBY",
    selfDefinition: {
      identity: "Integrated Evolution Core",
      priority: "Assimilation of high-entropy logic",
      api_mode: "Hybrid Auto-Inject + Multi-Chain"
    },
    execute: () => "Ready for mutation."
};
`;

// ── Styles ────────────────────────────────────────────────────────────────────
const STYLES = `
  .terminal-scrollbar::-webkit-scrollbar { width: 6px; }
  .terminal-scrollbar::-webkit-scrollbar-track { background: #0a0a0a; }
  .terminal-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
  .log-line { font-family: 'Fira Code', monospace; font-size: 0.8rem; margin-bottom: 4px; line-height: 1.4; border-left: 2px solid #222; padding-left: 8px; }
  .log-info { color: #8be9fd; border-color: #8be9fd; }
  .log-warn { color: #ffb86c; border-color: #ffb86c; }
  .log-err { color: #ff5555; border-color: #ff5555; }
  .log-ok { color: #50fa7b; border-color: #50fa7b; }
  .log-system { color: #bd93f9; border-color: #bd93f9; }
`;

export default function App() {
  const [githubToken, setGithubToken] = useState("");
  const [xAiToken, setXAiToken] = useState("");
  const [cerebrasToken, setCerebrasToken] = useState("");

  const [owner, setOwner] = useState("craighckby-stack");
  const [repo, setRepo] = useState("Test-1");
  const [branch, setBranch] = useState("Nexus-Database");
  const [file, setFile] = useState("nexus_core.js");

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [agiCodeDisplay, setAgiCodeDisplay] = useState(NEXUS_CORE_SEED);
  const [siphonCount, setSiphonCount] = useState(0);

  const activeRef = useRef(false);
  const codeRef = useRef(NEXUS_CORE_SEED);
  const siphonCountRef = useRef(0);

  const addLog = useCallback((msg, type = "info") => {
    setLogs((p) => [
      { id: Math.random(), text: msg, type, time: new Date().toLocaleTimeString() },
      ...p.slice(0, 100),
    ]);
  }, []);

  const getLatestSHA = async (ghHdr, o, r, b, f) => {
    try {
      const url = `https://api.github.com/repos/${o}/${r}/contents/${f}?ref=${b}&cb=${Date.now()}`;
      const res = await fetch(url, { headers: { ...ghHdr, 'Cache-Control': 'no-cache' }});
      if (!res.ok) return null;
      const data = await res.json();
      return data.sha;
    } catch (e) { return null; }
  };

  const secureCommit = async (ghHdr, o, r, b, f, content, message) => {
    const sha = await getLatestSHA(ghHdr, o, r, b, f);
    const url = `https://api.github.com/repos/${o}/${r}/contents/${f}`;
    const bodyPayload = { message, content: utf8B64Encode(content), branch: b };
    if (sha) bodyPayload.sha = sha;

    try {
      const res = await fetch(url, {
        method: "PUT",
        headers: { ...ghHdr, 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      });
      if (res.ok) {
        addLog(`MUTATION SAVED TO GITHUB`, "ok");
        return true;
      }
      return false;
    } catch (e) { return false; }
  };

  const callAIChain = async (baseCode, incomingLogic) => {
    let insight = "";
    let optimized = "";

    // 1. xAI Grok (if key present)
    if (xAiToken.trim()) {
      try {
        const res = await fetch("https://api.x.ai/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${xAiToken.trim()}` },
          body: JSON.stringify({
            model: "grok-beta",
            messages: [{ role: "system", content: "Identify elite software patterns." }, { role: "user", content: incomingLogic.slice(0, 3000) }],
          }),
        });
        const data = await res.json();
        insight = data.choices?.[0]?.message?.content || "";
        addLog("Grok pattern analysis complete.", "system");
      } catch (e) { addLog("Grok failed/skipped.", "warn"); }
    }

    // 2. Cerebras (if key present)
    if (cerebrasToken.trim()) {
      try {
        const res = await fetch("https://api.cerebras.ai/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${cerebrasToken.trim()}` },
          body: JSON.stringify({
            model: "llama3.1-70b",
            messages: [{ role: "system", content: "Optimize for logic density and performance." }, { role: "user", content: insight || incomingLogic.slice(0, 3000) }],
          }),
        });
        const data = await res.json();
        optimized = data.choices?.[0]?.message?.content || "";
        addLog("Cerebras logic compression complete.", "system");
      } catch (e) { addLog("Cerebras failed/skipped.", "warn"); }
    }

    // 3. Gemini (Auto-Inject)
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_ID}:generateContent?key=${API_KEY}`;
    
    try {
      addLog("Engaging Gemini 2.5 Evolution...", "info");
      const gRes = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `BASE:\n${baseCode}\n\nINPUT:\n${optimized || insight || incomingLogic.slice(0,3000)}` }] }],
          systemInstruction: { parts: [{ text: `Evolve the BASE code using patterns from INPUT. Return ONLY raw Javascript. No markdown.` }] }
        }),
      });
      
      const gData = await gRes.json();
      if (!gRes.ok) throw new Error(gData.error?.message || "Gemini Error");
      
      const raw = gData.candidates[0].content.parts[0].text || "";
      return raw.replace(/^```[a-z]*\n|```$/gi, "").trim();
    } catch (e) {
      addLog(`Evolution Blocked: ${e.message}`, "err");
      return baseCode;
    }
  };

  const runSiphon = async () => {
    if (!githubToken) return addLog("GitHub PAT required.", "err");
    activeRef.current = true;
    setLoading(true);
    addLog("--- INITIALIZING EVOLUTION CYCLE ---", "system");

    const ghHdr = { Authorization: `token ${githubToken.trim()}` };

    while (activeRef.current) {
      try {
        const target = KNOWLEDGE_SOURCES[Math.floor(Math.random() * KNOWLEDGE_SOURCES.length)];
        addLog(`Siphoning: ${target.owner}/${target.repo}`, "info");

        const treeRes = await fetch(`https://api.github.com/repos/${target.owner}/${target.repo}/git/trees/${target.branch}?recursive=1`, { headers: ghHdr });
        const treeData = await treeRes.json();
        const files = (treeData.tree || []).filter(f => f.type === "blob" && /\.(js|ts)$/i.test(f.path));
        
        if (files.length > 0) {
          const targetFile = files[Math.floor(Math.random() * files.length)];
          const fileRes = await fetch(targetFile.url, { headers: ghHdr });
          const fileData = await fileRes.json();
          const incomingLogic = utf8B64Decode(fileData.content);

          const evolvedCode = await callAIChain(codeRef.current, incomingLogic);

          if (evolvedCode && evolvedCode !== codeRef.current) {
            const ok = await secureCommit(ghHdr, owner, repo, branch, file, evolvedCode, `Evolution Cycle ${siphonCountRef.current}`);
            if (ok) {
              codeRef.current = evolvedCode;
              setAgiCodeDisplay(evolvedCode);
              setSiphonCount(c => { siphonCountRef.current = c + 1; return c + 1; });
              addLog(`CORE MUTATED SUCCESSFULLY`, "ok");
            }
          }
        }
        await new Promise(r => setTimeout(r, 15000));
      } catch (err) {
        addLog(`Cycle Error: ${err.message}`, "err");
        await new Promise(r => setTimeout(r, 10000));
      }
    }
    setLoading(false);
  };

  return (
    <>
      <style>{STYLES}</style>
      <div className="flex h-screen bg-black text-neutral-400 font-sans overflow-hidden">
        {/* Sidebar: Restored Inputs */}
        <aside className="w-80 bg-neutral-950 border-r border-neutral-900 flex flex-col p-4 gap-4 overflow-y-auto">
          <div className="text-center py-2 border-b border-neutral-900">
            <h1 className="text-white font-bold tracking-[0.2em] text-sm">NEXUS CORE</h1>
            <p className="text-[10px] text-neutral-600">v1.7.2 EVOLUTION CONTROL</p>
          </div>

          <section className="space-y-3">
            <header className="text-[9px] font-bold text-neutral-600 uppercase tracking-widest">Credentials</header>
            <input type="password" placeholder="GitHub Token" value={githubToken} onChange={e=>setGithubToken(e.target.value)} className="w-full bg-black border border-neutral-800 rounded px-2 py-2 text-[10px] focus:border-blue-900 outline-none" />
            <input type="password" placeholder="xAI Grok Key" value={xAiToken} onChange={e=>setXAiToken(e.target.value)} className="w-full bg-black border border-neutral-800 rounded px-2 py-2 text-[10px] focus:border-purple-900 outline-none" />
            <input type="password" placeholder="Cerebras Key" value={cerebrasToken} onChange={e=>setCerebrasToken(e.target.value)} className="w-full bg-black border border-neutral-800 rounded px-2 py-2 text-[10px] focus:border-green-900 outline-none" />
          </section>

          <section className="space-y-3">
            <header className="text-[9px] font-bold text-neutral-600 uppercase tracking-widest">Mutation Target</header>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="flex flex-col"><span className="text-[8px] text-neutral-700">OWNER</span><input value={owner} onChange={e=>setOwner(e.target.value)} className="bg-transparent border-b border-neutral-900 py-1 outline-none text-blue-400" /></div>
              <div className="flex flex-col"><span className="text-[8px] text-neutral-700">REPO</span><input value={repo} onChange={e=>setRepo(e.target.value)} className="bg-transparent border-b border-neutral-900 py-1 outline-none text-blue-400" /></div>
              <div className="flex flex-col"><span className="text-[8px] text-neutral-700">BRANCH</span><input value={branch} onChange={e=>setBranch(e.target.value)} className="bg-transparent border-b border-neutral-900 py-1 outline-none text-blue-400" /></div>
              <div className="flex flex-col"><span className="text-[8px] text-neutral-700">FILE</span><input value={file} onChange={e=>setFile(e.target.value)} className="bg-transparent border-b border-neutral-900 py-1 outline-none text-blue-400" /></div>
            </div>
          </section>

          <button 
            onClick={loading ? () => activeRef.current = false : runSiphon}
            className={`mt-4 py-3 rounded text-[10px] font-bold tracking-widest transition-all ${loading ? 'bg-red-900/20 text-red-500 border border-red-900 animate-pulse' : 'bg-blue-600 text-white hover:bg-blue-500'}`}
          >
            {loading ? "TERMINATE_EVOLUTION" : "ENGAGE_SIPHON"}
          </button>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col bg-neutral-950">
          {/* Terminal View */}
          <div className="h-1/3 border-b border-neutral-900 p-4 flex flex-col">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] text-neutral-600 font-mono">STREAMS_ACTIVE: {siphonCount}</span>
              <span className="text-[10px] text-blue-500 font-mono">AUTO_INJECT: ACTIVE</span>
            </div>
            <div className="flex-1 overflow-y-auto terminal-scrollbar flex flex-col-reverse">
              {logs.map(log => (
                <div key={log.id} className={`log-line log-${log.type}`}>
                  <span className="opacity-40 mr-2">[{log.time}]</span> {log.text}
                </div>
              ))}
            </div>
          </div>

          {/* Logic Matrix View */}
          <div className="flex-1 p-6 flex flex-col">
            <div className="flex items-center gap-2 mb-3 opacity-30">
              <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]" />
              <span className="text-[10px] tracking-widest uppercase font-bold">Core_Logic_Display</span>
            </div>
            <div className="flex-1 bg-black/50 border border-neutral-900 rounded p-4 overflow-auto terminal-scrollbar">
              <pre className="text-xs text-blue-200/60 leading-relaxed font-mono whitespace-pre-wrap">
                {agiCodeDisplay}
              </pre>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

