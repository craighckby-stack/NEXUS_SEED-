/**
 * SAG V94.1 - GAX Policy Formal Verification Unit (Orchestration Layer)
 * Implements the mandatory sequential flow: Config > Schema > History > Engine.
 * Refactored using Class structure for modularity and testability.
 */

// Dependencies
const GAXTelemetry = require('../../core/Telemetry/GAXTelemetryService.js');
// Static Imports (External Systems)
const PolicyConfig = require('../../config/GAX/PolicyDefinitions.js');
const HistoryAnchor = require('../../core/CRoT/HistoryAnchor.js');
const HeuristicIndex = require('../../core/CRoT/PolicyHeuristicIndex.js');
const VerificationEngine = require('./FormalVerificationEngine.js');
const SchemaValidator = require('./PolicySchemaValidator.js'); 

// --- Configuration and Event Constants ---
const TelemetryEvents = Object.freeze({
    START: 'PVF_START',
    SUCCESS: 'PVF_SUCCESS',
    FAILURE_AXIOMATIC: 'PVF_FAILED_AXIOMATIC',
    FAILURE_SCHEMA: 'PVF_FAILED_SCHEMA',
    FAILURE_INTERNAL: 'PVF_FAILED_INTERNAL',
    HISTORY_QUERY: 'PVF_HISTORY_QUERY_OPTIMIZED'
});

const Defaults = Object.freeze({
    MIN_REQUIRED_ANCHORS: 5,
    HISTORY_LOOKBACK_DEPTH: 100,
    FAILURE_CATEGORY_SCHEMA: 'SCHEMA_VIOLATION',
    FAILURE_CATEGORY_AXIOMATIC: 'AXIOMATIC_VIOLATION',
    FAILURE_CATEGORY_INTERNAL: 'RUNTIME_ERROR',
});

/**
 * Helper function to construct the standardized VerificationResult object, 
 * extracted from internal class logic (now handled by ExecutionResultFormatter plugin).
 */
const _formatVerificationResult = (verificationId, timestampStart, details) => {
    const timestampEnd = Date.now();
    return {
        isVerified: details.isVerified,
        verificationId: verificationId,
        timestamp: timestampEnd,
        resultCategory: details.category,
        detailedReport: details.report || 'No detailed report provided.',
        failureConstraints: details.constraints || null,
        durationMs: timestampEnd - timestampStart
    };
};

/**
 * PolicyVerificationOrchestrator class: Centralized control for policy validation flow.
 */
class PolicyVerificationOrchestrator {

    /**
     * Step 1 & 2: Load Config and Validate Policy Schema.
     * @throws {Error} if config fails or schema validation fails.
     */
    async _loadConfigAndValidateSchema(proposedPolicyUpdate) {
        // 1. Config Load
        const currentConfig = await PolicyConfig.GAX_PolicyConfig.loadCurrent();
        if (!currentConfig) {
            throw Object.assign(new Error("Policy Configuration missing or inaccessible."), { name: 'CONFIG_LOAD_FAILURE' });
        }

        // 2. Schema Validation
        try {
            SchemaValidator.PolicySchemaValidator.validatePolicyUpdate(proposedPolicyUpdate);
        } catch (validationError) {
            throw Object.assign(new Error(validationError.message), { name: Defaults.FAILURE_CATEGORY_SCHEMA });
        }
        
        return currentConfig;
    }

    /**
     * V94.1 Optimized History Retrieval: combining heuristic indexing and depth fallback.
     */
    async _getContextualHistory(proposedPolicyUpdate, currentConfig, verificationId) {
        let historicalConstraints = [];

        const { 
            minRequiredAnchors = Defaults.MIN_REQUIRED_ANCHORS, 
            historicalLookbackDepth = Defaults.HISTORY_LOOKBACK_DEPTH
        } = currentConfig;

        // 1. Heuristic History Retrieval (Fast Path)
        const fingerprint = HeuristicIndex.PolicyHeuristicIndex.generateFingerprint(proposedPolicyUpdate);
        const relevantTxIds = await HeuristicIndex.PolicyHeuristicIndex.getRelevantAnchorIDs(fingerprint);

        if (relevantTxIds.length > 0) {
            GAXTelemetry.debug(TelemetryEvents.HISTORY_QUERY, { verificationId, step: 'HEURISTIC', count: relevantTxIds.length });
            historicalConstraints = await HistoryAnchor.CRoT_HistoryAnchor.getConstraintsByTxIds(relevantTxIds);
        }

        // 2. Depth Fallback (Safety Path)
        if (historicalConstraints.length < minRequiredAnchors) {
            GAXTelemetry.debug(TelemetryEvents.HISTORY_QUERY, { 
                verificationId, 
                step: 'DEPTH_FALLBACK', 
                required: minRequiredAnchors
            });
            
            const depthConstraints = await HistoryAnchor.CRoT_HistoryAnchor.getRecentSuccessfulACVs(historicalLookbackDepth);
            
            // Combine results, ensuring uniqueness
            const combinedConstraints = new Set([...historicalConstraints, ...depthConstraints]);
            historicalConstraints = Array.from(combinedConstraints);
        }

        if (historicalConstraints.length === 0) {
            GAXTelemetry.warn('HISTORY_SHALLOW', { verificationId, info: "No certified history found." });
        }
        
        return historicalConstraints;
    }

