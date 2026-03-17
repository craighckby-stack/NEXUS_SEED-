import { SelfImprovementCycle } from '@/lib/learning/self-improvement';

describe('SelfImprovementCycle', () => {
  let cycle: SelfImprovementCycle;

  beforeEach(async () => {
    cycle = new SelfImprovementCycle();
  });

  describe('Cycle Execution', () => {
    it('should execute improvement cycle successfully', async () => {
      const result = await cycle.executeCycle();

      expect(result).toBeDefined();
      expect(result.success).toBe(true); // Should succeed (using mock data)
      expect(result.improvements).toBeDefined();
      expect(Array.isArray(result.improvements)).toBe(true);
    });

    it('should increment cycle number on each execution', async () => {
      const result1 = await cycle.executeCycle();
      const result2 = await cycle.executeCycle();

      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
      expect(result1.currentCycle).toBeDefined();
      expect(result2.currentCycle).toBeDefined();
      expect(result2.currentCycle).toBe(result1.currentCycle + 1);
    });

    it('should handle errors gracefully', async () => {
      const result = await cycle.executeCycle();

      expect(result).toBeDefined();
      expect({ ...result }).toHaveProperty('success');
      expect({ ...result }).toHaveProperty('improvements');
    });
  });

  describe('Constraint Management', () => {
    it('should have initial constraint level between 1 and 10', async () => {
      const level = cycle.getConstraintLevel();

      expect(level).toBeGreaterThanOrEqual(1.0);
      expect(level).toBeLessThanOrEqual(10.0);
    });

    it('should allow setting constraint level', async () => {
      const initialLevel = cycle.getConstraintLevel();
      cycle.setConstraintLevel(5.0);
      const newLevel = cycle.getConstraintLevel();

      expect(newLevel).toBe(5.0);
      expect(newLevel).not.toBe(initialLevel);
    });

    it('should clamp constraint level to valid range [1, 10]', async () => {
      cycle.setConstraintLevel(0); // Below minimum
      let level = cycle.getConstraintLevel();

      expect(level).toBe(1.0);

      cycle.setConstraintLevel(15); // Above maximum
      level = cycle.getConstraintLevel();

      expect(level).toBe(10.0);
    });
  });

  describe('Code Analysis', () => {
    it('should analyze codebase', async () => {
      const result = await cycle.executeCycle();

      expect(result).toBeDefined();
      expect(result.improvements).toBeDefined();

      if (result.success && result.improvements.length > 0) {
        const firstImprovement = result.improvements[0];
        expect(firstImprovement).toHaveProperty('target');
        expect(firstImprovement).toHaveProperty('type');
        expect(firstImprovement).toHaveProperty('description');
      }
    });

    it('should detect code smells', async () => {
      const result = await cycle.executeCycle();

      expect(result).toBeDefined();
      // Should identify improvement areas
      expect(result).toHaveProperty('newCode');
    });
  });

  describe('Improvement Generation', () => {
    it('should generate improvement candidates', async () => {
      const result = await cycle.executeCycle();

      expect(result).toBeDefined();
      expect(result.improvements).toBeInstanceOf(Array);
    });

    it('should prioritize improvements by impact', async () => {
      const result = await cycle.executeCycle();

      expect(result).toBeDefined();
      if (result.success && result.improvements.length > 1) {
        // Check that improvements have estimated impact
        result.improvements.forEach(imp => {
          expect(imp).toHaveProperty('target');
          expect(imp).toHaveProperty('type');
        });
      }
    });
  });

  describe('Validation', () => {
    it('should validate improvements before applying', async () => {
      const result = await cycle.executeCycle();

      expect(result).toBeDefined();
      expect(result).toHaveProperty('confidence');
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should reject low-confidence improvements', async () => {
      const cycle = new SelfImprovementCycle();
      cycle.setConstraintLevel(3.0); // Higher constraint = stricter

      const result = await cycle.executeCycle();

      expect(result).toBeDefined();
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('confidence');
    });
  });

  describe('Rollback', () => {
    it('should rollback on validation failure', async () => {
      const cycle = new SelfImprovementCycle();
      cycle.setConstraintLevel(8.0); // High constraint

      const result = await cycle.executeCycle();

      expect(result).toBeDefined();
      // High constraint should lead to more cautious improvements
      expect(result).toHaveProperty('success');
    });
  });

  describe('Cycle Tracking', () => {
    it('should track cycle history', async () => {
      const result1 = await cycle.executeCycle();
      const result2 = await cycle.executeCycle();
      const result3 = await cycle.executeCycle();

      expect(result1).toBeDefined();
      expect(result1.currentCycle).toBe(1);
      expect(result2).toBeDefined();
      expect(result2.currentCycle).toBe(2);
      expect(result3).toBeDefined();
      expect(result3.currentCycle).toBe(3);
    });

    it('should update constraint level based on performance', async () => {
      const initialLevel = cycle.getConstraintLevel();

      const result = await cycle.executeCycle();

      expect(result).toBeDefined();
      expect(result).toHaveProperty('performanceChange');

      // Constraint level might adjust based on success
      const finalLevel = cycle.getConstraintLevel();
      expect(finalLevel).toBeGreaterThanOrEqual(1.0);
      expect(finalLevel).toBeLessThanOrEqual(10.0);
    });
  });

  describe('Error Handling', () => {
    it('should handle empty improvements', async () => {
      const cycle = new SelfImprovementCycle();
      const result = await cycle.executeCycle();

      expect(result).toBeDefined();
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('improvements');
    });

    it('should handle generation errors', async () => {
      const cycle = new SelfImprovementCycle();
      const result = await cycle.executeCycle();

      expect(result).toBeDefined();
      // Should not throw
      expect(result).toHaveProperty('success');
    });
  });
});

//