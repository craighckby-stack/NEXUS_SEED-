/**
 * A standardized, context-aware logging utility, delegated to the CanonicalLogUtility plugin.
 * Replace this with a robust external library (e.g., winston, pino) if system constraints allow, or if the plugin environment is restricted.
 */
export class Logger {
    /**
     * @type {{error: function, warn: function, info: function, debug: function}}
     */
    #delegate;

    /**
     * @param {string} context - The component/service name for logging context.
     */
    constructor(context = 'APP') {
        // Note: In an AGI-Kernel environment, CanonicalLogUtility would be available
        // via injection or a global resolver (e.g., window.AGI_PLUGINS.CanonicalLogUtility).
        // We call the standard plugin execution method.
        if (typeof CanonicalLogUtility !== 'undefined') {
             this.#delegate = CanonicalLogUtility.execute({ context });
        } else {
            // Fallback for environments where plugins are not yet loaded
            const ctx = `[${context}]`;
            this.#delegate = {
                error: (...args) => console.error(`${ctx} ERROR:`, ...args),
                warn: (...args) => console.warn(`${ctx} WARN:`, ...args),
                info: (...args) => console.info(`${ctx} INFO:`, ...args),
                debug: (...args) => console.log(`${ctx} DEBUG:`, ...args)
            };
        }
    }

    error(...args) {
        this.#delegate.error(...args);
    }

    warn(...args) {
        this.#delegate.warn(...args);
    }

    info(...args) {
        this.#delegate.info(...args);
    }

    debug(...args) {
        this.#delegate.debug(...args);
    }
}