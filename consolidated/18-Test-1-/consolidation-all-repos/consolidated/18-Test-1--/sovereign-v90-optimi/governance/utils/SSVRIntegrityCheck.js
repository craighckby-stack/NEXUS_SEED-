/**
 * SSVRIntegrityCheck.js
 * ----------------------------------------------------
 * Core utility for validating the Sovereign Schema Version Registry (SSVR)
 * during system initialization against physical governance files and digital attestations.
 */

import { CRoTCrypto } from 'core/crypto/CRoT';
import { SystemFiles } from 'core/system/filesystem';
import { CanonicalJson } from 'core/utils/CanonicalJson';
import { ContentIntegrityVerifier } from 'governance/plugins/ContentIntegrityVerifier';

// Custom error class for SSVR verification failures, providing detailed context.
export class SSVRError extends Error {
    constructor(message, details = {}) {
        super(message);
        this.name = 'SSVRError';
        this.details = details;
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, SSVRError);
        }
    }
}

/**
 * Internal Implementation class containing core logic and I/O isolation.
 */
class SSVRIntegrityCheckImpl {

    // Static Policy Path Constant
    static #INTEGRITY_POLICY_PATH = 'governance/config/IntegrityPolicy.json';

    // Static cache for the integrity policy
    static #integrityPolicyCache = null;

    // Dependencies (resolved synchronously)
    #CRoTCrypto;
    #SystemFiles;
    #CanonicalJson;
    #ContentIntegrityVerifier;
    
    // Instance state
    #ssvr;
    #verificationLog = [];

