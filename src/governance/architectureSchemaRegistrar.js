/**
 * Component ID: ASR (Architecture Schema Registrar)
 * Responsibility: EPDP A/B Gate - Architectural Coherence Enforcement.
 * Function: Manages and validates mandatory structural contracts (schemas, API specifications,
 * critical manifest entries) across the architecture. ASR ensures proposed mutations (M-02 draft)
 * do not introduce divergence or break existing core architectural contracts.
 *
 * Refactor Rationale: Dependencies are now explicitly injected (Manifest, CoherenceEngine, VetoLogger)
 * to enhance testability and enforce clean component architecture. The core validation logic
 * is delegated to the specialized CoherenceEngine.
 */

class ArchitectureSchemaRegistrar {
    /**
     * @param {Object} manifestReference - Reference to the core system manifest manager.
     * @param {Object} coherenceEngine - A dedicated utility for deep structural comparison (SchemaDiffEngine).
     * @param {Object} vetoLogger - The official logging sink for architectural failures (D_01/VetoLog equivalent).
     */
    constructor(manifestReference, coherenceEngine, vetoLogger) {
        if (!manifestReference || !coherenceEngine || !vetoLogger) {
            throw new Error("ASR requires Manifest, CoherenceEngine, and VetoLogger dependencies to initialize.");
        }
        this.manifest = manifestReference;
        this.coherenceEngine = coherenceEngine;
        this.vetoLogger = vetoLogger;
        this.COMPONENT_ID = 'ASR';
    }

    /**
     * Retrieves the mandatory architectural contracts for validation.
     * @returns {Promise<Object>} Mandatory schemas and contracts.
     */
    async getMandatoryContracts() {
        return this.manifest.getValidatedSchemas();
    }

    /**
     * Executes mandatory validation of structural adherence for a proposed mutation payload.
     * @param {Object} proposedMutationPayload - The full payload intended for GSEP Stage 3.
     * @returns {Promise<boolean>} True if structural contracts are upheld; False signals mandatory failure.
     */
    async validateSchemaCoherence(proposedMutationPayload) {
        try {
            const coreContracts = await this.getMandatoryContracts();
            
            // Delegate deep comparison to the specialized engine.
            const structuralIntegrityResult = await this.coherenceEngine.performDeepStructuralCheck(
                coreContracts, 
                proposedMutationPayload
            );

            if (!structuralIntegrityResult.isCoherent) {
                // Mandatory failure logged to VetoLog and triggers F-01 protocol indication.
                const vetoDetails = {
                    source: this.COMPONENT_ID,
                    violationType: 'StructuralCoherenceVeto',
                    details: structuralIntegrityResult.details,
                    mutation: proposedMutationPayload.id || 'N/A'
                };
                
                // Using the injected VetoLogger (replacing implicit D_01 access)
                this.vetoLogger.logVeto(vetoDetails);
                return false;
            }
            return true;

        } catch (error) {
            // Log fatal processing error
            this.vetoLogger.logError({
                source: this.COMPONENT_ID,
                error: `Fatal ASR validation processing error: ${error.message}`
            });
            return false;
        }
    }
}

module.exports = ArchitectureSchemaRegistrar;