const crypto = require('crypto');
const { Readable } = require('stream');

/**
 * core/utils/Cryptography/IntegrityHasher.js
 *
 * Standardized utility for calculating content integrity hashes 
 * adhering to Sovereign AGI protocol specifications.
 * This service abstracts Node's `crypto` module, supporting both synchronous 
 * buffer/string hashing and asynchronous stream hashing for efficiency.
 */
class IntegrityHasher {
    
    // Static constants derived from system configuration standards (default to SHA-256/utf8)
    static DEFAULT_ALGORITHM = 'sha256';
    static DEFAULT_ENCODING = 'utf8';

    /**
     * @param {string} [algorithm=IntegrityHasher.DEFAULT_ALGORITHM] - The hashing algorithm to use (e.g., 'sha256', 'sha512').
     * @param {string} [encoding=IntegrityHasher.DEFAULT_ENCODING] - Default encoding for string inputs.
     */
    constructor(algorithm = IntegrityHasher.DEFAULT_ALGORITHM, encoding = IntegrityHasher.DEFAULT_ENCODING) {
        this.#initializeConfiguration(algorithm, encoding);
    }

    /**
     * Calculates the hash of the provided content synchronously.
     * 
     * @param {Buffer|string|Uint8Array} content - The content to hash.
     * @returns {string} The hash digest in hex format.
     */
    calculate(content) {
        // Delegates core crypto execution to the I/O proxy
        return this.#delegateToSynchronousHashing(content, this.algorithm, this.encoding);
    }

    /**
     * Calculates the hash of a content stream asynchronously using async iterators.
     * This provides a cleaner syntax than manually handling stream events.
     * 
     * @param {Readable} stream - The readable stream containing the content.
     * @returns {Promise<string>} Resolves with the hash digest in hex format.
     * @throws {Error} If the input is not a Readable stream or if hashing fails.
     */
    async calculateStream(stream) {
        if (!(stream instanceof Readable)) {
            throw new Error("Input must be a Readable stream.");
        }
        
        // Delegates async I/O and crypto execution to the I/O proxy
        return this.#delegateToStreamHashing(stream, this.algorithm);
    }

    /**
     * Static utility method for quick, default SHA-256 hashing.
     * Optimized to avoid class instantiation overhead.
     * 
     * @param {Buffer|string|Uint8Array} content - The content to hash.
     * @returns {string} The hash digest in hex format.
     */
    static defaultHash(content) {
        return IntegrityHasher.#delegateToDefaultSynchronousHashing(content);
    }

    // === Private Setup and Configuration ===

    /**
     * Isolates synchronous initialization and validation logic.
     * (Satisfies Synchronous Setup Extraction goal)
     * @param {string} algorithm 
     * @param {string} encoding 
     */
    #initializeConfiguration(algorithm, encoding) {
        const normalizedAlgorithm = algorithm.toLowerCase();
        
        // Validate algorithm support early for robustness via I/O Proxy
        if (!IntegrityHasher.#delegateToCryptoCheck(normalizedAlgorithm)) {
            throw new Error(`Unsupported hash algorithm: ${algorithm}. Please check Node's supported list.`);
        }

        this.algorithm = normalizedAlgorithm;
        this.encoding = encoding;
    }

    // === Private I/O Proxies ===

    /**
     * I/O Proxy: Delegates to Node's crypto API to check supported hashes.
     * @param {string} algorithm
     * @returns {boolean}
     */
    static #delegateToCryptoCheck(algorithm) {
        // EXTERNAL DEPENDENCY INTERACTION: crypto.getHashes()
        return crypto.getHashes().includes(algorithm);
    }

    /**
     * I/O Proxy: Handles synchronous hash calculation using Node's crypto API.
     * @param {Buffer|string|Uint8Array} content
     * @param {string} algorithm
     * @param {string} encoding
     * @returns {string}
     */
    #delegateToSynchronousHashing(content, algorithm, encoding) {
        // EXTERNAL DEPENDENCY INTERACTION: crypto.createHash, hash.update, hash.digest
        const hash = crypto.createHash(algorithm);

        if (typeof content === 'string') {
            hash.update(content, encoding);
        } else {
            hash.update(content);
        }
        
        return hash.digest('hex');
    }

    /**
     * I/O Proxy: Handles asynchronous stream processing and hash calculation.
     * @param {Readable} stream
     * @param {string} algorithm
     * @returns {Promise<string>}
     */
    async #delegateToStreamHashing(stream, algorithm) {
        // EXTERNAL DEPENDENCY INTERACTION: crypto.createHash, hash.update, async iteration
        const hash = crypto.createHash(algorithm);

        try {
            // Use async iteration to process the stream chunks
            for await (const chunk of stream) {
                hash.update(chunk);
            }
            return hash.digest('hex');
        } catch (e) {
            // Re-throw any stream processing error (e.g., read failure)
            throw e;
        }
    }

    /**
     * Static I/O Proxy: Handles synchronous hash calculation using default settings.
     * @param {Buffer|string|Uint8Array} content
     * @returns {string}
     */
    static #delegateToDefaultSynchronousHashing(content) {
        const algorithm = IntegrityHasher.DEFAULT_ALGORITHM;
        const encoding = IntegrityHasher.DEFAULT_ENCODING;
        
        // EXTERNAL DEPENDENCY INTERACTION: crypto.createHash, hash.update, hash.digest
        const hash = crypto.createHash(algorithm);

        if (typeof content === 'string') {
            hash.update(content, encoding);
        } else {
            hash.update(content);
        }

        return hash.digest('hex');
    }
}

module.exports = IntegrityHasher;