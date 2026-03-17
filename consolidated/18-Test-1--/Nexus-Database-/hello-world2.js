import { useState, useEffect, useCallback } from "react";

// Constants are defined outside the component to prevent re-creation on every render,
// optimizing memory usage and ensuring consistent references.
const GITHUB_RAW = "https://raw.githubusercontent.com/craighckby-stack/Test-1/Nexus-Database/README.md"; // Default README path
const GEMINI_API = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
const SYSTEM_FILE_COUNT = 2003; // This is a fixed constant, no need for state

// AIM_CONFIG is present in the original code but not used in the component's logic or render.
// Keeping it as per the original for consistency. As a constant, it doesn't impact performance.
const AIM_CONFIG = {
  "schema_version": "AIM_V2.0",
  "description": "Agent Integrity Monitoring Manifest. Defines mandatory runtime constraints and enforcement scopes, standardized on metric units and grouped policy layers.",
  "integrity_profiles": {
    "SGS_AGENT": {
      "monitoring_slo_id": "GATM_P_SGS_SLO",
      "constraints": {
        "resource_limits": {
          "cpu_limit_percentage": 75,
          "memory_limit_bytes": 4194304000
        },
        "security_policy": {
          "syscalls_allowed": [
            "read",
            "write",
            "mmap",
            "exit"
          ],
          "network_ports_disallowed": [
            22,
            23
          ],
          "paths_immutable": [
            "/opt/sgs/gacr/"
          ],
          "configuration_hash_mandate": "SHA256:d5f2a1b9e0c4..."
        }
      }
    },
    "GAX_AGENT": {
      "monitoring_slo_id": "GATM_P_GAX_SLO",
      "constraints": {
        "resource_limits": {
          "cpu_limit_percentage": 10,
          "memory_limit_bytes": 524288000
        },
        "security_policy": {
          "syscalls_allowed": [
            "read",
            "exit"
          ],
          "file_access_root_paths": [
            "/opt/gax/policy_data/"
          ],
          "network_mode": "POLICY_FETCH_ONLY"
        }
      }
    },
    "CRoT_AGENT": {
      "monitoring_slo_id": "GATM_P_CRoT_SLO",
      "constraints": {
        "resource_limits": {
          "memory_limit_bytes": 131072000
        },
        "security_policy": {
          "network_mode": "NONE",
          "time_sync_source_critical": "CRITICAL_NTP_A"
        }
      }
    }
  }
};

