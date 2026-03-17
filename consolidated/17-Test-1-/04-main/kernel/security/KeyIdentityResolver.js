/**
 * AGI-KERNEL v7.11.3 - kernel/security/KeyIdentityResolver.js
 * Resolves cryptographic keys or tokens to secure identity objects, utilizing
 * the KeyCachePlugin for high-performance, abstracted memoization (LRU cache).
 */

import { KeyCachePlugin } from "../core/KeyCachePlugin";

/**
 * Represents a basic identity structure (for resolution result).
 * @typedef {Object} IdentityPrincipal
 * @property {string} userId
 * @property {string[]} roles
 * @property {number} issuedAt
 */

class KeyIdentityResolver {
    #backingStore;
    #cache;

    /**
     * @param {Object} backingStore - An object implementing an async lookup(key) method.
     * @param {number} cacheSize - Maximum number of identities to cache (LRU).
     * @param {number} ttl - Time-to-live in milliseconds for cache entries.
     */
    constructor(backingStore, cacheSize = 512, ttl = 300000) {
        this.#ensureValidBackingStore(backingStore);
        this.#backingStore = backingStore;
        // Abstracting caching complexity into the KeyCachePlugin
        this.#cache = this.#initializeCache(cacheSize, ttl);
    }

    // --- I/O Proxy Functions ---

    #throwSetupError(message) {
        // Proxying control flow (error throwing)
        throw new Error(message);
    }

    #ensureValidBackingStore(backingStore) {
        // Proxying setup validation and dependency check
        if (!backingStore || typeof backingStore.lookup !== 'function') {
            this.#throwSetupError("Backing store must implement an async lookup method.");
        }
    }

    #initializeCache(maxSize, ttl) {
        // Proxying external dependency instantiation/setup (KeyCachePlugin)
        return new KeyCachePlugin({ maxSize, ttl });
    }

    #checkCache(key) {
        // Proxying read interaction with the external cache tool
        return this.#cache.get(key);
    }

    async #delegateToBackingStoreLookup(key) {
        // Proxying interaction with the injected external backing store (Async I/O)
        return this.#backingStore.lookup(key);
    }

    #updateCache(key, identity) {
        // Proxying write operation to the external cache tool
        this.#cache.set(key, identity);
    }
    
    #updateCacheNull(key, ttl) {
        // Proxying write operation for null results with specific TTL
        this.#cache.set(key, null, ttl); 
    }

    #delegateToConsoleError(...args) {
        // Proxying system I/O (console logging)
        console.error(...args);
    }
    
    #handleFailedResolution(key, error) {
        // Proxying error handling and logging flow
        const preview = key ? key.substring(0, 10) : '[Unknown]';
        this.#delegateToConsoleError(`Key resolution failed for key: ${preview}...`, error);
        return null;
    }

    #delegateToCacheClear() {
        // Proxying system I/O (cache clear)
        this.#cache.clear();
    }

    // --- Public API ---

    /**
     * Resolves a cryptographic key or token into a secure IdentityPrincipal.
     * Prioritizes cache lookup for maximum efficiency.
     * 
     * @param {string} key - The key, hash, or token to resolve.
     * @returns {Promise<IdentityPrincipal | null>}
     */
    async resolve(key) {
        // 1. Check Cache (O(1))
        const cachedIdentity = this.#checkCache(key);
        if (cachedIdentity !== undefined) {
            return cachedIdentity;
        }

        // 2. Lookup in Backing Store (Async I/O)
        try {
            const identity = await this.#delegateToBackingStoreLookup(key);

            // 3. Cache Result and Return
            if (identity && identity.userId) {
                // Ensure identity structure is valid before caching
                this.#updateCache(key, identity);
                return identity;
            }
            
            // Cache failed resolutions temporarily (optional optimization)
            this.#updateCacheNull(key, 60000); // Cache 'null' results for 1 minute
            return null;

        } catch (error) {
            return this.#handleFailedResolution(key, error);
        }
    }

    /**
     * Clears all entries from the internal cache.
     */
    clearCache() {
        this.#delegateToCacheClear();
    }
}

export { KeyIdentityResolver };