    /**
     * Unified error handling utility for logging and result building.
     */
    _handleError(verificationId, timestampStart, error) {
        const errorMessage = error.message || "Unknown PVF internal error.";
        const errorName = error.name || Defaults.FAILURE_CATEGORY_INTERNAL;

        let category = Defaults.FAILURE_CATEGORY_INTERNAL;
        let logEvent = TelemetryEvents.FAILURE_INTERNAL;
        let logFunction = GAXTelemetry.fatal;

        if (errorName === Defaults.FAILURE_CATEGORY_SCHEMA) {
            category = 'FAILURE_SCHEMA';
            logEvent = TelemetryEvents.FAILURE_SCHEMA;
            logFunction = GAXTelemetry.warn; // Schema violation is usually recoverable
        } else if (errorName === 'INPUT_FAILURE' || errorName === 'CONFIG_LOAD_FAILURE') {
            category = 'FAILURE_INTERNAL';
            logFunction = GAXTelemetry.error; 
        }
        
        logFunction(logEvent, { verificationId, category, error: errorMessage });

        const truncatedReport = errorMessage.substring(0, 150) + (errorMessage.length > 150 ? '...' : '');

        return _formatVerificationResult(verificationId, timestampStart, {
            isVerified: false,
            category: category,
            report: `Execution failed (${errorName}): ${truncatedReport}`,
            constraints: [errorName, errorMessage.substring(0, 50)]
        });
    }

    /**
     * Executes the Formal Verification Process for proposed policy updates.
     */
    async executeFormalVerification(proposedPolicyUpdate) {
        const timestampStart = Date.now();
        const verificationId = GAXTelemetry.generateRunId('PVF');

        GAXTelemetry.publish(TelemetryEvents.START, { verificationId });

        if (!proposedPolicyUpdate || Object.keys(proposedPolicyUpdate).length === 0) {
             const error = new Error("Policy update delta is empty or missing.");
             error.name = 'INPUT_FAILURE';
             return this._handleError(verificationId, timestampStart, error);
        }

        let currentConfig;
        let historicalConstraints;

        try {
            // Step 1 & 2: Config Load and Schema Validation
            currentConfig = await this._loadConfigAndValidateSchema(proposedPolicyUpdate);
           
            // Step 3: Contextual History Retrieval (Optimized)
            historicalConstraints = await this._getContextualHistory(
                proposedPolicyUpdate,
                currentConfig,
                verificationId
            );
            
            // Step 4: Formal Verification Engine Execution
            const simulationResult = await VerificationEngine.FormalVerificationEngine.checkConsistency(
                proposedPolicyUpdate,
                currentConfig,
                historicalConstraints
            );

            // Step 5: Process Engine Output
            if (simulationResult.isConsistent) {
                const result = _formatVerificationResult(verificationId, timestampStart, {
                    isVerified: true,
                    category: 'SUCCESS',
                    report: `Axiomatic consistency proven against ${historicalConstraints.length} anchors.`
                });
                GAXTelemetry.success(TelemetryEvents.SUCCESS, { verificationId, constraintsChecked: historicalConstraints.length, durationMs: result.durationMs });
                return result;
            } else {
                // Consistency Failure
                const result = _formatVerificationResult(verificationId, timestampStart, {
                    isVerified: false,
                    category: Defaults.FAILURE_CATEGORY_AXIOMATIC,
                    report: simulationResult.failureReason || "Axiomatic consistency violation detected.",
                    constraints: simulationResult.violatingAxioms
                });
                GAXTelemetry.failure(TelemetryEvents.FAILURE_AXIOMATIC, { verificationId, violations: (simulationResult.violatingAxioms || []).length });
                return result;
            }

        } catch (error) {
            return this._handleError(verificationId, timestampStart, error);
        }
    }
}

// Instantiate and expose the primary execution method
const OrchestratorInstance = new PolicyVerificationOrchestrator();

module.exports = { 
    // Bind context for external procedural calls while maintaining internal class scope
    executeFormalVerification: OrchestratorInstance.executeFormalVerification.bind(OrchestratorInstance)
};
