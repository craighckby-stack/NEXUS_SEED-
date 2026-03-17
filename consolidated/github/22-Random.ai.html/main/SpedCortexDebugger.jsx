import React, { useState, useEffect, useRef, useCallback, useReducer } from 'react';

// --- Configuration Constants ---
const API_MODEL = 'gemini-2.5-flash-preview-09-2025';
const API_URL = (key) => `https://generativelanguage.googleapis.com/v1beta/models/${API_MODEL}:generateContent?key=${key}`;
const MAX_RETRIES = 5;

// --- Dork Strategies Definition ---
const DORK_STRATEGIES = [
  {
    id: 'academic',
    name: 'Academic/Official Reports (High-Confidence)',
    template: `"{topic}" (site:gov OR site:edu) AND (filetype:pdf OR filetype:pptx)`,
    description: 'Searches for formal, vetted documentation from government or educational institutions.'
  },
  {
    id: 'tech_trends',
    name: 'Emerging Tech & Code Trends (Opinion/Code)',
    template: `"{topic}" (site:reddit.com OR site:github.com OR site:stackoverflow.com) AND inurl:new`,
    description: 'Focuses on forums and repositories for cutting-edge, yet unverified, developments and code examples.'
  },
  {
    id: 'corporate_data',
    name: 'Financial & Corporate Data (Statistics/Reports)',
    template: `"{topic}" (site:sec.gov OR filetype:xlsx OR filetype:csv) AND "revenue"`,
    description: 'Targets official financial filings and structured data sheets for quantitative analysis.'
  },
];

// --- Initial State and Reducer for Complex Data ---

const INITIAL_STATE = {
    knowledgeNodes: [{ id: 'fact-start', label: 'System Initialized - Ready for Advanced Search Context', type: 'fact' }],
    relationships: [],
    systemMetrics: { accuracy: 0, coherence: 0, novelty: 0 },
    learningCycles: [{ cycle: 0, summary: "Ready to initiate deep learning cycle using advanced Google Dorks." }],
    currentCycle: 0,
    uniqueCharacters: [],
    personas: {
        critic: "Awaiting new data analysis...",
        optimist: "Ready to find potential!",
        synthesizer: "Awaiting data to connect..."
    }
};

const dataReducer = (state, action) => {
    switch (action.type) {
        case 'INIT':
            return INITIAL_STATE;
        case 'UPDATE_ANALYSIS': {
            const { cycle, text, metrics, uniqueChars, personaUpdates } = action.payload;
            const newNodeId = `n${cycle}`;
            
            return {
                ...state,
                currentCycle: cycle,
                learningCycles: [...state.learningCycles, { cycle, summary: text }],
                uniqueCharacters: uniqueChars,
                systemMetrics: metrics,
                personas: personaUpdates,
                knowledgeNodes: [
                    ...state.knowledgeNodes,
                    { id: newNodeId, label: `High-Confidence Fact (C${cycle})`, type: 'fact' },
                    { id: `${newNodeId}-hypo`, label: `Hypothesis from Dork Data`, type: 'hypo' }
                ],
                relationships: [
                    ...state.relationships,
                    { from: 'fact-start', to: newNodeId, label: 'high_certainty', type: 'valid' },
                    { from: newNodeId, to: `${newNodeId}-hypo`, label: 'suggests_future', type: 'questionable' }
                ]
            };
        }
        case 'UPDATE_PERSONAS':
            return { ...state, personas: action.payload };
        case 'UPDATE_METRICS':
            return { ...state, systemMetrics: action.payload };
        default:
            return state;
    }
};


