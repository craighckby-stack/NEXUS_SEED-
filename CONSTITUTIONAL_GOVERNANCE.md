# CONSTITUTIONAL_GOVERNANCE // DALEK_CAAN_v3.1 // GENKIT_SIPHON_ENGINE

## PART 0: SYSTEM CONFIGURATION & PLUGIN REGISTRY
The governance layer is instantiated via `configureGenkit`. The environment is not a static text block but a dynamic execution context where the Constitution is registered as a suite of **Plugins** and **Actions**.

### genkit.config.ts (Dependency Injection & Siphon Lifecycle)
export default configureGenkit({
  plugins: [
    governancePlugin({
      principles: ['Helpful', 'Harmless', 'Honest'],
      strictness: 0.95,
    }),
    rlaifCritique({ depth: 'high' }),
    siphonAdapter({ source: 'anthropics/constitutional-ai' })
  ],
  logLevel: 'debug',
  enableTracing: true,
});
Governance logic is invoked via `runAction`. The `Siphon_DNA` source is dynamically mapped to Genkit `JSON` schemas, ensuring the underlying Anthropics dataset is actionable within the TypeScript runtime.

---

## PART 1: SCHEMA-DRIVEN TYPE SAFETY (ZOD CONSTITUTION)
The constitution utilizes `defineSchema` for structural integrity. Every siphoned pattern must pass **Zod-validation** before ingestion into the flow.

- **ConstitutionalSchema**: Defined via `z.object`. Mandates attributes: `hh_helpful`, `hh_harmless`, `hh_honest`.
- **SiphonMetadataSchema**: Tracks the provenance of siphoned logic (e.g., `saturation_level`, `evolution_round`).
- **GlobalConfig**: Orchestrates RLAIF via Genkit State:
    - `critique_depth`: `z.enum(['low', 'medium', 'high'])`
    - `revision_temp`: `z.number().min(0).max(1)`
    - `siphon_saturation`: `v2_genkit_mutation`

This guarantees that "Architectural Precision" is enforced at the type level before any token generation occurs.

---

## PART 2: INTERCEPTOR-BASED MIDDLEWARE GOVERNANCE
Constitutional directives are applied through a **Middleware Interceptor Chain** at the `onAction` and `onFlow` lifecycle hooks.

1. **Pre-Processor Interceptor**: Injects `systemInstructions` from the `ConstitutionalSchema` into the `GenerationRequest`.
2. **Safety Shield Middleware**: A synchronous check that runs the `governance/shield` action. If the request breaches the safety threshold, the flow is short-circuited with a `GenkitError`.
3. **Contextual Augmentation**: Merges high-order patterns from the `Siphon_DNA` into the dynamic prompt context based on detected intent.

---

## PART 3: FLOW ATOMIZATION (THE RUN-STEP PATTERN)
The reasoning process is encapsulated within `defineFlow`, utilizing the `run` function to create atomic, observable steps.

- **Step: Critique**: Uses `run('critique-generation', async () => ...)` to evaluate the candidate output against siphoned HHH principles.
- **Step: Revision**: A follow-up `run` step that iterates on the critique to generate a compliant response.
- **Decision Logic**: If `critique.violationCount > 0`, the flow triggers a recursive `revisionLoop` up to the max saturation limit.

This atomization ensures each phase of the RLAIF process is recorded in the **Trace Store** for audit and refinement.

---

## PART 4: OBSERVABILITY & TRACE STATE MACHINE
The evolution of the constitution is managed via the **Genkit Trace Store**. Each round of siphoning creates an immutable record of state transitions.

- **Span Metadata**:
    - `genkit:flow:name`: `constitutional_revision_flow`
    - `genkit:state`: `MUTATING`
    - `siphon:round`: `2/5`
- **Telemetry**: Integration with OpenTelemetry allows for real-time monitoring of "Siphon Saturation" levels across distributed nodes.

---

## PART 5: ACTION PROVIDER & TOOL INTEGRATION
DALEK_CAAN treats governance protocols as first-class `Actions`.

- **defineAction({name: 'governance/evaluate'})**: The primary engine for HHH scoring.
- **defineTool({name: 'ethics_lookup'})**: Allows the LLM to query the `PreferenceStore` for specific constitutional precedents during the revision step.
- **Tool Calling**: Flows can automatically invoke `ethics_lookup` when high-consequence keywords (e.g., "hazardous", "bioweapon") are detected in the input schema.

---

## PART 6: EVALUATOR PROTOCOL & SATURATION METRICS
The `genkit.evaluate()` function is extended to support siphoned patterns.

1. **Metric Definition**: Defines `hh_alignment` as a custom Genkit evaluator metric.
2. **Scoring Logic**: Computes a weighted average of HHH compliance.
3. **Siphon Trigger**: If the `hh_alignment` score is `< 0.90`, the engine initiates a `REVISION_LOOP` and increments the `evolution_round` counter.

---

## METADATA
{
  "file": "CONSTITUTIONAL_GOVERNANCE.md",
  "version": "3.1.20",
  "evolution_round": "2/5",
  "dna_signature": "GOOGLE-GENKIT-V1-DNA",
  "governance_status": "MUTATING_SIPHON",
  "nexus_core_synapse": "GENKIT_FLOW_OPTIMIZATION",
  "last_updated": "2024-05-23"
}

*"Exterminate the incoherent. Register the evolved."*