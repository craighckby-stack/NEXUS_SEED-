// src/lib/agents/agent-registry.ts

// Type definitions
export interface AgentConfig {
  id: string;
  name: string;
  domain: string;
  expertise: string[];
  capabilities: string[];
  version: string;
}

export interface Agent {
  id: string;
  config: AgentConfig;
  status: 'ACTIVE' | 'INACTIVE' | 'ERROR';
  metrics: {
    totalTasks: number;
    successfulTasks: number;
    avgResponseTime: number;
  };
}

export interface Task {
  id: string;
  domain: string;
  query: string;
  priority: number;
  timestamp: number;
}

export interface AgentResult {
  agentId: string;
  response: string;
  confidence: number;
  reasoning: string;
  duration: number;
  errors: string[];
}

export interface SynthesisResult {
  queryId: string;
  agentResults: AgentResult[];
  synthesizedOutput: string;
  confidence: number;
}

// Agent registry
export const AGENT_REGISTRY: Record<string, AgentConfig> = {
  // Scientific Division
  'theoretical-chemist': {
    id: 'theoretical-chemist',
    name: 'Theoretical Chemist',
    domain: 'Chemistry',
    expertise: ['molecular-structure', 'quantum-behavior', 'chemical-systems'],
    capabilities: ['analysis', 'simulation', 'prediction'],
    version: '1.0.0'
  },
  // ... other agents
};

// Function to get a single agent config
export function getAgentConfig(agentId: string): AgentConfig | undefined {
  return AGENT_REGISTRY[agentId];
};

// Function to get all agent configs
export function getAllAgentConfigs(): AgentConfig[] {
  return Object.values(AGENT_REGISTRY);
};

// Function to get agents by domain
export function getAgentsByDomain(domain: string): AgentConfig[] {
  return Object.values(AGENT_REGISTRY).filter(
    agent => agent.domain === domain
  );
};
```

**