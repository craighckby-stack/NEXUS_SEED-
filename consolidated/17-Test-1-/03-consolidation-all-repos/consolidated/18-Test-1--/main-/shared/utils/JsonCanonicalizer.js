/**
 * Interface definition for the underlying Canonicalization tool.
 * The core logic for deep key sorting and serialization resides here.
 */
interface CanonicalizerToolKernel {
    canonicalize(data: any): string;
}

/**
 * AGI-KERNEL v7.11.3 JsonCanonicalizerKernel
 * Standardizes JSON object serialization and provides integrity hashing 
 * by delegating core functions to injected, architectural components.
 * The internal, environment-dependent hash calculation logic has been removed.
 */
class JsonCanonicalizerKernel {

  private canonicalizer: CanonicalizerToolKernel;
  private cryptoUtility: CryptoUtilityInterfaceKernel;

  /**
   * Initializes the Kernel with required dependencies.
   * 
   * @param canonicalizer The dependency providing the core canonicalization logic.
   * @param cryptoUtility The dependency providing cryptographic hashing functionality.
   */
  constructor(
    canonicalizer: CanonicalizerToolKernel,
    cryptoUtility: CryptoUtilityInterfaceKernel
  ) {
    this.#setupDependencies(canonicalizer, cryptoUtility);
  }

  /**
   * Validates and sets up all required dependencies synchronously.
   * Ensures the kernel is ready for operation upon construction completion.
   */
  #setupDependencies(canonicalizer: CanonicalizerToolKernel, cryptoUtility: CryptoUtilityInterfaceKernel): void {
    if (!canonicalizer || typeof canonicalizer.canonicalize !== 'function') {
        throw new Error("Invalid CanonicalizerToolKernel provided to JsonCanonicalizerKernel.");
    }
    // Assuming CryptoUtilityInterfaceKernel exposes calculateHash (verified via strategic ledger)
    if (!cryptoUtility || typeof cryptoUtility.calculateHash !== 'function') {
        throw new Error("Invalid CryptoUtilityInterfaceKernel provided: Missing 'calculateHash' method.");
    }
    this.canonicalizer = canonicalizer;
    this.cryptoUtility = cryptoUtility;
  }

  /**
   * Delegates the core canonicalization logic to the injected utility.
   */
  private #delegateToCanonicalizerCanonicalize(data: any): string {
    return this.canonicalizer.canonicalize(data);
  }

  /**
   * Delegates the cryptographic hashing task to the injected utility,
   * enforcing architectural separation from environment-specific crypto modules.
   */
  private #delegateToHashingUtilityHash(canonicalString: string): string {
    // Defaulting to SHA-256 for integrity assurance contexts
    return this.cryptoUtility.calculateHash(canonicalString, 'sha256');
  }

  /**
   * Deeply sorts object keys alphabetically and stringifies the result.
   * 
   * @param {any} data - The data structure to canonicalize.
   * @returns {string} The canonical JSON string.
   */
  public canonicalize(data: any): string {
    return this.#delegateToCanonicalizerCanonicalize(data);
  }

  /**
   * Calculates a cryptographic hash (SHA-256) of the canonicalized string.
   * 
   * @param {string} canonicalString - Output of canonicalize().
   * @returns {string} SHA-256 hash in hex format.
   */
  public hash(canonicalString: string): string {
    return this.#delegateToHashingUtilityHash(canonicalString);
  }
}

module.exports = JsonCanonicalizerKernel;