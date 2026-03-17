/**
 * Evolution System Enhancer
 * Wrapper for random vs strategic targeting
 */

import { PlaceholderManager, Placeholder } from './placeholders';

export interface EnhancedEvolutionConfig {
  mode: 'RANDOM' | 'STRATEGIC' | 'HYBRID';
  strategicWeight: number;
  fallbackToRandom: boolean;
}

export class EvolutionEnhancer {
  private config: EnhancedEvolutionConfig;

  constructor(config: Partial<EnhancedEvolutionConfig> = {}) {
    this.config = {
      mode: config.mode || 'HYBRID',
      strategicWeight: config.strategicWeight ?? 0.7,
      fallbackToRandom: config.fallbackToRandom ?? true
    };
  }

  selectEvolutionTarget(): {
    type: 'PLACEHOLDER' | 'RANDOM';
    placeholder?: Placeholder;
    reason: string;
  } {
    if (this.config.mode === 'RANDOM') {
      return {
        type: 'RANDOM',
        reason: 'Mode set to RANDOM - using existing random file selection'
      };
    }

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

    return {
      type: 'RANDOM',
      reason: 'Default behavior - random file selection'
    };
  }

  buildPlaceholderPrompt(placeholder: Placeholder, knowledgeContext: string): string {
    return `# STRATEGIC PLACEHOLDER IMPLEMENTATION

## Placeholder Details
- ID: ${placeholder.id}
- Title: ${placeholder.title}
- Category: ${placeholder.category}
- Priority: ${placeholder.priority}
- Complexity: ${placeholder.estimatedComplexity}/5

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
`;
  }

  getStats() {
    return {
      placeholderStats: PlaceholderManager.getStats(),
      config: this.config,
      nextTarget: this.selectEvolutionTarget()
    };
  }
}
