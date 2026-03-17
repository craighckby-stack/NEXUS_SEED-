/**
 * Interface definition for the underlying Canonicalization tool.
 * The core logic for deep key sorting and serialization resides here.
 */
interface CanonicalizerToolKernel {
    canonicalize(data: any): string;
}

/**
 * Interface for cryptographic utility functionality.
 */
interface CryptoUtilityInterfaceKernel {
    calculateHash(data: string, algorithm?: string): string;
}

/**
 * AGI-KERNEL v7.11.3 JsonCanonicalizerKernel
 * Standardizes JSON object serialization and provides integrity hashing
 * by delegating core functions to injected, architectural components.
 * The internal, environment-dependent hash calculation logic has been removed.
 */
class JsonCanonicalizerKernel {
  private readonly canonicalizer: CanonicalizerToolKernel;
  private readonly cryptoUtility: CryptoUtilityInterfaceKernel;
  private readonly DEFAULT_HASH_ALGORITHM = 'sha256';

  /**
   * Initializes the Kernel with required dependencies.
   *
   * @param canonicalizer - The dependency providing the core canonicalization logic.
   * @param cryptoUtility - The dependency providing cryptographic hashing functionality.
   * @throws {Error} If invalid dependencies are provided.
   */
  constructor(
    canonicalizer: CanonicalizerToolKernel,
    cryptoUtility: CryptoUtilityInterfaceKernel
  ) {
    this.#validateDependencies(canonicalizer, cryptoUtility);
    this.canonicalizer = canonicalizer;
    this.cryptoUtility = cryptoUtility;
  }

  /**
   * Validates the required dependencies.
   *
   * @param canonicalizer - The canonicalization utility to validate.
   * @param cryptoUtility - The crypto utility to validate.
   * @throws {Error} If dependencies are invalid.
   */
  #validateDependencies(canonicalizer: CanonicalizerToolKernel, cryptoUtility: CryptoUtilityInterfaceKernel): void {
    if (!canonicalizer || typeof canonicalizer.canonicalize !== 'function') {
        throw new Error("Invalid CanonicalizerToolKernel provided to JsonCanonicalizerKernel.");
    }

    if (!cryptoUtility || typeof cryptoUtility.calculateHash !== 'function') {
        throw new Error("Invalid CryptoUtilityInterfaceKernel provided: Missing 'calculateHash' method.");
    }
  }

  /**
   * Canonicalizes the input data by delegating to the injected utility.
   *
   * @param data - The data structure to canonicalize.
   * @returns The canonical JSON string.
   */
  public canonicalize(data: any): string {
    return this.canonicalizer.canonicalize(data);
  }

  /**
   * Calculates a cryptographic hash of the canonicalized string.
   *
   * @param canonicalString - The canonical string to hash.
   * @param algorithm - The hash algorithm to use (defaults to SHA-256).
   * @returns The hash in hex format.
   */
  public hash(canonicalString: string, algorithm: string = this.DEFAULT_HASH_ALGORITHM): string {
    return this.cryptoUtility.calculateHash(canonicalString, algorithm);
  }
}

export default JsonCanonicalizerKernel;
