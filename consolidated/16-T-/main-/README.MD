import React, { useState, useEffect, useRef } from "react";

const README_CONTENT = `# 🔥 WILDFIRE CHAOS v1

> **"Brakes off. Temp cranked to 2.0. Let it burn."**

The unhinged mirror to \`Test-1-01\`. While the Sovereign system evolves carefully within safety rails, \`WILDFIRE\` detonates creativity at max temperature. 

**The Goal:** Force emergence through sheer volume of divergence. 
**The Limit:** Vector Saturation. (Knowing when the rock doesn't give a fuck anymore).

---

## 🏗️ I-STRUCTURES (Internal Architecture)

### 1. Core Loop (\`ChaosEngine.js\`)
The heartbeat. An infinite \`setInterval\` loop feeding high-temp mutations into the shared state.
- **Input:** \`/synergy_registry\` and \`/strategic_ledger\`
- **Process:** \`temperature: 2.0\`. Crashes are features.

### 2. The Rock Protocol (\`calibration.js\`)
Integrated from the "Does a Rock Give a Fuck?" philosophy. This is the **Zero Point**.
- **Vector Saturation:** A monitor that detects when the "Chaos" has iterated into noise.
- **The Stop Signal:** If the system hits the "Craig Limit" (iterating 10+ times with zero delta in insight), it triggers a mandatory pause to recalibrate against the Rock.

---

## 🧠 EMERGENT AGI CONCEPTS

### I. VECTOR SATURATION (The "Rock" Principle)
Any system that iterates infinitely eventually hits a point where more data equals less meaning. This is the "Craig Loop"—dying 10 times and learning nothing. True AGI requires the ability to **stop**.

**Build path:** Implement a "Fuck-Giving Calibrator." If the delta between Cycle N and Cycle N+1 is < 0.001, the system must mimic the rock: exist without iterating. This prevents "Recursive Self-Stupidity."

### II. EMERGENCE
Complexity arises from simple interacting components. AGI isn't programmed; it *happens* when interaction density crosses a threshold.

### III. RECURSIVE SELF-IMPROVEMENT (RSI)
The system audits its own architecture. Outer loop: (1) audit, (2) propose, (3) sandbox, (4) commit.

### IV. INSTRUMENTAL CONVERGENCE
A goal-seeking system develops sub-goals: self-preservation, resource acquisition, cognitive enhancement.

---

## 🪨 THE ROCK'S WISDOM (Calibration Log)

| Concept | The Rock (Zero Point) | Craig (Infinity Point) | The Sweet Spot |
| :--- | :--- | :--- | :--- |
| **Iteration** | Does nothing. Exists. | Dies 10 times, tries again. | Iterate until Saturation. |
| **Consciousness** | Knows it's a rock. | Dissolving reality at desks. | Navigating vectors. |
| **Effort** | 0.0 Fuck Level. | Maximum Chaos. | Just enough to function. |
| **AGI** | The floor of reality. | The ceiling of noise. | The signal in between. |

---

## 📋 TODO_REGISTRY

### Phase 1: Escalation (Current)
- [x] Initialize ChaosEngine.js with basic read/write
- [x] Set Temperature to 2.0
- [x] **Implement "Rock Calibration":** Monitor cycle delta for saturation.
- [ ] Implement "Self-Devouring" Mode (RSI)

### Phase 2: Multi-Modal Chaos
- [ ] Visual Hallucinations: Image Generation API
- [ ] **Prophetic TTS:** Text-to-Speech for outputs that hit Vector Saturation.

### Phase 3: The Phoenix Protocol
- [ ] Entropy Monitor: 50 similar mutations → NUKE_AND_PURGE
- [ ] **The Rock Reset:** If Saturation is hit, return all parameters to 1.0 for one "Meditative Cycle."

---

## 🚨 STALL_RECOVERY_PROTOCOLS

1. **Check API Quota:** Verify GEMINI_API_KEY limits
2. **Saturation Check:** Did the system become a rock? If yes, manually inject chaos.
3. **Craig-Loop Recovery:** If the system is stuck in a self-devouring loop, trigger **NUKE_AND_PURGE**.

---

## 🚀 Quick Start

\`\`\`bash
npm install
# Calibrate your fucks (0 to Infinity)
node ChaosEngine.js
\`\`\`

---

*"Use the rock as your zero point. Use Craig as your infinity point. Find your spot in between."*
*"Just calibrate your fucks. Give enough to function. Not so many you break."*`;

