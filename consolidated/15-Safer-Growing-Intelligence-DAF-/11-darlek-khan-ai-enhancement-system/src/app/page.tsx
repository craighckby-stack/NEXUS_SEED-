'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

// Enhanced type definitions with better documentation
interface SystemInfo {
  initialized: boolean;
  initTime: string | null;
  aiModel: string | null;
  githubApiStatus: string | null;
  systemCapabilities: string[];
}

interface TerminalLine {
  id: string;
  message: string;
  type: 'output' | 'error' | 'success' | 'info';
  timestamp: Date;
}

interface EnhancementStats {
  enhanced: number;
  skipped: number;
  unchanged: number;
  errors: number;
  total: number;
}

interface SplashMessage {
  status: string;
  details: string;
}

interface RepositoryConfig {
  owner: string;
  repo: string;
  isValid: boolean;
}

// Constants for better maintainability
const SPLASH_MESSAGES: SplashMessage[] = [
  { status: "Initializing AI systems...", details: "Loading core modules and dependencies..." },
  { status: "Connecting to GitHub API...", details: "Establishing secure connection to GitHub..." },
  { status: "Initializing Gemini AI model...", details: "Loading gemini-1.5-flash model..." },
  { status: "Configuring enhancement engine...", details: "Setting up autonomous improvement algorithms..." },
  { status: "System ready!", details: "Darlek Khan is ready to use" }
];

const CYCLE_DELAY = 1500; // ms
const CONFIG_SUCCESS_TIMEOUT = 3000; // ms
const MAX_CYCLES = 20;
const MIN_CYCLES = 1;

// Custom hooks for better state management
const useTerminal = () => {
  const [lines, setLines] = useState<TerminalLine[]>([]);

  const addLine = useCallback((message: string, type: TerminalLine['type'] = 'output') => {
    const newLine: TerminalLine = {
      id: `${Date.now()}-${Math.random()}`,
      message,
      type,
      timestamp: new Date()
    };
    setLines(prev => [...prev, newLine]);
  }, []);

  const clearLines = useCallback(() => {
    setLines([]);
  }, []);

  return { lines, addLine, clearLines };
};

const useRepositoryConfig = () => {
  const [repoInput, setRepoInput] = useState('');
  const [ownerInput, setOwnerInput] = useState('');
  const [repoNameInput, setRepoNameInput] = useState('');

  // Parse repository configuration with validation
  const parseRepositoryConfig = useCallback((input: string): RepositoryConfig => {
    const parts = input.trim().split('/');
    
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      return {
        owner: '',
        repo: '',
        isValid: false
      };
    }

    return {
      owner: parts[0],
      repo: parts[1],
      isValid: true
    };
  }, []);

  // Synchronize repository fields bidirectionally
  const syncRepoFields = useCallback((direction: 'separate-to-combined' | 'combined-to-separate') => {
    if (direction === 'separate-to-combined') {
      if (ownerInput && repoNameInput) {
        const combined = `${ownerInput}/${repoNameInput}`;
        setRepoInput(combined);
      }
    } else {
      const config = parseRepositoryConfig(repoInput);
      if (config.isValid) {
        setOwnerInput(config.owner);
        setRepoNameInput(config.repo);
      }
    }
  }, [ownerInput, repoNameInput, repoInput, parseRepositoryConfig]);

  // Event handlers with better error handling
  const handleOwnerChange = useCallback((value: string) => {
    setOwnerInput(value.trim());
    syncRepoFields('separate-to-combined');
  }, [syncRepoFields]);

  const handleRepoNameChange = useCallback((value: string) => {
    setRepoNameInput(value.trim());
    syncRepoFields('separate-to-combined');
  }, [syncRepoFields]);

  const handleRepoInputChange = useCallback((value: string) => {
    setRepoInput(value.trim());
    syncRepoFields('combined-to-separate');
  }, [syncRepoFields]);

  const getRepositoryConfig = useCallback((): RepositoryConfig => {
    // Use separate fields if available, otherwise fall back to combined input
    if (ownerInput && repoNameInput) {
      return {
        owner: ownerInput,
        repo: repoNameInput,
        isValid: true
      };
    }

    return parseRepositoryConfig(repoInput);
  }, [ownerInput, repoNameInput, repoInput, parseRepositoryConfig]);

  return {
    repoInput,
    ownerInput,
    repoNameInput,
    handleOwnerChange,
    handleRepoNameChange,
    handleRepoInputChange,
    getRepositoryConfig
  };
};

