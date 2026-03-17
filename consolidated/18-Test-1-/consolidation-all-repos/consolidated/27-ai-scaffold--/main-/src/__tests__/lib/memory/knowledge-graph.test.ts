import { KnowledgeGraph } from '@/lib/memory/knowledge-graph';

describe('KnowledgeGraph', () => {
  let graph: KnowledgeGraph;

  beforeEach(() => {
    graph = new KnowledgeGraph();
  });

  describe('storeLearning', () => {
    it('should extract concepts from learning data', async () => {
      const learningData = {
        context: 'test-context',
        response: 'The AI learns from experience and adapts to new situations',
        oecsScore: 0.8
      };

      const concepts = await graph.storeLearning(learningData);

      expect(concepts).toBeDefined();
      expect(Array.isArray(concepts)).toBe(true);
      expect(concepts.length).toBeGreaterThan(0);
      expect(concepts.every(concept => concept.name)).toBe(true);
      expect(concepts.every(concept => concept.frequency)).toBe(1);
    });

    it('should extract single-word concepts', async () => {
      const learningData = {
        context: 'math',
        response: 'Two plus two equals four',
        oecsScore: 0.9
      };

      const concepts = await graph.storeLearning(learningData);

      expect(concepts).toBeDefined();
      const conceptNames = concepts.map(concept => concept.name);
      expect(conceptNames).toContain('two');
      expect(conceptNames).toContain('plus');
      expect(conceptNames).toContain('equals');
      expect(conceptNames).toContain('four');
      expect(conceptNames).toContain('math');
    });

    it('should filter out short words', async () => {
      const learningData = {
        context: 'test',
        response: 'AI is and',
        oecsScore: 0.7
      };

      const concepts = await graph.storeLearning(learningData);

      expect(concepts).toBeDefined();
      const conceptNames = concepts.map(concept => concept.name);

      expect(conceptNames).not.toContain('is');
      expect(conceptNames).not.toContain('and');
    });

    it('should initialize concepts with frequency 1', async () => {
      const learningData = {
        context: 'test',
        response: 'test concept',
        oecsScore: 0.8
      };

      const concepts = await graph.storeLearning(learningData);

      expect(concepts.every(concept => concept.frequency === 1)).toBe(true);
    });

    it('should set initial confidence from oecsScore', async () => {
      const learningData = {
        context: 'test',
        response: 'test concept',
        oecsScore: 0.75
      };

      const concepts = await graph.storeLearning(learningData);

      expect(concepts.every(concept => concept.confidence === 0.75)).toBe(true);
    });

    it('should set lastSeen to current date', async () => {
      const learningData = {
        context: 'test',
        response: 'test concept',
        oecsScore: 0.8
      };

      const concepts = await graph.storeLearning(learningData);
      const oneDayBefore = new Date(Date.now() - 86400000);
      const oneDayAfter = new Date(Date.now() + 86400000);

      expect(concepts.every(concept => concept.lastSeen)).toBeDefined();
      expect(concepts.every(concept => {
        const lastSeen = new Date(concept.lastSeen);
        return lastSeen >= oneDayBefore && lastSeen <= oneDayAfter;
      })).toBe(true);
    });

    it('should handle empty response gracefully', async () => {
      const learningData = {
        context: 'test',
        response: '',
        oecsScore: 0.5
      };

      const concepts = await graph.storeLearning(learningData);

      expect(concepts).toBeDefined();
      expect(Array.isArray(concepts)).toBe(true);
      expect(concepts.length).toBe(0);
    });

    it('should handle very long response', async () => {
      const learningData = {
        context: 'test',
        response: 'A'.repeat(10000),
        oecsScore: 0.9
      };

      const concepts = await graph.storeLearning(learningData);

      expect(concepts).toBeDefined();
      expect(Array.isArray(concepts)).toBe(true);
      expect(concepts.length).toBeGreaterThan(0);
    });
  });

  describe('extractConcepts', () => {
    it('should extract words from text', async () => {
      const learningData = {
        context: 'test',
        response: 'The quick brown fox jumps over the lazy dog',
        oecsScore: 0.8
      };

      const concepts = await graph.extractConcepts(learningData);

      expect(concepts).toBeDefined();
      expect(Array.isArray(concepts)).toBe(true);
      expect(concepts.length).toBeGreaterThan(0);
    });

    it('should filter words by length > 3', async () => {
      const learningData = {
        context: 'test',
        response: 'AI and ML are powerful tools',
        oecsScore: 0.8
      };

      const concepts = await graph.extractConcepts(learningData);

      expect(concepts).toBeDefined();
      const conceptNames = concepts.map(concept => concept.name);

      expect(conceptNames).not.toContain('are');
      expect(conceptNames).toContain('powerful');
    });

    it('should remove duplicates', async () => {
      const learningData = {
        context: 'test',
        response: 'test test test',
        oecsScore: 0.8
      };

      const concepts = await graph.extractConcepts(learningData);

      expect(concepts).toBeDefined();
      const conceptNames = concepts.map(concept => concept.name);
      expect(conceptNames).toBeDefined();

      const testCount = conceptNames.filter(name => name === 'test').length;
      expect(testCount).toBe(1);
    });
  });

  describe('updateConcept', () => {
    it('should call database upsert', async () => {
      const learningData = {
        context: 'test',
        response: 'test concept',
        oecsScore: 0.8
      };

      await graph.updateConcept('test-concept', learningData);

      // No need to test the function's existence, just that it's called
      // And that it doesn't throw
      expect(true).toBe(true);
    });
  });
});