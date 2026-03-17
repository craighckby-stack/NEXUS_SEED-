import { ContextStore } from "@plugins/ContextStore";

/**
 * CTG_ContextEngine: Manages compliance context, delegating core storage
 * and expiration handling to the reusable ContextStore plugin.
 * Contains specific business logic for governance decisions.
 */
class CTG_ContextEngine {
    #contextStore;

    constructor() {
        this.#setupDependencies();
    }

    /**
     * Extracts synchronous dependency resolution and initialization.
     */
    #setupDependencies() {
        // Delegate all timed storage management to the ContextStore plugin
        this.#contextStore = this.#delegateToStoreInstantiation();
        this.#logInfo("CTG Context Engine Initialized.");
    }

    // --- I/O Proxy Functions ---

    /** Rigorously isolates external dependency instantiation. */
    #delegateToStoreInstantiation() {
        return new ContextStore();
    }

    /** Isolates interaction with external console logging. */
    #logInfo(message) {
        console.log(message);
    }

    /** Isolates interaction with ContextStore#set. */
    #delegateToStoreSet(key, value, ttl) {
        this.#contextStore.set(key, value, ttl);
    }

    /** Isolates interaction with ContextStore#getAll. */
    #delegateToStoreGetAll() {
        return this.#contextStore.getAll();
    }

    /** Isolates interaction with ContextStore#get. */
    #delegateToStoreGet(key) {
        return this.#contextStore.get(key);
    }

    // --- Public API ---

    /**
     * Registers a context item with optional expiration.
     * @param {string} key
     * @param {*} value
     * @param {number} [ttl] - Time to live in seconds (default 3600).
     */
    registerContext(key, value, ttl) {
        this.#delegateToStoreSet(key, value, ttl);
    }

    /**
     * Retrieves the current context, filtering out expired items.
     * @returns {Object}
     */
    getCurrentContext() {
        return this.#delegateToStoreGetAll();
    }

    /**
     * Retrieves a specific value if available and not expired.
     * @param {string} key
     * @returns {*} or undefined
     */
    getContextValue(key) {
        return this.#delegateToStoreGet(key);
    }

    /**
     * Governance Logic: Determines if the current context indicates a high-risk session.
     * This specific business logic remains within the CTG component.
     */
    isHighRiskSession() {
        const context = this.getCurrentContext();
        // Example Rule: High Risk if unauthorized system access attempts are detected
        return context.failedLogins > 5 || (context.userRole === 'Admin' && context.geoMismatch === true);
    }
}

export default CTG_ContextEngine;