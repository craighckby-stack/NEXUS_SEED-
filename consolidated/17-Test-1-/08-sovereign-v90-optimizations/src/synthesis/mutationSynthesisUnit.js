/**
 * Component ID: MSU (Mutation Synthesis Unit)
 * Function: Translates high-level evolution intent (raw proposal data from Stage 1)
 * into a rigorously structured and language-compliant M-02 code payload specification.
 * Ensures adherence to Abstract Syntax Tree (AST) constraints and verifies syntactical integrity
 * before submission to the Mutation Payload Spec Engine (MPSE) and Architectural Schema Registrar (ASR).
 *
 * Inputs:
 * - Raw Intent/Diff (from Stage 1 output)
 * - Current Architecture Schema (via ASR)
 *
 * Outputs:
 * - M-02 Payload Specification (Ready for Execution Phase Deployment Protocol (EPDP) B validation)
 */

// Assuming the plugin system provides the formatter interface
interface IM02PayloadFormatter {
    format(rawIntent: object, codeMutations: Array<object>, currentArchitectureVersion: string): object;
}

class MutationSynthesisUnit {
    private asr: any;
    private mpse: any;
    private cte: any;
    private m02Formatter: IM02PayloadFormatter;

    /**
     * Injecting CTE (Code Transformation Engine) and M02PayloadFormatter.
     */
    constructor(asr: any, mpse: any, cte: any, m02Formatter: IM02PayloadFormatter) {
        this.asr = asr; // Architectural Schema Registrar dependency
        this.mpse = mpse; // Mutation Payload Spec Engine dependency
        this.cte = cte; // Code Transformation Engine dependency
        this.m02Formatter = m02Formatter; // Payload structuring dependency
    }

    /**
     * Core function to transform raw intent into a structured M-02 payload.
     * This function orchestrates parsing, architectural verification, and payload structuring.
     * @param {object} rawIntent - The conceptual proposal describing the desired evolution.
     * @returns {object} The finalized M-02 compliant payload specification.
     * @throws {Error} If AST generation or architectural constraints fail.
     */
    async synthesizePayload(rawIntent: object): Promise<object> {
        if (!rawIntent || !rawIntent.id || !rawIntent.evolutionTarget) {
            throw new Error("MSU requires a well-formed rawIntent object with ID and target specified.");
        }

        // 1. Intent interpretation & preliminary AST construction
        const preliminaryAST = await this.cte.intentToAST(rawIntent);

        // 2. Schema integrity check against the current architecture (ASR).
        const validationResult = this.asr.validateProposedStructure(preliminaryAST);
        
        if (!validationResult.isValid) {
             throw new Error(`Architectural violation detected during synthesis: ${validationResult.reason}`);
        }
        
        // 3. Transformation: Generate the granular code mutations.
        const codeMutations = await this.cte.astToCodeMutations(preliminaryAST);

        // 4. Structure the output into the rigid M-02 payload format using the dedicated formatter.
        const currentVersion = this.asr.getCurrentVersion();
        const m02Data = this.m02Formatter.format(rawIntent, codeMutations, currentVersion);
        
        // 5. Final validation against MPSE rigid specification.
        this.mpse.validateM02Schema(m02Data);
        
        return m02Data;
    }
}

module.exports = MutationSynthesisUnit;