    /**
     * @private
     * Extracts synchronous dependency resolution and initialization logic.
     */
    #setupDependencies() {
        this.#CRoTCrypto = CRoTCrypto;
        this.#SystemFiles = SystemFiles;
        this.#CanonicalJson = CanonicalJson;
        this.#ContentIntegrityVerifier = ContentIntegrityVerifier;
    }

    /**
     * @private
     * I/O Proxy: Throws a structured SSVRError.
     */
    #throwSSVRError(message, details = {}) {
        throw new SSVRError(message, details);
    }

    /**
     * @private
     * I/O Proxy: Validates the SSVR structure during construction.
     */
    #validateInitialSSVR(ssvrContent) {
        if (!ssvrContent || typeof ssvrContent !== 'object' || !ssvrContent.version) {
            this.#throwSSVRError("SSVR Validation Setup Error: Invalid SSVR object provided or missing version.");
        }
    }

    /**
     * @private
     * Records a failed step and triggers immediate fail-fast error.
     */
    #recordAndFail(step, details = {}) {
        const entry = { step, status: 'FAIL', version: this.#ssvr.version, timestamp: Date.now(), ...details };
        this.#verificationLog.push(entry);
        this.#throwSSVRError(`Integrity Check Failed at step [${step}].`, entry);
    }

    /**
     * @private
     * Records a step result in the log. Throws SSVRError if status is 'FAIL'.
     */
    #recordResult(step, status, details = {}) {
        const entry = { step, status, version: this.#ssvr.version, timestamp: Date.now(), ...details };
        this.#verificationLog.push(entry);

        if (status === 'FAIL') {
            this.#recordAndFail(step, details);
        }
    }

    constructor(ssvrContent) {
        this.#setupDependencies();
        this.#validateInitialSSVR(ssvrContent);
        this.#ssvr = ssvrContent;
    }

    get verificationLog() {
        return this.#verificationLog;
    }

    // --- Static Policy Loading Proxies ---

    /**
     * @private
     * I/O Proxy: Delegates file read to SystemFiles.
     */
    static #delegateToSystemFilesRead(path) {
        return SystemFiles.read(path);
    }

    /**
     * @private
     * I/O Proxy: Delegates JSON parsing to CanonicalJson.
     */
    static #delegateToCanonicalJsonParse(content) {
        return CanonicalJson.parse(content);
    }
    
    /**
     * @private
     * I/O Proxy: Handles SSVRError throwing for static context.
     */
    static #throwStaticSSVRError(message, details = {}) {
        throw new SSVRError(message, details);
    }

    /**
     * Helper function to safely load and cache configuration from the governing policy file.
     */
    static async loadIntegrityPolicy() {
        if (SSVRIntegrityCheckImpl.#integrityPolicyCache) {
            return SSVRIntegrityCheckImpl.#integrityPolicyCache;
        }
        
        try {
            const policyContent = await SSVRIntegrityCheckImpl.#delegateToSystemFilesRead(SSVRIntegrityCheckImpl.#INTEGRITY_POLICY_PATH);
            const policyRoot = SSVRIntegrityCheckImpl.#delegateToCanonicalJsonParse(policyContent);
            
            const policy = policyRoot.SSVR;
            
            if (!policy || typeof policy !== 'object') {
                 SSVRIntegrityCheckImpl.#throwStaticSSVRError("Configuration file found but 'SSVR' policy definition is missing or malformed.", { source: SSVRIntegrityCheckImpl.#INTEGRITY_POLICY_PATH });
            }
            
            SSVRIntegrityCheckImpl.#integrityPolicyCache = policy;
            return policy;
        } catch (e) {
            // Re-throw using standardized error wrapper if not already an SSVRError
            if (e instanceof SSVRError) throw e;
            SSVRIntegrityCheckImpl.#throwStaticSSVRError(`Integrity Policy Load Failure: Cannot load policy from ${SSVRIntegrityCheckImpl.#INTEGRITY_POLICY_PATH}.`, { source: SSVRIntegrityCheckImpl.#INTEGRITY_POLICY_PATH, innerError: e.message });
        }
    }

    // --- Instance Proxies ---

    /**
     * @private
     * I/O Proxy: Delegates deterministic stringification.
     */
    #delegateToCanonicalJsonStringify(data) {
        return this.#CanonicalJson.stringify(data);
    }

    /**
     * @private
     * I/O Proxy: Delegates cryptographic hashing.
     */
    async #delegateToCRoTCryptoHash(content, algorithm) {
        return this.#CRoTCrypto.hash(content, algorithm);
    }

    /**
     * @private
     * I/O Proxy: Delegates external integrity verification.
     */
    async #delegateToContentIntegrityVerifier(schemaDef, schemaPath, schemaId) {
        return this.#ContentIntegrityVerifier.verifyFile(schemaDef, schemaPath, schemaId);
    }

    /**
     * @private
     * Generates a cryptographically canonical JSON string of the SSVR content
     * excluding integrity fields for self-hashing preparation.
     */
    #createHashableSSVRContent() {
        // Extract and ignore integrity_hash and potential future metadata fields (prefixed by _)
        const { integrity_hash, _metadata, ...hashableSSVR } = this.#ssvr; 

        return this.#delegateToCanonicalJsonStringify(hashableSSVR);
    }

    /**
     * Step 1: Verify the top-level integrity hash of the SSVR document itself.
     */
    async verifySelfIntegrity(policy) {
      const step = 'SSVR_SELF_HASH';
      
      if (!this.#ssvr.integrity_hash) {
          this.#recordAndFail(step, { reason: 'MissingRequiredHashField' });
      }
      
      const hashAlgorithm = policy.hash_algorithm || 'SHA-256';
      const hashableContent = this.#createHashableSSVRContent();

      try {
          const calculatedHash = await this.#delegateToCRoTCryptoHash(hashableContent, hashAlgorithm);
          
          if (calculatedHash !== this.#ssvr.integrity_hash) {
            const storedPrefix = this.#ssvr.integrity_hash.substring(0, 10);
            const calculatedPrefix = calculatedHash.substring(0, 10);
            this.#recordAndFail(step, { 
              reason: 'HashMismatch', 
              expectedPrefix: storedPrefix, 
              calculatedPrefix: calculatedPrefix,
              algorithm: hashAlgorithm
            });
          }
          
          this.#recordResult(step, 'PASS', { algorithm: hashAlgorithm });
      } catch (e) {
          this.#recordAndFail(step, { reason: 'CryptoProcessingError', error: e.message, algorithm: hashAlgorithm });
      }
    }

    /**
     * Step 2: Verify the hashes of all external schemas referenced in the registry.
     */
    async verifySchemaContentHashes() {
      const step = 'SCHEMA_CONTENT_HASHES';
      const definitions = this.#ssvr.schema_definitions;
      
      if (!Array.isArray(definitions) || definitions.length === 0) {
          // Only fail if expected structures are missing in a high-integrity registry. 
          if (this.#ssvr.integrity_level !== 'T0_Minimal') { 
               this.#recordResult(step, 'PASS', { info: 'No schemas defined/checked.' });
               return;
          }
      }
      
      // Delegate verification using the ContentIntegrityVerifier plugin
      const verifications = definitions.map(schemaDef => {
        const schemaId = schemaDef.schema_id;
        const schemaPath = `governance/schema/${schemaId}.json`;
        
        return this.#delegateToContentIntegrityVerifier(schemaDef, schemaPath, schemaId);
      });
      
      const results = await Promise.all(verifications);

      const failures = results.filter(r => !r.verified);
      
      if (failures.length > 0) {
        const failureContext = failures.map(f => ({ id: f.identifier, version: f.version, reason: f.error }));
        this.#recordAndFail(step, { 
            total_schemas: definitions.length, 
            failures: failures.length,
            context: failureContext 
        });
      }

      this.#recordResult(step, 'PASS', { total_schemas: definitions.length });
    }

    /**
     * Step 3: Verify that required multi-signatures (attestations) are present
     * and meet version requirements defined by the loaded policy.
     */
    async verifyAttestationsPresence(policy) {
      const step = 'ATTESTATION_POLICY_CHECK';
      const requiredSigners = policy.required_attestations || [];
      const ssvrVersion = this.#ssvr.version;
      const attestationLog = this.#ssvr.attestation_log || [];
      
      if (requiredSigners.length === 0) {
          this.#recordResult(step, 'PASS', { info: 'No attestations required by policy.' });
          return;
      }
      
      // Identify signers who have attested to *this* specific SSVR version
      const presentSigners = new Set(
          attestationLog
              .filter(a => a.signed_version === ssvrVersion) 
              .map(a => a.signer_id)
      );
      
      const missingSigners = requiredSigners.filter(requiredId => !presentSigners.has(requiredId));
      
      if (missingSigners.length > 0) {
          this.#recordAndFail(step, { 
              reason: 'MissingRequiredAttestations', 
              missing: missingSigners,
              required: requiredSigners.length
          });
      }

      this.#recordResult(step, 'PASS', { 
        found: requiredSigners.length - missingSigners.length,
        required: requiredSigners.length
      });
    }
}

/**
 * SSVRIntegrityCheck handles the verification lifecycle for a single SSVR document.
 * This is the public interface wrapper.
 */
export class SSVRIntegrityCheck {
    #impl;

    constructor(ssvrContent) {
        // Delegate instantiation to the implementation class
        this.#impl = new SSVRIntegrityCheckImpl(ssvrContent);
    }

    get verificationLog() {
        return this.#impl.verificationLog;
    }

    /**
     * Helper function to safely load and cache configuration from the governing policy file.
     */
    static async loadIntegrityPolicy() {
        return SSVRIntegrityCheckImpl.loadIntegrityPolicy();
    }

    /**
     * Step 1: Verify the top-level integrity hash of the SSVR document itself.
     */
    async verifySelfIntegrity(policy) {
        return this.#impl.verifySelfIntegrity(policy);
    }

    /**
     * Step 2: Verify the hashes of all external schemas referenced in the registry.
     */
    async verifySchemaContentHashes() {
        return this.#impl.verifySchemaContentHashes();
    }

    /**
     * Step 3: Verify that required multi-signatures (attestations) are present
     * and meet version requirements defined by the loaded policy.
     */
    async verifyAttestationsPresence(policy) {
        return this.#impl.verifyAttestationsPresence(policy);
    }
}