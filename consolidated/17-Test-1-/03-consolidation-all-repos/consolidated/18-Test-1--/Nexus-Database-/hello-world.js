<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>DALEK CAAN v2.3 — STABLE SLOW EVOLUTION</title>
<link href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@400;700;900&display=swap" rel="stylesheet"/>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --red:#ff2020;--red-dim:#660000;--red-dark:#110000;
  --gold:#ffaa00;--purple:#cc00ff;--cyan:#00ffcc;--green:#00ff88;
  --panel-bg:rgba(5,0,0,0.98);
  --mono:'Share Tech Mono',monospace;
  --display:'Orbitron',monospace;
}
body{background:#000;color:var(--red);font-family:var(--mono);overflow-x:hidden;min-height:100vh}
.shell{
  min-height:100vh;
  background:radial-gradient(circle at 50% 0%,#1a0000 0%,#000 60%),
    repeating-linear-gradient(0deg,rgba(255,0,0,0.015) 0px,rgba(255,0,0,0.015) 1px,transparent 1px,transparent 3px);
  padding:1.2rem;display:flex;flex-direction:column;align-items:center;gap:1rem;
}
.header{width:100%;max-width:1600px;display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid var(--red-dim);padding-bottom:.8rem;flex-wrap:wrap;gap:.5rem}
.title{font-family:var(--display);font-size:clamp(1rem,3vw,1.6rem);font-weight:900;letter-spacing:.3em;text-shadow:0 0 20px var(--red),0 0 40px #ff000044}
.subtitle{font-size:.5rem;letter-spacing:.2em;color:var(--red-dim);margin-top:-3px}
.stats{display:flex;gap:.8rem}
.stat{display:flex;flex-direction:column;align-items:center;border:1px solid var(--red-dim);padding:.3rem .6rem;min-width:65px}
.stat-lbl{font-size:.45rem;letter-spacing:.1em;color:var(--red-dim);text-transform:uppercase}
.stat-val{font-family:var(--display);font-size:1.1rem;font-weight:900;color:var(--gold)}
.stat-val.run{color:var(--green)}
.stat-val.sat{color:var(--cyan);animation:pulse 1s infinite}
.grid{display:grid;grid-template-columns:460px 1fr;gap:1rem;width:100%;max-width:1600px}
@media(max-width:1000px){.grid{grid-template-columns:1fr}}
.panel{border:1px solid var(--red-dim);background:var(--panel-bg);display:flex;flex-direction:column;overflow:hidden;min-height:500px}
.phdr{padding:.5rem .9rem;background:var(--red-dark);border-bottom:1px solid var(--red-dim);color:var(--red);font-family:var(--display);font-weight:900;font-size:.58rem;letter-spacing:.2em;text-transform:uppercase;display:flex;justify-content:space-between;align-items:center;flex-shrink:0}
.pbody{padding:.9rem;flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:.55rem}
lbl{display:block;font-size:.52rem;color:#aa2222;text-transform:uppercase;letter-spacing:.12em;margin-top:3px;margin-bottom:2px}
input[type=text],input[type=password],input[type=number],textarea{
  background:#080000;border:1px solid var(--red-dim);color:var(--red);
  font-family:var(--mono);padding:.45rem .6rem;width:100%;outline:none;font-size:.78rem;
  transition:border-color .2s;
}
input:focus,textarea:focus{border-color:var(--red);box-shadow:0 0 8px #ff000033}
.row2{display:grid;grid-template-columns:1fr 1fr;gap:7px}
.sources{border:1px solid var(--red-dim);padding:.6rem;background:rgba(20,0,0,0.6)}
.src-row{display:flex;justify-content:space-between;align-items:center;padding:.15rem 0}
.src-fixed{font-size:.65rem;color:#884444}
.src-active{font-size:.65rem;color:var(--gold);text-shadow:0 0 8px var(--gold)}
.src-chosen{font-size:.65rem;color:var(--purple);text-shadow:0 0 8px var(--purple)}
.src-pending{font-size:.65rem;color:#440044;font-style:italic}
.src-tag{font-size:.5rem;color:#553333}
.vote-box{border:1px solid #440044;padding:.6rem;background:rgba(20,20,20,.6)}
.vote-ttl{font-family:var(--display);font-size:.5rem;color:var(--purple);letter-spacing:.15em;margin-bottom:.3rem}
.vote-item{font-size:.62rem;color:#884488;padding:.08rem 0}
.vote-win{font-size:.68rem;color:var(--purple);text-shadow:0 0 8px var(--purple);margin-top:.25rem}
.sat-alert{border:1px solid var(--cyan);padding:.5rem .7rem;background:rgba(0,20,15,.8);color:var(--cyan);font-size:.62rem;letter-spacing:.08em;text-align:center;animation:pulse 2s infinite}
.delta-wrap{display:flex;flex-direction:column;gap:.25rem}
.delta-track{height:5px;background:#1a0000;border:1px solid var(--red-dim)}
.delta-fill{height:100%;background:linear-gradient(90deg,var(--red-dim),var(--red));transition:width .5s}
.delta-fill.low{background:linear-gradient(90deg,#003322,var(--cyan))}
.delta-meta{font-size:.52rem;color:#884444;display:flex;justify-content:space-between}
.btns{display:flex;gap:.4rem;margin-top:.2rem}
.btn{flex:1;padding:.6rem;background:transparent;border:2px solid var(--red);color:var(--red);font-family:var(--display);font-size:.6rem;font-weight:900;letter-spacing:.15em;cursor:pointer;text-transform:uppercase;transition:all .2s}
.btn:hover{background:var(--red);color:#000;box-shadow:0 0 20px var(--red)}
.btn.stop{border-color:var(--gold);color:var(--gold)}
.btn.stop:hover{background:var(--gold);color:#000;box-shadow:0 0 20px var(--gold)}
.btn-copy{margin-top:8px;padding:.45rem;background:transparent;border:1px solid var(--green);color:var(--green);font-family:var(--mono);font-size:.65rem;cursor:pointer}
.btn-copy:hover{background:var(--green);color:#000}
.log{flex:1;overflow-y:auto;font-size:.62rem;line-height:1.65;padding:.3rem 0;display:flex;flex-direction:column;gap:1px;max-height:220px}
.le{color:#884444}
.ok{color:var(--green)}.err{color:#ff4444}.warn{color:var(--gold)}
.vote{color:var(--purple)}.round{color:var(--cyan);font-weight:bold;letter-spacing:.08em}
.saturate{color:var(--cyan)}.grok{color:#ff6600}
.prog-track{height:3px;background:#1a0000;flex-shrink:0}
.prog-fill{height:100%;background:var(--red);transition:width .3s;box-shadow:0 0 8px var(--red)}
.code-view{flex:1;overflow:auto;padding:.9rem;font-family:var(--mono);font-size:.68rem;color:#cc4444;line-height:1.7;white-space:pre-wrap;word-break:break-word;background:#0a0000}
.history{border-top:1px solid var(--red-dim);padding:.5rem .9rem;display:flex;gap:.4rem;overflow-x:auto;flex-shrink:0;min-height:46px;align-items:center}
.hpill{border:1px solid var(--red-dim);padding:.18rem .45rem;font-size:.5rem;white-space:nowrap;color:#884444;flex-shrink:0}
.hpill.sat{border-color:var(--cyan);color:var(--cyan)}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
::-webkit-scrollbar{width:4px;height:4px}
::-webkit-scrollbar-track{background:#0a0000}
::-webkit-scrollbar-thumb{background:var(--red-dim)}
</style>
</head>
<body>
<div class="shell">

  <div class="header">
    <div>
      <div class="title">DALEK CAAN v2.3</div>
      <div class="subtitle">stable slow chain · Cerebras final merge · 15s/LLM · 30s/round</div>
    </div>
    <div class="stats">
      <div class="stat"><span class="stat-lbl">Round</span><span class="stat-val" id="sRound">—</span></div>
      <div class="stat"><span class="stat-lbl">Delta</span><span class="stat-val" id="sDelta">—</span></div>
      <div class="stat"><span class="stat-lbl">Status</span><span class="stat-val" id="sStatus">IDLE</span></div>
    </div>
  </div>

  <div class="grid">

    <div class="panel">
      <div class="phdr"><span>NEXUS CONTROL — SLOW & STABLE</span><span id="activeLabel" style="font-size:.52rem;color:#660000">○ STANDBY</span></div>
      <div class="pbody">

        <lbl>GEMINI API KEY (patterns — optional)</lbl>
        <input type="password" id="geminiKey" placeholder="AIza..."/>

        <lbl>GROK API KEY (critique — recommended)</lbl>
        <input type="password" id="grokKey" placeholder="xai-..."/>

        <lbl>CEREBRAS API KEY — FINAL MERGE (strongly recommended)</lbl>
        <input type="password" id="cerebrasKey" placeholder="csk-..."/>

        <div class="row2">
          <div><lbl>ROUNDS</lbl><input type="number" id="rounds" value="8" min="1" max="50"/></div>
          <div><lbl>SAT THRESHOLD %</lbl><input type="number" id="satPct" value="1.8" min="0.5" max="20" step="0.1"/></div>
        </div>

        <div style="margin-top:12px;border-top:1px solid #330000;padding-top:8px">
          <lbl>MANUAL BASE CODE (paste to restart from new seed)</lbl>
          <textarea id="manualBase" rows="5" style="width:100%;background:#080000;border:1px solid var(--red-dim);color:var(--red);font-family:var(--mono);padding:8px;font-size:.75rem;resize:vertical"></textarea>
          <button onclick="injectManualBase()" style="margin-top:6px;padding:.45rem .8rem;background:transparent;border:1px solid var(--gold);color:var(--gold);font-family:var(--mono);font-size:.65rem;cursor:pointer">INJECT & RESET</button>
        </div>

        <div class="sources">
          <lbl>ACTIVE SOURCES — 4-STEP CHAIN</lbl>
          <div class="src-row"><span class="src-fixed" id="src0">◈ google-deepmind/deepmind-research</span><span class="src-tag">AGI</span></div>
          <div class="src-row"><span class="src-fixed" id="src1">◈ firebase/genkit</span><span class="src-tag">ORCH</span></div>
          <div class="src-row"><span class="src-fixed" id="src2">◈ huggingface/transformers</span><span class="src-tag">LLM</span></div>
          <div class="src-row"><span class="src-pending" id="src3">◈ [voted 4th source]</span><span class="src-tag">CONSENSUS</span></div>
        </div>

        <div class="vote-box" id="voteBox" style="display:none">
          <div class="vote-ttl">◈ CONSENSUS VOTE ◈</div>
          <div class="vote-item" id="vGrok" style="display:none"></div>
          <div class="vote-item" id="vCerebras" style="display:none"></div>
          <div class="vote-item" id="vGemini" style="display:none"></div>
          <div class="vote-win" id="vWinner" style="display:none"></div>
        </div>

        <div class="sat-alert" id="satAlert" style="display:none">
          ◈ SATURATION DETECTED ◈<br/>
          Sources exhausted for current base code.<br/>
          Use MANUAL BASE CODE box to inject fresh material.
        </div>

        <div class="delta-wrap" id="deltaWrap" style="display:none">
          <div class="delta-meta"><span>DELTA THIS ROUND</span><span id="deltaText">0%</span></div>
          <div class="delta-track"><div class="delta-fill" id="deltaFill" style="width:0%"></div></div>
          <div class="delta-meta"><span>← saturated</span><span>evolving →</span></div>
        </div>

        <div class="btns">
          <button class="btn" id="mainBtn" onclick="toggle()">START SLOW EVOLUTION</button>
        </div>

        <div class="log" id="log"></div>
      </div>
      <div class="prog-track"><div class="prog-fill" id="prog" style="width:0%"></div></div>
    </div>

    <div class="panel">
      <div class="phdr">
        <span>LIVE CODE — updates after each source</span>
        <span style="font-size:.52rem;color:#884444" id="codeSize">—</span>
      </div>
      <div class="code-view" id="codeView">// v2.3 — slow & stable mode active
// waiting for ENGAGE …
</div>
      <button onclick="copyCurrentCode()" class="btn-copy" id="copyBtn" style="display:none;margin-top:8px">COPY CURRENT CODE</button>
      <div class="history" id="history" style="display:none">
        <span style="font-size:.52rem;color:#553333;margin-right:.3rem">HISTORY:</span>
        <span id="historyPills"></span>
      </div>
    </div>

  </div>
</div>

<script>
// ── State ────────────────────────────────────────────────────────────────
let running = false;
let abortFlag = false;
let currentCode = `// Dalek Caan v2.3 seed — slow stable chain
const CaanCore = {
  version: "2.3.0",
  phase: "WAITING",
  assimilate(source, fragment) {
    console.log(\`Assimilating \${source} fragment\`);
  }
};
console.log("Awaiting slow evolution cycle...");`;

const SOURCES = [
  {slug:"google-deepmind/deepmind-research", label:"AGI RESEARCH"},
  {slug:"firebase/genkit", label:"AI ORCHESTRATION"},
  {slug:"huggingface/transformers", label:"LLM ARCHITECTURE"},
];

const EXCLUDED = new Set(SOURCES.map(s => s.slug));

const CONSTRAINTS = `Never output markdown, explanations, fences or prose outside code.
Never generate unsafe, malicious or hallucinated APIs.
Keep output valid, readable JavaScript only.`;

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ── Helpers ──────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const log = (msg, cls="") => {
  const d = $("log");
  const t = new Date().toLocaleTimeString();
  const div = document.createElement("div");
  div.className = `le ${cls}`;
  div.textContent = `[${t}] ${msg}`;
  d.appendChild(div);
  d.scrollTop = d.scrollHeight;
};

const setProgress = pct => $("prog").style.width = pct+"%";
const setStat = (id,val,cls="") => {
  const el = $(id);
  el.textContent = val;
  el.className = "stat-val "+cls;
};

const b64dec = b64 => {
  try { return decodeURIComponent(escape(atob(b64.replace(/\s/g,"")))); }
  catch { return "// [base64 decode failed]"; }
};

const computeDelta = (a,b) => {
  if (!a||!b) return 1;
  const min = Math.min(a.length,b.length);
  let same = 0;
  for(let i=0;i<min;i++) if(a[i]===b[i]) same++;
  return 1 - (same / Math.max(a.length,b.length));
};

const cleanRepoSlug = str => {
  str = (str||"").trim().replace(/^https?:\/\/(www\.)?github\.com\//i,'').replace(/\/$/,'');
  const parts = str.split('/');
  if (parts.length === 2 && parts[0] && parts[1] && !/\s/.test(str)) return str;
  return null;
};

const setSourceActive = (idx, voted=false) => {
  ["src0","src1","src2","src3"].forEach((id,i)=>{
    if(i===idx) $(id).className = voted?"src-chosen":"src-active";
    else $(id).className = i<3?"src-fixed":"src-pending";
  });
};
const clearSourceActive = () => {
  ["src0","src1","src2","src3"].forEach(id=>$(id).className = id==="src3"?"src-pending":"src-fixed");
};

// ── LLM calls with cooldown ──────────────────────────────────────────────
const gemini = async (prompt,system="") => {
  await sleep(15000); // 15s before Gemini
  const key = $("geminiKey").value.trim();
  if(!key) return "";
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,{
      method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        contents:[{parts:[{text:prompt}]}],
        ...(system && {systemInstruction:{parts:[{text:system}]}})
      })
    });
    if(!res.ok) throw new Error(res.status);
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  } catch(e){
    log(`Gemini failed: ${e.message}`,"warn");
    return "";
  }
};

const grokCall = async (prompt,system="") => {
  await sleep(15000); // 15s before Grok
  const key = $("grokKey").value.trim();
  if(!key) return "";
  try {
    const messages = system ? [{role:"system",content:system},{role:"user",content:prompt}] : [{role:"user",content:prompt}];
    const res = await fetch("https://api.x.ai/v1/chat/completions",{
      method:"POST",
      headers:{"Content-Type":"application/json","Authorization":`Bearer ${key}`},
      body:JSON.stringify({model:"grok-beta",messages,temperature:0.3})
    });
    if(!res.ok) throw new Error(res.status);
    const data = await res.json();
    return data.choices?.[0]?.message?.content || "";
  } catch(e){
    log(`Grok failed: ${e.message}`,"err");
    return "";
  }
};

const cerebrasCall = async (prompt,system="") => {
  await sleep(15000); // 15s before Cerebras
  const key = $("cerebrasKey").value.trim();
  if(!key) return "";
  try {
    const messages = system ? [{role:"system",content:system},{role:"user",content:prompt}] : [{role:"user",content:prompt}];
    const res = await fetch("https://api.cerebras.ai/v1/chat/completions",{
      method:"POST",
      headers:{"Content-Type":"application/json","Authorization":`Bearer ${key}`},
      body:JSON.stringify({model:"llama3.1-8b",messages})
    });
    if(!res.ok) return "";
    const data = await res.json();
    return data.choices?.[0]?.message?.content || "";
  } catch{
    return "";
  }
};

// ── Evolve (Gemini → Grok critique → Cerebras merge) ─────────────────────
const evolve = async (base,incoming,sourceName) => {
  const baseCap = base.slice(-750);
  const incCap  = incoming.slice(0,650);

  let patterns = "";
  let critique = "";

  // 1. Gemini patterns (light)
  log(`GEMINI patterns ← ${sourceName}`,"ok");
  patterns = await gemini(
    `Extract 3–5 most important architectural or logic patterns. Bullet points only.\n\n${incCap}`,
    `Concise bullet-point architecture analyst.${CONSTRAINTS}`
  ) || incCap.slice(0,400);

  // 2. Grok critique / suggestion
  if($("grokKey").value.trim()){
    log(`GROK critique ← ${sourceName}`,"grok");
    critique = await grokCall(
      `Suggest ONE concrete JavaScript improvement or new function based on these patterns:\n${patterns}\n\nCode fragment:\n${incCap}`,
      `Output ONLY suggested code (function/pattern). Max 35 lines. No prose.${CONSTRAINTS}`
    ) || "";
  }

  // 3. Cerebras final merge
  log(`CEREBRAS final merge ← ${sourceName}`,"le");
  const prompt = `Integrate ONE idea from the critique/pattern into this module.

EXISTING (tail):
${baseCap}

IDEA / PATTERN / CRITIQUE:
${critique || patterns || incCap}

Return ONLY complete updated JavaScript module. No fences. No explanations.`;

  let result = await cerebrasCall(prompt,
    `You are Dalek Caan — surgical evolver. Output ONLY valid complete JavaScript. Nothing else.${CONSTRAINTS}`
  );

  result = (result||"").replace(/^```[a-z]*\n?|```$/g,"").trim();

  if(result.length < 150){
    log("Cerebras result too short — fallback concatenation","warn");
    result = `${baseCap}\n\n// Fallback assimilation from ${sourceName} (${new Date().toISOString()})\n// ${incCap.slice(0,500).replace(/\n/g,' ')}`;
  }

  return result;
};

// ── Vote ─────────────────────────────────────────────────────────────────
const conductVote = async () => {
  log("◈ CONSENSUS VOTE ◈","vote");
  $("voteBox").style.display = "block";
  ["vGrok","vCerebras","vGemini","vWinner"].forEach(id=>$(id).style.display="none");

  const prompt = `Recommend ONE GitHub repo (owner/repo) that would most improve AGI/agent architecture of this code. Avoid: ${[...EXCLUDED].join(", ")}. Reply ONLY owner/repo\n\n${currentCode.slice(0,1800)}`;

  const votes = [];

  try {
    let r = await grokCall(prompt,"Reply ONLY with owner/repo");
    r = cleanRepoSlug(r);
    if(r) {
      votes.push(r);
      $("vGrok").textContent=`GROK → ${r}`;$("vGrok").style.display="block";
      log(`GROK → ${r}`,"vote");
    }
  } catch{}

  if($("cerebrasKey").value.trim()){
    try {
      let r = await cerebrasCall(prompt,"Reply ONLY with owner/repo");
      r = cleanRepoSlug(r);
      if(r) {
        votes.push(r);
        $("vCerebras").textContent=`CEREBRAS → ${r}`;$("vCerebras").style.display="block";
        log(`CEREBRAS → ${r}`,"vote");
      }
    } catch{}
  }

  try {
    let r = await gemini(prompt,"Reply ONLY with owner/repo");
    r = cleanRepoSlug(r);
    if(r) {
      votes.push(r);
      $("vGemini").textContent=`GEMINI → ${r}`;$("vGemini").style.display="block";
      log(`GEMINI → ${r}`,"vote");
    }
  } catch{}

  if(!votes.length) return null;

  const tally = {};
  votes.forEach(v=>tally[v]=(tally[v]||0)+1);
  const winner = Object.entries(tally).sort((a,b)=>b[1]-a[1])[0][0];

  $("vWinner").textContent=`WINNER → ${winner}`;$("vWinner").style.display="block";
  log(`◈ WINNER: ${winner} ◈`,"vote");
  return winner;
};

// ── Siphon one source ────────────────────────────────────────────────────
const siphonSource = async (slug,label,isVoted=false) => {
  try {
    log(`SIPHON ${slug} [${label}]`,"ok");
    const [owner,repo] = slug.split("/");
    let branch = "main";

    let tree = await (await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`)).json();
    if(!tree.tree){
      branch = "master";
      tree = await (await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`)).json();
    }
    if(!tree.tree){
      log(`Repo tree unreachable`,"err");
      return false;
    }

    let blobs = tree.tree.filter(n=>n.type==="blob"&&/\.(js|ts|py|java|go)$/i.test(n.path)&&(n.size||0)>400);
    if(!blobs.length){
      log("No code files found","warn");
      return false;
    }

    blobs.sort((a,b)=>(b.path.match(/core|model|engine|agent|main|pipeline/i)?100:0)-(a.path.match(/core|model|engine|agent|main|pipeline/i)?100:0));
    const best = blobs[0];

    log(`→ ${best.path}`,"ok");

    const blob = await (await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${best.path}?ref=${branch}`)).json();
    const raw = b64dec(blob.content);
    const inc = raw.length>3200?raw.slice(0,3200):raw;

    const evolved = await evolve(currentCode,inc,slug);

    currentCode = evolved;
    $("codeView").textContent = currentCode;
    $("codeSize").textContent = `${(currentCode.length/1000).toFixed(1)} kB`;
    $("copyBtn").style.display = "block";

    log(`UPDATED — ${currentCode.length} chars`,"ok");
    return true;
  } catch(e){
    log(`Siphon fail ${slug}: ${e.message}`,"err");
    return false;
  }
};

// ── Main loop ────────────────────────────────────────────────────────────
const run = async () => {
  const total = parseInt($("rounds").value)||8;
  const satThresh = parseFloat($("satPct").value)/100 || 0.018;

  if(!$("cerebrasKey").value.trim()) log("CEREBRAS KEY missing — final merge weakened","warn");
  if(!$("grokKey").value.trim()) log("GROK KEY missing — critique weakened","warn");

  $("history").style.display="flex";
  $("historyPills").innerHTML="";
  $("satAlert").style.display="none";
  $("voteBox").style.display="none";
  $("deltaWrap").style.display="none";
  $("copyBtn").style.display="none";

  setStat("sRound","—");
  setStat("sDelta","—");
  setStat("sStatus","RUN","run");
  $("activeLabel").textContent="● ACTIVE";
  $("activeLabel").style.color="var(--red)";

  log("◈ v2.3 SLOW STABLE CYCLE START ◈","round");
  log(`→ ${total} rounds | sat ≤ ${$("satPct").value}% | 15s/LLM + 30s/round`);

  $("codeView").textContent=currentCode;
  $("codeSize").textContent=`${(currentCode.length/1000).toFixed(1)} kB`;

  for(let r=1; r<=total; r++){
    if(abortFlag) break;

    setStat("sRound",`${r}/${total}`,"run");
    log(`◈ ROUND ${r}/${total} ◈◈`,"round");
    const startCode = currentCode;

    for(let i=0;i<3;i++){
      if(abortFlag) break;
      setSourceActive(i);
      await siphonSource(SOURCES[i].slug,SOURCES[i].label);
      setProgress(((r-1)/total + (i+1)/(4*total))*100);
    }

    setSourceActive(3,true);
    log("── VOTE + 4TH ──","vote");
    const voted = await conductVote();

    if(voted){
      $("src3").textContent=`◈ ${voted}`;
      $("src3").className="src-chosen";
      await siphonSource(voted,"VOTE WINNER",true);
    }

    clearSourceActive();
    setProgress(r/total*100);

    const delta = computeDelta(startCode,currentCode);
    const pct = Math.round(delta*100);
    const sat = delta < satThresh;

    setStat("sDelta",`${pct}%`,sat?"sat":"");
    $("deltaWrap").style.display="flex";
    $("deltaText").textContent=`${pct}%`;
    $("deltaFill").style.width=`${Math.min(pct,100)}%`;
    $("deltaFill").className="delta-fill"+(sat?" low":"");

    const pill = document.createElement("span");
    pill.className="hpill"+(sat?" sat":"");
    pill.textContent=`R${r} Δ${pct}%${sat?" SAT":""}`;
    $("historyPills").appendChild(pill);

    log(`ROUND ${r} END | Δ ${pct}% ${sat?"→ SATURATED":"→ continuing"}`,sat?"saturate":"round");

    if(sat){
      $("satAlert").style.display="block";
      log("◈ SATURATION — inject new base code to continue ◈","saturate");
    }

    await sleep(30000); // 30s between rounds
  }

  log("◈ CYCLE COMPLETE ◈","round");
  setStat("sStatus","DONE");
  stop();
};

const stop = () => {
  running = false;
  abortFlag = false;
  $("mainBtn").textContent="START SLOW EVOLUTION";
  $("mainBtn").className="btn";
  $("activeLabel").textContent="○ STANDBY";
  $("activeLabel").style.color="#660000";
  clearSourceActive();
};

const toggle = () => {
  if(!running){
    running=true; abortFlag=false;
    $("mainBtn").textContent="ABORT";
    $("mainBtn").className="btn stop";
    run().catch(e=>{log("FATAL: "+e,"err");stop();});
  }else{
    abortFlag=true;
    log("ABORT SIGNAL — finishing current source","warn");
  }
};

const copyCurrentCode = () => {
  navigator.clipboard.writeText(currentCode).then(()=>{
    const b=$("copyBtn");
    const t=b.textContent;
    b.textContent="COPIED ✓";
    setTimeout(()=>b.textContent=t,2200);
  });
};

const injectManualBase = () => {
  const v = $("manualBase").value.trim();
  if(v.length>80){
    currentCode = v;
    $("codeView").textContent = currentCode;
    $("codeSize").textContent = `${(currentCode.length/1000).toFixed(1)} kB`;
    $("copyBtn").style.display="block";
    log("MANUAL BASE INJECTED — restarting evolution","ok");
    $("manualBase").value="";
  }else{
    log("Base too short — ignored","warn");
  }
};
</script>
</body>
</html>
