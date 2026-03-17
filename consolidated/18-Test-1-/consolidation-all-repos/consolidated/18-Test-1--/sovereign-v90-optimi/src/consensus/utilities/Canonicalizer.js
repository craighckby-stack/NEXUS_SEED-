/**
 * CanonicalizerKernel
 * Utility for ensuring deterministic state serialization and secure hashing, 
 * strictly utilizing injected kernel dependencies.
 */
class CanonicalizerKernel {
    #canonicalPayloadGenerator;
    #secureHasher;

    /**
     * @param {ICanonicalPayloadGeneratorToolKernel} canonicalPayloadGenerator - Tool for deterministic serialization.
     * @param {ICryptoUtilityInterfaceKernel} secureHasher - Tool for secure cryptographic hashing.
     */
    constructor(canonicalPayloadGenerator, secureHasher) {
        // Rigorously enforce Dependency Injection
        if (!canonicalPayloadGenerator || typeof canonicalPayloadGenerator.generate !== 'function') {
            throw new Error("CanonicalizerKernel requires an initialized ICanonicalPayloadGeneratorToolKernel.");
        }
        if (!secureHasher || typeof secureHasher.hash !== 'function') {
            throw new Error("CanonicalizerKernel requires an initialized ICryptoUtilityInterfaceKernel (SecureHasher).");
        }

        this.#canonicalPayloadGenerator = canonicalPayloadGenerator;
        this.#secureHasher = secureHasher;
        
        // Isolation of synchronous initialization logic
        this.#setupDependencies();
    }
    
    /**
     * Private method to encapsulate initialization logic, maintaining architectural consistency.
     */
    #setupDependencies() {
        // No complex logic required, dependencies are assigned directly in the constructor.
    }

    /**
     * Converts a complex object into a deterministically ordered JSON string 
     * suitable for hashing/signing, utilizing the injected tool.
     * 
     * @param {unknown} data 
     * @returns {string} Canonical JSON string.
     */
    canonicalize(data) {
        return this.#canonicalPayloadGenerator.generate(data);
    }

    /**
     * Calculates a secure cryptographic hash of the canonical data using the injected tool.
     * 
     * @param {string} canonicalData - Data obtained from canonicalize().
     * @param {string} [algorithm='sha256'] - Hashing algorithm.
     * @returns {string} Hexadecimal hash digest.
     */
    hash(canonicalData, algorithm = 'sha256') {
        if (typeof canonicalData !== 'string') {
             throw new Error("Input to hash must be a canonical string.");
        }
        // Delegate hashing logic to the dedicated injected tool
        return this.#secureHasher.hash(canonicalData, algorithm);
    }
}

module.exports = CanonicalizerKernel;