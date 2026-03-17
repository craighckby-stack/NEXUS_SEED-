'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { PlaceholderDashboard } from '@/components/PlaceholderDashboard';
import { ApiKeysConfig } from '@/components/ApiKeysConfig';
import { EvolutionEnhancer } from '@/system/evolution-enhancer';
import {
  phase1_GenerateQuestion,
  phase2_GetAnswer,
  phase3_Debate,
  phase4_Decision,
  phase5_Mutation,
  phase6_Commit,
  phase7_DeploymentMonitor,
  getRepositoryFiles,
  type EvolutionState,
  type PhaseContext,
  EvolutionPhase,
  PHASE_NAMES
} from '@/lib/evolution-service';
import type { Placeholder } from '@/system/placeholders';

type Speed = 'NORMAL' | 'FAST' | 'INSANE';
type EvolutionMode = 'RANDOM' | 'STRATEGIC' | 'HYBRID';
type LogLevel = 'info' | 'success' | 'warning' | 'error';

interface LogEntry {
  timestamp: string;
  message: string;
  level: LogLevel;
}

interface DebugInfo {
  githubTokenSet: boolean;
  apiKeySet: boolean;
  repoOwner: string;
  repoName: string;
  repository: string;
}

export default function EvolutionDashboard() {
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState<Speed>('NORMAL');
  const [evolutionMode, setEvolutionMode] = useState<EvolutionMode>('RANDOM');
  const [strategicWeight, setStrategicWeight] = useState(70);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [placeholderStats, setPlaceholderStats] = useState<any>(null);
  const [nextPlaceholder, setNextPlaceholder] = useState<Placeholder | null>(null);
  const [cycleCount, setCycleCount] = useState(0);
  const [lastCommit, setLastCommit] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<EvolutionPhase>('question');
  const [evolutionState, setEvolutionState] = useState<EvolutionState>({
    cycleNumber: 0,
    phase: 'question',
    phaseContext: { phase: 'question', startTime: Date.now() },
    isRunning: false
  });
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    githubTokenSet: false,
    apiKeySet: false,
    repoOwner: '',
    repoName: '',
    repository: ''
  });
  const [availableFiles, setAvailableFiles] = useState<string[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const evolutionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const enhancer = new EvolutionEnhancer({
    mode: evolutionMode,
    strategicWeight: strategicWeight / 100,
    fallbackToRandom: true
  });

  const speedSettings = {
    NORMAL: 60000,
    FAST: 10000,
    INSANE: 5000
  };

  useEffect(() => {
    fetchPlaceholderStats();
    fetchNextPlaceholder();
    fetchDebugInfo();
    loadSessionState();
  }, []);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  useEffect(() => {
    if (isRunning || cycleCount > 0) {
      saveSessionState();
    }
  }, [isRunning, cycleCount, currentPhase, evolutionState]);

  useEffect(() => {
    return () => {
      if (evolutionTimeoutRef.current) {
        clearTimeout(evolutionTimeoutRef.current);
      }
    };
  }, []);

  const fetchDebugInfo = async () => {
    const githubToken = localStorage?.getItem('GITHUB_TOKEN') || '';
    const apiKey = localStorage?.getItem('NEXT_PUBLIC_LLM_API_KEY') || '';
    const repoOwner = localStorage?.getItem('GITHUB_REPO_OWNER') || 'craighckby-stack';
    const repoName = localStorage?.getItem('GITHUB_REPO_NAME') || 'darlik-khan-v2';

    setDebugInfo({
      githubTokenSet: !!githubToken,
      apiKeySet: !!apiKey,
      repoOwner,
      repoName,
      repository: `${repoOwner}/${repoName}`
    });

    // Fetch available files
    try {
      const files = await getRepositoryFiles();
      setAvailableFiles(files);
      console.log('Available files for mutation:', files);
    } catch (error) {
      console.error('Failed to fetch repository files:', error);
    }
  };

  const saveSessionState = () => {
    const state = {
      cycleCount,
      lastCommit,
      evolutionMode,
      speed
    };
    localStorage.setItem('evolution-state', JSON.stringify(state));
  };

  const loadSessionState = () => {
    try {
      const saved = localStorage.getItem('evolution-state');
      if (saved) {
        const state = JSON.parse(saved);
        setCycleCount(state.cycleCount || 0);
        setLastCommit(state.lastCommit || '');
        setEvolutionMode(state.evolutionMode || 'RANDOM');
        setSpeed(state.speed || 'NORMAL');
      }
    } catch (error) {
      console.error('Failed to load session state:', error);
    }
  };

  const addLog = (message: string, level: LogLevel = 'info') => {
    const entry: LogEntry = {
      timestamp: new Date().toLocaleTimeString(),
      message,
      level
    };
    setLogs(prev => [...prev.slice(-199), entry]);
  };

  const fetchPlaceholderStats = async () => {
    try {
      const res = await fetch('/api/system/placeholders-route?action=stats');
      const data = await res.json();
      setPlaceholderStats(data);
    } catch (error) {
      addLog('Failed to fetch placeholder stats', 'error');
    }
  };

  const fetchNextPlaceholder = async () => {
    try {
      const res = await fetch('/api/system/placeholders-route?action=next');
      const data = await res.json();
      setNextPlaceholder(data);
    } catch (error) {
      addLog('Failed to fetch next placeholder', 'error');
    }
  };

  const handleStart = async () => {
    setIsRunning(true);
    addLog('🚀 Evolution system started', 'success');
    addLog(`🎯 Mode: ${evolutionMode}`, 'info');

    // Log debug info
    addLog(`🔍 GitHub Token: ${debugInfo.githubTokenSet ? 'SET' : 'NOT SET'}`, debugInfo.githubTokenSet ? 'info' : 'warning');
    addLog(`🔍 API Key: ${debugInfo.apiKeySet ? 'SET' : 'NOT SET'}`, debugInfo.apiKeySet ? 'info' : 'warning');
    addLog(`🔍 Repository: ${debugInfo.repository}`, 'info');
    addLog(`🔍 Available Files: ${availableFiles.length}`, 'info');

    if (!debugInfo.githubTokenSet) {
      addLog('❌ ERROR: GitHub token not set - Please add in API Keys tab', 'error');
      toast({
        title: 'Missing GitHub Token',
        description: 'Please add your GitHub token in the API Keys tab',
        variant: 'destructive'
      });
      setIsRunning(false);
      return;
    }

    if (!debugInfo.apiKeySet) {
      addLog('❌ ERROR: API key not set - Please add in API Keys tab', 'error');
      toast({
        title: 'Missing API Key',
        description: 'Please add your Gemini API key in the API Keys tab',
        variant: 'destructive'
      });
      setIsRunning(false);
      return;
    }

    if (availableFiles.length === 0) {
      addLog('❌ ERROR: No files available to mutate', 'error');
      toast({
        title: 'No Files Available',
        description: 'System cannot find any files to mutate',
        variant: 'destructive'
      });
      setIsRunning(false);
      return;
    }

    if (evolutionMode !== 'RANDOM') {
      addLog(`⚖️ Strategic weight: ${strategicWeight}%`, 'info');
      if (nextPlaceholder) {
        addLog(`📋 Next target: ${nextPlaceholder.title} (${nextPlaceholder.priority})`, 'info');
      }
    }

    toast({
      title: 'Evolution Started',
      description: `${evolutionMode} mode with ${speed} speed`,
    });

    await runEvolutionCycle();
  };

  const handleHalt = () => {
    setIsRunning(false);
    addLog('⏸️ Evolution system halted', 'warning');
    setCurrentPhase('question');
    toast({
      title: 'Evolution Halted',
      description: 'System stopped safely',
      variant: 'destructive'
    });
  };

  const runEvolutionCycle = async () => {
    try {
      // Phase 1: Generate Question
      setCurrentPhase('question');
      addLog(`📝 ${PHASE_NAMES.question}`, 'info');
      const phase1 = await phase1_GenerateQuestion(evolutionState.phaseContext);
      setEvolutionState({ ...evolutionState, ...phase1 });
      await new Promise(resolve => setTimeout(resolve, speedSettings[speed]));

      if (!isRunning) {
        addLog('⏸️ System halted during question phase', 'warning');
        return;
      }

      // Phase 2: Get AI Answer
      setCurrentPhase('answer');
      addLog(`🤖 ${PHASE_NAMES.answer}`, 'info');
      addLog(`🔍 Calling AI with API key length: ${debugInfo.apiKeySet ? (localStorage?.getItem('NEXT_PUBLIC_LLM_API_KEY')?.length || 0) : 0}`, 'info');
      const phase2 = await phase2_GetAnswer(evolutionState.phaseContext);
      setEvolutionState({ ...evolutionState, ...phase2 });
      await new Promise(resolve => setTimeout(resolve, speedSettings[speed]));

      if (!isRunning) {
        addLog('⏸️ System halted during answer phase', 'warning');
        return;
      }

      // Phase 3: PRO/CON Debate
      setCurrentPhase('debate');
      addLog(`⚖️ ${PHASE_NAMES.debate}`, 'info');
      const phase3 = await phase3_Debate(evolutionState.phaseContext);
      setEvolutionState({ ...evolutionState, ...phase3 });
      await new Promise(resolve => setTimeout(resolve, speedSettings[speed]));

      if (!isRunning) {
        addLog('⏸️ System halted during debate phase', 'warning');
        return;
      }

      // Phase 4: Decision Making
      setCurrentPhase('decision');
      addLog(`🎯 ${PHASE_NAMES.decision}`, 'info');
      const phase4 = await phase4_Decision(evolutionState.phaseContext);
      setEvolutionState({ ...evolutionState, ...phase4 });
      await new Promise(resolve => setTimeout(resolve, speedSettings[speed]));

      if (!isRunning) {
        addLog('⏸️ System halted during decision phase', 'warning');
        return;
      }

      // Check if should proceed
      if (!evolutionState.phaseContext.decision) {
        addLog('❌ Decision: NO-GO - skipping this cycle', 'warning');
        setCurrentPhase('question');
        return;
      }

      addLog('✅ Decision: GO - proceeding with evolution', 'success');

      // Select target (placeholder or random file)
      const enhancerDecision = enhancer.selectEvolutionTarget();
      addLog(`🎯 Target type: ${enhancerDecision.type}`, 'info');
      addLog(`📝 ${enhancerDecision.reason}`, 'info');

      let targetFile: string;
      let targetPlaceholder: Placeholder | undefined;

      if (enhancerDecision.type === 'PLACEHOLDER' && enhancerDecision.placeholder) {
        targetPlaceholder = enhancerDecision.placeholder;
        targetFile = targetPlaceholder.file;
        addLog(`📋 Target: ${targetPlaceholder.title}`, 'info');
      } else {
        if (availableFiles.length === 0) {
          addLog('❌ ERROR: No files available to mutate', 'error');
          setCurrentPhase('question');
          return;
        }
        targetFile = availableFiles[Math.floor(Math.random() * availableFiles.length)];
        addLog(`🎲 Random file: ${targetFile}`, 'info');
      }

      // Phase 5: Code Mutation
      setCurrentPhase('mutation');
      await new Promise(resolve => setTimeout(resolve, speedSettings[speed]));

      if (!isRunning) {
        addLog('⏸️ System halted during mutation phase', 'warning');
        return;
      }

      addLog(`🔍 Mutating file: ${targetFile}`, 'info');
      addLog(`🔍 Using placeholder: ${targetPlaceholder ? targetPlaceholder.id : 'NONE'}`, 'info');
      addLog(`🧬 ${PHASE_NAMES.mutation}`, 'info');
      const phase5 = await phase5_Mutation(evolutionState.phaseContext, targetFile, targetPlaceholder);
      setEvolutionState({ ...evolutionState, ...phase5 });
      await new Promise(resolve => setTimeout(resolve, speedSettings[speed]));

      if (!isRunning) {
        addLog('⏸️ System halted during mutation phase', 'warning');
        return;
      }

      // Check mutation result
      const mutationResult = evolutionState.phaseContext.mutationResult;
      if (!mutationResult?.success) {
        addLog(`❌ Mutation failed: ${mutationResult.error}`, 'error');
        setCurrentPhase('question');
        return;
      }

      addLog(`✅ Mutation successful`, 'success');

      // Phase 6: Commit to GitHub
      setCurrentPhase('commit');
      await new Promise(resolve => setTimeout(resolve, speedSettings[speed]));

      if (!isRunning) {
        addLog('⏸️ System halted during commit phase', 'warning');
        return;
      }

      addLog(`🔍 Committing with GitHub token: ${debugInfo.githubTokenSet ? 'SET (' + (localStorage?.getItem('GITHUB_TOKEN')?.length || 0) + ' chars)' : 'NOT SET'}`, debugInfo.githubTokenSet ? 'info' : 'warning');
      addLog(`🔍 Committing to repository: ${debugInfo.repository}`, 'info');
      addLog(`📤 ${PHASE_NAMES.commit}`, 'info');
      const commitMessage = targetPlaceholder
        ? `🎯 Filled placeholder: ${targetPlaceholder.title}\n\nPriority: ${targetPlaceholder.priority}\nCategory: ${targetPlaceholder.category}`
        : `🧬 Cycle #${cycleCount} - Mutated ${targetFile}`;

      const phase6 = await phase6_Commit(evolutionState.phaseContext, commitMessage);
      setEvolutionState({ ...evolutionState, ...phase6 });
      setLastCommit(evolutionState.phaseContext.commitSha || '');
      setCycleCount(prev => prev + 1);
      addLog(`✅ Commit: ${evolutionState.phaseContext.commitSha}`, 'success');
      await new Promise(resolve => setTimeout(resolve, speedSettings[speed]));

      if (!isRunning) {
        addLog('⏸️ System halted during commit phase', 'warning');
        return;
      }

      // Mark placeholder as filled if it was a placeholder
      if (targetPlaceholder) {
        try {
          addLog(`🔍 Marking placeholder as filled: ${targetPlaceholder.id}`, 'info');
          await fetch('/api/system/placeholders-route', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'mark-filled',
              placeholderId: targetPlaceholder.id
            })
          });
          addLog(`✅ Placeholder filled: ${targetPlaceholder.id}`, 'success');
          await fetchPlaceholderStats();
          await fetchNextPlaceholder();
        } catch (error) {
          addLog('❌ Failed to mark placeholder as filled', 'error');
        }
      }

      // Phase 7: Monitor Deployment
      setCurrentPhase('deployment');
      await new Promise(resolve => setTimeout(resolve, speedSettings[speed]));

      if (!isRunning) {
        addLog('⏸️ System halted during deployment phase', 'warning');
        return;
      }

      addLog(`🔍 Monitoring deployment for commit: ${evolutionState.phaseContext.commitSha}`, 'info');
      addLog(`🔄 ${PHASE_NAMES.deployment}`, 'info');
      const phase7 = await phase7_DeploymentMonitor(evolutionState.phaseContext, evolutionState.phaseContext.commitSha || '');
      setEvolutionState({ ...evolutionState, ...phase7 });
      await new Promise(resolve => setTimeout(resolve, speedSettings[speed]));

      // Check deployment result
      if (evolutionState.phaseContext.deploymentStatus === 'success') {
        addLog('✅ Deployment successful - refreshing page', 'success');
        toast({
          title: 'Deployment Complete',
          description: 'Page will refresh automatically',
        });
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else if (evolutionState.phaseContext.deploymentStatus === 'failed') {
        addLog('❌ Deployment failed', 'error');
        addLog('🔍 Check GitHub Actions for errors', 'info');
        setCurrentPhase('question');
      } else {
        addLog('⏳ Deployment still pending...', 'info');
        if (isRunning) {
          evolutionTimeoutRef.current = setTimeout(() => {
            if (isRunning) {
              runEvolutionCycle();
            }
          }, 60000);
        }
      }

    } catch (error) {
      addLog(`❌ Evolution cycle error: ${String(error)}`, 'error');
      addLog(`🔍 Error details: ${error instanceof Error ? error.message : String(error)}`, 'error');
      setCurrentPhase('question');
    }
  };

  const handleSync = async (syncType: 'FULL' | 'DAILY' | 'WEEKLY' | 'MONTHLY') => {
    setIsSyncing(true);
    addLog(`🔄 Starting ${syncType} knowledge sync...`, 'info');

    try {
      const res = await fetch('/api/system/sync-knowledge-route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          syncType,
          githubToken: localStorage.getItem('GITHUB_TOKEN') || '',
          knowledgeBaseUrl: '/api/knowledge'
        })
      });

      if (res.ok) {
        addLog(`✅ ${syncType} sync completed successfully`, 'success');
        toast({
          title: 'Sync Completed',
          description: `${syncType} knowledge base sync finished`,
        });
      } else {
        addLog('❌ Sync failed', 'error');
        toast({
          title: 'Sync Failed',
          description: 'Could not complete knowledge base sync',
          variant: 'destructive'
        });
      }
    } catch (error) {
      addLog('❌ Sync error: ' + String(error), 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRefreshDebug = () => {
    fetchDebugInfo();
    toast({
      title: 'Debug Info Refreshed',
      description: 'System status updated',
    });
  };

  const getLevelColor = (level: LogLevel) => {
    switch (level) {
      case 'success': return 'text-green-400';
      case 'warning': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      default: return 'text-blue-400';
    }
  };

  const getPhaseDescription = (phase: EvolutionPhase) => {
    switch (phase) {
      case 'question': return 'Generating technical question';
      case 'answer': return 'Getting AI answer';
      case 'debate': return 'Analyzing PRO/CON arguments';
      case 'decision': return 'Making GO/NO-GO decision';
      case 'mutation': return 'Mutating code with AI';
      case 'commit': return 'Committing to GitHub';
      case 'deployment': return 'Monitoring deployment';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="container mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img
              src="/logo.svg"
              alt="Darlik Khan AI"
              className="w-12 h-12"
            />
            <div>
              <h1 className="text-2xl font-bold">Darlik Khan AI</h1>
              <p className="text-sm text-gray-400">Autonomous Evolution System</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant={isRunning ? 'default' : 'secondary'}>
              {isRunning ? '● ACTIVE' : '○ IDLE'}
            </Badge>
            {isRunning && (
              <Badge variant="outline" className="animate-pulse">
                Cycle #{cycleCount}
              </Badge>
            )}
            {currentPhase && currentPhase !== 'question' && (
              <Badge variant="outline" className="ml-2">
                {PHASE_NAMES?.[currentPhase] || PHASE_NAMES.question}
              </Badge>
            )}
          </div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="dashboard" className="space-y-4">
          <TabsList className="grid w-full grid-cols-6 lg:w-[850px]">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="placeholders">Placeholders</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="api-keys">API Keys</TabsTrigger>
            <TabsTrigger value="debug">Debug</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {/* Control Card */}
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-lg">System Controls</CardTitle>
                  <CardDescription>Start or halt evolution</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {!isRunning ? (
                    <Button onClick={handleStart} className="w-full" size="lg">
                      🚀 Start Evolution
                    </Button>
                  ) : (
                    <Button onClick={handleHalt} variant="destructive" className="w-full" size="lg">
                      ⏸️ Halt System
                    </Button>
                  )}

                  <Separator />

                  <div className="space-y-2">
                    <label className="text-sm text-gray-400">Speed</label>
                    <Select value={speed} onValueChange={(v: any) => setSpeed(v)}>
                      <SelectTrigger className="bg-gray-700 border-gray-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-700 border-gray-600">
                        <SelectItem value="NORMAL">Normal (60s)</SelectItem>
                        <SelectItem value="FAST">Fast (10s)</SelectItem>
                        <SelectItem value="INSANE">Insane (5s)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Stats Card */}
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-lg">Evolution Stats</CardTitle>
                  <CardDescription>Current progress</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <p className="text-2xl font-bold">{cycleCount}</p>
                      <p className="text-xs text-gray-400">Cycles</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-2xl font-bold">
                        {placeholderStats ? Math.round((placeholderStats.filled / placeholderStats.total) * 100) : 0}%
                      </p>
                      <p className="text-xs text-gray-400">Complete</p>
                    </div>
                  </div>

                  {lastCommit && (
                    <div className="pt-2">
                      <p className="text-xs text-gray-400 mb-1">Last Commit</p>
                      <Badge variant="outline" className="font-mono text-xs">
                        {lastCommit}
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Current Phase Card */}
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-lg">Current Phase</CardTitle>
                  <CardDescription>7-phase evolution process</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="p-3 rounded-md bg-blue-900/20 border border-blue-800/30">
                      <p className="text-sm font-semibold mb-2">📋 {currentPhase && PHASE_NAMES?.[currentPhase] ? PHASE_NAMES[currentPhase] : 'Initializing...'}</p>
                      <p className="text-xs text-gray-300">
                        {getPhaseDescription(currentPhase)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Knowledge Sync Card */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg">Knowledge Base</CardTitle>
                <CardDescription>Sync from GitHub repos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => handleSync('FULL')}
                    disabled={isSyncing || isRunning}
                    variant="outline"
                    className="text-xs"
                  >
                    Full Sync
                  </Button>
                  <Button
                    onClick={() => handleSync('DAILY')}
                    disabled={isSyncing || isRunning}
                    variant="outline"
                    className="text-xs"
                  >
                    Daily
                  </Button>
                  <Button
                    onClick={() => handleSync('WEEKLY')}
                    disabled={isSyncing || isRunning}
                    variant="outline"
                    className="text-xs"
                  >
                    Weekly
                  </Button>
                  <Button
                    onClick={() => handleSync('MONTHLY')}
                    disabled={isSyncing || isRunning}
                    variant="outline"
                    className="text-xs"
                  >
                    Monthly
                  </Button>
                </div>
                {isSyncing && (
                  <div className="text-center text-sm text-blue-400 animate-pulse">
                    🔄 Syncing...
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Placeholders Tab */}
          <TabsContent value="placeholders">
            <PlaceholderDashboard />
          </TabsContent>

          {/* Logs Tab */}
          <TabsContent value="logs">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Evolution Logs</CardTitle>
                    <CardDescription>Real-time system activity</CardDescription>
                  </div>
                  <Button
                    onClick={() => setLogs([])}
                    variant="outline"
                    size="sm"
                  >
                    Clear
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px] rounded-md bg-gray-900/50 p-4">
                  <div className="font-mono text-sm space-y-1">
                    {logs.length === 0 ? (
                      <p className="text-center text-gray-400 py-8">No logs yet</p>
                    ) : (
                      logs.map((log, index) => (
                        <div key={index} className="flex gap-2">
                          <span className="text-gray-500 shrink-0">{log.timestamp}</span>
                          <span className={getLevelColor(log.level)}>{log.message}</span>
                        </div>
                      ))
                    )}
                    <div ref={logsEndRef} />
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle>Evolution Mode</CardTitle>
                <CardDescription>Configure how to system evolves</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <label className="text-sm text-gray-400">Mode</label>
                  <Select value={evolutionMode} onValueChange={(v: any) => setEvolutionMode(v)}>
                    <SelectTrigger className="bg-gray-700 border-gray-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      <SelectItem value="RANDOM">
                        <div className="flex flex-col gap-1">
                          <span className="font-semibold">RANDOM</span>
                          <span className="text-xs text-gray-400">Random file mutation (original behavior)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="HYBRID">
                        <div className="flex flex-col gap-1">
                          <span className="font-semibold">HYBRID</span>
                          <span className="text-xs text-gray-400">Mix of strategic and random</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="STRATEGIC">
                        <div className="flex flex-col gap-1">
                          <span className="font-semibold">STRATEGIC</span>
                          <span className="text-xs text-gray-400">Placeholder-driven evolution only</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {evolutionMode === 'HYBRID' && (
                  <div className="space-y-2">
                    <label className="text-sm text-gray-400">
                      Strategic Weight: {strategicWeight}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={strategicWeight}
                      onChange={(e) => setStrategicWeight(Number(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>0% Random</span>
                      <span>100% Strategic</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between p-3 rounded-md bg-gray-700/50">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold">Fallback to Random</p>
                    <p className="text-xs text-gray-400">Use random if no placeholders</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>

            <Separator />

            <div className="p-4 rounded-md bg-blue-900/20 border border-blue-800/30">
              <p className="text-sm font-semibold mb-2">💡 Evolution Phases</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-300">
                <div><strong className="text-blue-400">Phase 1:</strong> Question Generation</div>
                <div><strong className="text-blue-400">Phase 2:</strong> AI Answer</div>
                <div><strong className="text-blue-400">Phase 3:</strong> PRO/CON Debate</div>
                <div><strong className="text-blue-400">Phase 4:</strong> Decision Making</div>
                <div><strong className="text-blue-400">Phase 5:</strong> Code Mutation</div>
                <div><strong className="text-blue-400">Phase 6:</strong> Commit to GitHub</div>
                <div><strong className="text-blue-400">Phase 7:</strong> Deployment Monitor</div>
              </div>
            </div>
          </TabsContent>

          {/* API Keys Tab */}
          <TabsContent value="api-keys">
            <ApiKeysConfig />
          </TabsContent>

          {/* Debug Tab (NEW!) */}
          <TabsContent value="debug" className="space-y-4">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">System Debug Information</CardTitle>
                    <CardDescription>View exactly what's happening</CardDescription>
                  </div>
                  <Button
                    onClick={handleRefreshDebug}
                    variant="outline"
                    size="sm"
                  >
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Environment Variables */}
                <div className="space-y-2">
                  <h3 className="text-base font-semibold mb-2">🔍 Environment Variables</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-md bg-gray-700/50">
                      <p className="text-xs text-gray-400 mb-1">GitHub Token</p>
                      <div className="flex items-center gap-2">
                        <Badge variant={debugInfo.githubTokenSet ? 'default' : 'destructive'}>
                          {debugInfo.githubTokenSet ? '✅ SET' : '❌ NOT SET'}
                        </Badge>
                        <span className="text-xs text-gray-400">
                          ({debugInfo.githubTokenSet ? (localStorage.getItem('GITHUB_TOKEN')?.length || 0) : 0} chars)
                        </span>
                      </div>
                    </div>

                    <div className="p-3 rounded-md bg-gray-700/50">
                      <p className="text-xs text-gray-400 mb-1">API Key</p>
                      <div className="flex items-center gap-2">
                        <Badge variant={debugInfo.apiKeySet ? 'default' : 'destructive'}>
                          {debugInfo.apiKeySet ? '✅ SET' : '❌ NOT SET'}
                        </Badge>
                        <span className="text-xs text-gray-400">
                          ({debugInfo.apiKeySet ? (localStorage.getItem('NEXT_PUBLIC_LLM_API_KEY')?.length || 0) : 0} chars)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Repository Settings */}
                <div className="space-y-2">
                  <h3 className="text-base font-semibold mb-2">🔧 Repository Settings</h3>
                  <div className="p-3 rounded-md bg-gray-700/50">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <p className="text-xs text-gray-400">Repository Owner</p>
                        <p className="text-sm font-mono">{debugInfo.repoOwner}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-gray-400">Repository Name</p>
                        <p className="text-sm font-mono">{debugInfo.repoName}</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      Full: <span className="font-mono">{debugInfo.repository}</span>
                    </p>
                  </div>
                </div>

                {/* Available Files */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold">📂 Available Files</h3>
                    <Badge variant={availableFiles.length > 0 ? 'default' : 'destructive'}>
                      {availableFiles.length} files
                    </Badge>
                  </div>
                  {availableFiles.length > 0 && (
                    <Button
                      onClick={handleRefreshDebug}
                      variant="outline"
                      size="sm"
                    >
                      Refresh List
                    </Button>
                  )}
                </div>
                  {availableFiles.length === 0 ? (
                    <div className="p-3 rounded-md bg-red-900/20 border border-red-800/30">
                      <p className="text-sm text-red-300 mb-1">❌ No files available</p>
                      <p className="text-xs text-gray-400">System cannot find any files to mutate</p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[200px] rounded-md bg-gray-900/50 p-3">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs font-mono">
                        {availableFiles.map((file, index) => (
                          <div key={index} className="text-gray-300">
                            {file}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </div>

                {/* Next Target */}
                {nextPlaceholder && (
                  <div className="space-y-2">
                    <h3 className="text-base font-semibold mb-2">🎯 Next Target (Placeholder)</h3>
                    <div className="p-3 rounded-md bg-blue-900/20 border border-blue-800/30">
                      <p className="text-sm font-semibold">{nextPlaceholder.title}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline">{nextPlaceholder.priority}</Badge>
                        <Badge variant="outline">{nextPlaceholder.category}</Badge>
                        <span className="text-xs text-gray-400">{nextPlaceholder.file}</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <footer className="mt-8 pt-6 border-t border-gray-700 text-center text-sm text-gray-400">
          <p>Created by Craig Huckerby • Powered by Z.ai • Next.js 15</p>
          <p className="text-xs mt-1">
            Mode: {evolutionMode} • Speed: {speed} • {currentPhase && PHASE_NAMES?.[currentPhase]} || 'Initializing...'} • {placeholderStats && `${placeholderStats.filled}/${placeholderStats.total} placeholders`}
          </p>
        </footer>
      </div>
    </div>
  );
}
