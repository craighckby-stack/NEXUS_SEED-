import { SchemaValidator, HashService } from './utilities/services'; 

/**
 * ACVD_IntegrityValidator is responsible for ensuring that an Autonomous Code Versioning Document
 * (ACVD) is valid against its schema, consistent with the system's operational context, and
 * verifiable against the resulting filesystem state (post-change).
 * 
 * Note: This validator is designed for POST-COMMIT validation, verifying the resulting state 
 * matches the ACVD's recorded 'hash_after' values.
 */
class ACVD_IntegrityValidator {
  #schemaValidator;
  #hashService;
  #acvdSchema;
  #validationRunner;

  /**
   * @param {object} dependencies 
   * @param {SchemaValidator} dependencies.schemaValidator Instance of a robust schema validation utility.
   * @param {HashService} dependencies.hashService Instance of the hashing utility (must provide calculateSHA256 and hashFile).
   * @param {object} dependencies.acvdSchema The parsed ACVD JSON schema object definition.
   * @param {object} dependencies.validationRunner Tool for running structured validation sequences (Must conform to ValidationPipelineRunner interface).
   */
  constructor(dependencies) {
    this.#setupDependencies(dependencies);
  }

  /**
   * Extracts and validates required dependencies.
   * @private
   */
  #setupDependencies({ schemaValidator, hashService, acvdSchema, validationRunner }) {
    if (!schemaValidator || !hashService || !acvdSchema || !validationRunner) {
      throw new Error("ACVD_IntegrityValidator: Missing required dependency injection (schemaValidator, hashService, acvdSchema, validationRunner).");
    }
    this.#schemaValidator = schemaValidator;
    this.#hashService = hashService;
    this.#acvdSchema = acvdSchema;
    this.#validationRunner = validationRunner;
  }

  // --- I/O Proxy Functions ---

  #delegateToSchemaValidation(record, schema) {
    return this.#schemaValidator.validate(record, schema);
  }

  #delegateToHashCalculation(data) {
    return this.#hashService.calculateSHA256(data);
  }

  async #delegateToFileHashCalculation(path) {
    return this.#hashService.hashFile(path);
  }

  async #delegateToValidationRunner(syncTasks, asyncTasks, errorName) {
    return this.#validationRunner.run(syncTasks, asyncTasks, errorName);
  }

  // --- Core Logic Methods ---

  /**
   * Validates the ACVD object structure against the predefined schema.
   * @private
   * @param {object} acvdRecord 
   * @returns {Array<object>} Array of structured error objects, or empty array if valid.
   */
  #validateStructure(acvdRecord): object[] {
    const validationResult = this.#delegateToSchemaValidation(acvdRecord, this.#acvdSchema);
    if (!validationResult.valid) {
      return validationResult.errors.map(e => ({
        type: 'SCHEMA_VIOLATION',
        code: 'ACVD_STRUCT_ERROR',
        path: e.dataPath || 'Root',
        message: e.message,
        detail: `Validation failed at path: ${e.dataPath}`
      }));
    }
    return [];
  }

  /**
   * Ensures the system context hash within the ACVD matches the hash calculated from the provided live context.
   * @private
   * @param {object} acvdRecord 
   * @param {object} systemContext 
   * @returns {Array<object>} Array of structured error objects, or empty array if valid.
   */
  #validateContextHash(acvdRecord, systemContext): object[] {
    // Note: HashService must ensure deterministic serialization of systemContext.
    const calculatedContextHash = this.#delegateToHashCalculation(systemContext);
    if (calculatedContextHash !== acvdRecord.context_hash) {
      return [{
        type: 'CONTEXT_INTEGRITY_FAIL',
        code: 'CONTEXT_HASH_MISMATCH',
        path: null,
        message: 'System context hash recorded in ACVD does not match live system context.',
        detail: `Calculated: ${calculatedContextHash}. Expected ACVD: ${acvdRecord.context_hash}.`
      }];
    }
    return [];
  }

  /**
   * Verifies the actual file hashes on the filesystem match the post-change (hash_after) hashes 
   * recorded in the ACVD for all created or modified artifacts.
   * Runs hash calculations concurrently for efficiency.
   * @private
   * @param {Array<object>} artifactChanges 
   * @returns {Promise<Array<object>>} Promise resolving to an array of structured error objects.
   */
  async #validatePostChangeHashes(artifactChanges): Promise<object[]> {
    // Only check artifacts that should exist and have a recorded hash_after value.
    const targets = artifactChanges.filter(artifact => 
      (artifact.operation === 'CREATE' || artifact.operation === 'UPDATE') && artifact.hash_after
    );
    
    const verificationTasks = targets.map(async (artifact) => {
        const expectedHash = artifact.hash_after;
        
        try {
          const currentFileHash = await this.#delegateToFileHashCalculation(artifact.path);
          
          if (currentFileHash !== expectedHash) {
            return { 
                type: 'ARTIFACT_INTEGRITY_FAIL', 
                code: 'POST_CHANGE_HASH_MISMATCH',
                path: artifact.path,
                operation: artifact.operation,
                message: `Post-change artifact hash mismatch for operation: ${artifact.operation}.`,
                detail: `Filesystem hash: ${currentFileHash}. ACVD Expected hash: ${expectedHash}` 
            };
          }
          return null; // Success
        } catch (e) {
          // Failure to read file indicates a serious integrity issue post-change (e.g., file missing or permission error).
          return { 
            type: 'ARTIFACT_INTEGRITY_FAIL', 
            code: 'FILESYSTEM_ACCESS_ERROR',
            path: artifact.path, 
            operation: artifact.operation,
            message: `Filesystem access failure or artifact state inconsistent post-change.`,
            detail: `Error: ${e.message}`
          };
        }
    });

    const results = await Promise.all(verificationTasks);
    // Filter out successful validations (nulls)
    return results.filter(r => r !== null);
  }


  /**
   * Executes the full integrity validation process.
   * If validation fails, throws a structured ACVDIntegrityError containing all failure details.
   * @param {object} acvdRecord - The ACVD object containing proposed changes and metadata.
   * @param {object} systemContext - The system's contextual state for overall hash verification.
   * @returns {Promise<boolean>} True if all checks pass.
   * @throws {ACVDIntegrityError} Throws if any check fails.
   */
  async validate(acvdRecord, systemContext): Promise<boolean> {
    
    const syncTasks = [
        { 
            id: 'SCHEMA_VALIDATION', 
            fn: () => this.#validateStructure(acvdRecord), 
            critical: true 
        },
        { 
            id: 'CONTEXT_HASH_VERIFICATION', 
            fn: () => this.#validateContextHash(acvdRecord, systemContext), 
            critical: false 
        }
    ];

    const asyncTasks = [
        { 
            id: 'POST_CHANGE_HASH_VERIFICATION', 
            fn: () => this.#validatePostChangeHashes(acvdRecord.artifact_changes) 
        }
    ];

    try {
        await this.#delegateToValidationRunner(syncTasks, asyncTasks, "ACVDIntegrityError");
        return true; 
    } catch (e) {
        // The runner ensures 'e' is the structured composite error.
        throw e;
    }
  }
}