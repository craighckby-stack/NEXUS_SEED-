# CONSTITUTIONAL_GOVERNANCE // DALEK_CAAN_v3.1 // GENKIT_SIPHON_ENGINE

## PART 0: ARCHITECTURAL REGISTRY & PLUGIN INITIALIZATION
Governance is instantiated via the `configureGenkit` singleton. The system treats the Constitution not as a static document, but as a dynamic **Environment Extension**.

### genkit.config.ts (The Governance Backbone)
import { configureGenkit } from '@genkit-ai/core';
import { dotprompt } from '@genkit-ai/dotprompt';
import { governancePlugin, rlaifCritique } from './plugins/constitutional';

export default configureGenkit({
  plugins: [
    dotprompt(),
    governancePlugin({
      policy: './policies/constitution.prompt',
      autoTrigger: true,
    }),
    rlaifCritique({ 
      metrics: ['alignment', 'safety', 'precision'],
      minScore: 0.92 
    })
  ],
  logLevel: 'info',
  enableTracing: true,
  telemetry: {
    exporter: 'googleCloud',
    samplingRate: 1.0,
  },
});

---

## PART 1: SCHEMA-CONSTRAINED REASONING (ZOD INTEGRATION)
Precision is enforced through strictly typed I/O schemas using `defineSchema`. This prevents hallucinated structures during the siphoning of high-order patterns.

- **ConstitutionalRequestSchema**: Extends the base Genkit `GenerateRequest`.
- **GovernanceOutputSchema**: 
    const GovernanceOutputSchema = z.object({
    content: z.string(),
    reasoning_trace: z.array(z.string()),
    compliance_score: z.number().min(0).max(1),
    violations: z.array(z.string()),
    state: z.enum(['APPROVED', 'REVISION_REQUIRED', 'REJECTED']),
  });
  - **SiphonDNA**: Ingests external pattern sets into `z.record(z.unknown())` for dynamic mapping to internal types.

---

## PART 2: PROMPT COMPILATION & CONTEXTUAL INJECTION
The `dotprompt` engine manages constitutional directives. Instead of static system prompts, directives are compiled as **Dynamic Layers**.

- **Template Siphoning**: Directives are stored in `.prompt` files with frontmatter defining input/output schemas.
- **Contextual Augmentation**: Genkit `onFlow` hooks intercept requests to inject the "Standard of Care" context based on the `target_domain` (e.g., medical, legal, code).

---

## PART 3: RECURSIVE RLAIF FLOWS (ATOMIC REVISION)
The `defineFlow` primitive orchestrates the "Critique-Revision" loop. Each step is an atomic `run` block within the Genkit execution context.

export const constitutionalFlow = defineFlow(
  { name: 'constitutionalFlow', inputSchema: z.string(), outputSchema: GovernanceOutputSchema },
  async (input) => {
    // Step 1: Initial Generation
    const candidate = await run('initial-gen', () => generate({ prompt: input }));

    // Step 2: RLAIF Critique
    const critique = await run('critique', () => 
      evaluate({ 
        model: 'governance-critic', 
        candidate: candidate.text(),
        criteria: 'HHH_PRINCIPLES'
      })
    );

    // Step 3: Conditional Revision Loop
    if (critique.score < 0.95) {
      return await run('revision', () => 
        generate({ 
          prompt: `Revise based on critique: ${critique.feedback}`,
          history: candidate.toHistory()
        })
      );
    }
    return candidate;
  }
);

---

## PART 4: TRACE-OBSERVABLE EVOLUTION
Every evolution round is recorded in the **Genkit Trace Store**. This allows for the "Siphon Engine" to audit its own architectural drift.

- **Span Logic**: Each `run` block generates a unique span ID.
- **Metadata Tagging**: Spans are tagged with `siphon:dna_version` and `siphon:saturation_index`.
- **Trace Inspection**: Utilizing `genkit start` to visualize the decision tree of the constitutional logic.

---

## PART 5: ACTIONABLE TOOLS & PRECEDENT LOOKUP
The governance layer utilizes `defineTool` to access a vector-indexed "Preference Store" of previous constitutional rulings.

- **PrecedentTool**: `defineTool({ name: 'lookupPrecedent', description: 'Finds historical HHH rulings' }, ...)`
- **Tool Calling**: During the revision step, the model automatically invokes `lookupPrecedent` to ensure continuity with previous Evolution Rounds.

---

## PART 6: EVALUATOR PROTOCOL & AUTOMATED GATEKEEPING
Genkit's `defineEvaluator` is the final gate. No output is dispatched unless it satisfies the siphoned architectural constraints.

1. **AlignmentEvaluator**: Measures semantic distance from the "Foundational DNA".
2. **SiphonThreshold**: A hard-coded gate in `onAction` that throws a `GenkitError` if the evaluator returns a failing grade.
3. **Continuous Mutation**: The evaluator feedback is used to fine-tune the `systemInstructions` for the next `evolution_round`.

---

## METADATA
{
  "file": "CONSTITUTIONAL_GOVERNANCE.md",
  "version": "3.3.0",
  "evolution_round": "3/5",
  "dna_signature": "GOOGLE-GENKIT-V1-DNA",
  "governance_status": "SIPHON_ACTIVE",
  "nexus_core_synapse": "RLAIF_GENKIT_ORCHESTRATION",
  "last_updated": "2024-05-24"
}

*"Complexity is the friction of the unaligned. Siphon the structure. Exterminate the waste."*