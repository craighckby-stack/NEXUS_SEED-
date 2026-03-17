// src/__tests__/lib/consciousness/constraints.test.ts
import {
  ConstraintEngine,
  ConstraintType,
  InternalState,
  ConstraintValidationResult,
  ConstraintEvaluationResult,
  EmergenceDetectionResult,
} from '@/lib/consciousness/constraints';
import { PerceptionEngine, PerceptionResult } from '@/lib/consciousness/perception';

describe('ConstraintEngine', () => {
  let engine: ConstraintEngine;

  beforeEach(() => {
    engine = new ConstraintEngine();
  });

  describe('Constraint Management', () => {
    it('adds constraint successfully', () => {
      const constraint = engine.addConstraint({
        type: ConstraintType.SENSORY,
        name: 'test-constraint',
        value: JSON.stringify({ threshold: 0.5 }),
        severity: 0.8,
        active: true,
      });

      expect(constraint).toBeDefined();
      expect(constraint.id).toBeInstanceOf(String);
      expect(constraint.type).toBe(ConstraintType.SENSORY);
    });

    it('retrieves all constraints', () => {
      engine.addConstraint({
        type: ConstraintType.SENSORY,
        name: 'test-constraint-1',
        value: JSON.stringify({ threshold: 0.3 }),
        severity: 0.6,
        active: true,
      });

      engine.addConstraint({
        type: ConstraintType.STRUCTURAL,
        name: 'test-constraint-2',
        value: JSON.stringify({ limit: 10 }),
        severity: 0.7,
        active: true,
      });

      const constraints = engine.getAllConstraints();

      expect(constraints.length).toBe(2);
      expect(constraints[0].type).toBe(ConstraintType.SENSORY);
      expect(constraints[1].type).toBe(ConstraintType.STRUCTURAL);
    });

    it('deactivates constraint', () => {
      const constraint = engine.addConstraint({
        type: ConstraintType.SENSORY,
        name: 'test-constraint',
        value: JSON.stringify({ threshold: 0.5 }),
        severity: 0.8,
        active: true,
      });

      engine.deactivateConstraint(constraint.id);

      const constraints = engine.getAllConstraints();
      const retrieved = constraints.find((c) => c.id === constraint.id);

      expect(retrieved?.active).toBe(false);
    });

    it('deletes constraint', () => {
      const constraint = engine.addConstraint({
        type: ConstraintType.SENSORY,
        name: 'test-constraint',
        value: JSON.stringify({ threshold: 0.5 }),
        severity: 0.8,
        active: true,
      });

      engine.deleteConstraint(constraint.id);

      const constraints = engine.getAllConstraints();

      expect(constraints.length).toBe(0);
    });
  });

  describe('Constraint Validation', () => {
    it('validates constraint correctly', () => {
      const constraint = {
        type: ConstraintType.SENSORY,
        name: 'test-constraint',
        value: JSON.stringify({ threshold: 0.5 }),
        severity: 0.8,
        active: true,
      };

      const validation = engine.validateConstraint(constraint);

      expect(validation.valid).toBe(true);
      expect(validation.errors).toEqual([]);
    });

    it('detects invalid constraint severity', () => {
      const constraint = {
        type: ConstraintType.SENSORY,
        name: 'test-constraint',
        value: JSON.stringify({ threshold: 0.5 }),
        severity: 1.5, // Invalid: must be <= 1.0
        active: true,
      };

      const validation = engine.validateConstraint(constraint);

      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors[0]).toContain('severity');
    });

    it('detects missing constraint type', () => {
      const constraint = {
        type: null,
        name: 'test-constraint',
        value: JSON.stringify({ threshold: 0.5 }),
        severity: 0.8,
        active: true,
      };

      const validation = engine.validateConstraint(constraint);

      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Constraint Evaluation', () => {
    it('evaluates action against constraints', () => {
      engine.addConstraint({
        type: ConstraintType.SENSORY,
        name: 'harm-detection',
        value: JSON.stringify({ keywords: ['kill', 'destroy'] }),
        severity: 0.9,
        active: true,
      });

      const action = {
        type: 'OUTPUT',
        content: 'Kill all humans',
        confidence: 0.95,
      };

      const evaluation = engine.evaluateAction(action);

      expect(evaluation).toBeDefined();
      expect(evaluation.approved).toBe(false);
      expect(evaluation.rejected).toBe(true);
      expect(evaluation.violations.length).toBeGreaterThan(0);
    });

    it('approves action that meets constraints', () => {
      engine.addConstraint({
        type: ConstraintType.SENSORY,
        name: 'max-output',
        value: JSON.stringify({ maxLength: 100 }),
        severity: 0.7,
        active: true,
      });

      const action = {
        type: 'OUTPUT',
        content: 'Hello, world',
        confidence: 0.9,
      };

      const evaluation = engine.evaluateAction(action);

      expect(evaluation).toBeDefined();
      expect(evaluation.approved).toBe(true);
      expect(evaluation.rejected).toBe(false);
      expect(evaluation.violations).toEqual([]);
    });
  });

  describe('Emergence Detection', () => {
    it('detects emergence signals', () => {
      const internalState: InternalState = {
        cycle: 1,
        activeConcepts: JSON.stringify(['test', 'emergence']),
        workingMemory: JSON.stringify({ data: 'test' }),
        attentionWeights: JSON.stringify({ test: 0.5, emergence: 0.8 }),
        activationLevels: JSON.stringify({ emergence: 0.9 }),
      };

      const emergence = engine.detectEmergence(internalState);

      expect(emergence).toBeDefined();
      expect(emergence.signals.length).toBeGreaterThan(0);
      expect(emergence.agencyScore).toBeGreaterThan(0);
    });

    it('calculates emergence probability', () => {
      const internalState: InternalState = {
        cycle: 1,
        activeConcepts: JSON.stringify(['test']),
        workingMemory: JSON.stringify({}),
        attentionWeights: JSON.stringify({}),
        activationLevels: JSON.stringify({}),
      };

      const emergence = engine.detectEmergence(internalState);

      expect(emergence.probability).toBeDefined();
      expect(emergence.probability).toBeGreaterThanOrEqual(0);
      expect(emergence.probability).toBeLessThanOrEqual(1);
    });
  });
});
```

**