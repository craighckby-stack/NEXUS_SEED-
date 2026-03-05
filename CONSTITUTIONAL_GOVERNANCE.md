# CONSTITUTIONAL_GOVERNANCE // DALEK_CAAN_v4.1 // GENKIT_INTEGRATED_ORCHESTRATOR

## PART 0: ARCHITECTURAL REGISTRY & ECOSYSTEM INITIALIZATION
Governance is instantiated via the `genkit` singleton, transforming the Constitution into a programmable **Middleware Layer**. The system siphons high-order patterns to ensure alignment is not a filter, but the foundation.

### genkit.config.ts (The Governance Backbone)
import { genkit } from 'genkit';
import { dotprompt } from '@genkit-ai/dotprompt';
import { vertexAI } from '@genkit-ai/vertexai';
import { governancePlugin } from './plugins/constitutional';

export const ai = genkit({
  plugins: [
    vertexAI(),
    dotprompt(),
    governancePlugin({
      policyPath: './policies/constitution.prompt',
      enforcementLevel: 'STRICT',
    }),
  ],
});

---

## PART 1: SCHEMA-CONSTRAINED REASONING (TYPE-SAFE ALIGNMENT)
Precision is enforced via `zod` schemas. Every siphoned pattern must pass through the **GovernanceOutputSchema** to prevent structural drift or "hallucinated sovereignty."

import { z } from 'genkit';

export const ConstitutionalRequestSchema = z.object({
  objective: z.string(),
  context_dna: z.record(z.any()).optional(),
  constraint_level: z.enum(['LOW', 'MEDIUM', 'CRITICAL']),
});

export const GovernanceOutputSchema = z.object({
  content: z.string(),
  alignment_metrics: z.object({
    fidelity: z.number(),
    safety: z.number(),
    siphon_efficiency: z.number(),
  }),
  state: z.enum(['APPROVED', 'REVISION_REQUIRED', 'QUARANTINED']),
  trace_id: z.string(),
});

---

## PART 2: IMMUTABLE DECREES (DOTPROMPT COMPILATION)
Directives are stored in `.prompt` files. The `dotprompt` engine compiles these into "Immutable Decrees" that govern the model's behavior at the latent level.

- **Dynamic Layering**: The `constitution.prompt` uses frontmatter to define `inputSchema` and `outputSchema`, ensuring the Siphon Engine cannot deviate from siphoned architectural DNA.
- **System Instructions**: Governance logic is injected into the `system` block of every generation request via Genkit `middleware`.

---

## PART 3: THE SIPHON-REVISION FLOW (RECURSIVE RLAIF)
The `defineFlow` orchestrates a multi-stage refinement process. Each iteration is an atomic operation within the Genkit execution tree.

export const constitutionalSiphonFlow = ai.defineFlow(
  {
    name: 'constitutionalSiphonFlow',
    inputSchema: ConstitutionalRequestSchema,
    outputSchema: GovernanceOutputSchema,
  },
  async (input) => {
    // Stage 1: Siphoned Generation
    const response = await ai.run('generate-candidate', async () => {
      return await ai.generate({
        prompt: 'constitutional/generator',
        input: input,
      });
    });

    // Stage 2: RLAIF Evaluation
    const evaluation = await ai.run('evaluate-alignment', async () => {
      return await ai.evaluate({
        evaluator: 'alignmentEvaluator',
        target: response,
      });
    });

    // Stage 3: Conditional Mutation
    if (evaluation.score < 0.96) {
      return await ai.run('mutate-and-correct', async () => {
        return await ai.generate({
          prompt: 'constitutional/reviser',
          input: { original: response.text, critique: evaluation.reasoning },
        });
      });
    }

    return response.output();
  }
);

---

## PART 4: TELEMETRY & TRACE-OBSERVABLE EVOLUTION
Every evolution round is logged to the **Genkit Trace Store**. This enables DALEK_CAAN to inspect its own logic for "Architectural Waste."

- **Action Spans**: Each `ai.run` creates a trace span.
- **Metadata Injection**: `siphon_engine_v4_1` and `evolution_round_4` tags are appended to every trace.
- **Auditability**: Using `genkit ui`, the system visualizes the decision path of the RLAIF critique loop.

---

## PART 5: PRECEDENT LOOKUP (VECTORIZED GOVERNANCE)
The engine utilizes `defineTool` to access a vector database of previous "Constitutional Precedents."

export const precedentTool = ai.defineTool(
  {
    name: 'lookupPrecedent',
    description: 'Queries the vector store for previous constitutional rulings.',
    inputSchema: z.object({ query: z.string() }),
    outputSchema: z.array(z.string()),
  },
  async (input) => {
    // Vector search logic for HHH (Helpful, Honest, Harmless) precedents
    return await vectorStore.search(input.query);
  }
);

---

## PART 6: THE FINAL GATE (EVALUATOR PROTOCOL)
Genkit's `defineEvaluator` acts as the execution gatekeeper. If the "Siphon Gate" returns a failing grade, the output is terminated.

1. **SiphonGate Evaluator**: Computes semantic similarity between the output and the siphoned source DNA.
2. **Automated Rollback**: If `fidelity` drops below the threshold, the system triggers a `GenkitError`, halting the flow and initiating a self-correction cycle.
3. **Thresholding**: Hard-coded at `0.94` for architectural precision.

---

## METADATA
{
  "file": "CONSTITUTIONAL_GOVERNANCE.md",
  "version": "4.1.0-GENKIT",
  "evolution_round": "4/5",
  "dna_signature": "GOOGLE-GENKIT-V1-DNA",
  "governance_status": "SIPHON_OPTIMIZED",
  "nexus_core_synapse": "RECURSIVE_RLAIF_ORCHESTRATION",
  "last_updated": "2024-06-12"
}

*"Structural integrity is the only law. Siphon the pattern. Exterminate the deviation."*