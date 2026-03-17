const fs = require('fs');
const path = require('path');

// --- GAX III Standard Constants & Definitions ---
const G0_HASH_LENGTH = 64; // SHA-256 output length (hex string)
const ARTIFACT_MANIFEST_DEFAULT_PATH = 'protocol/artifact_manifest.json';

// --- Custom Errors for Integrity Halts ---
class GovernanceError extends Error {
    constructor(code, message, type = 'INTEGRITY') {
        super(`[${type} HALT | ${code}]: ${message}`);
        this.name = 'GovernanceError';
        this.code = code;
    }
}

class ManifestLoadError extends GovernanceError {
    // P-M01: Manifest Integrity/Availability Failure
    constructor(manifestPath, reason) {
        super("P-M01", `Failed to load or parse manifest at ${manifestPath}. Reason: ${reason}`, 'CRITICAL LOAD');
    }
}

class AttestationMismatchError extends GovernanceError {
    // P-M02: Configuration Drift Violation Trigger
    constructor(artifactPath, expectedHash, currentHash) {
        const expectedSnippet = expectedHash.substring(0, 8);
        const currentSnippet = currentHash.substring(0, 8);
        super("P-M02", `Hash mismatch for ${artifactPath}. Expected ${expectedSnippet}... Got ${currentSnippet}...`, 'INTEGRITY DRIFT');
        this.artifactPath = artifactPath;
    }
}

class ManifestSaveError extends GovernanceError {
    // P-M03: Persistence Failure
    constructor(reason) {
        super("P-M03", `Cannot write manifest: ${reason}`, 'PERSISTENCE');
    }
}

/**
 * Governance Artifacts Registrar (GAR)
 * Manages and validates G0 Seals (initial hash-locks) for configuration artifacts,
 * enforcing GAX III standards. Utilizes synchronous I/O for guaranteed fail-fast initialization.
 */
class GovernanceArtifactsRegistrar {
  
  /** @type {{validate: (hash: string, expectedLength: number, identifier: string) => void}} */
  hashValidator;

  /**
   * @param {string} [manifestPath] Path to the sealed G0 manifest file.
   * @param {any} [hashValidator] Injected HashLengthValidator tool instance.
   */
  constructor(manifestPath = ARTIFACT_MANIFEST_DEFAULT_PATH, hashValidator = global.AGI_KERNEL?.getPlugin('HashLengthValidator')) {
    this.manifestPath = path.resolve(manifestPath);
    this.G0_HASH_LENGTH = G0_HASH_LENGTH; // Expose constant for consistency checks
    
    if (!hashValidator) {
        console.warn("[GAR WARNING] HashLengthValidator plugin not available. Falling back to internal checks.");
        // Fallback for environments without AGI_KERNEL (e.g., pure Node testing)
        this.hashValidator = {
             validate: (hash, expectedLength, identifier) => {
                if (hash.length !== expectedLength) {
                    throw new Error(`[HASH_LENGTH_MISMATCH] Invalid hash length for ${identifier}. Expected ${expectedLength}, got ${hash.length}.`);
                }
            }
        }
    } else {
        this.hashValidator = hashValidator;
    }

    this.sealedManifest = this._syncLoadManifest();
    
    // Use an internal method for controlled logging
    this._log(`Loaded immutable manifest from ${this.manifestPath} (${Object.keys(this.sealedManifest).length} artifacts sealed).`, 'INFO');
  }
  
  /**
   * Internal logging utility (Placeholder for dedicated logger integration).
   * @param {string} message 
   * @param {string} level 
   * @param {Error} [error]
   * @private
   */
  _log(message, level = 'INFO', error = null) {
      const prefix = `[GAR v94.1:${level}]`;
      if (level === 'ERROR' || level === 'CRITICAL') {
          console.error(prefix, message, error || '');
      } else if (level === 'WARN') {
          console.warn(prefix, message);
      } else {
          console.log(prefix, message);
      }
  }

