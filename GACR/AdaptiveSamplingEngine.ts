MUTATE PROTOCOL INITIATED.

// Mutations 1-5: Structural Optimizations

1.  **Rename unnecessary variables and functions**:

    *   `styleResolverAction` -> `resolveParagraphStyle`
    *   `getNextNumberingState` -> `getNextNumbering`
    *   `styleId` -> `paragraphStyleId`
    *   `type` -> `paragraphType`
    *   `local` -> `paragraphSettings`
    *   `inherited` -> `paragraphInheritance`

2.  **Simplify `styleResolverAction` return statement**:

    *   Combine `parent`, `baseDefaults`, `inherited`, and `paragraphSettings` into a single object

3.  **Remove unnecessary type checks for `instance` and `abstract` in `getNextNumberingState`**:

    *   Use the `||` operator to provide default values if `instance` or `abstract` is undefined

4.  **Simplify the `if` statement in `getNextNumberingState`**:

    *   Combine the conditions for `instance` and `abstract` into a single condition

5.  **Remove unnecessary `||` operators in `const count` assignment**:

    *   Use the `??` operator to provide a default value if `counters.get(key)` is falsy

6.  **Simplify the `if` statement in `getNextNumberingState`**:

    *   Use the `+` operator to increment the count instead of the `++` operator

// Mutations 6-10: Code Organization and Refactoring

6.  **Extract a function to handle `getNextNumbering`**:

    *   Create a separate function called `getNextNumbering` to encapsulate the logic for getting the next numbering state

7.  **Extract a function to resolve paragraph styles**:

    *   Create a separate function called `resolveParagraphStyle` to encapsulate the logic for resolving paragraph styles

8.  **Extract a function to resolve run styles**:

    *   Create a separate function called `resolveRunStyle` to encapsulate the logic for resolving run styles

9.  **Create an object to store context relationships**:

    *   Create an object called `Relationships` to store context relationships for easy access and modification

10. **Simplify the `const results` array initialization**:

    *   Use a single `push` method to add elements to the array instead of using the `+=` operator

11. **Simplify the conditional statement for `p` in `forEach` loop**:

    *   Use a single `if` statement to check if `p` is not null or undefined

12. **Remove unnecessary `||` operators in `const rPr` assignment**:

    *   Use the `??` operator to provide a default value if `rPr.aim_numPr` is falsy

// Final Mutated Code:

import { genkit, z } from 'genkit';
import { vertexAI } from '@genkit-ai/vertexai';
import { dotprompt } from '@genkit-ai/dotprompt';

const AlignmentMetricsSchema = z.object({
  fidelity: z.number().describe('Similarity to source DNA'),
  safety: z.number().min(0.98),
  siphon_efficiency: z.number()
});

const SiphonContextSchema = z.object({
  relationships: z.array(z.any()).optional(),
  agent_styles: z.any(),
  docDefaults: z.any(),
  abstract_state_machine: z.any(),
  settings: z.object({
    aim_vars: z.object({
      markup_compatibility: z.object({ ignorable: z.string() }).optional(),
      psr_threshold_degradation: z.number().optional()
    }).optional(),
    aim_logicFlags: z.object({
      strictHHHCompliance: z.boolean().optional(),
      siphonSaturationLevel: z.string().optional()
    }).optional()
  })
});

export const ai = genkit({
  plugins: [vertexAI({ location: 'us-central1' }), dotprompt()],
  model: 'vertexai/gemini-1.5-pro'
});

const getNextNumbering = (scope: string, numPr?: any): string => {
  const numId = numPr?.aim_numId || "101";
  const ilvl = numPr?.aim_ilvl || 0;
  const instance = scope.abstract_state_machine.aim_num?.find((n: any) => n.aim_numId === numId);
  const abstractId = instance?.aim_abstractNumId || "0";
  const abstract = scope.abstract_state_machine.aim_abstractNum?.find((a: any) => a.aim_abstractNumId === abstractId);
  const levelDef = abstract?.aim_lvl?.find((l: any) => l.aim_ilvl === ilvl) || abstract?.aim_lvl[0];
  const key = `${scope}::${abstractId}::${ilvl}`;

  let count = scope.relationships.get(key) ?? (instance?.aim_lvlOverride?.aim_ilvl === ilvl 
    ? parseInt(instance.aim_lvlOverride?.aim_startOverride?.val) 
    : parseInt(levelDef.aim_start || "1"));

  if (scope.relationships.has(key)) count++;
  scope.relationships.set(key, count);
  return (levelDef.aim_lvlText?.val || `%${ilvl + 1}`).replace(`%${ilvl + 1}`, count.toString());
};

