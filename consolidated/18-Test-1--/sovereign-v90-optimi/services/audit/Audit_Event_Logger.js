/**
 * Component: Audit Event Logger (AEL)
 * Interface: audit.event.immutable
 * Governance: L5 (Auditability)
 *
 * Description: Implements a write-once, timestamped logging service responsible for capturing all high-priority architectural events. 
 * This ensures non-repudiation of critical decisions necessary for GSEP L5 adherence. Data is immediately piped via the Dispersal Tool to SDR and ACM for telemetry aggregation and provenance anchoring.
 */
class AuditEventLoggerKernel {
    #canonicalizer;
    #disperser;

    /**
     * @param {object} dependency_ACM - Provenance anchoring service dependency.
     * @param {object} dependency_SDR - Telemetry aggregation service dependency.
     * @param {object} auditRecordCanonicalizerTool - Utility for creating canonical, hashable audit records.
     * @param {class} MultiTargetAuditDisperserClass - The required class implementation for dispersal.
     */
    constructor(dependency_ACM, dependency_SDR, auditRecordCanonicalizerTool, MultiTargetAuditDisperserClass) {
        this.#setupDependencies(dependency_ACM, dependency_SDR, auditRecordCanonicalizerTool, MultiTargetAuditDisperserClass);
    }

    /**
     * @private
     * Throws a standardized error during synchronous setup.
     * @param {string} message 
     */
    #throwSetupError(message) {
        throw new Error(`[AuditEventLoggerKernel Setup Failure]: ${message}`);
    }

    /**
     * @private
     * Handles all synchronous dependency validation and internal tool initialization.
     */
    #setupDependencies(dependency_ACM, dependency_SDR, auditRecordCanonicalizerTool, MultiTargetAuditDisperserClass) {
        // 1. Validate Canonicalizer
        if (!auditRecordCanonicalizerTool || typeof auditRecordCanonicalizerTool.createCanonicalRecord !== 'function') {
             this.#throwSetupError("AuditRecordCanonicalizer utility must be provided and implement createCanonicalRecord.");
        }
        this.#canonicalizer = auditRecordCanonicalizerTool;

        // 2. Validate Disperser Class and Core Dependencies
        if (!MultiTargetAuditDisperserClass) {
             this.#throwSetupError("MultiTargetAuditDisperserClass must be provided for dispersal logic.");
        }
        if (!dependency_ACM) this.#throwSetupError("Provenance anchoring service (ACM) is required.");
        if (!dependency_SDR) this.#throwSetupError("Telemetry aggregation service (SDR) is required.");
        
        // 3. Define the internal persistence layer placeholder (as per original architecture)
        const localImmutableStore = { 
            save: (id, data) => console.log(`[AEL] Stored Audit Hash ID: ${id}`)
        };

        // 4. Instantiate the Dispersal Tool
        this.#disperser = new MultiTargetAuditDisperserClass(
            dependency_ACM, 
            dependency_SDR, 
            localImmutableStore
        );
    }
    
    /**
     * @private
     * I/O Proxy: Delegates record creation and cryptographic hashing to the canonicalizer.
     */
    #delegateToCanonicalizerCreateRecord(source_acronym, event_type, payload) {
        return this.#canonicalizer.createCanonicalRecord(source_acronym, event_type, payload);
    }

    /**
     * @private
     * I/O Proxy: Delegates the record dispersal to all L5 destinations (ACM, SDR, Store).
     */
    #delegateToDisperserDisperse(audit_hash_id, event_data, source_acronym) {
        this.#disperser.disperse(audit_hash_id, event_data, source_acronym);
    }

    /**
     * Logs a critical system event with immutable metadata.
     * @param {string} source_acronym - The component acronym generating the event (e.g., CIL, MCRA).
     * @param {string} event_type - Classification (e.g., 'Veto', 'ConflictResolved', 'TrustScoreVariance').
     * @param {object} payload - The full state or decision payload.
     * @returns {string} Audit Hash ID.
     */
    logCriticalEvent(source_acronym, event_type, payload) {
        
        // 1. Generate canonical record and Audit Hash ID
        const { record: event_data, auditHashId: audit_hash_id } = 
            this.#delegateToCanonicalizerCreateRecord(source_acronym, event_type, payload);
            
        // 2. Disperse the record
        this.#delegateToDisperserDisperse(audit_hash_id, event_data, source_acronym);

        return audit_hash_id;
    }
}