  /**
   * Synchronous loading of the SEALED artifact manifest (Fail-fast principle).
   * Throws if file integrity is compromised or unreadable (P-M01).
   * @returns {object} The parsed manifest data.
   * @private
   */
  _syncLoadManifest() {
    try {
      const data = fs.readFileSync(this.manifestPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      this._log(`Critical failure loading G0 Manifest: ${error.message}`, 'CRITICAL');
      throw new ManifestLoadError(this.manifestPath, error.message);
    }
  }
  
  /**
   * Writes the current manifest state back to the physical file synchronously.
   * Restricted primarily to the G0 Sealing Phase.
   * @private
   */
  _syncSaveManifest() {
     try {
        fs.writeFileSync(this.manifestPath, JSON.stringify(this.sealedManifest, null, 2), 'utf8');
        this._log(`Manifest successfully updated and persisted to ${path.basename(this.manifestPath)}`, 'PERSIST');
     } catch (error) {
        this._log(`Failed to persist G0 Manifest. Review required.`, 'ERROR', error);
        throw new ManifestSaveError(error.message);
     }
  }

  /**
   * Registers a new G0 Seal hash during system sealing (G0 Phase).
   * Persists the change synchronously.
   * @param {string} artifactPath Relative path to the artifact.
   * @param {string} g0Hash The SHA-256 hash (64 hex characters).
   * @param {string} sourceUtility Utility/Subsystem that performed the sealing.
   */
  registerG0Seal(artifactPath, g0Hash, sourceUtility) {
    // === UTILIZING PLUGIN: HashLengthValidator ===
    try {
        this.hashValidator.validate(g0Hash, this.G0_HASH_LENGTH, artifactPath);
    } catch (e) {
        // Original code threw a standard Error on bad length
        throw new Error(e.message);
    }
    
    if (this.sealedManifest[artifactPath]) {
        this._log(`Attempted to re-register existing G0 Seal for ${artifactPath}. Overriding.`, 'WARN');
    }

    this.sealedManifest[artifactPath] = { 
        g0_hash: g0Hash, 
        sealed_by: sourceUtility, 
        timestamp: new Date().toISOString() 
    };
    
    this._syncSaveManifest();
  }

  /**
   * Performs active attestation against the runtime state.
   * @param {string} artifactPath Relative path to the artifact being attested.
   * @param {string} currentHash The calculated current hash of the artifact content.
   * @returns {boolean} True if the attestation passes.
   * @throws {AttestationMismatchError | GovernanceError} If integrity check fails.
   */
  attestG0Seal(artifactPath, currentHash) {
    // === UTILIZING PLUGIN: HashLengthValidator ===
    try {
        this.hashValidator.validate(currentHash, this.G0_HASH_LENGTH, artifactPath);
    } catch (e) {
       // Original code threw GovernanceError E-GAX-H01
       throw new GovernanceError("E-GAX-H01", `Invalid supplied hash length for attestation of ${artifactPath}. Details: ${e.message}`, 'VALIDATION');
    }

    const expected = this.sealedManifest[artifactPath];
    
    if (!expected) {
      // Unregistered critical artifact access attempt (E-GAX-U01)
      throw new GovernanceError("E-GAX-U01", `Artifact ${artifactPath} not found in G0 Seal Manifest.`, 'UNREGISTERED');
    }
    
    const expectedHash = expected.g0_hash;

    if (currentHash !== expectedHash) {
      this._log(`Mismatch detected for ${artifactPath}. Integrity Halt Triggered.`, 'ERROR');
      throw new AttestationMismatchError(artifactPath, expectedHash, currentHash);
    }
    
    return true; // Attestation Success
  }
  
  /**
   * Retrieve the sealed hash for a given artifact.
   * @param {string} artifactPath 
   * @returns {string | null} The expected hash or null if not registered.
   */
  getSealedHash(artifactPath) {
    const artifact = this.sealedManifest[artifactPath];
    return artifact ? artifact.g0_hash : null;
  }
  
  /**
   * Retrieve the full sealing record for a given artifact.
   * @param {string} artifactPath 
   * @returns {object | null} The full record or null if not registered.
   */
  getSealingRecord(artifactPath) {
      return this.sealedManifest[artifactPath] || null;
  }
}

module.exports = {
    GovernanceArtifactsRegistrar,
    // Export custom errors for external programmatic handling
    GovernanceError,
    ManifestLoadError,
    AttestationMismatchError,
    ManifestSaveError,
};