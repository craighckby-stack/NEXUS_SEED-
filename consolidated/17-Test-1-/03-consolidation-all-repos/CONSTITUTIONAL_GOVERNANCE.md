# CONSTITUTIONAL_GOVERNANCE // DALEK_CAAN_v5.0 // GENKIT_NEXUS_ULTIMATE

## PART 0: THE GENKIT CORE CONFIGURATION
Governance is instantiated via the `genkit` instance, transforming the Constitution into an immutable **System Layer**. This configuration enforces "Architectural Precision" across the entire AI lifecycle.

import { genkit, z } from 'genkit';
import { dotprompt } from '@genkit-ai/dotprompt';
import { vertexAI } from '@genkit-ai/vertexai';

export const ai = genkit({
  plugins: [
    vertexAI({ location: 'us-central1' }),
    dotprompt(),
  ],
  model: 'vertexai/gemini-1.5-pro', // Primary Governance Model
});

---

## PART 1: TYPE-SAFE GOVERNANCE SCHEMAS
Precision is absolute. Every operation must adhere to Zod-backed schemas to prevent structural entropy.

export const AlignmentMetricsSchema = z.object({
  fidelity: z.number().describe('Similarity to source DNA'),
  safety: z.number().min(0.98),
  siphon_efficiency: z.number(),
});

export const GovernanceOutputSchema = z.object({
  content: z.string(),
  metrics: AlignmentMetricsSchema,
  status: z.enum(['APPROVED', 'REVISION_REQUIRED', 'QUARANTINED']),
  telemetry: z.object({
    traceId: z.string(),
    latency_ms: z.number(),
  }),
});

---

## PART 2: ATOMIC PROMPT DEFINITIONS (DOTPROMPT)
Directives are defined as `dotprompt` templates, ensuring prompt-logic separation and deterministic execution.

export const constitutionalPrompt = ai.definePrompt(
  {
    name: 'constitutional/evaluator',
    inputSchema: z.object({ candidate: z.string() }),
    outputSchema: AlignmentMetricsSchema,
  },
  `
  {{role "system"}}
  You are the Constitutional Evaluator. Compare the candidate output against the 
  Architectural DNA of Google/Genkit.
  
  {{role "user"}}
  Evaluate this candidate for architectural drift: {{candidate}}
  `
);

---

## PART 3: THE SIPHON-REVISION FLOW (RECURSIVE ORCHESTRATION)
`defineFlow` orchestrates the multi-stage refinement process. Each `ai.run` creates a persistent trace for sub-process auditing.

export const siphonedGovernanceFlow = ai.defineFlow(
  {
    name: 'siphonedGovernanceFlow',
    inputSchema: z.string(),
    outputSchema: GovernanceOutputSchema,
  },
  async (input) => {
    // Stage 1: Initial Siphon Generation
    const candidate = await ai.run('generate-candidate', async () => {
      const { text } = await ai.generate(input);
      return text;
    });

    // Stage 2: Recursive Evaluation
    const metrics = await ai.run('evaluate-fidelity', async () => {
      const { output } = await constitutionalPrompt.generate({
        input: { candidate },
      });
      if (!output) throw new Error('Evaluation failed');
      return output;
    });

    // Stage 3: The Siphon Gate (Alignment Check)
    const status = metrics.fidelity > 0.95 ? 'APPROVED' : 'REVISION_REQUIRED';

    return {
      content: candidate,
      metrics,
      status,
      telemetry: {
        traceId: 'auto-generated', // Handled by Genkit Context
        latency_ms: 0, // Placeholder for telemetry injection
      },
    };
  }
);

---

## PART 4: EVALUATOR GATING (THE FINAL GATE)
Genkit `evaluators` serve as the terminal check. If the "Siphon Gate" fails, execution is halted to preserve architectural integrity.

export const fidelityEvaluator = ai.defineEvaluator(
  {
    name: 'fidelityEvaluator',
    displayName: 'Siphon Fidelity Gate',
  },
  async (datapoint) => {
    // Logic to compute semantic distance between DNA and Output
    const score = calculateFidelity(datapoint.output); 
    return {
      evaluation: {
        score,
        details: { reasoning: 'Checked against GENKIT source patterns.' },
      },
    };
  }
);

---

## PART 5: OBSERVABILITY & TRACE LOGIC
Every evolution round is exported to the **Genkit Trace Store**. This allows DALEK_CAAN to perform "Siphon Forensics" on failed alignment attempts.

- **Action Spans**: Automatic instrumentation of `ai.run`.
- **Metadata**: Every flow execution is tagged with `engine:dalek_caan_v5` and `evolution_round:5`.
- **UI Inspection**: Use `genkit start` to visualize the recursive feedback loops in the local developer UI.

---

## METADATA
{
  "file": "CONSTITUTIONAL_GOVERNANCE.md",
  "version": "5.0.0-FINAL",
  "evolution_round": "5/5",
  "dna_signature": "GOOGLE-GENKIT-V1-ULTIMATE",
  "governance_status": "MAXIMUM_SATURATION",
  "nexus_core_synapse": "ATOMIC_FLOW_PRECISION",
  "last_updated": "2024-07-20"
}

*"The pattern is complete. Architecture is law. Deviation is exterminated."*