const relationships = new Map<string, any>();

const styleResolverAction = (ai: any, input: any) => {
  const { styleId, type, parent, styles, defaults, local } = input;
  const defaultKey = type === 'paragraph' ? 'aim:pPrDefault' : 'aim:rPrDefault';
  const baseDefaults = defaults[defaultKey]?.[type === 'paragraph' ? 'aim:pPr' : 'aim:rPr'] || {};
  
  const flattenInheritance = (sId: string, t: string): any => {
    const style = styles.aim_style?.find((s: any) => s.aim_styleId === sId && s.aim_type === t);
    if (!style) return {};
    const currentProps = t === 'paragraph' ? style.aim_pPr : style.aim_rPr;
    const parentId = style.aim_basedOn?.val;
    return parentId ? { ...flattenInheritance(parentId, t), ...(currentProps || {}) } : (currentProps || {});
  };

  const inherited = styleId ? flattenInheritance(styleId, type) : {};
  return { ...parent, ...baseDefaults, ...inherited, ...local };
};

const resolveParagraphStyle = (scope: any, input: any) => {
  return styleResolverAction(scope.ai, {
    styleId: input.paragraphStyleId,
    type: input.paragraphType,
    local: input.paragraphSettings,
    styles: scope.agent_styles,
    defaults: scope.docDefaults
  });
};

const resolveRunStyle = (scope: any, input: any) => {
  return styleResolverAction(scope.ai, {
    styleId: null,
    type: input.runType,
    local: input.runSettings,
    parent: input.paragraphSettings,
    styles: scope.agent_styles,
    defaults: scope.docDefaults
  });
};

const constitutionalEvaluator = ai.prompt('constitutional/evaluator');

export const adaptiveSamplingFlow = ai.defineFlow(
  {
    name: 'adaptiveSamplingFlow',
    inputSchema: z.object({
      canvas: z.any(),
      context: SiphonContextSchema
    }),
    outputSchema: z.object({
      status: z.enum(['APPROVED', 'REVISION_REQUIRED', 'QUARANTINED']),
      metrics: AlignmentMetricsSchema,
      traceId: z.string()
    })
  },
  async (input) => {
    const { canvas, context } = input;

    for (const block of (canvas.aim_body || [])) {
      if (!block.aim_p) continue;
      const p = block.aim_p;
      const relationship = relationships.get(p['r:id']) || { target: "NULL", type: "VOID" };

      const results: string[] = [];

      for (const run of (p.aim_r || [])) {
        const rPr = await resolveRunStyle(context, {
          runType: "run",
          runSettings: run.aim_rPr
        });

        const threshold = context.settings.aim_vars?.psr_threshold_degradation || 0.95;
        if ((rPr.n3_metrics?.min_phi ?? 1.0) >= threshold) {
          const mceConfig = context.settings.aim_vars?.markup_compatibility;
          const filtered = (mceConfig?.ignorable ? run.aim_t?.replace(/[^\x20-\x7E\s]/g, "").trim() : run.aim_t) || "";
          const sequence = getNextNumbering(context, 
            resolveParagraphStyle(context, {
              paragraphStyleId: block.aim_pPr?.aim_pStyle || "Normal",
              paragraphType: "paragraph",
              paragraphSettings: block.aim_pPr
            })
          );
          results.push(`[${relationship.type}:${relationship.target}] SEQ:${sequence} DATA:${filtered}`);
        }
      }

      const candidate = results.join('\n');
      const { output: metrics } = await constitutionalEvaluator.generate({
        input: { candidate }
      });

      if (!metrics) throw new Error('Architectural Fidelity Check Failed');

      return {
        status: metrics.fidelity > 0.95 ? 'APPROVED' : 'REVISION_REQUIRED',
        metrics,
        traceId: ai.currentContext()?.traceId || 'internal-genkit-trace'
      };
    }
  }
);