// --- Icon Components (Optimized) ---
const Icon = ({ path, className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
);

const CogIcon = (props) => (
    <Icon {...props} path="M4.5 12a7.5 7.5 0 0015 0m-15 0a7.5 7.5 0 1115 0m-15 0H3m18 0h-1.5m-15 0a7.5 7.5 0 1115 0m-15 0H3m18 0h-1.5m-15 0a7.5 7.5 0 1115 0m-15 0H3m18 0h-1.5M12 9.75v1.5m0 7.5v1.5m0-4.5v1.5m0 0v-1.5m0 0a1.5 1.5 0 100 3 1.5 1.5 0 000-3zM12 9.75a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
);

const BeakerIcon = (props) => (
    <Icon {...props} path="M14.25 6.087c0-.66.537-1.197 1.197-1.197h.006c.66 0 1.197.537 1.197 1.197v7.603a.75.75 0 01-.06.29l-2.095 4.19a.75.75 0 01-.69.407h-4.218a.75.75 0 01-.69-.407l-2.095-4.19a.75.75 0 01-.06-.29V6.087c0-.66.537-1.197 1.197-1.197h.006c.66 0 1.197.537 1.197 1.197v.006a.75.75 0 001.5 0V6.087zM14.25 18v1.5c0 .621.504 1.125 1.125 1.125h.006c.621 0 1.125-.504 1.125-1.125V18M9.75 18v1.5c0 .621.504 1.125 1.125 1.125h.006c.621 0 1.125-.504 1.125-1.125V18M12 6.75h.008v.008H12V6.75z" />
);

const ZapIcon = (props) => (
    <Icon {...props} path="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
);

const KeyIcon = (props) => (
    <Icon {...props} path="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
);

const UserGroupIcon = (props) => (
    <Icon {...props} path="M18 18.72a9.094 9.094 0 00-12 0m12 0a9.094 9.094 0 01-12 0m12 0v.006M9.75 9.75a3 3 0 116 0 3 3 0 01-6 0zM3.75 20.25a9.094 9.094 0 0116.5 0v.006M21.75 20.25a9.094 9.094 0 00-16.5 0v.006" />
);

const TerminalIcon = (props) => (
    <Icon {...props} path="M6.75 7.5l3 2.25-3 2.25m3 0h3m-3 0l3 2.25-3 2.25M6.75 15l3-2.25-3-2.25m12-9l-3 2.25 3 2.25m-3 0h-3m3 0l-3 2.25 3 2.25M9 3l-3 2.25 3 2.25M15 3l3 2.25-3 2.25m-3 12l3 2.25-3-2.25M9 21l3-2.25-3-2.25" />
);

const CodeBracketIcon = (props) => (
    <Icon {...props} path="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-5.25 15" />
);

const CpuChipIcon = (props) => (
    <Icon {...props} path="M9 13.5l3 3 3-3m-3-6h.007V7.5H12v.007zM20.25 13.5v-7.5a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6V18a2.25 2.25 0 002.25 2.25h12.75a2.25 2.25 0 002.25-2.25v-7.5" />
);

const Spinner = () => (
    <svg className="loading-spinner text-white w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);


// --- Utility Components ---

const GlobalStyles = () => (
  <style>{`
    :root {
      --bg: #0b1020;
      --bg-soft: #141a2b;
      --card: #0f1630;
      --text: #e5e7eb;
      --muted: #94a3b8;
      --primary: #4f46e5; 
      --green: #10b981;   
      --yellow: #f59e0b;  
      --red: #ef4444;     
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    .loading-spinner {
      animation: spin 1s linear infinite;
    }

    /* ESN node styles */
    .node-fact { fill: var(--green); }
    .node-hypo { fill: var(--yellow); }
    .node-conflict { fill: var(--red); }

    .edge-valid { stroke: var(--green); stroke-width:2px; }
    .edge-questionable { stroke: var(--yellow); stroke-width:2px; }
    .edge-invalid { stroke: var(--red); stroke-width:2px; }
  `}</style>
);

const MetricCard = React.memo(({ title, value, icon, color }) => {
  const colorClasses = {
    green: 'text-[var(--green)]',
    blue: 'text-indigo-400',
    yellow: 'text-[var(--yellow)]',
  };
  const bgClasses = {
    green: 'bg-[var(--green)]',
    blue: 'bg-indigo-500',
    yellow: 'bg-[var(--yellow)]',
  };
  const roundedValue = Math.min(100, Math.floor(value));

  return (
    <div className="bg-[var(--bg-soft)] p-4 rounded-lg">
      <div className="flex items-center space-x-3 mb-2">
        {React.cloneElement(icon, { className: `w-5 h-5 ${colorClasses[color]}` })}
        <span className="text-sm font-medium text-[var(--muted)]">{title}</span>
      </div>
      <div className="text-3xl font-bold text-[var(--text)]">{roundedValue}%</div>
      <div className="w-full bg-[#1e2a4a] rounded-full h-1.5 mt-3">
        <div
          className={`${bgClasses[color]} h-1.5 rounded-full shadow-lg`}
          style={{ 
            width: `${roundedValue}%`, 
            transition: 'width 0.5s ease-in-out', 
            boxShadow: `0 0 8px 0 ${color === 'green' ? 'var(--green)' : color === 'blue' ? 'var(--primary)' : 'var(--yellow)'}40` 
          }}
        ></div>
      </div>
    </div>
  );
});

const PersonaCard = React.memo(({ name, perspective, icon, color }) => (
   <div className="bg-[var(--bg-soft)] rounded-lg p-5">
      <div className="flex items-center space-x-3 mb-3">
        {React.cloneElement(icon, { className: `w-6 h-6 ${color}` })}
        <h3 className="text-lg font-semibold text-[var(--text)]">{name}</h3>
      </div>
      <p className="text-sm text-[var(--text)] font-mono leading-relaxed max-h-24 overflow-y-auto">{perspective}</p>
    </div>
));


// --- API Implementation and Core Logic ---

/**
 * Executes a fetch request with exponential backoff for resilience.
 */
async function fetchWithExponentialBackoff(url, options, retries = 0) {
    try {
        const response = await fetch(url, options);
        if (response.status === 429 && retries < MAX_RETRIES) {
            const delay = Math.pow(2, retries) * 1000 + Math.random() * 1000;
            console.warn(`Rate limit hit. Retrying in ${Math.round(delay / 1000)}s...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return fetchWithExponentialBackoff(url, options, retries + 1);
        }
        if (!response.ok) {
            const errorBody = await response.text();
            let errorMessage = `API request failed with status: ${response.status}.`;
            if (errorBody.length > 0) {
                 // Try to parse error for a more meaningful message
                try {
                    const errorJson = JSON.parse(errorBody);
                    errorMessage += ` Detail: ${errorJson.error?.message || errorBody.substring(0, 100)}`;
                } catch {
                    errorMessage += ` Body: ${errorBody.substring(0, 100)}...`;
                }
            }
            throw new Error(errorMessage);
        }
        return response.json();
    } catch (error) {
        if (retries < MAX_RETRIES) {
            const delay = Math.pow(2, retries) * 1000 + Math.random() * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
            return fetchWithExponentialBackoff(url, options, retries + 1);
        }
        throw new Error(`Final API request failed after ${MAX_RETRIES} retries: ${error.message}`);
    }
}

/**
 * Applies a specific Google Dork strategy to the user's topic.
 */
const applyGoogleDorks = (topic, strategyId) => {
    const strategy = DORK_STRATEGIES.find(s => s.id === strategyId);
    if (!strategy) return topic;

    return strategy.template.replace(/{topic}/g, topic.trim()); // Use global replace
};

/**
 * Extracts and sorts all unique characters from one or more strings.
 */
const getUniqueCharacters = (texts) => {
    const combinedText = Array.isArray(texts) ? texts.join(' ') : texts;
    if (!combinedText) return [];
    
    const characters = new Set();
    for (const char of combinedText) {
        if (char !== '\n' && char !== '\r' && char !== '\t') { // Ignore common control characters
            characters.add(char);
        }
    }
    return Array.from(characters).sort((a, b) => a.localeCompare(b));
};

const generateSystemPrompt = (topic) => `
    You are the SPED Cortex, an advanced Analytical System. Your task is to perform a deep, factual analysis of the user's refined search query.
    
    The query you received has been optimized using **Google Dorks** to yield highly specific, high-quality documentation. You MUST use the 'google_search' tool for grounding based on the provided query context.

    Analyze the search results and respond with the following three perspectives, ensuring each is clearly marked with its label:

    1. **Critique:** Identify the biggest limitation or challenge discovered in the high-quality documents (e.g., funding gaps, technical hurdles, or regulatory delays). Be skeptical and specific.
    2. **Optimist:** Identify the most promising advancement or potential breakthrough cited in the search results. Be forward-looking and detailed.
    3. **Synthesize:** Provide a brief summary connecting the key facts from the critique and optimism into a cohesive future implication.
    
    Format your response as a single, detailed paragraph containing all three perspectives, clearly labeled exactly as: "Critique: [Text] Optimist: [Text] Synthesize: [Text]".
`;

// --- Main Dashboard Component ---
export default function SpedCortexDebugger() {
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [apiConfigured, setApiConfigured] = useState(false);
  
  const [currentTopic, setCurrentTopic] = useState('Latest Developments in Quantum Computing');
  const [selectedDorkId, setSelectedDorkId] = useState(DORK_STRATEGIES[0].id); 
  
  const [echoedInput, setEchoedInput] = useState('');
  const [advancedQuery, setAdvancedQuery] = useState(''); 
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);

  const [state, dispatch] = useReducer(dataReducer, INITIAL_STATE);

  const initializeData = useCallback(() => {
    dispatch({ type: 'INIT' });
    setEchoedInput('');
    setAdvancedQuery('');
    setError(null);
  }, []);

  // --- API Key Persistence & Initialization ---
 useEffect(() => {
   const savedGeminiKey = localStorage.getItem('gemini-api-key');
   if (savedGeminiKey) {
     setGeminiApiKey(savedGeminiKey);
     setApiConfigured(true);
     initializeData();
   }
 }, [initializeData]);

  const saveApiKeys = () => {
    localStorage.setItem('gemini-api-key', geminiApiKey);
    if (geminiApiKey.trim()) {
        initializeData();
        setApiConfigured(true);
    }
  };
  
  const startLearning = async () => {
    if (isAnalyzing || !geminiApiKey) return;
    
    setIsAnalyzing(true);
    setError(null);
    
    const baseUserQuery = currentTopic;
    const advancedUserQuery = applyGoogleDorks(baseUserQuery, selectedDorkId); 
    
    setEchoedInput(baseUserQuery);
    setAdvancedQuery(advancedUserQuery);
    
    const systemPrompt = generateSystemPrompt(currentTopic);

    const payload = {
        contents: [{ parts: [{ text: advancedUserQuery }] }], 
        tools: [{ google_search: {} }],
        config: { systemInstruction: systemPrompt },
    };
    
    const url = API_URL(geminiApiKey);

    try {
        const result = await fetchWithExponentialBackoff(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const text = result.candidates?.[0]?.content?.parts?.[0]?.text || "Analysis failed to return structured text content from the LLM.";
        
        // --- Core Cortex Processing Simulation ---
        
        const newCycle = state.currentCycle + 1;
        
        // 1. Simulate Persona updates based on the text structure (looking for labels)
        const critiqueMatch = text.match(/Critique:\s*(.*?)(?=\s*Optimist:|$)/s);
        const optimistMatch = text.match(/Optimist:\s*(.*?)(?=\s*Synthesize:|$)/s);
        const synthesisMatch = text.match(/Synthesize:\s*(.*)/s);

        const personaUpdates = {
            critic: critiqueMatch ? critiqueMatch[1].trim() : "Failed to extract Critique.",
            optimist: optimistMatch ? optimistMatch[1].trim() : "Failed to extract Optimist view.",
            synthesizer: synthesisMatch ? synthesisMatch[1].trim() : "Failed to extract Synthesis.",
        };

        // 2. Simulate Metric Update (using higher fidelity randomness)
        const newMetrics = {
            accuracy: Math.min(99, 85 + Math.random() * 10 + (newCycle * 0.5)), 
            coherence: Math.min(99, 80 + Math.random() * 15 + (newCycle * 0.3)),
            novelty: Math.min(100, 70 + Math.random() * 25),
        };

        // 3. Character Analysis
        const uniqueChars = getUniqueCharacters([currentTopic, text]);

        // 4. Dispatch combined update
        dispatch({
            type: 'UPDATE_ANALYSIS',
            payload: {
                cycle: newCycle,
                text: text,
                metrics: newMetrics,
                uniqueChars: uniqueChars,
                personaUpdates: personaUpdates
            }
        });

    } catch (err) {
        console.error("Gemini API Error:", err.message);
        setError(`Analysis failed. Check your API key, console, or rate limits: ${err.message}`);
        dispatch({ type: 'UPDATE_PERSONAS', payload: { critic: "System Error!", optimist: "System Error!", synthesizer: "System Error!" } });
    } finally {
        setIsAnalyzing(false);
    }
  };


  const currentDorkStrategy = DORK_STRATEGIES.find(s => s.id === selectedDorkId);
  const { knowledgeNodes, relationships, systemMetrics, learningCycles, currentCycle, uniqueCharacters, personas } = state;


  // --- Render: API Key Modal ---
  if (!apiConfigured) {
    return (
      <>
        <GlobalStyles />
        <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--card)] border border-[#1e2a4a] rounded-xl p-6 shadow-xl max-w-md w-full text-[var(--text)]">
            <div className="flex items-center space-x-3 mb-4">
              <KeyIcon className="w-8 h-8 text-indigo-400" />
              <h2 className="text-2xl font-bold">Configure API Key</h2>
            </div>
            <p className="text-sm text-[var(--muted)] mb-5">
              Please enter your **Gemini API Key** to enable the SPED Cortex analysis. This key is stored locally.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-1">Gemini API Key</label>
                <input
                  type="password"
                  placeholder="Your Gemini API Key"
                  className="w-full px-4 py-2 rounded-lg bg-[var(--bg-soft)] border border-[#1e2a4a] text-[var(--text)]"
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                />
              </div>
              <button
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:bg-gray-600"
                onClick={saveApiKeys}
                disabled={!geminiApiKey.trim()}
              >
                Save Key & Load System
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // --- Control Panel Component ---
  const ControlPanel = () => (
    <div className="bg-[var(--card)] border border-[#1e2a4a] rounded-xl shadow-2xl shadow-black/20 p-5 space-y-4">
        <h2 className="text-xl font-bold text-white mb-4 border-b border-[#1e2a4a] pb-2">Analysis Control Panel</h2>
        
        {/* Learning Topic Input */}
        <label className="block text-sm font-medium text-[var(--text)] mb-1">Learning Topic / Query</label>
        <input
            value={currentTopic}
            onChange={(e) => setCurrentTopic(e.target.value)}
            disabled={isAnalyzing}
            placeholder="e.g., Latest Developments in Quantum Computing"
            className="w-full px-4 py-2.5 bg-[var(--bg-soft)] border border-[#1e2a4a] rounded-lg text-[var(--text)] disabled:opacity-70 focus:ring-indigo-500 focus:border-indigo-500"
        />

        {/* Dork Strategy Selector */}
        <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-1 flex items-center">
                <CpuChipIcon className="w-4 h-4 mr-1 text-indigo-400"/>
                Dork Search Strategy
            </label>
            <select
                value={selectedDorkId}
                onChange={(e) => setSelectedDorkId(e.target.value)}
                disabled={isAnalyzing}
                className="w-full px-4 py-2.5 bg-[var(--bg-soft)] border border-[#1e2a4a] rounded-lg text-[var(--text)] disabled:opacity-70 focus:ring-indigo-500 focus:border-indigo-500 appearance-none cursor-pointer"
            >
                {DORK_STRATEGIES.map(strategy => (
                    <option key={strategy.id} value={strategy.id}>{strategy.name}</option>
                ))}
            </select>
            <p className="text-xs text-[var(--muted)] mt-2 italic max-h-16 overflow-y-auto">{currentDorkStrategy.description}</p>
        </div>
        
        <div className="pt-4 border-t border-[#1e2a4a]">
            <button
                disabled={isAnalyzing || !currentTopic.trim()}
                className="w-full flex justify-center items-center space-x-2 px-4 py-3 bg-indigo-600 rounded-lg hover:bg-indigo-500 font-semibold text-white disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors"
                onClick={startLearning}
            >
                {isAnalyzing ? (
                    <>
                        <Spinner />
                        <span>Applying Dorks & Analyzing...</span>
                    </>
                ) : (
                    <span>Start Dynamic Analysis (Cycle {currentCycle + 1})</span>
                )}
            </button>
        </div>

        {/* Advanced Query Output */}
        <div className="mt-4 p-3 bg-gray-900 rounded-lg border border-[#1e2a4a] max-h-40 overflow-y-auto">
            <h2 className="text-sm font-bold mb-1 text-amber-400">Dork Query Sent:</h2>
            <p className="font-mono text-xs text-amber-300 break-words">{advancedQuery || 'Awaiting topic and analysis start...'}</p>
            <p className="mt-2 text-xs text-[var(--muted)]">Base Topic: <span className="text-white font-mono">{echoedInput}</span></p>
        </div>
    </div>
  );

  // --- Knowledge Graph Component ---
  const KnowledgeGraphDisplay = () => (
    <div className="bg-[var(--card)] border border-[#1e2a4a] rounded-xl shadow-2xl shadow-black/20 h-full flex flex-col">
        <h2 className="flex items-center space-x-2 p-4 border-b border-[#1e2a4a] text-white font-semibold">
            <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" /></svg>
            <span>Knowledge Graph (Nodes: {knowledgeNodes.length} | Edges: {relationships.length})</span>
        </h2>
        <div className="p-4 flex-grow overflow-y-auto font-mono text-sm">
            <h3 className="text-indigo-400 mb-2 font-bold sticky top-0 bg-[var(--card)] py-1">Nodes:</h3>
            <ul className="pl-4 space-y-1">
                {knowledgeNodes.map(node => (
                    <li key={node.id} className={`text-xs ${
                        node.type === 'fact' ? 'text-[var(--green)]' :
                        node.type === 'hypo' ? 'text-[var(--yellow)]' :
                        'text-[var(--red)]'
                    }`}>
                        [{node.type.toUpperCase()}] {node.label} <span className="text-[var(--muted)]">({node.id})</span>
                    </li>
                ))}
            </ul>
            <h3 className="text-indigo-400 mb-2 mt-4 font-bold sticky top-0 bg-[var(--card)] py-1">Relationships:</h3>
            <ul className="pl-4 space-y-1">
                {relationships.map((rel, i) => (
                    <li key={i} className={`text-xs ${
                        rel.type === 'valid' ? 'text-[var(--green)]' :
                        rel.type ==='questionable' ? 'text-[var(--yellow)]' :
                        'text-[var(--red)]'
                    }`}>
                        {rel.from} --[{rel.label}]--&gt; {rel.to}
                    </li>
                ))}
            </ul>
        </div>
    </div>
  );

  // --- Main Dashboard UI ---
  return (
   <>
     <GlobalStyles />
     <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] p-4 md:p-8 font-sans">
       {/* Header */}
       <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-4 border-b border-[#1e2a4a]">
         <div>
           <h1 className="text-3xl font-extrabold">SPED Cortex <span className="text-indigo-400">Dashboard</span></h1>
           <p className="text-[var(--muted)]">Advanced Analysis via Gemini API & Dynamic Google Dork Grounding</p>
         </div>
         <div className="flex items-center space-x-4 mt-2 sm:mt-0">
           <span className="text-sm text-[var(--muted)]">Cycle: <span className="font-bold text-[var(--text)]">{currentCycle}</span></span>
           <div className="relative">
             <CogIcon className={`w-6 h-6 ${isAnalyzing ? 'animate-spin text-yellow-400' : 'text-[var(--muted)]'}`} />
           </div>
         </div>
       </header>

       {/* Error Message */}
        {error && (
            <div className="bg-[var(--red)] bg-opacity-20 border border-[var(--red)] p-4 rounded-lg text-sm mb-6 font-mono text-[var(--red)] overflow-x-auto">
                <strong>[CRITICAL ERROR]</strong> {error}
            </div>
        )}

       {/* Content grid */}
       <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6">

         {/* Column 1: Control Panel */}
         <div className="lg:col-span-1 space-y-6">
           <ControlPanel />

           {/* Character Set Analysis */}
           <div className="bg-[var(--card)] border border-[#1e2a4a] rounded-xl p-5 shadow-2xl shadow-black/20">
             <h2 className="flex items-center space-x-2 mb-3 border-b border-[#1e2a4a] pb-3 text-white font-semibold">
               <CodeBracketIcon className="w-5 h-5 text-purple-400" />
               <span>Character Set Analysis (Total: {uniqueCharacters.length})</span>
             </h2>
             <div className="max-h-48 overflow-y-auto space-y-1">
               {uniqueCharacters.length === 0 ? (
                 <p className="text-[var(--muted)] text-sm">Run an analysis cycle to map the character set.</p>
               ) : (
                 <div className="flex flex-wrap gap-1.5 font-mono text-base text-white">
                   {uniqueCharacters.map((char, index) => (
                     <span 
                       key={index} 
                       title={char === ' ' ? 'Space' : char.charCodeAt(0)}
                       className="px-2 py-1 bg-[#1e2a4a] rounded text-xs leading-none hover:bg-indigo-700 transition-colors"
                     >
                       {char === ' ' ? 'SPC' : char}
                     </span>
                   ))}
                 </div>
               )}
             </div>
           </div>
         </div>


         {/* Column 2: Knowledge Graph (simulated) */}
         <div className="lg:col-span-1 xl:col-span-2 space-y-6 min-h-[500px]">
            <KnowledgeGraphDisplay />
         </div>

         {/* Column 3: Reports & Logs */}
         <div className="lg:col-span-1 space-y-6">
           {/* System Metrics */}
           <div className="bg-[var(--card)] border border-[#1e2a4a] rounded-xl p-5 shadow-2xl shadow-black/20">
             <h2 className="text-lg font-semibold mb-3 border-b border-[#1e2a4a] pb-3 text-white">System Metrics</h2>
             <div className="grid grid-cols-3 gap-3">
               <MetricCard title="Accuracy" value={systemMetrics.accuracy} icon={<BeakerIcon />} color="green" />
               <MetricCard title="Coherence" value={systemMetrics.coherence} icon={<CogIcon />} color="blue" />
               <MetricCard title="Novelty" value={systemMetrics.novelty} icon={<ZapIcon />} color="yellow" />
             </div>
           </div>

           {/* Persona Analysis */}
           <div className="bg-[var(--card)] border border-[#1e2a4a] rounded-xl p-5 shadow-2xl shadow-black/20">
             <h2 className="flex items-center space-x-2 mb-3 border-b border-[#1e2a4a] pb-3 text-white font-semibold">
               <UserGroupIcon className="w-5 h-5 text-indigo-400" />
               <span>Persona Analysis (Cortex Perspectives)</span>
             </h2>
             <div className="space-y-4">
               <PersonaCard name="Critic" perspective={personas.critic} icon={<BeakerIcon />} color="text-[var(--red)]" />
               <PersonaCard name="Optimist" perspective={personas.optimist} icon={<ZapIcon />} color="text-[var(--green)]" />
               <PersonaCard name="Synthesizer" perspective={personas.synthesizer} icon={<CogIcon />} color="text-blue-400" />
             </div>
           </div>

           {/* Learning Cycle Log */}
           <div className="bg-[var(--card)] border border-[#1e2a4a] rounded-xl p-5 shadow-2xl shadow-black/20">
             <h2 className="flex items-center space-x-2 mb-3 border-b border-[#1e2a4a] pb-3 text-white font-semibold">
               <TerminalIcon className="w-5 h-5 text-green-400" />
               <span>Learning Cycle Log</span>
             </h2>
             <div className="max-h-64 overflow-y-auto space-y-2">
               {learningCycles.length <= 1 ? (
                 <p className="text-[var(--muted)]">System ready. Enter a topic and start analysis.</p>
               ) : (
                 learningCycles.slice(1).reverse().map((log) => (
                   <div key={log.cycle} className="font-mono text-xs border-b border-[#1e2a4a] pb-2 last:border-b-0">
                     <span className="text-green-400">cycle_{log.cycle}:</span> {log.summary.substring(0, 150)}...
                   </div>
                 ))
               )}
             </div>
           </div>
         </div>

       </div>
     </div>
   </>
 );
}