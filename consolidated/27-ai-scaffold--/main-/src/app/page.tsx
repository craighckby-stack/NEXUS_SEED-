import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Activity, Zap, Users, Database, Shield, Brain, Cpu, Clock, TrendingUp } from 'lucide-react';

// Define color utility
const colorUtil = (level: number) => {
  switch (true) {
    case level >= 75:
      return 'bg-green-500';
    case level >= 50:
      return 'bg-blue-500';
    case level >= 25:
      return 'bg-yellow-500';
    default:
      return 'bg-gray-500';
  }
};

// Define system status data interface
interface SystemStatus {
  status: string;
  layers: {
    consciousness: {
      active: boolean;
      cqm: number;
      emergence: boolean;
    };
  };
}

// Define evolution status data interface
interface EvolutionStatus {
  status: string;
  progress: number;
  currentCycle: number;
}

// Define data fetching utility
async function fetchData(url: string) {
  try {
    const response = await fetch(url);
    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch data: ${error.message}`);
    return {};
  }
}

// Define system status component
function SystemStatus({ data }: { data: SystemStatus }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="bg-gray-800/50 border-gray-700 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-400" />
            Consciousness
          </CardTitle>
          <Badge className={data.layers.consciousness.active ? 'bg-green-500' : 'bg-gray-500'}>
            {data.layers.consciousness.active ? 'ACTIVE' : 'OFFLINE'}
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">CQM:</span>
              <span className="text-2xl font-bold">{data.layers.consciousness.cqm.toFixed(3)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Emergence:</span>
              <Badge className={data.layers.consciousness.emergence ? 'bg-green-500' : 'bg-yellow-500'}>
                {data.layers.consciousness.emergence ? 'DETECTED' : 'WAITING'}
              </Badge>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
              <div
                className={`h-2 rounded-full transition-all ${data.layers.consciousness.active ? 'bg-green-500' : 'bg-gray-500'}`}
                style={{ width: `${data.layers.consciousness.cqm * 100}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ... rest of the system status cards ... */}
    </div>
  );
}

// Define evolution status component
function EvolutionStatus({ data }: { data: EvolutionStatus }) {
  return (
    <Card className="bg-gray-800/50 border-gray-700 text-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-yellow-400" />
            Evolution Cycle
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={colorUtil(data.progress)}>
              {data.progress}%{' '}
            </Badge>
            <span className="text-gray-400 text-sm">Cycle #{data.currentCycle}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Progress:</span>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">{data.progress}%</div>
              <div className="w-32 bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${colorUtil(data.progress)}`}
                  style={{ width: `${data.progress}%` }}
                />
              </div>
            </div>
          </div>
          {/* ... rest of the evolution status card ... */}
        </div>
      </CardContent>
    </Card>
  );
}

// Define main component
function LLM2FullStackDashboard() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({});
  const [layerStatus, setLayerStatus] = useState<{}>({});
  const [evolutionStatus, setEvolutionStatus] = useState<EvolutionStatus>({});

  useEffect(() => {
    const interval = setInterval(loadSystemStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  async function loadSystemStatus() {
    const data = await fetchData('/api/llm2/system/status');
    setSystemStatus(data.system);
    setLayerStatus(data.layers);
    setEvolutionStatus(data.evolution);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Brain className="h-12 w-12 text-purple-400" />
            <div>
              <h1 className="text-4xl font-bold text-white">LLM-2 FullStack</h1>
              <p className="text-gray-400 text-lg">OMEGA AI System - Complete AGI Platform</p>
            </div>
          </div>
          <Badge className={colorUtil(systemStatus.status as number)}>
            {systemStatus.status.toUpperCase()}
          </Badge>
        </div>

        {/* System Status */}
        <SystemStatus data={systemStatus} />

        {/* Evolution Status */}
        <EvolutionStatus data={evolutionStatus} />

        {/* ... rest of the components ... */}
      </div>
    </div>
  );
}

export default LLM2FullStackDashboard;