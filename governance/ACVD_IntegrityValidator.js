import { SchemaValidator, HashService } from './utilities/services'; 

/**
 * ACVD_IntegrityValidator is responsible for ensuring that an Autonomous Code Versioning Document
 * (ACVD) is valid against its schema, consistent with the system's operational context, and
 * verifiable against the resulting filesystem state (post-change).
 */
class ACVD_IntegrityValidator {
  
  /**
   * @param {object} dependencies 
   * @param {SchemaValidator} dependencies.schemaValidator Instance of a robust schema validation utility.
   * @param {HashService} dependencies.hashService Instance of the hashing utility (must provide calculateSHA256 and hashFile).
   * @param {object} dependencies.acvdSchema The parsed ACVD JSON schema object definition.
   */
  constructor({ schemaValidator, hashService, acvdSchema }) {
    if (!schemaValidator || !hashService || !acvdSchema) {
      throw new Error("ACVD_IntegrityValidator: Missing required dependency injection (schemaValidator, hashService, acvdSchema).");
    }
    this.schemaValidator = schemaValidator;
    this.hashService = hashService;
    this.acvdSchema = acvdSchema;
  }

  /**
   * Validates the ACVD object structure against the predefined schema.
   * @param {object} acvdRecord 
   */
  _validateStructure(acvdRecord) {
    const validationResult = this.schemaValidator.validate(acvdRecord, this.acvdSchema);
    if (!validationResult.valid) {
      const errorDetails = validationResult.errors.map(e => `${e.dataPath || 'Root'} ${e.message}`).join('; ');
      throw new Error(`ACVD Schema violation: ${errorDetails}`);
    }
  }

  /**
   * Ensures the system context hash within the ACVD matches the hash calculated from the provided live context.
   * @param {object} acvdRecord 
   * @param {object} systemContext 
   */
  _validateContextHash(acvdRecord, systemContext) {
    // Note: HashService must ensure deterministic serialization of systemContext.
    const calculatedContextHash = this.hashService.calculateSHA256(systemContext);
    if (calculatedContextHash !== acvdRecord.context_hash) {
      throw new Error(`Context hash mismatch. Calculated: ${calculatedContextHash}. ACVD record integrity compromised or context calculation improperly standardized.`);
    }
  }

  /**
   * Verifies the actual file hashes on the filesystem match the post-change hashes recorded in the ACVD.
   * Runs hash calculations concurrently for efficiency.
   * @param {Array<object>} artifactChanges 
   */
  async _validateArtifactHashes(artifactChanges) {
    const verificationTasks = artifactChanges
      .filter(artifact => artifact.operation !== 'DELETE' && artifact.hash_after)
      .map(async (artifact) => {
        try {
          const currentFileHash = await this.hashService.hashFile(artifact.path);
          if (currentFileHash !== artifact.hash_after) {
            return { path: artifact.path, valid: false, reason: 'Hash mismatch between filesystem and ACVD record' };
          }
          return { valid: true };
        } catch (e) {
          // Indicates a failure to read the file, which is an integrity failure if the ACVD claims the file exists.
          return { path: artifact.path, valid: false, reason: `Filesystem access failure: ${e.message}` };
        }
      });

    const results = await Promise.all(verificationTasks);
    const failedValidations = results.filter(r => r && r.valid === false);

    if (failedValidations.length > 0) {
      const errorDetails = failedValidations.map(f => `[${f.path}]: ${f.reason}`).join(';\n');
      throw new Error(`Artifact integrity validation failed for ${failedValidations.length} artifacts:\n${errorDetails}`);
    }
  }


  /**
   * Executes the full integrity validation process.
   * @param {object} acvdRecord - The ACVD object.
   * @param {object} systemContext - The system's contextual state for hash verification.
   * @returns {Promise<boolean>} True if all checks pass.
   */
  async validate(acvdRecord, systemContext) {
    // 1. Synchronous Schema Validation
    this._validateStructure(acvdRecord);

    // 2. Synchronous Context Hash Verification
    this._validateContextHash(acvdRecord, systemContext);

    // 3. Asynchronous, concurrent Artifact Hash Verification against the filesystem
    await this._validateArtifactHashes(acvdRecord.artifact_changes);
    
    return true; // Integrity passed
  }
}

export default ACVD_IntegrityValidator;