/**
 * Evolution System Enhancer
 * WRAPS existing mutation cycle - DOES NOT REPLACE IT
 * Adds strategic placeholder targeting without breaking current logic
 */

import { PlaceholderManager, Placeholder } from './placeholders';

export interface EnhancedEvolutionConfig {
  mode: 'RANDOM' | 'STRATEGIC' | 'HYBRID';
  strategicWeight: number; // 0-1, how often to target placeholders vs random files
  fallbackToRandom: boolean; // If no placeholders available, use random file
}

export class EvolutionEnhancer {
  private config: EnhancedEvolutionConfig;

  constructor(config: Partial<EnhancedEvolutionConfig> = {}) {
    this.config = {
      mode: config.mode || 'HYBRID',
      strategicWeight: config.strategicWeight ?? 0.7, // 70% strategic, 30% random
      fallbackToRandom: config.fallbackToRandom ?? true
    };
  }

  /**
   * WRAPPER: Decide what to target for next evolution
   * Returns either a placeholder target or null (falls back to random)
   */
  selectEvolutionTarget(): {
    type: 'PLACEHOLDER' | 'RANDOM';
    placeholder?: Placeholder;
    reason: string;
  } {
    // RANDOM mode: always use existing random selection
    if (this.config.mode === 'RANDOM') {
      return {
        type: 'RANDOM',
        reason: 'Mode set to RANDOM - using existing random file selection'
      };
    }

    // STRATEGIC mode: always try placeholder
    if (this.config.mode === 'STRATEGIC') {
      const placeholder = PlaceholderManager.getNextPlaceholder();

      if (placeholder) {
        return {
          type: 'PLACEHOLDER',
          placeholder,
          reason: `Strategic target: ${placeholder.title} (Priority: ${placeholder.priority})`
        };
      }

      if (this.config.fallbackToRandom) {
        return {
          type: 'RANDOM',
          reason: 'No placeholders available - falling back to random'
        };
      }

      return {
        type: 'RANDOM',
        reason: 'Strategic mode but no valid placeholders - skipping cycle'
      };
    }

    // HYBRID mode: weighted random choice
    if (this.config.mode === 'HYBRID') {
      const shouldUseStrategic = Math.random() < this.config.strategicWeight;

      if (shouldUseStrategic) {
        const placeholder = PlaceholderManager.getNextPlaceholder();

        if (placeholder) {
          return {
            type: 'PLACEHOLDER',
            placeholder,
            reason: `Hybrid mode chose strategic: ${placeholder.title}`
          };
        }
      }

      return {
        type: 'RANDOM',
        reason: 'Hybrid mode chose random file mutation'
      };
    }

    // Default: use random
    return {
      type: 'RANDOM',
      reason: 'Default behavior - random file selection'
    };
  }

  /**
   * WRAPPER: Enhanced prompt for placeholder filling
   * Takes existing prompt and augments it with placeholder context
   */
  buildPlaceholderPrompt(placeholder: Placeholder, knowledgeContext: string): string {
    return `
# STRATEGIC PLACEHOLDER IMPLEMENTATION

## Placeholder Details
- **ID**: ${placeholder.id}
- **Title**: ${placeholder.title}
- **Category**: ${placeholder.category}
- **Priority**: ${placeholder.priority}
- **Complexity**: ${placeholder.estimatedComplexity}/5

## Implementation Instructions
${placeholder.instruction}

## Knowledge Base Context
${knowledgeContext}

## Requirements
1. Create file: ${placeholder.file}
2. Follow instruction precisely
3. Write production-ready code (no TODOs or placeholders)
4. Include error handling
5. Add TypeScript types
6. Include JSDoc comments
7. Make it testable

## Output Format
Return ONLY the complete file content. No markdown blocks. No explanations.
Code must be syntactically perfect and ready to commit.

---

BEGIN CODE:
`.trim();
  }

  /**
   * Get enhanced evolution stats
   */
  getStats() {
    return {
      placeholderStats: PlaceholderManager.getStats(),
      config: this.config,
      nextTarget: this.selectEvolutionTarget()
    };
  }
}

// === INTEGRATION EXAMPLES ===

/**
 * Example: How to integrate into existing mutation cycle
 *
 * BEFORE (current code):
 * const files = treeData.tree.filter(...);
 * const target = files[Math.floor(Math.random() * files.length)];
 *
 * AFTER (with enhancement):
 * const enhancer = new EvolutionEnhancer({ mode: 'HYBRID' });
 * const evolutionDecision = enhancer.selectEvolutionTarget();
 *
 * if (evolutionDecision.type === 'PLACEHOLDER' && evolutionDecision.placeholder) {
 *   // Use placeholder target
 *   const placeholder = evolutionDecision.placeholder;
 *   const prompt = enhancer.buildPlaceholderPrompt(placeholder, knowledgeContext);
 *   const evolved = await callGemini(prompt);
 *
 *   // Create new file (not mutate existing)
 *   await createNewFile(placeholder.file, evolved);
 *   PlaceholderManager.markFilled(placeholder.id);
 *
 * } else {
 *   // Fall back to existing random mutation logic (unchanged)
 *   const files = treeData.tree.filter(...);
 *   const target = files[Math.floor(Math.random() * files.length)];
 *   // ... existing code continues ...
 * }
 */
