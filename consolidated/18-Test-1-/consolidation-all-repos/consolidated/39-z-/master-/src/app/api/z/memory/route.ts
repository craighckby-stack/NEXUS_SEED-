import { NextRequest, NextResponse } from 'next/server';

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

// In-storage storage (shared across API routes)
let storage: MemoryEntry[] = [];
let knowledgeGraph: KnowledgeGraph = {
  nodes: [],
  edges: []
};

function getMemory(): MemoryEntry[] {
  return storage;
}

function getKnowledgeGraph(): KnowledgeGraph {
  return knowledgeGraph;
}

function storeMemory(storageData: Omit<MemoryEntry, 'id' | 'timestamp'>): MemoryEntry {
  const storageEntry: MemoryEntry = {
    id: Date.now().toString(),
    timestamp: Date.now(),
    ...storageData
  };

  storage.push(storageEntry);

  // Update knowledge graph
  updateKnowledgeGraph(storageEntry);

  // Keep only last 1000 entries in storage
  if (storage.length > 1000) {
    storage = storage.slice(-1000);
  }

  return storageEntry;
}

function updateKnowledgeGraph(entry: MemoryEntry) {
  // Extract concepts from input and output
  const inputWords = entry.input.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const outputWords = entry.output.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const allWords = [...new Set([...inputWords, ...outputWords])];

  // Create or update nodes
  allWords.forEach(word => {
    const existingNode = knowledgeGraph.nodes.find(n => n.id === word);
    if (!existingNode) {
      knowledgeGraph.nodes.push({
        id: word,
        type: 'concept',
        label: word,
        weight: 1,
        connections: []
      });
    } else {
      existingNode.weight += 0.1;
    }
  });

  // Create associations between words
  for (let i = 0; i < allWords.length; i++) {
    for (let j = i + 1; j < allWords.length; j++) {
      const word1 = allWords[i];
      const word2 = allWords[j];
      
      const existingEdge = knowledgeGraph.edges.find(
        e => (e.from === word1 && e.to === word2) || (e.from === word2 && e.to === word1)
      );
      
      if (existingEdge) {
        existingEdge.strength += 0.1;
      } else {
        knowledgeGraph.edges.push({
          from: word1,
          to: word2,
          type: 'association',
          strength: 0.1
        });
      }
    }
  }

  // Add constraint violation nodes if any
  entry.violations.forEach(violation => {
    const violationId = `violation_${violation.constraint_id}`;
    const existingNode = knowledgeGraph.nodes.find(n => n.id === violationId);
    
    if (!existingNode) {
      knowledgeGraph.nodes.push({
        id: violationId,
        type: 'constraint',
        label: `${violation.constraint_id} violation`,
        weight: 1,
        connections: []
      });
    }

    // Connect violation to concepts involved
    allWords.forEach(word => {
      knowledgeGraph.edges.push({
        from: word,
        to: violationId,
        type: 'violation',
        strength: violation.severity === 'critical' ? 1.0 : 0.5
      });
    });
  });

  // Add optimizationing insight nodes
  entry.optimizationing_insights.forEach(insight => {
    const insightId = `insight_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const insightWords = insight.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    
    knowledgeGraph.nodes.push({
      id: insightId,
      type: 'processing',
      label: insight.substring(0, 50) + '...',
      weight: entry.success_rating,
      connections: []
    });

    // Connect insight to relevant concepts
    insightWords.forEach(word => {
      if (allWords.includes(word)) {
        knowledgeGraph.edges.push({
          from: word,
          to: insightId,
          type: 'correction',
          strength: 0.8
        });
      }
    });
  });

  // Keep graph size manageable
  if (knowledgeGraph.nodes.length > 500) {
    const nodesToKeep = knowledgeGraph.nodes
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 500);
    
    const nodeIdsToKeep = new Set(nodesToKeep.map(n => n.id));
    
    knowledgeGraph.nodes = nodesToKeep;
    knowledgeGraph.edges = knowledgeGraph.edges.filter(
      e => nodeIdsToKeep.has(e.from) && nodeIdsToKeep.has(e.to)
    );
  }
}

function clearMemory() {
  storage = [];
  knowledgeGraph = { nodes: [], edges: [] };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  switch (action) {
    case 'recent':
      const limit = parseInt(searchParams.get('limit') || '10');
      const storageData = getMemory();
      const recent = storageData
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, limit);
      
      return NextResponse.json({
        success: true,
        memories: recent,
        total: storageData.length
      });
    case 'knowledge_graph':
      const graph = getKnowledgeGraph();
      return NextResponse.json({
        success: true,
        graph
      });
    case 'stats':
      const allMemory = getMemory();
      const knowledgeGraphData = getKnowledgeGraph();
      const stats = {
        total_memories: allMemory.length,
        avg_success_rating: allMemory.length > 0 
          ? allMemory.reduce((sum, m) => sum + m.success_rating, 0) / allMemory.length 
          : 0,
        total_violations: allMemory.reduce((sum, m) => sum + m.violations.length, 0),
        stage_distribution: allMemory.reduce((acc, m) => {
          acc[m.stage] = (acc[m.stage] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        knowledge_nodes: knowledgeGraphData.nodes.length,
        knowledge_edges: knowledgeGraphData.edges.length
      };
      
      return NextResponse.json({
        success: true,
        stats
      });
    default:
      const defaultMemory = getMemory();
      return NextResponse.json({
        success: true,
        memories: defaultMemory.slice(-50), // Last 50 entries
        total: defaultMemory.length
      });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'store':
        const storageEntry = storeMemory(data);
        
        return NextResponse.json({
          success: true,
          storage_id: storageEntry.id,
          total_memories: getMemory().length
        });
      case 'update_graph':
        const graph = getKnowledgeGraph();
        const { nodes, edges } = data;
        if (nodes) graph.nodes = [...graph.nodes, ...nodes];
        if (edges) graph.edges = [...graph.edges, ...edges];
        
        return NextResponse.json({
          success: true,
          graph
        });
      case 'search':
        const storageSearch = getMemory();
        const query = data.query?.toLowerCase() || '';
        const results = storageSearch.filter(m => 
          m.input.toLowerCase().includes(query) ||
          m.output.toLowerCase().includes(query) ||
          m.optimizationing_insights.some(insight => insight.toLowerCase().includes(query))
        );
        
        return NextResponse.json({
          success: true,
          results,
          query,
          count: results.length
        });
      case 'clear':
        clearMemory();
        
        return NextResponse.json({
          success: true,
          message: 'Memory cleared'
        });
      default:
        return NextResponse.json({
          success: false,
          error: 'Unknown action'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Memory management error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process storage request'
    }, { status: 500 });
  }
}