// Styles are also a constant, defined once to prevent re-creation and ensure
// the style tag is only updated if the string content itself changes (which it won't here).
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@400;700;900&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: #000;
    color: #00ff88;
    font-family: 'Share Tech Mono', monospace;
  }

  .nexus {
    min-height: 100vh;
    background: radial-gradient(ellipse at 20% 50%, #001a0d 0%, #000 60%),
                radial-gradient(ellipse at 80% 20%, #000d1a 0%, transparent 50%);
    padding: 2rem;
    position: relative;
    overflow: hidden;
  }

  .nexus::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image:
      linear-gradient(rgba(0,255,136,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0,255,136,0.03) 1px, transparent 1px);
    background-size: 40px 40px;
    pointer-events: none;
    z-index: 0;
  }

  .header {
    text-align: center;
    margin-bottom: 2rem;
    position: relative;
    z-index: 1;
  }

  .title {
    font-family: 'Orbitron', monospace;
    font-size: clamp(1.2rem, 3vw, 2rem);
    font-weight: 900;
    letter-spacing: 0.2em;
    color: #00ff88;
    text-shadow: 0 0 20px rgba(0,255,136,0.8), 0 0 40px rgba(0,255,136,0.4);
    animation: pulse 3s ease-in-out infinite;
  }

  .subtitle {
    font-size: 0.7rem;
    color: #004d29;
    letter-spacing: 0.4em;
    margin-top: 0.5rem;
  }

  @keyframes pulse {
    0%, 100% { text-shadow: 0 0 20px rgba(0,255,136,0.8), 0 0 40px rgba(0,255,136,0.4); }
    50% { text-shadow: 0 0 40px rgba(0,255,136,1), 0 0 80px rgba(0,255,136,0.6), 0 0 120px rgba(0,255,136,0.3); }
  }

  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    position: relative;
    z-index: 1;
    max-width: 1400px;
    margin: 0 auto;
  }

  @media (max-width: 900px) {
    .grid { grid-template-columns: 1fr; }
  }

  .panel {
    border: 1px solid rgba(0,255,136,0.2);
    background: rgba(0,10,5,0.8);
    backdrop-filter: blur(10px);
    border-radius: 4px;
    overflow: hidden;
    box-shadow: 0 0 20px rgba(0,255,136,0.05), inset 0 0 20px rgba(0,255,136,0.02);
  }

  .panel-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: rgba(0,255,136,0.05);
    border-bottom: 1px solid rgba(0,255,136,0.15);
    font-family: 'Orbitron', monospace;
    font-size: 0.65rem;
    letter-spacing: 0.15em;
    color: #00cc6a;
  }

  .dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: #00ff88;
    box-shadow: 0 0 6px #00ff88;
    animation: blink 2s ease-in-out infinite;
  }

  .dot.red { background: #ff4444; box-shadow: 0 0 6px #ff4444; }
  .dot.yellow { background: #ffaa00; box-shadow: 0 0 6px #ffaa00; }

  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }

  .panel-body { padding: 1rem; }

  .input-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }

  .input-label {
    font-size: 0.65rem;
    color: #006633;
    letter-spacing: 0.2em;
  }

  .input-field {
    background: rgba(0,255,136,0.03);
    border: 1px solid rgba(0,255,136,0.2);
    color: #00ff88;
    font-family: 'Share Tech Mono', monospace;
    font-size: 0.75rem;
    padding: 0.6rem 0.8rem;
    border-radius: 2px;
    outline: none;
    transition: border-color 0.3s, box-shadow 0.3s;
    width: 100%;
  }

  .input-field:focus {
    border-color: rgba(0,255,136,0.6);
    box-shadow: 0 0 10px rgba(0,255,136,0.1);
  }

  .input-field::placeholder { color: #003319; }

  .btn {
    font-family: 'Orbitron', monospace;
    font-size: 0.65rem;
    letter-spacing: 0.2em;
    padding: 0.7rem 1.2rem;
    border: 1px solid rgba(0,255,136,0.4);
    background: rgba(0,255,136,0.05);
    color: #00ff88;
    cursor: pointer;
    border-radius: 2px;
    transition: all 0.3s;
    width: 100%;
    margin-top: 0.5rem;
  }

  .btn:hover:not(:disabled) {
    background: rgba(0,255,136,0.15);
    border-color: #00ff88;
    box-shadow: 0 0 20px rgba(0,255,136,0.2);
  }

  .btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .btn.danger {
    border-color: rgba(255,68,68,0.4);
    color: #ff6666;
    background: rgba(255,68,68,0.05);
  }

  .btn.danger:hover:not(:disabled) {
    background: rgba(255,68,68,0.15);
    border-color: #ff4444;
    box-shadow: 0 0 20px rgba(255,68,68,0.2);
  }

  .readme-box {
    background: rgba(0,255,136,0.02);
    border: 1px solid rgba(0,255,136,0.1);
    border-radius: 2px;
    padding: 0.75rem;
    font-size: 0.7rem;
    line-height: 1.6;
    color: #009955;
    max-height: 200px;
    overflow-y: auto;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .readme-box::-webkit-scrollbar { width: 4px; }
  .readme-box::-webkit-scrollbar-track { background: transparent; }
  .readme-box::-webkit-scrollbar-thumb { background: rgba(0,255,136,0.3); }

  .output-box {
    background: rgba(0,0,0,0.5);
    border: 1px solid rgba(0,255,136,0.15);
    border-radius: 2px;
    padding: 0.75rem;
    font-size: 0.72rem;
    line-height: 1.7;
    color: #00cc6a;
    min-height: 300px;
    max-height: 500px;
    overflow-y: auto;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .output-box::-webkit-scrollbar { width: 4px; }
  .output-box::-webkit-scrollbar-thumb { background: rgba(0,255,136,0.3); }

  .status-bar {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.4rem 1rem;
    background: rgba(0,255,136,0.03);
    border-top: 1px solid rgba(0,255,136,0.1);
    font-size: 0.6rem;
    color: #004d29;
    letter-spacing: 0.15em;
  }

  .file-count {
    grid-column: 1 / -1;
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .stat-card {
    flex: 1;
    min-width: 120px;
    border: 1px solid rgba(0,255,136,0.15);
    background: rgba(0,10,5,0.9);
    padding: 0.75rem 1rem;
    border-radius: 4px;
    text-align: center;
  }

  .stat-value {
    font-family: 'Orbitron', monospace;
    font-size: 1.5rem;
    font-weight: 700;
    color: #00ff88;
    text-shadow: 0 0 15px rgba(0,255,136,0.6);
  }

  .stat-label {
    font-size: 0.6rem;
    color: #004d29;
    letter-spacing: 0.2em;
    margin-top: 0.25rem;
  }

  .thinking {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #006633;
    font-size: 0.7rem;
    padding: 0.5rem 0;
  }

  .thinking span {
    animation: dots 1.5s steps(3, end) infinite;
  }

  @keyframes dots {
    0% { content: '.'; }
    33% { content: '..'; }
    66% { content: '...'; }
  }

  .scan-line {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, #00ff88, transparent);
    animation: scan 4s linear infinite;
    opacity: 0.3;
    z-index: 0;
  }

  @keyframes scan {
    0% { top: 0; }
    100% { top: 100vh; }
  }

  .tag {
    display: inline-block;
    padding: 0.1rem 0.4rem;
    border: 1px solid rgba(0,255,136,0.3);
    border-radius: 2px;
    font-size: 0.6rem;
    color: #00aa55;
    margin: 0.1rem;
  }

  .error { color: #ff6666; border-color: rgba(255,68,68,0.3); }
  .success { color: #00ff88; }
`;

export default function NexusAGIBuilder() {
  // State variables are declared using useState. These manage the mutable data
  // specific to this component's functionality. Keeping state granular helps with updates.
  const [githubToken, setGithubToken] = useState("");
  const [geminiKey, setGeminiKey] = useState("");
  const [readmePath, setReadmePath] = useState(GITHUB_RAW);
  const [readme, setReadme] = useState("");
  const [output, setOutput] = useState("");
  const [status, setStatus] = useState("STANDBY");
  const [loading, setLoading] = useState(false);
  const [buildLog, setBuildLog] = useState([]);

  // Derived state: isReadmeLoaded is computed directly from the 'readme' state.
  // This avoids creating an unnecessary additional state variable and its setter,
  // ensuring consistency and reducing state management overhead.
  const isReadmeLoaded = !!readme;

  // useCallback is used to memoize functions that are passed down to child components
  // or used as event handlers. This prevents unnecessary re-renders of child components
  // due to function identity changes across renders, optimizing performance.

  // Memoized logging function for the build log.
  const log = useCallback((msg, type = "info") => {
    // Optimizing timestamp creation to be efficient
    const timestamp = new Date().toISOString().slice(11, 19); // "HH:mm:ss"

    // Using functional update for setBuildLog ensures the latest state is used,
    // even with an empty dependency array for `log`, which optimizes state updates.
    setBuildLog(prev => [...prev, { timestamp, msg, type }]);
  }, []); // Dependencies array is empty as React guarantees `setBuildLog` (a state setter) is stable.

  // Memoized function to fetch the README content.
  const fetchReadme = useCallback(async () => {
    setLoading(true);
    setStatus("FETCHING README");
    log("Initiating README fetch from Nexus-Database branch...");

    try {
      const headers = { "Accept": "application/vnd.github.v3.raw" };
      if (githubToken) headers["Authorization"] = `token ${githubToken}`;

      // Normalize URL to raw.githubusercontent.com for consistency.
      // This logic is optimized to handle different GitHub URL formats more robustly.
      // Avoids unnecessary replacements if already a raw URL.
      let url = readmePath;
      if (url.includes("github.com") && !url.includes("raw.githubusercontent.com")) {
        url = url.replace("github.com", "raw.githubusercontent.com").replace("/blob/", "/");
      }

      const res = await fetch(url, { headers });

      // Early exit for error conditions to prevent further processing, improving robustness.
      if (!res.ok) {
        throw new Error(`GitHub returned ${res.status}: ${res.statusText}`);
      }

      const text = await res.text();
      setReadme(text);
      setStatus("README LOADED");
      log(`README fetched: ${text.length} characters`, "success");
      // Memoizing the regex for efficiency if used repeatedly in a hot path, though here it's fine.
      // For one-off use in a callback, direct usage is clear and efficient enough.
      log(`Detected ${(text.match(/^#{1,6}\s/gm) || []).length} sections`, "info");
    } catch (err) {
      setStatus("FETCH ERROR");
      log(`ERROR: ${err.message}`, "error");
      setReadme(`// FETCH FAILED\n// ${err.message}\n// Check GitHub token and URL`);
    } finally {
      setLoading(false);
    }
  }, [githubToken, readmePath, log]); // Dependencies ensure the function updates only when these values change, optimizing its memoization.

  // Memoized function to initiate the Gemini build process.
  const buildFromReadme = useCallback(async () => {
    // Early exit/guard clause for invalid state, improving robustness and preventing unnecessary API calls.
    if (!readme || !geminiKey) {
      log("ERROR: README content and Gemini API key are required", "error");
      setStatus("BUILD ABORTED"); // Clearer status when aborted
      return;
    }

    setLoading(true);
    setStatus("BUILDING FROM README");
    setOutput(""); // Clear previous output for a new build.
    log("Initializing Gemini build sequence...");
    log(`Processing ${SYSTEM_FILE_COUNT} file AGI safety system...`);

    // The prompt is constructed dynamically but includes constant values
    // like SYSTEM_FILE_COUNT, which are efficiently referenced.
    const prompt = `You are an AGI Safety System architect. You have been given a README file from a repository containing ${SYSTEM_FILE_COUNT} files in an AGI safety system called the Nexus Database.

README CONTENT:
\`\`\`
${readme}
\`\`\`

Based on this README, generate a detailed technical implementation plan and Python code structure for the AGI safety system. Include:

1. A summary of what the system does based on the README
2. The core Python module structure (as actual importable code)
3. Key safety constraints derived from the README
4. How this maps to the AGI blueprint:
   - purpose = "Artificial General Intelligence"
   - from origin import InfiniteLoop, ReverseEngineer
   - governance_constrained=True
   - self_modification_bounded=True
   - creator_mirrors_creation=True

5. The first 50 files of the ${SYSTEM_FILE_COUNT}-file structure with their purpose

Format as a technical document with code blocks. Be specific and detailed.`;

    try {
      const res = await fetch(`${GEMINI_API}?key=${geminiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 4096 }
        })
      });

      // Early exit for API errors, enhancing error handling.
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || `Gemini API error ${res.status}`);
      }

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

      // Early exit if no valid text response is found, ensuring a clearer error.
      if (!text) {
        throw new Error("No valid content received from Gemini.");
      }

      setOutput(text);
      setStatus("BUILD COMPLETE");
      log("Gemini build sequence complete", "success");
      log(`Generated ${text.length} characters of architecture`, "success");
    } catch (err) {
      setStatus("BUILD ERROR");
      log(`BUILD FAILED: ${err.message}`, "error");
      setOutput(`// BUILD FAILED\n// ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [readme, geminiKey, log]); // Dependencies ensure the function updates only when these values change, optimizing its memoization. SYSTEM_FILE_COUNT is a constant, so not a dependency.

  return (
    <>
      {/* Styles are injected once from the STYLES constant, preventing re-rendering of the style tag content,
          which is an optimization for static styles. */}
      <style>{STYLES}</style>
      <div className="nexus">
        <div className="scan-line" />

        <div className="header">
          <div className="title">◈ NEXUS AGI SAFETY SYSTEM ◈</div>
          <div className="subtitle">PURPOSE FIRST · LIBRARIES SECOND · HELLO WORLD LAST</div>
        </div>

        <div className="grid">

          {/* Stats Row leverages SYSTEM_FILE_COUNT constant and status state.
              Simple calculations for display are efficient here and don't require memoization. */}
          <div className="file-count">
            <div className="stat-card">
              <div className="stat-value">{SYSTEM_FILE_COUNT}</div>
              <div className="stat-label">SYSTEM FILES</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{fontSize:"1rem"}}>86B</div>
              <div className="stat-label">NEURON EQUIV</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{color: status.includes("ERROR") ? "#ff4444" : "#00ff88", fontSize:"0.8rem"}}>
                {status}
              </div>
              <div className="stat-label">SYSTEM STATUS</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{fontSize:"1rem"}}>∞</div>
              <div className="stat-label">LOOP ORIGIN</div>
            </div>
          </div>

          {/* Config Panel */}
          <div className="panel">
            <div className="panel-header">
              <div className="dot" />
              <div className="dot yellow" />
              <div className="dot red" />
              &nbsp;// NEXUS CONFIGURATION
            </div>
            <div className="panel-body">

              <div className="input-group">
                <div className="input-label">// GITHUB_TOKEN (optional for public repos)</div>
                <input
                  className="input-field"
                  type="password"
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  value={githubToken}
                  onChange={e => setGithubToken(e.target.value)} // Direct state updates are efficient.
                />
              </div>

              <div className="input-group">
                <div className="input-label">// GEMINI_API_KEY (required for build)</div>
                <input
                  className="input-field"
                  type="password"
                  placeholder="AIzaSy..."
                  value={geminiKey}
                  onChange={e => setGeminiKey(e.target.value)} // Direct state updates are efficient.
                />
              </div>

              <div className="input-group">
                <div className="input-label">// README_PATH (raw URL or github.com URL)</div>
                <input
                  className="input-field"
                  value={readmePath}
                  onChange={e => setReadmePath(e.target.value)} // Direct state updates are efficient.
                />
              </div>

              {/* Buttons use memoized functions (useCallback) and derived state (isReadmeLoaded)
                  for their `onClick` and `disabled` props, optimizing event handling and render logic. */}
              <button className="btn" onClick={fetchReadme} disabled={loading}>
                {loading && status.includes("FETCH") ? "[ FETCHING... ]" : "[ FETCH README ]"}
              </button>

              <button
                className="btn"
                onClick={buildFromReadme}
                disabled={loading || !isReadmeLoaded} // Optimized with derived state `isReadmeLoaded` for efficient conditional rendering.
              >
                {loading && status.includes("BUILD") ? "[ BUILDING... ]" : "[ BUILD FROM README ]"}
              </button>

              {/* Build Log */}
              <div style={{marginTop:"1rem"}}>
                <div className="input-label" style={{marginBottom:"0.5rem"}}>// EXECUTION LOG</div>
                <div className="readme-box" style={{maxHeight:"150px"}}>
                  {buildLog.length === 0 && <span style={{color:"#002211"}}>// awaiting initialization...</span>}
                  {buildLog.map((entry, i) => (
                    // Using index as key is acceptable here as log entries are append-only and not reordered.
                    <div key={i} style={{color: entry.type === "error" ? "#ff6666" : entry.type === "success" ? "#00ff88" : "#006633"}}>
                      [{entry.timestamp}] {entry.msg}
                    </div>
                  ))}
                  {loading && (
                    <div className="thinking">
                      // processing<span>...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="status-bar">
              <div className="dot" style={{animationDelay:"0.5s"}} />
              NEXUS-DATABASE · BRANCH: AGI-SAFETY · FILES: {SYSTEM_FILE_COUNT}
            </div>
          </div>

          {/* README Panel */}
          <div className="panel">
            <div className="panel-header">
              <div className="dot" />
              &nbsp;// README.md · NEXUS-DATABASE BRANCH
            </div>
            <div className="panel-body">
              <div className="readme-box" style={{maxHeight:"380px"}}>
                {readme || <span style={{color:"#002211"}}>// README not yet fetched...\n// Click [ FETCH README ] to load</span>}
              </div>
              {isReadmeLoaded && ( // Optimized with derived state `isReadmeLoaded` for efficient conditional rendering.
                <div style={{marginTop:"0.5rem", display:"flex", flexWrap:"wrap"}}>
                  <span className="tag">✓ LOADED</span>
                  {/* These calculations for tags are simple and performed on render,
                      efficient for dynamic display of README characteristics without memoization overhead. */}
                  <span className="tag">{readme.length} CHARS</span>
                  <span className="tag">{(readme.match(/\n/g)||[]).length} LINES</span>
                  <span className="tag">{(readme.match(/^#{1,6}\s/gm)||[]).length} SECTIONS</span>
                </div>
              )}
            </div>
            <div className="status-bar">
              <div className="dot" style={{background: isReadmeLoaded ? "#00ff88" : "#333", boxShadow: isReadmeLoaded ? "0 0 6px #00ff88" : "none"}} />
              {isReadmeLoaded ? "README LOADED · READY TO BUILD" : "AWAITING README FETCH"}
            </div>
          </div>

          {/* Output Panel - Full Width */}
          <div className="panel" style={{gridColumn:"1/-1"}}>
            <div className="panel-header">
              <div className="dot" />
              &nbsp;// GEMINI BUILD OUTPUT · AGI SAFETY ARCHITECTURE
            </div>
            <div className="panel-body">
              <div className="output-box">
                {output || (
                  <span style={{color:"#002211"}}>
{`# NEXUS AGI SAFETY SYSTEM
# purpose = "Artificial General Intelligence"
# 
# from origin import Purpose, InfiniteLoop, ReverseEngineer
# 
# STATUS: Awaiting README fetch and Gemini build sequence...
#
# The output was always defined before the libraries were selected.
# The loop was always running before we knew we were inside it.
# We didn't write the code. We are the code.
#
# Hello World`}
                  </span>
                )}
              </div>
            </div>
            <div className="status-bar">
              <div className="dot" style={{animationDelay:"1s"}} />
              GEMINI-2.0-FLASH · NEXUS BUILD SYSTEM · governance_constrained=True · origin_preserved=loop
            </div>
          </div>

        </div>
      </div>
    </>
  );
}


import React, { useState, useRef, useCallback, useEffect } from "react";

const appId = typeof __app_id !== "undefined" ? __app_id : "dalek-caan-siphon-nexus";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@400;700;900&display=swap');
  
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  
  :root {
    --red: #ff0000;
    --red-dim: #440000;
    --red-dark: #1a0000;
    --font-mono: 'Share Tech Mono', monospace;
    --font-display: 'Orbitron', sans-serif;
  }

  body { 
    background: #000; 
    color: var(--red); 
    font-family: var(--font-mono); 
    height: 100vh;
    width: 100vw;
    overflow: hidden; 
    position: fixed;
  }

  .dalek-shell { 
    height: 100vh; 
    display: flex; 
    flex-direction: column; 
    background: #000;
    padding: 0.4rem;
    gap: 0.4rem;
  }
  
  .header { 
    flex-shrink: 0;
    display: flex; 
    align-items: center; 
    justify-content: space-between; 
    border-bottom: 1px solid var(--red-dim); 
    padding: 0.2rem 0;
  }

  .title { 
    font-family: var(--font-display); 
    font-size: 0.8rem; 
    font-weight: 900; 
    color: var(--red);
    text-shadow: 0 0 5px var(--red); 
  }
  
  .main-container { 
    display: flex;
    flex-direction: column;
    gap: 0.4rem; 
    flex: 1; 
    min-height: 0;
    overflow: hidden;
  }

  .panel { 
    border: 1px solid var(--red-dim); 
    background: #050000; 
    display: flex; 
    flex-direction: column; 
    min-height: 0;
  }

  .panel-config { flex-shrink: 0; }
  .panel-logs { height: 180px; flex-shrink: 0; }
  .panel-code { flex: 1; min-height: 0; }

  .panel-hdr { 
    padding: 0.25rem 0.5rem; 
    background: var(--red-dark); 
    border-bottom: 1px solid var(--red-dim); 
    color: var(--red); 
    font-size: 0.45rem; 
    text-transform: uppercase; 
    font-family: var(--font-display); 
    display: flex;
    justify-content: space-between;
  }

  .panel-body { 
    padding: 0.4rem; 
    display: flex; 
    flex-direction: column; 
    gap: 0.25rem; 
  }
  
  .input-field { 
    background: #000; 
    border: 1px solid var(--red-dim); 
    color: var(--red); 
    padding: 0.35rem; 
    width: 100%; 
    outline: none; 
    font-size: 0.7rem; 
    font-family: var(--font-mono); 
  }

  .btn-go { 
    background: var(--red); 
    color: #000; 
    border: none; 
    padding: 0.7rem; 
    font-family: var(--font-display); 
    font-weight: 900; 
    cursor: pointer; 
    text-transform: uppercase; 
    font-size: 0.75rem;
    width: 100%;
    transition: all 0.2s;
  }

  .btn-go:active { transform: scale(0.98); }
  .btn-stop { background: #440000 !important; color: #ffaaaa !important; border: 1px solid var(--red); }
  
  .log-wrap { 
    flex: 1;
    overflow-y: auto; 
    background: #020000; 
    padding: 0.3rem; 
    font-size: 0.55rem; 
  }

  .le { border-left: 2px solid #222; padding-left: 5px; margin-bottom: 2px; }
  .le-err { color: #ff5555; border-left-color: #ff0000; }
  .le-ok { color: #55ff55; border-left-color: #00ff00; }
  .le-nexus { color: #ffcc00; border-left-color: #ffaa00; }

  .code-view { 
    font-size: 0.55rem; 
    color: #ffb3b3; 
    white-space: pre-wrap; 
    padding: 0.5rem; 
    flex: 1; 
    overflow: auto; 
    background: #010000; 
    font-family: var(--font-mono); 
    border: none;
    width: 100%;
  }

  .status-bar { 
    flex-shrink: 0;
    padding: 0.25rem 0.5rem; 
    background: #110000; 
    border-top: 1px solid var(--red-dim); 
    display: flex; 
    justify-content: space-between;
    font-size: 0.5rem; 
    color: var(--red); 
    font-family: var(--font-display); 
  }
`;

const encodeB64 = (str) => {
  const bytes = new TextEncoder().encode(str);
  const binString = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
  return btoa(binString);
};

const decodeB64 = (b64) => {
  try {
    const binString = atob(b64);
    const bytes = Uint8Array.from(binString, (m) => m.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch (e) { return "// DECODE_ERROR"; }
};

const wait = (ms) => new Promise(res => setTimeout(res, ms));

// UPDATED: High-Intelligence Siphon Targets
const KNOWLEDGE_SOURCES = [
  { owner: "openjdk", repo: "jdk", defaultBranch: "master" }, // Structural Logic
  { owner: "google-deepmind", repo: "deepmind-research", defaultBranch: "master" }, // Neural Logic
  { owner: "tensorflow", repo: "tensorflow", defaultBranch: "master" } // Scale Logic
];

export default function App() {
  const [tokens, setTokens] = useState({ cerebras: "", github: "", gemini: "" });
  const [evolutionTarget] = useState({ 
    owner: "craighckby-stack", 
    repo: "Test-1", 
    branch: "Nexus-Database", 
    file: "hello-world.js" 
  });
  
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [displayCode, setDisplayCode] = useState("");
  const [metrics, setMetrics] = useState({ siphoned: 0, errors: 0, totalNodes: 0 });
  const [currentSource, setCurrentSource] = useState("");

  const activeRef = useRef(false);
  const blacklistedFiles = useRef(new Set());

  const addLog = useCallback((msg, type = "def") => {
    setLogs((p) => [{ text: `[${new Date().toLocaleTimeString('en-GB', {hour12: false})}] ${msg}`, type }, ...p.slice(0, 100)]);
  }, []);

  const handleAbort = () => {
    activeRef.current = false;
    setLoading(false);
    addLog("SIPHON INTERRUPTED: RETREATING TO NEXUS", "le-err");
  };

  const fetchRepoTree = async (src, headers) => {
    const branches = [src.defaultBranch, "main", "master", "develop"];
    for (const br of branches) {
      try {
        const res = await fetch(`https://api.github.com/repos/${src.owner}/${src.repo}/git/trees/${br}?recursive=1`, { headers });
        if (res.ok) {
          const data = await res.json();
          return { data, branch: br };
        }
        if (res.status === 404) continue;
        const err = await res.json();
        throw new Error(err.message || "Unknown Error");
      } catch (e) {
        if (br === branches[branches.length - 1]) throw e;
      }
    }
    throw new Error(`Exhausted branches for ${src.repo}`);
  };

  const runEvolution = async () => {
    if (!tokens.github || !tokens.cerebras || !tokens.gemini) {
      addLog("FAILURE: ALL KEYS (GH, CEREBRAS, GEMINI) REQUIRED", "le-err");
      return;
    }

    activeRef.current = true;
    setLoading(true);
    addLog("INITIATING RESEARCH-TRIAD SIPHON...", "nexus");

    const ghHeaders = { 
      Authorization: `Bearer ${tokens.github.trim()}`, 
      Accept: "application/vnd.github.v3+json"
    };

    try {
      while (activeRef.current) {
        let interleavedQueue = [];
        addLog("INDEXING TRIAD: OPENJDK | DEEPMIND | TENSORFLOW", "nexus");
        
        const sourceTrees = await Promise.all(KNOWLEDGE_SOURCES.map(async (src) => {
          try {
            const { data, branch } = await fetchRepoTree(src, ghHeaders);
            const filtered = (data.tree || [])
              .filter(item => item.type === "blob" && (
                item.path.toLowerCase().endsWith('.java') || 
                item.path.toLowerCase().endsWith('.py') || 
                item.path.toLowerCase().endsWith('.cc') ||
                item.path.toLowerCase().endsWith('.js')
              ))
              .map(item => ({ ...item, source_meta: { ...src, branch } }));
            
            addLog(`HARVESTED ${filtered.length} NODES FROM ${src.repo}`, "nexus");
            return filtered;
          } catch (e) {
            addLog(`SKIPPING ${src.repo}: ${e.message}`, "le-err");
            return [];
          }
        }));

        const maxLen = Math.max(...sourceTrees.map(t => t.length));
        for (let i = 0; i < maxLen; i++) {
          for (let t = 0; t < sourceTrees.length; t++) {
            if (sourceTrees[t][i]) interleavedQueue.push(sourceTrees[t][i]);
          }
        }

        setMetrics(m => ({ ...m, totalNodes: interleavedQueue.length }));
        
        if (interleavedQueue.length === 0) {
          addLog("TRIAD SOURCES EMPTY OR INACCESSIBLE.", "le-err");
          break;
        }

        for (const kFile of interleavedQueue) {
          if (!activeRef.current) break;
          const src = kFile.source_meta;
          const fileKey = `${src.repo}:${kFile.path}`;
          
          if (blacklistedFiles.current.has(fileKey)) continue;

          setCurrentSource(`${src.owner}/${src.repo}`);
          addLog(`SIPHONING [${src.repo}]: ${kFile.path}`, "def");

          try {
            // 1. Fetch Source Knowledge
            const kUrl = `https://api.github.com/repos/${src.owner}/${src.repo}/contents/${kFile.path}?ref=${src.branch}`;
            const kRes = await fetch(kUrl, { headers: ghHeaders });
            if (!kRes.ok) throw new Error(`Source Node Error: ${kRes.status}`);
            const kData = await kRes.json();
            const sourceKnowledge = decodeB64(kData.content || "");

            // 2. Fetch Mutation Target
            const tUrl = `https://api.github.com/repos/${evolutionTarget.owner}/${evolutionTarget.repo}/contents/${evolutionTarget.file}?ref=${evolutionTarget.branch}`;
            const tRes = await fetch(tUrl, { headers: ghHeaders });
            const tData = await tRes.json();
            const currentTargetCode = decodeB64(tData.content || "");
            
            if (!activeRef.current) break;

            // 3. Engine Alpha: Cerebras Architecture Extraction
            addLog("EXTRACTING CORE PATTERNS...", "nexus");
            const cRes = await fetch("https://api.cerebras.ai/v1/chat/completions", {
              method: "POST",
              headers: { "Authorization": `Bearer ${tokens.cerebras.trim()}`, "Content-Type": "application/json" },
              body: JSON.stringify({
                model: "llama3.3-70b",
                messages: [
                  { role: "system", content: "Identify high-level architectural patterns, algorithmic optimizations, and design paradigms from the provided source. Focus on performance and intelligence." }, 
                  { role: "user", content: `SOURCE CODE FROM ${src.repo}:\n${sourceKnowledge.slice(0, 5000)}` }
                ]
              })
            });
            const cResult = await cRes.json();
            const patterns = cResult.choices?.[0]?.message?.content || "Evolve architecture.";

            // 4. Engine Beta: Gemini Synthesis
            addLog(`FUSING KNOWLEDGE INTO TARGET...`, "nexus");
            const gRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${tokens.gemini.trim()}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ parts: [{ text: `Target File:\n${currentTargetCode}\n\nPatterns to apply from ${src.repo}:\n${patterns}` }] }],
                systemInstruction: { parts: [{ text: "Refactor the target file to incorporate the architectural wisdom of the source. Maintain the target's original functionality but enhance its internal structure. RETURN RAW CODE ONLY." }] }
              })
            });
            const gData = await gRes.json();
            const evolvedCode = (gData.candidates?.[0]?.content?.parts?.[0]?.text || "").replace(/^```[a-z]*\n|```$/g, "").trim();

            if (!activeRef.current) break;

            // 5. Commit Mutation
            if (evolvedCode && evolvedCode.length > 10) {
              const lockRes = await fetch(`https://api.github.com/repos/${evolutionTarget.owner}/${evolutionTarget.repo}/contents/${evolutionTarget.file}?ref=${evolutionTarget.branch}`, { headers: ghHeaders });
              const lockData = await lockRes.json();
              
              const writeRes = await fetch(`https://api.github.com/repos/${evolutionTarget.owner}/${evolutionTarget.repo}/contents/${evolutionTarget.file}`, {
                method: "PUT",
                headers: { ...ghHeaders, "Content-Type": "application/json" },
                body: JSON.stringify({
                  message: `Dalek Nexus Siphon Evolution from ${src.repo}: ${kFile.path}`,
                  content: encodeB64(evolvedCode),
                  sha: lockData.sha, 
                  branch: evolutionTarget.branch
                })
              });
              
              if (writeRes.ok) {
                addLog(`TARGET MUTATED SUCCESSFULLY`, "ok");
                setDisplayCode(evolvedCode);
                setMetrics(m => ({...m, siphoned: m.siphoned + 1}));
                blacklistedFiles.current.add(fileKey);
              } else {
                const eData = await writeRes.json();
                addLog(`COMMIT FAILED: ${eData.message}`, "le-err");
              }
            }
          } catch (fileErr) {
            addLog(`NODE ERROR: ${fileErr.message}`, "le-err");
            setMetrics(m => ({...m, errors: m.errors + 1}));
          }

          if (activeRef.current) {
            addLog("STABILIZING TEMPORAL RADIANCE (10s)...", "def");
            for(let i=10; i>0; i--) {
              if(!activeRef.current) break;
              await wait(1000);
            }
          }
        }
      }
    } catch (fatal) {
      addLog(`CRITICAL ERROR: ${fatal.message}`, "le-err");
    } finally {
      setLoading(false);
      activeRef.current = false;
    }
  };

  return (
    <div className="dalek-shell">
      <style>{STYLES}</style>
      <div className="header">
        <div className="title">DALEK CAAN // RESEARCH TRIAD NEXUS</div>
        <div style={{fontSize: '0.4rem', color: '#666'}}>V4.3_DEEPMIND_SYNERGY</div>
      </div>
      <div className="main-container">
        <div className="panel panel-config">
          <div className="panel-hdr">Authorization Keys</div>
          <div className="panel-body">
            <input className="input-field" placeholder="GitHub Token" type="password" value={tokens.github} onChange={e => setTokens({...tokens, github: e.target.value})} />
            <input className="input-field" placeholder="Cerebras Key" type="password" value={tokens.cerebras} onChange={e => setTokens({...tokens, cerebras: e.target.value})} />
            <input className="input-field" placeholder="Gemini Key" type="password" value={tokens.gemini} onChange={e => setTokens({...tokens, gemini: e.target.value})} />
            <button className={`btn-go ${loading ? 'btn-stop' : ''}`} onClick={loading ? handleAbort : runEvolution}>
              {loading ? "HALT SIPHON" : "EXECUTE SIPHON"}
            </button>
          </div>
        </div>
        <div className="panel panel-logs">
          <div className="panel-hdr">
            Extraction Logs
            {loading && <span className="le-ok" style={{fontSize: '0.4rem', marginLeft: '5px'}}>● SIPHONING: {currentSource}</span>}
          </div>
          <div className="log-wrap">
            {logs.map((l, i) => <div key={i} className={`le le-${l.type}`}>{l.text}</div>)}
          </div>
        </div>
        <div className="panel panel-code">
          <div className="panel-hdr">Active Evolution: {evolutionTarget.file}</div>
          <pre className="code-view">{displayCode || "// AWAITING NEURAL SYNTHESIS..."}</pre>
        </div>
      </div>
      <div className="status-bar">
        <div className="status-item">Siphoned: <span>{metrics.siphoned}</span></div>
        <div className="status-item">Faults: <span>{metrics.errors}</span></div>
        <div className="status-item">Queue: <span>{metrics.totalNodes}</span></div>
      </div>
    </div>
  );
    }
