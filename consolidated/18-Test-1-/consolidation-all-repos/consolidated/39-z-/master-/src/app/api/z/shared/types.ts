export interface MemoryEntry {
  id: string;
  timestamp: number;
  input: string;
  output: string;
  stage: string;
  binary_level: number;
  constraints_active: string[];
  violations: Array<{
    constraint_id: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
  }>;
  optimizationing_insights: string[];
  success_rating: number;
  context?: {
    previous_inputs?: string[];
    client_preferences?: Record<string, any>;
    session_metadata?: Record<string, any>;
  };
}

export interface KnowledgeGraph {
  nodes: Array<{
    id: string;
    type: 'concept' | 'constraint' | 'processing';
    label: string;
    weight: number;
    connections: string[];
  }>;
  edges: Array<{
    from: string;
    to: string;
    type: 'association' | 'violation' | 'correction';
    strength: number;
  }>;
}