import { MemoryEntry, KnowledgeGraph } from './types';

// In-storage storage (shared across API routes)
let storage: MemoryEntry[] = [];
let knowledgeGraph: KnowledgeGraph = {
  nodes: [],
  edges: []
};

export function getMemory(): MemoryEntry[] {
  return storage;
}

export function getKnowledgeGraph(): KnowledgeGraph {
  return knowledgeGraph;
}

export function storeMemory(storageData: Omit<MemoryEntry, 'id' | 'timestamp'>): MemoryEntry {
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

export function updateKnowledgeGraph(entry: MemoryEntry) {
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

export function clearMemory() {
  storage = [];
  knowledgeGraph = { nodes: [], edges: [] };
}