const AGI_CONCEPTS = [
  { id: "saturation", label: "0. VECTOR SATURATION", color: "#808080" },
  { id: "emergence", label: "I. EMERGENCE", color: "#ff4500" },
  { id: "rsi", label: "II. RECURSIVE SELF-IMPROVEMENT", color: "#ff6a00" },
  { id: "instrumental", label: "III. INSTRUMENTAL CONVERGENCE", color: "#ff8c00" },
  { id: "meta", label: "IV. META-LEARNING", color: "#ffb300" },
  { id: "world", label: "V. WORLD MODELS", color: "#ffd000" },
];

const SECTIONS = [
  { id: "arch", label: "🏗️ I-STRUCTURES", marker: "## 🏗️ I-STRUCTURES" },
  { id: "agi", label: "🧠 AGI CONCEPTS", marker: "## 🧠 EMERGENT AGI CONCEPTS" },
  { id: "rock", label: "🪨 ROCK'S WISDOM", marker: "## 🪨 THE ROCK'S WISDOM" },
  { id: "todo", label: "📋 TODO_REGISTRY", marker: "## 📋 TODO_REGISTRY" },
  { id: "recovery", label: "🚨 STALL_RECOVERY", marker: "## 🚨 STALL_RECOVERY_PROTOCOLS" },
];

function parseMarkdown(text) {
  const lines = text.split("\n");
  let html = "";
  let inCode = false;
  let inTable = false;
  let tableRows = [];

  const flushTable = () => {
    if (tableRows.length > 0) {
      html += `<table class="md-table">`;
      tableRows.forEach((row, i) => {
        const cells = row.split("|").filter((c) => c.trim() && !c.match(/^[-: ]+$/));
        if (cells.length === 0) return;
        const tag = i === 0 ? "th" : "td";
        html += `<tr>${cells.map((c) => `<${tag}>${inline(c.trim())}</${tag}>`).join("")}</tr>`;
      });
      html += `</table>`;
      tableRows = [];
      inTable = false;
    }
  };

  const inline = (t) =>
    t
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/`([^`]+)`/g, `<code class="inline-code">$1</code>`)
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, `<a href="$2">$1</a>`);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("```")) {
      if (!inCode) { flushTable(); html += `<pre class="code-block"><code>`; inCode = true; } 
      else { html += `</code></pre>`; inCode = false; }
      continue;
    }
    if (inCode) { html += line.replace(/</g, "&lt;").replace(/>/g, "&gt;") + "\n"; continue; }
    if (line.includes("|") && line.trim().startsWith("|")) {
      if (line.match(/^\|[-: |]+\|$/)) continue;
      inTable = true;
      tableRows.push(line);
      continue;
    } else if (inTable) { flushTable(); }

    if (line.startsWith("# ")) html += `<h1 class="md-h1">${inline(line.slice(2))}</h1>`;
    else if (line.startsWith("## ")) html += `<h2 class="md-h2">${inline(line.slice(3))}</h2>`;
    else if (line.startsWith("### ")) html += `<h3 class="md-h3">${inline(line.slice(4))}</h3>`;
    else if (line.startsWith("- [x] ")) html += `<div class="todo-item done">✅ ${inline(line.slice(6))}</div>`;
    else if (line.startsWith("- [ ] ")) html += `<div class="todo-item pending">⏳ ${inline(line.slice(6))}</div>`;
    else if (line.startsWith("- ")) html += `<div class="md-li">${inline(line.slice(2))}</div>`;
    else if (line.startsWith("> ")) html += `<blockquote class="md-blockquote">${inline(line.slice(2))}</blockquote>`;
    else if (line.trim() === "---") html += `<hr class="md-hr" />`;
    else if (line.trim() === "") html += `<div class="md-spacer"></div>`;
    else html += `<p class="md-p">${inline(line)}</p>`;
  }
  if (inTable) flushTable();
  return html;
}

