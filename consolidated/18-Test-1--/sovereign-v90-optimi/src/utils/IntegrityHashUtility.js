/**
 * @typedef {Object} IntegrityHashingAndIterationService
 * @property {(data: string | Buffer) => Promise<string>} calculateSha256 Calculates the SHA256 hash.
 * @property {(data: string | Buffer, depth?: number, maxDepth?: number) => Promise<string>} calculateIterativeSha256 Calculates a recursive SHA256 hash.
 */

class IntegrityHashUtility {
  /**
   * @private
   * @type {IntegrityHashingAndIterationService}
   */
  #hasher;

  /**
   * @param {{ IntegrityHashingAndIterationService: IntegrityHashingAndIterationService }} plugins
   */
  constructor(plugins) {
    // Dependency injection of the reusable hashing tool
    this.#hasher = plugins.IntegrityHashingAndIterationService;
    if (!this.#hasher) {
        // Note: In production, we might throw an error if this critical dependency is missing.
        console.error("IntegrityHashUtility initialized without IntegrityHashingAndIterationService.");
    }
  }

  /**
   * Calculates the SHA256 hash of the input data using the delegated plugin.
   * @param {string | Buffer} data The data to hash.
   * @returns {Promise<string>} The hexadecimal hash digest.
   */
  async calculateHash(data) {
    if (!this.#hasher) throw new Error("Hasher service unavailable.");
    return this.#hasher.calculateSha256(data);
  }

  /**
   * Calculates a recursive SHA256 hash, hashing the result repeatedly up to maxDepth.
   * @param {string | Buffer} data The initial data.
   * @param {number} [depth=0] The current recursion depth.
   * @param {number} [maxDepth=5] The maximum depth of iteration.
   * @returns {Promise<string>} The final iterative hash digest.
   */
  async calculateRecursiveHash(data, depth = 0, maxDepth = 5) {
    if (!this.#hasher) throw new Error("Hasher service unavailable.");
    return this.#hasher.calculateIterativeSha256(data, depth, maxDepth);
  }
}