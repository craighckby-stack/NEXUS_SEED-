import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, FileCode, Play, Trash2, Loader2, 
  AlertCircle, CheckCircle2, Terminal, FileText, 
  Github, Send, ChevronDown, ChevronUp, Clock, PauseCircle, PlayCircle
} from 'lucide-react';

const PDFJS_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
const PDFJS_WORKER_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

export default function App() {
  const [apiKey, setApiKey] = useState(localStorage.getItem('cerebras_key') || '');
  const [ghToken, setGhToken] = useState(localStorage.getItem('gh_token') || '');
  const [ghRepo, setGhRepo] = useState(localStorage.getItem('gh_repo') || '');
  const [targetPath, setTargetPath] = useState(localStorage.getItem('gh_path') || 'recovered_notebook');
  
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, running, paused, done, error
  const [logs, setLogs] = useState([]);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [errorMessage, setErrorMessage] = useState('');
  const [showConfig, setShowConfig] = useState(true);
  const [countdown, setCountdown] = useState(0);

  // Refs for managing the loop state without triggering re-renders
  const abortRef = useRef(false);
  const isPausedRef = useRef(false);

  useEffect(() => {
    localStorage.setItem('cerebras_key', apiKey);
    localStorage.setItem('gh_token', ghToken);
    localStorage.setItem('gh_repo', ghRepo);
    localStorage.setItem('gh_path', targetPath);
  }, [apiKey, ghToken, ghRepo, targetPath]);

  useEffect(() => {
    if (!window.pdfjsLib) {
      const script = document.createElement('script');
      script.src = PDFJS_URL;
      script.onload = () => { window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL; };
      document.head.appendChild(script);
    }
  }, []);

  const addLog = (msg) => setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 50));

  // Visual countdown helper
  const waitWithCountdown = async (seconds) => {
    for (let i = seconds; i > 0; i--) {
      if (abortRef.current) return;
      setCountdown(i);
      await new Promise(r => setTimeout(r, 1000));
    }
    setCountdown(0);
  };

  const pushFileToGithub = async (content, filename) => {
    const headers = { 'Authorization': `token ${ghToken}`, 'Accept': 'application/vnd.github.v3+json' };
    const path = `${targetPath}/${filename}`;
    
    try {
      let sha = null;
      const check = await fetch(`https://api.github.com/repos/${ghRepo}/contents/${path}`, { headers });
      if (check.ok) {
        const data = await check.json();
        sha = data.sha;
      }

      const b64Content = btoa(unescape(encodeURIComponent(content)));
      const response = await fetch(`https://api.github.com/repos/${ghRepo}/contents/${path}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          message: `Recovered ${filename}`,
          content: b64Content,
          sha
        })
      });

      return response.ok;
    } catch (e) {
      console.error("GitHub Push Error", e);
      return false;
    }
  };

  const processSnippet = async (textSnippet, index) => {
    const prompt = `Extract Python code from this text fragment. Return ONLY code. 
    If you see output/logs, put them in a comment block at the bottom.
    FRAGMENT: ${textSnippet}`;

    try {
      const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0,
          max_tokens: 1024 // Restricted output size
        })
      });

      if (response.status === 429) {
        addLog("⚠️ RATE LIMIT HIT (429)");
        addLog("🛑 Entering 70s Penalty Box...");
        await waitWithCountdown(70); 
        return processSnippet(textSnippet, index); // Retry logic
      }

      const data = await response.json();
      const code = data.choices[0].message.content;
      
      // If the code is just "None" or empty, skip
      if (!code || code.length < 10) return;

      const filename = `cell_${String(index).padStart(4, '0')}.py`;
      const success = await pushFileToGithub(code, filename);
      
      if (success) addLog(`✅ Pushed ${filename}`);
      else addLog(`❌ GitHub Error ${filename}`);
      
    } catch (error) {
      addLog(`Error processing snippet: ${error.message}`);
    }
  };

  const startPipeline = async () => {
    if (!apiKey || !ghToken || !ghRepo) return setErrorMessage('Check Settings');
    
    setStatus('running');
    setErrorMessage('');
    abortRef.current = false;
    isPausedRef.current = false;
    setLogs(['Reading PDF...']);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        fullText += textContent.items.map(item => item.str).join(' ') + '\n';
      }

      // TINY CHUNKS: 2000 chars (approx 500 tokens input)
      const snippets = [];
      for (let i = 0; i < fullText.length; i += 2000) {
        snippets.push(fullText.slice(i, i + 2200)); // 200 char overlap
      }

      setProgress({ current: 0, total: snippets.length });
      addLog(`Split into ${snippets.length} micro-chunks.`);

      for (let i = 0; i < snippets.length; i++) {
        if (abortRef.current) break;
        
        // Pause Logic
        while (isPausedRef.current) {
          await new Promise(r => setTimeout(r, 1000));
          if (abortRef.current) break;
        }

        addLog(`Chunk ${i+1}/${snippets.length}: Analyzing...`);
        await processSnippet(snippets[i], i + 1);
        setProgress(p => ({ ...p, current: i + 1 }));

        // STANDARD DELAY: 12 seconds
        if (i < snippets.length - 1) {
          addLog("Tortoise Mode: Cooling down...");
          await waitWithCountdown(12);
        }
      }

      setStatus('done');
      addLog("🎉 PIPELINE COMPLETE");
    } catch (err) {
      setErrorMessage(err.message);
      setStatus('error');
    }
  };

  const togglePause = () => {
    isPausedRef.current = !isPausedRef.current;
    setStatus(isPausedRef.current ? 'paused' : 'running');
    addLog(isPausedRef.current ? '⏸️ Paused' : '▶️ Resumed');
  };

  const stopPipeline = () => {
    abortRef.current = true;
    setStatus('idle');
    addLog('⏹️ Stopped by user');
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 p-4 font-sans">
      <div className="max-w-xl mx-auto space-y-4">
        
        <header className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-600 p-2 rounded-xl text-white"><FileCode size={20}/></div>
            <h1 className="font-black italic uppercase tracking-tighter text-emerald-900">Tortoise Mode</h1>
          </div>
          <button onClick={() => setShowConfig(!showConfig)} className="text-stone-400 p-2"><ChevronDown size={20}/></button>
        </header>

        {showConfig && (
          <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-4 animate-in slide-in-from-top-2">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase text-stone-400">Cerebras Key</p>
              <input type="password" placeholder="sk-..." value={apiKey} onChange={e => setApiKey(e.target.value)} className="w-full p-3 bg-stone-50 border rounded-xl text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase text-stone-400">Repo (user/repo)</p>
                <input type="text" placeholder="me/my-code" value={ghRepo} onChange={e => setGhRepo(e.target.value)} className="w-full p-3 bg-stone-50 border rounded-xl text-sm" />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase text-stone-400">GH Token</p>
                <input type="password" placeholder="ghp_..." value={ghToken} onChange={e => setGhToken(e.target.value)} className="w-full p-3 bg-stone-50 border rounded-xl text-sm" />
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-[2.5rem] border border-stone-200 p-8 shadow-sm">
          {!file ? (
            <div className="border-2 border-dashed border-stone-200 rounded-3xl p-12 text-center relative group">
              <Upload className="mx-auto mb-2 text-stone-300 group-hover:text-emerald-500" size={40} />
              <p className="font-bold text-sm">Upload Large PDF</p>
              <input type="file" accept=".pdf" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => setFile(e.target.files[0])} />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-emerald-900 text-white p-4 rounded-2xl">
                <p className="font-bold text-xs truncate max-w-[150px]">{file.name}</p>
                <button onClick={() => {setFile(null); setStatus('idle');}}><Trash2 size={16}/></button>
              </div>

              {status === 'idle' && (
                <button 
                  onClick={startPipeline}
                  className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-emerald-700 shadow-xl shadow-emerald-100"
                >
                  Start Tortoise Sync
                </button>
              )}

              {['running', 'paused'].includes(status) && (
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={togglePause} className="bg-stone-100 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2">
                    {status === 'paused' ? <PlayCircle size={16}/> : <PauseCircle size={16}/>}
                    {status === 'paused' ? 'Resume' : 'Pause'}
                  </button>
                  <button onClick={stopPipeline} className="bg-red-50 text-red-600 py-3 rounded-xl font-bold text-xs">
                    Stop
                  </button>
                </div>
              )}

              {status !== 'idle' && (
                <div className="space-y-3">
                  <div className="flex justify-between text-[10px] font-black text-stone-400 uppercase tracking-widest">
                    <span>Chunk {progress.current}/{progress.total}</span>
                    <span>{Math.round((progress.current/progress.total)*100)}%</span>
                  </div>
                  <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${(progress.current/progress.total)*100}%` }} />
                  </div>
                </div>
              )}

              {countdown > 0 && (
                <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-center gap-3 animate-pulse">
                  <Clock className="text-amber-600" size={20} />
                  <div>
                    <p className="text-amber-800 font-bold text-xs uppercase">Cooling Down...</p>
                    <p className="text-amber-600 text-[10px] font-mono">Resuming in {countdown}s</p>
                  </div>
                </div>
              )}

              <div className="bg-stone-900 p-4 rounded-2xl space-y-1 h-64 overflow-y-auto font-mono text-[10px] text-emerald-400">
                {logs.map((log, i) => (
                  <div key={i} className="border-b border-stone-800 pb-1 opacity-80">{log}</div>
                ))}
              </div>
            </div>
          )}
        </div>

        {errorMessage && (
          <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 text-red-700 font-bold text-xs">
            <AlertCircle size={16} className="flex-shrink-0" />
            <p>{errorMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
        }