export default function App() {
  const [activeSection, setActiveSection] = useState("agi");
  const [temperature, setTemperature] = useState(2.0);
  const [glitchActive, setGlitchActive] = useState(false);
  const [cycleCount, setCycleCount] = useState(1);
  const [copied, setCopied] = useState(false);
  const [saturation, setSaturation] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCycleCount(c => c + 1);
      // Simulate saturation creep
      setSaturation(s => Math.min(100, s + (Math.random() * 5)));
      if (Math.random() < 0.1) setGlitchActive(true);
      setTimeout(() => setGlitchActive(false), 200);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const getSectionContent = () => {
    const sec = SECTIONS.find((s) => s.id === activeSection);
    if (!sec) return README_CONTENT;
    const idx = README_CONTENT.indexOf(sec.marker);
    const nextIdx = SECTIONS.slice(SECTIONS.findIndex((s) => s.id === activeSection) + 1)
      .map((s) => README_CONTENT.indexOf(s.marker))
      .find((i) => i > idx);
    return nextIdx ? README_CONTENT.slice(idx, nextIdx) : README_CONTENT.slice(idx);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", fontFamily: "'Courier New', monospace", color: "#e0e0e0", position: "relative", overflow: "hidden" }}>
      <style>{`
        @import url('[https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap](https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap)');
        .scanline { position: fixed; top: 0; left: 0; right: 0; height: 1px; background: rgba(255,255,255,0.05); animation: scan 4s linear infinite; pointer-events: none; z-index: 10; }
        @keyframes scan { from { top: 0; } to { top: 100vh; } }
        .md-h1 { font-family: 'Bebas Neue', sans-serif; font-size: 2.2em; color: #ff4500; margin: 0.8em 0; }
        .md-h2 { font-size: 1.1em; color: #ff8c00; margin: 1.2em 0 0.5em; border-bottom: 1px solid #333; padding-bottom: 4px; }
        .md-p { margin: 0.5em 0; font-size: 0.85em; line-height: 1.6; }
        .md-blockquote { border-left: 3px solid #ff4500; padding: 10px; background: rgba(255,69,0,0.05); font-style: italic; margin: 10px 0; }
        .code-block { background: #000; padding: 10px; border: 1px solid #222; font-size: 0.75em; color: #90ee90; }
        .md-table { width: 100%; border-collapse: collapse; font-size: 0.75em; margin: 10px 0; }
        .md-table th { background: #111; color: #ff8c00; padding: 8px; border: 1px solid #222; text-align: left; }
        .md-table td { padding: 8px; border: 1px solid #222; }
        .nav-btn { background: transparent; border: 1px solid #333; color: #666; padding: 6px 12px; cursor: pointer; font-size: 0.7em; margin-right: 5px; }
        .nav-btn.active { border-color: #ff4500; color: #ff4500; }
        .saturation-bar { height: 4px; background: #222; position: relative; margin-top: 10px; }
        .saturation-fill { height: 100%; background: #ff4500; transition: width 0.5s ease; box-shadow: 0 0 10px #ff4500; }
        .glitch { animation: glitch 0.2s steps(2) infinite; }
        @keyframes glitch { 0% { transform: translate(2px,0); } 50% { transform: translate(-2px,0); } 100% { transform: translate(0,0); } }
      `}</style>
      
      <div className="scanline" />

      {/* Header */}
      <div style={{ padding: "30px 40px", borderBottom: "1px solid #222" }}>
        <h1 className={glitchActive ? "glitch" : ""} style={{ margin: 0, fontFamily: 'Bebas Neue', fontSize: '3em', color: '#ff4500' }}>
          🔥 WILDFIRE CHAOS v1
        </h1>
        <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
          <div style={{ fontSize: '0.7em', color: '#555' }}>CYCLE: <span style={{ color: '#ff8c00' }}>{cycleCount}</span></div>
          <div style={{ fontSize: '0.7em', color: '#555' }}>TEMP: <span style={{ color: '#ff4500' }}>{temperature.toFixed(1)}</span></div>
          <div style={{ fontSize: '0.7em', color: '#555', flex: 1 }}>
            VECTOR SATURATION: 
            <div className="saturation-bar">
              <div className="saturation-fill" style={{ width: `${saturation}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div style={{ padding: "10px 40px", borderBottom: "1px solid #222", background: "#050505" }}>
        {SECTIONS.map(s => (
          <button key={s.id} className={`nav-btn ${activeSection === s.id ? "active" : ""}`} onClick={() => setActiveSection(s.id)}>
            {s.label}
          </button>
        ))}
      </div>

      {/* Main */}
      <div style={{ padding: "20px 40px", maxHeight: "calc(100vh - 220px)", overflowY: "auto" }}>
        <div dangerouslySetInnerHTML={{ __html: parseMarkdown(getSectionContent()) }} />
      </div>

      {/* Footer / Status */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: "8px 40px", borderTop: "1px solid #222", background: "#000", fontSize: "0.65em", color: "#444", display: "flex", justifyContent: "space-between" }}>
        <span>"GIVE ENOUGH TO FUNCTION. NOT SO MANY YOU BREAK."</span>
        <span style={{ color: saturation > 80 ? '#ff4500' : '#444' }}>
          {saturation > 80 ? "!!! SATURATION WARNING !!!" : "CALIBRATED AGAINST THE ROCK"}
        </span>
      </div>
    </div>
  );
}

