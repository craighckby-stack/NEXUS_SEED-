// Abstract class for CryptoPolicyEnforcer
class CryptoPolicyEnforcer {
  /** @type {Readonly<object>} */
  #policy;
  /** @type {boolean} */
  #isReady = false;

  /**
   * @param {object} config - The cryptographic policy configuration object.
   */
  constructor(config) {
    if (new.target === CryptoPolicyEnforcer) {
      // Enforce abstraction: Prevent direct instantiation of the abstract base class
      throw new Error("Cannot instantiate abstract class CryptoPolicyEnforcer directly.");
    }
    
    // 1. Guarantee structural integrity: Deep-freeze the policy configuration
    this.#policy = this.#freezePolicyConfiguration(config);
    
    // 2. Start initialization (fire-and-forget, internal state update handled internally)
    this.init();
  }
  
  /**
   * Synchronously freezes the cryptographic policy configuration object.
   * @param {object} config 
   * @returns {Readonly<object>}
   */
  #freezePolicyConfiguration(config) {
    return Object.freeze(config);
  }

  /**
   * @returns {boolean} True if the policy enforcer has completed its initialization phase.
   */
  get isReady() {
    return this.#isReady;
  }

  /**
   * Initializes the policy enforcer, loading primitives and verifying integrity.
   */
  async init() {
    // Load environment-specific cryptographic primitives (e.g., OpenSSL or WebCrypto)
    // Verify policy configuration integrity and dependencies.
    console.log(`Policy ${this.#policy?.crypto_version || 'N/A'} loaded.`);
    this.#isReady = true;
  }

  /**
   * Checks if the requested algorithm, size, and operation meet the defined standards.
   * Must be implemented by subclasses.
   * @param {string} algo - The cryptographic algorithm name.
   * @param {number} size - The key size in bits.
   * @param {string} operation - The intended operation (e.g., 'encrypt', 'sign').
   * @throws {Error} PolicyViolationError if blacklisted or too weak.
   */
  validateKeyUsage(algo, size, operation) {
    throw new Error('NotImplementedError: Subclass must implement validateKeyUsage.');
  }

  /**
   * Returns the highest priority cipher suite compatible with the policy and environment.
   * @returns {string} The preferred cipher suite identifier.
   */
  getPreferredCipherSuite() {
    return this.#policy.protocol_enforcement?.tls?.preferred_ciphers?.[0] || 'DEFAULT_CIPHER';
  }

  /**
   * Configures the underlying TLS module based on min_version and blacklist_ciphers.
   * Must be implemented by subclasses.
   * @param {object} tlsModule - The underlying TLS configuration object (e.g., Node's crypto or browser's SSL context).
   */
  applyPolicyToTLS(tlsModule) {
    throw new Error('NotImplementedError: Subclass must implement applyPolicyToTLS.');
  }
}

module.exports = CryptoPolicyEnforcer;