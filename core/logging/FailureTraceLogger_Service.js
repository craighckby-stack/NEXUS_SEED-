/**
 * Sovereign AGI v94.1 Failure Trace Logger Service (FTLS)
 * Handles cryptographic certification and immutable storage connection for FTLs.
 * Requires initialized Signer, Storage, and Telemetry providers for reliable operation.
 * Utilizes canonical JSON serialization for cryptographic integrity.
 */
const FTL_SCHEMA_ID = 'FailureTraceLog_v1';

class FailureTraceLogger_Service {
  /**
   * Initializes the FTL Service with explicit dependencies.
   * @param {Object} dependencies
   * @param {Object} dependencies.config - FTL configuration settings.
   * @param {Object} dependencies.signer - Cryptographic signing implementation (must have .sign(data)).
   * @param {Object} dependencies.storage - Immutable append-only storage implementation (must have async .append(record)).
   * @param {Object} dependencies.telemetryService - Centralized operational logging and auditing service.
   * @param {Object} [dependencies.validator] - Optional SchemaValidator utility.
   * @param {Object} [dependencies.jsonCanonicalizer] - Optional Utility for canonical JSON serialization (HIGHLY RECOMMENDED).
   */
  constructor({ config, signer, storage, telemetryService, validator, jsonCanonicalizer }) {
    if (!config || !signer || !storage || !telemetryService) {
      // Use a distinct error type if available, otherwise rely on robust string description
      throw new Error("FTL_INIT_CRITICAL: Missing required core dependencies (config, signer, storage, telemetryService).");
    }
    
    this.config = config.failure_trace_log_config || {};
    this.signer = signer;
    this.storage = storage;
    this.telemetryService = telemetryService;
    this.validator = validator;
    this.jsonCanonicalizer = jsonCanonicalizer;

    if (!this.jsonCanonicalizer) {
        // Log a warning if the Canonicalizer is missing, as it compromises cryptographic best practices
        this.telemetryService.logWarning({
            service: 'FTLS',
            message: 'JsonCanonicalizer not provided. Falling back to JSON.stringify for signing input, risking canonicalization issues.',
            code: 'CANONICAL_FAILBACK'
        });
    }
  }

  /**
   * Ensures the failure trace data adheres to the required schema.
   * @param {Object} data - The FTL payload.
   * @throws {Error} if validation fails.
   */
  validateSchema(data) {
    if (typeof data !== 'object' || data === null) {
        throw new Error("FTL_VALIDATION_ERROR: Input data must be a non-null object.");
    }

    if (this.validator) {
        // High-Intelligence Path: Utilize centralized schema definition
        const validationResult = this.validator.validate(FTL_SCHEMA_ID, data);
        if (!validationResult.isValid) {
             throw new Error(`FTL_SCHEMA_ERROR: Utility Validation Failed: ${validationResult.errors.join('; ')}`);
        }
        return;
    }

    // Fallback Path: Simple check for critical fields
    const required = this.config.schema_required_fields || ['timestamp', 'component', 'trace_id'];
    const missing = required.filter(field => data[field] === undefined || data[field] === null);

    if (missing.length > 0) {
        throw new Error(`FTL_SCHEMA_FALLBACK_ERROR: Missing required fields: [${missing.join(', ')}]`);
    }
  }

  /**
   * Generates a canonical string representation of the data for signing.
   * If a JsonCanonicalizer is available, it is used. Otherwise, standard JSON stringify is used (with caveats).
   * @param {Object} data - The data object to serialize.
   * @returns {string} The canonicalized string representation.
   */
  _getCanonicalDataString(data) {
      if (this.jsonCanonicalizer) {
          return this.jsonCanonicalizer.canonicalize(data);
      }
      // WARNING: JSON.stringify does not guarantee key order, which is critical for crypto integrity.
      return JSON.stringify(data);
  }

  /**
   * Certifies the failure trace data cryptographically and commits it to immutable storage.
   * @param {Object} ftl_data - The raw failure trace payload. Must be validated first.
   * @returns {Promise<string>} The storage confirmation ID or reference.
   */
  async certifyAndLog(ftl_data) {
    let storage_reference = 'N/A';
    
    try {
        // 1. Validation Check
        this.validateSchema(ftl_data); 

        // 2. Canonicalization for Cryptographic Integrity
        const canonical_data_string = this._getCanonicalDataString(ftl_data);
        
        // 3. Cryptographic Assertion (Signing)
        const signature = this.signer.sign(canonical_data_string);

        // 4. Construct Final Certified Record (Immutable Log Entry)
        const certified_record = {
            payload: ftl_data, // Original payload (for quick lookup)
            signature_metadata: {
                algorithm: this.signer.algorithm || 'UNKNOWN',
                key_id: (this.signer.getPublicKeyId && this.signer.getPublicKeyId()) || 'FTL_DEFAULT_KEY',
                canonical_source_hash: this.jsonCanonicalizer ? this.jsonCanonicalizer.hash(canonical_data_string) : undefined,
                signed_data: signature,
                timestamp_ftls: Date.now()
            }
        };
        
        // 5. Immutable Append Operation
        storage_reference = await this.storage.append(certified_record);

        // 6. Audit Trail Logging 
        this.telemetryService.logAudit({
            level: 'SUCCESS',
            service: 'FTLS',
            operation: 'FTL_CERTIFIED',
            message: 'Failure Trace Log Certified and Committed.',
            trace_id: ftl_data.trace_id,
            record_ref: storage_reference
        });

        return storage_reference;

    } catch (error) {
        const error_id = `CRIT_LOG_FAIL_${Date.now()}`;
        
        // Log the failure via Telemetry, providing maximal context.
        this.telemetryService.logError({
            service: 'FTLS',
            error_type: 'FTL_Certification_Path_Failure',
            error_id: error_id,
            details: error.message,
            input_context: ftl_data ? ftl_data.trace_id : 'NO_TRACE_ID',
            storage_ref: storage_reference
        });
        
        // Re-wrap and rethrow to signal catastrophic logging path failure
        throw new Error(`[${error_id}] FTL Critical Failure: Logging Path Disabled. Original error: ${error.message}`);
    }
  }
}

module.exports = FailureTraceLogger_Service;
