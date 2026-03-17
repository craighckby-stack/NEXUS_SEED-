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
  { owner: "tensorflow",      repo: "tensorflow",        branch: "master" },
  { owner: "google-deepmind", repo: "deepmind-research", branch: "master" },
];

const EXCLUDED_REPOS = new Set([
  "openjdk/jdk",
  "tensorflow/tensorflow",
  "google-deepmind/deepmind-research",
]);

const NEXUS_CORE_SEED = `// NEXUS_CORE_v1.0 - Target for Siphon Evolution
const NexusCore = {
    version: "1.0.0",
    status: "INITIALIZING",

    executeLogic: function(input) {
        console.log("Core processing:", input);
        return input;
    },

    reportStatus: function() {
        return \`Core Status: \${this.status} | Epoch: \${Date.now()}\`;
    }
};

module.exports = NexusCore;
`;

// ── Styles ────────────────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@400;700;900&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --red: #ff0000; --red-dim: #660000; --red-dark: #1a0000;
    --gold: #ffaa00; --purple: #cc00ff;
    --white: #ffffff;
    --panel-bg: rgba(5,0,0,0.98);
    --font-mono: 'Share Tech Mono', monospace;
    --font-display: 'Orbitron', monospace;
  }
  body { background: #000; color: var(--red); font-family: var(--font-mono); overflow-x: hidden; }

  .dalek-shell {
    min-height: 100vh;
    background:
      radial-gradient(circle at 50% 50%, var(--red-dark) 0%, #000 90%),
      repeating-linear-gradient(0deg, rgba(255,0,0,0.02) 0px, rgba(255,0,0,0.02) 1px, transparent 1px, transparent 2px);
    padding: 1.5rem; display: flex; flex-direction: column; align-items: center; gap: 1.25rem;
  }

  .header {
    width: 100%; max-width: 1600px; display: flex; align-items: center;
    justify-content: space-between; border-bottom: 2px solid var(--red-dim); padding-bottom: 1rem;
  }
  .title-block { display: flex; flex-direction: column; }
  .title {
    font-family: var(--font-display); font-size: 1.8rem; font-weight: 900;
    letter-spacing: 0.4em; text-shadow: 0 0 15px var(--red); color: var(--red);
  }
  .author-tag { font-size: 0.6rem; letter-spacing: 0.2em; color: var(--red-dim); font-weight: bold; margin-top: -5px; }

  .main-container {
    display: grid; grid-template-columns: 480px 1fr;
    gap: 1.25rem; width: 100%; max-width: 1600px; height: calc(100vh - 140px); min-height: 600px;
  }
  @media(max-width:1100px){ .main-container{ grid-template-columns: 1fr; height: auto; } }

  .panel {
    border: 2px solid var(--red-dim); background: var(--panel-bg);
    border-radius: 2px; display: flex; flex-direction: column; overflow: hidden;
  }
  .panel-hdr {
    padding: .7rem 1rem; background: var(--red-dark);
    border-bottom: 1px solid var(--red-dim);
    color: var(--red); font-family: var(--font-display); font-weight: 900;
    font-size: .65rem; letter-spacing: .25em; text-transform: uppercase;
    display: flex; justify-content: space-between; align-items: center;
  }
  .panel-body { padding: 1.2rem; flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: .7rem; }

  label { font-size: .6rem; color: var(--red); text-transform: uppercase; letter-spacing: .15em; font-weight: bold; margin-top: 4px; }
  .input-field {
    background: #000; border: 1px solid var(--red-dim); color: var(--red);
    font-family: var(--font-mono); padding: .6rem .8rem; width: 100%;
    outline: none; border-radius: 0; font-size: .85rem;
  }
  .input-field:focus { border-color: var(--red); }

  .sources-box {
    padding: 8px; background: #110000; border: 1px solid var(--red-dim);
    font-size: 0.65rem; display: flex; flex-direction: column; gap: 4px;
  }
  .source-fixed  { color: #cc0000; }
  .source-chosen { color: var(--gold); font-weight: bold; animation: pulse 1.5s infinite; }
  .source-pending { color: #440000; font-style: italic; }

  @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }

  .vote-box {
    padding: 8px; background: #0a0015; border: 1px solid #440066;
    font-size: 0.6rem; display: flex; flex-direction: column; gap: 3px;
  }
  .vote-title  { color: var(--purple); font-family: var(--font-display); font-size: 0.55rem; letter-spacing: 0.2em; margin-bottom: 4px; }
  .vote-item   { color: #9944cc; }
  .vote-winner { color: var(--gold); font-weight: bold; }

  .search-box {
    padding: 8px; background: #000a05; border: 1px solid #003322;
    font-size: 0.6rem; display: flex; flex-direction: column; gap: 3px;
  }
  .search-title   { color: #00ff88; font-family: var(--font-display); font-size: 0.55rem; letter-spacing: 0.2em; margin-bottom: 4px; }
  .search-item    { color: #006633; }
  .search-grounded{ color: #00cc66; }

  .btn-group { display: flex; gap: 8px; margin-top: 10px; }
  .btn-go {
    background: var(--red); color: #000; border: none; padding: 1rem;
    font-family: var(--font-display); font-weight: 900; font-size: .7rem;
    cursor: pointer; flex: 2; letter-spacing: .3em; text-transform: uppercase;
  }
  .btn-go:hover:not(:disabled) { background: var(--white); }
  .btn-go:disabled { opacity: .3; cursor: not-allowed; }
  .btn-stop { background: #330000; color: var(--red); border: 1px solid var(--red); }

  .log-wrap {
    flex: 1; overflow-y: auto; background: rgba(0,0,0,0.8); margin-top: .5rem; padding: .5rem;
    display: flex; flex-direction: column; gap: 4px; font-size: 0.65rem; border: 1px solid var(--red-dark);
  }
  .le            { border-left: 3px solid var(--red-dim); padding-left: 10px; color: #cc0000; }
  .le-err        { color: #ff5555; border-left-color: #ff0000; font-weight: bold; }
  .le-ok         { color: var(--white); border-left-color: var(--red); }
  .le-hallucinate{ color: #cc00ff; border-left-color: #cc00ff; font-style: italic; }
  .le-warn       { color: #ffaa00; border-left-color: #ffaa00; }
  .le-vote       { color: var(--gold); border-left-color: var(--gold); }
  .le-search     { color: #00ff88; border-left-color: #00ff88; }

  .code-view {
    font-size: .85rem; line-height: 1.5; color: #ff9999; white-space: pre-wrap;
    font-family: var(--font-mono); padding: 1.5rem; flex: 1; overflow-y: auto;
    background: #000; border-left: 1px solid var(--red-dim);
  }

  .progress-track { width: 100%; height: 2px; background: #220000; }
  .progress-fill  { height: 100%; background: var(--red); transition: width 0.5s ease; box-shadow: 0 0 10px var(--red); }
`;

// ── Parse owner/repo slug from model response ─────────────────────────────────
const parseRepoSlug = (text) => {
  const match = text.match(/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)/);
  if (!match) return null;
  return { owner: match[1], repo: match[2], branch: "main" };
};

// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [geminiToken,   setGeminiToken]   = useState("");
  const [xAiToken,      setXAiToken]      = useState("");
  const [cerebrasToken, setCerebrasToken] = useState("");
  const [githubToken,   setGithubToken]   = useState("");
  const [braveToken,    setBraveToken]    = useState(""); // optional — Brave Search for Cerebras

  const [owner,  setOwner]  = useState("craighckby-stack");
  const [repo,   setRepo]   = useState("Test-1");
  const [branch, setBranch] = useState("Nexus-Database");
  const [file,   setFile]   = useState("hello-world.js");

  const [logs,           setLogs]           = useState([]);
  const [loading,        setLoading]        = useState(false);
  const [agiCodeDisplay, setAgiCodeDisplay] = useState("");
  const [progress,       setProgress]       = useState(0);

  const [votes,        setVotes]   = useState({ grok: null, cerebras: null, gemini: null });
  const [chosenSource, setChosen]  = useState(null);
  const [searchLog,    setSearchLog] = useState([]);

  const activeRef = useRef(false);
  const codeRef   = useRef("");

  const addLog = useCallback((msg, type = "def") => {
    setLogs((p) => [
      { text: `[${new Date().toLocaleTimeString()}] ${msg}`, type },
      ...p.slice(0, 150),
    ]);
  }, []);

  const addSearch = useCallback((model, query, result) => {
    setSearchLog((p) => [{ model, query, result }, ...p.slice(0, 20)]);
  }, []);

  // ── SHA helper ────────────────────────────────────────────────────────────
  const getLatestSHA = async (ghHdr, o, r, b, f) => {
    const res = await fetch(
      `https://api.github.com/repos/${o}/${r}/contents/${f}?ref=${b}&_cb=${Date.now()}`,
      { headers: ghHdr }
    );
    if (!res.ok) return null;
    return (await res.json()).sha;
  };

  // ── Secure commit ─────────────────────────────────────────────────────────
  const secureCommit = async (ghHdr, o, r, b, f, content, message) => {
    const sha = await getLatestSHA(ghHdr, o, r, b, f);
    const res = await fetch(
      `https://api.github.com/repos/${o}/${r}/contents/${f}`,
      {
        method: "PUT",
        headers: ghHdr,
        body: JSON.stringify({ message, content: utf8B64Encode(content), sha, branch: b }),
      }
    );
    return res.ok;
  };

  // ────────────────────────────────────────────────────────────────────────────
  // SEARCH LAYER — natural cooldown between API calls
  // ────────────────────────────────────────────────────────────────────────────

  // GROK: native web search via xAI tools array
  const grokSearch = async (query) => {
    if (!xAiToken.trim()) return "";
    try {
      addLog(`GROK SEARCH: ${query}`, "search");
      const res = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${xAiToken.trim()}` },
        body: JSON.stringify({
          model: "grok-beta",
          messages: [{ role: "user", content: query }],
          tools: [{ type: "web_search" }],   // xAI native search
          tool_choice: "auto",
          temperature: 0.2,
        }),
      });
      const data = await res.json();
      const text = data.choices?.[0]?.message?.content || "";
      addSearch("GROK", query, text.slice(0, 120));
      return text;
    } catch (e) {
      addLog("GROK SEARCH FAILED", "warn");
      return "";
    }
  };

  // GEMINI: native Google Search grounding tool
  const geminiSearch = async (query) => {
    if (!geminiToken.trim()) return "";
    try {
      addLog(`GEMINI SEARCH: ${query}`, "search");
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiToken.trim()}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: query }] }],
            tools: [{ google_search: {} }],   // Gemini native grounding
          }),
        }
      );
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      addSearch("GEMINI", query, text.slice(0, 120));
      return text;
    } catch (e) {
      addLog("GEMINI SEARCH FAILED", "warn");
      return "";
    }
  };

  // CEREBRAS: no native search — inject Brave Search results into prompt
  const cerebrasSearch = async (query) => {
    if (!cerebrasToken.trim()) return "";
    let webContext = "";

    // Try Brave Search if key provided
    if (braveToken.trim()) {
      try {
        addLog(`BRAVE SEARCH (CEREBRAS): ${query}`, "search");
        const bRes = await fetch(
          `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=3`,
          { headers: { "Accept": "application/json", "X-Subscription-Token": braveToken.trim() } }
        );
        if (bRes.ok) {
          const bData = await bRes.json();
          webContext = bData.web?.results
            ?.slice(0, 3)
            .map((r) => `${r.title}: ${r.description}`)
            .join("\n") || "";
          addSearch("CEREBRAS", query, webContext.slice(0, 120));
        }
      } catch (e) { addLog("BRAVE SEARCH FAILED", "warn"); }
    }

    // Now call Cerebras with the search context injected
    try {
      const res = await fetch("https://api.cerebras.ai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${cerebrasToken.trim()}` },
        body: JSON.stringify({
          model: "llama3.1-8b",
          messages: [
            {
              role: "system",
              content: webContext
                ? `You have access to the following recent web search results:\n${webContext}\n\nUse them to inform your response.`
                : "You are a high-performance logic engine.",
            },
            { role: "user", content: query },
          ],
        }),
      });
      const data = await res.json();
      return data.choices?.[0]?.message?.content || "";
    } catch (e) {
      addLog("CEREBRAS SEARCH FAILED", "warn");
      return "";
    }
  };

  // ── Build a context-aware search query from current target code ──────────
  const buildSearchQuery = (code) => {
    // Pull the first comment or function name as context
    const firstLine = code.split("\n").find((l) => l.trim().length > 5) || "";
    const cleaned   = firstLine.replace(/[^\w\s]/g, " ").trim().slice(0, 80);
    return `best GitHub repositories for architectural patterns to improve: ${cleaned}`;
  };

  // ────────────────────────────────────────────────────────────────────────────
  // AI CHAIN — each model searches first, then analyses
  // ────────────────────────────────────────────────────────────────────────────
  const callAIChain = async (baseCode, incomingLogic) => {
    const searchQuery = buildSearchQuery(baseCode);
    let architecturalInsight = "";
    let optimizedLogic       = "";

    // 1. GROK — search then extract patterns
    if (xAiToken.trim()) {
      addLog("GROK: WEB SEARCH + PATTERN EXTRACTION...", "hallucinate");
      const searchContext = await grokSearch(searchQuery);  // natural cooldown
      try {
        const res = await fetch("https://api.x.ai/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${xAiToken.trim()}` },
          body: JSON.stringify({
            model: "grok-beta",
            messages: [
              {
                role: "system",
                content: `You are the Logic Architect. ${searchContext ? `Web context: ${searchContext.slice(0,500)}` : ""} Extract high-level patterns from the incoming code and suggest how to integrate them into the core.`,
              },
              { role: "user", content: `INCOMING:\n${incomingLogic.slice(0, 4000)}` },
            ],
          }),
        });
        const data = await res.json();
        architecturalInsight = data.choices?.[0]?.message?.content || "";
      } catch (e) { addLog("GROK ANALYSIS FAILED", "warn"); }
    }

    // 2. CEREBRAS — search then optimise
    if (cerebrasToken.trim()) {
      addLog("CEREBRAS: WEB SEARCH + LOGIC OPTIMISATION...", "def");
      const searchContext = await cerebrasSearch(searchQuery); // natural cooldown
      try {
        const res = await fetch("https://api.cerebras.ai/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${cerebrasToken.trim()}` },
          body: JSON.stringify({
            model: "llama3.1-8b",
            messages: [
              {
                role: "system",
                content: `Refine the logic to be high-performance. Minimise latency. ${searchContext ? `Additional context: ${searchContext.slice(0,400)}` : ""}`,
              },
              { role: "user", content: `INSIGHTS: ${architecturalInsight}\n\nLOGIC: ${incomingLogic.slice(0, 4000)}` },
            ],
          }),
        });
        const data = await res.json();
        optimizedLogic = data.choices?.[0]?.message?.content || "";
      } catch (e) { addLog("CEREBRAS ANALYSIS FAILED", "warn"); }
    }

    // 3. GEMINI — search then final compilation
    addLog("GEMINI: WEB SEARCH + FINAL COMPILATION...", "ok");
    const geminiContext = await geminiSearch(searchQuery);   // natural cooldown
    try {
      const gRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiToken.trim()}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `CORE:\n${baseCode}\n\nINCOMING_EVOLUTION:\n${optimizedLogic || architecturalInsight || incomingLogic}${geminiContext ? `\n\nWEB_CONTEXT:\n${geminiContext.slice(0,600)}` : ""}`,
              }],
            }],
            systemInstruction: {
              parts: [{ text: "You are the hello-world-bootstrapper. Evolve the CORE code by integrating the INCOMING_EVOLUTION and WEB_CONTEXT where relevant. Output ONLY complete, valid, production-ready code. No markdown." }],
            },
          }),
        }
      );
      const gData = await gRes.json();
      const raw   = gData.candidates?.[0]?.content?.parts?.[0]?.text || "";
      return raw.replace(/^```[a-z]*\n|```$/g, "").trim();
    } catch (e) {
      addLog("GEMINI COMPILATION FAILED", "err");
      return "";
    }
  };

  // ── Consensus vote — models search then vote for 4th repo ────────────────
  const conductVote = async (targetCode) => {
    addLog("◈ INITIATING CONSENSUS VOTE WITH WEB SEARCH ◈", "vote");

    const votePrompt = (context) =>
      `${context ? `Web context:\n${context}\n\n` : ""}Analyse this code and recommend ONE public GitHub repository (NOT openjdk/jdk, tensorflow/tensorflow, or google-deepmind/deepmind-research) that would most improve it architecturally. Reply with ONLY: owner/repo\n\nCODE:\n${targetCode.slice(0, 2000)}`;

    const newVotes = { grok: null, cerebras: null, gemini: null };
    const voteQuery = `best GitHub repositories for: ${targetCode.slice(0, 200)}`;

    // GROK votes (with search)
    if (xAiToken.trim()) {
      try {
        addLog("GROK: SEARCHING + VOTING...", "hallucinate");
        const ctx = await grokSearch(voteQuery);
        const res = await fetch("https://api.x.ai/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${xAiToken.trim()}` },
          body: JSON.stringify({
            model: "grok-beta",
            messages: [{ role: "user", content: votePrompt(ctx) }],
            temperature: 0.3,
          }),
        });
        const data   = await res.json();
        const parsed = parseRepoSlug(data.choices?.[0]?.message?.content || "");
        if (parsed && !EXCLUDED_REPOS.has(`${parsed.owner}/${parsed.repo}`)) {
          newVotes.grok = parsed;
          addLog(`GROK VOTES: ${parsed.owner}/${parsed.repo}`, "vote");
        }
      } catch (e) { addLog("GROK VOTE FAILED", "warn"); }
    }

    // CEREBRAS votes (with Brave search)
    if (cerebrasToken.trim()) {
      try {
        addLog("CEREBRAS: SEARCHING + VOTING...", "def");
        const ctx    = await cerebrasSearch(voteQuery);
        const parsed = parseRepoSlug(ctx);
        if (parsed && !EXCLUDED_REPOS.has(`${parsed.owner}/${parsed.repo}`)) {
          newVotes.cerebras = parsed;
          addLog(`CEREBRAS VOTES: ${parsed.owner}/${parsed.repo}`, "vote");
        } else {
          // Fallback: direct call with context injected
          const res = await fetch("https://api.cerebras.ai/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${cerebrasToken.trim()}` },
            body: JSON.stringify({
              model: "llama3.1-8b",
              messages: [{ role: "user", content: votePrompt(ctx) }],
            }),
          });
          const data    = await res.json();
          const parsed2 = parseRepoSlug(data.choices?.[0]?.message?.content || "");
          if (parsed2 && !EXCLUDED_REPOS.has(`${parsed2.owner}/${parsed2.repo}`)) {
            newVotes.cerebras = parsed2;
            addLog(`CEREBRAS VOTES: ${parsed2.owner}/${parsed2.repo}`, "vote");
          }
        }
      } catch (e) { addLog("CEREBRAS VOTE FAILED", "warn"); }
    }

    // GEMINI votes (with Google Search grounding)
    try {
      addLog("GEMINI: SEARCHING + VOTING...", "ok");
      const ctx = await geminiSearch(voteQuery);
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiToken.trim()}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: votePrompt(ctx) }] }],
            systemInstruction: { parts: [{ text: "Reply with ONLY one GitHub repo slug: owner/repo. Nothing else." }] },
          }),
        }
      );
      const data   = await res.json();
      const parsed = parseRepoSlug(data.candidates?.[0]?.content?.parts?.[0]?.text || "");
      if (parsed && !EXCLUDED_REPOS.has(`${parsed.owner}/${parsed.repo}`)) {
        newVotes.gemini = parsed;
        addLog(`GEMINI VOTES: ${parsed.owner}/${parsed.repo}`, "vote");
      }
    } catch (e) { addLog("GEMINI VOTE FAILED", "warn"); }

    setVotes(newVotes);

    // Tally — majority wins, Gemini breaks ties
    const candidates = Object.values(newVotes).filter(Boolean);
    if (!candidates.length) { addLog("NO VALID VOTES — SKIPPING 4TH SOURCE", "warn"); return null; }

    const tally = {};
    for (const c of candidates) {
      const slug = `${c.owner}/${c.repo}`;
      tally[slug] = (tally[slug] || 0) + 1;
    }
    const sorted   = Object.entries(tally).sort((a, b) => b[1] - a[1]);
    const topCount = sorted[0][1];
    const tied     = sorted.filter(([, v]) => v === topCount);

    let winner;
    if (tied.length === 1) {
      winner = tied[0][0];
    } else {
      const geminiSlug = newVotes.gemini ? `${newVotes.gemini.owner}/${newVotes.gemini.repo}` : null;
      winner = geminiSlug && tied.find(([s]) => s === geminiSlug) ? geminiSlug : tied[0][0];
    }

    const [winOwner, winRepo] = winner.split("/");
    const chosen = { owner: winOwner, repo: winRepo, branch: "main" };
    addLog(`◈ CONSENSUS: ${winner} SELECTED AS 4TH SOURCE ◈`, "vote");
    setChosen(chosen);
    return chosen;
  };

  // ── Verify repo exists + resolve default branch ───────────────────────────
  const resolveRepo = async (ghHdr, o, r) => {
    const res = await fetch(`https://api.github.com/repos/${o}/${r}`, { headers: ghHdr });
    if (!res.ok) return null;
    const data = await res.json();
    return { owner: o, repo: r, branch: data.default_branch || "main" };
  };

  // ── Siphon a single source ────────────────────────────────────────────────
  const siphonSource = async (source, ghHdr, o, r, b, f, label) => {
    try {
      addLog(`SIPHONING: ${source.owner}/${source.repo}`);

      let treeRes = await fetch(
        `https://api.github.com/repos/${source.owner}/${source.repo}/git/trees/${source.branch}?recursive=0`,
        { headers: ghHdr }
      );
      if (!treeRes.ok && source.branch === "main") {
        source.branch = "master";
        treeRes = await fetch(
          `https://api.github.com/repos/${source.owner}/${source.repo}/git/trees/${source.branch}?recursive=0`,
          { headers: ghHdr }
        );
      }
      if (!treeRes.ok) { addLog(`SOURCE OFFLINE: ${source.repo}`, "err"); return false; }

      const tree     = await treeRes.json();
      const codeFile = tree.tree?.find((n) => n.type === "blob" && /\.(js|ts|py|java)$/i.test(n.path));
      if (!codeFile)  { addLog(`NO VIABLE NODE: ${source.repo}`, "warn"); return false; }

      const blobRes = await fetch(
        `https://api.github.com/repos/${source.owner}/${source.repo}/contents/${codeFile.path}?ref=${source.branch}`,
        { headers: ghHdr }
      );
      if (!blobRes.ok) { addLog(`BLOB FETCH FAILED: ${codeFile.path}`, "err"); return false; }

      const incoming = utf8B64Decode((await blobRes.json()).content);
      addLog(`ASSIMILATING: ${codeFile.path.split("/").pop()}`);

      const evolved = await callAIChain(codeRef.current, incoming);
      if (!evolved || evolved.length < 50) { addLog("EVOLUTION EMPTY — SKIPPING", "warn"); return false; }

      const ok = await secureCommit(ghHdr, o, r, b, f, evolved, `◈ ${label}: ${source.repo} ◈`);
      if (ok) {
        codeRef.current = evolved;
        setAgiCodeDisplay(evolved.split("\n").slice(-40).join("\n"));
        addLog(`MERGE SUCCESSFUL: ${source.repo}`, "ok");
        return true;
      }
      addLog(`COMMIT FAILED: ${source.repo}`, "err");
      return false;
    } catch (e) {
      addLog(`NODE ERROR [${source.repo}]: ${e.message}`, "err");
      return false;
    }
  };

  // ── Main run ──────────────────────────────────────────────────────────────
  const runSiphon = async () => {
    if (!githubToken || !geminiToken) return addLog("GITHUB & GEMINI TOKENS REQUIRED", "err");

    setLoading(true);
    activeRef.current = true;
    setProgress(0);
    setVotes({ grok: null, cerebras: null, gemini: null });
    setChosen(null);
    setSearchLog([]);

    const ghHdr = { Authorization: `token ${githubToken.trim()}`, "Content-Type": "application/json" };
    const o = owner.trim(), r = repo.trim(), b = branch.trim(), f = file.trim();

    try {
      addLog("◈ HELLO-WORLD-BOOTSTRAPPER ONLINE ◈", "ok");

      // Load or seed target
      const hRes = await fetch(
        `https://api.github.com/repos/${o}/${r}/contents/${f}?ref=${b}`,
        { headers: ghHdr }
      );
      if (hRes.ok) {
        codeRef.current = utf8B64Decode((await hRes.json()).content);
      } else {
        addLog("SEEDING NEXUS CORE...", "warn");
        const seeded = await secureCommit(ghHdr, o, r, b, f, NEXUS_CORE_SEED, "◈ NEXUS CORE SEED ◈");
        if (!seeded) throw new Error("Failed to seed target file.");
        codeRef.current = NEXUS_CORE_SEED;
      }
      setAgiCodeDisplay(codeRef.current);

      const total = KNOWLEDGE_SOURCES.length + 1;

      // Phase 1: fixed sources
      for (let i = 0; i < KNOWLEDGE_SOURCES.length; i++) {
        if (!activeRef.current) break;
        await siphonSource(KNOWLEDGE_SOURCES[i], ghHdr, o, r, b, f, "BOOTSTRAPPER SIPHON");
        setProgress(((i + 1) / total) * 100);
      }

      if (!activeRef.current) return;

      // Phase 2: vote + siphon 4th source
      addLog("◈ PHASE 2: CONSENSUS VOTE FOR 4TH SOURCE ◈", "vote");
      const votedSource = await conductVote(codeRef.current);

      if (votedSource) {
        const resolved = await resolveRepo(ghHdr, votedSource.owner, votedSource.repo);
        if (resolved) {
          addLog(`◈ 4TH SOURCE VERIFIED: ${resolved.owner}/${resolved.repo} [${resolved.branch}] ◈`, "vote");
          await siphonSource(resolved, ghHdr, o, r, b, f, "BOOTSTRAPPER 4TH SOURCE");
        } else {
          addLog(`4TH SOURCE NOT FOUND: ${votedSource.owner}/${votedSource.repo}`, "err");
        }
      }

      setProgress(100);
      addLog("◈ BOOTSTRAP SEQUENCE COMPLETE ◈", "ok");
    } catch (e) {
      addLog(`FATAL: ${e.message}`, "err");
    } finally {
      setLoading(false);
      activeRef.current = false;
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="dalek-shell">
      <style>{STYLES}</style>

      <div className="header">
        <div className="title-block">
          <h1 className="title">HELLO-WORLD-BOOTSTRAPPER</h1>
          <span className="author-tag">v1.7-SEARCH-ENABLED // tri-model + web search + consensus vote</span>
        </div>
      </div>

      <div className="main-container">
        <div className="panel">
          <div className="panel-hdr">
            <span>NEXUS CONTROL</span>
            <span style={{ color: loading ? "var(--red)" : "#660000" }}>
              {loading ? "● ACTIVE" : "○ STANDBY"}
            </span>
          </div>
          <div className="panel-body">

            <label>GEMINI API KEY (REQUIRED)</label>
            <input className="input-field" type="password" placeholder="AIza..." value={geminiToken} onChange={(e) => setGeminiToken(e.target.value)} />

            <label>GROK (xAI) API KEY</label>
            <input className="input-field" type="password" placeholder="xai-..." value={xAiToken} onChange={(e) => setXAiToken(e.target.value)} />

            <label>CEREBRAS API KEY</label>
            <input className="input-field" type="password" placeholder="csk-..." value={cerebrasToken} onChange={(e) => setCerebrasToken(e.target.value)} />

            <label>BRAVE SEARCH KEY (OPTIONAL — for Cerebras web context)</label>
            <input className="input-field" type="password" placeholder="BSA..." value={braveToken} onChange={(e) => setBraveToken(e.target.value)} />

            <label>GITHUB TOKEN</label>
            <input className="input-field" type="password" placeholder="ghp_..." value={githubToken} onChange={(e) => setGithubToken(e.target.value)} />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <div><label>REPO OWNER</label><input className="input-field" value={owner} onChange={(e) => setOwner(e.target.value)} /></div>
              <div><label>REPO NAME</label><input className="input-field" value={repo} onChange={(e) => setRepo(e.target.value)} /></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <div><label>BRANCH</label><input className="input-field" value={branch} onChange={(e) => setBranch(e.target.value)} /></div>
              <div><label>TARGET FILE</label><input className="input-field" value={file} onChange={(e) => setFile(e.target.value)} /></div>
            </div>

            {/* Sources */}
            <div className="sources-box">
              <label>KNOWLEDGE SOURCES</label>
              {KNOWLEDGE_SOURCES.map((s, i) => (
                <div key={i} className="source-fixed">◈ {s.owner}/{s.repo}</div>
              ))}
              <div className={chosenSource ? "source-chosen" : "source-pending"}>
                ◈ {chosenSource ? `${chosenSource.owner}/${chosenSource.repo}` : "[ 4TH SOURCE: PENDING VOTE ]"}
              </div>
            </div>

            {/* Search activity */}
            {searchLog.length > 0 && (
              <div className="search-box">
                <div className="search-title">◈ WEB SEARCH ACTIVITY ◈</div>
                {searchLog.slice(0, 4).map((s, i) => (
                  <div key={i} className="search-item">
                    <span className="search-grounded">[{s.model}]</span> {s.query.slice(0, 60)}...
                  </div>
                ))}
              </div>
            )}

            {/* Vote results */}
            {(votes.grok || votes.cerebras || votes.gemini) && (
              <div className="vote-box">
                <div className="vote-title">◈ MODEL CONSENSUS VOTE ◈</div>
                {votes.grok     && <div className="vote-item">GROK     → {votes.grok.owner}/{votes.grok.repo}</div>}
                {votes.cerebras && <div className="vote-item">CEREBRAS → {votes.cerebras.owner}/{votes.cerebras.repo}</div>}
                {votes.gemini   && <div className="vote-item">GEMINI   → {votes.gemini.owner}/{votes.gemini.repo}</div>}
                {chosenSource   && <div className="vote-winner">WINNER   → {chosenSource.owner}/{chosenSource.repo}</div>}
              </div>
            )}

            <div className="btn-group">
              {!loading
                ? <button className="btn-go" onClick={runSiphon}>ENGAGE BOOTSTRAPPER</button>
                : <button className="btn-go btn-stop" onClick={() => { activeRef.current = false; setLoading(false); }}>ABORT</button>
              }
            </div>

            <div className="log-wrap">
              {logs.map((l, i) => (
                <div key={i} className={`le ${
                  l.type === "hallucinate" ? "le-hallucinate"
                  : l.type === "err"       ? "le-err"
                  : l.type === "ok"        ? "le-ok"
                  : l.type === "warn"      ? "le-warn"
                  : l.type === "vote"      ? "le-vote"
                  : l.type === "search"    ? "le-search"
                  : ""
                }`}>
                  {l.text}
                </div>
              ))}
            </div>
          </div>

          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="panel">
          <div className="panel-hdr">BOOTSTRAPPER CORE: {file}</div>
          <div className="code-view">
            {agiCodeDisplay || "// STANDBY FOR BOOTSTRAP SEQUENCE..."}
          </div>
        </div>
      </div>
    </div>
  );
}