const useSystemInfo = () => {
  const [systemInfo, setSystemInfo] = useState<SystemInfo>({
    initialized: false,
    initTime: null,
    aiModel: null,
    githubApiStatus: null,
    systemCapabilities: []
  });

  const updateSystemInfo = useCallback((step: number) => {
    setSystemInfo(prev => {
      const updated = { ...prev };
      
      switch (step) {
        case 0:
          updated.systemCapabilities = [...updated.systemCapabilities, "Core modules loaded"];
          break;
        case 1:
          updated.githubApiStatus = "Connected";
          break;
        case 2:
          updated.aiModel = "gemini-1.5-flash";
          break;
        case 3:
          updated.systemCapabilities = [...updated.systemCapabilities, "Enhancement engine configured"];
          break;
        case 4:
          updated.initialized = true;
          updated.initTime = new Date().toLocaleString();
          break;
      }
      
      return updated;
    });
  }, []);

  return { systemInfo, updateSystemInfo };
};

export default function Home() {
  const [splashVisible, setSplashVisible] = useState(true);
  const [splashProgress, setSplashProgress] = useState(0);
  const [splashStatus, setSplashStatus] = useState('');
  const [splashDetails, setSplashDetails] = useState('');
  
  // Form state with better organization
  const [cycleCount, setCycleCount] = useState(8);
  const [cycleDelay, setCycleDelay] = useState(5);
  const [autoMerge, setAutoMerge] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [currentCycle, setCurrentCycle] = useState(0);
  const [totalCycles, setTotalCycles] = useState(0);
  const [currentStats, setCurrentStats] = useState<EnhancementStats>({
    enhanced: 0,
    skipped: 0,
    unchanged: 0,
    errors: 0,
    total: 0
  });

  // API Keys state
  const [githubToken, setGithubToken] = useState('');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [showConfig, setShowConfig] = useState(false);
  const [configSaved, setConfigSaved] = useState(false);

  // Initialize configuration from environment variables
  useEffect(() => {
    const loadExistingConfig = async () => {
      try {
        const response = await fetch('/api/config');
        if (response.ok) {
          const config = await response.json();
          if (config.data?.github?.configured && config.data?.gemini?.configured) {
            // Set placeholder values to indicate configuration exists
            setGithubToken('••••••••••••••••••••••••••••••••');
            setGeminiApiKey('••••••••••••••••••••••••••••••••');
          }
        }
      } catch (error) {
        console.log('No existing configuration found');
      }
    };
    
    loadExistingConfig();
  }, []);

  // Custom hooks
  const { lines: terminalLines, addLine, clearLines } = useTerminal();
  const { 
    repoInput, 
    ownerInput, 
    repoNameInput, 
    handleOwnerChange, 
    handleRepoNameChange, 
    handleRepoInputChange,
    getRepositoryConfig 
  } = useRepositoryConfig();
  const { systemInfo, updateSystemInfo } = useSystemInfo();

  // Enhanced splash screen logic with better error handling
  const updateSplashScreen = useCallback((step: number, steps: number) => {
    try {
      if (step < steps) {
        const message = SPLASH_MESSAGES[step];
        setSplashStatus(message.status);
        setSplashDetails(message.details);
        setSplashProgress(((step + 1) / steps) * 100);
        
        updateSystemInfo(step);
        setTimeout(() => updateSplashScreen(step + 1, steps), CYCLE_DELAY);
      } else {
        setTimeout(() => {
          setSplashVisible(false);
        }, 1000);
      }
    } catch (error) {
      console.error('Error in splash screen:', error);
      setSplashVisible(false);
    }
  }, [updateSystemInfo]);

  useEffect(() => {
    const totalSteps = SPLASH_MESSAGES.length;
    updateSplashScreen(0, totalSteps);
  }, [updateSplashScreen]);

  // Enhanced API configuration with better error handling
  const saveConfiguration = useCallback(async (): Promise<boolean> => {
    // Skip saving if values are just placeholders (already configured)
    if (githubToken.includes('••••') && geminiApiKey.includes('••••')) {
      addLine('Configuration already exists and is valid', 'success');
      return true;
    }

    if (!githubToken.trim() || !geminiApiKey.trim()) {
      addLine('Error: Both GitHub token and Gemini API key are required', 'error');
      return false;
    }

    try {
      const response = await fetch('/api/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          githubToken: githubToken.trim(),
          geminiApiKey: geminiApiKey.trim()
        })
      });

      if (response.ok) {
        setConfigSaved(true);
        addLine('✓ Configuration saved successfully', 'success');
        setTimeout(() => setConfigSaved(false), CONFIG_SUCCESS_TIMEOUT);
        
        // Update UI to show placeholders after successful save
        setGithubToken('••••••••••••••••••••••••••••••••');
        setGeminiApiKey('••••••••••••••••••••••••••••••••');
        
        return true;
      } else {
        const error = await response.json().catch(() => ({ message: 'Unknown error' }));
        addLine(`✗ Failed to save configuration: ${error.message}`, 'error');
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addLine(`✗ Failed to save configuration: ${errorMessage}`, 'error');
      return false;
    }
  }, [githubToken, geminiApiKey, addLine]);

  // Enhanced system health check with better error handling
  const checkSystemHealth = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/health');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      addLine(`System health check: ${data.status}`, 'success');
      addLine(`AI Model: ${data.aiModel || 'Unknown'}`, 'output');
      addLine(`GitHub API: ${data.github ? 'Configured' : 'Not configured'}`, 'output');
      addLine(`Gemini API: ${data.gemini ? 'Configured' : 'Not configured'}`, 'output');
      addLine(`Overall Status: ${data.configured ? 'Ready' : 'Configuration required'}`, 'output');
      
      // Allow proceeding if we have API keys (even if not fully configured)
      return data.github && data.gemini;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addLine(`System health check failed: ${errorMessage}`, 'error');
      return false;
    }
  }, [addLine]);

  // Enhanced SSE handling with better error recovery
  const runCyclesWithSSE = useCallback(async (
    owner: string, 
    repo: string, 
    cycles: number, 
    delaySeconds: number, 
    autoMergeEnabled: boolean
  ): Promise<void> => {
    const isHealthy = await checkSystemHealth();
    if (!isHealthy) {
      addLine('Cannot proceed with cycles due to system health issues.', 'error');
      return;
    }
    
    let currentBranch = 'main';
    let consecutiveErrors = 0;
    const maxConsecutiveErrors = 3;

    for (let i = 1; i <= cycles; i++) {
      setCurrentCycle(i);
      setTotalCycles(cycles);
      addLine(`--- Cycle ${i} starting on branch ${currentBranch} ---`, 'info');

      const url = `/api/enhance?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}&baseBranch=${encodeURIComponent(currentBranch)}&cycleNumber=${i}&autoMerge=${autoMergeEnabled}`;
      
      try {
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No response body');
        }

        const decoder = new TextDecoder();
        let buffer = '';
        let hasReceivedData = false;

        // Enhanced timeout handling
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), 300000); // 5 minutes
        });

        const readPromise = (async () => {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                hasReceivedData = true;
                try {
                  const data = JSON.parse(line.slice(6));
                  
                  if (data.type === 'info') addLine(data.message, 'output');
                  else if (data.type === 'success') addLine(data.message, 'success');
                  else if (data.type === 'error') {
                    addLine(data.message, 'error');
                    consecutiveErrors++;
                  } else if (data.type === 'stats') {
                    setCurrentStats(data.stats);
                    consecutiveErrors = 0; // Reset on successful stats
                  } else if (data.type === 'complete') {
                    currentBranch = data.newBranch;
                    addLine(`Cycle ${i} complete. New branch: ${currentBranch}`, 'success');
                    consecutiveErrors = 0;
                  }
                } catch (parseError) {
                  // Ignore JSON parse errors but log them
                  console.warn('JSON parse error:', parseError);
                }
              }
            }
          }
        })();

        await Promise.race([readPromise, timeoutPromise]);
        
        if (!hasReceivedData) {
          throw new Error('No data received from server');
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        addLine(`Cycle ${i} failed: ${errorMessage}`, 'error');
        
        consecutiveErrors++;
        if (consecutiveErrors >= maxConsecutiveErrors) {
          addLine(`Too many consecutive errors. Stopping enhancement process.`, 'error');
          break;
        }
      }

      // Enhanced delay with error recovery
      if (i < cycles && delaySeconds > 0) {
        addLine(`Waiting ${delaySeconds}s before next cycle...`, 'output');
        await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));
      }
    }

    addLine(`✅ All ${cycles} cycles finished.`, 'success');
    setIsRunning(false);
  }, [checkSystemHealth, addLine]);

  // Enhanced start cycles handler with better validation
  const handleStartCycles = useCallback(() => {
    const repoConfig = getRepositoryConfig();
    
    if (!repoConfig.isValid) {
      addLine('Error: Invalid repository format. Use owner/repo format or fill separate fields.', 'error');
      return;
    }
    
    if (cycleCount < MIN_CYCLES || cycleCount > MAX_CYCLES) {
      addLine(`Error: Number of cycles must be between ${MIN_CYCLES} and ${MAX_CYCLES}.`, 'error');
      return;
    }

    // Check configuration before starting
    const hasConfig = githubToken.trim() && geminiApiKey.trim();
    if (!hasConfig) {
      addLine('Error: Please configure GitHub token and Gemini API key first.', 'error');
      setShowConfig(true);
      return;
    }

    setIsRunning(true);
    clearLines();
    addLine(`Starting enhancement for repository: ${repoConfig.owner}/${repoConfig.repo}`, 'info');
    runCyclesWithSSE(repoConfig.owner, repoConfig.repo, cycleCount, cycleDelay, autoMerge);
  }, [
    getRepositoryConfig, 
    cycleCount, 
    cycleDelay, 
    autoMerge, 
    githubToken, 
    geminiApiKey, 
    setShowConfig,
    setIsRunning,
    clearLines,
    runCyclesWithSSE
  ]);

  // Memoized components for better performance
  const splashScreen = useMemo(() => (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
      <div className="text-center space-y-8 max-w-md mx-auto p-8">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent animate-pulse">
            Darlek Khan
          </h1>
          <div className="flex justify-center space-x-2">
            <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="text-xl text-gray-300">{splashStatus}</div>
          <Progress value={splashProgress} className="w-full h-2" />
          <div className="text-sm text-gray-400">{splashDetails}</div>
        </div>
      </div>
    </div>
  ), [splashStatus, splashProgress, splashDetails]);

  const mainApplication = useMemo(() => (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Darlek Khan
          </h1>
          <p className="text-gray-300">Autonomous code improvement powered by AI</p>
        </div>

        {/* System Info */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-blue-400">System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Status:</span>
                <Badge variant={systemInfo.initialized ? "default" : "secondary"} className="ml-2">
                  {systemInfo.initialized ? "Ready" : "Initializing"}
                </Badge>
              </div>
              <div>
                <span className="text-gray-400">AI Model:</span>
                <span className="ml-2 text-blue-400">{systemInfo.aiModel || 'Unknown'}</span>
              </div>
              <div>
                <span className="text-gray-400">GitHub API:</span>
                <span className={`ml-2 ${systemInfo.githubApiStatus === 'Connected' ? 'text-green-400' : 'text-yellow-400'}`}>
                  {systemInfo.githubApiStatus || 'Unknown'}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Configuration:</span>
                <span className={`ml-2 ${systemInfo.initialized ? 'text-green-400' : 'text-yellow-400'}`}>
                  {systemInfo.initialized ? 'Complete' : 'Required'}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Last Init:</span>
                <span className="ml-2 text-purple-400">{systemInfo.initTime || 'Never'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configuration Card */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-blue-400">API Configuration</CardTitle>
                <CardDescription>Configure your GitHub and Gemini API keys</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowConfig(!showConfig)}
                className="text-gray-400 border-gray-600"
              >
                {showConfig ? 'Hide' : 'Show'}
              </Button>
            </div>
          </CardHeader>
          {showConfig && (
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="githubToken">GitHub Personal Access Token</Label>
                <Input
                  id="githubToken"
                  type="password"
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  value={githubToken}
                  onChange={(e) => setGithubToken(e.target.value)}
                  className="bg-gray-700 border-gray-600"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Get your token at: github.com/settings/tokens (requires 'repo' scope)
                </p>
              </div>

              <div>
                <Label htmlFor="geminiApiKey">Gemini API Key</Label>
                <Input
                  id="geminiApiKey"
                  type="password"
                  placeholder="AIzaSy..."
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  className="bg-gray-700 border-gray-600"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Get your API key at: makersuite.google.com/app/apikey
                </p>
              </div>

              <div className="flex space-x-2">
                <Button 
                  onClick={saveConfiguration}
                  disabled={!githubToken.trim() || !geminiApiKey.trim()}
                  className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                >
                  {configSaved ? '✓ Configuration Saved' : 'Save Configuration'}
                </Button>
                <Button 
                  variant="outline"
                  onClick={checkSystemHealth}
                  className="text-gray-400 border-gray-600"
                >
                  Test
                </Button>
              </div>
            </CardContent>
          )}
        </Card>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Controls */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-blue-400">Enhancement Controls</CardTitle>
              <CardDescription>Configure your autonomous enhancement cycles (use separate fields or combined format)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Repository Input Section */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="repoInput">Repository (owner/repo)</Label>
                  <Input
                    id="repoInput"
                    placeholder="e.g., darlekkhan/example-repo"
                    value={repoInput}
                    onChange={(e) => handleRepoInputChange(e.target.value)}
                    className="bg-gray-700 border-gray-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="ownerInput">Repository Owner</Label>
                    <Input
                      id="ownerInput"
                      placeholder="e.g., darlekkhan"
                      value={ownerInput}
                      onChange={(e) => handleOwnerChange(e.target.value)}
                      className="bg-gray-700 border-gray-600"
                    />
                  </div>
                  <div>
                    <Label htmlFor="repoNameInput">Repository Name</Label>
                    <Input
                      id="repoNameInput"
                      placeholder="e.g., Hello-World"
                      value={repoNameInput}
                      onChange={(e) => handleRepoNameChange(e.target.value)}
                      className="bg-gray-700 border-gray-600"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="cycleCount">Number of Cycles</Label>
                <Input
                  id="cycleCount"
                  type="number"
                  min={MIN_CYCLES}
                  max={MAX_CYCLES}
                  value={cycleCount}
                  onChange={(e) => setCycleCount(parseInt(e.target.value) || MIN_CYCLES)}
                  className="bg-gray-700 border-gray-600"
                />
              </div>

              <div>
                <Label htmlFor="cycleDelay">Delay between cycles (seconds)</Label>
                <Input
                  id="cycleDelay"
                  type="number"
                  min="0"
                  value={cycleDelay}
                  onChange={(e) => setCycleDelay(parseInt(e.target.value) || 0)}
                  className="bg-gray-700 border-gray-600"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="autoMerge"
                  checked={autoMerge}
                  onCheckedChange={(checked) => setAutoMerge(checked as boolean)}
                />
                <Label htmlFor="autoMerge">Auto-create pull requests</Label>
              </div>

              <Button 
                onClick={handleStartCycles}
                disabled={isRunning || !repoInput.trim()}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {isRunning ? `Running Cycle ${currentCycle}/${totalCycles}` : 'Start Autonomous Cycles'}
              </Button>

              {/* Progress */}
              {isRunning && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{currentCycle}/{totalCycles}</span>
                  </div>
                  <Progress value={totalCycles > 0 ? (currentCycle / totalCycles) * 100 : 0} />
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Enhanced:</span>
                      <span className="ml-2 text-green-400">{currentStats.enhanced}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Skipped:</span>
                      <span className="ml-2 text-yellow-400">{currentStats.skipped}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Unchanged:</span>
                      <span className="ml-2 text-blue-400">{currentStats.unchanged}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Errors:</span>
                      <span className="ml-2 text-red-400">{currentStats.errors}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Terminal */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-blue-400">Terminal Output</CardTitle>
              <CardDescription>Real-time enhancement progress</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96 w-full rounded-md border border-gray-700 p-4 bg-black/50">
                <div className="font-mono text-sm space-y-1">
                  {terminalLines.length === 0 ? (
                    <div className="text-gray-500">Waiting for enhancement to start...</div>
                  ) : (
                    terminalLines.map((line) => (
                      <div key={line.id} className="flex items-start space-x-2">
                        <span className="text-gray-500 text-xs">
                          {line.timestamp.toLocaleTimeString()}
                        </span>
                        <span className={`flex-1 ${
                          line.type === 'error' ? 'text-red-400' :
                          line.type === 'success' ? 'text-green-400' :
                          line.type === 'info' ? 'text-blue-400' :
                          'text-gray-300'
                        }`}>
                          {line.message}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  ), [
    systemInfo, 
    showConfig, 
    githubToken, 
    geminiApiKey, 
    saveConfiguration, 
    checkSystemHealth, 
    terminalLines, 
    isRunning, 
    currentCycle, 
    totalCycles, 
    currentStats, 
    repoInput, 
    ownerInput, 
    repoNameInput, 
    handleOwnerChange, 
    handleRepoNameChange, 
    handleRepoInputChange, 
    cycleCount, 
    setCycleCount, 
    cycleDelay, 
    setCycleDelay, 
    autoMerge, 
    setAutoMerge, 
    handleStartCycles
  ]);

  return splashVisible ? splashScreen : mainApplication;
}